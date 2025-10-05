# LetsBunk - Smart Attendance System

Complete attendance management system with **period-based tracking**, WiFi-based location verification, real-time monitoring, and comprehensive admin controls.

## 🆕 NEW: Period-Based Attendance System

The system now tracks attendance based on actual college timetable periods instead of a fixed timer!

**Key Features:**
- ✅ Syncs with college timetable (e.g., 8:00 AM - 4:10 PM)
- ✅ Automatic attendance per lecture/period
- ✅ Only works during college hours
- ✅ Live period tracking
- ✅ Daily attendance percentage
- ✅ Period-wise reports

See [PERIOD_BASED_ATTENDANCE_GUIDE.md](PERIOD_BASED_ATTENDANCE_GUIDE.md) for details.

## 🔐 NEW: Login & Authentication System

Secure login system with role-based access control!

**Key Features:**
- ✅ User registration (Student/Teacher)
- ✅ Secure JWT authentication
- ✅ Role-based UI (Student view vs Teacher view)
- ✅ Auto-login with token persistence
- ✅ Password hashing with bcrypt
- ✅ Profile management

**Sample Credentials:**
- Student: `2024CSE001` / `student123`
- Teacher: `T001` / `teacher123`

See [LOGIN_SYSTEM_GUIDE.md](LOGIN_SYSTEM_GUIDE.md) for details.

## 🚀 Super Easy Setup (Recommended for First Time)

### Step-by-Step Wizard
```bash
SETUP_WIZARD.bat
```
**Follow the 5-step wizard** - It will guide you through everything!

### Quick Start (If Already Set Up)
```bash
START.bat
```
Select **[1] Quick Start** - Ready in 30 seconds!

### 🆕 Setup Period-Based Attendance & Login
After initial setup, run this to enable the new systems:
```bash
cd server
npm install  # Install new dependencies (jsonwebtoken)
npm run setup:all  # Setup both period attendance and sample users
```

Or setup individually:
```bash
npm run setup:period  # Setup period-based attendance
npm run setup:users   # Create sample user accounts
```

This will:
- Create database indexes
- Set up sample timetable (CSE Semester 5)
- Initialize period-based attendance system
- Create sample student and teacher accounts

## 📦 What's Included

### Sample Data (Ready to Test)
```
Students:
  2024CSE001 - John Doe     (CSE, Sem 5) - Password: student123
  2024CSE002 - Jane Smith   (CSE, Sem 5) - Password: student123
  2024ECE001 - Bob Johnson  (ECE, Sem 5) - Password: student123
  2024ME001  - Alice Brown  (ME, Sem 5)  - Password: student123

Teachers:
  T001 - Dr. Smith      (CSE, Data Structures)
  T002 - Prof. Johnson  (ECE, Digital Electronics)

Admin Login:
  Username: admin
  Password: admin123
```

### WiFi Mappings (Auto-Detection Ready)
```
Room A101 → CSE Sem 5 → BSSID: ee:ee:6d:9d:6f:ba
Room B201 → ECE Sem 5 → BSSID: aa:bb:cc:dd:ee:ff
Room C301 → ME Sem 5  → BSSID: 11:22:33:44:55:66
```

## 🎯 Quick Actions in Admin Panel

### 1. View Sample Data
```
Sidebar → Profile Management → View All Students
```

### 2. Create New Student
```
Sidebar → Profile Management → Create Student Profile
Fill form → Click "Create Profile"
```

### 3. Create Timetable
```
Sidebar → Timetable Management → Create Timetable
Enter: Branch (CSE), Semester (5)
Fill grid → Save
```

### 4. Assign Classroom WiFi
```
Sidebar → Timetable Management → Assign Classrooms
Enter details → Add Mapping → Save All
```

### 5. Post Notice
```
Sidebar → Communication → Post Notice
Enter details → Post Notice
```

### 6. Monitor Live Attendance
```
Sidebar → Attendance → Live Monitoring
```

## 📱 Complete Features

✅ Profile Management (Students & Teachers)
✅ Timetable Creation (Visual Editor)
✅ WiFi Auto-Detection (Classroom Mapping)
✅ Live Attendance Monitoring
✅ Notice Board & Forum
✅ Library Management
✅ Real-time Updates
✅ Sample Data Loading

## 🔗 Complete Workflow Example

```
1. Create Student → 2. Create Timetable → 3. Assign WiFi → 4. Student Uses App
```

## 🐛 Troubleshooting

### Server Not Starting
```bash
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
SETUP_WIZARD.bat
```

### Admin Panel Not Connecting
Check top-right status → Settings → Test Connection

## 🎉 Get Started

```bash
SETUP_WIZARD.bat
```

Follow 5 easy steps and you're done!
