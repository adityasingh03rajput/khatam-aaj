const Timetable = require('../../models/clean/Timetable');
const Attendance = require('../../models/clean/Attendance');
const Session = require('../../models/clean/Session');
const Performance = require('../../models/clean/Performance');
const { User, Student } = require('../../models/clean/User');

/**
 * Clean Attendance Service
 * Updated to use new clean schema with proper relationships
 */

class AttendanceService {
    /**
     * Get current period based on time and timetable
     */
    static async getCurrentPeriod(branch, semester, section = 'A', currentTime = new Date()) {
        try {
            const timetable = await Timetable.findOne({ 
                branch, 
                semester, 
                section,
                isActive: true 
            });
            
            if (!timetable) {
                return null;
            }

            const currentPeriod = timetable.getCurrentPeriod(currentTime);
            return currentPeriod;
        } catch (error) {
            console.error('Error getting current period:', error);
            return null;
        }
    }

    /**
     * Get all periods for today
     */
    static async getTodayPeriods(branch, semester, section = 'A', date = new Date()) {
        try {
            const timetable = await Timetable.findOne({ 
                branch, 
                semester, 
                section,
                isActive: true 
            });
            
            if (!timetable) {
                return [];
            }

            const dayOfWeek = this.getDayOfWeek(date);
            return timetable.getPeriodsForDay(dayOfWeek);
        } catch (error) {
            console.error('Error getting today periods:', error);
            return [];
        }
    }

    /**
     * Check if college is currently in session
     */
    static async isCollegeHours(branch, semester, section = 'A', currentTime = new Date()) {
        const currentPeriod = await this.getCurrentPeriod(branch, semester, section, currentTime);
        return currentPeriod !== null;
    }

    /**
     * Mark attendance for current period
     */
    static async markPeriodAttendance(studentId, bssid) {
        try {
            // Get student info
            const student = await Student.findOne({ userId: studentId });
            if (!student) {
                return {
                    success: false,
                    message: 'Student not found'
                };
            }

            const currentTime = new Date();
            const currentPeriod = await this.getCurrentPeriod(
                student.branch, 
                student.semester, 
                student.section, 
                currentTime
            );

            if (!currentPeriod) {
                return {
                    success: false,
                    message: 'No active period at this time'
                };
            }

            const today = this.getDateOnly(currentTime);

            // Check if attendance already marked
            let attendance = await Attendance.findOne({
                studentId: studentId,
                date: today,
                periodNumber: currentPeriod.periodNumber
            });

            if (attendance) {
                // Update existing attendance
                attendance.status = 'present';
                attendance.markedAt = currentTime;
                attendance.checkInTime = currentTime;
                await attendance.save();
            } else {
                // Create new attendance record
                attendance = new Attendance({
                    studentId: studentId,
                    date: today,
                    dayOfWeek: this.getDayOfWeek(currentTime),
                    periodNumber: currentPeriod.periodNumber,
                    subject: currentPeriod.subject,
                    teacherId: currentPeriod.teacherId,
                    room: currentPeriod.room,
                    startTime: currentPeriod.startTime,
                    endTime: currentPeriod.endTime,
                    status: 'present',
                    markedAt: currentTime,
                    checkInTime: currentTime,
                    markedBy: 'student',
                    academicYear: '2024-2025',
                    semester: student.semester
                });
                await attendance.save();
            }

            // Update performance metrics
            await Performance.recalculateForStudent(studentId);

            return {
                success: true,
                message: 'Attendance marked successfully',
                period: currentPeriod,
                attendance: attendance
            };
        } catch (error) {
            console.error('Error marking attendance:', error);
            return {
                success: false,
                message: 'Failed to mark attendance',
                error: error.message
            };
        }
    }

