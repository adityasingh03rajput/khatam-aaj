# Single Device Per User Restriction with Auto-Logout & Timer Persistence

## Overview
Implemented a comprehensive system to ensure that one username can only be active on a single device at a time. When a user logs in from a new device, they are automatically logged out from the old device. The timer state is persisted and resumes from where it was left off, even if the app is closed or the device is switched.

## Changes Made

### Server-Side Changes

#### 1. ActiveSession Model (`server/models/ActiveSession.js`)
- Added `deviceId` field (required) to track which device the session is running on
- Added `timerState` object with:
  - `isRunning`: Boolean indicating if timer is active
  - `secondsRemaining`: Number of seconds left on timer
  - `lastUpdated`: Timestamp of last update

#### 2. Attendance Service (`server/services/attendanceService.js`)
- Updated `updateActiveSession()` to accept and store `deviceId` parameter
- Device ID is stored when creating or updating sessions

#### 3. Period Attendance Routes (`server/routes/periodAttendance.js`)
- Modified `/start` endpoint to:
  - Require `deviceId` in request body
  - Check if user already has an active session
  - If session exists on a different device:
    - Transfer session to new device
    - Send WebSocket `force-logout` event to old device
    - Return success with `transferred: true`
  - If session exists on same device, resume with saved timer state
- Modified `/checkin` endpoint to accept and pass `deviceId`
- Added `/timer/update` endpoint to save timer state
- Added `/timer/state/:studentId` endpoint to retrieve timer state

### Android App Changes

#### 1. MainActivity (`app/src/main/java/com/example/letsbunk/MainActivity.kt`)
- Added `deviceId` variable to store unique device identifier
- Added `getOrCreateDeviceId()` function that:
  - Generates a unique device ID using Android ID + timestamp
  - Creates SHA-256 hash for security
  - Stores in SharedPreferences for persistence
- Updated attendance start flow to include `deviceId` in API request
- Added `saveTimerState()` function to persist timer state to server
- Added `loadTimerState()` function to retrieve and resume timer state
- Modified `initTimer()` to:
  - Load saved timer state on startup
  - Save state every 10 seconds while running
  - Auto-resume if timer was running
- Added `onPause()` to save timer state when app goes to background
- Updated `onDestroy()` to save timer state before app closes
- Added WebSocket listener for `force-logout` event that:
  - Stops timer and saves state
  - Shows logout dialog
  - Redirects to login screen

#### 2. API Service (`app/src/main/java/com/example/letsbunk/ApiService.kt`)
- Added `deviceId` field to `StartAttendanceRequest` data class
- Added `TimerStateRequest` data class for saving timer state
- Added `TimerStateResponse` data class for retrieving timer state
- Added `TimerState` data class with running status and seconds remaining
- Added `updateTimerState()` API endpoint
- Added `getTimerState()` API endpoint

#### 3. NetworkManager (`app/src/main/java/com/example/letsbunk/NetworkManager.kt`)
- Added `onForceLogout()` WebSocket listener for handling remote logout events

## How It Works

### Device Management
1. **Device ID Generation**: When the app starts, it generates or retrieves a unique device ID
2. **Session Start**: When a student starts attendance, the device ID is sent to the server
3. **Duplicate Check**: Server checks if the user already has an active session
4. **Device Validation**: 
   - If session exists on the same device → Resume session with saved timer state
   - If session exists on a different device → Transfer session to new device and force logout old device
5. **Auto-Logout**: Old device receives a WebSocket event and is automatically logged out

### Timer Persistence
1. **State Saving**: Timer state (running/stopped, seconds remaining) is saved to server:
   - Every 10 seconds while running
   - When timer is stopped
   - When app goes to background (onPause)
   - When app is destroyed (onDestroy)
2. **State Loading**: When app starts or user logs in, timer state is loaded from server
3. **Resume**: If timer was running, it automatically resumes from the saved time

## Benefits

- **Security**: Prevents account sharing and simultaneous logins
- **Data Integrity**: Ensures accurate attendance tracking
- **Seamless Experience**: Automatic logout and session transfer between devices
- **Persistence**: Timer state survives app restarts, device switches, and crashes
- **User Convenience**: No need to restart timer when switching devices or reopening app
- **Reliability**: Timer state saved every 10 seconds prevents data loss

## Use Cases

### Scenario 1: User switches devices
1. User (0246cs231021) is logged in on device A (gt203922312) with timer running at 8:30
2. User logs in on device B (th4938832333)
3. Device A receives force-logout notification and logs out automatically
4. Device B loads timer state and resumes from 8:30
5. User continues attendance seamlessly on device B

### Scenario 2: App crashes or is closed
1. User has timer running at 5:45
2. App crashes or user closes it
3. Timer state (running, 5:45) is saved to server
4. User reopens app
5. Timer automatically resumes from 5:45

### Scenario 3: Device battery dies
1. User has timer running at 3:20
2. Device battery dies
3. User charges device and opens app
4. Timer resumes from 3:20 (or slightly less due to last save interval)

## Technical Details

- Device ID is a 32-character hash generated from Android ID and timestamp
- Device ID is stored in SharedPreferences with key "DEVICE_ID"
- Timer state is saved every 10 seconds to minimize data loss
- WebSocket `force-logout` event ensures instant logout on old device
- Session transfer is atomic - old device is logged out before new device takes over
- Old sessions from previous days are automatically cleaned up
- Timer state includes: isRunning (boolean), secondsRemaining (int), lastUpdated (timestamp)
