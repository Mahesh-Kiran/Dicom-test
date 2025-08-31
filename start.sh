#!/bin/bash

echo "🚀 Starting SAR Deep Zoom Viewer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "web/node_modules" ]; then
    echo "📦 Installing web dependencies..."
    cd web && npm install && cd ..
fi

# Start the server in the background
echo "🔧 Starting server..."
cd server && npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Start the web app
echo "🌐 Starting web application..."
cd web && npm run dev &
WEB_PID=$!
cd ..

echo "✅ Both servers are starting..."
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api/demo"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
