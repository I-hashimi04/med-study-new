from fastapi import APIRouter, Body, HTTPException, status
from pydantic import BaseModel, constr
from typing import List, Optional

router = APIRouter()

MAX_TEXT_LENGTH = 100_000  # Same as review step

class GenerateTutorQuestionsRequest(BaseModel):
    reviewed_text: constr(min_length=1, max_length=MAX_TEXT_LENGTH)
    filename: Optional[str] = None
    filetype: Optional[str] = None

class TutorQuestion(BaseModel):
    question: str
    answer: str

class GenerateTutorQuestionsResponse(BaseModel):
    success: bool
    questions: List[TutorQuestion]
    message: Optional[str] = None

@router.post("/generate-tutor-questions", response_model=GenerateTutorQuestionsResponse, status_code=status.HTTP_200_OK)
async def generate_tutor_questions(request: GenerateTutorQuestionsRequest = Body(...)):
    """
    Generates tutor questions and answers from reviewed study material.
    """
    text = request.reviewed_text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Reviewed text is empty.")

    # TODO: Replace this stub with your actual question generation logic (e.g., call to LLM)
    # For now, return 3 sample questions for demonstration:
    questions = [
        TutorQuestion(
            question="What is the main idea of the material?",
            answer="The main idea is to demonstrate tutor question generation."
        ),
        TutorQuestion(
            question="List two important details mentioned.",
            answer="Detail 1: Example endpoint design. Detail 2: Validation and error handling."
        ),
        TutorQuestion(
            question="How does the workflow progress after material review?",
            answer="The reviewed text is sent to the tutor question generation API."
        ),
    ]
    return GenerateTutorQuestionsResponse(
        success=True,
        questions=questions,
        message="Tutor questions generated successfully."
    )
