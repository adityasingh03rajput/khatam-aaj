const mongoose = require('mongoose');

/**
 * Unified User Model for Students and Teachers
 * Replaces separate StudentRecord and TeacherRecord models
 */
const userSchema = new mongoose.Schema({
    // Common fields
    userId: {
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
        trim: true,
        index: true
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
    userType: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'admin'],
        index: true
    },
    
    // Student-specific fields
    rollNumber: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true, // Only required for students
        validate: {
            validator: function(v) {
                return this.userType !== 'student' || (v && v.length > 0);
            },
            message: 'Roll number is required for students'
        }
    },
    semester: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return this.userType !== 'student' || (v && v.length > 0);
            },
            message: 'Semester is required for students'
        }
    },
    branch: {
        type: String,
        trim: true,
        index: true,
        validate: {
            validator: function(v) {
                return this.userType !== 'student' || (v && v.length > 0);
            },
            message: 'Branch is required for students'
        }
    },
    section: {
        type: String,
        default: 'A',
        trim: true,
        uppercase: true
    },
    guardianName: {
        type: String,
        trim: true
    },
    guardianPhone: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    
    // Teacher-specific fields
    employeeId: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true, // Only required for teachers
        validate: {
            validator: function(v) {
                return this.userType !== 'teacher' || (v && v.length > 0);
            },
            message: 'Employee ID is required for teachers'
        }
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
    specialization: {
        type: String,
        trim: true
    },
    
    // Common fields
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
    joiningDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Authentication fields
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        select: false // Don't include in queries by default
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: function() {
            return this.userType;
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
userSchema.index({ userType: 1, department: 1, isActive: 1 });
userSchema.index({ branch: 1, semester: 1, section: 1 }); // For students
userSchema.index({ department: 1, designation: 1 }); // For teachers
userSchema.index({ academicYear: 1, isActive: 1 });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
    return `${this.name} (${this.userType === 'student' ? this.rollNumber : this.employeeId})`;
});

// Methods
userSchema.methods.isStudent = function() {
    return this.userType === 'student';
};

userSchema.methods.isTeacher = function() {
    return this.userType === 'teacher';
};

userSchema.methods.isAdmin = function() {
    return this.userType === 'admin';
};

// Static methods
userSchema.statics.findStudents = function(filters = {}) {
    return this.find({ userType: 'student', isActive: true, ...filters });
};

userSchema.statics.findTeachers = function(filters = {}) {
    return this.find({ userType: 'teacher', isActive: true, ...filters });
};

userSchema.statics.findByDepartment = function(department) {
    return this.find({ department, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
