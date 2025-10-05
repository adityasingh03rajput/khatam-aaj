const mongoose = require('mongoose');

/**
 * CORE MODEL: Timetable
 * Master schedule with teacher assignments
 */

const periodSchema = new mongoose.Schema({
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    periodNumber: {
        type: Number,
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
    subject: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true,
        ref: 'User'
    },
    room: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial', 'break'],
        default: 'lecture'
    }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    branch: {
        type: String,
        required: true,
        index: true
    },
    semester: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    academicYear: {
        type: String,
        default: '2024-2025'
    },
    schedule: [periodSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique constraint
timetableSchema.index(
    { branch: 1, semester: 1, section: 1, academicYear: 1 },
    { unique: true }
);

// Method to get current period
timetableSchema.methods.getCurrentPeriod = function(currentTime = new Date()) {
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentTime.getDay()];
    const timeString = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    
    return this.schedule.find(period => 
        period.dayOfWeek === dayOfWeek &&
        timeString >= period.startTime &&
        timeString <= period.endTime &&
        period.type !== 'break'
    );
};

// Method to get all periods for a day
timetableSchema.methods.getPeriodsForDay = function(dayOfWeek) {
    return this.schedule.filter(period => 
        period.dayOfWeek === dayOfWeek &&
        period.type !== 'break'
    );
};

module.exports = mongoose.model('Timetable', timetableSchema);
