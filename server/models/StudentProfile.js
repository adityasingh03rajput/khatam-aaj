const mongoose = require('mongoose');

/**
 * Student Profile Model
 * Extended student information including academic performance
 */
const studentProfileSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true,
        index: true
    },
    semester: {
        type: String,
        required: true
    },
    rollNo: {
        type: String
    },
    assignedRoom: {
        type: String,
        index: true
    },
    // Academic Performance
    sessionalMarks: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    cgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    // Attendance Statistics
    totalLectures: {
        type: Number,
        default: 0
    },
    attendedLectures: {
        type: Number,
        default: 0
    },
    overallAttendancePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Session Info
    sessionStartDate: {
        type: Date,
        default: () => new Date('2024-06-01')
    },
    lastAttendanceDate: {
        type: Date
    },
    // Performance Metrics
    averageAttendanceTime: {
        type: Number, // in minutes
        default: 0
    },
    lateAttendanceCount: {
        type: Number,
        default: 0
    },
    onTimeAttendanceCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate attendance percentage before saving
studentProfileSchema.pre('save', function(next) {
    if (this.totalLectures > 0) {
        this.overallAttendancePercentage = Math.round(
            (this.attendedLectures / this.totalLectures) * 100
        );
    }
    next();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
