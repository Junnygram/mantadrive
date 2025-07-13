import requests
import sys

def test_backend_connection():
    """Test if the backend server is running and accessible"""
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Root endpoint response: {response.status_code}")
        print(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return False

def test_specific_endpoint():
    """Test the test-endpoint"""
    try:
        response = requests.get("http://localhost:8000/test-endpoint")
        print(f"Test endpoint response: {response.status_code}")
        print(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing endpoint: {e}")
        return False

def test_create_folders_endpoint(token):
    """Test the create-user-folders endpoint with a token"""
    try:
        response = requests.post(
            "http://localhost:8000/create-user-folders",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Create folders endpoint response: {response.status_code}")
        print(response.text)
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing create folders endpoint: {e}")
        return False

if __name__ == "__main__":
    print("Testing backend connection...")
    if not test_backend_connection():
        print("Backend server is not running or not accessible!")
        sys.exit(1)
    
    print("\nTesting test endpoint...")
    test_specific_endpoint()
    
    if len(sys.argv) > 1:
        token = sys.argv[1]
        print(f"\nTesting create folders endpoint with token: {token[:10]}...")
        test_create_folders_endpoint(token)
    else:
        print("\nNo token provided. Skipping create folders test.")
        print("Usage: python test_endpoints.py <token>")