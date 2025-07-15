# S3 Configuration for MantaDrive

## Current Issue
The S3 upload is failing because AWS credentials are not properly configured.

## Quick Fix Options:

### Option 1: Update .env file
Edit `/backend/.env` with your actual AWS credentials:

```env
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=mantadrive-users
```

### Option 2: Use Runtime Configuration
Call the configure S3 endpoint:

```bash
curl -X POST "http://localhost:8001/configure-s3" \
  -H "Content-Type: application/json" \
  -d '{
    "access_key": "your-actual-access-key",
    "secret_key": "your-actual-secret-key",
    "region": "us-east-1",
    "bucket": "mantadrive-users"
  }'
```

### Option 3: AWS CLI Configuration
If you have AWS CLI configured, the backend should automatically pick up credentials from:
- `~/.aws/credentials`
- `~/.aws/config`

## Expected Bucket Structure
Your uploads will be stored at:
```
s3://mantadrive-users/
  └── user-{username}/
      ├── images/
      ├── documents/
      ├── videos/
      ├── audio/
      └── others/
```

## Test Upload
After configuring credentials, test with:
```bash
curl -X POST "http://localhost:8001/upload" \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@/path/to/test-file.jpg"
```

## Fallback Mode
If S3 fails, the system will:
1. Still register metadata in MantaHQ
2. Use demo URLs for file locations
3. Log errors for debugging
4. Continue functioning for demonstration purposes