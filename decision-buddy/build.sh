#!/bin/bash

# Build script for Render deployment
echo "🚀 Building Decision Buddy for production..."

# For the backend, just ensure dependencies are installed
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# For the frontend, no build needed (static files)
echo "✅ Frontend ready (static files)"

echo "✅ Build complete!"
