@echo off
echo 🚀 Starting SAR Deep Zoom Viewer...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies if node_modules doesn't exist
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    npm install
    cd ..
)

if not exist "web\node_modules" (
    echo 📦 Installing web dependencies...
    cd web
    npm install
    cd ..
)

echo 🔧 Starting server...
start "SAR Deep Zoom Server" cmd /k "cd server && npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

echo 🌐 Starting web application...
start "SAR Deep Zoom Web" cmd /k "cd web && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:3000
echo 📚 API Docs: http://localhost:3000/api/demo
echo.
echo Press any key to exit...
pause >nul
