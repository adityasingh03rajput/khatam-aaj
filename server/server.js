const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

// Database Models
const Student = require('./models/Student');
const TimetableTable = require('./models/TimetableTable');
const AttendanceRecord = require('./models/AttendanceRecord');
const BSSIDConfig = require('./models/BSSIDConfig');
const Classroom = require('./models/Classroom');
const StudentRecord = require('./models/StudentRecord');
const TeacherRecord = require('./models/TeacherRecord');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Configuration
let AUTHORIZED_BSSID = "ee:ee:6d:9d:6f:ba"; // WiFi MAC address (can be updated via admin)
const PORT = 3000;

// In-memory storage (for real-time data)
let connectedStudents = new Map();
let randomRingStudents = [];
let attendanceRecords = []; // Track all attendance sessions
let classroomMappings = []; // Classroom to BSSID mappings
let bssidList = [
    { name: "Main WiFi", bssid: "ee:ee:6d:9d:6f:ba" }
]; // List of authorized BSSIDs

// In-memory timetable storage (offline mode)
let timetableStorage = new Map(); // Key: "branch_semester", Value: { branch, semester, periods }

// Admin Authentication - Sample Login Credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Sample user accounts for testing
const SAMPLE_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'teacher1', password: 'teacher123', role: 'teacher' },
    { username: 'demo', password: 'demo123', role: 'admin' }
];

// Simple authentication middleware
const authenticateAdmin = (req, res, next) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// API Routes

// User registration (for students with semester and stream)
app.post('/api/auth/register', (req, res) => {
    const { username, password, role, semester, branch } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            error: 'Username and password are required' 
        });
    }
    
    // Check if user already exists
    const existingUser = SAMPLE_USERS.find(u => u.username === username);
    if (existingUser) {
        return res.status(409).json({ 
            error: 'Username already exists' 
        });
    }
    
    // For students, semester and branch are required
    if (role === 'student' && (!semester || !branch)) {
        return res.status(400).json({ 
            error: 'Semester and branch are required for students' 
        });
    }
    
    // Add new user
    const newUser = { 
        username, 
        password, 
        role: role || 'student',
        semester: semester || null,
        branch: branch || null
    };
    SAMPLE_USERS.push(newUser);
    
    res.json({ 
        success: true, 
        message: 'Registration successful',
        user: { 
            username: newUser.username, 
            role: newUser.role,
            semester: newUser.semester,
            branch: newUser.branch
        }
    });
});

// Admin login with sample users
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check against sample users
    const user = SAMPLE_USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: { 
                username: user.username, 
                role: user.role,
                semester: user.semester || null,
                branch: user.branch || null
            }
        });
    } else {
        res.status(401).json({ 
            error: 'Invalid credentials',
            message: 'Please use one of the sample accounts'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        connectedStudents: connectedStudents.size,
        authorizedBSSID: AUTHORIZED_BSSID
    });
});

// Get authorized BSSID
app.get('/api/config/bssid', (req, res) => {
    res.json({ 
        authorizedBSSID: AUTHORIZED_BSSID,
        message: 'Authorized Wi-Fi BSSID'
    });
});

// Verify BSSID
app.post('/api/verify-bssid', (req, res) => {
    const { bssid } = req.body;
    const isAuthorized = bssid === AUTHORIZED_BSSID;
    
    res.json({ 
        authorized: isAuthorized,
        bssid: bssid,
        authorizedBSSID: AUTHORIZED_BSSID
    });
});

// Student attendance endpoints
app.post('/api/attendance/start', (req, res) => {
    const { studentName, department, room, bssid } = req.body;
    
    if (bssid !== AUTHORIZED_BSSID) {
        return res.status(403).json({ 
            error: 'Unauthorized BSSID',
            message: 'Please connect to authorized Wi-Fi network'
        });
    }
    
    // Check if student with same name already exists
    let existingStudentId = null;
    for (const [id, student] of connectedStudents.entries()) {
        if (student.name.toLowerCase() === studentName.toLowerCase()) {
            existingStudentId = id;
            break;
        }
    }
    
    // If student already exists, reject the new connection
    if (existingStudentId) {
        const existingStudent = connectedStudents.get(existingStudentId);
        return res.status(409).json({ 
            error: 'Username already in use',
            message: `Student "${studentName}" is already marking attendance. Please use a different name or wait for the current session to complete.`,
            existingStudent: {
                name: existingStudent.name,
                timeRemaining: existingStudent.timeRemaining,
                startTime: existingStudent.startTime
            }
        });
    }
    
    const studentId = Date.now().toString();
    const student = {
        id: studentId,
        name: studentName,
        department: department || 'CSE',
        room: room || 'Room 101',
        timeRemaining: 600,
        timerState: 'running', // running, paused, completed
        attendanceStatus: 'attending', // attending, absent, attended
        isPresent: true,
        startTime: new Date().toISOString(),
        lastPausedTime: null,
        totalPausedDuration: 0,
        bssid: bssid
    };
    
    connectedStudents.set(studentId, student);
    attendanceRecords.push(student);
    
    // Broadcast to all connected teachers
    io.emit('student-connected', student);
    
    console.log(`✓ Student "${studentName}" started attendance (ID: ${studentId})`);
    
    res.json({ 
        success: true,
        studentId: studentId,
        message: 'Attendance started',
        student: student
    });
});

