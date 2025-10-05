const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Model for Authentication
 * Supports both Student and Teacher roles
 */
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true,
        index: true
    },
    // Student-specific fields
    branch: {
        type: String,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    rollNo: {
        type: String,
        trim: true
    },
    // Teacher-specific fields
    department: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    // Common fields
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date
    },
    profilePicture: {
        type: String
    },
    // Biometric data (hashed)
    fingerprintHash: {
        type: String
    },
    faceHash: {
        type: String
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
    const profile = {
        userId: this.userId,
        email: this.email,
        name: this.name,
        role: this.role,
        phone: this.phone,
        isActive: this.isActive,
        lastLogin: this.lastLogin
    };
    
    if (this.role === 'student') {
        profile.branch = this.branch;
        profile.semester = this.semester;
        profile.rollNo = this.rollNo;
    } else if (this.role === 'teacher') {
        profile.department = this.department;
        profile.subject = this.subject;
    }
    
    return profile;
};

// Indexes for efficient queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ branch: 1, semester: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
