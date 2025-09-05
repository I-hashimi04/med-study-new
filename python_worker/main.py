import json
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any
import asyncio

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic_settings import BaseSettings
from sse_starlette.sse import EventSourceResponse
import uvicorn

# Import routers
from python_worker.upload_material import router as upload_router
from python_worker.review_material import router as review_router
from python_worker.generate_tutor_questions import router as questions_router

# Configuration
class Settings(BaseSettings):
    env: str = "development"
    debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    default_model: str = "gpt-3.5-turbo"
    max_tokens: int = 2048
    temperature: float = 0.7
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Medical Study Hub Python Worker")
    yield
    logger.info("Shutting down Medical Study Hub Python Worker")

# FastAPI app
app = FastAPI(
    title="Medical Study Hub API",
    description="LLM-powered medical study question generation API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(review_router, prefix="/api", tags=["review"])
app.include_router(questions_router, prefix="/api", tags=["questions"])

# Root endpoint
@app.get("/")
def read_root():
    return {
        "msg": "Medical Student Study Hub Python Worker running",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else "disabled",
        "status": "healthy"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time(),
        "environment": settings.env
    }

# Model comparison endpoint with streaming
@app.post("/api/compare-models")
async def compare_models(request: dict):
    """Compare multiple LLM models for question generation"""
    
    async def generate_comparison():
        models = request.get("models", [settings.default_model, "gpt-4"])
        content = request.get("content", "")
        
        if not content:
            yield f"data: {json.dumps({'error': 'No content provided'})}\n\n"
            return
            
        yield f"data: {json.dumps({'status': 'starting', 'models': models})}\n\n"
        
        results = {}
        
        for i, model in enumerate(models):
            yield f"data: {json.dumps({'status': 'processing', 'current_model': model, 'progress': i/len(models)})}\n\n"
            
            try:
                # Simulate model processing (replace with actual LLM calls)
                await asyncio.sleep(1)  # Simulate processing time
                
                # In real implementation, call different models here
                model_result = query_local_llm(content, model_name=model)
                results[model] = model_result
                
                yield f"data: {json.dumps({'status': 'completed_model', 'model': model, 'result': model_result})}\n\n"
                
            except Exception as e:
                logger.error(f"Error processing model {model}: {e}")
                yield f"data: {json.dumps({'status': 'error', 'model': model, 'error': str(e)})}\n\n"
        
        yield f"data: {json.dumps({'status': 'finished', 'results': results})}\n\n"
    
    return EventSourceResponse(generate_comparison())

# Streaming question generation endpoint
@app.post("/api/generate-questions-stream")
async def generate_questions_stream(request: dict):
    """Generate questions with real-time streaming updates"""
    
    async def stream_questions():
        content = request.get("content", "")
        if not content:
            yield f"data: {json.dumps({'error': 'No content provided'})}\n\n"
            return
            
        yield f"data: {json.dumps({'status': 'analyzing_content'})}\n\n"
        await asyncio.sleep(0.5)
        
        yield f"data: {json.dumps({'status': 'generating_objectives'})}\n\n"
        await asyncio.sleep(0.5)
        
        yield f"data: {json.dumps({'status': 'generating_questions'})}\n\n"
        
        try:
            # Process in chunks to provide streaming updates
            result = query_local_llm(content)
            
            # Stream learning objectives first
            if "learning_objectives" in result:
                yield f"data: {json.dumps({'type': 'objectives', 'data': result['learning_objectives']})}\n\n"
                await asyncio.sleep(0.2)
            
            # Stream questions one by one
            if "tutor_questions" in result:
                for i, question in enumerate(result["tutor_questions"]):
                    yield f"data: {json.dumps({'type': 'question', 'index': i, 'data': question})}\n\n"
                    await asyncio.sleep(0.3)  # Simulate processing time
            
            yield f"data: {json.dumps({'status': 'completed', 'total_questions': len(result.get('tutor_questions', []))})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming generation: {e}")
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
    
    return EventSourceResponse(stream_questions())

