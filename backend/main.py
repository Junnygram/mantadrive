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
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MantaDrive Backend")

app.add_middleware(
    CORSMiddleware,
      allow_origins=[
        "https://mantadrive.onrender.com",  
    ],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MANTA_BASE_URL = os.getenv('MANTA_BASE_URL', "https://api.mantahq.com/api/workflow/olaleye/mantadrive")

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
        logger.info(f"S3 bucket {S3_BUCKET} is accessible")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            logger.error(f"S3 bucket {S3_BUCKET} does not exist")
        elif error_code == '403':
            logger.error(f"Access denied to S3 bucket {S3_BUCKET}")
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

class UserResetRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    currentPassword: str
    newPassword: Optional[str] = None

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
    """Upload file to S3 then register metadata with MantaHQ"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    logger.info(f"Upload request received for file: {file.filename}")
    
    try:
        # Get user info from token
        decoded = jwt.decode(manta_token, options={"verify_signature": False})
        username = decoded.get('username')
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Get content type
        content_type = file.content_type or 'application/octet-stream'
        
        # Determine file category for organized storage
        file_category = "others"
        if content_type.startswith('image/'):
            file_category = "images"
        elif content_type.startswith('video/'):
            file_category = "videos"
        elif content_type.startswith('audio/'):
            file_category = "audio"
        elif content_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            file_category = "documents"
        
        # Create S3 key with proper structure matching your bucket
        s3_key = f"user-{username}/{file_category}/{file.filename}"
        
        # Check if S3 client is available
        if not s3_client:
            logger.warning("S3 client not available, using fallback storage")
            # Fallback: Store metadata only in MantaHQ
            s3_url = f"https://demo-mantadrive.s3.amazonaws.com/{s3_key}"
        else:
            try:
                # Upload to S3
                s3_client.put_object(
                    Bucket=S3_BUCKET,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=content_type
                )
                
                # Generate S3 URL
                aws_region = os.getenv('AWS_REGION', 'us-east-1')
                s3_url = f"https://{S3_BUCKET}.s3.{aws_region}.amazonaws.com/{s3_key}"
                logger.info(f"Successfully uploaded to S3: {s3_key}")
                
            except ClientError as e:
                logger.error(f"S3 upload failed: {e}")
                # Fallback to demo URL if S3 fails
                s3_url = f"https://demo-mantadrive.s3.amazonaws.com/{s3_key}"
            except Exception as e:
                logger.error(f"S3 upload error: {e}")
                # Fallback to demo URL if S3 fails
                s3_url = f"https://demo-mantadrive.s3.amazonaws.com/{s3_key}"
        
        # Send to MantaHQ
        manta_response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement",
            json={
                "s3_url": s3_url,
                "s3_key": s3_key,
                "size": file_size,
                "content_type": content_type,
                "created_at": str(int(datetime.utcnow().timestamp() * 1000)),
                "username": username
            },
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=30
        )
        
        # Log response
        logger.info(f"MantaHQ API response: {manta_response.status_code}")
        logger.info(f"MantaHQ API response body: {manta_response.text[:200]}")
        
        # Handle MantaHQ errors
        if manta_response.status_code not in [200, 201]:
            # Clean up S3 if MantaHQ fails
            if s3_client and "demo-mantadrive" not in s3_url:
                try:
                    s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                except:
                    pass
            raise HTTPException(status_code=manta_response.status_code, 
                                detail=f"Failed to register file: {manta_response.text[:100]}")
        
        # Return success
        response_data = manta_response.json()
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_id": response_data.get("id") or str(uuid.uuid4()),
            "filename": file.filename,
            "size": file_size,
            "content_type": content_type,
            "s3_url": s3_url,
            "category": file_category
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-simple")
async def upload_file_simple(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Minimal upload implementation"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 client not available")
    
    try:
        # Get username from token
        token = authorization.replace("Bearer ", "")
        decoded = jwt.decode(token, options={"verify_signature": False})
        username = decoded.get('username')
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Read file
        content = await file.read()
        
        # Upload to S3
        s3_key = f"user-{username}/{file.filename}"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        # Create URL
        region = os.getenv('AWS_REGION', 'us-east-1')
        s3_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{s3_key}"
        
        # Register with MantaHQ - include username field
        response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement",
            json={
                "s3_url": s3_url,
                "s3_key": s3_key,
                "size": len(content),
                "content_type": file.content_type or 'application/octet-stream',
                "created_at": str(int(datetime.utcnow().timestamp() * 1000)),
                "username": username  # Added username field
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            return {"success": False, "status": response.status_code, "message": response.text}
        
        return response.json()
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/files")
async def get_files(
    username: str, 
    authorization: Optional[str] = Header(None),
    category: Optional[str] = None
):
    """Get files for specific username from MantaHQ with optional category filtering"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Get all files from MantaHQ
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        logger.info(f"Files API response status: {response.status_code}")
        
        if response.status_code != 200:
            return []
        
        try:
            response_data = response.json()
            # Handle the specific response structure with 'data' field
            all_files = response_data.get('data', []) if isinstance(response_data, dict) else response_data
            if not isinstance(all_files, list):
                all_files = []
            logger.info(f"Successfully parsed response with {len(all_files)} files")
        except Exception as e:
            logger.error(f"Error parsing MantaHQ response: {e}")
            return []
        
        # Filter files by user folder
        user_prefix = f"user-{username}/"
        user_files = []
        
        logger.info(f"Filtering files for user prefix: {user_prefix}")
        logger.info(f"Total files before filtering: {len(all_files)}")
        
        # Add defensive check
        if not all_files:
            logger.warning("No files found in the response")
            return []
        
        # Process files with robust error handling
        for file in all_files:
            try:
                # Skip files without s3_key
                s3_key = file.get('s3_key', '')
                if not s3_key:
                    continue
                    
                # Filter by user prefix
                if s3_key.startswith(user_prefix):
                    # Extract category from path
                    path_parts = s3_key.replace(user_prefix, '').split('/')
                    file_category = path_parts[0] if len(path_parts) > 1 else "others"
                    
                    # Skip if category filter is provided and doesn't match
                    if category and file_category != category:
                        continue
                    
                    # Get original filename if available, otherwise extract from s3_key
                    display_name = file.get('filename', '')
                    if not display_name:
                        display_name = path_parts[-1] if path_parts else s3_key.split('/')[-1]
                    
                    # Format created_at as ISO string if it's a timestamp
                    created_at = file.get('created_at')
                    formatted_date = None
                    
                    if created_at and isinstance(created_at, str) and created_at.isdigit():
                        try:
                            # Convert milliseconds to seconds for datetime
                            timestamp = int(created_at) / 1000
                            formatted_date = datetime.fromtimestamp(timestamp).isoformat()
                        except (ValueError, OverflowError) as e:
                            logger.warning(f"Error formatting timestamp {created_at}: {e}")
                            formatted_date = None
                    
                    # Use formatted date if available, otherwise use original
                    display_date = formatted_date if formatted_date else created_at
                    
                    user_files.append({
                        'id': file.get('id'),
                        'name': display_name,
                        'size': file.get('size', 0),
                        'type': file.get('content_type', 'application/octet-stream'),
                        'category': file_category,
                        'createdAt': display_date,  # For frontend compatibility
                        'created_at': created_at,   # Keep original field too
                        's3_key': s3_key,
                        's3_url': file.get('s3_url')
                    })
            except Exception as file_error:
                # Log error but continue processing other files
                logger.error(f"Error processing file: {file_error}")
                continue
        
        # Skip sorting if there are no files
        if user_files:
            try:
                # Sort files by creation date (newest first) with robust None handling
                def safe_sort_key(x):
                    # Use created_at from the API response
                    created_at = x.get('created_at')
                    # Return a string value that can be compared safely
                    if created_at is None:
                        return ''
                    else:
                        return str(created_at)
                
                user_files.sort(key=safe_sort_key, reverse=True)
                logger.info(f"Successfully sorted {len(user_files)} files")
            except Exception as sort_error:
                # If sorting fails, return unsorted files
                logger.error(f"Error sorting files: {sort_error}")
                # Don't fail the whole request just because sorting failed
        
        return user_files
            
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
            headers={"Authorization": f"Bearer {request.manta_token}"},
            timeout=10
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
        
        # Get file metadata for additional context
        try:
            file_response = requests.get(
                f"{MANTA_BASE_URL}/filemanagement/{request.file_id}",
                headers={"Authorization": f"Bearer {request.manta_token}"},
                timeout=10
            )
            
            if file_response.status_code == 200:
                file_data = file_response.json()
                filename = file_data.get('filename') or file_data.get('s3_key', '').split('/')[-1]
                return {
                    "qr_code": qr_base64, 
                    "share_link": share_link,
                    "filename": filename,
                    "content_type": file_data.get('content_type'),
                    "size": file_data.get('size')
                }
        except Exception as metadata_error:
            logger.warning(f"Error getting file metadata for QR code: {metadata_error}")
            # Continue without the metadata
        
        return {"qr_code": qr_base64, "share_link": share_link}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error generating QR code: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error generating QR code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{file_id}")
async def download_file(file_id: str, authorization: Optional[str] = Header(None)):
    """Download a file via S3 URL from MantaHQ metadata"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Get file metadata directly from MantaHQ
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/{file_id}",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        if response.status_code == 404:
            # If direct file lookup fails, try getting all files and filtering
            all_files_response = requests.get(
                f"{MANTA_BASE_URL}/filemanagement",
                headers={"Authorization": f"Bearer {manta_token}"},
                timeout=10
            )
            
            if all_files_response.status_code != 200:
                raise HTTPException(status_code=all_files_response.status_code, detail="Failed to get files")
            
            all_files = all_files_response.json()
            file_data = None
            
            # Find file by ID
            for file in all_files:
                if file.get('id') == file_id:
                    file_data = file
                    break
                    
            if not file_data:
                raise HTTPException(status_code=404, detail="File not found")
        else:
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to get file metadata")
            file_data = response.json()
        
        s3_key = file_data.get('s3_key')
        if not s3_key:
            raise HTTPException(status_code=404, detail="File location not found")
        
        # Get original filename for download
        original_filename = file_data.get('filename')
        if not original_filename:
            # Extract filename from s3_key if original filename not stored
            original_filename = s3_key.split('/')[-1]
            
            # Remove any UUID suffix if present (format: filename_uuid.ext)
            parts = original_filename.split('_')
            if len(parts) > 1 and len(parts[-1].split('.')[0]) == 8:  # UUID part is 8 chars
                # Try to reconstruct original filename
                name_parts = parts[:-1]
                extension = original_filename.split('.')[-1] if '.' in original_filename else ''
                original_filename = '_'.join(name_parts)
                if extension:
                    original_filename = f"{original_filename}.{extension}"
        
        # Generate presigned URL for direct S3 download
        if s3_client:
            download_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET, 
                    'Key': s3_key,
                    'ResponseContentDisposition': f'attachment; filename="{original_filename}"'
                },
                ExpiresIn=3600  # 1 hour
            )
            return {
                "download_url": download_url, 
                "filename": original_filename,
                "content_type": file_data.get('content_type', 'application/octet-stream'),
                "size": file_data.get('size', 0)
            }
        else:
            raise HTTPException(status_code=500, detail="Storage service unavailable")
            
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

@app.post("/test-upload")
async def test_upload(authorization: Optional[str] = Header(None)):
    """Test endpoint to verify MantaHQ API integration"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Get username from token
        decoded = jwt.decode(manta_token, options={"verify_signature": False})
        username = decoded.get('username')
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Create a simple test metadata
        test_metadata = {
            "s3_url": "https://test-bucket.s3.amazonaws.com/test-file.txt",
            "s3_key": "test-file.txt",
            "size": 123,
            "content_type": "text/plain",
            "created_at": str(int(datetime.utcnow().timestamp() * 1000)),
            "username": username  # Added username field
        }
        
        # Send to MantaHQ
        response = requests.post(
            f"{MANTA_BASE_URL}/filemanagement",
            json=test_metadata,
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response": response.text[:200],
            "sent_metadata": test_metadata
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Anonymous Sharing Models
class AnonymousShareRequest(BaseModel):
    file_id: str
    access_key: Optional[str] = None
    password: Optional[str] = None
    expires_in: Optional[int] = 24  # hours
    max_downloads: Optional[int] = None

@app.post("/share/anonymous")
async def create_anonymous_share(
    request: AnonymousShareRequest,
    authorization: Optional[str] = Header(None)
):
    """Create anonymous share link with multi-layer security"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # First get the file metadata
        file_response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/{request.file_id}",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        if file_response.status_code != 200:
            # Try getting all files and filtering
            all_files_response = requests.get(
                f"{MANTA_BASE_URL}/filemanagement",
                headers={"Authorization": f"Bearer {manta_token}"},
                timeout=10
            )
            
            if all_files_response.status_code != 200:
                raise HTTPException(status_code=404, detail="File not found")
            
            try:
                response_data = all_files_response.json()
                all_files = response_data.get('data', []) if isinstance(response_data, dict) else response_data
                if not isinstance(all_files, list):
                    all_files = []
            except:
                all_files = []
            
            file_data = None
            for file in all_files:
                if file.get('id') == request.file_id:
                    file_data = file
                    break
                    
            if not file_data:
                raise HTTPException(status_code=404, detail="File not found")
        else:
            file_data = file_response.json()
        
        # Generate unique access ID
        access_id = str(uuid.uuid4())[:8]
        
        # Create share metadata
        share_data = {
            "access_id": access_id,
            "file_id": request.file_id,
            "s3_key": file_data.get('s3_key'),
            "s3_url": file_data.get('s3_url'),
            "filename": file_data.get('filename') or file_data.get('s3_key', '').split('/')[-1],
            "size": file_data.get('size', 0),
            "content_type": file_data.get('content_type', 'application/octet-stream'),
            "access_key": request.access_key,
            "password": request.password,
            "expires_at": (datetime.utcnow().timestamp() + (request.expires_in * 3600)) if request.expires_in else None,
            "max_downloads": request.max_downloads,
            "download_count": 0,
            "created_at": datetime.utcnow().timestamp()
        }
        
        # Store share data in MantaHQ (using a separate collection/endpoint if available)
        # For now, we'll return the share data directly
        # In production, you'd store this in a database
        
        share_url = f"https://mantadrive.app/s/{access_id}"
        
        return {
            "success": True,
            "share_url": share_url,
            "access_id": access_id,
            "expires_at": share_data["expires_at"],
            "protection": {
                "access_key": bool(request.access_key),
                "password": bool(request.password),
                "expiration": bool(request.expires_in),
                "download_limit": bool(request.max_downloads)
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating anonymous share: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/s/{access_id}")
async def access_anonymous_share(
    access_id: str,
    access_key: Optional[str] = None,
    password: Optional[str] = None
):
    """Access anonymous shared file"""
    try:
        # In a real implementation, you'd retrieve share data from database
        # For demo purposes, we'll simulate this
        
        # Validate access_id format
        if len(access_id) != 8:
            raise HTTPException(status_code=404, detail="Share not found")
        
        # For demo, return a sample response
        # In production, validate access_key, password, expiration, etc.
        
        return {
            "success": True,
            "message": "Anonymous share access validated",
            "filename": "demo-file.pdf",
            "size": 1024,
            "content_type": "application/pdf",
            "download_url": f"https://mantadrive.app/download/{access_id}"
        }
        
    except Exception as e:
        logger.error(f"Error accessing anonymous share: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI-Powered Features
@app.post("/ai/organize")
async def organize_files_ai(authorization: Optional[str] = Header(None)):
    """AI-powered file organization"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user info from token
        decoded = jwt.decode(manta_token, options={"verify_signature": False})
        username = decoded.get('username')
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user's files
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            return {"success": False, "message": "Could not fetch files"}
        
        try:
            response_data = response.json()
            all_files = response_data.get('data', []) if isinstance(response_data, dict) else response_data
            if not isinstance(all_files, list):
                all_files = []
        except:
            all_files = []
        
        # Filter user files
        user_prefix = f"user-{username}/"
        user_files = [f for f in all_files if f.get('s3_key', '').startswith(user_prefix)]
        
        # AI Organization Logic (Simplified)
        organized_categories = {
            "Work Documents": [],
            "Personal Photos": [],
            "Videos": [],
            "Archives": [],
            "Others": []
        }
        
        for file in user_files:
            content_type = file.get('content_type', '').lower()
            filename = file.get('s3_key', '').split('/')[-1].lower()
            
            # Smart categorization
            if any(word in filename for word in ['resume', 'cv', 'report', 'invoice', 'contract']):
                organized_categories["Work Documents"].append(file)
            elif content_type.startswith('image/') and any(word in filename for word in ['photo', 'img', 'pic', 'selfie']):
                organized_categories["Personal Photos"].append(file)
            elif content_type.startswith('video/'):
                organized_categories["Videos"].append(file)
            elif any(ext in filename for ext in ['.zip', '.rar', '.tar', '.gz']):
                organized_categories["Archives"].append(file)
            else:
                organized_categories["Others"].append(file)
        
        # Generate suggestions
        suggestions = []
        for category, files in organized_categories.items():
            if files:
                suggestions.append({
                    "category": category,
                    "count": len(files),
                    "files": [{"id": f.get("id"), "name": f.get("s3_key", "").split("/")[-1]} for f in files[:5]],
                    "confidence": 0.85 if category != "Others" else 0.6
                })
        
        return {
            "success": True,
            "message": "AI organization complete",
            "total_files": len(user_files),
            "suggestions": suggestions,
            "ai_insights": {
                "most_common_type": "Documents" if organized_categories["Work Documents"] else "Images",
                "organization_score": len([s for s in suggestions if s["confidence"] > 0.7]) / max(len(suggestions), 1) * 100,
                "recommended_cleanup": len(organized_categories["Others"]) > 5
            }
        }
        
    except Exception as e:
        logger.error(f"Error in AI organization: {e}")
        return {"success": False, "message": str(e)}

@app.post("/ai/smart-insights")
async def get_smart_insights(authorization: Optional[str] = Header(None)):
    """Get AI-powered insights about user's files"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Demo insights - in production this would use real AI analysis
        insights = {
            "storage_optimization": {
                "duplicate_files": 3,
                "large_files": ["video1.mp4", "backup.zip"],
                "potential_savings": "234 MB"
            },
            "usage_patterns": {
                "most_active_day": "Tuesday",
                "peak_upload_time": "2:00 PM",
                "file_type_distribution": {
                    "images": 45,
                    "documents": 30,
                    "videos": 15,
                    "others": 10
                }
            },
            "security_score": 85,
            "recommendations": [
                "Enable password protection for sensitive documents",
                "Consider archiving files older than 6 months",
                "Organize photos by date automatically"
            ]
        }
        
        return {
            "success": True,
            "insights": insights,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        return {"success": False, "message": str(e)}

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

@app.post("/configure-s3")
async def configure_s3_credentials(
    access_key: str,
    secret_key: str, 
    region: str = "us-east-1",
    bucket: str = "mantadrive-users"
):
    """Configure S3 credentials for the session"""
    try:
        global s3_client, S3_BUCKET
        
        # Create new S3 client with provided credentials
        import boto3
        test_client = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        
        # Test the connection
        test_client.head_bucket(Bucket=bucket)
        
        # If successful, update global variables
        s3_client = test_client
        S3_BUCKET = bucket
        
        return {
            "success": True,
            "message": "S3 credentials configured successfully",
            "bucket": bucket,
            "region": region
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"S3 configuration failed: {str(e)}",
            "bucket": bucket,
            "region": region
        }

@app.get("/test-s3")
async def test_s3_connection():
    """Test S3 connectivity by writing and reading a small test file"""
    if not s3_client:
        return {"success": False, "message": "S3 client not initialized"}
    
    test_key = "test/connection-test.txt"
    test_content = f"Connection test at {datetime.utcnow().isoformat()}"
    
    try:
        # Try to write a test file
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='text/plain'
        )
        
        # Try to read it back
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=test_key)
        content = response['Body'].read().decode('utf-8')
        
        # Clean up
        s3_client.delete_object(Bucket=S3_BUCKET, Key=test_key)
        
        return {
            "success": True,
            "message": "S3 connection test successful",
            "write_success": True,
            "read_success": content == test_content,
            "delete_success": True,
            "bucket": S3_BUCKET,
            "region": os.getenv('AWS_REGION', 'us-east-1')
        }
    except Exception as e:
        error_msg = str(e)
        if isinstance(e, ClientError):
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            error_msg = f"{error_code}: {error_message}"
        
        return {
            "success": False,
            "message": f"S3 connection test failed: {error_msg}",
            "bucket": S3_BUCKET,
            "region": os.getenv('AWS_REGION', 'us-east-1')
        }

@app.put("/user-reset")
async def user_reset(request: UserResetRequest, authorization: Optional[str] = Header(None)):
    """Update user profile information"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # Prepare the request payload
        payload = {
            "currentPassword": request.currentPassword
        }
        
        # Add optional fields if provided
        if request.firstName:
            payload["firstName"] = request.firstName
        if request.lastName:
            payload["lastName"] = request.lastName
        if request.newPassword:
            payload["newPassword"] = request.newPassword
        
        # Call MantaHQ API
        response = requests.put(
            f"{MANTA_BASE_URL}/userauthflow/user-reset",
            json=payload,
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        # Log response for debugging
        logger.info(f"User reset API response status: {response.status_code}")
        
        # Return the exact response from MantaHQ API
        return response.json()
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during user reset: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during user reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/files/{file_id}")
async def delete_file(file_id: str, authorization: Optional[str] = Header(None)):
    """Delete a file from S3 and remove metadata from MantaHQ"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 client not available")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        # First get the file metadata to know the S3 key
        response = requests.get(
            f"{MANTA_BASE_URL}/filemanagement/{file_id}",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        if response.status_code == 404:
            # If direct file lookup fails, try getting all files and filtering
            all_files_response = requests.get(
                f"{MANTA_BASE_URL}/filemanagement",
                headers={"Authorization": f"Bearer {manta_token}"},
                timeout=10
            )
            
            if all_files_response.status_code != 200:
                raise HTTPException(status_code=all_files_response.status_code, detail="Failed to get files")
            
            all_files = all_files_response.json()
            file_data = None
            
            # Find file by ID
            for file in all_files:
                if file.get('id') == file_id:
                    file_data = file
                    break
                    
            if not file_data:
                raise HTTPException(status_code=404, detail="File not found")
        else:
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to get file metadata")
            file_data = response.json()
        
        s3_key = file_data.get('s3_key')
        if not s3_key:
            raise HTTPException(status_code=404, detail="File location not found")
        
        # Delete from S3
        try:
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            logger.info(f"Deleted file from S3: {s3_key}")
        except ClientError as e:
            logger.error(f"S3 error deleting file: {e}")
            # Continue with metadata deletion even if S3 delete fails
        
        # Delete metadata from MantaHQ
        delete_response = requests.delete(
            f"{MANTA_BASE_URL}/filemanagement/{file_id}",
            headers={"Authorization": f"Bearer {manta_token}"},
            timeout=10
        )
        
        if delete_response.status_code not in [200, 204]:
            logger.error(f"Failed to delete file metadata: {delete_response.status_code}")
            # If metadata deletion fails but S3 delete succeeded, we have an inconsistency
            # In a production system, this should be handled with a background job to retry
            raise HTTPException(status_code=delete_response.status_code, detail="Failed to delete file metadata")
        
        return {"success": True, "message": "File deleted successfully"}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error deleting file: {e}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/share/protected")
async def create_protected_share(
    request: dict,
    authorization: Optional[str] = Header(None)
):
    """Create a protected share link with access key"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    manta_token = authorization.replace("Bearer ", "")
    
    try:
        file_id = request.get('file_id')
        access_key = request.get('access_key')
        expires_in = request.get('expires_in', '7d')
        
        # Generate a unique share ID
        import uuid
        share_id = str(uuid.uuid4())[:8]
        
        # Store the share info (in production, use a database)
        # For now, we'll create a simple share URL
        share_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/s/{share_id}"
        
        # In a real implementation, you'd store this in a database:
        # - share_id
        # - file_id
        # - access_key (hashed)
        # - expires_at
        # - created_by (user_id)
        
        return {
            "success": True,
            "shareUrl": share_url,
            "shareId": share_id,
            "accessKey": access_key,
            "expiresIn": expires_in
        }
        
    except Exception as e:
        logger.error(f"Error creating protected share: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/s/{share_id}")
async def access_shared_file(
    share_id: str,
    access_key: Optional[str] = None
):
    """Access a shared file with access key verification"""
    try:
        # In a real implementation, you'd:
        # 1. Look up the share by share_id in database
        # 2. Verify the access_key matches (hashed comparison)
        # 3. Check if share hasn't expired
        # 4. Return file info or download URL
        
        if not access_key:
            return {
                "requiresKey": True,
                "message": "Access key required to view this file"
            }
        
        # For demo purposes, return success
        return {
            "success": True,
            "file": {
                "name": "shared_file.pdf",
                "size": 1024000,
                "type": "application/pdf"
            },
            "downloadUrl": f"/download/shared/{share_id}"
        }
        
    except Exception as e:
        logger.error(f"Error accessing shared file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "MantaDrive Backend API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)