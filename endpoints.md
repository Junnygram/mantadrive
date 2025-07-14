# MantaDrive API Endpoints

This document outlines all the endpoints required for MantaDrive application and the AWS services needed.

## Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/auth/register` | Register a new user | `{ "username": "string", "email": "string", "password": "string", "name": "string" }` | `{ "id": "string", "username": "string", "email": "string", "name": "string", "token": "string" }` |
| `POST` | `/auth/login` | Login a user | `{ "username": "string", "password": "string" }` | `{ "token": "string", "user": { "id": "string", "username": "string", "name": "string" } }` |

## User Endpoints

| Method | Endpoint | Description | Headers | Response |
|--------|----------|-------------|---------|----------|
| `GET` | `/user/profile` | Get user profile | `Authorization: Bearer {token}` | `{ "id": "string", "username": "string", "email": "string", "name": "string", "storageUsed": "number", "storageLimit": "number" }` |

## File Management Endpoints

| Method | Endpoint | Description | Headers | Request | Response |
|--------|----------|-------------|---------|---------|----------|
| `GET` | `/files` | List all user files | `Authorization: Bearer {token}` | - | `[ { "id": "string", "name": "string", "type": "string", "size": "number", "createdAt": "string", "updatedAt": "string" } ]` |
| `POST` | `/files/upload` | Upload a new file | `Authorization: Bearer {token}` | `FormData with 'file' field` | `{ "id": "string", "name": "string", "type": "string", "size": "number", "createdAt": "string" }` |
| `DELETE` | `/files/{fileId}` | Delete a file | `Authorization: Bearer {token}` | - | `{ "message": "File deleted successfully" }` |
| `GET` | `/files/{fileId}/download` | Download a file | `Authorization: Bearer {token}` | - | Binary file data with appropriate Content-Type |
| `GET` | `/files/{fileId}/preview` | Preview a file | `Authorization: Bearer {token}` | - | Binary file data or preview data with appropriate Content-Type |

## Sharing Endpoints

| Method | Endpoint | Description | Headers | Request Body | Response |
|--------|----------|-------------|---------|-------------|----------|
| `POST` | `/files/{fileId}/share` | Generate a sharing link | `Authorization: Bearer {token}` | `{ "protection": "none/password", "expiresIn": "string" }` | `{ "shareUrl": "string", "expiresAt": "string" }` |
| `POST` | `/files/{fileId}/qr` | Generate a QR code | `Authorization: Bearer {token}` | - | `{ "qrCode": "string" }` (Base64 encoded image) |
| `GET` | `/share/{shareId}` | Access a shared file | - | - | File data or redirect to download |

## AI Feature Endpoints (Future Implementation)

| Method | Endpoint | Description | Headers | Request Body | Response |
|--------|----------|-------------|---------|-------------|----------|
| `POST` | `/ai/organize` | Organize files using AI | `Authorization: Bearer {token}` | - | `{ "categories": [ { "name": "string", "files": [ { "id": "string", "name": "string" } ] } ] }` |
| `GET` | `/ai/duplicates` | Detect duplicate files | `Authorization: Bearer {token}` | - | `{ "duplicates": [ { "files": [ { "id": "string", "name": "string", "size": "number" } ] } ] }` |
| `POST` | `/ai/process/{fileId}` | Process document with AI | `Authorization: Bearer {token}` | `{ "type": "string" }` | Depends on processing type |
| `POST` | `/process/remove-background/{fileId}` | Remove background from image | `Authorization: Bearer {token}` | - | `{ "resultUrl": "string" }` |
| `POST` | `/process/convert/{fileId}` | Convert file format | `Authorization: Bearer {token}` | `{ "format": "string" }` | `{ "resultUrl": "string" }` |
| `POST` | `/process/extract-text/{fileId}` | Extract text from image/PDF | `Authorization: Bearer {token}` | - | `{ "text": "string" }` |

## AWS Services Required

### Core Services

1. **Amazon S3**
   - Create a bucket for file storage
   - Configure CORS to allow uploads from your frontend domain
   - Set up lifecycle policies for temporary files

2. **Amazon Cognito** (Optional, can use custom auth)
   - Set up a User Pool for authentication
   - Configure app client settings

3. **Amazon RDS** or **DynamoDB**
   - Store user metadata and file information
   - For RDS: PostgreSQL or MySQL recommended
   - For DynamoDB: Design tables for users, files, and shares

4. **Amazon API Gateway**
   - Create REST API endpoints
   - Configure routes to Lambda functions
   - Set up authorization

5. **AWS Lambda**
   - Implement endpoint logic
   - Handle file operations
   - Process authentication

6. **Amazon CloudFront**
   - Set up a distribution for serving files
   - Configure signed URLs for secure access

### AI Feature Services (Future)

1. **Amazon Rekognition**
   - Image analysis and categorization
   - Duplicate detection

2. **Amazon Textract**
   - Extract text from documents and images

3. **Amazon SageMaker**
   - Custom AI models for file organization

4. **AWS Lambda**
   - Process AI tasks asynchronously

## Setup Instructions

### S3 Bucket Setup

```bash
aws s3 mb s3://mantadrive-files --region us-east-1
aws s3api put-bucket-cors --bucket mantadrive-files --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
```

### IAM Role for Lambda

Create an IAM role with permissions for:
- S3 access
- DynamoDB/RDS access
- CloudWatch Logs

### API Gateway Configuration

1. Create a new REST API
2. Set up resources matching the endpoints above
3. Configure Lambda integrations
4. Enable CORS
5. Deploy to a stage

### Environment Variables

Set these in your Lambda functions:

```
S3_BUCKET_NAME=mantadrive-files
DB_CONNECTION_STRING=your-db-connection-string
JWT_SECRET=your-jwt-secret
```

## Implementation Notes

- Use presigned URLs for direct S3 uploads from the frontend
- Implement token-based authentication with JWT
- Store file metadata in the database, not just in S3
- Use S3 object lifecycle policies to manage storage
- Implement proper error handling and validation