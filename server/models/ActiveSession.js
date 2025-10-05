const mongoose = require('mongoose');

/**
 * Active Session Model
 * Tracks real-time student sessions during college hours
 */
const activeSessionSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        trim: true
    },
    sessionDate: {
        type: Date,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    currentPeriod: {
        periodNumber: Number,
        subject: String,
        teacher: String,
        room: String,
        startTime: String,
        endTime: String
    },
    isPresent: {
        type: Boolean,
        default: true,
        index: true
    },
    lastCheckInTime: {
        type: Date
    },
    lastCheckOutTime: {
        type: Date
    },
    bssid: {
        type: String,
        trim: true
    },
    periodsAttended: [{
        periodNumber: Number,
        subject: String,
        status: String,
        checkInTime: Date,
        checkOutTime: Date
    }],
    totalPeriodsToday: {
        type: Number,
        default: 0
    },
    periodsPresent: {
        type: Number,
        default: 0
    },
    periodsAbsent: {
        type: Number,
        default: 0
    },
    todayAttendancePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    socketId: {
        type: String
    },
    deviceId: {
        type: String,
        required: true,
        trim: true
    },
    timerState: {
        isRunning: {
            type: Boolean,
            default: false
        },
        secondsRemaining: {
            type: Number,
            default: 600
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound indexes
activeSessionSchema.index({ branch: 1, semester: 1, sessionDate: -1 });
activeSessionSchema.index({ sessionDate: -1, isPresent: 1 });

module.exports = mongoose.model('ActiveSession', activeSessionSchema);
