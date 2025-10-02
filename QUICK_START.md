# Quick Start Guide - Let's Bunk

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- ✅ Node.js (v14+)
- ✅ MongoDB (v4.4+)
- ✅ Android Studio
- ✅ WiFi network with known BSSID

---

## Server Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/letsbunk
PORT=3000
AUTHORIZED_BSSID=ee:ee:6d:9d:6f:ba
```

### 3. Start MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 4. Start Server
```bash
npm start
```

**Server running at**: `http://localhost:3000`

---

## Android App Setup

### 1. Update Server URL
Edit `app/src/main/java/com/example/letsbunk/NetworkManager.kt`:
```kotlin
private const val SERVER_URL = "http://YOUR_PC_IP:3000"
```

**Find your PC IP:**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

### 2. Update BSSID
Get your WiFi BSSID:
- **Android**: Settings → WiFi → Advanced → BSSID
- **Windows**: `netsh wlan show interfaces`
- **Linux**: `iwconfig`

Update in `server/server.js`:
```javascript
let AUTHORIZED_BSSID = "YOUR_WIFI_BSSID";
```

### 3. Build & Install
```bash
# From project root
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or use Android Studio:
- Open project
- Click Run ▶️

---

## Testing the System

### 1. Start Server
```bash
cd server
npm start
```

You should see:
```
✓ Server running on port 3000
✓ MongoDB connection status: Connected
✓ Authorized BSSID: ee:ee:6d:9d:6f:ba
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T09:00:00.000Z",
  "connectedStudents": 0,
  "authorizedBSSID": "ee:ee:6d:9d:6f:ba"
}
```

### 3. Open Android App
1. Launch app on device
2. Select role: **Student** or **Teacher**
3. Connect to authorized WiFi

### 4. Test Student Attendance
**Student App:**
1. Enter name
2. Select department
3. Click "Mark Attendance"
4. Timer starts (10 minutes)

**Teacher App:**
1. See student appear in list
2. Monitor real-time timer
3. View attendance status

---

## Common Issues & Solutions

### ❌ "Server not connected"
**Solution:**
1. Check server is running: `npm start`
2. Verify IP address in NetworkManager.kt
3. Ensure phone and PC on same WiFi
4. Disable firewall temporarily

### ❌ "Unauthorized BSSID"
**Solution:**
1. Get correct BSSID from WiFi settings
2. Update `AUTHORIZED_BSSID` in server.js
3. Restart server

### ❌ "Database not connected"
**Solution:**
1. Start MongoDB: `net start MongoDB`
2. Check MongoDB URI in database.js
3. Verify MongoDB is running: `mongo --version`

### ❌ "Username already in use"
**Solution:**
1. Use different name
2. Wait for previous session to complete
3. Or clear attendance: `POST /api/attendance/clear-all`

---

## Key Features to Test

### ✅ Basic Attendance
1. Student marks attendance
2. Timer counts down
3. Teacher sees real-time updates
4. Completion notification

### ✅ WiFi Monitoring
1. Student marks attendance
2. Disconnect from WiFi
3. Timer pauses automatically
4. Reconnect to WiFi
5. Timer resumes

### ✅ Random Ring
1. Teacher clicks "Random Ring"
2. Select number of students
3. Selected students get notification
4. Student confirms presence
5. Teacher accepts/rejects

### ✅ Timetable Management
1. Teacher adds timetable slot
2. Student views timetable
3. Filter by branch/semester
4. Real-time sync via WebSocket

---

## API Testing with Postman

### Import Collection
Create new collection with these requests:

**1. Start Attendance**
```
POST http://localhost:3000/api/attendance/start
Content-Type: application/json

{
  "studentName": "Test Student",
  "department": "CSE",
  "room": "A101",
  "bssid": "ee:ee:6d:9d:6f:ba"
}
```

**2. Get Attendance List**
```
GET http://localhost:3000/api/attendance/list
```

**3. Get Statistics**
```
GET http://localhost:3000/api/attendance/statistics
```

**4. Add Timetable**
```
POST http://localhost:3000/api/timetable
Content-Type: application/json

