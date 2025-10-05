const mongoose = require('mongoose');

/**
 * CORE MODEL: Attendance
 * Single unified attendance tracking
 */
const attendanceSchema = new mongoose.Schema({
    // Student Reference
    studentId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    
    // Date & Time
    date: {
        type: Date,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    
    // Lecture Details
    periodNumber: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    room: {
        type: String,
        required: true
    },
    startTime: String,
    endTime: String,
    
    // Attendance Status
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'absent',
        index: true
    },
    
    // Timing Details
    markedAt: Date,
    checkInTime: Date,
    checkOutTime: Date,
    durationMinutes: Number,
    
    // Validation
    markedBy: {
        type: String,
        enum: ['student', 'teacher', 'system'],
        default: 'student'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: String,
    
    // Metadata
    academicYear: {
        type: String,
        default: '2024-2025'
    },
    semester: String,
    notes: String
}, {
    timestamps: true
});

// Compound Indexes
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ teacherId: 1, date: -1, periodNumber: 1 });
attendanceSchema.index({ date: 1, periodNumber: 1, room: 1 });

// Unique constraint: one record per student per period per day
attendanceSchema.index(
    { studentId: 1, date: 1, periodNumber: 1 },
    { unique: true }
);

// Virtual for student details
attendanceSchema.virtual('student', {
    ref: 'User',
    localField: 'studentId',
    foreignField: 'userId',
    justOne: true
});

// Virtual for teacher details
attendanceSchema.virtual('teacher', {
    ref: 'User',
    localField: 'teacherId',
    foreignField: 'userId',
    justOne: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
