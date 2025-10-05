# 🗄️ Clean Database Schema

## Core Principle: Single Source of Truth

### 1. Users (Authentication & Basic Info)
```javascript
{
  _id: ObjectId,
  userId: "sir@12" | "0246CS231001",
  email: "user@example.com",
  password: "hashed",
  name: "Full Name",
  role: "student" | "teacher" | "admin",
  phone: "9876543210",
  isActive: true,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. StudentProfiles (Student-Specific Data)
```javascript
{
  _id: ObjectId,
  userId: "0246CS231001", // FK to Users
  branch: "CSE",
  semester: "3",
  rollNo: "CSE001",
  section: "A", // NEW: Section assignment
  sessionYear: "2024-2025",
  
  // Academic Performance (calculated)
  cgpa: 8.5,
  sessionalMarks: 85,
  
  // Attendance Stats (calculated from Attendance collection)
  totalLectures: 120,
  attendedLectures: 96,
  attendancePercentage: 80,
  
  // Metadata
  admissionDate: Date,
  lastUpdated: Date
}
```

### 3. TeacherProfiles (Teacher-Specific Data)
```javascript
{
  _id: ObjectId,
  userId: "sir@12", // FK to Users
  department: "CSE",
  designation: "Assistant Professor",
  subjects: ["Physics", "Mechanics"],
  qualification: "M.Tech",
  experience: 5,
  joiningDate: Date
}
```

### 4. ClassSections (Room & Student Group Mapping)
```javascript
{
  _id: ObjectId,
  branch: "CSE",
  semester: "3",
  section: "A",
  room: "A102",
  capacity: 60,
  students: ["0246CS231001", "0246CS231002"], // Array of userIds
  academicYear: "2024-2025",
  isActive: true
}
```

### 5. Timetable (Master Schedule)
```javascript
{
  _id: ObjectId,
  branch: "CSE",
  semester: "3",
  section: "A",
  academicYear: "2024-2025",
  
  schedule: [
    {
      dayOfWeek: "monday",
      periodNumber: 1,
      startTime: "08:00",
      endTime: "09:00",
      subject: "Physics",
      teacherId: "sir@12", // FK to Users
      room: "A102",
      type: "lecture" | "lab" | "tutorial"
    }
  ],
  
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Attendance (Single Unified Model)
```javascript
{
  _id: ObjectId,
  studentId: "0246CS231001", // FK to Users
  date: Date,
  dayOfWeek: "monday",
  
  // Lecture Info
  periodNumber: 1,
  subject: "Physics",
  teacherId: "sir@12", // FK to Users
  room: "A102",
  startTime: "08:00",
  endTime: "09:00",
  
  // Attendance Status
  status: "present" | "absent" | "late" | "excused",
  markedAt: Date,
  markedBy: "student" | "teacher" | "system",
  
  // Timing
  checkInTime: Date,
  checkOutTime: Date,
  durationMinutes: 55,
  
  // Validation
  isVerified: true,
  verifiedBy: "sir@12",
  
  // Metadata
  academicYear: "2024-2025",
  semester: "3"
}

// Indexes
Index: { studentId: 1, date: -1 }
Index: { teacherId: 1, date: -1 }
Index: { date: 1, periodNumber: 1 }
Unique: { studentId: 1, date: 1, periodNumber: 1 }
```

### 7. Sessions (Active Real-Time Sessions)
```javascript
{
  _id: ObjectId,
  studentId: "0246CS231001",
  date: Date,
  
  // Current Status
  isActive: true,
  currentPeriod: {
    periodNumber: 1,
    subject: "Physics",
    teacherId: "sir@12",
    room: "A102",
    startTime: "08:00",
    endTime: "09:00"
  },
  
  // Today's Summary
  periodsAttended: 3,
  periodsTotal: 5,
  todayPercentage: 60,
  
  // Connection
  socketId: "abc123",
  lastActivity: Date,
  
  // Auto-cleanup after 24 hours
  expiresAt: Date
}

// TTL Index for auto-cleanup
Index: { expiresAt: 1 }, { expireAfterSeconds: 0 }
```

## 🔗 Relationships

```
Users (1) ←→ (1) StudentProfiles
Users (1) ←→ (1) TeacherProfiles
Users (1) ←→ (N) Attendance
Users (1) ←→ (1) Sessions

ClassSections (1) ←→ (N) Students
ClassSections (1) ←→ (1) Timetable

Timetable (1) ←→ (N) Attendance
```

## 🎯 Benefits

1. **No Duplication**: Each piece of data stored once
2. **Clear Relationships**: Foreign keys with proper references
3. **Easy Queries**: Optimized indexes
4. **Scalable**: Can add new features without restructuring
5. **Maintainable**: Clear separation of concerns

## 📊 Data Flow

### Student Marks Attendance:
```
1. Check Users → Get student info
2. Check Sessions → Get current period
3. Check Timetable → Validate period
4. Create Attendance record
5. Update Sessions → Today's summary
6. Calculate StudentProfiles → Update stats
```

### Teacher Views Students:
```
1. Check Users → Get teacher info
2. Check Timetable → Get current lecture
3. Check ClassSections → Get students in room
4. Check Attendance → Get today's status
5. Check StudentProfiles → Get performance data
```

## 🚀 Migration Strategy

1. Create new clean models
2. Migrate data from old models
3. Update all APIs to use new models
4. Test thoroughly
5. Remove old models
6. Update documentation
