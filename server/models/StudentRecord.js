const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    rollNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    rollNo: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true
    },
    phone: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        index: true,
        trim: true
    },
    semester: {
        type: String,
        index: true,
        trim: true
    },
    branch: {
        type: String,
        index: true,
        trim: true
    },
    batch: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        default: 'A',
        trim: true,
        uppercase: true
    },
    academicYear: {
        type: String,
        default: () => {
            const year = new Date().getFullYear();
            return `${year}-${year + 1}`;
        }
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        type: String,
        trim: true
    },
    parentName: {
        type: String,
        trim: true
    },
    parentPhone: {
        type: String,
        trim: true
    },
    guardianName: {
        type: String,
        trim: true
    },
    guardianPhone: {
        type: String
    },
    password: {
        type: String
    },
    role: {
        type: String,
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes
studentRecordSchema.index({ branch: 1, semester: 1, section: 1 });
studentRecordSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('StudentRecord', studentRecordSchema);
