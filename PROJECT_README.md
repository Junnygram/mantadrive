# MantaDrive - Advanced Cloud Storage Platform

A Google Drive alternative with advanced security features, AI-powered organization, and anonymous sharing capabilities.

## 🚀 Features

### Core Features
- **Instant Setup**: Personal cloud storage space created automatically upon registration
- **Single S3 Bucket Architecture**: Efficient file management with user-specific folders
- **Advanced Anonymous Sharing**: Share files without requiring recipient accounts
- **Multi-layer Security**: Password protection, access keys, time-based expiration, download limits

### Unique Differentiating Features
- **QR Code Generation**: Create QR codes for instant file sharing
- **AI-Powered Organization**: Smart file categorization and duplicate detection
- **Built-in File Processing**: Background removal, PDF tools, format conversion
- **Document Intelligence**: Invoice scanning and data extraction
- **Self-Destructing Files**: Automatic cleanup with expiration
- **Geographic Restrictions**: Location-based access control

## 🛠 Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: FastAPI + Python (integrates with MantaHQ)
- **Database**: MantaHQ Data Services (CRUD operations)
- **Storage**: AWS S3 (Single bucket with user folders)
- **Authentication**: JWT-based with automatic folder provisioning
- **AI Features**: Integrated processing services

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manta/qr-code/frontend
   ```

2. **Environment Setup**
   
   **Backend (.env in /qr-code/backend/)**:
   ```env
   MANTA_API_URL=https://api.mantahq.com
   MANTA_API_KEY=your_manta_api_key_here
   JWT_SECRET=your-super-secret-jwt-key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET=manta-drive-storage
   ```
   
   **Frontend (.env.local in /qr-code/frontend/)**:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Quick Start**
   ```bash
   # Run both frontend and backend
   ./start.sh
   ```
   
   **Or run separately:**
   ```bash
   # Backend
   cd qr-code/backend
   pip install -r requirements.txt
   python main.py
   
   # Frontend (new terminal)
   cd qr-code/frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🏗 Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # User authentication
│   │   └── register/       # User registration
│   ├── dashboard/
│   │   ├── ai/            # AI-powered features
│   │   └── page.js        # Main dashboard
│   ├── s/[id]/            # Anonymous file sharing
│   ├── layout.js          # Root layout
│   ├── page.js           # Landing page
│   └── globals.css       # Global styles
├── lib/
│   └── mantaApi.js       # MantaHQ API integration
└── components/           # Reusable components
```

## 🔧 Configuration

### MantaHQ Integration
The FastAPI backend integrates with MantaHQ's data services for:
- **Get Data**: Retrieve user and file information
- **Create Data**: Store new users and file records
- **Update Data**: Modify existing information
- **Delete Data**: Remove files and user data
- **Authentication Setup**: Secure signup and login APIs

The backend handles:
- JWT token generation and validation
- AWS S3 file storage with user-specific folders
- QR code generation for file sharing
- File upload and management
- Advanced sharing with security controls

### AWS S3 Setup
- Single bucket for the entire application
- User folders created automatically: `/user-{userID}/`
- Secure file access with presigned URLs
- Automatic cleanup for expired files

## 🎯 Key Features Implementation

### Anonymous Sharing System
- Generate unique shareable links: `yourapp.com/s/abc123xyz`
- Multiple protection layers:
  - Password protection
  - Access key/PIN requirements
  - Time-based expiration
  - Download limits
  - Geographic restrictions
  - One-time access

### AI-Powered Features
- **Smart Organization**: Automatic file categorization
- **Duplicate Detection**: Find and remove duplicate files
- **Background Removal**: AI-powered image processing
- **Text Extraction**: OCR for images and PDFs
- **Document Processing**: Invoice and document data extraction

### Security Features
- JWT-based authentication
- Encrypted file storage
- Access control with multiple protection layers
- Geographic restrictions
- Self-destructing files
- Audit logging

## 🚀 Deployment

### Development
```bash
# Quick start (both services)
./start.sh

# Or separately:
# Backend
cd qr-code/backend && python main.py

# Frontend
cd qr-code/frontend && npm run dev
```

### Production Build
```bash
# Frontend
cd qr-code/frontend
npm run build
npm start

# Backend
cd qr-code/backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment
```bash
docker build -t manta-drive .
docker run -p 3000:3000 manta-drive
```

## 📱 Usage

1. **Sign Up**: Create account with automatic S3 folder provisioning
2. **Upload Files**: Drag and drop or click to upload to your personal space
3. **Organize**: Use AI features to categorize and organize files
4. **Share**: Generate secure links with QR codes and custom protection
5. **Process**: Use built-in tools for file processing
6. **Manage**: View, download, and manage all your files

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User login
- `GET /user/profile` - Get user profile

### File Management
- `POST /files/upload` - Upload file to user's S3 folder
- `GET /files` - Get user's files
- `POST /files/{id}/share` - Create secure share link
- `POST /files/{id}/qr` - Generate QR code for file

### AI Features
- `POST /ai/organize` - Smart file organization
- `GET /ai/duplicates` - Detect duplicate files
- `POST /process/remove-background/{id}` - Remove image background

## 🔐 Security

- All files stored in encrypted S3 buckets
- User isolation with dedicated folders
- Secure sharing with multiple protection layers
- JWT token-based authentication
- Geographic access restrictions
- Automatic file expiration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**MantaDrive** - Secure cloud storage reimagined with AI-powered features and advanced sharing controls.