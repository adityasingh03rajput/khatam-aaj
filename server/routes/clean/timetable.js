const express = require('express');
const router = express.Router();
const Timetable = require('../../models/clean/Timetable');
const { Teacher } = require('../../models/clean/User');

/**
 * Clean Timetable Routes
 * Updated to use new clean schema
 */

// Get timetable for a class
router.get('/:branch/:semester/:section?', async (req, res) => {
    try {
        const { branch, semester, section = 'A' } = req.params;
        
        const timetable = await Timetable.findOne({
            branch: branch,
            semester: semester,
            section: section,
            isActive: true
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                error: 'Timetable not found',
                message: `No timetable found for ${branch} - Semester ${semester} - Section ${section}`
            });
        }

        res.json({
            success: true,
            timetable: timetable
        });

    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timetable'
        });
    }
});

// Get periods for a specific day
router.get('/:branch/:semester/:section/day/:dayOfWeek', async (req, res) => {
    try {
        const { branch, semester, section, dayOfWeek } = req.params;
        
        const timetable = await Timetable.findOne({
            branch: branch,
            semester: semester,
            section: section,
            isActive: true
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                error: 'Timetable not found'
            });
        }

        const periods = timetable.getPeriodsForDay(dayOfWeek.toLowerCase());

        res.json({
            success: true,
            dayOfWeek: dayOfWeek,
            periods: periods,
            count: periods.length
        });

    } catch (error) {
        console.error('Error fetching day periods:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch periods'
        });
    }
});

// Create or update timetable
router.post('/', async (req, res) => {
    try {
        const { branch, semester, section = 'A', schedule, academicYear = '2024-2025' } = req.body;

        if (!branch || !semester || !schedule || !Array.isArray(schedule)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'branch, semester, and schedule array are required'
            });
        }

        // Validate schedule entries
        for (const period of schedule) {
            if (!period.dayOfWeek || !period.periodNumber || !period.startTime || !period.endTime || !period.subject) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid schedule entry',
                    message: 'Each period must have dayOfWeek, periodNumber, startTime, endTime, and subject'
                });
            }

            // Validate teacher exists if provided
            if (period.teacherId) {
                const teacher = await Teacher.findOne({ userId: period.teacherId });
                if (!teacher) {
                    return res.status(404).json({
                        success: false,
                        error: 'Teacher not found',
                        message: `Teacher ${period.teacherId} not found`
                    });
                }
            }
        }

        // Update or create timetable
        let timetable = await Timetable.findOne({ branch, semester, section });

        if (timetable) {
            timetable.schedule = schedule;
            timetable.academicYear = academicYear;
            timetable.updatedAt = new Date();
        } else {
            timetable = new Timetable({
                branch,
                semester,
                section,
                schedule,
                academicYear,
                isActive: true
            });
        }

        await timetable.save();

        res.json({
            success: true,
            message: timetable.isNew ? 'Timetable created' : 'Timetable updated',
            timetable: timetable
        });

    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save timetable',
            message: error.message
        });
    }
});

// Delete timetable
router.delete('/:branch/:semester/:section?', async (req, res) => {
    try {
        const { branch, semester, section = 'A' } = req.params;

        const result = await Timetable.deleteOne({ branch, semester, section });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Timetable not found'
            });
        }

        res.json({
            success: true,
            message: 'Timetable deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete timetable'
        });
    }
});

// Get all timetables (admin)
router.get('/', async (req, res) => {
    try {
        const { branch, semester, academicYear } = req.query;

        const query = { isActive: true };
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;
        if (academicYear) query.academicYear = academicYear;

        const timetables = await Timetable.find(query).sort({ branch: 1, semester: 1, section: 1 });

        res.json({
            success: true,
            timetables: timetables,
            count: timetables.length
        });

    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timetables'
        });
    }
});

module.exports = router;
