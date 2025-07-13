# MantaDrive Setup Guide

## Multi-Step Signup Integration

### Backend Setup

1. **API Endpoint**: `https://api.mantahq.comhttps://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow
        /signup`
2. **Request Format**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "password": "password123"
}
```

### User Bucket Creation

When a user signs up successfully, the backend should:

1. **Create user folder in S3 bucket**:

```javascript
// Backend implementation
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function createUserBucket(username) {
  const params = {
    Bucket: 'mantadrive-users',
    Key: `${username}/welcome.txt`,
    Body: `Welcome to MantaDrive, ${username}!`,
    ContentType: 'text/plain',
  };

  await s3.upload(params).promise();
}
```

2. **Database entry**:

```sql
INSERT INTO users (firstName, lastName, username, password_hash, bucket_path, created_at)
VALUES (?, ?, ?, ?, ?, NOW());
```

### Frontend Integration

1. **Import component**:

```javascript
import MultiStepSignup from '../components/MultiStepSignup';
```

2. **Use in page**:

```javascript
export default function SignupPage() {
  return <MultiStepSignup />;
}
```

### Testing Setup

1. **Start development server**:

```bash
cd "MantaDrive /frontend"
npm run dev
```

2. **Test URLs**:

- Signup: `http://localhost:3000/signup`
- Login: `http://localhost:3000/login`

3. **Test Flow**:

- Step 1: Enter first name + last name → Click "Next"
- Step 2: Enter username + password → Click "Create Account"
- Check network tab for API call to backend
- Verify user folder created in S3 bucket

### Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=https://api.mantahq.com/api/workflow/olaleye/mantadrive
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=mantadrive-users
```

### Backend Response Format

**Success (201)**:

```json
{
  "message": "User created successfully",
  "userId": "12345",
  "bucketPath": "johndoe/"
}
```

**Error (400)**:

```json
{
  "error": "Username already exists"
}
```
