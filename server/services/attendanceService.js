const TimetableTable = require('../models/TimetableTable');
const PeriodAttendance = require('../models/PeriodAttendance');
const ActiveSession = require('../models/ActiveSession');

/**
 * Attendance Service
 * Handles period-based attendance logic
 */

class AttendanceService {
    /**
     * Get current period based on time and timetable
     */
    static async getCurrentPeriod(branch, semester, currentTime = new Date()) {
        try {
            const timetable = await TimetableTable.findOne({ branch, semester, isActive: true });
            
            if (!timetable || !timetable.periods || timetable.periods.length === 0) {
                return null;
            }

            const dayOfWeek = this.getDayOfWeek(currentTime);
            const timeString = this.formatTime(currentTime);

            // Find the current period
            for (const period of timetable.periods) {
                if (this.isTimeInRange(timeString, period.startTime, period.endTime)) {
                    const dayData = period[dayOfWeek];
                    
                    if (dayData && dayData.subject && dayData.subject.trim() !== '' && 
                        dayData.subject.toUpperCase() !== 'BREAK' && 
                        dayData.subject.toUpperCase() !== 'LUNCH') {
                        return {
                            periodNumber: period.periodNumber,
                            startTime: period.startTime,
                            endTime: period.endTime,
                            subject: dayData.subject,
                            teacher: dayData.teacher || '',
                            room: dayData.room || '',
                            dayOfWeek: dayOfWeek
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting current period:', error);
            return null;
        }
    }

    /**
     * Get all periods for today
     */
    static async getTodayPeriods(branch, semester, date = new Date()) {
        try {
            const timetable = await TimetableTable.findOne({ branch, semester, isActive: true });
            
            if (!timetable || !timetable.periods || timetable.periods.length === 0) {
                return [];
            }

            const dayOfWeek = this.getDayOfWeek(date);
            const periods = [];

            for (const period of timetable.periods) {
                const dayData = period[dayOfWeek];
                
                if (dayData && dayData.subject && dayData.subject.trim() !== '' && 
                    dayData.subject.toUpperCase() !== 'BREAK' && 
                    dayData.subject.toUpperCase() !== 'LUNCH') {
                    periods.push({
                        periodNumber: period.periodNumber,
                        startTime: period.startTime,
                        endTime: period.endTime,
                        subject: dayData.subject,
                        teacher: dayData.teacher || '',
                        room: dayData.room || '',
                        dayOfWeek: dayOfWeek
                    });
                }
            }

            return periods;
        } catch (error) {
            console.error('Error getting today periods:', error);
            return [];
        }
    }

    /**
     * Check if college is currently in session
     */
    static async isCollegeHours(branch, semester, currentTime = new Date()) {
        const currentPeriod = await this.getCurrentPeriod(branch, semester, currentTime);
        return currentPeriod !== null;
    }

    /**
     * Mark attendance for current period
     */
    static async markPeriodAttendance(studentId, studentName, branch, semester, bssid) {
        try {
            const currentTime = new Date();
            const currentPeriod = await this.getCurrentPeriod(branch, semester, currentTime);

            if (!currentPeriod) {
                return {
                    success: false,
                    message: 'No active period at this time'
                };
            }

            const today = this.getDateOnly(currentTime);

            // Check if attendance already marked for this period
            let attendance = await PeriodAttendance.findOne({
                studentId: studentId,
                date: today,
                periodNumber: currentPeriod.periodNumber
            });

            if (attendance) {
                // Update existing attendance
                attendance.status = 'present';
                attendance.checkInTime = currentTime;
                attendance.bssid = bssid;
                await attendance.save();
            } else {
                // Create new attendance record
                attendance = new PeriodAttendance({
                    studentId: studentId,
                    studentName: studentName,
                    branch: branch,
                    semester: semester,
                    date: today,
                    dayOfWeek: currentPeriod.dayOfWeek,
                    periodNumber: currentPeriod.periodNumber,
                    periodStartTime: currentPeriod.startTime,
                    periodEndTime: currentPeriod.endTime,
                    subject: currentPeriod.subject,
                    teacher: currentPeriod.teacher,
                    room: currentPeriod.room,
                    status: 'present',
                    checkInTime: currentTime,
                    bssid: bssid
                });
                await attendance.save();
            }

            return {
                success: true,
                message: 'Attendance marked',
                period: currentPeriod,
                attendance: attendance
            };
        } catch (error) {
            console.error('Error marking period attendance:', error);
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
    static async getTodayAttendance(studentId, branch, semester) {
        try {
            const today = this.getDateOnly(new Date());
            const todayPeriods = await this.getTodayPeriods(branch, semester);
            
            const attendanceRecords = await PeriodAttendance.find({
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
     * Update active session
     */
    static async updateActiveSession(studentId, studentName, branch, semester, bssid, isPresent = true, deviceId = null) {
        try {
            const currentTime = new Date();
            const today = this.getDateOnly(currentTime);
            const dayOfWeek = this.getDayOfWeek(currentTime);
            const currentPeriod = await this.getCurrentPeriod(branch, semester, currentTime);

            let session = await ActiveSession.findOne({ studentId: studentId });

            if (!session) {
                // Create new session
                const todayPeriods = await this.getTodayPeriods(branch, semester);
                
                session = new ActiveSession({
                    studentId: studentId,
                    studentName: studentName,
                    branch: branch,
                    semester: semester,
                    sessionDate: today,
                    dayOfWeek: dayOfWeek,
                    currentPeriod: currentPeriod,
                    isPresent: isPresent,
                    lastCheckInTime: isPresent ? currentTime : null,
                    bssid: bssid,
                    deviceId: deviceId || 'unknown',
                    totalPeriodsToday: todayPeriods.length,
                    periodsAttended: []
                });
            } else {
                // Update existing session
                session.currentPeriod = currentPeriod;
                session.isPresent = isPresent;
                session.lastActivity = currentTime;
                session.bssid = bssid;
                if (deviceId) session.deviceId = deviceId;

                if (isPresent) {
                    session.lastCheckInTime = currentTime;
                } else {
                    session.lastCheckOutTime = currentTime;
                }
            }

            // Calculate today's attendance
            const todayAttendance = await this.getTodayAttendance(studentId, branch, semester);
            if (todayAttendance) {
                session.totalPeriodsToday = todayAttendance.totalPeriods;
                session.periodsPresent = todayAttendance.periodsPresent;
                session.periodsAbsent = todayAttendance.periodsAbsent;
                session.todayAttendancePercentage = todayAttendance.attendancePercentage;
            }

            await session.save();
            return session;
        } catch (error) {
            console.error('Error updating active session:', error);
            return null;
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
     * Helper: Check if time is in range
     */
    static isTimeInRange(currentTime, startTime, endTime) {
        return currentTime >= startTime && currentTime <= endTime;
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
    static async getNextPeriod(branch, semester, currentTime = new Date()) {
        try {
            const timetable = await TimetableTable.findOne({ branch, semester, isActive: true });
            
            if (!timetable || !timetable.periods || timetable.periods.length === 0) {
                return null;
            }

            const dayOfWeek = this.getDayOfWeek(currentTime);
            const timeString = this.formatTime(currentTime);

            // Find the next period
            for (const period of timetable.periods) {
                if (period.startTime > timeString) {
                    const dayData = period[dayOfWeek];
                    
                    if (dayData && dayData.subject && dayData.subject.trim() !== '' && 
                        dayData.subject.toUpperCase() !== 'BREAK' && 
                        dayData.subject.toUpperCase() !== 'LUNCH') {
                        return {
                            periodNumber: period.periodNumber,
                            startTime: period.startTime,
                            endTime: period.endTime,
                            subject: dayData.subject,
                            teacher: dayData.teacher || '',
                            room: dayData.room || '',
                            dayOfWeek: dayOfWeek
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting next period:', error);
            return null;
        }
    }
}

module.exports = AttendanceService;
