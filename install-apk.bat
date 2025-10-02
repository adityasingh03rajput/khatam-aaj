@echo off
REM Set Android SDK path
set ANDROID_HOME=C:\Users\Victus\AppData\Local\Android\Sdk

echo ========================================
echo Let's Bunk APK Installation Script
echo ========================================
echo.

REM Check if device is connected
echo Checking for connected devices...
adb devices
echo.

echo Choose an option:
echo 1. Install Debug APK
echo 2. Install Release APK (unsigned)
echo 3. Build and Install Debug APK
echo 4. Build Release APK
echo 5. Uninstall App
echo 6. Launch App
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Installing Debug APK...
    adb install -r "app\build\outputs\apk\debug\app-debug.apk"
    echo Done!
)

if "%choice%"=="2" (
    echo Installing Release APK...
    adb install -r "app\build\outputs\apk\release\app-release-unsigned.apk"
    echo Done!
)

if "%choice%"=="3" (
    echo Building Debug APK...
    call gradlew.bat assembleDebug
    echo Installing Debug APK...
    adb install -r "app\build\outputs\apk\debug\app-debug.apk"
    echo Done!
)

if "%choice%"=="4" (
    echo Building Release APK...
    call gradlew.bat assembleRelease
    echo Done! APK location: app\build\outputs\apk\release\
)

if "%choice%"=="5" (
    echo Uninstalling app...
    adb uninstall com.example.letsbunk
    echo Done!
)

if "%choice%"=="6" (
    echo Launching app...
    adb shell am start -n com.example.letsbunk/.MainActivity
    echo Done!
)

echo.
pause
