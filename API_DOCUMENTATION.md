# Let's Bunk - API Documentation

## Server Configuration
- **Base URL**: `http://192.168.246.31:3000`
- **WebSocket URL**: `http://192.168.246.31:3000`
- **Port**: 3000

---

## Authentication & Configuration

### Get Authorized BSSID
```http
GET /api/config/bssid
```
**Response:**
```json
{
  "authorizedBSSID": "ee:ee:6d:9d:6f:ba",
  "message": "Authorized Wi-Fi BSSID"
}
```

### Update Authorized BSSID
```http
PUT /api/config/bssid
```
**Body:**
```json
{
  "bssid": "ee:ee:6d:9d:6f:ba"
}
```

### Get BSSID List (Multi-location support)
```http
GET /api/config/bssid-list
```

### Add BSSID to List
```http
POST /api/config/bssid-list
```
**Body:**
```json
{
  "name": "Main WiFi",
  "bssid": "ee:ee:6d:9d:6f:ba"
}
```

### Verify BSSID
```http
POST /api/verify-bssid
```
**Body:**
```json
{
  "bssid": "ee:ee:6d:9d:6f:ba"
}
```

---

## Attendance Management

### Start Attendance
```http
POST /api/attendance/start
```
**Body:**
```json
{
  "studentName": "John Doe",
  "department": "CSE",
  "room": "Room 101",
  "bssid": "ee:ee:6d:9d:6f:ba"
}
```
**Response:**
```json
{
  "success": true,
  "studentId": "1696234567890",
  "message": "Attendance started",
  "student": {
    "id": "1696234567890",
    "name": "John Doe",
    "department": "CSE",
    "room": "Room 101",
    "timeRemaining": 600,
    "timerState": "running",
    "attendanceStatus": "attending",
    "isPresent": true,
    "startTime": "2025-10-02T09:00:00.000Z",
    "bssid": "ee:ee:6d:9d:6f:ba"
  }
}
```

### Update Attendance
```http
POST /api/attendance/update
```
**Body:**
```json
{
  "studentId": "1696234567890",
  "timeRemaining": 580,
  "isPresent": true
}
```

### Complete Attendance
```http
POST /api/attendance/complete
```
**Body:**
```json
{
  "studentId": "1696234567890"
}
```

### Pause Attendance (WiFi Disconnect)
```http
POST /api/attendance/pause
```
**Body:**
```json
{
  "studentId": "1696234567890"
}
```

### Resume Attendance (WiFi Reconnect)
```http
POST /api/attendance/resume
```
**Body:**
```json
{
  "studentId": "1696234567890"
}
```

### Disconnect Student (Manual)
```http
POST /api/attendance/disconnect
```
**Body:**
```json
{
  "studentId": "1696234567890"
}
```

### Get Attendance List
```http
GET /api/attendance/list
```
**Response:**
```json
{
  "students": [...],
  "count": 5,
  "timestamp": "2025-10-02T09:00:00.000Z"
}
```

### Get Attendance History
```http
GET /api/attendance/history?department=CSE&limit=50
```
**Query Parameters:**
- `department` (optional): Filter by department
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `limit` (optional): Limit results (default: 100)

### Get Attendance Statistics
```http
GET /api/attendance/statistics?department=CSE
```
**Response:**
```json
{
  "totalStudents": 25,
  "presentStudents": 20,
  "absentStudents": 5,
  "completedStudents": 15,
  "averageAttendanceTime": 450,
  "attendanceRate": "80.00",
  "timestamp": "2025-10-02T09:00:00.000Z"
}
```

### Export Attendance
```http
GET /api/attendance/export?format=csv
```
**Query Parameters:**
- `format`: `json` or `csv` (default: json)

### Clear All Attendance (Testing)
```http
POST /api/attendance/clear-all
```

---

## Timetable Management (Legacy Slot-based)

### Get Timetable
```http
GET /api/timetable?branch=CSE&semester=5th Sem
```
**Query Parameters:**
- `branch` (optional): Filter by branch
- `semester` (optional): Filter by semester