# Analytics endpoint
@app.get("/api/analytics")
async def get_analytics():
    """Get API usage analytics"""
    # In a real implementation, this would fetch from database/metrics store
    return {
        "total_requests": 1234,
        "successful_generations": 1156,
        "failed_generations": 78,
        "average_response_time": 2.4,
        "most_used_model": settings.default_model,
        "uptime": "99.9%"
    }

def query_local_llm(text: str, model_name: str = None) -> Dict[str, Any]:
    """
    Query the local LLM for question generation
    Enhanced to support different models and streaming
    """
    model = model_name or settings.default_model
    
    prompt = f"""
You are an expert medical tutor for British medical students. Carefully analyze the following lecture content.
First, identify both explicit and implicit learning objectives.
Then, generate a set of tutor questions with these requirements:
- Open-ended (Socratic) questions are primary, each referencing specific slides, sections, images, tables, or other content. Require reasoning, explanation, or clinical application.
- Include, at most, two multiple-choice questions (MCQs) per lecture. Each MCQ must have a clear stem, 4–5 plausible options, one correct answer, a brief explanation, and reference to the relevant content.
For every question, include these fields:
  - "type": "open" or "mcq" (required)
  - "question": for open questions, the question text; for MCQs, the stem (required)
  - "answer": the expected answer or correct option for MCQ (required)
  - "difficulty": one of "easy", "moderate", "difficult" (required)
  - "hint": a helpful hint (optional, but encouraged)
  - "reference": reference to slides, sections, images, tables, or external sources (required)
  - "tags": list of relevant medical topics (e.g., "pathology", "diagnosis", "radiology", etc.) (required)
  - For MCQs: "options" (list of choices), "explanation" (why correct)
All output must be in British English.
Return structured JSON in this format:
{{
  "learning_objectives": ["..."],
  "tutor_questions": [
    {{
      "type": "open" | "mcq",
      "question": "...",
      "answer": "...",
      "difficulty": "...",
      "hint": "...",
      "reference": "...",
      "tags": ["..."],
      // For MCQ:
      "options": ["..."],
      "explanation": "..."
    }}
  ]
}}

Content to analyze:
{text}
"""
    
    # Simulate LLM response (replace with actual LLM API call)
    logger.info(f"Processing with model: {model}")
    
    # Mock response for demonstration
    mock_response = {
        "learning_objectives": [
            "Understand the pathophysiology of asthma",
            "Recognize clinical presentations of asthma",
            "Apply diagnostic criteria for asthma"
        ],
        "tutor_questions": [
            {
                "type": "open",
                "question": "Explain the inflammatory cascade that occurs in asthmatic airways and how this relates to the clinical symptoms patients experience.",
                "answer": "The inflammatory cascade involves mast cell degranulation, eosinophil activation, and increased mucus production, leading to bronchoconstriction, wheezing, and difficulty breathing.",
                "difficulty": "moderate",
                "hint": "Consider the role of IgE-mediated responses and inflammatory mediators.",
                "reference": "Slide 2: Pathophysiology",
                "tags": ["pathophysiology", "inflammation", "respiratory"]
            },
            {
                "type": "mcq",
                "question": "Which of the following is the most appropriate first-line treatment for mild persistent asthma?",
                "options": [
                    "Short-acting beta-2 agonist",
                    "Long-acting beta-2 agonist",
                    "Inhaled corticosteroid",
                    "Oral prednisolone",
                    "Leukotriene receptor antagonist"
                ],
                "answer": "Inhaled corticosteroid",
                "explanation": "Inhaled corticosteroids are the first-line controller therapy for persistent asthma as they address the underlying inflammation.",
                "difficulty": "easy",
                "hint": "Think about addressing the underlying pathophysiology rather than just symptoms.",
                "reference": "Slide 5: Management",
                "tags": ["treatment", "pharmacology", "guidelines"]
            }
        ]
    }
    
    return mock_response

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
