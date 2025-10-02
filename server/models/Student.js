const mongoose = require('mongoose');

/**
 * Active Student Session Model
 * Tracks real-time attendance sessions for currently connected students
 */
const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    room: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        trim: true,
        index: true
    },
    semester: {
        type: String,
        trim: true
    },
    timeRemaining: {
        type: Number,
        default: 600,
        min: 0
    },
    timerState: {
        type: String,
        enum: ['running', 'paused', 'completed'],
        default: 'running',
        index: true
    },
    attendanceStatus: {
        type: String,
        enum: ['attending', 'absent', 'attended'],
        default: 'attending',
        index: true
    },
    isPresent: {
        type: Boolean,
        default: true,
        index: true
    },
    startTime: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date,
        index: true
    },
    lastPausedTime: Date,
    totalPausedDuration: {
        type: Number,
        default: 0
    },
    bssid: {
        type: String,
        trim: true
    },
    sessionDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipAddress: {
        type: String
    },
    deviceInfo: {
        type: String
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
studentSchema.index({ department: 1, timerState: 1 });
studentSchema.index({ sessionDate: -1, isPresent: 1 });

module.exports = mongoose.model('Student', studentSchema);