### Add Timetable Slot
```http
POST /api/timetable
```
**Body:**
```json
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

### Update Timetable Slot
```http
PUT /api/timetable/:id
```

### Delete Timetable Slot
```http
DELETE /api/timetable/:id
```

### Batch Add Timetable
```http
POST /api/timetable/batch
```
**Body:**
```json
{
  "slots": [
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
  ]
}
```

### Clear Timetable
```http
DELETE /api/timetable/clear?branch=CSE&semester=5th Sem
```

### Get Current Lecture
```http
GET /api/timetable/current?branch=CSE&semester=5th Sem
```
**Response:**
```json
{
  "currentLecture": {...},
  "nextLecture": {...},
  "currentDay": "Monday",
  "currentTime": "09:30"
}
```

### Upload Excel Timetable
```http
POST /api/timetable/upload-excel
```
**Content-Type:** `multipart/form-data`
**Body:** Excel file with columns: Day, Lecture Number, Start Time, End Time, Subject, Teacher Name, Room, Branch, Semester

### Download Timetable as Excel
```http
GET /api/timetable/download-excel?branch=CSE&semester=5th Sem
```

### Download Excel Template
```http
GET /api/timetable/download-template
```

---

## Timetable Table (New Tabular Format)

### Get Tabular Timetable
```http
GET /api/timetable-table/:branch/:semester
```
**Example:**
```http
GET /api/timetable-table/Computer Science/1st Semester
```

### Save Tabular Timetable
```http
POST /api/timetable-table
```
**Body:**
```json
{
  "branch": "Computer Science",
  "semester": "1st Semester",
  "periods": [
    {
      "periodNumber": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "monday": {
        "courseName": "Mathematics",
        "roomNumber": "A101",
        "teacherName": "Dr. Smith"
      },
      "tuesday": {
        "courseName": "Physics",
        "roomNumber": "B201",
        "teacherName": "Dr. Johnson"
      }
    }
  ]
}
```

### Delete Tabular Timetable
```http
DELETE /api/timetable-table/:branch/:semester
```

---

## Random Ring System

### Start Random Ring
```http
POST /api/random-ring/start
```
**Body:**
```json
{
  "numberOfStudents": 5
}
```

### Teacher Response (Accept/Reject)
```http
POST /api/random-ring/teacher-response
```
**Body:**
```json
{
  "studentId": "1696234567890",
  "action": "accept"
}
```
**Actions:** `accept` or `reject`

### Student Confirm Presence
```http
POST /api/random-ring/student-confirm
```
**Body:**
```json
{
  "studentId": "1696234567890"
}
```

### Get Random Ring Status
```http
GET /api/random-ring/status
```

---

## Student Management

### Get All Students
```http
GET /api/students?department=CSE&limit=50
```

### Get Student by ID
```http
GET /api/students/:id
```

---

## Classroom Management

### Get All Classrooms
```http
GET /api/classrooms
```

### Add Classroom
```http
POST /api/classrooms
```
**Body:**
```json
{
  "name": "Room A101",
  "bssid": "ee:ee:6d:9d:6f:ba",
  "capacity": 60,
  "building": "Main Building",
  "floor": "1st Floor"
}
```

---

## Server Statistics

### Get Server Statistics
```http
GET /api/statistics/server
```
**Response:**
```json
{
  "connectedStudents": 25,
  "totalAttendanceRecords": 150,
  "randomRingActive": false,
  "randomRingCount": 0,
  "authorizedBSSID": "ee:ee:6d:9d:6f:ba",
  "bssidListCount": 3,
  "uptime": 3600.5,
  "mongoDBConnected": true,
  "timestamp": "2025-10-02T09:00:00.000Z"
}
```

### Health Check
```http
GET /api/health
```

---

## WebSocket Events

### Client → Server Events

#### Timer Update
```javascript
socket.emit('timer-update', {
  studentId: '1696234567890',
  timeRemaining: 580
});
```

#### Student Disconnect
```javascript
socket.emit('student-disconnect', {
  studentId: '1696234567890'
});
```

### Server → Client Events

#### Initial State
```javascript
socket.on('initial-state', (data) => {
  // data: { students: [...], timetable: [...], authorizedBSSID: '...' }
});
```

#### Student Connected
```javascript
socket.on('student-connected', (student) => {
  // New student started attendance
});
```

#### Student Updated
```javascript
socket.on('student-updated', (student) => {
  // Student status changed
});
```

#### Student Timer Update
```javascript
socket.on('student-timer-update', (student) => {
  // Timer countdown update
});
```

#### Student Completed
```javascript
socket.on('student-completed', (student) => {
  // Student completed 10-minute attendance
});
```

#### Student Paused
```javascript
socket.on('student-paused', (student) => {
  // WiFi disconnected - timer paused
});
```

#### Student Resumed
```javascript
socket.on('student-resumed', (student) => {
  // WiFi reconnected - timer resumed
});
```

#### Student Disconnected
```javascript
socket.on('student-disconnected', (student) => {
  // Student manually disconnected
});
```

#### Timetable Events
```javascript
socket.on('timetable-added', (slot) => {});
socket.on('timetable-updated', (slot) => {});
socket.on('timetable-deleted', (data) => {});
socket.on('timetable-cleared', (data) => {});
```

#### Timetable Table Events
```javascript
socket.on('timetable-table-updated', (data) => {});
socket.on('timetable-table-deleted', (data) => {});
```

#### Random Ring Events
```javascript
socket.on('random-ring-started', (data) => {});
socket.on('random-ring-notification', (data) => {});
socket.on('random-ring-updated', (data) => {});
socket.on('random-ring-accepted', (data) => {});
socket.on('random-ring-rejected', (data) => {});
socket.on('random-ring-student-confirmed', (data) => {});
```

#### Configuration Events
```javascript
socket.on('bssid-updated', (data) => {});
socket.on('bssid-list-updated', (data) => {});
socket.on('classroom-added', (classroom) => {});
socket.on('attendance-cleared', (data) => {});
```

---

## Error Responses

### Common Error Codes
- **400**: Bad Request - Invalid parameters
- **403**: Forbidden - Unauthorized BSSID
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate entry (e.g., username already in use)
- **500**: Internal Server Error
- **503**: Service Unavailable - Database not connected

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## Data Models

### Student Attendance
```typescript
{
  id: string,
  name: string,
  department: string,
  room: string,
  timeRemaining: number,
  timerState: 'running' | 'paused' | 'completed',
  attendanceStatus: 'attending' | 'absent' | 'attended',
  isPresent: boolean,
  startTime: string (ISO 8601),
  bssid: string
}
```

### Time Slot (Legacy)
```typescript
{
  id: string,
  day: string,
  lectureNumber: string,
  startTime: string (HH:MM),
  endTime: string (HH:MM),
  subject: string,
  teacherName: string,
  room: string,
  branch: string,
  semester: string
}
```

### Period (Tabular Timetable)
```typescript
{
  periodNumber: number,
  startTime: string (HH:MM),
  endTime: string (HH:MM),
  monday: PeriodEntry,
  tuesday: PeriodEntry,
  wednesday: PeriodEntry,
  thursday: PeriodEntry,
  friday: PeriodEntry,
  saturday: PeriodEntry
}
```

### Period Entry
```typescript
{
  courseName: string,
  roomNumber: string,
  teacherName: string
}
```

---

## Notes

1. **Timer Duration**: Default is 600 seconds (10 minutes)
2. **Auto-cleanup**: Completed students are removed after 5 seconds
3. **Duplicate Prevention**: Same username cannot be used simultaneously
4. **WiFi Monitoring**: Timer automatically pauses when WiFi disconnects
5. **Random Ring Lock**: Once student confirms, teacher cannot reject
6. **MongoDB Fallback**: In-memory storage used when MongoDB is unavailable
7. **Real-time Updates**: All changes broadcast via WebSocket to connected clients

---

## Testing Endpoints

Use tools like:
- **Postman** for REST API testing
- **Socket.IO Client** for WebSocket testing
- **Browser DevTools** for debugging

Example cURL:
```bash
curl -X POST http://192.168.246.31:3000/api/attendance/start \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "department": "CSE",
    "room": "A101",
    "bssid": "ee:ee:6d:9d:6f:ba"
  }'
```
