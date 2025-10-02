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

// API Routes

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

// Tabular Timetable endpoints
app.get('/api/timetable-table/:branch/:semester', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ Database not connected');
            return res.status(503).json({ 
                error: 'Database not connected',
                timetable: null,
                message: 'MongoDB is not connected'
            });
        }
        
        const { branch, semester } = req.params;
        
        console.log(`📥 Fetching timetable for ${branch} - ${semester}`);
        
        const timetable = await TimetableTable.findOne({ branch, semester });
        
        if (!timetable) {
            console.log(`⚠️  No timetable found for ${branch} - ${semester}`);
            // Return empty timetable with default periods
            return res.json({
                success: true,
                timetable: {
                    branch,
                    semester,
                    periods: []
                },
                message: 'No timetable found'
            });
        }
        
        console.log(`✅ Timetable found:`, {
            id: timetable._id,
            branch: timetable.branch,
            semester: timetable.semester,
            periodsCount: timetable.periods.length
        });
        
        res.json({
            success: true,
            timetable: {
                id: timetable._id,
                branch: timetable.branch,
                semester: timetable.semester,
                periods: timetable.periods
            },
            message: `Found ${timetable.periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error fetching tabular timetable:', error);
        res.status(500).json({ 
            error: 'Failed to fetch timetable',
            message: error.message
        });
    }
});

app.post('/api/timetable-table', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                error: 'Database not connected',
                message: 'MongoDB is not connected. Please check database connection.'
            });
        }
        
        const { branch, semester, periods } = req.body;
        
        console.log(`📥 Received timetable save request:`, {
            branch,
            semester,
            periodsCount: periods ? periods.length : 0
        });
        
        if (!branch || !semester || !periods) {
            console.error('❌ Missing required fields:', { branch: !!branch, semester: !!semester, periods: !!periods });
            return res.status(400).json({ error: 'Branch, semester, and periods are required' });
        }
        
        // Validate periods array
        if (!Array.isArray(periods)) {
            console.error('❌ Periods is not an array');
            return res.status(400).json({ error: 'Periods must be an array' });
        }
        
        // Update or create timetable
        const timetable = await TimetableTable.findOneAndUpdate(
            { branch, semester },
            { 
                branch, 
                semester, 
                periods,
                lastModifiedBy: 'Teacher',
                academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
            },
            { upsert: true, new: true, runValidators: true }
        );
        
        console.log(`✅ Timetable saved successfully:`, {
            id: timetable._id,
            branch: timetable.branch,
            semester: timetable.semester,
            periodsCount: timetable.periods.length
        });
        
        // Broadcast to all connected clients
        io.emit('timetable-table-updated', {
            branch: timetable.branch,
            semester: timetable.semester,
            periods: timetable.periods
        });
        
        res.json({
            success: true,
            timetable: {
                id: timetable._id,
                branch: timetable.branch,
                semester: timetable.semester,
                periods: timetable.periods
            },
            message: `Timetable saved with ${timetable.periods.length} periods`
        });
    } catch (error) {
        console.error('❌ Error saving tabular timetable:', error);
        res.status(500).json({ 
            error: 'Failed to save timetable',
            message: error.message,
            details: error.stack
        });
    }
});

app.delete('/api/timetable-table/:branch/:semester', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const { branch, semester } = req.params;
        
        const deleted = await TimetableTable.findOneAndDelete({ branch, semester });
        
        if (!deleted) {
            return res.status(404).json({ error: 'Timetable not found' });
        }
        
        console.log(`✓ Timetable deleted for ${branch} - ${semester}`);
        
        io.emit('timetable-table-deleted', { branch, semester });
        
        res.json({
            success: true,
            message: 'Timetable deleted'
        });
    } catch (error) {
        console.error('Error deleting tabular timetable:', error);
        res.status(500).json({ error: 'Failed to delete timetable' });
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

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Authorized BSSID: ${AUTHORIZED_BSSID}`);
    console.log(`MongoDB connection status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
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
    console.log('===========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
