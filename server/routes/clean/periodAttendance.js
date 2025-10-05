const express = require('express');
const router = express.Router();
const AttendanceService = require('../../services/clean/attendanceService');
const Attendance = require('../../models/clean/Attendance');
const { Student } = require('../../models/clean/User');
const Performance = require('../../models/clean/Performance');

/**
 * Clean Period Attendance Routes
 * Updated to use new clean schema
 */

// Get current period info
router.get('/current-period/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findOne({ userId: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        const currentPeriod = await AttendanceService.getCurrentPeriod(
            student.branch,
            student.semester,
            student.section
        );

        if (!currentPeriod) {
            return res.json({
                success: true,
                inSession: false,
                message: 'No active period at this time'
            });
        }

        res.json({
            success: true,
            inSession: true,
            period: currentPeriod
        });

    } catch (error) {
        console.error('Error getting current period:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current period'
        });
    }
});

// Get today's schedule
router.get('/today-schedule/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findOne({ userId: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        const todayPeriods = await AttendanceService.getTodayPeriods(
            student.branch,
            student.semester,
            student.section
        );

        res.json({
            success: true,
            periods: todayPeriods,
            count: todayPeriods.length
        });

    } catch (error) {
        console.error('Error getting today schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get schedule'
        });
    }
});

// Mark attendance for current period
router.post('/mark', async (req, res) => {
    try {
        const { studentId, bssid } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        const result = await AttendanceService.markPeriodAttendance(studentId, bssid);
        
        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark attendance',
            message: error.message
        });
    }
});

// Get today's attendance summary
router.get('/today/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const todayAttendance = await AttendanceService.getTodayAttendance(studentId);
        
        if (!todayAttendance) {
            return res.status(404).json({
                success: false,
                error: 'Student not found or no data available'
            });
        }

        res.json({
            success: true,
            attendance: todayAttendance
        });

    } catch (error) {
        console.error('Error getting today attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance'
        });
    }
});

// Get attendance history
router.get('/history/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, subject } = req.query;

        const query = { studentId: studentId };
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        if (subject) {
            query.subject = subject;
        }

        const attendanceRecords = await Attendance.find(query)
            .sort({ date: -1, periodNumber: 1 })
            .limit(100);

        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
        const percentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

        res.json({
            success: true,
            records: attendanceRecords,
            summary: {
                total: totalRecords,
                present: presentCount,
                absent: absentCount,
                percentage: Math.round(percentage * 100) / 100
            }
        });

    } catch (error) {
        console.error('Error getting attendance history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance history'
        });
    }
});

// Get overall performance
router.get('/performance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        let performance = await Performance.findOne({ studentId: studentId });
        
        if (!performance) {
            // Calculate if not exists
            performance = await Performance.recalculateForStudent(studentId);
        }

        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'No performance data available'
            });
        }

        res.json({
            success: true,
            performance: performance
        });

    } catch (error) {
        console.error('Error getting performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get performance'
        });
    }
});

// Get next period
router.get('/next-period/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findOne({ userId: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        const nextPeriod = await AttendanceService.getNextPeriod(
            student.branch,
            student.semester,
            student.section
        );

        if (!nextPeriod) {
            return res.json({
                success: true,
                hasNext: false,
                message: 'No more periods today'
            });
        }

        res.json({
            success: true,
            hasNext: true,
            period: nextPeriod
        });

    } catch (error) {
        console.error('Error getting next period:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get next period'
        });
    }
});

// Update active session
router.post('/session/update', async (req, res) => {
    try {
        const { studentId, socketId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        const session = await AttendanceService.updateActiveSession(studentId, socketId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Failed to update session'
            });
        }

        res.json({
            success: true,
            session: session
        });

    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update session'
        });
    }
});

module.exports = router;
