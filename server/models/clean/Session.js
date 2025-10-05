const mongoose = require('mongoose');

/**
 * CORE MODEL: Session
 * Daily attendance session - one tap tracks all lectures for the day
 */

const lectureAttendanceSchema = new mongoose.Schema({
    periodNumber: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'attending', 'present', 'absent'],
        default: 'pending'
    },
    joinedAt: String,
    minutesAttended: {
        type: Number,
        default: 0
    },
    attendancePercent: {
        type: Number,
        default: 0
    },
    distance: {
        type: Number,
        default: 100
    },
    trophyCaught: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        required: true
    },
    startTime: String,
    endTime: String,
    
    // All lectures for the day
    lectures: [lectureAttendanceSchema],
    
    // Current Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Connection Info
    socketId: String,
    lastActivity: {
        type: Date,
        default: Date.now
    },
    
    // Auto-expire after 7 days
    expiresAt: {
        type: Date,
        default: () => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        },
        index: true
    }
}, {
    timestamps: true
});

// Unique constraint: one session per student per day
sessionSchema.index({ studentId: 1, date: 1 }, { unique: true });

// TTL Index - MongoDB will auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update last activity on any change
sessionSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});

module.exports = mongoose.model('Session', sessionSchema);
