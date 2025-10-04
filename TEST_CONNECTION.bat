@echo off
echo ========================================
echo  Connection Test
echo ========================================
echo.

echo Testing PC IP Address...
ipconfig | findstr "IPv4" | findstr "192.168"
echo.

echo Testing Server Connection...
curl -s http://192.168.89.31:3000/api/health
echo.

echo Testing Device Connection...
adb devices
echo.

echo Testing Device Network (if connected)...
adb shell "ping -c 1 192.168.89.31" 2>nul
echo.

echo ========================================
echo  Connection Status Summary
echo ========================================
echo.

echo Server URL: http://192.168.89.31:3000
echo APK Location: app\build\outputs\apk\debug\app-debug.apk
echo.

echo Next Steps:
echo 1. Make sure device is on same WiFi (192.168.89.x)
echo 2. Run START_EVERYTHING.bat to launch all components
echo 3. Check admin panel for connected devices
echo.

pause
