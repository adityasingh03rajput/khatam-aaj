@echo off
echo ========================================
echo  LetsBunk Complete Startup
echo ========================================
echo.

echo [1/4] Checking server status...
curl -s http://192.168.89.31:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Server is running
) else (
    echo ✗ Server not running - Starting server...
    start "LetsBunk Server" cmd /k "cd server && node server.js"
    timeout /t 3 >nul
)

echo.
echo [2/4] Starting Admin Panel...
start "LetsBunk Admin Panel" cmd /k "cd admin panel && java -cp .;json.jar AdvancedAdminPanel"

echo.
echo [3/4] Checking device connection...
adb devices | findstr "device$" >nul
if %errorlevel% equ 0 (
    echo ✓ Device connected
    echo.
    echo [4/4] Installing APK...
    adb install -r app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Launching app...
    adb shell am start -n com.example.letsbunk/.MainActivity
    echo.
    echo Starting log monitor...
    echo Press Ctrl+C to stop monitoring
    adb logcat -s NetworkManager:D MainActivity:D
) else (
    echo ✗ No device connected
    echo.
    echo Please connect your Android device:
    echo 1. Enable USB Debugging on your device
    echo 2. Connect via USB cable
    echo 3. Accept USB debugging prompt
    echo 4. Run this script again
)

echo.
pause
