# MantaDrive Simplified Architecture

## Authentication Flow
**Frontend → Manta API (Direct)**
- Signup: Frontend calls Manta API directly
- Login: Frontend calls Manta API directly
- Token: Store Manta JWT token in localStorage

## File Operations Flow
**Frontend → Your Backend → Manta API**

### 1. File Upload
```
Frontend uploads file → Your Backend receives file → Backend converts to base64 → Backend posts to Manta API → Returns Manta file ID
```

### 2. File Fetch
```
Frontend requests file → Your Backend calls Manta API with file ID → Returns file data/URL
```

## Backend Responsibilities (Your FastAPI)
- Receive file uploads from frontend
- Convert files to base64 strings
- Post file data to Manta API
- Generate QR codes for files
- Create share links
- Handle file processing (AI features)
- Proxy requests to Manta API

## Frontend API Calls

### Authentication (Direct to Manta)
```javascript
// Signup
fetch('https://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow/signup', {
  method: 'POST',
  body: JSON.stringify({ firstName, lastName, username, password })
})

// Login  
fetch('https://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
})
```

### File Operations (Through Your Backend)
```javascript
// Upload file
fetch('http://localhost:8000/upload', {
  method: 'POST',
  body: formData // file
})

// Get files
fetch('http://localhost:8000/files', {
  headers: { 'Authorization': `Bearer ${mantaToken}` }
})

// Generate QR
fetch('http://localhost:8000/qr-code', {
  method: 'POST',
  body: JSON.stringify({ fileId, mantaToken })
})
```

## Your Backend Endpoints Needed

```python
# File upload - converts to base64 and posts to Manta
POST /upload

# Get user files from Manta
GET /files

# Generate QR code for file
POST /qr-code

# Create share link
POST /share-link

# AI processing
POST /ai/organize
POST /ai/extract-text
POST /ai/remove-background
```

## Backend Implementation Example

```python
import base64
import requests
from fastapi import FastAPI, UploadFile

app = FastAPI()

MANTA_BASE_URL = "https://api.mantahq.com/api/workflow/olaleye/mantadrive"

@app.post("/upload")
async def upload_file(file: UploadFile, manta_token: str):
    # Read file and convert to base64
    file_content = await file.read()
    file_base64 = base64.b64encode(file_content).decode()
    
    # Post to Manta API
    response = requests.post(
        f"{MANTA_BASE_URL}/filemanagement/upload",
        json={
            "filename": file.filename,
            "content": file_base64,
            "content_type": file.content_type
        },
        headers={"Authorization": f"Bearer {manta_token}"}
    )
    
    return response.json()

@app.get("/files")
async def get_files(manta_token: str):
    response = requests.get(
        f"{MANTA_BASE_URL}/filemanagement/list",
        headers={"Authorization": f"Bearer {manta_token}"}
    )
    return response.json()

@app.post("/qr-code")
async def generate_qr(file_id: str, manta_token: str):
    # Generate QR code logic
    # Post to Manta or generate locally
    pass
```

## Benefits of This Approach
1. **Simple**: No duplicate authentication systems
2. **Secure**: Use Manta's proven auth system
3. **Focused**: Your backend only handles file operations
4. **Scalable**: Easy to add new file features
5. **Maintainable**: Clear separation of concerns

## Environment Variables
```
# Manta API
MANTA_API_BASE_URL=https://api.mantahq.com/api/workflow/olaleye/mantadrive

# Your Backend
BACKEND_URL=http://localhost:8000
```