import pytest
from httpx import AsyncClient
from fastapi import status

from app import app

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
            "/api/tutor-questions",
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
            assert "options" in q and isinstance(q["options"], list) and 3 < len(q["options"]) < 6
            assert "answer" in q
            assert "explanation" in q
        if q["type"] == "open":
            assert "question" in q

@pytest.mark.asyncio
async def test_tutor_questions_missing_content():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/tutor-questions", json={})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data["learning_objectives"], list)
    assert isinstance(data["tutor_questions"], list)

@pytest.mark.asyncio
async def test_tutor_questions_malformed_payload():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/tutor-questions", data="not a json")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_register_user():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_user():
    # First register a user
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/register",
            json={
                "username": "logintest",
                "email": "logintest@example.com",
                "password": "testpass123"
            }
        )
        
        # Then try to login
        response = await ac.post(
            "/api/login",
            json={
                "username": "logintest",
                "password": "testpass123"
            }
        )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/login",
            json={
                "username": "nonexistent",
                "password": "wrongpass"
            }
        )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_protected_route_without_token():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/me")
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.asyncio
async def test_submit_feedback():
    # Register and login first
    async with AsyncClient(app=app, base_url="http://test") as ac:
        reg_response = await ac.post(
            "/api/register",
            json={
                "username": "feedbackuser",
                "email": "feedback@example.com",
                "password": "testpass123"
            }
        )
        token = reg_response.json()["access_token"]
        
        # Submit feedback
        response = await ac.post(
            "/api/feedback",
            json={
                "subject": "Test Feedback",
                "content": "This is a test feedback",
                "rating": 5
            },
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "id" in data
    assert "message" in data
