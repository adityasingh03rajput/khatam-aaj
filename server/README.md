# Let's Bunk Server

Real-time attendance and timetable management server with WebSocket support.

## Features

- **Real-time Communication**: WebSocket-based updates using Socket.IO
- **REST API**: Full CRUD operations for attendance and timetable
- **BSSID Verification**: Authorized Wi-Fi network validation (192.168.246.31)
- **Live Timer Updates**: Server-side countdown for all connected students
- **Multi-client Support**: Multiple teachers and students can connect simultaneously

## Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**:
```bash
cd server
npm install
```

2. **Start the server**:
```bash
# Using the batch script (Windows)
start-server.bat

# Or manually
node server.js

# Or with auto-reload (development)
npm run dev
```

3. **Server will start on**:
```
http://localhost:3000
```

## Configuration

### Change Authorized BSSID
Edit `server.js` line 14:
```javascript
const AUTHORIZED_BSSID = "192.168.246.31"; // Change to your Wi-Fi BSSID
```

### Change Port
Edit `server.js` line 15:
```javascript
const PORT = 3000; // Change to desired port
```

## API Endpoints

### Configuration
- `GET /api/health` - Server health check
- `GET /api/config/bssid` - Get authorized BSSID

### BSSID Verification
- `POST /api/verify-bssid` - Verify if BSSID is authorized
  ```json
  Request: { "bssid": "192.168.246.31" }
  Response: { "authorized": true, "bssid": "...", "authorizedBSSID": "..." }
  ```

### Attendance
- `POST /api/attendance/start` - Start student attendance
  ```json
  Request: {
    "studentName": "John Doe",
    "department": "CSE",
    "room": "Room 101",
    "bssid": "192.168.246.31"
  }
  Response: {
    "success": true,
    "studentId": "1234567890",
    "message": "Attendance started",
    "student": { ... }
  }
  ```

- `POST /api/attendance/update` - Update student attendance
  ```json
  Request: {
    "studentId": "1234567890",
    "timeRemaining": 540,
    "isPresent": true
  }
  ```

- `POST /api/attendance/complete` - Mark attendance complete
  ```json
  Request: { "studentId": "1234567890" }
  ```

- `GET /api/attendance/list` - Get all active students
  ```json
  Response: {
    "students": [...],
    "count": 5,
    "timestamp": "2025-10-01T..."
  }
  ```

### Timetable
- `GET /api/timetable?branch=CSE&semester=3rd` - Get timetable (with optional filters)
- `POST /api/timetable` - Add new time slot
- `PUT /api/timetable/:id` - Update time slot
- `DELETE /api/timetable/:id` - Delete time slot

## WebSocket Events

### Server → Client Events

#### `initial-state`
Sent when client first connects
```json
{
  "students": [...],
  "timetable": [...],
  "authorizedBSSID": "192.168.246.31"
}
```

#### `student-connected`
When a student starts attendance
```json
{
  "id": "1234567890",
  "name": "John Doe",
  "department": "CSE",
  "room": "Room 101",
  "timeRemaining": 600,
  "isPresent": true,
  "startTime": "2025-10-01T...",
  "bssid": "192.168.246.31"
}
```

#### `student-timer-update`
Every second for each active student
```json
{
  "id": "1234567890",
  "name": "John Doe",
  "timeRemaining": 599,
  ...
}
```

#### `student-completed`
When student completes 10 minutes
```json
{
  "id": "1234567890",
  "name": "John Doe",
  "timeRemaining": 0,
  "completedAt": "2025-10-01T...",
  ...
}
```

#### `student-updated`
When student data is manually updated
```json
{ ... }
```

#### `student-disconnected`
When student disconnects
```json
{
  "id": "1234567890",
  "isPresent": false,
  "disconnectedAt": "2025-10-01T...",
  ...
}
```

#### `timetable-added`
When new time slot is added
```json
{
  "id": "1234567890",
  "day": "Monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "subject": "Data Structures",
  "room": "101",
  "branch": "CSE",
  "semester": "3rd Sem"
}
```

#### `timetable-updated`
When time slot is updated

#### `timetable-deleted`
When time slot is deleted
```json
{ "id": "1234567890" }
```

### Client → Server Events

#### `timer-update`
Client sends timer updates
```json
{
  "studentId": "1234567890",
  "timeRemaining": 599
}
```

#### `student-disconnect`
Client notifies of disconnect
```json
{
  "studentId": "1234567890"
}
```

## Android App Configuration

### For Emulator
The app is configured to use `http://10.0.2.2:3000` which maps to `localhost:3000` on your PC.

### For Real Device
1. Find your PC's IP address:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Update `NetworkManager.kt` line 14:
   ```kotlin
   private const val SERVER_URL = "http://192.168.1.100:3000"
   ```

3. Ensure both PC and device are on the same network

4. Allow firewall access to port 3000

## Testing

### Test Server Health
```bash
curl http://localhost:3000/api/health
```

### Test BSSID Verification
```bash
curl -X POST http://localhost:3000/api/verify-bssid \
  -H "Content-Type: application/json" \
  -d "{\"bssid\":\"192.168.246.31\"}"
```

### Test Start Attendance
```bash
curl -X POST http://localhost:3000/api/attendance/start \
  -H "Content-Type: application/json" \
  -d "{\"studentName\":\"Test Student\",\"department\":\"CSE\",\"room\":\"101\",\"bssid\":\"192.168.246.31\"}"
```

### Test Get Attendance List
```bash
curl http://localhost:3000/api/attendance/list
```

## How It Works

### Real-time Flow

1. **Student Phone A (Student Mode)**:
   - Connects to authorized Wi-Fi (BSSID: 192.168.246.31)
   - Starts attendance timer
   - Sends POST to `/api/attendance/start`
   - Server broadcasts `student-connected` event
   - Timer updates sent via WebSocket every second

2. **Teacher Phone B (Teacher Mode)**:
   - Connects to server via WebSocket
   - Receives `initial-state` with all active students
   - Listens for `student-timer-update` events
   - UI updates in real-time showing countdown

3. **Server**:
   - Validates BSSID (192.168.246.31)
   - Stores student data in memory
   - Broadcasts updates to all connected clients
   - Decrements timers every second
   - Notifies when students complete attendance

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill process using port 3000
taskkill /PID <PID> /F

# Or change port in server.js
```

### Can't connect from Android
1. Check firewall settings
2. Verify PC and device on same network
3. Use PC's IP address, not localhost
4. Check server is running: `curl http://localhost:3000/api/health`

### WebSocket not connecting
1. Check server logs for connection attempts
2. Verify Socket.IO client version matches server
3. Check network connectivity
4. Try restarting server

## Development

### Watch mode (auto-reload)
```bash
npm run dev
```

### View logs
Server logs all connections and events to console

### Add new endpoints
Edit `server.js` and add new routes in the API Routes section

## Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name letsbunk-server
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## License
Educational use only
