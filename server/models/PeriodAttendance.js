const mongoose = require('mongoose');

/**
 * Period-based Attendance Model
 * Tracks attendance for each individual period/lecture
 */
const periodAttendanceSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
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
    date: {
        type: Date,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        index: true
    },
    periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    periodStartTime: {
        type: String,
        required: true
    },
    periodEndTime: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    teacher: {
        type: String,
        trim: true
    },
    room: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'left_early'],
        default: 'absent',
        index: true
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    durationPresent: {
        type: Number, // in minutes
        default: 0
    },
    attendancePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    bssid: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: String
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
periodAttendanceSchema.index({ studentId: 1, date: -1 });
periodAttendanceSchema.index({ branch: 1, semester: 1, date: -1 });
periodAttendanceSchema.index({ date: -1, periodNumber: 1 });
periodAttendanceSchema.index({ subject: 1, date: -1 });

// Unique constraint: one attendance record per student per period per day
periodAttendanceSchema.index(
    { studentId: 1, date: 1, periodNumber: 1 }, 
    { unique: true }
);

module.exports = mongoose.model('PeriodAttendance', periodAttendanceSchema);
