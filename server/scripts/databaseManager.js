#!/usr/bin/env node
/**
 * Unified Database Management Script
 * Handles all database operations: init, seed, backup, reset, verify
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import all models
const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');
const TimetableTable = require('../models/TimetableTable');
const BSSIDConfig = require('../models/BSSIDConfig');
const Classroom = require('../models/Classroom');
const StudentRecord = require('../models/StudentRecord');
const TeacherRecord = require('../models/TeacherRecord');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letsbunk';

// Command line arguments
const command = process.argv[2];

class DatabaseManager {
    static async connect() {
        try {
            console.log('🔄 Connecting to MongoDB...');
            await mongoose.connect(MONGODB_URI);
            console.log('✓ Connected to MongoDB');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            return false;
        }
    }

    static async disconnect() {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }

    static async init() {
        console.log('📦 Initializing database...');
        
        // Create default BSSID config
        await BSSIDConfig.findOneAndUpdate(
            {},
            { 
                authorizedBSSID: 'aa:bb:cc:dd:ee:ff',
                name: 'Default WiFi',
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        
        // Create default users
        const defaultUsers = [
            { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
            { username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'Teacher One' }
        ];
        
        for (const user of defaultUsers) {
            await TeacherRecord.findOneAndUpdate(
                { username: user.username },
                user,
                { upsert: true, new: true }
            );
        }
        
        console.log('✅ Database initialized successfully');
    }

    static async seed() {
        console.log('🌱 Seeding database with sample data...');
        
        // Seed complete timetable
        const timetableData = {
            branch: 'Computer Science',
            semester: '1st Semester',
            academicYear: '2025-2026',
            isActive: true,
            lastModifiedBy: 'System',
            periods: [
                {
                    periodNumber: 1,
                    startTime: '08:00',
                    endTime: '09:00',
                    monday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    tuesday: { subject: 'Physics', room: 'B202', teacher: 'Dr. Johnson' },
                    wednesday: { subject: 'Chemistry', room: 'C303', teacher: 'Dr. Williams' },
                    thursday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    friday: { subject: 'Physics Lab', room: 'Lab1', teacher: 'Dr. Johnson' },
                    saturday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' }
                },
                {
                    periodNumber: 2,
                    startTime: '09:00',
                    endTime: '10:00',
                    monday: { subject: 'English', room: 'A102', teacher: 'Prof. Brown' },
                    tuesday: { subject: 'Mathematics', room: 'A101', teacher: 'Dr. Smith' },
                    wednesday: { subject: 'Data Structures', room: 'D405', teacher: 'Dr. Wilson' },
                    thursday: { subject: 'English', room: 'A102', teacher: 'Prof. Brown' },
                    friday: { subject: 'Chemistry Lab', room: 'Lab2', teacher: 'Dr. Williams' },
                    saturday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' }
                },
                {
                    periodNumber: 3,
                    startTime: '10:00',
                    endTime: '11:00',
                    monday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' },
                    tuesday: { subject: 'Chemistry', room: 'C303', teacher: 'Dr. Williams' },
                    wednesday: { subject: 'Physics', room: 'B202', teacher: 'Dr. Johnson' },
                    thursday: { subject: 'Computer Science', room: 'D404', teacher: 'Dr. Davis' },
                    friday: { subject: 'Mathematics Tutorial', room: 'A101', teacher: 'Dr. Smith' },
                    saturday: { subject: 'Seminar', room: 'Auditorium', teacher: 'Guest Faculty' }
                },
                {
                    periodNumber: 4,
                    startTime: '11:00',
                    endTime: '12:00',
                    monday: { subject: 'BREAK', room: '', teacher: '' },
                    tuesday: { subject: 'BREAK', room: '', teacher: '' },
                    wednesday: { subject: 'BREAK', room: '', teacher: '' },
                    thursday: { subject: 'BREAK', room: '', teacher: '' },
                    friday: { subject: 'BREAK', room: '', teacher: '' },
                    saturday: { subject: 'BREAK', room: '', teacher: '' }
                },
                {
                    periodNumber: 5,
                    startTime: '12:00',
                    endTime: '13:00',
                    monday: { subject: 'Digital Electronics', room: 'E505', teacher: 'Dr. Kumar' },
                    tuesday: { subject: 'Algorithms', room: 'D406', teacher: 'Dr. Wilson' },
                    wednesday: { subject: 'Computer Networks', room: 'D407', teacher: 'Dr. Patel' },
                    thursday: { subject: 'Digital Electronics', room: 'E505', teacher: 'Dr. Kumar' },
                    friday: { subject: 'Software Engineering', room: 'D408', teacher: 'Dr. Sharma' },
                    saturday: { subject: 'Sports', room: 'Ground', teacher: 'PE Teacher' }
                },
                {
                    periodNumber: 6,
                    startTime: '13:00',
                    endTime: '14:00',
                    monday: { subject: 'LUNCH', room: '', teacher: '' },
                    tuesday: { subject: 'LUNCH', room: '', teacher: '' },
                    wednesday: { subject: 'LUNCH', room: '', teacher: '' },
                    thursday: { subject: 'LUNCH', room: '', teacher: '' },
                    friday: { subject: 'LUNCH', room: '', teacher: '' },
                    saturday: { subject: 'LUNCH', room: '', teacher: '' }
                },
                {
                    periodNumber: 7,
                    startTime: '14:00',
                    endTime: '15:00',
                    monday: { subject: 'Database Systems', room: 'D409', teacher: 'Dr. Singh' },
                    tuesday: { subject: 'Operating Systems', room: 'D410', teacher: 'Dr. Gupta' },
                    wednesday: { subject: 'Machine Learning', room: 'AI Lab', teacher: 'Dr. Sharma' },
                    thursday: { subject: 'Database Systems', room: 'D409', teacher: 'Dr. Singh' },
                    friday: { subject: 'Web Development', room: 'D411', teacher: 'Dr. Patel' },
                    saturday: { subject: 'Library', room: 'Library', teacher: 'Librarian' }
                },
                {
                    periodNumber: 8,
                    startTime: '15:00',
                    endTime: '16:00',
                    monday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' },
                    tuesday: { subject: 'Elective Course', room: 'E506', teacher: 'Dr. Kumar' },
                    wednesday: { subject: 'Tutorial', room: 'D412', teacher: 'Dr. Wilson' },
                    thursday: { subject: 'Project Work', room: 'Lab3', teacher: 'Dr. Davis' },
                    friday: { subject: 'Elective Course', room: 'E506', teacher: 'Dr. Kumar' },
                    saturday: { subject: 'Extra Activities', room: 'Activity Room', teacher: 'Activity Coordinator' }
                }
            ]
        };

        // Seed for all branches
        const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'IT'];
        for (const branch of branches) {
            const data = { ...timetableData, branch };
            await TimetableTable.findOneAndUpdate(
                { branch: data.branch, semester: data.semester },
                data,
                { upsert: true, new: true }
            );
            console.log(`✓ Seeded timetable for ${branch}`);
        }

        console.log('✅ Database seeded successfully');
    }

    static async backup() {
        console.log('💾 Creating database backup...');
        
        const backupData = {
            timestamp: new Date().toISOString(),
            collections: {}
        };

        // Backup all collections
        backupData.collections.students = await Student.find({});
        backupData.collections.attendanceRecords = await AttendanceRecord.find({});
        backupData.collections.timetables = await TimetableTable.find({});
        backupData.collections.bssidConfigs = await BSSIDConfig.find({});
        backupData.collections.classrooms = await Classroom.find({});
        backupData.collections.studentRecords = await StudentRecord.find({});
        backupData.collections.teacherRecords = await TeacherRecord.find({});

        const backupPath = path.join(__dirname, '../../backups');
        await fs.mkdir(backupPath, { recursive: true });
        
        const filename = `backup-${Date.now()}.json`;
        const filepath = path.join(backupPath, filename);
        
        await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to: ${filepath}`);
    }

    static async reset() {
        console.log('🔄 Resetting database...');
        
        const confirm = process.argv[3] === '--confirm';
        if (!confirm) {
            console.log('⚠️  This will delete all data! Use --confirm to proceed');
            return;
        }

        await Student.deleteMany({});
        await AttendanceRecord.deleteMany({});
        await TimetableTable.deleteMany({});
        await BSSIDConfig.deleteMany({});
        await Classroom.deleteMany({});
        await StudentRecord.deleteMany({});
        await TeacherRecord.deleteMany({});

        console.log('✅ Database reset complete');
        
        // Re-initialize with defaults
        await this.init();
        await this.seed();
    }

    static async verify() {
        console.log('🔍 Verifying database...');
        
        const collections = {
            Students: await Student.countDocuments(),
            AttendanceRecords: await AttendanceRecord.countDocuments(),
            Timetables: await TimetableTable.countDocuments(),
            BSSIDConfigs: await BSSIDConfig.countDocuments(),
            Classrooms: await Classroom.countDocuments(),
            StudentRecords: await StudentRecord.countDocuments(),
            TeacherRecords: await TeacherRecord.countDocuments()
        };

        console.log('\n📊 Database Statistics:');
        for (const [name, count] of Object.entries(collections)) {
            console.log(`  ${name}: ${count} documents`);
        }

        // Verify timetables
        const timetables = await TimetableTable.find({});
        console.log('\n📋 Timetables:');
        timetables.forEach(tt => {
            console.log(`  - ${tt.branch} / ${tt.semester}: ${tt.periods.length} periods`);
        });

        console.log('\n✅ Database verification complete');
    }

    static async help() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   Database Manager v2.0                      ║
╠══════════════════════════════════════════════════════════════╣
║ Usage: node databaseManager.js [command] [options]           ║
║                                                               ║
║ Commands:                                                     ║
║   init     - Initialize database with default configuration  ║
║   seed     - Seed database with sample data                  ║
║   backup   - Create a backup of all collections              ║
║   reset    - Reset database (requires --confirm)             ║
║   verify   - Verify database integrity and show statistics   ║
║   help     - Show this help message                          ║
║                                                               ║
║ Examples:                                                     ║
║   node databaseManager.js init                               ║
║   node databaseManager.js seed                               ║
║   node databaseManager.js backup                             ║
║   node databaseManager.js reset --confirm                    ║
║   node databaseManager.js verify                             ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }
}

// Main execution
async function main() {
    if (!command || command === 'help') {
        await DatabaseManager.help();
        return;
    }

    const connected = await DatabaseManager.connect();
    if (!connected) {
        process.exit(1);
    }

    try {
        switch (command) {
            case 'init':
                await DatabaseManager.init();
                break;
            case 'seed':
                await DatabaseManager.seed();
                break;
            case 'backup':
                await DatabaseManager.backup();
                break;
            case 'reset':
                await DatabaseManager.reset();
                break;
            case 'verify':
                await DatabaseManager.verify();
                break;
            default:
                console.log(`❌ Unknown command: ${command}`);
                await DatabaseManager.help();
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await DatabaseManager.disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = DatabaseManager;
