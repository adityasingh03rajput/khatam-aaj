@echo off
echo ========================================
echo  Firewall Fix for LetsBunk Server
echo ========================================
echo.
echo This will allow Node.js server to accept
echo connections from mobile devices.
echo.
echo Checking for administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires administrator privileges!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo Adding firewall rule for port 3000...
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000

if %errorLevel% equ 0 (
    echo.
    echo ✓ Firewall rule added successfully!
    echo.
    echo Port 3000 is now open for incoming connections.
    echo Mobile devices should now be able to connect.
) else (
    echo.
    echo ✗ Failed to add firewall rule
    echo Please check Windows Firewall settings manually.
)

echo.
echo ========================================
echo  Testing Server Connection
echo ========================================
echo.
echo Testing from localhost...
curl -s http://localhost:3000/api/health
echo.
echo.
echo Testing from network IP...
curl -s http://192.168.89.31:3000/api/health
echo.

echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Restart the server (already running)
echo 2. Open LetsBunk app on mobile device
echo 3. Check connection status (should show "Connected")
echo 4. Try biometric registration again
echo.

pause
