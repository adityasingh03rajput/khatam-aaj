const express = require('express');
const router = express.Router();
const { User, Student, Teacher } = require('../../models/clean/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'letsbunk_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

/**
 * Clean Authentication Routes
 * Updated to use new clean schema
 */

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { userId, email, password, name, role, branch, semester, rollNo, department, subjects, phone } = req.body;

        // Validation
        if (!userId || !email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'userId, email, password, name, and role are required'
            });
        }

        // Validate role
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role',
                message: 'Role must be student, teacher, or admin'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ userId: userId }, { email: email }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: existingUser.userId === userId 
                    ? 'User ID already registered' 
                    : 'Email already registered'
            });
        }

        // Create user based on role
        let newUser;
        
        if (role === 'student') {
            // Student-specific validation
            if (!branch || !semester) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing student fields',
                    message: 'Branch and semester are required for students'
                });
            }
            
            newUser = new Student({
                userId,
                email,
                password,
                name,
                phone,
                branch,
                semester,
                rollNo: rollNo || userId,
                section: 'A'
            });
        } else if (role === 'teacher') {
            // Teacher-specific validation
            if (!department) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing teacher fields',
                    message: 'Department is required for teachers'
                });
            }
            
            newUser = new Teacher({
                userId,
                email,
                password,
                name,
                phone,
                department,
                subjects: subjects ? subjects.split(',').map(s => s.trim()) : ['General'],
                designation: 'Assistant Professor'
            });
        } else {
            // Admin user
            newUser = new User({
                userId,
                email,
                password,
                name,
                role: 'admin',
                phone
            });
        }

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.userId, role: newUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: newUser.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing credentials',
                message: 'User ID and password are required'
            });
        }

        // Find user (can login with userId or email)
        const user = await User.findOne({
            $or: [{ userId: userId }, { email: userId }],
            isActive: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'User ID or password is incorrect'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'User ID or password is incorrect'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userId, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});

// Verify token
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ userId: decoded.userId, isActive: true });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            user: user.getPublicProfile()
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ userId: userId, isActive: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.getPublicProfile()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const { role, branch, semester, department } = req.query;

        const query = { isActive: true };
        if (role) query.role = role;
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;
        if (department) query.department = department;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users: users.map(u => u.getPublicProfile()),
            count: users.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

module.exports = router;
