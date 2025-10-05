const express = require('express');
const router = express.Router();
const AttendanceService = require('../services/attendanceService');
const ActiveSession = require('../models/ActiveSession');
const PeriodAttendance = require('../models/PeriodAttendance');

/**
 * Period-based Attendance Routes
 */

// Start attendance session (check-in for the day)
router.post('/start', async (req, res) => {
    try {
        const { studentId, studentName, branch, semester, bssid, deviceId } = req.body;

        if (!studentId || !studentName || !branch || !semester || !deviceId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if already has active session today
        const existingSession = await ActiveSession.findOne({ studentId: studentId });
        if (existingSession) {
            const today = AttendanceService.getDateOnly(new Date());
            const sessionDate = AttendanceService.getDateOnly(existingSession.sessionDate);
            
            if (today.getTime() === sessionDate.getTime()) {
                // Check if it's the same device
                if (existingSession.deviceId !== deviceId) {
                    // Different device - force logout from old device and transfer session
                    const oldDeviceId = existingSession.deviceId;
                    
                    // Update session with new device ID
                    existingSession.deviceId = deviceId;
                    existingSession.lastActivity = new Date();
                    await existingSession.save();
                    
                    // Notify old device to logout (via WebSocket if connected)
                    if (existingSession.socketId) {
                        const io = req.app.get('io');
                        if (io) {
                            io.to(existingSession.socketId).emit('force-logout', {
                                reason: 'logged_in_another_device',
                                message: 'You have been logged out because you logged in from another device.'
                            });
                        }
                    }
                    
                    return res.json({
                        success: true,
                        message: 'Session transferred to new device',
                        session: existingSession,
                        transferred: true,
                        oldDeviceId: oldDeviceId
                    });
                }
                
                // Same device - resume session
                return res.json({
                    success: true,
                    message: 'Session resumed',
                    session: existingSession,
                    alreadyActive: true
                });
            } else {
                // Remove old session from different day
                await ActiveSession.deleteOne({ studentId: studentId });
            }
        }

        // Check if college is in session
        const currentPeriod = await AttendanceService.getCurrentPeriod(branch, semester);
        
        if (!currentPeriod) {
            return res.status(400).json({
                success: false,
                error: 'No active period',
                message: 'College is not in session right now. Please try during class hours.'
            });
        }

        // Create active session
        const session = await AttendanceService.updateActiveSession(
            studentId, studentName, branch, semester, bssid, true, deviceId
        );

        // Mark attendance for current period
        const attendanceResult = await AttendanceService.markPeriodAttendance(
            studentId, studentName, branch, semester, bssid
        );

        // Get today's schedule
        const todayAttendance = await AttendanceService.getTodayAttendance(studentId, branch, semester);

        res.json({
            success: true,
            message: 'Attendance session started',
            session: session,
            currentPeriod: currentPeriod,
            todayAttendance: todayAttendance,
            attendanceMarked: attendanceResult.success
        });

    } catch (error) {
        console.error('Error starting attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start attendance',
            message: error.message
        });
    }
});

// Check-in for current period
router.post('/checkin', async (req, res) => {
    try {
        const { studentId, studentName, branch, semester, bssid, deviceId } = req.body;

        // Check if college is in session
        const currentPeriod = await AttendanceService.getCurrentPeriod(branch, semester);
        
        if (!currentPeriod) {
            return res.status(400).json({
                success: false,
                error: 'No active period',
                message: 'No class is currently in session.'
            });
        }

        // Mark attendance for current period
        const result = await AttendanceService.markPeriodAttendance(
            studentId, studentName, branch, semester, bssid
        );

        // Update active session
        await AttendanceService.updateActiveSession(
            studentId, studentName, branch, semester, bssid, true, deviceId
        );

        // Get updated today's attendance
        const todayAttendance = await AttendanceService.getTodayAttendance(studentId, branch, semester);

        res.json({
            success: result.success,
            message: result.message,
            currentPeriod: currentPeriod,
            todayAttendance: todayAttendance
        });

    } catch (error) {
        console.error('Error checking in:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check in',
            message: error.message
        });
    }
});

// Get current status
router.get('/status/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const session = await ActiveSession.findOne({ studentId: studentId });
        
        if (!session) {
            return res.json({
                success: false,
                message: 'No active session',
                hasSession: false
            });
        }

        const currentPeriod = await AttendanceService.getCurrentPeriod(
            session.branch, session.semester
        );

        const nextPeriod = await AttendanceService.getNextPeriod(
            session.branch, session.semester
        );

        const todayAttendance = await AttendanceService.getTodayAttendance(
            studentId, session.branch, session.semester
        );

        res.json({
            success: true,
            hasSession: true,
            session: session,
            currentPeriod: currentPeriod,
            nextPeriod: nextPeriod,
            todayAttendance: todayAttendance,
            isCollegeHours: currentPeriod !== null
        });

    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status',
            message: error.message
        });
    }
});

