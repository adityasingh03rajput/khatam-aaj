@echo off
echo ========================================
echo Build and Install on All Devices
echo ========================================
echo.

echo Step 1: Building APK...
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful!
echo ========================================
echo.

echo Step 2: Installing on all connected devices...
echo.

set APK_PATH=app\build\outputs\apk\debug\app-debug.apk

echo Checking connected devices...
adb devices
echo.

for /f "tokens=1" %%D in ('adb devices ^| findstr "device$"') do (
    echo Installing on device: %%D
    adb -s %%D install -r "%APK_PATH%"
    if %ERRORLEVEL% EQU 0 (
        echo Success on %%D
    ) else (
        echo Failed on %%D
    )
    echo.
)

echo ========================================
echo All Done!
echo ========================================
echo.
echo Server is running on: http://192.168.246.31:3000
echo Both devices should now connect automatically
echo.
pause