    /**
     * Get student's attendance for today
     */
    static async getTodayAttendance(studentId) {
        try {
            const student = await Student.findOne({ userId: studentId });
            if (!student) {
                return null;
            }

            const today = this.getDateOnly(new Date());
            const todayPeriods = await this.getTodayPeriods(
                student.branch, 
                student.semester, 
                student.section
            );
            
            const attendanceRecords = await Attendance.find({
                studentId: studentId,
                date: today
            }).sort({ periodNumber: 1 });

            const totalPeriods = todayPeriods.length;
            const periodsPresent = attendanceRecords.filter(r => r.status === 'present').length;
            const periodsAbsent = totalPeriods - periodsPresent;
            const attendancePercentage = totalPeriods > 0 ? (periodsPresent / totalPeriods) * 100 : 0;

            return {
                date: today,
                totalPeriods: totalPeriods,
                periodsPresent: periodsPresent,
                periodsAbsent: periodsAbsent,
                attendancePercentage: Math.round(attendancePercentage),
                periods: todayPeriods,
                attendanceRecords: attendanceRecords
            };
        } catch (error) {
            console.error('Error getting today attendance:', error);
            return null;
        }
    }

    /**
     * Update or create active session
     */
    static async updateActiveSession(studentId, socketId = null) {
        try {
            const student = await Student.findOne({ userId: studentId });
            if (!student) {
                return null;
            }

            const currentTime = new Date();
            const today = this.getDateOnly(currentTime);
            
            const currentPeriod = await this.getCurrentPeriod(
                student.branch, 
                student.semester, 
                student.section, 
                currentTime
            );

            // Get today's attendance summary
            const todayAttendance = await this.getTodayAttendance(studentId);

            let session = await Session.findOne({ studentId: studentId });

            if (!session) {
                // Create new session
                session = new Session({
                    studentId: studentId,
                    date: today,
                    isActive: true,
                    currentPeriod: currentPeriod,
                    periodsAttended: todayAttendance ? todayAttendance.periodsPresent : 0,
                    periodsTotal: todayAttendance ? todayAttendance.totalPeriods : 0,
                    todayPercentage: todayAttendance ? todayAttendance.attendancePercentage : 0,
                    socketId: socketId
                });
            } else {
                // Update existing session
                session.currentPeriod = currentPeriod;
                session.periodsAttended = todayAttendance ? todayAttendance.periodsPresent : 0;
                session.periodsTotal = todayAttendance ? todayAttendance.totalPeriods : 0;
                session.todayPercentage = todayAttendance ? todayAttendance.attendancePercentage : 0;
                session.socketId = socketId;
                session.lastActivity = currentTime;
            }

            await session.save();
            return session;
        } catch (error) {
            console.error('Error updating session:', error);
            return null;
        }
    }

    /**
     * Get all active sessions for teachers
     */
    static async getActiveSessions(branch = null, semester = null) {
        try {
            const query = { isActive: true };
            
            const sessions = await Session.find(query)
                .populate({
                    path: 'studentId',
                    match: {
                        ...(branch && { branch }),
                        ...(semester && { semester })
                    }
                })
                .sort({ lastActivity: -1 });

            // Filter out sessions where student didn't match
            const validSessions = sessions.filter(session => session.studentId);

            return validSessions;
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return [];
        }
    }

    /**
     * Helper: Get day of week
     */
    static getDayOfWeek(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }

    /**
     * Helper: Format time as HH:MM
     */
    static formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Helper: Get date without time
     */
    static getDateOnly(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get next period
     */
    static async getNextPeriod(branch, semester, section = 'A', currentTime = new Date()) {
        try {
            const timetable = await Timetable.findOne({ 
                branch, 
                semester, 
                section,
                isActive: true 
            });
            
            if (!timetable) {
                return null;
            }

            const dayOfWeek = this.getDayOfWeek(currentTime);
            const timeString = this.formatTime(currentTime);

            // Find next period
            const todayPeriods = timetable.getPeriodsForDay(dayOfWeek);
            const nextPeriod = todayPeriods.find(period => period.startTime > timeString);

            return nextPeriod || null;
        } catch (error) {
            console.error('Error getting next period:', error);
            return null;
        }
    }
}

module.exports = AttendanceService;
