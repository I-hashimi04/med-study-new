import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add python_worker to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'python_worker'))

from python_worker.generate_tutor_questions import app

client = TestClient(app)

def mock_query_local_llm(text):
    # Simulate a complete, production-style LLM output
    return {
        "learning_objectives": [
            "Understand the pathophysiology of pneumonia",
            "Recognise radiological features on chest X-ray"
        ],
        "tutor_questions": [
            {
                "type": "open",
                "question": "Explain the main differences between lobar and bronchopneumonia.",
                "answer": "Lobar pneumonia affects a single lobe; bronchopneumonia involves multiple patches.",
                "difficulty": "moderate",
                "hint": "Consider the distribution and radiological appearance.",
                "reference": "slide 8, image 2",
                "tags": ["pathology", "diagnosis", "radiology"]
            },
            {
                "type": "mcq",
                "question": "Which organism is most commonly associated with community-acquired pneumonia?",
                "answer": "Streptococcus pneumoniae",
                "difficulty": "easy",
                "hint": "It's a common Gram-positive diplococcus.",
                "reference": "section 3.1, table 1",
                "tags": ["microbiology", "infectious disease"],
                "options": [
                    "Streptococcus pneumoniae",
                    "Haemophilus influenzae",
                    "Klebsiella pneumoniae",
                    "Staphylococcus aureus"
                ],
                "explanation": "Streptococcus pneumoniae is the leading cause of community-acquired pneumonia."
            }
        ]
    }

def test_generate_tutor_questions(monkeypatch):
    # Patch the LLM function to return our mock output
    monkeypatch.setattr(
        "python_worker.generate_tutor_questions.query_local_llm",
        mock_query_local_llm
    )
    payload = {
        "reviewed_text": "Lecture covers pneumonia: pathophysiology, diagnosis, radiology, and management.",
        "filename": "pneumonia_lecture.pdf",
        "filetype": "pdf"
    }
    response = client.post("/generate-tutor-questions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["questions"], list)
    assert len(data["questions"]) == 2
    for q in data["questions"]:
        assert "difficulty" in q and q["difficulty"] in ["easy", "moderate", "difficult"]
        assert "tags" in q and isinstance(q["tags"], list) and len(q["tags"]) > 0
        assert "reference" in q and isinstance(q["reference"], str)
        if q["question"].startswith("MCQ"):
            assert "answer" in q and "Streptococcus pneumoniae" in q["answer"]
