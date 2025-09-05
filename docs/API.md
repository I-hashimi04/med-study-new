# Medical Study Hub API Documentation

## Overview

The Medical Study Hub API provides endpoints for generating medical education content, including tutor questions, learning objectives, and feedback collection.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, no authentication is required. This will be added in future versions.

## Endpoints

### Health Check

#### GET /health
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "service": "medical-study-api"
}
```

### Question Generation

#### POST /api/generate-tutor-questions
Generates tutor questions from provided educational content.

**Request Body:**
```json
{
  "reviewed_text": "Medical lecture content here...",
  "filename": "lecture_1.pdf", // optional
  "filetype": "pdf" // optional
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "question": "Explain the pathophysiology...",
      "answer": "The pathophysiology involves...",
      "reference": "slide 3, section 2.1",
      "difficulty": "moderate",
      "hint": "Consider the underlying processes...",
      "tags": ["pathology", "physiology"]
    }
  ],
  "message": "Tutor questions generated successfully."
}
```

**Status Codes:**
- 200: Success
- 204: No questions generated
- 413: Text too long
- 422: Invalid input
- 500: Server error

#### POST /api/generate-tutor-questions-stream
Streams tutor questions as they are generated in real-time.

**Request Body:** Same as above

**Response:** Server-Sent Events stream
```
data: {"status": "starting", "message": "Beginning question generation..."}

data: {"status": "question_generated", "question": {...}, "index": 0}

data: {"status": "completed", "total_questions": 5}
```

### Feedback

#### POST /api/feedback
Submit feedback for a generated question.

**Request Body:**
```json
{
  "question_id": "q_123",
  "rating": 4,
  "comments": "Good question, but hint could be clearer",
  "difficulty_accurate": true,
  "tags_accurate": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback received successfully"
}
```

#### GET /api/feedback/{question_id}
Get aggregated feedback for a specific question.

**Response:**
```json
{
  "question_id": "q_123",
  "average_rating": 4.2,
  "total_feedback": 15,
  "feedback_summary": {
    "difficulty_accurate": 85,
    "tags_accurate": 92
  }
}
```

### Model Comparison

#### POST /api/compare-models
Compare question generation across different models.

**Request Body:**
```json
{
  "models": ["gpt-4", "claude-3", "llama-2"],
  "content": "Medical content to analyze..."
}
```

**Response:**
```json
{
  "comparison_id": "comp_123",
  "models_compared": ["gpt-4", "claude-3", "llama-2"],
  "results": {
    "gpt-4": {
      "questions_generated": 5,
      "avg_difficulty": "moderate",
      "avg_rating": 4.5,
      "processing_time": 2.8
    }
  },
  "recommendation": "gpt-4"
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "detail": "Error description"
}
```

Common error codes:
- 400: Bad Request
- 422: Validation Error
- 500: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. This will be added in future versions.

## Data Models

### TutorQuestion
```json
{
  "question": "string",
  "answer": "string", 
  "reference": "string",
  "difficulty": "easy|moderate|difficult",
  "hint": "string|null",
  "tags": ["string"]
}
```

### QuestionFeedback
```json
{
  "question_id": "string",
  "rating": "integer (1-5)",
  "comments": "string|null",
  "difficulty_accurate": "boolean|null",
  "tags_accurate": "boolean|null"
}
```