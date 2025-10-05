const mongoose = require('mongoose');

/**
 * Teacher Assignment Model
 * Links teachers to specific lectures, rooms, and student groups
 */
const teacherAssignmentSchema = new mongoose.Schema({
    teacherId: {
        type: String,
        required: true,
        index: true
    },
    teacherName: {
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
    subject: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true,
        index: true
    },
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
    academicYear: {
        type: String,
        default: '2024-2025'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound indexes
teacherAssignmentSchema.index({ teacherId: 1, dayOfWeek: 1, periodNumber: 1 });
teacherAssignmentSchema.index({ room: 1, dayOfWeek: 1, periodNumber: 1 });
teacherAssignmentSchema.index({ branch: 1, semester: 1 });

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
