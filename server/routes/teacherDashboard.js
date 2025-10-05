const express = require('express');
const router = express.Router();
const TeacherAssignment = require('../models/TeacherAssignment');
const StudentProfile = require('../models/StudentProfile');
const PeriodAttendance = require('../models/PeriodAttendance');
const User = require('../models/User');
const AttendanceService = require('../services/attendanceService');

/**
 * Get current lecture for teacher
 */
router.get('/current-lecture/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        const currentTime = new Date();
        const dayOfWeek = AttendanceService.getDayOfWeek(currentTime);
        const timeString = AttendanceService.formatTime(currentTime);

        // Find current assignment
        const assignment = await TeacherAssignment.findOne({
            teacherId: teacherId,
            dayOfWeek: dayOfWeek,
            isActive: true
        });

        if (!assignment) {
            return res.json({
                success: false,
                message: 'No lecture scheduled at this time',
                hasLecture: false
            });
        }

        // Check if current time is within lecture time
        if (timeString >= assignment.startTime && timeString <= assignment.endTime) {
            return res.json({
                success: true,
                hasLecture: true,
                lecture: {
                    subject: assignment.subject,
                    room: assignment.room,
                    branch: assignment.branch,
                    semester: assignment.semester,
                    startTime: assignment.startTime,
                    endTime: assignment.endTime,
                    periodNumber: assignment.periodNumber
                }
            });
        }

        res.json({
            success: false,
            message: 'No lecture at current time',
            hasLecture: false
        });

    } catch (error) {
        console.error('Error getting current lecture:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current lecture'
        });
    }
});

/**
 * Get students for teacher's current lecture
 */
router.get('/my-students/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        const currentTime = new Date();
        const dayOfWeek = AttendanceService.getDayOfWeek(currentTime);
        const timeString = AttendanceService.formatTime(currentTime);

        // Find current assignment
        const assignment = await TeacherAssignment.findOne({
            teacherId: teacherId,
            dayOfWeek: dayOfWeek,
            isActive: true
        });

        if (!assignment) {
            return res.json({
                success: true,
                students: [],
                message: 'No lecture scheduled'
            });
        }

        // Check if within lecture time
        if (timeString < assignment.startTime || timeString > assignment.endTime) {
            return res.json({
                success: true,
                students: [],
                message: 'Not in lecture time'
            });
        }

        // Get all students from this branch/semester/room
        const students = await User.find({
            role: 'student',
            branch: assignment.branch,
            semester: assignment.semester,
            isActive: true
        });

        // Get their profiles
        const studentProfiles = await Promise.all(
            students.map(async (student) => {
                const profile = await StudentProfile.findOne({ studentId: student.userId });
                
                // Check today's attendance for this period
                const today = AttendanceService.getDateOnly(currentTime);
                const todayAttendance = await PeriodAttendance.findOne({
                    studentId: student.userId,
                    date: today,
                    periodNumber: assignment.periodNumber
                });

                return {
                    studentId: student.userId,
                    name: student.name,
                    email: student.email,
                    rollNo: student.userId,
                    attendancePercentage: profile ? profile.overallAttendancePercentage : 0,
                    sessionalMarks: profile ? profile.sessionalMarks : 0,
                    cgpa: profile ? profile.cgpa : 0,
                    todayStatus: todayAttendance ? todayAttendance.status : 'absent',
                    todayCheckInTime: todayAttendance ? todayAttendance.checkInTime : null
                };
            })
        );

        res.json({
            success: true,
            lecture: {
                subject: assignment.subject,
                room: assignment.room,
                startTime: assignment.startTime,
                endTime: assignment.endTime
            },
            students: studentProfiles,
            count: studentProfiles.length
        });

    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get students'
        });
    }
});

/**
 * Get detailed student profile
 */
router.get('/student-detail/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await User.findOne({ userId: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        const profile = await StudentProfile.findOne({ studentId: studentId });
        
        // Get recent attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentAttendance = await PeriodAttendance.find({
            studentId: studentId,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1, periodNumber: 1 }).limit(50);

        // Get attendance by subject
        const attendanceBySubject = await PeriodAttendance.aggregate([
            { $match: { studentId: studentId } },
            {
                $group: {
                    _id: '$subject',
                    total: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    subject: '$_id',
                    total: 1,
                    present: 1,
                    percentage: {
                        $multiply: [
                            { $divide: ['$present', '$total'] },
                            100
                        ]
                    }
                }
            }
        ]);

        res.json({
            success: true,
            student: {
                studentId: student.userId,
                name: student.name,
                email: student.email,
                branch: student.branch,
                semester: student.semester,
                rollNo: student.userId
            },
            profile: profile || {},
            recentAttendance: recentAttendance,
            attendanceBySubject: attendanceBySubject
        });

    } catch (error) {
        console.error('Error getting student detail:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get student detail'
        });
    }
});

/**
 * Get teacher's schedule
 */
router.get('/schedule/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        const schedule = await TeacherAssignment.find({
            teacherId: teacherId,
            isActive: true
        }).sort({ dayOfWeek: 1, periodNumber: 1 });

        res.json({
            success: true,
            schedule: schedule
        });

    } catch (error) {
        console.error('Error getting schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get schedule'
        });
    }
});

module.exports = router;
