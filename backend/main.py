


from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import requests
import qrcode
import io
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from typing import Optional
import logging
import jwt
from jwt.exceptions import PyJWTError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MantaDrive Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANTA_BASE_URL = "https://api.mantahq.com/api/workflow/olaleye/mantadrive"

# AWS S3 Configuration with better error handling
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    S3_BUCKET = os.getenv('S3_BUCKET_NAME', 'mantadrive-users')
    
    # Test S3 connection and bucket existence
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        logger.info(f"S3 bucket '{S3_BUCKET}' is accessible")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            logger.error(f"S3 bucket '{S3_BUCKET}' does not exist")
        elif error_code == '403':
            logger.error(f"Access denied to S3 bucket '{S3_BUCKET}'")
        else:
            logger.error(f"Error accessing S3 bucket: {e}")
    
except NoCredentialsError:
    logger.error("AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    s3_client = None
except Exception as e:
    logger.error(f"Error initializing S3 client: {e}")
    s3_client = None

class ShareLinkRequest(BaseModel):
    file_id: str
    manta_token: str

class QRCodeRequest(BaseModel):
    file_id: str
    manta_token: str

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

def create_user_folders_from_token(token: str) -> None:
    """Extract user info from token and create S3 folders"""
    try:
        # Decode token without verification (we just need the user info)
        # In production, you should verify the token
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Extract username or user ID from token
        username = decoded.get('username')
        user_id = decoded.get('id') or decoded.get('user_id') or decoded.get('userId') or username
        
        if user_id:
            logger.info(f"Creating folders for user from token: {user_id}")
            create_s3_folder(user_id)
        else:
            logger.warning(f"Could not extract user ID from token. Token payload: {decoded}")
    except PyJWTError as e:
        logger.error(f"Error decoding JWT token: {e}")
    except Exception as e:
        logger.error(f"Error in create_user_folders_from_token: {e}")

def create_s3_folder(user_id: str) -> dict:
    """Create S3 folder structure for user with proper error handling"""
    if not s3_client:
        return {"error": "S3 client not initialized"}
    
    base_folder = f"user-{user_id}/"
    subfolders = ["documents/", "images/", "videos/", "others/"]
    
    try:
        # First check if bucket exists
        s3_client.head_bucket(Bucket=S3_BUCKET)
        
        # Create the main folder by putting an empty object
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=base_folder,
            Body=b'',
            ContentType='application/x-directory'
        )
        
        # Create subfolders
        for subfolder in subfolders:
            subfolder_key = f"{base_folder}{subfolder}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=subfolder_key,
                Body=b'',
                ContentType='application/x-directory'
            )
            logger.info(f"Created S3 subfolder: {subfolder_key}")
        
        logger.info(f"Created S3 folder structure for user: {user_id}")
        return {
            "success": True,
            "s3_folder": base_folder,
            "s3_bucket": S3_BUCKET
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'NoSuchBucket':
            error_msg = f"S3 bucket '{S3_BUCKET}' does not exist"
        elif error_code == 'AccessDenied':
            error_msg = f"Access denied to S3 bucket '{S3_BUCKET}'"
        else:
            error_msg = f"S3 error ({error_code}): {error_message}"
            
        logger.error(error_msg)
        return {"error": error_msg}
        
    except Exception as e:
        error_msg = f"Unexpected error creating S3 folder: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}

@app.post("/signup")
async def signup_user(request: SignupRequest):
    """Proxy signup to MantaHQ API and create S3 folder"""
    try:
        # Call MantaHQ signup API
        response = requests.post(
            f"{MANTA_BASE_URL}/userauthflow/signup",
            json={
                "firstName": request.firstName,
                "lastName": request.lastName,
                "username": request.username,
                "password": request.password
            },
            timeout=10
        )
        
        # Log the response for debugging
        logger.info(f"Signup API response status: {response.status_code}")
        
        # Get the response data
        manta_response = response.json()
        logger.info(f"Signup response: {manta_response}")
        
        # Create S3 folders in background without modifying the response
        try:
            # Extract token from response to get user info
            token = manta_response.get('token')
            if token:
                # Use the token to create S3 folders
                # This is a background task that doesn't affect the response
                create_user_folders_from_token(token)
        except Exception as folder_error:
            logger.error(f"Error creating S3 folders: {folder_error}")
            # Don't fail the signup process if folder creation fails
        
        # Return the exact MantaHQ response
        return manta_response
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during signup: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        import traceback
        logger.error(f"Unexpected error during signup: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login_user(request: LoginRequest):
    """Proxy login to MantaHQ API"""
    try:
        # Forward request directly to MantaHQ API
        response = requests.post(
            f"{MANTA_BASE_URL}/userauthflow/login",
            json={
                "username": request.username,
                "password": request.password
            },
            timeout=10
        )
        
        # Log response for debugging
        logger.info(f"Login API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during login: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=30  # Longer timeout for file uploads
        )
        
        # Log response for debugging
        logger.info(f"Upload API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during file upload: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during file upload: {e}")
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
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        # Log response for debugging
        logger.info(f"Files API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error getting files: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error getting files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/share")
async def create_share_link(request: ShareLinkRequest):
    """Create a shareable link for a file"""
    try:
        response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement/share",
            json={"file_id": request.file_id},
            headers={"Authorization": f"Bearer {request.manta_token}"},
            timeout=10
        )
        
        # Log response for debugging
        logger.info(f"Share API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error creating share link: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error creating share link: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qrcode")
async def generate_qr_code(request: QRCodeRequest):
    """Generate QR code for a file share link"""
    try:
        # First get the share link
        share_response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement/share",
            json={"file_id": request.file_id},
            headers={"Authorization": f"Bearer {request.manta_token}"}
        )
        
        if share_response.status_code != 200:
            raise HTTPException(status_code=share_response.status_code, detail=share_response.text)
            
        share_data = share_response.json()
        share_link = share_data.get("share_link")
        
        if not share_link:
            raise HTTPException(status_code=400, detail="Share link not found in response")
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(share_link)
        qr.make(fit=True)
        
        # Create an image from the QR Code
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Convert to base64 for easy frontend display
        qr_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()
        
        return {"qr_code": qr_base64, "share_link": share_link}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{file_id}")
