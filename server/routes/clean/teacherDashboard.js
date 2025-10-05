const express = require('express');
const router = express.Router();
const { Teacher, Student } = require('../../models/clean/User');
const Attendance = require('../../models/clean/Attendance');
const Timetable = require('../../models/clean/Timetable');
const Session = require('../../models/clean/Session');
const AttendanceService = require('../../services/clean/attendanceService');

/**
 * Clean Teacher Dashboard Routes
 * Updated to use new clean schema
 */

// Get teacher profile and subjects
router.get('/profile/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            teacher: teacher.getPublicProfile()
        });

    } catch (error) {
        console.error('Error getting teacher profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get teacher profile'
        });
    }
});

// Get teacher's current lecture
router.get('/current-lecture/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        // Find current period where this teacher is teaching
        const currentTime = new Date();
        const dayOfWeek = AttendanceService.getDayOfWeek(currentTime);
        const timeString = AttendanceService.formatTime(currentTime);

        const timetable = await Timetable.findOne({
            'schedule.teacherId': teacherId,
            'schedule.dayOfWeek': dayOfWeek,
            isActive: true
        });

        if (!timetable) {
            return res.json({
                success: true,
                hasLecture: false,
                message: 'No lecture at this time'
            });
        }

        const currentPeriod = timetable.schedule.find(period => 
            period.teacherId === teacherId &&
            period.dayOfWeek === dayOfWeek &&
            period.startTime <= timeString &&
            period.endTime > timeString
        );

        if (!currentPeriod) {
            return res.json({
                success: true,
                hasLecture: false,
                message: 'No lecture at this time'
            });
        }

        res.json({
            success: true,
            hasLecture: true,
            lecture: {
                ...currentPeriod.toObject(),
                branch: timetable.branch,
                semester: timetable.semester,
                section: timetable.section
            }
        });

    } catch (error) {
        console.error('Error getting current lecture:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current lecture'
        });
    }
});

// Get students in current lecture
router.get('/current-students/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        // Find current period
        const currentTime = new Date();
        const dayOfWeek = AttendanceService.getDayOfWeek(currentTime);
        const timeString = AttendanceService.formatTime(currentTime);

        const timetable = await Timetable.findOne({
            'schedule.teacherId': teacherId,
            'schedule.dayOfWeek': dayOfWeek,
            isActive: true
        });

        if (!timetable) {
            return res.json({
                success: true,
                students: [],
                message: 'No lecture at this time'
            });
        }

        const currentPeriod = timetable.schedule.find(period => 
            period.teacherId === teacherId &&
            period.dayOfWeek === dayOfWeek &&
            period.startTime <= timeString &&
            period.endTime > timeString
        );

        if (!currentPeriod) {
            return res.json({
                success: true,
                students: [],
                message: 'No lecture at this time'
            });
        }

        // Get all students in this class
        const students = await Student.find({
            branch: timetable.branch,
            semester: timetable.semester,
            section: timetable.section,
            isActive: true
        }).select('-password');

        // Get today's attendance for this period
        const today = AttendanceService.getDateOnly(currentTime);
        const attendanceRecords = await Attendance.find({
            teacherId: teacherId,
            date: today,
            periodNumber: currentPeriod.periodNumber
        });

        // Map attendance status to students
        const studentsWithAttendance = students.map(student => {
            const attendance = attendanceRecords.find(a => a.studentId === student.userId);
            return {
                ...student.toObject(),
                attendance: attendance ? attendance.status : 'absent',
                markedAt: attendance ? attendance.markedAt : null
            };
        });

        const presentCount = studentsWithAttendance.filter(s => s.attendance === 'present').length;
        const absentCount = studentsWithAttendance.filter(s => s.attendance === 'absent').length;

        res.json({
            success: true,
            lecture: {
                ...currentPeriod.toObject(),
                branch: timetable.branch,
                semester: timetable.semester,
                section: timetable.section
            },
            students: studentsWithAttendance,
            summary: {
                total: students.length,
                present: presentCount,
                absent: absentCount,
                percentage: students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error getting current students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get students'
        });
    }
});

