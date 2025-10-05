/**
 * Setup Script for Period-Based Attendance System
 * Run this after upgrading to initialize the new system
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const TimetableTable = require('../models/TimetableTable');
const PeriodAttendance = require('../models/PeriodAttendance');
const ActiveSession = require('../models/ActiveSession');

async function setupPeriodAttendance() {
    try {
        console.log('🚀 Setting up Period-Based Attendance System...\n');

        // Connect to database
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create indexes
        console.log('📊 Creating database indexes...');
        await PeriodAttendance.createIndexes();
        await ActiveSession.createIndexes();
        console.log('✓ Indexes created\n');

        // Create sample timetable
        console.log('📅 Creating sample timetable...');
        const sampleTimetable = {
            branch: 'CSE',
            semester: '5',
            periods: [
                {
                    periodNumber: 1,
                    startTime: '08:00',
                    endTime: '09:00',
                    monday: { subject: 'Data Structures', room: 'A101', teacher: 'Dr. Smith' },
                    tuesday: { subject: 'Algorithms', room: 'A101', teacher: 'Dr. Smith' },
                    wednesday: { subject: 'Data Structures Lab', room: 'Lab1', teacher: 'Dr. Smith' },
                    thursday: { subject: 'Data Structures', room: 'A101', teacher: 'Dr. Smith' },
                    friday: { subject: 'Algorithms', room: 'A101', teacher: 'Dr. Smith' },
                    saturday: { subject: 'Tutorial', room: 'A101', teacher: 'Dr. Smith' }
                },
                {
                    periodNumber: 2,
                    startTime: '09:00',
                    endTime: '10:00',
                    monday: { subject: 'Database Systems', room: 'A102', teacher: 'Dr. Johnson' },
                    tuesday: { subject: 'Database Systems', room: 'A102', teacher: 'Dr. Johnson' },
                    wednesday: { subject: 'Database Lab', room: 'Lab2', teacher: 'Dr. Johnson' },
                    thursday: { subject: 'Database Systems', room: 'A102', teacher: 'Dr. Johnson' },
                    friday: { subject: 'Database Systems', room: 'A102', teacher: 'Dr. Johnson' },
                    saturday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Johnson' }
                },
                {
                    periodNumber: 3,
                    startTime: '10:00',
                    endTime: '11:00',
                    monday: { subject: 'Operating Systems', room: 'B201', teacher: 'Dr. Williams' },
                    tuesday: { subject: 'Operating Systems', room: 'B201', teacher: 'Dr. Williams' },
                    wednesday: { subject: 'OS Lab', room: 'Lab1', teacher: 'Dr. Williams' },
                    thursday: { subject: 'Operating Systems', room: 'B201', teacher: 'Dr. Williams' },
                    friday: { subject: 'Operating Systems', room: 'B201', teacher: 'Dr. Williams' },
                    saturday: { subject: 'Seminar', room: 'Auditorium', teacher: 'Guest' }
                },
                {
                    periodNumber: 4,
                    startTime: '11:00',
                    endTime: '11:30',
                    monday: { subject: 'BREAK', room: '', teacher: '' },
                    tuesday: { subject: 'BREAK', room: '', teacher: '' },
                    wednesday: { subject: 'BREAK', room: '', teacher: '' },
                    thursday: { subject: 'BREAK', room: '', teacher: '' },
                    friday: { subject: 'BREAK', room: '', teacher: '' },
                    saturday: { subject: 'BREAK', room: '', teacher: '' }
                },
                {
                    periodNumber: 5,
                    startTime: '11:30',
                    endTime: '12:30',
                    monday: { subject: 'Computer Networks', room: 'B202', teacher: 'Dr. Davis' },
                    tuesday: { subject: 'Computer Networks', room: 'B202', teacher: 'Dr. Davis' },
                    wednesday: { subject: 'Networks Lab', room: 'Lab2', teacher: 'Dr. Davis' },
                    thursday: { subject: 'Computer Networks', room: 'B202', teacher: 'Dr. Davis' },
                    friday: { subject: 'Computer Networks', room: 'B202', teacher: 'Dr. Davis' },
                    saturday: { subject: 'Sports', room: 'Ground', teacher: 'PE Teacher' }
                },
                {
                    periodNumber: 6,
                    startTime: '12:30',
                    endTime: '13:30',
                    monday: { subject: 'LUNCH', room: '', teacher: '' },
                    tuesday: { subject: 'LUNCH', room: '', teacher: '' },
                    wednesday: { subject: 'LUNCH', room: '', teacher: '' },
                    thursday: { subject: 'LUNCH', room: '', teacher: '' },
                    friday: { subject: 'LUNCH', room: '', teacher: '' },
                    saturday: { subject: 'LUNCH', room: '', teacher: '' }
                },
                {
                    periodNumber: 7,
                    startTime: '13:30',
                    endTime: '14:30',
                    monday: { subject: 'Software Engineering', room: 'C301', teacher: 'Dr. Kumar' },
                    tuesday: { subject: 'Software Engineering', room: 'C301', teacher: 'Dr. Kumar' },
                    wednesday: { subject: 'SE Project', room: 'Lab3', teacher: 'Dr. Kumar' },
                    thursday: { subject: 'Software Engineering', room: 'C301', teacher: 'Dr. Kumar' },
                    friday: { subject: 'Software Engineering', room: 'C301', teacher: 'Dr. Kumar' },
                    saturday: { subject: 'Library', room: 'Library', teacher: 'Librarian' }
                },
                {
                    periodNumber: 8,
                    startTime: '14:30',
                    endTime: '15:30',
                    monday: { subject: 'Machine Learning', room: 'C302', teacher: 'Dr. Patel' },
                    tuesday: { subject: 'Machine Learning', room: 'C302', teacher: 'Dr. Patel' },
                    wednesday: { subject: 'ML Lab', room: 'AI Lab', teacher: 'Dr. Patel' },
                    thursday: { subject: 'Machine Learning', room: 'C302', teacher: 'Dr. Patel' },
                    friday: { subject: 'Machine Learning', room: 'C302', teacher: 'Dr. Patel' },
                    saturday: { subject: 'Extra Class', room: 'C302', teacher: 'Dr. Patel' }
                }
            ],
            isActive: true
        };

        // Check if timetable already exists
        const existingTimetable = await TimetableTable.findOne({
            branch: sampleTimetable.branch,
            semester: sampleTimetable.semester
        });

        if (existingTimetable) {
            console.log('⚠️  Sample timetable already exists. Skipping...\n');
        } else {
            await TimetableTable.create(sampleTimetable);
            console.log('✓ Sample timetable created for CSE Semester 5\n');
        }

        // Display summary
        console.log('📋 Setup Summary:');
        console.log('─────────────────────────────────────────');
        console.log('✓ Database indexes created');
        console.log('✓ Sample timetable available');
        console.log('✓ Period-based attendance system ready');
        console.log('─────────────────────────────────────────\n');

        console.log('📖 Next Steps:');
        console.log('1. Start the server: node server.js');
        console.log('2. Update mobile app to use new endpoints');
        console.log('3. Update admin panel for period-based reports');
        console.log('4. Test with sample data\n');

        console.log('📚 Documentation:');
        console.log('- PERIOD_BASED_ATTENDANCE_GUIDE.md');
        console.log('- UPGRADE_SUMMARY.md\n');

        console.log('🎉 Setup completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
setupPeriodAttendance();
