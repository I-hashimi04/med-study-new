from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import sqlite3
import hashlib
import secrets
import json
import logging
from datetime import datetime, timedelta
import os

# Import routers
from generate_tutor_questions import router as tutor_router
# from upload_material import router as upload_router  # Disabled for now due to multipart dependency
from review_material import router as review_router

app = FastAPI(title="Medical Study Hub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database setup
DB_PATH = "../data/med-study.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema"""
    conn = get_db()
    with open("../data/schema.sql", "r") as f:
        conn.executescript(f.read())
    conn.close()

# Initialize database on startup
init_db()

# JWT token simulation (simplified without python-jose)
SECRET_KEY = "med-study-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire.timestamp()})
    # Simplified token - just base64 encode the data
    import base64
    token_data = json.dumps(to_encode)
    encoded = base64.b64encode(token_data.encode()).decode()
    return encoded

def verify_token(token: str):
    try:
        import base64
        decoded = base64.b64decode(token.encode()).decode()
        data = json.loads(decoded)
        if data.get("exp", 0) < datetime.utcnow().timestamp():
            return None
        return data
    except:
        return None

def hash_password(password: str) -> str:
    """Hash password using SHA256 (simplified)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return hash_password(plain_password) == hashed_password

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"id": user_id, "username": payload.get("username")}

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Ensure current user is admin"""
    conn = get_db()
    user = conn.execute("SELECT is_admin FROM users WHERE id = ?", (current_user["id"],)).fetchone()
    conn.close()
    
    if not user or not user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class FeedbackCreate(BaseModel):
    subject: str
    content: str
    question_id: Optional[int] = None
    rating: Optional[int] = None

class FeedbackResponse(BaseModel):
    admin_response: str

class QuestionAttempt(BaseModel):
    question_id: int
    user_answer: str
    is_correct: bool

# Include routers
app.include_router(tutor_router, prefix="/api")
# app.include_router(upload_router, prefix="/api")  # Disabled for now
app.include_router(review_router, prefix="/api")

@app.get("/")
def read_root():
    return {"msg": "Medical Student Study Hub API running"}

@app.post("/api/register", response_model=Token)
async def register(user: UserCreate):
    """Register a new user"""
    conn = get_db()
    
    # Check if user already exists
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?", 
        (user.username, user.email)
    ).fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user.password)
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (user.username, user.email, hashed_password)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id), "username": user.username}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin):
    """Login user"""
    conn = get_db()
    db_user = conn.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        (user.username,)
    ).fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user["id"]), "username": db_user["username"]}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    conn = get_db()
    user = conn.execute(
        "SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?",
        (current_user["id"],)
    ).fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    """Submit feedback"""
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO feedback (user_id, question_id, subject, content, rating) 
           VALUES (?, ?, ?, ?, ?)""",
        (current_user["id"], feedback.question_id, feedback.subject, feedback.content, feedback.rating)
    )
    feedback_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": feedback_id, "message": "Feedback submitted successfully"}

@app.get("/api/feedback")
async def get_feedback(current_user: dict = Depends(get_current_user)):
    """Get user's feedback"""
    conn = get_db()
    feedback = conn.execute(
        """SELECT f.*, u.username FROM feedback f 
           JOIN users u ON f.user_id = u.id 
           WHERE f.user_id = ? ORDER BY f.created_at DESC""",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    
    return [dict(row) for row in feedback]

@app.post("/api/questions/{question_id}/attempt")
async def record_attempt(question_id: int, attempt: QuestionAttempt, current_user: dict = Depends(get_current_user)):
    """Record question attempt and update progress"""
    conn = get_db()
    
    # Get or create progress record
    progress = conn.execute(
        "SELECT * FROM user_progress WHERE user_id = ? AND question_id = ?",
        (current_user["id"], question_id)
    ).fetchone()
    
    if progress:
        # Update existing progress
        new_attempts = progress["attempts"] + 1
        new_correct = progress["correct_attempts"] + (1 if attempt.is_correct else 0)
        new_mastery = new_correct / new_attempts if new_attempts > 0 else 0
        
        conn.execute(
            """UPDATE user_progress 
               SET attempts = ?, correct_attempts = ?, last_attempted = ?, mastery_level = ?
               WHERE user_id = ? AND question_id = ?""",
            (new_attempts, new_correct, datetime.utcnow().isoformat(), new_mastery, current_user["id"], question_id)
        )
    else:
        # Create new progress record
        mastery = 1.0 if attempt.is_correct else 0.0
        conn.execute(
            """INSERT INTO user_progress (user_id, question_id, attempts, correct_attempts, mastery_level)
               VALUES (?, ?, 1, ?, ?)""",
            (current_user["id"], question_id, 1 if attempt.is_correct else 0, mastery)
        )
    
    conn.commit()
    conn.close()
    
    return {"message": "Attempt recorded successfully"}

@app.get("/api/progress")
async def get_user_progress(current_user: dict = Depends(get_current_user)):
    """Get user's learning progress"""
    conn = get_db()
    progress = conn.execute(
        """SELECT up.*, q.stem, q.difficulty, q.tags FROM user_progress up
           JOIN questions q ON up.question_id = q.id
           WHERE up.user_id = ? ORDER BY up.last_attempted DESC""",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    
    return [dict(row) for row in progress]

# Admin endpoints
@app.get("/api/admin/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    conn = get_db()
    users = conn.execute(
        "SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    
    return [dict(row) for row in users]

@app.get("/api/admin/feedback")
async def get_all_feedback(admin_user: dict = Depends(get_admin_user)):
    """Get all feedback (admin only)"""
    conn = get_db()
    feedback = conn.execute(
        """SELECT f.*, u.username FROM feedback f 
           JOIN users u ON f.user_id = u.id 
           ORDER BY f.created_at DESC"""
    ).fetchall()
    conn.close()
    
    return [dict(row) for row in feedback]

@app.put("/api/admin/feedback/{feedback_id}")
async def respond_to_feedback(feedback_id: int, response: FeedbackResponse, admin_user: dict = Depends(get_admin_user)):
    """Respond to feedback (admin only)"""
    conn = get_db()
    conn.execute(
        """UPDATE feedback 
           SET admin_response = ?, status = 'reviewed', updated_at = ?
           WHERE id = ?""",
        (response.admin_response, datetime.utcnow().isoformat(), feedback_id)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Response added successfully"}

@app.post("/api/admin/users/{user_id}/make-admin")
async def make_user_admin(user_id: int, admin_user: dict = Depends(get_admin_user)):
    """Make user admin (admin only)"""
    conn = get_db()
    conn.execute("UPDATE users SET is_admin = TRUE WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    return {"message": "User made admin successfully"}

# Question streaming endpoints
@app.get("/api/tutor-questions")
async def get_tutor_questions(
    difficulty: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get tutor questions with optional filtering"""
    conn = get_db()
    
    query = "SELECT * FROM questions WHERE 1=1"
    params = []
    
    if difficulty:
        query += " AND difficulty = ?"
        params.append(difficulty)
    
    if tags:
        query += " AND tags LIKE ?"
        params.append(f"%{tags}%")
    
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    questions = conn.execute(query, params).fetchall()
    conn.close()
    
    result = []
    for q in questions:
        question_dict = dict(q)
        # Parse JSON fields
        if question_dict["options"]:
            question_dict["options"] = json.loads(question_dict["options"])
        if question_dict["tags"]:
            question_dict["tags"] = json.loads(question_dict["tags"])
        result.append(question_dict)
    
    return {"questions": result}

@app.post("/api/tutor-questions")
async def create_question(question_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a new tutor question"""
    conn = get_db()
    
    cursor = conn.execute(
        """INSERT INTO questions (user_id, question_type, stem, options, correct_answer, 
                                 explanation, difficulty, hint, reference, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            current_user["id"],
            question_data.get("question_type", "open"),
            question_data.get("stem", ""),
            json.dumps(question_data.get("options", [])) if question_data.get("options") else None,
            question_data.get("correct_answer", ""),
            question_data.get("explanation", ""),
            question_data.get("difficulty", "moderate"),
            question_data.get("hint", ""),
            question_data.get("reference", ""),
            json.dumps(question_data.get("tags", []))
        )
    )
    
    question_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": question_id, "message": "Question created successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)