app.post('/api/attendance/update', (req, res) => {
    const { studentId, timeRemaining, isPresent } = req.body;
    
    const student = connectedStudents.get(studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    student.timeRemaining = timeRemaining;
    student.isPresent = isPresent;
    student.lastUpdate = new Date().toISOString();
    
    connectedStudents.set(studentId, student);
    
    // Broadcast update to teachers
    io.emit('student-updated', student);
    
    res.json({ 
        success: true,
        student: student
    });
});

app.post('/api/attendance/complete', (req, res) => {
    const { studentId } = req.body;
    
    const student = connectedStudents.get(studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    student.timeRemaining = 0;
    student.timerState = 'completed';
    student.attendanceStatus = 'attended';
    student.isPresent = true;
    student.completedAt = new Date().toISOString();
    
    // Broadcast completion to teachers
    io.emit('student-completed', student);
    
    res.json({ 
        success: true,
        message: 'Attendance completed',
        student: student
    });
});

app.post('/api/attendance/pause', (req, res) => {
    const { studentId } = req.body;
    
    const student = connectedStudents.get(studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.timerState === 'running') {
        student.timerState = 'paused';
        student.attendanceStatus = 'absent';
        student.lastPausedTime = new Date().toISOString();
        student.isPresent = false;
        
        console.log(`⏸️ Student "${student.name}" paused (WiFi disconnected)`);
        
        // Broadcast pause to teachers
        io.emit('student-paused', student);
        
        res.json({ 
            success: true,
            message: 'Attendance paused',
            student: student
        });
    } else {
        res.json({ 
            success: false,
            message: 'Timer is not running',
            student: student
        });
    }
});

app.post('/api/attendance/resume', (req, res) => {
    const { studentId } = req.body;
    
    const student = connectedStudents.get(studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.timerState === 'paused') {
        student.timerState = 'running';
        student.attendanceStatus = 'attending';
        student.isPresent = true;
        
        // Calculate paused duration
        if (student.lastPausedTime) {
            const pausedDuration = Date.now() - new Date(student.lastPausedTime).getTime();
            student.totalPausedDuration += pausedDuration;
        }
        
        console.log(`▶️ Student "${student.name}" resumed (WiFi reconnected)`);
        
        // Broadcast resume to teachers
        io.emit('student-resumed', student);
        
        res.json({ 
            success: true,
            message: 'Attendance resumed',
            student: student
        });
    } else {
        res.json({ 
            success: false,
            message: 'Timer is not paused',
            student: student
        });
    }
});

app.get('/api/attendance/list', (req, res) => {
    const students = Array.from(connectedStudents.values());
    res.json({ 
        students: students,
        count: students.length,
        timestamp: new Date().toISOString()
    });
});

// Excel file upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Tabular Timetable endpoints (DATABASE MODE with Real-time Sync)
app.get('/api/timetable-table/:branch/:semester', async (req, res) => {
    try {
        const { branch, semester } = req.params;
        
        console.log(`📥 Fetching timetable from database for ${branch} - ${semester}`);
        
        // Try database first
        let timetable = null;
        if (mongoose.connection.readyState === 1) {
            timetable = await TimetableTable.findOne({ branch, semester });
        }
        
        // Fallback to in-memory if database not available
        if (!timetable) {
            const timetableKey = `${branch}_${semester}`;
            const memoryTimetable = timetableStorage.get(timetableKey);
            if (memoryTimetable) {
                timetable = memoryTimetable;
            }
        }
        
        if (!timetable) {
            console.log(`⚠️  No timetable found for ${branch} - ${semester}`);
            return res.json({
                success: false,
                timetable: null,
                message: 'No timetable found'
            });
        }
        
        console.log(`✅ Timetable found:`, {
            branch: timetable.branch,
            semester: timetable.semester,
            periodsCount: timetable.periods.length
        });
        
        res.json({
            success: true,
            timetable: {
                branch: timetable.branch,
                semester: timetable.semester,
                periods: timetable.periods
            },
            message: `Found ${timetable.periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error fetching timetable:', error);
        res.status(500).json({ 
            error: 'Failed to fetch timetable',
            message: error.message
        });
    }
});

app.post('/api/timetable-table', async (req, res) => {
    try {
        const { branch, semester, periods } = req.body;
        
        console.log(`📥 Received timetable save request:`, {
            branch,
            semester,
            periodsCount: periods ? periods.length : 0
        });
        
        if (!branch || !semester || !periods) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ 
                error: 'Branch, semester, and periods are required',
                success: false
            });
        }
        
        // Validate periods array
        if (!Array.isArray(periods)) {
            console.error('❌ Periods is not an array');
            return res.status(400).json({ 
                error: 'Periods must be an array',
                success: false
            });
        }
        
        let timetable;
        
        // Save to database if available
        if (mongoose.connection.readyState === 1) {
            timetable = await TimetableTable.findOneAndUpdate(
                { branch, semester },
                { branch, semester, periods, updatedAt: new Date() },
                { upsert: true, new: true }
            );
            console.log(`✅ Timetable saved to database`);
        }
        
        // Also save to in-memory storage as backup
        const timetableKey = `${branch}_${semester}`;
        const memoryTimetable = {
            branch,
            semester,
            periods,
            updatedAt: new Date()
        };
        timetableStorage.set(timetableKey, memoryTimetable);
        
        // Broadcast to all connected students in real-time
        io.emit('timetable-updated', {
            branch,
            semester,
            periods,
            message: 'Timetable has been updated'
        });
        
        console.log(`📡 Broadcasting timetable update to all students`);
        
        res.json({
            success: true,
            timetable: {
                branch: timetable ? timetable.branch : branch,
                semester: timetable ? timetable.semester : semester,
                periods: timetable ? timetable.periods : periods
            },
            message: `Timetable saved with ${periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error saving timetable:', error);
        res.status(500).json({ 
            error: 'Failed to save timetable',
            success: false,
            message: error.message
        });
    }
});

app.delete('/api/timetable-table/:branch/:semester', async (req, res) => {
    try {
        const { branch, semester } = req.params;
        
        let deleted = false;
        
        // Delete from database if available
        if (mongoose.connection.readyState === 1) {
            const result = await TimetableTable.deleteOne({ branch, semester });
            deleted = result.deletedCount > 0;
        }
        
        // Delete from in-memory storage
        const timetableKey = `${branch}_${semester}`;
        timetableStorage.delete(timetableKey);
        
        if (!deleted) {
            return res.status(404).json({ 
                error: 'Timetable not found',
                success: false
            });
        }
        
        console.log(`✓ Timetable deleted for ${branch} - ${semester}`);
        
        // Broadcast deletion to all students
        io.emit('timetable-deleted', {
            branch,
            semester,
            message: 'Timetable has been deleted'
        });
        
        res.json({
            success: true,
            message: 'Timetable deleted'
        });
    } catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({ 
            error: 'Failed to delete timetable',
            success: false
        });
    }
});

// REMOVED DUPLICATE CODE - keeping only the database version above
app.get('/api/timetable-table-old/:branch/:semester', (req, res) => {
    try {
        const { branch, semester } = req.params;
        const timetableKey = `${branch}_${semester}`;
        
        console.log(`📥 Fetching timetable from OLD memory for ${branch} - ${semester}`);
        
        const timetable = timetableStorage.get(timetableKey);
        
        if (!timetable) {
            console.log(`⚠️  No timetable found in OLD memory for ${branch} - ${semester}`);
            // Return sample timetable data
            const samplePeriods = [
                {
                    periodNumber: 1,
                    startTime: '08:00',
                    endTime: '09:00',
                    monday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    tuesday: { subject: 'Physics', room: 'B202', teacher: 'Dr. Johnson' },
                    wednesday: { subject: 'Chemistry', room: 'C303', teacher: 'Dr. Williams' },
                    thursday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    friday: { subject: 'Physics Lab', room: 'Lab1', teacher: 'Dr. Johnson' },
                    saturday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' }
                },
                {
                    periodNumber: 2,
                    startTime: '09:00',
                    endTime: '10:00',
                    monday: { subject: 'English', room: 'A102', teacher: 'Prof. Brown' },
                    tuesday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    wednesday: { subject: 'Data Structures', room: 'D405', teacher: 'Dr. Wilson' },
                    thursday: { subject: 'English', room: 'A102', teacher: 'Prof. Brown' },
                    friday: { subject: 'Chemistry Lab', room: 'Lab2', teacher: 'Dr. Williams' },
                    saturday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' }
                },
                {
                    periodNumber: 3,
                    startTime: '10:00',
                    endTime: '11:00',
                    monday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' },
                    tuesday: { subject: 'Chemistry', room: 'C303', teacher: 'Dr. Williams' },
                    wednesday: { subject: 'Physics', room: 'B202', teacher: 'Dr. Johnson' },
                    thursday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' },
                    friday: { subject: 'Mathematics Tutorial', room: 'A101', teacher: 'Dr. Smith' },
                    saturday: { subject: 'Seminar', room: 'Auditorium', teacher: 'Guest Faculty' }
                },
                {
                    periodNumber: 4,
                    startTime: '11:00',
                    endTime: '12:00',
                    monday: { subject: 'BREAK', room: '', teacher: '' },
                    tuesday: { subject: 'BREAK', room: '', teacher: '' },
                    wednesday: { subject: 'BREAK', room: '', teacher: '' },
                    thursday: { subject: 'BREAK', room: '', teacher: '' },
                    friday: { subject: 'BREAK', room: '', teacher: '' },
                    saturday: { subject: 'BREAK', room: '', teacher: '' }
                },
                {
                    periodNumber: 5,
                    startTime: '12:00',
                    endTime: '13:00',
                    monday: { subject: 'Digital Electronics', room: 'E505', teacher: 'Dr. Kumar' },
                    tuesday: { subject: 'Algorithms', room: 'D406', teacher: 'Dr. Wilson' },
                    wednesday: { subject: 'Computer Networks', room: 'D407', teacher: 'Dr. Patel' },
                    thursday: { subject: 'Digital Electronics', room: 'E505', teacher: 'Dr. Kumar' },
                    friday: { subject: 'Software Engineering', room: 'D408', teacher: 'Dr. Sharma' },
                    saturday: { subject: 'Break', room: '', teacher: '' }
                },
                {
                    periodNumber: 6,
                    startTime: '13:00',
                    endTime: '14:00',
                    monday: { subject: 'LUNCH', room: '', teacher: '' },
                    tuesday: { subject: 'LUNCH', room: '', teacher: '' },
                    wednesday: { subject: 'LUNCH', room: '', teacher: '' },
                    thursday: { subject: 'LUNCH', room: '', teacher: '' },
                    friday: { subject: 'LUNCH', room: '', teacher: '' },
                    saturday: { subject: 'LUNCH', room: '', teacher: '' }
                },
                {
                    periodNumber: 7,
                    startTime: '14:00',
                    endTime: '15:00',
                    monday: { subject: 'Database Systems', room: 'D409', teacher: 'Dr. Singh' },
                    tuesday: { subject: 'Operating Systems', room: 'D410', teacher: 'Dr. Gupta' },
                    wednesday: { subject: 'Machine Learning', room: 'AI Lab', teacher: 'Dr. Sharma' },
                    thursday: { subject: 'Database Systems', room: 'D409', teacher: 'Dr. Singh' },
                    friday: { subject: 'Web Development', room: 'D411', teacher: 'Dr. Patel' },
                    saturday: { subject: 'Sports', room: 'Ground', teacher: 'PE Teacher' }
                },
                {
                    periodNumber: 8,
                    startTime: '15:00',
                    endTime: '16:00',
                    monday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' },
                    tuesday: { subject: 'Elective Course', room: 'E506', teacher: 'Dr. Kumar' },
                    wednesday: { subject: 'Break', room: '', teacher: '' },
                    thursday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' },
                    friday: { subject: 'Elective Course', room: 'E506', teacher: 'Dr. Kumar' },
                    saturday: { subject: 'Library Time', room: 'Library', teacher: 'Librarian' }
                }
            ];
            
            return res.json({
                success: false,
                timetable: null,
                message: 'No timetable found'
            });
        }
        
        console.log(`✅ Timetable found in memory:`, {
            branch: timetable.branch,
            semester: timetable.semester,
            periodsCount: timetable.periods.length
        });
        
        res.json({
            success: true,
            timetable: {
                branch: timetable.branch,
                semester: timetable.semester,
                periods: timetable.periods
            },
            message: `Found ${timetable.periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error fetching timetable from memory:', error);
        res.status(500).json({ 
            error: 'Failed to fetch timetable',
            message: error.message
        });
    }
});

app.post('/api/timetable-table', (req, res) => {
    try {
        const { branch, semester, periods } = req.body;
        
        console.log(`📥 Received timetable save request (OFFLINE MODE):`, {
            branch,
            semester,
            periodsCount: periods ? periods.length : 0
        });
        
        if (!branch || !semester || !periods) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ 
                error: 'Branch, semester, and periods are required',
                success: false
            });
        }
        
        // Validate periods array
        if (!Array.isArray(periods)) {
            console.error('❌ Periods is not an array');
            return res.status(400).json({ 
                error: 'Periods must be an array',
                success: false
            });
        }
        
        // Save to in-memory storage
        const timetableKey = `${branch}_${semester}`;
        const timetable = {
            branch,
            semester,
            periods,
            updatedAt: new Date()
        };
        
        timetableStorage.set(timetableKey, timetable);
        
        console.log(`✅ Timetable saved to memory:`, {
            key: timetableKey,
            branch: timetable.branch,
            semester: timetable.semester,
            periodsCount: timetable.periods.length
        });
        
        // NO WebSocket broadcast - offline mode
        
        res.json({
            success: true,
            timetable: {
                branch: timetable.branch,
                semester: timetable.semester,
                periods: timetable.periods
            },
            message: `Timetable saved with ${timetable.periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error saving timetable to memory:', error);
        res.status(500).json({ 
            error: 'Failed to save timetable',
            success: false,
            message: error.message
        });
    }
});

app.delete('/api/timetable-table/:branch/:semester', (req, res) => {
    try {
        const { branch, semester } = req.params;
        const timetableKey = `${branch}_${semester}`;
        
        const deleted = timetableStorage.delete(timetableKey);
        
        if (!deleted) {
            return res.status(404).json({ 
                error: 'Timetable not found',
                success: false
            });
        }
        
        console.log(`✓ Timetable deleted from memory for ${branch} - ${semester}`);
        
        // NO WebSocket broadcast - offline mode
        
        res.json({
            success: true,
            message: 'Timetable deleted'
        });
    } catch (error) {
        console.error('Error deleting timetable from memory:', error);
        res.status(500).json({ 
            error: 'Failed to delete timetable',
            success: false
        });
    }
});


// BSSID Management endpoints
app.put('/api/config/bssid', (req, res) => {
    const { bssid } = req.body;
    
    if (!bssid) {
        return res.status(400).json({ error: 'BSSID is required' });
    }
    
    AUTHORIZED_BSSID = bssid;
    
    // Broadcast to all connected clients
    io.emit('bssid-updated', { authorizedBSSID: AUTHORIZED_BSSID });
    
    console.log(`✓ BSSID updated to: ${AUTHORIZED_BSSID}`);
    
    res.json({ 
        success: true,
        authorizedBSSID: AUTHORIZED_BSSID,
        message: 'BSSID updated successfully'
    });
});

// Get all BSSIDs (for multi-location support)
app.get('/api/config/bssid-list', (req, res) => {
    res.json({ 
        bssidList: bssidList,
        count: bssidList.length
    });
});

app.post('/api/config/bssid-list', (req, res) => {
    const { name, bssid } = req.body;
    
    if (!name || !bssid) {
        return res.status(400).json({ error: 'Name and BSSID are required' });
    }
    
    bssidList.push({ name, bssid });
    
    io.emit('bssid-list-updated', { bssidList });
    
    res.json({ 
        success: true,
        bssidList: bssidList
    });
});

// Student Management endpoints
app.get('/api/students', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                error: 'Database not connected',
                students: []
            });
        }
        
        const { department, limit } = req.query;
        let query = {};
        if (department) query.department = department;
        
        const students = await Student.find(query)
            .limit(limit ? parseInt(limit) : 100)
            .sort({ startTime: -1 });
        
        res.json({ 
            students: students,
            count: students.length
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ student });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// Attendance History endpoints
app.get('/api/attendance/history', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            // Return in-memory records if DB not connected
            return res.json({ 
                records: attendanceRecords,
                count: attendanceRecords.length
            });
        }
        
        const { department, startDate, endDate, limit } = req.query;
        let query = {};
        
        if (department) query.department = department;
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) query.startTime.$gte = new Date(startDate);
            if (endDate) query.startTime.$lte = new Date(endDate);
        }
        
        const records = await AttendanceRecord.find(query)
            .limit(limit ? parseInt(limit) : 100)
            .sort({ startTime: -1 });
        
        res.json({ 
            records: records,
            count: records.length
        });
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
});

// Attendance Statistics
app.get('/api/attendance/statistics', async (req, res) => {
    try {
        const { department, date } = req.query;
        
        // Calculate statistics from in-memory data
        const activeStudents = Array.from(connectedStudents.values());
        const totalStudents = activeStudents.length;
        const presentStudents = activeStudents.filter(s => s.isPresent).length;
        const absentStudents = totalStudents - presentStudents;
        const completedStudents = activeStudents.filter(s => s.timerState === 'completed').length;
        
        // Calculate average attendance time
        const avgTime = totalStudents > 0 
            ? activeStudents.reduce((sum, s) => sum + (600 - s.timeRemaining), 0) / totalStudents
            : 0;
        
        res.json({
            totalStudents,
            presentStudents,
            absentStudents,
            completedStudents,
            averageAttendanceTime: Math.round(avgTime),
            attendanceRate: totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(2) : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// Random Ring endpoints
app.post('/api/random-ring/start', (req, res) => {
    const { numberOfStudents } = req.body;
    
    const activeStudents = Array.from(connectedStudents.values()).filter(s => s.isPresent);
    
    if (activeStudents.length === 0) {
        return res.status(400).json({ error: 'No active students' });
    }
    
    const count = Math.min(numberOfStudents, activeStudents.length);
    
    // Randomly select students
    const shuffled = activeStudents.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    randomRingStudents = selected.map(s => ({
        ...s,
        ringStatus: 'pending', // pending, accepted, rejected, student_confirmed
        ringTime: new Date().toISOString()
    }));
    
    // Broadcast to all teachers
    io.emit('random-ring-started', {
        students: randomRingStudents,
        count: count
    });
    
    // Send notification to selected students
    selected.forEach(student => {
        io.emit('random-ring-notification', {
            studentId: student.id,
            studentName: student.name,
            message: 'You have been selected for random ring! Please mark your presence.'
        });
    });
    
    res.json({
        success: true,
        selectedStudents: randomRingStudents,
        count: count
    });
});

app.post('/api/random-ring/teacher-response', (req, res) => {
    const { studentId, action } = req.body; // action: 'accept' or 'reject'
    
    const student = randomRingStudents.find(s => s.id === studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found in random ring' });
    }
    
    if (student.ringStatus === 'student_confirmed') {
        return res.status(400).json({ 
            error: 'Student already confirmed presence. Cannot change status.' 
        });
    }
    
    student.ringStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    const connectedStudent = connectedStudents.get(studentId);
    
    if (action === 'accept') {
        // Check WiFi status and resume timer if connected
        if (connectedStudent) {
            const isWiFiConnected = connectedStudent.bssid === AUTHORIZED_BSSID;
            
            if (isWiFiConnected) {
                // Resume timer - WiFi is connected
                connectedStudent.timerState = 'running';
                connectedStudent.attendanceStatus = 'attending';
                connectedStudent.isPresent = true;
                
                console.log(`✓ Student "${connectedStudent.name}" accepted - WiFi OK - Timer RESUMED`);
                
                // Notify student
                io.emit('random-ring-accepted', {
                    studentId: studentId,
                    message: 'Teacher accepted! Timer resumed.',
                    wifiStatus: 'connected',
                    timerState: 'running'
                });
            } else {
                // Pause timer - WiFi not connected
                connectedStudent.timerState = 'paused';
                connectedStudent.attendanceStatus = 'absent';
                connectedStudent.isPresent = false;
                
                console.log(`⚠️ Student "${connectedStudent.name}" accepted - WiFi DISCONNECTED - Timer PAUSED`);
                
                // Notify student
                io.emit('random-ring-accepted', {
                    studentId: studentId,
                    message: 'Teacher accepted but WiFi disconnected. Please reconnect to resume timer.',
                    wifiStatus: 'disconnected',
                    timerState: 'paused'
                });
            }
            
            connectedStudents.set(studentId, connectedStudent);
            
            // Broadcast updated student state to all teachers
            io.emit('student-updated', connectedStudent);
        }
    } else if (action === 'reject') {
        // Stop student's timer
        if (connectedStudent) {
            connectedStudent.isPresent = false;
            connectedStudent.timerState = 'completed';
            connectedStudent.attendanceStatus = 'absent';
            connectedStudent.timeRemaining = 0;
            connectedStudents.set(studentId, connectedStudent);
            
            console.log(`✗ Student "${connectedStudent.name}" rejected - Timer STOPPED`);
            
            // Broadcast updated student state
            io.emit('student-updated', connectedStudent);
        }
        
        // Notify student
        io.emit('random-ring-rejected', {
            studentId: studentId,
            message: 'Your attendance has been rejected by teacher'
        });
    }
    
    // Broadcast update to all teachers
    io.emit('random-ring-updated', {
        studentId: studentId,
        status: student.ringStatus,
        timerState: connectedStudent ? connectedStudent.timerState : 'unknown',
        wifiStatus: connectedStudent && connectedStudent.bssid === AUTHORIZED_BSSID ? 'connected' : 'disconnected'
    });
    
    res.json({
        success: true,
        student: student,
        connectedStudent: connectedStudent,
        wifiStatus: connectedStudent && connectedStudent.bssid === AUTHORIZED_BSSID ? 'connected' : 'disconnected',
        timerState: connectedStudent ? connectedStudent.timerState : 'unknown'
    });
});

app.post('/api/random-ring/student-confirm', (req, res) => {
    const { studentId } = req.body;
    
    const student = randomRingStudents.find(s => s.id === studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found in random ring' });
    }
    
    // Student confirmed - lock the status
    student.ringStatus = 'student_confirmed';
    student.confirmedAt = new Date().toISOString();
    
    // Ensure timer continues
    const connectedStudent = connectedStudents.get(studentId);
    if (connectedStudent) {
        connectedStudent.isPresent = true;
        connectedStudents.set(studentId, connectedStudent);
    }
    
    // Broadcast to all teachers
    io.emit('random-ring-student-confirmed', {
        studentId: studentId,
        studentName: student.name,
        message: 'Student confirmed presence - cannot be rejected now'
    });
    
    res.json({
        success: true,
        student: student,
        message: 'Presence confirmed successfully'
    });
});

app.get('/api/random-ring/status', (req, res) => {
    res.json({
        students: randomRingStudents,
        count: randomRingStudents.length
    });
});

// WebSocket connection handling
io.on('connection', async (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send current state to newly connected client
    socket.emit('initial-state', {
        students: Array.from(connectedStudents.values()),
        authorizedBSSID: AUTHORIZED_BSSID
    });
    
    // Handle student timer updates
    socket.on('timer-update', (data) => {
        const { studentId, timeRemaining } = data;
        const student = connectedStudents.get(studentId);
        
        if (student) {
            student.timeRemaining = timeRemaining;
            student.lastUpdate = new Date().toISOString();
            connectedStudents.set(studentId, student);
            
            // Broadcast to all teachers
            io.emit('student-timer-update', student);
        }
    });
    
    // Handle student disconnect
    socket.on('student-disconnect', (data) => {
        const { studentId } = data;
        const student = connectedStudents.get(studentId);
        
        if (student) {
            student.isPresent = false;
            student.disconnectedAt = new Date().toISOString();
            
            // Remove student from connected list to free up username
            connectedStudents.delete(studentId);
            
            console.log(`✗ Student "${student.name}" disconnected (ID: ${studentId})`);
            
            // Broadcast disconnect
            io.emit('student-disconnected', student);
        }
    });
    
    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Timer update loop - decrease time for students with running timers
setInterval(() => {
    let updated = false;
    
    connectedStudents.forEach((student, studentId) => {
        // Only decrement if timer is running
        if (student.timerState === 'running' && student.timeRemaining > 0) {
            student.timeRemaining--;
            updated = true;
            
            // Broadcast update
            io.emit('student-timer-update', student);
            
            // Check if completed
            if (student.timeRemaining === 0) {
                student.timerState = 'completed';
                student.attendanceStatus = 'attended';
                student.completedAt = new Date().toISOString();
                console.log(`✓ Student "${student.name}" completed attendance (ID: ${studentId})`);
                io.emit('student-completed', student);
                
                // Remove student after completion to free up username
                // Keep them for 5 seconds so teachers can see completion
                setTimeout(() => {
                    connectedStudents.delete(studentId);
                    console.log(`  Student "${student.name}" removed from active list`);
                }, 5000);
            }
        }
    });
}, 1000); // Update every second


// Disconnect student (manual)
app.post('/api/attendance/disconnect', (req, res) => {
    const { studentId } = req.body;
    
    const student = connectedStudents.get(studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    student.isPresent = false;
    student.disconnectedAt = new Date().toISOString();
    
    // Remove student from connected list
    connectedStudents.delete(studentId);
    
    console.log(`✗ Student "${student.name}" manually disconnected (ID: ${studentId})`);
    
    // Broadcast disconnect
    io.emit('student-disconnected', student);
    
    res.json({ 
        success: true,
        message: 'Student disconnected',
        student: student
    });
});

// Get server statistics
app.get('/api/statistics/server', (req, res) => {
    res.json({
        connectedStudents: connectedStudents.size,
        totalAttendanceRecords: attendanceRecords.length,
        randomRingActive: randomRingStudents.length > 0,
        randomRingCount: randomRingStudents.length,
        authorizedBSSID: AUTHORIZED_BSSID,
        bssidListCount: bssidList.length,
        uptime: process.uptime(),
        mongoDBConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

// Clear all attendance (for testing)
app.post('/api/attendance/clear-all', (req, res) => {
    const count = connectedStudents.size;
    connectedStudents.clear();
    attendanceRecords = [];
    randomRingStudents = [];
    
    io.emit('attendance-cleared', { message: 'All attendance cleared' });
    
    console.log(`✓ Cleared ${count} connected students`);
    
    res.json({ 
        success: true,
        message: `Cleared ${count} students`,
        clearedCount: count
    });
});

// Export attendance data
app.get('/api/attendance/export', async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        
        const students = Array.from(connectedStudents.values());
        
        if (format === 'csv') {
            // Generate CSV
            let csv = 'Name,Department,Room,Time Remaining,Status,Present,Start Time\n';
            students.forEach(s => {
                csv += `${s.name},${s.department},${s.room},${s.timeRemaining},${s.attendanceStatus},${s.isPresent},${s.startTime}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
            res.send(csv);
        } else {
            // JSON format
            res.json({
                students: students,
                count: students.length,
                exportTime: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ error: 'Failed to export attendance' });
    }
});

// Classroom management endpoints
app.get('/api/classrooms', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({ classrooms: classroomMappings });
        }
        
        const classrooms = await Classroom.find({});
        res.json({ 
            classrooms: classrooms,
            count: classrooms.length
        });
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ error: 'Failed to fetch classrooms' });
    }
});

app.post('/api/classrooms', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const { name, bssid, capacity, building, floor } = req.body;
        
        const classroom = new Classroom({
            name,
            bssid,
            capacity,
            building,
            floor
        });
        
        await classroom.save();
        
        io.emit('classroom-added', classroom);
        
        res.json({ 
            success: true,
            classroom: classroom
        });
    } catch (error) {
        console.error('Error adding classroom:', error);
        res.status(500).json({ error: 'Failed to add classroom' });
    }
});

// ========== SAMPLE DATA & QUICK SETUP ==========

// Load sample data endpoint
app.post('/api/setup/sample-data', (req, res) => {
    console.log('📦 Loading sample data...');
    
    const sampleData = {
        students: [
            { studentId: '2024CSE001', name: 'John Doe', email: 'john@example.com', phone: '1234567890', branch: 'CSE', semester: 5, rollNo: 'CSE001', batch: '2024', password: 'student123' },
            { studentId: '2024CSE002', name: 'Jane Smith', email: 'jane@example.com', phone: '1234567891', branch: 'CSE', semester: 5, rollNo: 'CSE002', batch: '2024', password: 'student123' },
            { studentId: '2024ECE001', name: 'Bob Johnson', email: 'bob@example.com', phone: '1234567892', branch: 'ECE', semester: 5, rollNo: 'ECE001', batch: '2024', password: 'student123' },
            { studentId: '2024ME001', name: 'Alice Brown', email: 'alice@example.com', phone: '1234567893', branch: 'ME', semester: 5, rollNo: 'ME001', batch: '2024', password: 'student123' }
        ],
        teachers: [
            { teacherId: 'T001', name: 'Dr. Smith', email: 'smith@college.edu', phone: '9876543210', department: 'CSE', subject: 'Data Structures', canEditTimetable: true, canViewAttendance: true },
            { teacherId: 'T002', name: 'Prof. Johnson', email: 'johnson@college.edu', phone: '9876543211', department: 'ECE', subject: 'Digital Electronics', canEditTimetable: true, canViewAttendance: true }
        ],
        timetables: [
            {
                branch: 'CSE',
                semester: 5,
                periods: [
                    { periodNumber: 1, startTime: '08:00', endTime: '09:00', monday: { subject: 'Data Structures', room: 'A101', teacher: 'Dr. Smith' }, tuesday: { subject: 'Algorithms', room: 'A101', teacher: 'Dr. Smith' } },
                    { periodNumber: 2, startTime: '09:00', endTime: '10:00', monday: { subject: 'DBMS', room: 'A102', teacher: 'Prof. Wilson' }, tuesday: { subject: 'OS', room: 'A102', teacher: 'Prof. Davis' } }
                ]
            }
        ],
        classrooms: [
            { classroom: 'Room A101', branch: 'CSE', semester: 5, bssid: 'ee:ee:6d:9d:6f:ba', wifiName: 'College_WiFi_A' },
            { classroom: 'Room B201', branch: 'ECE', semester: 5, bssid: 'aa:bb:cc:dd:ee:ff', wifiName: 'College_WiFi_B' }
        ],
        notices: [
            { title: 'Welcome Notice', content: 'Welcome to LetsBunk Attendance System!', category: 'General', target: 'All', postedBy: 'Admin', postedAt: new Date().toISOString() },
            { title: 'Holiday Notice', content: 'College will be closed tomorrow for maintenance.', category: 'Holiday', target: 'All', postedBy: 'Admin', postedAt: new Date().toISOString() }
        ]
    };
    
    console.log(`✓ Loaded ${sampleData.students.length} students`);
    console.log(`✓ Loaded ${sampleData.teachers.length} teachers`);
    console.log(`✓ Loaded ${sampleData.timetables.length} timetables`);
    console.log(`✓ Loaded ${sampleData.classrooms.length} classroom mappings`);
    console.log(`✓ Loaded ${sampleData.notices.length} notices`);
    
    res.json({ 
        success: true, 
        message: 'Sample data loaded successfully',
        data: sampleData
    });
});

// Configure WiFi mappings
app.post('/api/setup/wifi-mappings', (req, res) => {
    console.log('📡 Configuring WiFi mappings...');
    
    classroomMappings = [
        { classroom: 'Room A101', branch: 'CSE', semester: 5, bssid: 'ee:ee:6d:9d:6f:ba', wifiName: 'College_WiFi_A' },
        { classroom: 'Room A102', branch: 'CSE', semester: 6, bssid: 'ee:ee:6d:9d:6f:bb', wifiName: 'College_WiFi_A2' },
        { classroom: 'Room B201', branch: 'ECE', semester: 5, bssid: 'aa:bb:cc:dd:ee:ff', wifiName: 'College_WiFi_B' },
        { classroom: 'Room C301', branch: 'ME', semester: 5, bssid: '11:22:33:44:55:66', wifiName: 'College_WiFi_C' }
    ];
    
    bssidList = [
        { name: 'Main WiFi - Block A', bssid: 'ee:ee:6d:9d:6f:ba' },
        { name: 'Main WiFi - Block B', bssid: 'aa:bb:cc:dd:ee:ff' },
        { name: 'Main WiFi - Block C', bssid: '11:22:33:44:55:66' }
    ];
    
    console.log(`✓ Configured ${classroomMappings.length} classroom mappings`);
    console.log(`✓ Configured ${bssidList.length} WiFi networks`);
    
    res.json({ 
        success: true, 
        message: 'WiFi mappings configured successfully',
        classrooms: classroomMappings.length,
        networks: bssidList.length
    });
});

// Get sample data status
app.get('/api/setup/status', (req, res) => {
    res.json({
        sampleDataLoaded: true,
        studentsCount: 4,
        teachersCount: 2,
        timetablesCount: 1,
        classroomsCount: classroomMappings.length,
        wifiNetworksCount: bssidList.length
    });
});

// ========== BIOMETRIC AUTHENTICATION ==========

const bcrypt = require('bcrypt');

// Biometric data storage (in-memory for now, can be moved to MongoDB)
let biometricData = new Map(); // Key: studentId, Value: { fingerprintData, faceData }

// Register fingerprint
app.post('/api/biometric/register-fingerprint', async (req, res) => {
    try {
        const { studentId, fingerprintData } = req.body;
        
        if (!studentId || !fingerprintData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and fingerprint data are required' 
            });
        }

        // Hash fingerprint data for security
        const hashedFingerprint = await bcrypt.hash(fingerprintData, 12);
        
        // Store or update biometric data
        if (!biometricData.has(studentId)) {
            biometricData.set(studentId, {});
        }
        
        const studentBiometric = biometricData.get(studentId);
        studentBiometric.fingerprintData = hashedFingerprint;
        studentBiometric.fingerprintRegisteredAt = new Date().toISOString();
        
        console.log(`✅ Fingerprint registered for student: ${studentId}`);
        
        // Broadcast to admin panel
        io.emit('biometric-registered', {
            studentId,
            type: 'fingerprint',
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Fingerprint registered successfully',
            studentId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Fingerprint registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during fingerprint registration' 
        });
    }
});

// Register face
app.post('/api/biometric/register-face', async (req, res) => {
    try {
        const { studentId, faceData } = req.body;
        
        if (!studentId || !faceData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and face data are required' 
            });
        }

        if (faceData.length < 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid face data - data too short' 
            });
        }

        // Hash face data for security
        const hashedFace = await bcrypt.hash(faceData, 12);
        
        // Store or update biometric data
        if (!biometricData.has(studentId)) {
            biometricData.set(studentId, {});
        }
        
        const studentBiometric = biometricData.get(studentId);
        studentBiometric.faceData = hashedFace;
        studentBiometric.faceRegisteredAt = new Date().toISOString();
        
        console.log(`✅ Face data registered for student: ${studentId}`);
        
        // Broadcast to admin panel
        io.emit('biometric-registered', {
            studentId,
            type: 'face',
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Face data registered successfully',
            studentId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Face registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during face registration' 
        });
    }
});

// Verify fingerprint
app.post('/api/biometric/verify-fingerprint', async (req, res) => {
    try {
        const { studentId, fingerprintData } = req.body;

        if (!studentId || !fingerprintData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and fingerprint data are required' 
            });
        }

        const studentBiometric = biometricData.get(studentId);
        if (!studentBiometric || !studentBiometric.fingerprintData) {
            return res.status(404).json({ 
                success: false, 
                message: 'No fingerprint data registered for this student' 
            });
        }

        const startTime = Date.now();
        const isMatch = await bcrypt.compare(fingerprintData, studentBiometric.fingerprintData);
        const verificationTime = Date.now() - startTime;
        
        if (isMatch) {
            console.log(`✅ Fingerprint verified for student: ${studentId} (${verificationTime}ms)`);
            res.json({
                success: true,
                message: 'Fingerprint verified successfully',
                studentId,
                verificationTime,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`❌ Fingerprint verification failed for student: ${studentId}`);
            res.status(401).json({
                success: false,
                message: 'Fingerprint verification failed'
            });
        }

    } catch (error) {
        console.error('❌ Fingerprint verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during verification' 
        });
    }
});

// Verify face
app.post('/api/biometric/verify-face', async (req, res) => {
    try {
        const { studentId, faceData } = req.body;

        if (!studentId || !faceData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and face data are required' 
            });
        }

        const studentBiometric = biometricData.get(studentId);
        if (!studentBiometric || !studentBiometric.faceData) {
            return res.status(404).json({ 
                success: false, 
                message: 'No face data registered for this student' 
            });
        }

        const startTime = Date.now();
        const isMatch = await bcrypt.compare(faceData, studentBiometric.faceData);
        const verificationTime = Date.now() - startTime;
        
        if (isMatch) {
            console.log(`✅ Face verified for student: ${studentId} (${verificationTime}ms)`);
            res.json({
                success: true,
                message: 'Face verified successfully',
                studentId,
                verificationTime,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`❌ Face verification failed for student: ${studentId}`);
            res.status(401).json({
                success: false,
                message: 'Face verification failed'
            });
        }

    } catch (error) {
        console.error('❌ Face verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during verification' 
        });
    }
});

// Get biometric status for student
app.get('/api/biometric/status/:studentId', (req, res) => {
    const { studentId } = req.params;
    const studentBiometric = biometricData.get(studentId);
    
    if (!studentBiometric) {
        return res.json({
            success: true,
            studentId,
            hasFingerprint: false,
            hasFace: false
        });
    }
    
    res.json({
        success: true,
        studentId,
        hasFingerprint: !!studentBiometric.fingerprintData,
        hasFace: !!studentBiometric.faceData,
        fingerprintRegisteredAt: studentBiometric.fingerprintRegisteredAt,
        faceRegisteredAt: studentBiometric.faceRegisteredAt
    });
});

// Initiate biometric registration session
app.post('/api/biometric/initiate-registration', (req, res) => {
    const { studentId, studentName } = req.body;
    
    if (!studentId || !studentName) {
        return res.status(400).json({ 
            success: false, 
            message: 'Student ID and name are required' 
        });
    }
    
    // Broadcast to mobile app
    io.emit('biometric-registration-request', {
        studentId,
        studentName,
        timestamp: new Date().toISOString()
    });
    
    console.log(`📱 Biometric registration initiated for: ${studentName} (${studentId})`);
    
    res.json({
        success: true,
        message: 'Biometric registration request sent to mobile device',
        studentId,
        studentName
    });
});

// ========== PROFILE MANAGEMENT ENDPOINTS ==========

// Create Student Profile
app.post('/api/profiles/student', async (req, res) => {
    try {
        const { 
            studentId, name, email, phone, branch, semester, 
            rollNo, batch, parentName, parentPhone, address, 
            password, role 
        } = req.body;
        
        if (!studentId || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and name are required' 
            });
        }
        
        // Check if student already exists
        const existing = await StudentRecord.findOne({ studentId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Student ID already exists'
            });
        }
        
        const student = new StudentRecord({
            studentId,
            name,
            email: email || '',
            phone: phone || '',
            department: branch || 'General',
            semester: semester || '1st Semester',
            rollNo: rollNo || '',
            batch: batch || '',
            parentName: parentName || '',
            parentPhone: parentPhone || '',
            address: address || '',
            password: password || '',
            role: role || 'student',
            createdAt: new Date()
        });
        
        await student.save();
        
        console.log(`✅ Student profile created: ${name} (${studentId})`);
        
        res.json({
            success: true,
            message: 'Student profile created successfully',
            student
        });
    } catch (error) {
        console.error('❌ Error creating student profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create student profile: ' + error.message
        });
    }
});

// Get All Students
app.get('/api/profiles/students', async (req, res) => {
    try {
        const students = await StudentRecord.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            students,
            count: students.length
        });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch students',
            students: []
        });
    }
});

// Get Single Student
app.get('/api/profiles/student/:id', async (req, res) => {
    try {
        const student = await StudentRecord.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            student
        });
    } catch (error) {
        console.error('❌ Error fetching student:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch student'
        });
    }
});

// Update Student Profile
app.put('/api/profiles/student/:id', async (req, res) => {
    try {
        const { name, department, semester } = req.body;
        
        const student = await StudentRecord.findOneAndUpdate(
            { studentId: req.params.id },
            { name, department, semester, updatedAt: new Date() },
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        console.log(`✅ Student profile updated: ${student.name}`);
        
        res.json({
            success: true,
            message: 'Student profile updated successfully',
            student
        });
    } catch (error) {
        console.error('❌ Error updating student:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update student'
        });
    }
});

// Delete Student Profile
app.delete('/api/profiles/student/:id', async (req, res) => {
    try {
        const student = await StudentRecord.findOneAndDelete({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        console.log(`✅ Student profile deleted: ${student.name}`);
        
        res.json({
            success: true,
            message: 'Student profile deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete student'
        });
    }
});

// Create Teacher Profile
app.post('/api/profiles/teacher', async (req, res) => {
    try {
        const { teacherId, name, department, subject } = req.body;
        
        if (!teacherId || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Teacher ID and name are required' 
            });
        }
        
        // Check if teacher already exists
        const existing = await TeacherRecord.findOne({ teacherId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Teacher ID already exists'
            });
        }
        
        const teacher = new TeacherRecord({
            teacherId,
            name,
            department: department || 'General',
            subject: subject || 'General',
            createdAt: new Date()
        });
        
        await teacher.save();
        
        console.log(`✅ Teacher profile created: ${name} (${teacherId})`);
        
        res.json({
            success: true,
            message: 'Teacher profile created successfully',
            teacher
        });
    } catch (error) {
        console.error('❌ Error creating teacher profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create teacher profile: ' + error.message
        });
    }
});

// Get All Teachers
app.get('/api/profiles/teachers', async (req, res) => {
    try {
        const teachers = await TeacherRecord.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            teachers,
            count: teachers.length
        });
    } catch (error) {
        console.error('❌ Error fetching teachers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch teachers',
            teachers: []
        });
    }
});

// Get Single Teacher
app.get('/api/profiles/teacher/:id', async (req, res) => {
    try {
        const teacher = await TeacherRecord.findOne({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.json({
            success: true,
            teacher
        });
    } catch (error) {
        console.error('❌ Error fetching teacher:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch teacher'
        });
    }
});

// Update Teacher Profile
app.put('/api/profiles/teacher/:id', async (req, res) => {
    try {
        const { name, department, subject } = req.body;
        
        const teacher = await TeacherRecord.findOneAndUpdate(
            { teacherId: req.params.id },
            { name, department, subject, updatedAt: new Date() },
            { new: true }
        );
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        console.log(`✅ Teacher profile updated: ${teacher.name}`);
        
        res.json({
            success: true,
            message: 'Teacher profile updated successfully',
            teacher
        });
    } catch (error) {
        console.error('❌ Error updating teacher:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update teacher'
        });
    }
});

// Delete Teacher Profile
app.delete('/api/profiles/teacher/:id', async (req, res) => {
    try {
        const teacher = await TeacherRecord.findOneAndDelete({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        console.log(`✅ Teacher profile deleted: ${teacher.name}`);
        
        res.json({
            success: true,
            message: 'Teacher profile deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting teacher:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete teacher'
        });
    }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n===========================================`);
    console.log(`LetsBunk Server Started Successfully!`);
    console.log(`===========================================`);
    console.log(`Server URL: http://192.168.89.31:${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Authorized BSSID: ${AUTHORIZED_BSSID}`);
    console.log(`MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`\nSAMPLE LOGIN CREDENTIALS:`);
    console.log(`===========================================`);
    SAMPLE_USERS.forEach(user => {
        console.log(`   Username: ${user.username.padEnd(10)} | Password: ${user.password.padEnd(12)} | Role: ${user.role}`);
    });
    console.log(`===========================================`);
    console.log(`🎯 Admin Panel: Use any of the above credentials`);
    console.log(`📱 Student App: Connect to authorized WiFi network`);
    console.log(`⚡ WebSocket: Real-time updates enabled`);
    console.log(`===========================================`);
    console.log(`📋 Available API Endpoints:`);
    console.log(`===========================================`);
    console.log(`  POST /api/auth/login`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/config/bssid`);
    console.log(`  POST /api/verify-bssid`);
    console.log(`  POST /api/attendance/start`);
    console.log(`  POST /api/attendance/update`);
    console.log(`  POST /api/attendance/complete`);
    console.log(`  POST /api/attendance/pause`);
    console.log(`  POST /api/attendance/resume`);
    console.log(`  POST /api/attendance/disconnect`);
    console.log(`  GET  /api/attendance/history`);
    console.log(`  GET  /api/attendance/statistics`);
    console.log(`  GET  /api/attendance/export`);
    console.log(`  POST /api/attendance/clear-all`);
    console.log(`  GET  /api/timetable-table/:branch/:semester`);
    console.log(`  POST /api/timetable-table`);
    console.log(`  DELETE /api/timetable-table/:branch/:semester`);
    console.log(`  PUT  /api/config/bssid`);
    console.log(`  GET  /api/config/bssid-list`);
    console.log(`  POST /api/config/bssid-list`);
    console.log(`  GET  /api/students`);
    console.log(`  GET  /api/students/:id`);
    console.log(`  GET  /api/classrooms`);
    console.log(`  POST /api/classrooms`);
    console.log(`  GET  /api/statistics/server`);
    console.log(`  POST /api/random-ring/start`);
    console.log(`  POST /api/random-ring/teacher-response`);
    console.log(`  POST /api/random-ring/student-confirm`);
    console.log(`  GET  /api/random-ring/status`);
    console.log('===========================================');
    console.log('  WebSocket Events:');
    console.log(`  - initial-state`);
    console.log(`  - student-connected`);
    console.log(`  - student-updated`);
    console.log(`  - student-completed`);
    console.log(`  - student-paused`);
    console.log(`  - student-resumed`);
    console.log(`  - student-disconnected`);
    console.log(`  - student-timer-update`);
    console.log(`  - timetable-table-updated/deleted`);
    console.log(`  - bssid-updated`);
    console.log(`  - bssid-list-updated`);
    console.log(`  - classroom-added`);
    console.log(`  - attendance-cleared`);
    console.log(`  - random-ring-started`);
    console.log(`  - random-ring-notification`);
    console.log(`  - random-ring-updated`);
    console.log(`  - random-ring-accepted`);
    console.log(`  - random-ring-rejected`);
    console.log(`  - random-ring-student-confirmed`);
    console.log(`===========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
