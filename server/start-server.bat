@echo off
echo ========================================
echo Let's Bunk Server Starter
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo ========================================
echo Starting Let's Bunk Server...
echo ========================================
echo Server will run on: http://localhost:3000
echo Authorized BSSID: 192.168.246.31
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node server.js

pause
