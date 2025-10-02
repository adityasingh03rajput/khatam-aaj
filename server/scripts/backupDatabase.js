const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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
 * Database Backup Script
 * Exports all collections to JSON files
 */

async function backupDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create backup directory
        const backupDir = path.join(__dirname, '../backups');
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(backupDir, `backup_${timestamp}`);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        fs.mkdirSync(backupPath);

        console.log(`📦 Creating backup at: ${backupPath}\n`);

        // Backup all collections
        const collections = [
            { name: 'students', model: Student },
            { name: 'studentRecords', model: StudentRecord },
            { name: 'teacherRecords', model: TeacherRecord },
            { name: 'timetable', model: Timetable },
            { name: 'timetableTable', model: TimetableTable },
            { name: 'attendanceRecords', model: AttendanceRecord },
            { name: 'bssidConfig', model: BSSIDConfig },
            { name: 'classrooms', model: Classroom }
        ];

        for (const collection of collections) {
            const data = await collection.model.find({}).lean();
            const filePath = path.join(backupPath, `${collection.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`  ✓ ${collection.name}: ${data.length} documents backed up`);
        }

        // Create metadata file
        const metadata = {
            timestamp: new Date().toISOString(),
            totalCollections: collections.length,
            databaseName: mongoose.connection.name,
            mongoVersion: mongoose.version
        };
        fs.writeFileSync(
            path.join(backupPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        console.log('\n✅ Database backup completed successfully!');
        console.log(`📁 Backup location: ${backupPath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database backup failed:', error);
        process.exit(1);
    }
}

// Run backup
backupDatabase();
