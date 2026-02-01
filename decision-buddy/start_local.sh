#!/bin/bash

# Decision Buddy - Local Setup Script
echo "🚀 Starting Decision Buddy locally..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Check if CLAUDE_API_KEY is set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "⚠️  Warning: CLAUDE_API_KEY environment variable is not set."
    echo "   The app will still work with basic analysis, but won't have AI features."
    echo "   To set it: export CLAUDE_API_KEY='your_api_key_here'"
fi

# Start the backend server
echo "🖥️  Starting backend server on http://localhost:5003..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Go back to root directory
cd ..

# Check if we have a simple HTTP server available
if command -v python3 &> /dev/null; then
    echo "🌐 Starting frontend server on http://localhost:8000..."
    cd frontend
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
    cd ..
elif command -v python &> /dev/null; then
    echo "🌐 Starting frontend server on http://localhost:8000..."
    cd frontend
    python -m SimpleHTTPServer 8000 &
    FRONTEND_PID=$!
    cd ..
else
    echo "❌ Cannot start frontend server. Please install Python or serve the frontend manually."
    exit 1
fi

echo ""
echo "✅ Decision Buddy is now running locally!"
echo ""
echo "🌐 Frontend: http://localhost:8000"
echo "🖥️  Backend:  http://localhost:5003"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped!"
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for user to stop the script
wait
