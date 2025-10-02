@echo off
echo ========================================
echo Installing APK on All Connected Devices
echo ========================================
echo.

set APK_PATH=app\build\outputs\apk\debug\app-debug.apk

echo Checking connected devices...
adb devices
echo.

echo Installing on all devices...
echo.

for /f "tokens=1" %%D in ('adb devices ^| findstr "device$"') do (
    echo Installing on device: %%D
    adb -s %%D install -r "%APK_PATH%"
    echo.
)

echo ========================================
echo Installation Complete!
echo ========================================
pause
