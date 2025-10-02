const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    department: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        index: true,
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
    guardianName: {
        type: String,
        trim: true
    },
    guardianPhone: {
        type: String
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
