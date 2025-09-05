# Copilot Project Progress: Tutor Question Generation

_Last updated: 2025-09-05 11:57 UTC_

## How Progress Is Tracked
- **This file is the single source of truth for status.**
- **Each milestone/task is marked Not Started, In Progress, or Done.**
- **After any work, I update and push this file.**
- **You can ask for progress/status anytime; I will return this file with notes.**
- **If blocked, I will explain in the "Notes" section and request input.**

---

## Milestone 1: Core Functionality
- [x] **Frontend: Tutor Questions UI** — Basic component pushed.
- [ ] **Backend: Tutor Questions Endpoint**
    - Accepts lecture JSON, returns learning objectives/questions/metadata.
    - Each question has difficulty (mandatory), hint (optional), reference, British English.
    - MCQs are rare, open/Socratic questions preferred.
- [ ] **LLM Streaming**
    - Robust Ollama model serving: launch, download, error handling.
    - Efficient output streaming, JSON parsing, malformed response handling.

## Milestone 2: Required Features
- [ ] **Tags for Questions**
    - Each question can have tags ("pathology", "diagnosis", etc).
    - Update prompt and output parser.
- [ ] **Difficulty & Hint Support**
    - Difficulty mandatory, hint optional but encouraged.
- [ ] **Multi-Modal Reference**
    - Questions may reference sections, images, tables (not just slides).

## Milestone 3: Validation, Testing, Feedback
- [ ] **Automated Tests**
    - Unit tests for API endpoints.
    - Mock Ollama output for predictable tests.
- [ ] **Manual QA**
    - Test with varied lecture content.
    - Validate JSON structure/data quality; edge cases covered.
- [ ] **Feedback Loop**
    - Gather user feedback (students/tutors) on generated questions.
    - Track which questions are answered, skipped, flagged.

## Milestone 4: Frontend & API Integration
- [ ] **Frontend Expansion**
    - Display tags, references, objectives, MCQ formatting.
    - Robust error/loading states for streaming responses.
- [ ] **API Documentation**
    - Document endpoint usage, input/output examples.

## Milestone 5: Model & Prompt Iteration
- [ ] **Prompt Refinement**
    - Improve system prompt for clarity, accuracy, pedagogical value.
    - Test with multiple models (Llama3, Mistral, etc).
- [ ] **Output Post-Processing**
    - Clean and validate AI output (tags, difficulty, hint always present if required).

## Milestone 6: Deployment, Monitoring, Security
- [ ] **Production Deployment**
    - Containerization (Docker), cloud deploy (AWS/Azure/GCP).
- [ ] **Monitoring**
    - Logging, error reporting, usage analytics.
- [ ] **Security**
    - Secure API endpoints (auth, rate limiting), data protection.

## Milestone 7: Future Expansion
- [ ] **New Question Types**
    - Matching, ordering, image-based, free-text.
- [ ] **Analytics & Personalization**
    - Track student performance, suggest questions.
- [ ] **Teacher/Admin Tools**
    - Manual editing/addition of questions, tags, hints, references.

---

## Notes
- **Current Focus:** Backend: Tutor Questions Endpoint.
- **Next Step:** Implement endpoint changes for tags, difficulty, hint, multi-modal references.
- **How to check progress:** Ask for "progress" or "status" and I’ll return this file, updated.

---

**Legend:**  
- `[x]` = Done  
- `[ ]` = Not Started  
- `[~]` = In Progress  
- For each milestone, I’ll link related commits/files when done.