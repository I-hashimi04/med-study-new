import pytest
from httpx import AsyncClient
from fastapi import status

from python_worker.main import app

SAMPLE_LECTURE = """
Slide 1: Introduction to Asthma
Slide 2: Pathophysiology
Slide 3: Clinical features
Slide 4: Diagnosis
Slide 5: Management
"""

@pytest.mark.asyncio
async def test_tutor_questions_success():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/tutor-questions",
            json={"content": SAMPLE_LECTURE}
        )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "learning_objectives" in data
    assert isinstance(data["learning_objectives"], list)
    assert all(isinstance(obj, str) and obj for obj in data["learning_objectives"])
    assert "tutor_questions" in data
    assert isinstance(data["tutor_questions"], list)
    assert len(data["tutor_questions"]) > 0
    for q in data["tutor_questions"]:
        assert "type" in q and q["type"] in ["open", "mcq"]
        assert "difficulty" in q and q["difficulty"] in ["easy", "moderate", "difficult"]
        assert "reference" in q and isinstance(q["reference"], str)
        if "hint" in q:
            assert isinstance(q["hint"], str) or q["hint"] is None
        if q["type"] == "mcq":
            assert "stem" in q
            assert "options" in q and isinstance(q["options"], list) and 3 < len(q["options"]) < 6
            assert "answer" in q
            assert "explanation" in q
        if q["type"] == "open":
            assert "question" in q

@pytest.mark.asyncio
async def test_tutor_questions_missing_content():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/tutor-questions", json={})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data["learning_objectives"], list)
    assert isinstance(data["tutor_questions"], list)

@pytest.mark.asyncio
async def test_tutor_questions_malformed_payload():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/tutor-questions", data="not a json")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
