const express = require('express');
const router = express.Router();
const Session = require('../../models/clean/Session');
const Attendance = require('../../models/clean/Attendance');
const Timetable = require('../../models/clean/Timetable');
const User = require('../../models/clean/User');

/**
 * NEW LECTURE-BASED ATTENDANCE SYSTEM
 * Student taps once in morning, system tracks all day
 */

// Start daily attendance session (one tap for whole day)
router.post('/start-daily-session', async (req, res) => {
    try {
        const { studentId, studentName, branch, semester, section } = req.body;
        
        // Check if it's college hours
        const now = new Date();
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        
        if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
            return res.json({
                success: false,
                message: 'College is closed on weekends'
            });
        }
        
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime < '09:40' || currentTime > '16:10') {
            return res.json({
                success: false,
                message: 'Outside college hours (9:40 AM - 4:10 PM)'
            });
        }
        
        // Get timetable for student
        const timetable = await Timetable.findOne({
            branch,
            semester,
            section: section || 'A',
            isActive: true
        });
        
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: 'Timetable not found for your class'
            });
        }
        
        // Get today's lectures
        const todayLectures = timetable.schedule
            .filter(p => p.dayOfWeek === dayOfWeek && p.type === 'lecture')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // Check if session already exists for today
        const today = now.toISOString().split('T')[0];
        let session = await Session.findOne({
            studentId,
            date: today
        });
        
        if (session) {
            return res.json({
                success: true,
                message: 'Session already active',
                session: session,
                currentLecture: getCurrentLecture(todayLectures, currentTime),
                todayLectures: todayLectures
            });
        }
        
        // Create new session
        session = await Session.create({
            studentId,
            studentName,
            branch,
            semester,
            section: section || 'A',
            date: today,
            dayOfWeek,
            startTime: currentTime,
            isActive: true,
            lectures: todayLectures.map(lecture => ({
                periodNumber: lecture.periodNumber,
                subject: lecture.subject,
                teacher: lecture.teacherId,
                room: lecture.room,
                startTime: lecture.startTime,
                endTime: lecture.endTime,
                status: 'pending',
                distance: 100
            }))
        });
        
        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('daily-session-started', {
                studentId,
                studentName,
                branch,
                semester,
                section,
                lectureCount: todayLectures.length
            });
        }
        
        res.json({
            success: true,
            message: 'Daily attendance session started',
            session: session,
            currentLecture: getCurrentLecture(todayLectures, currentTime),
            todayLectures: todayLectures
        });
        
    } catch (error) {
        console.error('Error starting daily session:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update lecture attendance (called automatically during lecture)
router.post('/update-lecture', async (req, res) => {
    try {
        const { studentId, periodNumber } = req.body;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Find session
        const session = await Session.findOne({
            studentId,
            date: today,
            isActive: true
        });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found'
            });
        }
        
        // Find lecture in session
        const lecture = session.lectures.find(l => l.periodNumber === periodNumber);
        
        if (!lecture) {
            return res.status(404).json({
                success: false,
                message: 'Lecture not found'
            });
        }
        
        // Calculate attendance
        if (!lecture.joinedAt) {
            lecture.joinedAt = currentTime;
        }
        
        const lectureStart = lecture.startTime;
        const lectureEnd = lecture.endTime;
        const joinTime = lecture.joinedAt;
        
        // Calculate minutes attended
        const startMinutes = timeToMinutes(lectureStart);
        const endMinutes = timeToMinutes(lectureEnd);
        const joinMinutes = timeToMinutes(joinTime);
        const currentMinutes = timeToMinutes(currentTime);
        
        const totalDuration = endMinutes - startMinutes;
        const attendedDuration = Math.min(currentMinutes, endMinutes) - Math.max(joinMinutes, startMinutes);
        
        lecture.minutesAttended = Math.max(0, attendedDuration);
        lecture.attendancePercent = Math.round((lecture.minutesAttended / totalDuration) * 100);
        
        // Calculate distance (higher % = closer to trophy)
        lecture.distance = 100 - lecture.attendancePercent;
        
        // Update status
        if (currentTime >= lectureEnd) {
            // Lecture ended
            if (lecture.attendancePercent >= 83) {
                lecture.status = 'present';
                lecture.trophyCaught = true;
            } else {
                lecture.status = 'absent';
            }
        } else {
            lecture.status = 'attending';
        }
        
        await session.save();
        
        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('lecture-updated', {
                studentId: session.studentId,
                studentName: session.studentName,
                periodNumber: lecture.periodNumber,
                subject: lecture.subject,
                status: lecture.status,
                distance: lecture.distance,
                attendancePercent: lecture.attendancePercent,
                trophyCaught: lecture.trophyCaught
            });
        }
        
        res.json({
            success: true,
            lecture: lecture,
            session: session
        });
        
    } catch (error) {
        console.error('Error updating lecture:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get current session status
router.get('/session-status/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const session = await Session.findOne({
            studentId,
            date: today
        });
        
        if (!session) {
            return res.json({
                success: true,
                hasSession: false,
                message: 'No session for today'
            });
        }
        
        // Get current and next lecture
        const currentLecture = session.lectures.find(l => 
            currentTime >= l.startTime && currentTime < l.endTime
        );
        
        const nextLecture = session.lectures.find(l => 
            currentTime < l.startTime
        );
        
        // Calculate overall attendance
        const completedLectures = session.lectures.filter(l => 
            l.status === 'present' || l.status === 'absent'
        );
        const presentCount = session.lectures.filter(l => l.status === 'present').length;
        const overallPercent = completedLectures.length > 0 
            ? Math.round((presentCount / completedLectures.length) * 100)
            : 0;
        
        res.json({
            success: true,
            hasSession: true,
            session: session,
            currentLecture: currentLecture,
            nextLecture: nextLecture,
            stats: {
                totalLectures: session.lectures.length,
                completed: completedLectures.length,
                present: presentCount,
                absent: session.lectures.filter(l => l.status === 'absent').length,
                overallPercent: overallPercent
            }
        });
        
    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get calendar data (month view)
router.get('/calendar/:studentId/:year/:month', async (req, res) => {
    try {
        const { studentId, year, month } = req.params;
        
        // Get all sessions for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const sessions = await Session.find({
            studentId,
            date: {
                $gte: startDate.toISOString().split('T')[0],
                $lte: endDate.toISOString().split('T')[0]
            }
        });
        
        // Build calendar data
        const calendarData = {};
        
        for (const session of sessions) {
            const completedLectures = session.lectures.filter(l => 
                l.status === 'present' || l.status === 'absent'
            );
            const presentCount = session.lectures.filter(l => l.status === 'present').length;
            const attendancePercent = completedLectures.length > 0
                ? Math.round((presentCount / completedLectures.length) * 100)
                : 0;
            
            let status = 'future';
            if (session.isActive) {
                status = 'attending';
            } else if (attendancePercent === 0) {
                status = 'absent';
            } else if (attendancePercent < 75) {
                status = 'present_low';
            } else {
                status = 'present_high';
            }
            
            calendarData[session.date] = {
                date: session.date,
                dayOfWeek: session.dayOfWeek,
                totalLectures: session.lectures.length,
                attended: presentCount,
                absent: session.lectures.filter(l => l.status === 'absent').length,
                attendancePercent: attendancePercent,
                status: status
            };
        }
        
        res.json({
            success: true,
            calendarData: calendarData
        });
        
    } catch (error) {
        console.error('Error getting calendar data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Teacher: Get students in current lecture
router.get('/teacher/current-lecture/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const now = new Date();
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = now.toISOString().split('T')[0];
        
        // Find teacher's current lecture
        const timetables = await Timetable.find({
            'schedule.teacherId': teacherId,
            'schedule.dayOfWeek': dayOfWeek,
            isActive: true
        });
        
        let currentLecture = null;
        let timetable = null;
        
        for (const tt of timetables) {
            const lecture = tt.schedule.find(p => 
                p.teacherId === teacherId &&
                p.dayOfWeek === dayOfWeek &&
                currentTime >= p.startTime &&
                currentTime < p.endTime &&
                p.type === 'lecture'
            );
            
            if (lecture) {
                currentLecture = lecture;
                timetable = tt;
                break;
            }
        }
        
        if (!currentLecture) {
            return res.json({
                success: true,
                hasLecture: false,
                message: 'No lecture at this time'
            });
        }
        
        // Get all students in this class/section
        const students = await User.find({
            role: 'student',
            branch: timetable.branch,
            semester: timetable.semester
        });
        
        // Get their sessions for today
        const studentIds = students.map(s => s.userId);
        const sessions = await Session.find({
            studentId: { $in: studentIds },
            date: today
        });
        
        // Build student status list
        const studentStatuses = students.map(student => {
            const session = sessions.find(s => s.studentId === student.userId);
            
            if (!session) {
                return {
                    studentId: student.userId,
                    studentName: student.name,
                    rollNo: student.rollNo,
                    status: 'absent',
                    joinedAt: null,
                    minutesInClass: 0,
                    distance: 100,
                    totalAttendancePercent: 0
                };
            }
            
            const lecture = session.lectures.find(l => l.periodNumber === currentLecture.periodNumber);
            
            if (!lecture) {
                return {
                    studentId: student.userId,
                    studentName: student.name,
                    rollNo: student.rollNo,
                    status: 'absent',
                    joinedAt: null,
                    minutesInClass: 0,
                    distance: 100,
                    totalAttendancePercent: 0
                };
            }
            
            // Calculate overall attendance
            const allSessions = sessions.filter(s => s.studentId === student.userId);
            let totalPresent = 0;
            let totalLectures = 0;
            
            for (const s of allSessions) {
                totalLectures += s.lectures.length;
                totalPresent += s.lectures.filter(l => l.status === 'present').length;
            }
            
            const overallPercent = totalLectures > 0 
                ? Math.round((totalPresent / totalLectures) * 100)
                : 0;
            
            return {
                studentId: student.userId,
                studentName: student.name,
                rollNo: student.rollNo,
                status: lecture.status,
                joinedAt: lecture.joinedAt,
                minutesInClass: lecture.minutesAttended,
                distance: lecture.distance,
                totalAttendancePercent: overallPercent
            };
        });
        
        res.json({
            success: true,
            hasLecture: true,
            lecture: {
                subject: currentLecture.subject,
                room: currentLecture.room,
                startTime: currentLecture.startTime,
                endTime: currentLecture.endTime,
                periodNumber: currentLecture.periodNumber
            },
            class: {
                branch: timetable.branch,
                semester: timetable.semester,
                section: timetable.section
            },
            students: studentStatuses
        });
        
    } catch (error) {
        console.error('Error getting teacher lecture:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Helper functions
function getCurrentLecture(lectures, currentTime) {
    return lectures.find(l => 
        currentTime >= l.startTime && currentTime < l.endTime
    );
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

module.exports = router;
