from fastapi import FastAPI, Body
from pydantic import BaseModel, Field
from typing import List, Union, Optional
import requests
import subprocess
import time
import json
import logging

app = FastAPI()

OLLAMA_MODEL = "llama2"
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_DOWNLOAD_TIMEOUT = 300  # seconds
MODEL_DOWNLOAD_RETRY_INTERVAL = 5  # seconds

logging.basicConfig(level=logging.INFO)

class MCQ(BaseModel):
    type: str = "mcq"
    stem: str
    options: List[str]
    answer: str
    explanation: str
    reference: str
    difficulty: Optional[str] = Field(default=None, description="e.g. 'easy', 'moderate', 'difficult'")
    hint: Optional[str] = Field(default=None, description="Optional hint for the student")

class OpenQuestion(BaseModel):
    type: str = "open"
    question: str
    reference: str
    difficulty: Optional[str] = Field(default=None, description="e.g. 'easy', 'moderate', 'difficult'")
    hint: Optional[str] = Field(default=None, description="Optional hint for the student")

class TutorOutput(BaseModel):
    learning_objectives: List[str]
    tutor_questions: List[Union[OpenQuestion, MCQ]]

def ensure_ollama_running():
    try:
        requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        return True
    except Exception:
        subprocess.Popen(["ollama", "serve"])
        # Wait for Ollama to start
        for _ in range(10):
            try:
                requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
                return True
            except Exception:
                time.sleep(1)
        return False

def ensure_model_downloaded(model_name):
    start = time.time()
    while True:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        tags = resp.json().get("models", [])
        if any(m.get("name") == model_name for m in tags):
            logging.info(f"Model '{model_name}' is present.")
            break
        logging.info(f"Downloading local model '{model_name}' via Ollama...")
        requests.post(f"{OLLAMA_BASE_URL}/api/pull", json={"name": model_name})
        time.sleep(MODEL_DOWNLOAD_RETRY_INTERVAL)
        if time.time() - start > MODEL_DOWNLOAD_TIMEOUT:
            raise TimeoutError(f"Model download timed out after {MODEL_DOWNLOAD_TIMEOUT} seconds.")

def query_local_llm(content):
    if not ensure_ollama_running():
        raise RuntimeError("Ollama is not running or failed to start. Please install Ollama: https://ollama.com/download")
    ensure_model_downloaded(OLLAMA_MODEL)
    prompt = f"""
You are a medical tutor for British medical students. Analyse the following lecture content and infer both explicit and implicit learning objectives.
Then, generate a balanced set of tutor items:
- Primary: Socratic, open-ended questions referencing specific slides or sections, which require reasoning, explanation, or clinical application.
- Secondary: 1–2 high-quality MCQs, each with a clear stem, 4–5 plausible options, one correct answer, a brief explanation, and reference to the relevant content.
For each question, include a difficulty tag (easy, moderate, difficult) and optional hint if appropriate.
MCQs should be infrequent and only serve as knowledge checks.
Use British English for all output.
Structure your reply as valid JSON in this format:
{{
  "learning_objectives": ["..."],
  "tutor_questions": [
    {{
      "type": "open",
      "question": "...",
      "reference": "...",
      "difficulty": "...",
      "hint": "..."
    }},
    {{
      "type": "mcq",
      "stem": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "...",
      "explanation": "...",
      "reference": "...",
      "difficulty": "...",
      "hint": "..."
    }}
  ]
}}
Lecture content:
{content}
"""
    # Stream the Ollama response line by line and accumulate output
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt
        },
        stream=True,
        timeout=180
    )

    answer = ""
    for line in response.iter_lines():
        if line:
            try:
                payload = json.loads(line.decode())
                answer += payload.get("response", "")
            except Exception:
                answer += line.decode(errors="ignore")

    # Try to find JSON in answer
    json_start = answer.find('{')
    json_end = answer.rfind('}') + 1
    output = {
        "learning_objectives": [],
        "tutor_questions": []
    }
    if json_start != -1 and json_end != -1:
        try:
            candidate = answer[json_start:json_end]
            output = json.loads(candidate)
        except Exception as e:
            logging.error(f"Failed to parse AI output JSON: {e}")
            # Optionally, implement further cleanup here
    return output

@app.post("/tutor-questions", response_model=TutorOutput)
async def tutor_questions(
    payload: dict = Body(..., example={"content": "Lecture text, slides, notes, objectives here"})
):
    """
    Tutor Mode endpoint.
    Accepts lecture content as JSON body: {"content": "..."}
    Returns learning objectives and a list of tutor questions (Socratic and MCQ) in British English.
    Each question may include difficulty and hint fields.
    """
    content = payload.get("content", "")
    output = query_local_llm(content)
    # Validate output structure
    learning_objectives = output.get("learning_objectives", [])
    tutor_questions = output.get("tutor_questions", [])
    # Optionally, further validate/question fields here
    return TutorOutput(
        learning_objectives=learning_objectives,
        tutor_questions=tutor_questions
    )
