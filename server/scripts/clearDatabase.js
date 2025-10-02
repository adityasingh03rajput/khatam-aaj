const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models
const Student = require('../models/Student');
const StudentRecord = require('../models/StudentRecord');
const TeacherRecord = require('../models/TeacherRecord');
const Timetable = require('../models/Timetable');
const TimetableTable = require('../models/TimetableTable');
const AttendanceRecord = require('../models/AttendanceRecord');
const BSSIDConfig = require('../models/BSSIDConfig');
const Classroom = require('../models/Classroom');

/**
 * Database Cleanup Script
 * Clears all collections (use with caution!)
 */

async function clearDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        console.log('⚠️  WARNING: This will delete ALL data from the database!');
        console.log('🗑️  Clearing all collections...\n');

        const results = await Promise.all([
            Student.deleteMany({}),
            StudentRecord.deleteMany({}),
            TeacherRecord.deleteMany({}),
            Timetable.deleteMany({}),
            TimetableTable.deleteMany({}),
            AttendanceRecord.deleteMany({}),
            BSSIDConfig.deleteMany({}),
            Classroom.deleteMany({})
        ]);

        console.log('📊 Deletion Summary:');
        console.log(`  - Active Students: ${results[0].deletedCount} deleted`);
        console.log(`  - Student Records: ${results[1].deletedCount} deleted`);
        console.log(`  - Teacher Records: ${results[2].deletedCount} deleted`);
        console.log(`  - Timetable Slots: ${results[3].deletedCount} deleted`);
        console.log(`  - Timetable Tables: ${results[4].deletedCount} deleted`);
        console.log(`  - Attendance Records: ${results[5].deletedCount} deleted`);
        console.log(`  - BSSID Configs: ${results[6].deletedCount} deleted`);
        console.log(`  - Classrooms: ${results[7].deletedCount} deleted`);

        console.log('\n✅ Database cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    }
}

// Run cleanup
clearDatabase();