// Mark attendance for a student (teacher override)
router.post('/mark-attendance', async (req, res) => {
    try {
        const { teacherId, studentId, status, periodNumber, date } = req.body;

        if (!teacherId || !studentId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        const student = await Student.findOne({ userId: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        const attendanceDate = date ? new Date(date) : AttendanceService.getDateOnly(new Date());
        const dayOfWeek = AttendanceService.getDayOfWeek(attendanceDate);

        // Find the period details
        const timetable = await Timetable.findOne({
            branch: student.branch,
            semester: student.semester,
            section: student.section,
            isActive: true
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                error: 'Timetable not found'
            });
        }

        const period = timetable.schedule.find(p => 
            p.periodNumber === periodNumber && 
            p.dayOfWeek === dayOfWeek
        );

        if (!period) {
            return res.status(404).json({
                success: false,
                error: 'Period not found'
            });
        }

        // Update or create attendance
        let attendance = await Attendance.findOne({
            studentId: studentId,
            date: attendanceDate,
            periodNumber: periodNumber
        });

        if (attendance) {
            attendance.status = status;
            attendance.markedBy = 'teacher';
            attendance.markedAt = new Date();
        } else {
            attendance = new Attendance({
                studentId: studentId,
                date: attendanceDate,
                dayOfWeek: dayOfWeek,
                periodNumber: periodNumber,
                subject: period.subject,
                teacherId: teacherId,
                room: period.room,
                startTime: period.startTime,
                endTime: period.endTime,
                status: status,
                markedBy: 'teacher',
                markedAt: new Date(),
                academicYear: '2024-2025',
                semester: student.semester
            });
        }

        await attendance.save();

        // Recalculate performance
        await require('../../models/clean/Performance').recalculateForStudent(studentId);

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance: attendance
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark attendance',
            message: error.message
        });
    }
});

// Get teacher's schedule for today
router.get('/today-schedule/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        const currentTime = new Date();
        const dayOfWeek = AttendanceService.getDayOfWeek(currentTime);

        // Find all timetables where this teacher teaches
        const timetables = await Timetable.find({
            'schedule.teacherId': teacherId,
            'schedule.dayOfWeek': dayOfWeek,
            isActive: true
        });

        const todayLectures = [];
        
        timetables.forEach(timetable => {
            const lectures = timetable.schedule.filter(period => 
                period.teacherId === teacherId && 
                period.dayOfWeek === dayOfWeek
            );
            
            lectures.forEach(lecture => {
                todayLectures.push({
                    ...lecture.toObject(),
                    branch: timetable.branch,
                    semester: timetable.semester,
                    section: timetable.section
                });
            });
        });

        // Sort by start time
        todayLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));

        res.json({
            success: true,
            lectures: todayLectures,
            count: todayLectures.length
        });

    } catch (error) {
        console.error('Error getting teacher schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get schedule'
        });
    }
});

// Get attendance report for a class
router.get('/attendance-report', async (req, res) => {
    try {
        const { teacherId, branch, semester, section, subject, startDate, endDate } = req.query;

        if (!teacherId || !branch || !semester) {
            return res.status(400).json({
                success: false,
                error: 'Teacher ID, branch, and semester are required'
            });
        }

        const query = {
            teacherId: teacherId,
            semester: semester
        };

        if (subject) query.subject = subject;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendanceRecords = await Attendance.find(query)
            .sort({ date: -1, periodNumber: 1 });

        // Get unique students
        const studentIds = [...new Set(attendanceRecords.map(r => r.studentId))];
        const students = await Student.find({
            userId: { $in: studentIds },
            branch: branch,
            semester: semester,
            ...(section && { section: section })
        }).select('-password');

        // Calculate stats per student
        const studentStats = students.map(student => {
            const studentRecords = attendanceRecords.filter(r => r.studentId === student.userId);
            const total = studentRecords.length;
            const present = studentRecords.filter(r => r.status === 'present').length;
            const absent = studentRecords.filter(r => r.status === 'absent').length;
            const percentage = total > 0 ? (present / total) * 100 : 0;

            return {
                student: student.toObject(),
                total: total,
                present: present,
                absent: absent,
                percentage: Math.round(percentage * 100) / 100
            };
        });

        // Sort by percentage
        studentStats.sort((a, b) => b.percentage - a.percentage);

        res.json({
            success: true,
            report: studentStats,
            summary: {
                totalStudents: students.length,
                totalLectures: attendanceRecords.length,
                averageAttendance: studentStats.length > 0 
                    ? Math.round(studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length * 100) / 100
                    : 0
            }
        });

    } catch (error) {
        console.error('Error getting attendance report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance report'
        });
    }
});

module.exports = router;