async def download_file(file_id: str, authorization: Optional[str] = Header(None)):
    """Download a file from Manta API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/download/{file_id}",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=30  # Longer timeout for file downloads
        )
        
        # Log response for debugging
        logger.info(f"Download API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error downloading file: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-endpoint")
async def test_endpoint():
    """Simple test endpoint to verify the server is working"""
    return {"success": True, "message": "Test endpoint is working"}

@app.post("/create-user-folders")
async def create_user_folders(authorization: Optional[str] = Header(None)):
    """Create S3 folders for a user after signup"""
    logger.info(f"Received request to create user folders")
    
    if not authorization:
        logger.error("No authorization header provided")
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.replace("Bearer ", "")
    logger.info(f"Token received (first 20 chars): {token[:20]}...")
    
    try:
        # Create folders using the token
        create_user_folders_from_token(token)
        
        logger.info("User folders created successfully")
        return {"success": True, "message": "User folders created successfully"}
    except Exception as e:
        logger.error(f"Error creating user folders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint with S3 status"""
    s3_status = "connected" if s3_client else "disconnected"
    
    bucket_status = "unknown"
    if s3_client:
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET)
            bucket_status = "accessible"
        except ClientError as e:
            bucket_status = f"error: {e.response['Error']['Code']}"
        except Exception as e:
            bucket_status = f"error: {str(e)}"
    
    return {
        "message": "MantaDrive Backend API",
        "status": "running",
        "s3_status": s3_status,
        "s3_bucket": S3_BUCKET,
        "bucket_status": bucket_status
    }

@app.get("/")
async def root():
    return {"message": "MantaDrive Backend API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)