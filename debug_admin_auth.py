#!/usr/bin/env python3
"""Debug script to test admin authentication."""

import requests
import json

# Test admin login
login_data = {
    "email": "admin@example.com",  # Replace with actual admin email
    "password": "admin123"  # Replace with actual admin password
}

try:
    # Login
    print("Testing admin login...")
    login_response = requests.post("http://localhost:8001/admin/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    print(f"Login response: {login_response.text}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        token = token_data["access_token"]
        print(f"Token: {token[:50]}...")
        
        # Test /me endpoint
        print("\nTesting /me endpoint...")
        me_response = requests.get(
            "http://localhost:8001/admin/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Me status: {me_response.status_code}")
        print(f"Me response: {me_response.text}")
        
        # Test media upload endpoint
        print("\nTesting media upload endpoint...")
        # Create a dummy file
        files = {"file": ("test.txt", "test content", "text/plain")}
        media_response = requests.post(
            "http://localhost:8001/admin/media/",
            files=files,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Media status: {media_response.status_code}")
        print(f"Media response: {media_response.text}")
        
except Exception as e:
    print(f"Error: {e}")