from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import requests
import qrcode
import io
from typing import Optional

app = FastAPI(title="MantaDrive Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANTA_BASE_URL = "https://api.mantahq.com/api/workflow/olaleye/mantadrive"

class ShareLinkRequest(BaseModel):
    file_id: str
    manta_token: str

class QRCodeRequest(BaseModel):
    file_id: str
    manta_token: str

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload file to Manta API as base64 string"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Read file and convert to base64
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode()
        
        # Post to Manta API
        response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement/upload",
            json={
                "filename": file.filename,
                "content": file_base64,
                "content_type": file.content_type,
                "size": len(file_content)
            },
            headers={"Authorization": f"Bearer {manta_token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files")
async def get_files(authorization: Optional[str] = Header(None)):
    """Get user files from Manta API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/list",
            headers={"Authorization": f"Bearer {manta_token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qr-code")
async def generate_qr_code(request: QRCodeRequest):
    """Generate QR code for file sharing"""
    try:
        # Get file info from Manta
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/{request.file_id}",
            headers={"Authorization": f"Bearer {request.manta_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = response.json()
        
        # Create share URL (you can customize this)
        share_url = f"https://mantadrive.com/share/{request.file_id}"
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(share_url)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        img_buffer = io.BytesIO()
        qr_img.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return {
            "qr_code": f"data:image/png;base64,{img_base64}",
            "share_url": share_url,
            "file_name": file_data.get("filename", "Unknown")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/share-link")
async def create_share_link(request: ShareLinkRequest):
    """Create shareable link for file"""
    try:
        # Post to Manta API to create share link
        response = requests.post(
            f"{MANTA_BASE_URL}/filesharing/create-link",
            json={"file_id": request.file_id},
            headers={"Authorization": f"Bearer {request.manta_token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            # Fallback: create local share link
            share_url = f"https://mantadrive.com/share/{request.file_id}"
            return {"share_url": share_url}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/organize")
async def organize_files(authorization: Optional[str] = Header(None)):
    """Organize files using AI"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        response = requests.post(
            f"{MANTA_BASE_URL}/aiprocessing/organize-files",
            headers={"Authorization": f"Bearer {manta_token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "MantaDrive Backend API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)