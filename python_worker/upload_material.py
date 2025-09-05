from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List
import tempfile
import os

router = APIRouter()

SUPPORTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # Word
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # PowerPoint
    "text/plain",
    "image/png",
    "image/jpeg"
]
MAX_FILE_SIZE_MB = 10

def extract_pdf_text(file_bytes: bytes) -> str:
    # Simplified text extraction for demo
    # In production, would use PyMuPDF, pdfplumber, or similar
    return "PDF text extraction would be implemented here with proper libraries"

def extract_word_text(file_bytes: bytes) -> str:
    # Simplified text extraction for demo
    # In production, would use python-docx
    return "Word document text extraction would be implemented here"

def extract_ppt_text(file_bytes: bytes) -> str:
    # Simplified text extraction for demo
    # In production, would use python-pptx
    return "PowerPoint text extraction would be implemented here"

def extract_image_text(file_bytes: bytes) -> str:
    # Simplified OCR for demo
    # In production, would use pytesseract with PIL
    return "OCR text extraction would be implemented here with pytesseract"

def extract_plain_text(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return file_bytes.decode('latin-1')
        except UnicodeDecodeError:
            raise RuntimeError("Unable to decode text file")

@router.post("/upload-material", status_code=status.HTTP_201_CREATED)
async def upload_material(file: UploadFile = File(...)) -> dict:
    # Validate file size
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)
    
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Max size is {MAX_FILE_SIZE_MB}MB, got {file_size_mb:.2f}MB"
        )
    
    # Validate file type
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=415, 
            detail=f"File type {file.content_type} not supported. Supported types: {', '.join(SUPPORTED_TYPES)}"
        )
    
    # Extract text based on file type
    try:
        if file.content_type == "application/pdf":
            text = extract_pdf_text(contents)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            text = extract_word_text(contents)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            text = extract_ppt_text(contents)
        elif file.content_type.startswith("image/"):
            text = extract_image_text(contents)
        elif file.content_type == "text/plain":
            text = extract_plain_text(contents)
        else:
            raise HTTPException(status_code=415, detail="File type not supported.")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from file. Try another file or check file quality.")

    return {
        "filename": file.filename,
        "filetype": file.content_type,
        "filesize_mb": round(file_size_mb, 2),
        "extracted_text": text[:5000],  # Return only first 5000 chars for preview
        "full_text_available": len(text) > 5000
    }