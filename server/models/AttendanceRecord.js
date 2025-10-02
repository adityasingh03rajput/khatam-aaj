const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        index: true,
        trim: true
    },
    room: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        index: true,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    completedAt: {
        type: Date,
        index: true
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    totalPausedDuration: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['completed', 'incomplete', 'rejected', 'absent'],
        default: 'incomplete',
        index: true
    },
    bssid: String,
    attendancePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    randomRingStatus: {
        type: String,
        enum: ['none', 'selected', 'accepted', 'rejected', 'confirmed'],
        default: 'none'
    },
    sessionDate: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
attendanceRecordSchema.index({ department: 1, sessionDate: -1 });
attendanceRecordSchema.index({ studentId: 1, sessionDate: -1 });
attendanceRecordSchema.index({ status: 1, sessionDate: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
