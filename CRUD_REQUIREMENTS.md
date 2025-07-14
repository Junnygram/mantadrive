# MantaDrive CRUD Operations & AWS Setup

## Backend CRUD Operations Needed

### 1. User Management
```
POST /api/workflow/olaleye/mantadrive/userauthflow/signup
POST /api/workflow/olaleye/mantadrive/userauthflow/login
PUT /api/workflow/olaleye/mantadrive/userauthflow/user-reset
GET /api/workflow/olaleye/mantadrive/userauthflow/profile
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
GET /api/workflow/olaleye/mantadrive/filemanagement/download/{fileId}
POST /api/workflow/olaleye/mantadrive/filemanagement/{fileId}/move
POST /api/workflow/olaleye/mantadrive/filemanagement/{fileId}/copy
```

### 3. File Sharing (Key/Phrase Protected)
```
POST /api/workflow/olaleye/mantadrive/filemanagement/share
POST /api/workflow/olaleye/mantadrive/filesharing/create-protected-link
POST /api/workflow/olaleye/mantadrive/filesharing/verify-access
GET /api/workflow/olaleye/mantadrive/filesharing/protected/{shareToken}
POST /api/workflow/olaleye/mantadrive/filesharing/{fileId}/qr-code
GET /api/workflow/olaleye/mantadrive/filesharing/links
DELETE /api/workflow/olaleye/mantadrive/filesharing/{shareId}
```

### 4. AI Features (Future)
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
  access_key_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  access_count INTEGER DEFAULT 0,
  max_access INTEGER DEFAULT 100,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## File Sharing System Requirements

### Key/Phrase Protection Flow
1. **Share Creation**: User selects file → generates key/phrase → creates protected share link
2. **Access Control**: Recipient needs key/phrase to view file
3. **Verification**: API validates key/phrase before granting access
4. **Security**: Keys stored hashed, expire after set time

### Dashboard States
- **Empty State**: Show "Share File" button prominently
- **Upload State**: Display spinner/loader during upload
- **Success State**: Show "View Files" button after upload
- **File Actions**: Three-dot menu with share/delete options

## Implementation Priority

### Phase 1 (Core Features) ✅ COMPLETED
1. User signup/login with S3 folder creation
2. File upload/download/delete
3. Basic file listing
4. User profile management with password reset

### Phase 2 (Sharing Features) 🚧 IN PROGRESS
1. Key/phrase protected file sharing
2. QR code generation for shares
3. Access verification system
4. Share management dashboard

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

# MantaHQ API Configuration
MANTA_BASE_URL=https://api.mantahq.com/api/workflow/olaleye/mantadrive
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Security
JWT_SECRET=your_jwt_secret
SHARE_KEY_SALT=your_share_key_salt
```

## Testing Checklist
- [x] User can signup and folder is created in S3
- [x] User can login and receive JWT token
- [x] Files upload to correct user folder
- [x] Files can be downloaded and deleted
- [x] User profile updates work with password verification
- [ ] Key/phrase protected sharing works
- [ ] QR codes generate for protected shares
- [ ] Access verification prevents unauthorized access
- [ ] Share links expire correctly
- [ ] Dashboard shows correct states (empty/upload/success)
- [ ] Three-dot menu actions work
- [ ] AI features process files correctly
- [ ] User data is secure and isolated

## Current Backend Endpoints (Implemented)
```
✅ POST /signup - User registration with S3 folder creation
✅ POST /login - User authentication
✅ PUT /user-reset - Profile updates with password verification
✅ POST /upload - File upload with progress tracking
✅ GET /files - List user files
✅ GET /download/{fileId} - Download files
✅ POST /share - Create share links
✅ POST /qrcode - Generate QR codes
✅ POST /create-user-folders - Manual S3 folder creation
✅ GET /health - System health check
```

## File Upload Architecture

### Hybrid S3 + MantaHQ Approach
1. **Upload Flow**: File → S3 Storage → MantaHQ Metadata
2. **Download Flow**: MantaHQ Metadata → S3 Presigned URL → Direct Download
3. **Benefits**: Fast uploads, secure access, metadata tracking

### Upload Process
```
1. Frontend uploads file to backend
2. Backend uploads file to S3 (user-{username}/{filename})
3. Backend registers metadata with MantaHQ:
   - filename
   - s3_url
   - s3_key  
   - content_type
   - size
4. If MantaHQ fails, S3 file is cleaned up
5. Return success/error to frontend
```

### Download Process
```
1. Frontend requests download
2. Backend gets file metadata from MantaHQ
3. Backend generates S3 presigned URL (1 hour expiry)
4. Frontend downloads directly from S3
```

## Next Implementation Steps
1. Add key/phrase protection to sharing system
2. Implement access verification endpoint
3. Update dashboard for empty/upload/success states
4. Add three-dot menu with share actions
5. Implement share management interface