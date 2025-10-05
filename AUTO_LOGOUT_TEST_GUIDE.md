# Auto-Logout Testing Guide

## How It Works Now

The auto-logout happens when the **WebSocket connects**, not during login. This is because:
1. Login happens via REST API (no real-time connection yet)
2. WebSocket connects after login in MainActivity
3. When WebSocket connects, it registers the student with their deviceId
4. Server checks if another device is already connected
5. If yes, server sends force-logout to the old device

## Testing Steps

### Test 1: Basic Auto-Logout

1. **Device 1 (Vivo)**:
   - Open the app
   - Login with student ID (e.g., 0246cs231021)
   - Wait for "✓ Connected to server" toast
   - Keep the app open

2. **Device 2 (itel)**:
   - Open the app
   - Login with the SAME student ID (0246cs231021)
   - Wait for "✓ Connected to server" toast

3. **Expected Result**:
   - Device 1 should show a dialog: "You have been logged out because you logged in from another device"
   - Device 1 should redirect to login screen
   - Device 2 should work normally

### Test 2: With Timer Running

1. **Device 1**:
   - Login
   - Connect to authorized WiFi
   - Start attendance timer
   - Timer runs (e.g., 9:30 remaining)

2. **Device 2**:
   - Login with same ID
   - Wait for connection

3. **Expected Result**:
   - Device 1 logs out automatically
   - Device 2 loads timer state and resumes from 9:30

### Test 3: Reconnection

1. **Device 1**:
   - Login
   - Close app (don't logout)

2. **Device 2**:
   - Login with same ID

3. **Device 1**:
   - Reopen app (auto-login from saved credentials)

4. **Expected Result**:
   - Device 2 should be logged out
   - Device 1 should work normally

## Debugging

If auto-logout doesn't work, check server console for these messages:

```
✓ Student 0246cs231021 registered with socket abc123 on device xyz789
⚠️ Device conflict detected for 0246cs231021!
   Old device: xyz789, Old socket: abc123
   New device: def456, New socket: ghi789
   Sending force-logout to old socket: abc123
```

## Common Issues

### Issue 1: No logout happening
**Cause**: WebSocket not connecting
**Solution**: Check if "✓ Connected to server" toast appears

### Issue 2: Both devices stay logged in
**Cause**: Server not detecting device conflict
**Solution**: Check server logs for "Device conflict detected" message

### Issue 3: Logout happens but no dialog
**Cause**: WebSocket listener not set up
**Solution**: Check if setupWebSocketListeners() is called in MainActivity

## Server Logs to Watch

The server will log:
- `Client connected: [socket-id]` - When any client connects
- `Student [id] registered with socket [socket-id] on device [device-id]` - When student registers
- `⚠️ Device conflict detected` - When same user logs in from different device
- `Sending force-logout to old socket` - When force-logout is sent

## Network Requirements

- Both devices must be able to connect to the server
- Server must be running on: http://192.168.89.31:3000
- WebSocket must be able to connect (not blocked by firewall)
