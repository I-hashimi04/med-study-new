from fastapi import APIRouter, Body, HTTPException, status
from pydantic import BaseModel, constr
from typing import Optional

router = APIRouter()

MAX_TEXT_LENGTH = 100_000  # Limit for reviewed text

class ReviewMaterialRequest(BaseModel):
    filename: constr(min_length=1)
    filetype: constr(min_length=1)
    extracted_text: constr(min_length=1, max_length=MAX_TEXT_LENGTH)
    user_edited_text: Optional[constr(max_length=MAX_TEXT_LENGTH)] = None  # If user edited

class ReviewMaterialResponse(BaseModel):
    success: bool
    reviewed_text: str
    message: Optional[str] = None

@router.post("/review-material", response_model=ReviewMaterialResponse, status_code=status.HTTP_200_OK)
async def review_material(review: ReviewMaterialRequest = Body(...)):
    """
    Accepts extracted text and optional user-edited text for review/confirmation.
    Returns the confirmed text for downstream tutor question generation.
    """
    text = review.user_edited_text if review.user_edited_text else review.extracted_text
    if not text.strip():
        raise HTTPException(status_code=422, detail="Submitted text is empty or invalid.")
    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=413, detail=f"Text too long. Max allowed is {MAX_TEXT_LENGTH} characters.")

    # TODO: Persist reviewed text to DB/session for next step (question generation)
    # For now, just return it
    return ReviewMaterialResponse(
        success=True,
        reviewed_text=text,
        message="Text successfully reviewed and confirmed."
    )