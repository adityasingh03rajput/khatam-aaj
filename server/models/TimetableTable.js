const mongoose = require('mongoose');

/**
 * Tabular Timetable Model
 * Stores complete timetable for a branch/semester in period-based format
 */

const periodEntrySchema = new mongoose.Schema({
    subject: {
        type: String,
        default: '',
        trim: true
    },
    room: {
        type: String,
        default: '',
        trim: true
    },
    teacher: {
        type: String,
        default: '',
        trim: true
    }
}, { _id: false });

const periodSchema = new mongoose.Schema({
    periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format (HH:MM)!`
        }
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format (HH:MM)!`
        }
    },
    monday: {
        type: periodEntrySchema,
        default: () => ({})
    },
    tuesday: {
        type: periodEntrySchema,
        default: () => ({})
    },
    wednesday: {
        type: periodEntrySchema,
        default: () => ({})
    },
    thursday: {
        type: periodEntrySchema,
        default: () => ({})
    },
    friday: {
        type: periodEntrySchema,
        default: () => ({})
    },
    saturday: {
        type: periodEntrySchema,
        default: () => ({})
    }
}, { _id: false });

const timetableTableSchema = new mongoose.Schema({
    branch: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    semester: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    periods: [periodSchema],
    academicYear: {
        type: String,
        default: () => {
            const year = new Date().getFullYear();
            return `${year}-${year + 1}`;
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastModifiedBy: {
        type: String,
        default: 'Teacher'
    }
}, {
    timestamps: true
});

// Create compound index for branch and semester (unique combination)
timetableTableSchema.index({ branch: 1, semester: 1 }, { unique: true });
timetableTableSchema.index({ academicYear: 1 });

module.exports = mongoose.model('TimetableTable', timetableTableSchema);
