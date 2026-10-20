from datetime import datetime

import pytest
from sqlmodel import Session, SQLModel, create_engine
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_session
from app.models import Content


# Test database (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def test_engine():
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def test_session(test_engine):
    with Session(test_engine) as session:
        yield session


@pytest.fixture
def client(test_session):
    def override_get_session():
        yield test_session
    
    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_created_at_is_exposed(client):
    response = client.post(
        "/content/",
        json={
            "title": "Recent Movie",
            "type": "movie",
            "movie": {"duration_minutes": 120},
        },
    )

    assert response.status_code == 201
    created_at = response.json()["created_at"]
    datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    list_response = client.get("/content/")
    assert list_response.status_code == 200
    assert list_response.json()[0]["created_at"] == created_at


def test_create_content(client):
    """Test creating a new content"""
    response = client.post(
        "/content/",
        json={"title": "Test Movie", "content_type": "movie", "year": 2024}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Movie"
    assert data["content_type"] == "movie"
    assert data["year"] == 2024
    assert "id" in data


def test_get_contents(client):
    """Test getting all contents"""
    # Create test content
    client.post(
        "/content/",
        json={"title": "Movie 1", "content_type": "movie", "year": 2023}
    )
    client.post(
        "/content/",
        json={"title": "Album 1", "content_type": "album", "year": 2022}
    )
    
    response = client.get("/content/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_content_by_id(client):
    """Test getting a single content by ID"""
    # Create content
    create_response = client.post(
        "/content/",
        json={"title": "Test Movie", "content_type": "movie", "year": 2024}
    )
    content_id = create_response.json()["id"]
    
    # Get by ID
    response = client.get(f"/content/{content_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Movie"


def test_update_content(client):
    """Test updating a content"""
    # Create content
    create_response = client.post(
        "/content/",
        json={"title": "Original Title", "content_type": "movie", "year": 2024}
    )
    content_id = create_response.json()["id"]
    
    # Update content
    response = client.put(
        f"/content/{content_id}",
        json={"title": "Updated Title", "content_type": "movie", "year": 2025}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["year"] == 2025


def test_delete_content(client):
    """Test deleting a content"""
    # Create content
    create_response = client.post(
        "/content/",
        json={"title": "To Delete", "content_type": "movie", "year": 2024}
    )
    content_id = create_response.json()["id"]
    
    # Delete content
    response = client.delete(f"/content/{content_id}")
    assert response.status_code == 200
    
    # Verify deleted
    get_response = client.get(f"/content/{content_id}")
    assert get_response.status_code == 404