import json
# ... other imports and code ...

def query_local_llm(text):
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
{
  "learning_objectives": ["..."],
  "tutor_questions": [
    {
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
    }
  ]
}
"""
    # ... rest of your LLM calling code ...