// Get today's attendance summary
router.get('/today/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { branch, semester } = req.query;

        if (!branch || !semester) {
            return res.status(400).json({
                success: false,
                error: 'Branch and semester are required'
            });
        }

        const todayAttendance = await AttendanceService.getTodayAttendance(
            studentId, branch, semester
        );

        res.json({
            success: true,
            attendance: todayAttendance
        });

    } catch (error) {
        console.error('Error getting today attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance',
            message: error.message
        });
    }
});

// Get attendance history
router.get('/history/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, limit = 30 } = req.query;

        const query = { studentId: studentId };
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const records = await PeriodAttendance.find(query)
            .sort({ date: -1, periodNumber: 1 })
            .limit(parseInt(limit));

        // Group by date
        const groupedByDate = {};
        records.forEach(record => {
            const dateKey = record.date.toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(record);
        });

        res.json({
            success: true,
            records: records,
            groupedByDate: groupedByDate,
            totalRecords: records.length
        });

    } catch (error) {
        console.error('Error getting attendance history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get history',
            message: error.message
        });
    }
});

// End session (check-out for the day)
router.post('/end', async (req, res) => {
    try {
        const { studentId } = req.body;

        const session = await ActiveSession.findOne({ studentId: studentId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found'
            });
        }

        // Get final attendance summary
        const todayAttendance = await AttendanceService.getTodayAttendance(
            studentId, session.branch, session.semester
        );

        // Delete active session
        await ActiveSession.deleteOne({ studentId: studentId });

        res.json({
            success: true,
            message: 'Session ended',
            finalAttendance: todayAttendance
        });

    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session',
            message: error.message
        });
    }
});

// Teacher: Get all active sessions
router.get('/active-sessions', async (req, res) => {
    try {
        const { branch, semester } = req.query;

        const query = {};
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;

        const sessions = await ActiveSession.find(query)
            .sort({ lastActivity: -1 });

        // Get current period for each session
        const sessionsWithPeriod = await Promise.all(
            sessions.map(async (session) => {
                const currentPeriod = await AttendanceService.getCurrentPeriod(
                    session.branch, session.semester
                );
                return {
                    ...session.toObject(),
                    currentPeriod: currentPeriod
                };
            })
        );

        res.json({
            success: true,
            sessions: sessionsWithPeriod,
            count: sessionsWithPeriod.length
        });

    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get active sessions',
            message: error.message
        });
    }
});

// Teacher: Get period attendance report
router.get('/period-report', async (req, res) => {
    try {
        const { branch, semester, date, periodNumber } = req.query;

        if (!branch || !semester || !date || !periodNumber) {
            return res.status(400).json({
                success: false,
                error: 'Branch, semester, date, and periodNumber are required'
            });
        }

        const queryDate = AttendanceService.getDateOnly(new Date(date));

        const attendanceRecords = await PeriodAttendance.find({
            branch: branch,
            semester: semester,
            date: queryDate,
            periodNumber: parseInt(periodNumber)
        }).sort({ studentName: 1 });

        const present = attendanceRecords.filter(r => r.status === 'present').length;
        const absent = attendanceRecords.filter(r => r.status === 'absent').length;
        const total = attendanceRecords.length;

        res.json({
            success: true,
            records: attendanceRecords,
            summary: {
                total: total,
                present: present,
                absent: absent,
                attendancePercentage: total > 0 ? Math.round((present / total) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error getting period report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get report',
            message: error.message
        });
    }
});

// Update timer state
router.post('/timer/update', async (req, res) => {
    try {
        const { studentId, isRunning, secondsRemaining } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        const session = await ActiveSession.findOne({ studentId: studentId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found'
            });
        }

        // Update timer state
        session.timerState = {
            isRunning: isRunning !== undefined ? isRunning : session.timerState?.isRunning || false,
            secondsRemaining: secondsRemaining !== undefined ? secondsRemaining : session.timerState?.secondsRemaining || 600,
            lastUpdated: new Date()
        };
        session.lastActivity = new Date();
        
        await session.save();

        res.json({
            success: true,
            message: 'Timer state updated',
            timerState: session.timerState
        });

    } catch (error) {
        console.error('Error updating timer state:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update timer state',
            message: error.message
        });
    }
});

// Get timer state
router.get('/timer/state/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const session = await ActiveSession.findOne({ studentId: studentId });
        
        if (!session) {
            return res.json({
                success: false,
                message: 'No active session found',
                timerState: null
            });
        }

        res.json({
            success: true,
            timerState: session.timerState || {
                isRunning: false,
                secondsRemaining: 600,
                lastUpdated: new Date()
            },
            session: session
        });

    } catch (error) {
        console.error('Error getting timer state:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get timer state',
            message: error.message
        });
    }
});

module.exports = router;
