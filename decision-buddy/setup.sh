#!/bin/bash

echo "🚀 Setting up Decision Buddy..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Run the backend: cd backend && source venv/bin/activate && python app.py"
echo "2. Open frontend/index.html in your browser"
echo ""
echo "The backend will run on http://localhost:5001"
echo "The frontend should be opened as a local file in your browser"
