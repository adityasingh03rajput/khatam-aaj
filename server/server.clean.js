const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

/**
 * Clean Server Configuration
 * Updated to use new clean schema with normalized database structure
 */

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
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Import Clean Routes
const cleanAuthRoutes = require('./routes/clean/auth');
const cleanPeriodAttendanceRoutes = require('./routes/clean/periodAttendance');
const cleanTeacherDashboardRoutes = require('./routes/clean/teacherDashboard');
const lectureAttendanceRoutes = require('./routes/clean/lectureAttendance');

// Import Clean Services
const AttendanceService = require('./services/clean/attendanceService');
const Session = require('./models/clean/Session');

// Make io available to routes
app.set('io', io);

// Mount Clean API Routes
app.use('/api/auth', cleanAuthRoutes);
app.use('/api/period-attendance', cleanPeriodAttendanceRoutes);
app.use('/api/teacher', cleanTeacherDashboardRoutes);
app.use('/api/lecture', lectureAttendanceRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const activeSessions = await Session.countDocuments({ isActive: true });
        
        res.json({ 
            status: 'ok',
            version: '2.0-clean',
            timestamp: new Date().toISOString(),
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            activeSessions: activeSessions,
            schema: 'clean-normalized'
        });
    } catch (error) {
        res.json({
            status: 'ok',
            version: '2.0-clean',
            timestamp: new Date().toISOString(),
            database: 'error',
            error: error.message
        });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Student joins session
    socket.on('student-join', async (data) => {
        try {
            const { studentId } = data;
            
            // Update session with socket ID
            await AttendanceService.updateActiveSession(studentId, socket.id);
            
            socket.join(`student-${studentId}`);
            console.log(`✓ Student ${studentId} joined session`);
            
            // Send current period info
            const student = await require('./models/clean/User').Student.findOne({ userId: studentId });
            if (student) {
                const currentPeriod = await AttendanceService.getCurrentPeriod(
                    student.branch,
                    student.semester,
                    student.section
                );
                
                socket.emit('current-period', currentPeriod);
            }
        } catch (error) {
            console.error('Error in student-join:', error);
            socket.emit('error', { message: 'Failed to join session' });
        }
    });

    // Teacher joins dashboard
    socket.on('teacher-join', async (data) => {
        try {
            const { teacherId, branch, semester } = data;
            
            socket.join(`teacher-${teacherId}`);
            if (branch && semester) {
                socket.join(`class-${branch}-${semester}`);
            }
            
            console.log(`✓ Teacher ${teacherId} joined dashboard`);
            
            // Send active sessions
            const activeSessions = await AttendanceService.getActiveSessions(branch, semester);
            socket.emit('active-sessions', activeSessions);
        } catch (error) {
            console.error('Error in teacher-join:', error);
            socket.emit('error', { message: 'Failed to join dashboard' });
        }
    });

    // Mark attendance via WebSocket
    socket.on('mark-attendance', async (data) => {
        try {
            const { studentId, bssid } = data;
            
            const result = await AttendanceService.markPeriodAttendance(studentId, bssid);
            
            if (result.success) {
                // Notify student
                socket.emit('attendance-marked', result);
                
                // Notify teachers
                const student = await require('./models/clean/User').Student.findOne({ userId: studentId });
                if (student) {
                    io.to(`class-${student.branch}-${student.semester}`).emit('student-attendance-update', {
                        studentId: studentId,
                        period: result.period,
                        status: 'present'
                    });
                }
            } else {
                socket.emit('attendance-error', { message: result.message });
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            socket.emit('error', { message: 'Failed to mark attendance' });
        }
    });

    // Request current period
    socket.on('get-current-period', async (data) => {
        try {
            const { studentId } = data;
            
            const student = await require('./models/clean/User').Student.findOne({ userId: studentId });
            if (student) {
                const currentPeriod = await AttendanceService.getCurrentPeriod(
                    student.branch,
                    student.semester,
                    student.section
                );
                
                socket.emit('current-period', currentPeriod);
            }
        } catch (error) {
            console.error('Error getting current period:', error);
            socket.emit('error', { message: 'Failed to get current period' });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
    });
});

// Periodic broadcast of current period (every minute)
setInterval(async () => {
    try {
        const activeSessions = await Session.find({ isActive: true }).populate('studentId');
        
        for (const session of activeSessions) {
            if (session.studentId) {
                const currentPeriod = await AttendanceService.getCurrentPeriod(
                    session.studentId.branch,
                    session.studentId.semester,
                    session.studentId.section
                );
                
                if (session.socketId) {
                    io.to(session.socketId).emit('period-update', {
                        currentPeriod: currentPeriod,
                        session: session
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in periodic broadcast:', error);
    }
}, 60000); // Every 1 minute

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
    });
});

// Start server
server.listen(PORT, () => {
    console.log('\n🚀 LetsBunk Server (Clean Schema) Started!');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
    console.log(`📊 Schema: Clean Normalized v2.0`);
    console.log('='.repeat(50));
    console.log('\n📚 Available Endpoints:');
    console.log('  Auth:');
    console.log('    POST   /api/auth/register');
    console.log('    POST   /api/auth/login');
    console.log('    POST   /api/auth/verify');
    console.log('    GET    /api/auth/profile/:userId');
    console.log('    GET    /api/auth/users');
    console.log('\n  Period Attendance:');
    console.log('    GET    /api/period-attendance/current-period/:studentId');
    console.log('    GET    /api/period-attendance/today-schedule/:studentId');
    console.log('    POST   /api/period-attendance/mark');
    console.log('    GET    /api/period-attendance/today/:studentId');
    console.log('    GET    /api/period-attendance/history/:studentId');
    console.log('    GET    /api/period-attendance/performance/:studentId');
    console.log('    GET    /api/period-attendance/next-period/:studentId');
    console.log('    POST   /api/period-attendance/session/update');
    console.log('\n  Teacher Dashboard:');
    console.log('    GET    /api/teacher/profile/:teacherId');
    console.log('    GET    /api/teacher/current-lecture/:teacherId');
    console.log('    GET    /api/teacher/current-students/:teacherId');
    console.log('    POST   /api/teacher/mark-attendance');
    console.log('    GET    /api/teacher/today-schedule/:teacherId');
    console.log('    GET    /api/teacher/attendance-report');
    console.log('\n  System:');
    console.log('    GET    /api/health');
    console.log('\n✅ Server ready to accept connections!\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✓ HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('✓ MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = { app, server, io };
