import json
import logging

logger = logging.getLogger(__name__)

def query_local_llm(text):
    """Mock LLM function for generating educational content"""
    # This is a simplified mock - in production this would call a real LLM
    logger.info(f"Generating content for text of length: {len(text)}")
    
    # Mock response for testing
    return {
        "learning_objectives": [
            "Understand basic medical concepts from the provided content",
            "Apply clinical reasoning skills to medical scenarios"
        ],
        "tutor_questions": [
            {
                "type": "open",
                "question": "Explain the pathophysiology of the condition described in the lecture.",
                "answer": "The condition involves specific mechanisms affecting cellular function and patient outcomes.",
                "difficulty": "moderate",
                "hint": "Consider the underlying biological processes and their clinical implications.",
                "reference": "slide 3, section 2.1",
                "tags": ["pathology", "physiology"]
            },
            {
                "type": "mcq",
                "stem": "Which of the following is the most common cause of the condition?",
                "question": "MCQ: Which of the following is the most common cause of the condition?",
                "answer": "Option A",
                "difficulty": "easy",
                "hint": "Review the epidemiological data presented.",
                "reference": "table 1, slide 5",
                "tags": ["epidemiology", "diagnosis"],
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "explanation": "Option A is correct because it represents the most frequent etiology based on current evidence."
            }
        ]
    }