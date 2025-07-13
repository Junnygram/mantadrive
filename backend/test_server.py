from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "MantaDrive Backend API", "status": "running"}

def test_endpoints():
    # Test that all endpoints are registered
    endpoints = [route.path for route in app.routes]
    print("Available endpoints:", endpoints)
    assert "/signup" in endpoints
    assert "/login" in endpoints
    assert "/upload" in endpoints
    assert "/files" in endpoints
    assert "/share" in endpoints
    assert "/qrcode" in endpoints
    assert "/download/{file_id}" in endpoints

if __name__ == "__main__":
    test_root()
    test_endpoints()
    print("All tests passed!")