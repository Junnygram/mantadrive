#!/bin/bash

# Deploy MantaDrive on EC2
# This script should be run after installing Docker and Docker Compose

# Exit on error
set -e

# Create .env file with required environment variables
echo "Creating environment variables..."
cat > .env << EOL
# Backend settings
MANTA_BASE_URL=https://api.mantahq.com
S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Frontend settings
NEXT_PUBLIC_API_URL=http://localhost:8000
EOL

echo "Please edit the .env file with your actual credentials"
echo "Then run: docker-compose -f docker-compose.prod.yml up -d"

# Pull the latest code (if using git)
# git pull origin main

# Build and start the containers in detached mode
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete! Your application should be running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Backend API is available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"