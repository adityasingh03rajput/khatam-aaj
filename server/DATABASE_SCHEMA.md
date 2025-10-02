# Database Schema Documentation

## Overview
This document describes the complete database schema for the Let's Bunk attendance tracking system.

## Collections

### 1. Student (Active Sessions)
Tracks real-time attendance sessions for currently connected students.

**Fields:**
- `studentId` (String, required, unique, indexed) - Unique session identifier
- `name` (String, required) - Student name
- `department` (String, required, indexed) - Department (e.g., CSE, ECE)
- `room` (String, required) - Current room/location
- `branch` (String, indexed) - Academic branch
- `semester` (String) - Current semester
- `timeRemaining` (Number, default: 600) - Seconds remaining in attendance
- `timerState` (String, enum: ['running', 'paused', 'completed'], indexed) - Current timer state
- `attendanceStatus` (String, enum: ['attending', 'absent', 'attended'], indexed) - Attendance status
- `isPresent` (Boolean, default: true, indexed) - Current presence status
- `startTime` (Date, indexed) - Session start time
- `completedAt` (Date, indexed) - Session completion time
- `lastPausedTime` (Date) - Last pause timestamp
- `totalPausedDuration` (Number, default: 0) - Total paused time in seconds
- `bssid` (String) - Connected WiFi BSSID
- `sessionDate` (Date, indexed) - Session date
- `ipAddress` (String) - Client IP address
- `deviceInfo` (String) - Device information
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ department: 1, timerState: 1 }`
- `{ sessionDate: -1, isPresent: 1 }`

---

### 2. StudentRecord (Permanent Records)
Stores permanent student information and profiles.

**Fields:**
- `rollNumber` (String, required, unique, indexed, uppercase) - Student roll number
- `name` (String, required) - Full name
- `email` (String, required, unique, validated) - Email address
- `phone` (String, required, validated) - 10-digit phone number
- `department` (String, required, indexed) - Department
- `semester` (String, required, indexed) - Current semester
- `branch` (String, required, indexed) - Academic branch
- `section` (String, default: 'A', uppercase) - Class section
- `academicYear` (String, auto-generated) - Academic year (e.g., 2024-2025)
- `dateOfBirth` (Date) - Date of birth
- `address` (String) - Residential address
- `guardianName` (String) - Guardian's name
- `guardianPhone` (String) - Guardian's phone
- `isActive` (Boolean, default: true, indexed) - Active status
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ branch: 1, semester: 1, section: 1 }`
- `{ department: 1, isActive: 1 }`

**Validations:**
- Email: Valid email format
- Phone: 10-digit number

---

### 3. TeacherRecord
Stores teacher information and subject assignments.

**Fields:**
- `employeeId` (String, required, unique, indexed, uppercase) - Employee ID
- `name` (String, required) - Full name
- `email` (String, required, unique, validated) - Email address
- `phone` (String, required, validated) - 10-digit phone number
- `department` (String, required, indexed) - Department
- `subjects` (Array of Objects) - Assigned subjects
  - `subjectName` (String) - Subject name
  - `subjectCode` (String) - Subject code
  - `branch` (String) - Branch
  - `semester` (String) - Semester
- `designation` (String, default: 'Assistant Professor') - Job designation
- `qualification` (String) - Educational qualification
- `experience` (Number, min: 0) - Years of experience
- `joiningDate` (Date) - Date of joining
- `specialization` (String) - Area of specialization
- `isActive` (Boolean, default: true, indexed) - Active status
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ department: 1, isActive: 1 }`
- `{ designation: 1 }`

---

### 4. Timetable (Slot-based)
Individual timetable slots for lectures.

**Fields:**
- `slotId` (String, required, unique, indexed) - Unique slot identifier
- `day` (String, required, enum: days of week) - Day of week
- `lectureNumber` (String, required, enum: ['1st', '2nd', ...]) - Lecture number
- `startTime` (String, required, validated HH:MM) - Start time
- `endTime` (String, required, validated HH:MM) - End time
- `subject` (String, required) - Subject name
- `teacherName` (String, required) - Teacher name
- `room` (String, required) - Room number
- `branch` (String, required, indexed) - Branch
- `semester` (String, required, indexed) - Semester
- `isActive` (Boolean, default: true) - Active status
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ branch: 1, semester: 1 }`
- `{ day: 1, lectureNumber: 1 }`
- `{ branch: 1, semester: 1, day: 1 }`

**Validations:**
- Time format: HH:MM (24-hour format)

---

### 5. TimetableTable (Tabular Format)
Complete timetable in period-based tabular format.

**Fields:**
- `branch` (String, required, indexed) - Branch
- `semester` (String, required, indexed) - Semester
- `periods` (Array of Period objects) - List of periods
  - `periodNumber` (Number, required, min: 1, max: 10) - Period number
  - `startTime` (String, required, validated) - Start time
  - `endTime` (String, required, validated) - End time
  - `monday` (PeriodEntry) - Monday's class
  - `tuesday` (PeriodEntry) - Tuesday's class
  - `wednesday` (PeriodEntry) - Wednesday's class
  - `thursday` (PeriodEntry) - Thursday's class
  - `friday` (PeriodEntry) - Friday's class
  - `saturday` (PeriodEntry) - Saturday's class
