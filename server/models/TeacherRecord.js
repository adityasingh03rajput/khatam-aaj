const mongoose = require('mongoose');

const teacherRecordSchema = new mongoose.Schema({
    employeeId: {
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
    subjects: [{
        subjectName: {
            type: String,
            trim: true
        },
        subjectCode: {
            type: String,
            trim: true
        },
        branch: {
            type: String,
            trim: true
        },
        semester: {
            type: String,
            trim: true
        }
    }],
    designation: {
        type: String,
        default: 'Assistant Professor',
        trim: true
    },
    qualification: {
        type: String,
        trim: true
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    specialization: {
        type: String,
        trim: true
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
teacherRecordSchema.index({ department: 1, isActive: 1 });
teacherRecordSchema.index({ designation: 1 });

module.exports = mongoose.model('TeacherRecord', teacherRecordSchema);
