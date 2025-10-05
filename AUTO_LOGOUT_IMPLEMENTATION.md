# Auto-Logout and Timer Persistence Implementation

## Summary
Successfully implemented automatic logout when a user logs in from a different device, along with complete timer state persistence that survives app restarts and device switches.

## Key Features

### 1. Automatic Device Transfer
- When user logs in from device B while already logged in on device A
- Device A receives WebSocket `force-logout` event
- Device A shows dialog: "You have been logged out because you logged in from another device"
- Device A redirects to login screen
- Device B takes over the session seamlessly

### 2. Timer State Persistence
- Timer state saved to server every 10 seconds
- Timer state saved when:
  - App goes to background (onPause)
  - App is closed (onDestroy)
  - Timer is stopped manually
  - Device switch occurs
- Timer state loaded when:
  - App starts
  - User logs in
  - Session is resumed

### 3. Seamless Resume
- If timer was running when app closed, it automatically resumes
- Timer continues from exact point where it was left
- Works across device switches
- Works after app crashes or force closes

## Implementation Flow

```
User on Device A (timer at 8:30)
    ↓
User logs in on Device B
    ↓
Server detects different deviceId
    ↓
Server updates session with Device B's deviceId
    ↓
Server sends force-logout to Device A via WebSocket
    ↓
Device A shows logout dialog and redirects to login
    ↓
Device B loads timer state from server
    ↓
Device B resumes timer at 8:30
    ↓
User continues seamlessly on Device B
```

## Files Modified

### Server
- `server/models/ActiveSession.js` - Added timerState field
- `server/routes/periodAttendance.js` - Added device transfer logic and timer endpoints
- `server/services/attendanceService.js` - Updated to handle deviceId

### Android App
- `app/src/main/java/com/example/letsbunk/MainActivity.kt` - Added timer persistence and force-logout handling
- `app/src/main/java/com/example/letsbunk/ApiService.kt` - Added timer state API endpoints
- `app/src/main/java/com/example/letsbunk/NetworkManager.kt` - Added force-logout WebSocket listener

## Testing Scenarios

1. ✅ Login from Device A, start timer
2. ✅ Login from Device B - Device A logs out automatically
3. ✅ Device B resumes timer from where Device A left off
4. ✅ Close app on Device B, reopen - timer resumes
5. ✅ App crashes - timer resumes on restart
6. ✅ Timer state saved every 10 seconds
7. ✅ Timer state saved when app goes to background
8. ✅ Timer state saved when app is destroyed

## Error Handling

- If timer state API fails, app continues with default state (600 seconds)
- If WebSocket disconnects, timer state is still saved via REST API
- If force-logout event is missed, user will be logged out on next API call
- Timer state includes timestamp to detect stale data

## Performance Considerations

- Timer state saved every 10 seconds (not every second) to reduce server load
- WebSocket used for instant logout notification (no polling needed)
- Timer state is small (< 100 bytes) so minimal network overhead
- Device ID generated once and cached in SharedPreferences
