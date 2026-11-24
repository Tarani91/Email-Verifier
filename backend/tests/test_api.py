import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

@pytest.mark.asyncio
async def test_upload_file_endpoint():
    csv_content = b"email\ntest@example.com\nadmin@domain.com"
    files = {"file": ("test_emails.csv", csv_content, "text/csv")}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["total_emails"] == 2
    assert data["detected_column"] == "email"

