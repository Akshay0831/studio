import pytest
import json
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_get_providers():
    """Test getting available API providers"""
    response = client.get("/api/api-management/providers")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert len(data["providers"]) == 3  # replicate, runpod, openai
    assert "replicate" in [p["id"] for p in data["providers"]]
    assert "runpod" in [p["id"] for p in data["providers"]]
    assert "openai" in [p["id"] for p in data["providers"]]

def test_get_profiles():
    """Test getting all API profiles"""
    response = client.get("/api/api-management/profiles")
    assert response.status_code == 200
    data = response.json()
    assert "profiles" in data
    # Initially should be empty
    assert len(data["profiles"]) == 0

def test_create_profile():
    """Test creating a new API profile"""
    profile_data = {
        "name": "Test Replicate Profile",
        "api_key": "r8_" + "a" * 60,  # Mock replicate token
        "api_type": "replicate",
        "is_active": True,
        "models": ["stable-diffusion", "whisper"],
        "default_model": "stable-diffusion",
        "rate_limit": 60
    }
    
    response = client.post("/api/api-management/profiles", json=profile_data)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == profile_data["name"]
    assert data["api_type"] == profile_data["api_type"]
    assert data["is_active"] == profile_data["is_active"]
    assert data["models"] == profile_data["models"]
    
    return data["id"]

def test_get_models_for_provider():
    """Test getting available models for a provider"""
    response = client.get("/api/api-management/providers/replicate/models")
    assert response.status_code == 200
    data = response.json()
    assert "api_type" in data
    assert "models" in data
    assert data["api_type"] == "replicate"
    assert len(data["models"]) > 0

def test_create_profile_invalid_key():
    """Test creating profile with invalid API key"""
    profile_data = {
        "name": "Invalid Profile",
        "api_key": "invalid_key",
        "api_type": "replicate",
        "is_active": True,
        "models": ["stable-diffusion"],
        "rate_limit": 60
    }
    
    response = client.post("/api/api-management/profiles", json=profile_data)
    assert response.status_code == 400
    data = response.json()
    assert "Invalid" in data["detail"]

def test_create_profile_invalid_model():
    """Test creating profile with invalid model"""
    profile_data = {
        "name": "Invalid Model Profile",
        "api_key": "r8_" + "a" * 60,
        "api_type": "replicate",
        "is_active": True,
        "models": ["invalid_model"],
        "rate_limit": 60
    }
    
    response = client.post("/api/api-management/profiles", json=profile_data)
    assert response.status_code == 400
    data = response.json()
    assert "invalid_model" in data["detail"]

def test_get_single_profile(profile_id):
    """Test getting a specific profile"""
    response = client.get(f"/api/api-management/profiles/{profile_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == profile_id
    assert "name" in data
    assert "api_type" in data

def test_update_profile(profile_id):
    """Test updating an existing profile"""
    update_data = {
        "name": "Updated Profile Name",
        "rate_limit": 100
    }
    
    response = client.put(f"/api/api-management/profiles/{profile_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Profile Name"
    assert data["rate_limit"] == 100

def test_delete_profile(profile_id):
    """Test deleting a profile"""
    response = client.delete(f"/api/api-management/profiles/{profile_id}")
    assert response.status_code == 200
    data = response.json()
    assert "deleted" in data["message"]

def test_generation_endpoints():
    """Test generation endpoints"""
    # First create a profile
    profile_data = {
        "name": "Test Generation Profile",
        "api_key": "r8_" + "a" * 60,
        "api_type": "replicate",
        "is_active": True,
        "models": ["stable-diffusion"],
        "default_model": "stable-diffusion",
        "rate_limit": 60
    }
    
    profile_response = client.post("/api/api-management/profiles", json=profile_data)
    profile_id = profile_response.json()["id"]
    
    # Test generation request
    generation_request = {
        "prompt": "A beautiful landscape",
        "model": "stable-diffusion",
        "api_profile_id": profile_id,
        "generation_type": "image"
    }
    
    response = client.post("/api/generation/generate", json=generation_request)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "status" in data
    assert "model" in data
    assert "prompt" in data
    
    # Test getting available models
    response = client.get("/api/generation/models?api_type=replicate")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) > 0

def test_profile_usage():
    """Test profile usage statistics"""
    # Create a profile
    profile_data = {
        "name": "Usage Test Profile",
        "api_key": "r8_" + "a" * 60,
        "api_type": "replicate",
        "is_active": True,
        "models": ["stable-diffusion"],
        "default_model": "stable-diffusion",
        "rate_limit": 60
    }
    
    profile_response = client.post("/api/api-management/profiles", json=profile_data)
    profile_id = profile_response.json()["id"]
    
    # Get usage
    response = client.get(f"/api/api-management/profiles/{profile_id}/usage")
    assert response.status_code == 200
    data = response.json()
    assert "profile_id" in data
    assert "usage_count" in data
    assert "available_models" in data

if __name__ == "__main__":
    # Run tests
    test_get_providers()
    test_get_profiles()
    
    # Create profile for subsequent tests
    profile_id = test_create_profile()
    
    test_get_single_profile(profile_id)
    test_update_profile(profile_id)
    test_get_models_for_provider()
    test_generation_endpoints()
    test_profile_usage()
    test_delete_profile(profile_id)
    
    print("All tests passed!")