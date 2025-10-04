@echo off
color 0B
title LetsBunk - Easy Setup Wizard

echo.
echo ========================================
echo    LetsBunk Easy Setup Wizard
echo ========================================
echo.
echo This wizard will help you set up everything in 5 easy steps!
echo.
pause

:: Step 1: Start Server
:STEP1
cls
echo ========================================
echo  Step 1/5: Starting Server
echo ========================================
echo.
echo Starting the LetsBunk server...
cd server
start "LetsBunk Server" cmd /k "node server.js"
cd ..
timeout /t 3 >nul
echo.
echo [OK] Server started on http://192.168.89.31:3000
echo.
pause

:: Step 2: Load Sample Data
:STEP2
cls
echo ========================================
echo  Step 2/5: Loading Sample Data
echo ========================================
echo.
echo Loading sample students, teachers, and timetables...
echo.
curl -X POST http://192.168.89.31:3000/api/setup/sample-data -H "Content-Type: application/json" 2>nul
echo.
echo [OK] Sample data loaded:
echo   - 4 Students (2024CSE001, 2024CSE002, 2024ECE001, 2024ME001)
echo   - 2 Teachers (Dr. Smith, Prof. Johnson)
echo   - 1 Timetable (CSE Semester 5)
echo   - Password for all students: student123
echo.
pause

:: Step 3: Configure WiFi
:STEP3
cls
echo ========================================
echo  Step 3/5: Configuring WiFi Mappings
echo ========================================
echo.
echo Setting up classroom WiFi mappings...
echo.
curl -X POST http://192.168.89.31:3000/api/setup/wifi-mappings -H "Content-Type: application/json" 2>nul
echo.
echo [OK] WiFi mappings configured:
echo   - Room A101 -^> CSE Sem 5 -^> BSSID: ee:ee:6d:9d:6f:ba
echo   - Room B201 -^> ECE Sem 5 -^> BSSID: aa:bb:cc:dd:ee:ff
echo   - Room C301 -^> ME Sem 5  -^> BSSID: 11:22:33:44:55:66
echo.
echo Students will auto-detect correct WiFi!
echo.
pause

:: Step 4: Open Admin Panel
:STEP4
cls
echo ========================================
echo  Step 4/5: Opening Admin Panel
echo ========================================
echo.
echo Launching the admin panel...
cd "admin panel"
start "Admin Panel" java -cp ".;json.jar" AdvancedAdminPanel
cd ..
timeout /t 2 >nul
echo.
echo [OK] Admin panel opened!
echo.
echo Login credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause

:: Step 5: Quick Guide
:STEP5
cls
echo ========================================
echo  Step 5/5: Quick Guide
echo ========================================
echo.
echo Setup Complete! Here's what you can do now:
echo.
echo IN THE ADMIN PANEL:
echo.
echo 1. VIEW SAMPLE DATA
echo    - Click "View All Students" to see loaded students
echo    - Click "View All Teachers" to see loaded teachers
echo.
echo 2. CREATE NEW PROFILES
echo    - Click "Create Student Profile" to add new students
echo    - Click "Create Teacher Profile" to add new teachers
echo.
echo 3. MANAGE TIMETABLES
echo    - Click "Create Timetable" to make new timetables
echo    - Click "View Timetables" to see existing ones
echo.
echo 4. CONFIGURE WIFI
echo    - Click "Classroom WiFi Map" to see all mappings
echo    - Click "Assign Classrooms" to add more rooms
echo.
echo 5. POST NOTICES
echo    - Click "Post Notice" to send announcements
echo    - All students will receive push notifications!
echo.
echo 6. MONITOR ATTENDANCE
echo    - Click "Live Monitoring" to see active students
echo    - Real-time updates every 5 seconds
echo.
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Login to admin panel (admin / admin123)
echo 2. Explore the sample data
echo 3. Try creating a new student
echo 4. Test the mobile app with sample student
echo.
echo For detailed help, check README.md
echo.
echo ========================================
pause

:: Final Screen
cls
echo.
echo ========================================
echo   Setup Wizard Complete!
echo ========================================
echo.
echo Your LetsBunk system is ready to use!
echo.
echo Server: http://192.168.89.31:3000
echo Admin Panel: Running
echo Sample Data: Loaded
echo.
echo Press any key to exit...
pause >nul
exit
