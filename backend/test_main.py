import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def mock_dummy_data(monkeypatch):
    dummy_data = [{"id": 1, "name": "John Doe", "sales": 500}]
    monkeypatch.setattr("main.DUMMY_DATA", dummy_data)
    return dummy_data

@pytest.fixture
def mock_genai_client(monkeypatch):
    class MockGenAIClient:
        def __init__(self, api_key):
            pass

        class MockModels:
            def generate_content(self, model, contents):
                return type("MockResponse", (object,), {"text": "Mock AI response"})

        models = MockModels()

    monkeypatch.setattr("main.genai.Client", MockGenAIClient)

def test_get_data(mock_dummy_data):
    response = client.get("/api/data")
    assert response.status_code == 200
    assert response.json() == mock_dummy_data

def test_ai_endpoint(mock_dummy_data, mock_genai_client):
    payload = {"question": "What is the sales data for John Doe?"}
    response = client.post("/api/ai", json=payload)
    assert response.status_code == 200
    assert response.json()["answer"] == "Mock AI response"

def test_ai_endpoint_missing_question(mock_genai_client):
    payload = {} 
    response = client.post("/api/ai", json=payload)
    assert response.status_code == 422 
    assert "detail" in response.json()
