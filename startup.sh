#!/bin/bash

echo "🚀 Starting MantaDrive Full-Stack Application"

# Start backend
echo "📡 Starting FastAPI Backend..."
cd backend
python -m pip install -r requirements.txt
python main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🌐 Starting Next.js Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ MantaDrive is running!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"

# Wait for user input to stop
echo "Press any key to stop the application..."
read -n 1

# Kill processes
echo "🛑 Stopping application..."
kill $BACKEND_PID
kill $FRONTEND_PID

echo "✅ Application stopped"