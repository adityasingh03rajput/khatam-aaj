const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'letsbunk_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

/**
 * Authentication Routes
 */

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { userId, email, password, name, role, branch, semester, rollNo, department, subject, phone } = req.body;

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

        // Student-specific validation
        if (role === 'student' && (!branch || !semester)) {
            return res.status(400).json({
                success: false,
                error: 'Missing student fields',
                message: 'Branch and semester are required for students'
            });
        }

        // Teacher-specific validation
        if (role === 'teacher' && !department) {
            return res.status(400).json({
                success: false,
                error: 'Missing teacher fields',
                message: 'Department is required for teachers'
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

        // Create new user
        const userData = {
            userId,
            email,
            password,
            name,
            role,
            phone
        };

        if (role === 'student') {
            userData.branch = branch;
            userData.semester = semester;
            userData.rollNo = rollNo;
        } else if (role === 'teacher') {
            userData.department = department;
            userData.subject = subject;
        }

        const user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userId, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: user.getPublicProfile()
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
        const { userId, password, deviceId } = req.body;

        // Validation
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

        // Check for existing active session on another device (for students)
        if (user.role === 'student' && deviceId) {
            const ActiveSession = require('../models/ActiveSession');
            const existingSession = await ActiveSession.findOne({ studentId: user.userId });
            
            if (existingSession && existingSession.deviceId !== deviceId) {
                // Different device - force logout from old device
                console.log(`User ${user.userId} logging in from new device. Old device: ${existingSession.deviceId}, New device: ${deviceId}`);
                
                // Send force-logout to old device via WebSocket
                if (existingSession.socketId) {
                    const io = req.app.get('io');
                    if (io) {
                        console.log(`Sending force-logout to socket: ${existingSession.socketId}`);
                        io.to(existingSession.socketId).emit('force-logout', {
                            reason: 'logged_in_another_device',
                            message: 'You have been logged out because you logged in from another device.'
                        });
                    }
                }
                
                // Update session with new device ID
                existingSession.deviceId = deviceId;
                existingSession.socketId = null; // Will be updated when new device connects
                existingSession.lastActivity = new Date();
                await existingSession.save();
            }
        }

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
                error: 'Token required',
                message: 'Authentication token is required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user
        const user = await User.findOne({ userId: decoded.userId, isActive: true });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'User not found or inactive'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            user: user.getPublicProfile()
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'Authentication token is invalid'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Authentication token has expired'
            });
        }

        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
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
                error: 'User not found',
                message: 'User does not exist or is inactive'
            });
        }

        res.json({
            success: true,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
});

// Update profile
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // Don't allow updating sensitive fields
        delete updates.password;
        delete updates.userId;
        delete updates.email;
        delete updates.role;

        const user = await User.findOneAndUpdate(
            { userId: userId, isActive: true },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist or is inactive'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Missing fields',
                message: 'userId, currentPassword, and newPassword are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Invalid password',
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findOne({ userId: userId, isActive: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
            message: error.message
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
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

module.exports = router;
