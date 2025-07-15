#!/bin/bash

echo "🚀 Setting up MantaDrive environment..."

# Create the backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env file..."
    cat > backend/.env << 'EOF'
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=mantadrive-users

# MantaHQ Configuration  
MANTA_BASE_URL=https://api.mantahq.com/api/workflow/olaleye/mantadrive
EOF
    echo "✅ Created backend/.env file"
else 
    echo "✅ backend/.env file already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Edit backend/.env and add your AWS credentials:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - Verify S3_BUCKET_NAME exists or create it"
echo ""
echo "2. Verify your MantaHQ workflow endpoint is correct"
echo ""
echo "3. Run the backend:"
echo "   cd backend && python main.py"
echo ""
echo "4. Test the upload functionality"
echo ""
echo "📝 Common issues:"
echo "- Make sure your S3 bucket exists and is accessible"
echo "- Verify MantaHQ API endpoint is correct"
echo "- Check that your JWT token is valid for MantaHQ"