{
  "day": "Monday",
  "lectureNumber": "1st",
  "startTime": "09:00",
  "endTime": "10:00",
  "subject": "Data Structures",
  "teacherName": "Dr. Smith",
  "room": "A101",
  "branch": "CSE",
  "semester": "5th Sem"
}
```

---

## WebSocket Testing

### Using Socket.IO Client
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✓ Connected to server');
});

socket.on('initial-state', (data) => {
  console.log('Initial state:', data);
});

socket.on('student-connected', (student) => {
  console.log('New student:', student.name);
});

socket.on('student-timer-update', (student) => {
  console.log(`${student.name}: ${student.timeRemaining}s remaining`);
});
```

---

## Production Deployment

### 1. Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db/letsbunk
PORT=3000
AUTHORIZED_BSSID=your-production-bssid
```

### 2. Security
- Enable HTTPS
- Add authentication
- Rate limiting
- Input validation
- CORS configuration

### 3. Monitoring
- Set up logging (Winston/Morgan)
- Error tracking (Sentry)
- Performance monitoring
- Database backups

### 4. Android Release Build
```bash
./gradlew assembleRelease
```

Sign APK with keystore:
```bash
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore my-release-key.jks \
  app-release-unsigned.apk alias_name
```

---

## Useful Commands

### Server
```bash
# Start server
npm start

# Start with auto-reload
npm run dev

# Check MongoDB status
mongo --eval "db.adminCommand('ping')"

# View logs
tail -f server.log
```

### Android
```bash
# Build debug APK
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep "MainActivity"

# Clear app data
adb shell pm clear com.example.letsbunk
```

### MongoDB
```bash
# Connect to database
mongo letsbunk

# Show collections
show collections

# Query students
db.students.find().pretty()

# Clear attendance
db.attendancerecords.deleteMany({})
```

---

## Directory Structure

```
lets-bunk/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB configuration
│   ├── models/
│   │   ├── Student.js           # Student schema
│   │   ├── Timetable.js         # Timetable schema
│   │   └── TimetableTable.js    # Tabular timetable
│   ├── uploads/                 # Excel uploads
│   ├── server.js                # Main server file
│   ├── package.json
│   └── .env
├── app/
│   └── src/main/java/com/example/letsbunk/
│       ├── MainActivity.kt      # Main activity
│       ├── NetworkManager.kt    # WebSocket & API
│       ├── ApiService.kt        # REST endpoints
│       ├── TimetableModels.kt   # Data models
│       └── ...
├── API_DOCUMENTATION.md         # Complete API docs
├── UPDATE_SUMMARY.md            # What changed
└── QUICK_START.md              # This file
```

---

## Support & Resources

### Documentation
- 📖 [API Documentation](./API_DOCUMENTATION.md)
- 📝 [Update Summary](./UPDATE_SUMMARY.md)
- 🔧 [Server Code](./server/server.js)

### Debugging
- Enable verbose logging in NetworkManager.kt
- Check server console for errors
- Use Chrome DevTools for WebSocket debugging
- Monitor MongoDB with Compass

### Performance Tips
- Use batch operations for large datasets
- Enable MongoDB indexes
- Implement caching for timetables
- Optimize WebSocket event frequency

---

## Next Steps

1. ✅ Complete server setup
2. ✅ Test all endpoints
3. ✅ Configure WiFi BSSID
4. ✅ Test student attendance flow
5. ✅ Test teacher monitoring
6. ✅ Test random ring system
7. ✅ Add timetable data
8. ✅ Test real-time sync
9. 🚀 Deploy to production

---

## Success Checklist

- [ ] Server starts without errors
- [ ] MongoDB connected
- [ ] Android app connects to server
- [ ] Student can mark attendance
- [ ] Teacher sees real-time updates
- [ ] WiFi disconnect/reconnect works
- [ ] Random ring functional
- [ ] Timetable CRUD operations work
- [ ] WebSocket events firing
- [ ] Statistics endpoint working

---

## 🎉 You're Ready!

Your attendance system is now fully configured and ready to use. Start marking attendance and managing timetables!

**Need help?** Check the API documentation or server logs for detailed error messages.
