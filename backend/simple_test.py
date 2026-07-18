#!/usr/bin/env python3

"""
Simple test script to verify API functionality
"""

import requests
import json

def test_api_endpoints():
    """Test the API endpoints directly"""
    base_url = "http://localhost:8000"
    
    # Test 1: Get providers
    print("Test 1: Getting API providers...")
    try:
        response = requests.get(f"{base_url}/api/api-management/providers")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Providers: {len(data['providers'])}")
            for provider in data['providers']:
                print(f"  - {provider['id']}: {provider['name']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")
    
    # Test 2: Create profile
    print("\nTest 2: Creating API profile...")
    profile_data = {
        "name": "Test Replicate Profile",
        "api_key": "r8_" + "a" * 60,  # Mock token
        "api_type": "replicate",
        "is_active": True,
        "models": ["stable-diffusion"],
        "default_model": "stable-diffusion",
        "rate_limit": 60
    }
    
    try:
        response = requests.post(f"{base_url}/api/api-management/profiles", json=profile_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Created profile: {data['id']}")
            profile_id = data['id']
            
            # Test 3: Get profiles
            print("\nTest 3: Getting profiles...")
            response = requests.get(f"{base_url}/api/api-management/profiles")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Total profiles: {len(data['profiles'])}")
            
            # Test 4: Generate content
            print("\nTest 4: Generating content...")
            generation_request = {
                "prompt": "A beautiful landscape",
                "model": "stable-diffusion",
                "api_profile_id": profile_id,
                "generation_type": "image"
            }
            
            response = requests.post(f"{base_url}/api/generation/generate", json=generation_request)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Generation result: {data['status']}")
                print(f"Generation ID: {data['id']}")
            else:
                print(f"Error: {response.text}")
                
            # Test 5: Delete profile
            print("\nTest 5: Deleting profile...")
            response = requests.delete(f"{base_url}/api/api-management/profiles/{profile_id}")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Profile deleted successfully")
                
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    print("Testing API Management System")
    print("=" * 40)
    test_api_endpoints()