- `academicYear` (String, auto-generated) - Academic year
- `isActive` (Boolean, default: true) - Active status
- `lastModifiedBy` (String, default: 'Teacher') - Last modifier
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**PeriodEntry Schema:**
- `courseName` (String) - Course name
- `roomNumber` (String) - Room number
- `teacherName` (String) - Teacher name
- `courseCode` (String) - Course code

**Indexes:**
- `{ branch: 1, semester: 1 }` (unique)
- `{ academicYear: 1 }`

---

### 6. AttendanceRecord (Historical)
Historical attendance records for analytics and reporting.

**Fields:**
- `studentId` (String, required, indexed) - Student session ID
- `name` (String, required) - Student name
- `department` (String, indexed) - Department
- `room` (String) - Room
- `branch` (String, indexed) - Branch
- `semester` (String) - Semester
- `startTime` (Date, required, indexed) - Session start
- `completedAt` (Date, indexed) - Session completion
- `totalDuration` (Number, default: 0) - Total duration in seconds
- `totalPausedDuration` (Number, default: 0) - Paused duration
- `status` (String, enum: ['completed', 'incomplete', 'rejected', 'absent'], indexed) - Final status
- `bssid` (String) - WiFi BSSID
- `attendancePercentage` (Number, min: 0, max: 100) - Attendance percentage
- `randomRingStatus` (String, enum: ['none', 'selected', 'accepted', 'rejected', 'confirmed']) - Random ring status
- `sessionDate` (Date, indexed) - Session date
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ department: 1, sessionDate: -1 }`
- `{ studentId: 1, sessionDate: -1 }`
- `{ status: 1, sessionDate: -1 }`

---

### 7. BSSIDConfig
WiFi BSSID (MAC address) configuration for authorized networks.

**Fields:**
- `name` (String, required, unique, indexed) - Network name
- `bssid` (String, required, unique, validated) - BSSID/MAC address
- `location` (String) - Physical location
- `building` (String) - Building name
- `floor` (String) - Floor number
- `isActive` (Boolean, default: false, indexed) - Active status
- `description` (String) - Description
- `lastUsed` (Date) - Last usage timestamp
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ isActive: 1 }`

**Validations:**
- BSSID format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX

---

### 8. Classroom
Classroom/room information and WiFi mapping.

**Fields:**
- `name` (String, required, unique, indexed) - Classroom name
- `roomNumber` (String, required, uppercase) - Room number
- `bssid` (String, required, validated) - Associated BSSID
- `building` (String, indexed) - Building name
- `floor` (String) - Floor number
- `capacity` (Number, min: 1, max: 500) - Seating capacity
- `type` (String, enum: ['Lecture Hall', 'Laboratory', 'Tutorial Room', 'Seminar Hall', 'Conference Room', 'Other']) - Room type
- `facilities` (Array of Strings) - Available facilities
- `department` (String, indexed) - Assigned department
- `isActive` (Boolean, default: true, indexed) - Active status
- `description` (String) - Description
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**Indexes:**
- `{ building: 1, floor: 1 }`
- `{ department: 1, isActive: 1 }`

---

## Database Scripts

### Initialize Database
```bash
node server/scripts/initDatabase.js
```
Creates indexes and seeds initial sample data.

### Clear Database
```bash
node server/scripts/clearDatabase.js
```
Removes all data from all collections (use with caution).

### Backup Database
```bash
node server/scripts/backupDatabase.js
```
Exports all collections to JSON files with timestamp.

---

## Query Examples

### Get Active Students by Department
```javascript
Student.find({ department: 'CSE', isPresent: true })
```

### Get Timetable for Branch/Semester
```javascript
Timetable.find({ branch: 'CSE', semester: '5th Sem' }).sort({ day: 1, lectureNumber: 1 })
```

### Get Attendance Statistics
```javascript
AttendanceRecord.aggregate([
  { $match: { sessionDate: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

### Get Students by Branch and Semester
```javascript
StudentRecord.find({ branch: 'CSE', semester: '5th Sem', isActive: true })
```

---

## Performance Optimization

1. **Indexes**: All frequently queried fields have indexes
2. **Compound Indexes**: Multi-field queries use compound indexes
3. **Validation**: Data validation at schema level prevents invalid data
4. **Lean Queries**: Use `.lean()` for read-only operations
5. **Projection**: Select only required fields to reduce data transfer

---

## Backup Strategy

1. **Automated Daily Backups**: Schedule daily backups using cron
2. **Retention Policy**: Keep backups for 30 days
3. **Export Format**: JSON for easy restoration and portability
4. **Metadata**: Each backup includes timestamp and version info

---

## Migration Notes

When updating schema:
1. Create migration script in `server/migrations/`
2. Test on development database first
3. Backup production database before migration
4. Run migration during low-traffic period
5. Verify data integrity after migration
