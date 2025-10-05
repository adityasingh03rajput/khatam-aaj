const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * CORE MODEL: User
 * Single source of truth for all users (students, teachers, admins)
 */
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true,
        index: true
    },
    phone: String,
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: Date
}, {
    timestamps: true,
    discriminatorKey: 'role'
});

// Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.getPublicProfile = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

// Student Discriminator
const studentSchema = new mongoose.Schema({
    branch: { type: String, required: true, index: true },
    semester: { type: String, required: true },
    rollNo: String,
    section: { type: String, default: 'A' },
    admissionDate: { type: Date, default: Date.now }
});

const Student = User.discriminator('student', studentSchema);

// Teacher Discriminator
const teacherSchema = new mongoose.Schema({
    department: { type: String, required: true, index: true },
    subjects: [String],
    designation: String,
    qualification: String,
    experience: Number,
    joiningDate: { type: Date, default: Date.now }
});

const Teacher = User.discriminator('teacher', teacherSchema);

module.exports = { User, Student, Teacher };
