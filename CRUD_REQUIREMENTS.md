# MantaDrive CRUD Operations & AWS Setup

## Backend CRUD Operations Needed

### 1. User Management
```
POST /api/workflow/olaleye/mantadrive/userauthflow/signup
POST /api/workflow/olaleye/mantadrive/userauthflow/login
GET /api/workflow/olaleye/mantadrive/userauthflow/profile
PUT /api/workflow/olaleye/mantadrive/userauthflow/profile
DELETE /api/workflow/olaleye/mantadrive/userauthflow/account
POST /api/workflow/olaleye/mantadrive/userauthflow/logout
POST /api/workflow/olaleye/mantadrive/userauthflow/refresh-token
```

### 2. File Management
```
POST /api/workflow/olaleye/mantadrive/filemanagement/upload
GET /api/workflow/olaleye/mantadrive/filemanagement/list
GET /api/workflow/olaleye/mantadrive/filemanagement/{fileId}
PUT /api/workflow/olaleye/mantadrive/filemanagement/{fileId}
DELETE /api/workflow/olaleye/mantadrive/filemanagement/{fileId}
POST /api/workflow/olaleye/mantadrive/filemanagement/{fileId}/download
POST /api/workflow/olaleye/mantadrive/filemanagement/{fileId}/move
POST /api/workflow/olaleye/mantadrive/filemanagement/{fileId}/copy
```

### 3. File Sharing
```
POST /api/workflow/olaleye/mantadrive/filesharing/create-link
GET /api/workflow/olaleye/mantadrive/filesharing/links
DELETE /api/workflow/olaleye/mantadrive/filesharing/{shareId}
POST /api/workflow/olaleye/mantadrive/filesharing/{fileId}/qr-code
GET /api/workflow/olaleye/mantadrive/filesharing/public/{shareToken}
POST /api/workflow/olaleye/mantadrive/filesharing/{shareId}/password
```

### 4. AI Features
```
POST /api/workflow/olaleye/mantadrive/aiprocessing/organize-files
POST /api/workflow/olaleye/mantadrive/aiprocessing/detect-duplicates
POST /api/workflow/olaleye/mantadrive/aiprocessing/extract-text
POST /api/workflow/olaleye/mantadrive/aiprocessing/remove-background
POST /api/workflow/olaleye/mantadrive/aiprocessing/convert-file
POST /api/workflow/olaleye/mantadrive/aiprocessing/compress-file
GET /api/workflow/olaleye/mantadrive/aiprocessing/job-status/{jobId}
```

### 5. Folder Management
```
POST /api/workflow/olaleye/mantadrive/foldermanagement/create
GET /api/workflow/olaleye/mantadrive/foldermanagement/list
PUT /api/workflow/olaleye/mantadrive/foldermanagement/{folderId}
DELETE /api/workflow/olaleye/mantadrive/foldermanagement/{folderId}
POST /api/workflow/olaleye/mantadrive/foldermanagement/{folderId}/move
GET /api/workflow/olaleye/mantadrive/foldermanagement/{folderId}/contents
```

## AWS Setup Requirements

### 1. S3 Bucket Configuration
```bash
# Create main bucket
aws s3 mb s3://mantadrive-users

# Set bucket policy for user folders
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT:user/mantadrive-service"},
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::mantadrive-users/*"
    }
  ]
}
```

### 2. IAM User & Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::mantadrive-users",
        "arn:aws:s3:::mantadrive-users/*"
      ]
    }
  ]
}
```

### 3. User Folder Structure
```
mantadrive-users/
├── username1/
│   ├── documents/
│   ├── images/
│   ├── videos/
│   └── others/
├── username2/
│   ├── documents/
│   ├── images/
│   ├── videos/
│   └── others/
```

## Database Schema (if using database)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bucket_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Files Table
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  folder_path VARCHAR(255),
  is_shared BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Shared_Links Table
```sql
CREATE TABLE shared_links (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(id),
  share_token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Priority

### Phase 1 (Core Features)
1. User signup/login with S3 folder creation
2. File upload/download/delete
3. Basic file listing
4. User profile management

### Phase 2 (Sharing Features)
1. File sharing with links
2. QR code generation
3. Password protection
4. Download limits

### Phase 3 (AI Features)
1. File organization
2. Duplicate detection
3. Text extraction
4. Background removal
5. File conversion

## Environment Variables Needed
```
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=mantadrive-users

# Database (if using)
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT
JWT_SECRET=your_jwt_secret

# API Configuration
API_BASE_URL=https://api.mantahq.com/api/workflow/olaleye/mantadrive
NEXT_PUBLIC_SIGNUP_ENDPOINT=https://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow/signup
NEXT_PUBLIC_LOGIN_ENDPOINT=https://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow/login
```

## Testing Checklist
- [ ] User can signup and folder is created in S3
- [ ] User can login and receive JWT token
- [ ] Files upload to correct user folder
- [ ] Files can be downloaded and deleted
- [ ] Share links work correctly
- [ ] QR codes generate properly
- [ ] AI features process files correctly
- [ ] User data is secure and isolated