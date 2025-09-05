import json
import logging
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Medical Study Hub API",
    description="API for medical education content generation and management",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"msg": "Medical Student Study Hub Python Worker running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "medical-study-api"}

# Import and include routers after app creation to avoid circular imports
from generate_tutor_questions import router as tutor_router
app.include_router(tutor_router, prefix="/api")

# Add new endpoints for the enhanced features
from question_types import QuestionGeneratorFactory, QuestionType
from logging_utils import app_logger

@app.post("/api/generate-questions-advanced")
async def generate_questions_advanced(content: str, generator_type: str = "basic", count: int = 5):
    """Generate questions using advanced question types"""
    try:
        generator = QuestionGeneratorFactory.create_generator(generator_type)
        questions = generator.generate_questions(content, count)
        
        app_logger.log_question_generation(
            text_length=len(content),
            questions_generated=len(questions),
            processing_time=1.5  # Mock processing time
        )
        
        return {
            "success": True,
            "questions": [q.dict() for q in questions],
            "generator_type": generator_type,
            "question_types": [q.type for q in questions]
        }
    except Exception as e:
        app_logger.log_error(e, {"endpoint": "generate_questions_advanced", "content_length": len(content)})
        raise

@app.get("/api/question-types")
async def get_question_types():
    """Get available question types"""
    return {
        "available_types": [qtype.value for qtype in QuestionType],
        "generators": QuestionGeneratorFactory.get_available_types()
    }
