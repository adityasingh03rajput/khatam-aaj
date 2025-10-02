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
 * Database Initialization Script
 * Creates indexes and seeds initial data
 */

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create indexes for all models
        console.log('📊 Creating database indexes...');
        await Promise.all([
            Student.createIndexes(),
            StudentRecord.createIndexes(),
            TeacherRecord.createIndexes(),
            Timetable.createIndexes(),
            TimetableTable.createIndexes(),
            AttendanceRecord.createIndexes(),
            BSSIDConfig.createIndexes(),
            Classroom.createIndexes()
        ]);
        console.log('✓ All indexes created successfully\n');

        // Seed initial data
        await seedInitialData();

        console.log('\n✅ Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

async function seedInitialData() {
    console.log('🌱 Seeding initial data...\n');

    // Seed BSSID Configuration
    await seedBSSIDConfig();
    
    // Seed Classrooms
    await seedClassrooms();
    
    // Seed Sample Teachers
    await seedTeachers();
    
    // Seed Sample Students
    await seedStudents();
    
    // Seed Sample Timetable
    await seedTimetable();
}

async function seedBSSIDConfig() {
    try {
        const count = await BSSIDConfig.countDocuments();
        if (count === 0) {
            await BSSIDConfig.create({
                name: 'Main Campus WiFi',
                bssid: 'ee:ee:6d:9d:6f:ba',
                location: 'Main Building',
                building: 'Academic Block A',
                floor: 'All Floors',
                isActive: true,
                description: 'Primary WiFi network for attendance tracking'
            });
            console.log('  ✓ BSSID configuration seeded');
        } else {
            console.log('  ⊘ BSSID configuration already exists');
        }
    } catch (error) {
        console.log('  ⚠ BSSID seeding skipped:', error.message);
    }
}

async function seedClassrooms() {
    try {
        const count = await Classroom.countDocuments();
        if (count === 0) {
            await Classroom.insertMany([
                {
                    name: 'Room A101',
                    roomNumber: 'A101',
                    bssid: 'ee:ee:6d:9d:6f:ba',
                    building: 'Academic Block A',
                    floor: '1st Floor',
                    capacity: 60,
                    type: 'Lecture Hall',
                    facilities: ['Projector', 'Whiteboard', 'AC'],
                    department: 'CSE',
                    isActive: true
                },
                {
                    name: 'Lab L201',
                    roomNumber: 'L201',
                    bssid: 'ee:ee:6d:9d:6f:bb',
                    building: 'Lab Block',
                    floor: '2nd Floor',
                    capacity: 40,
                    type: 'Laboratory',
                    facilities: ['Computers', 'Projector', 'AC'],
                    department: 'CSE',
                    isActive: true
                }
            ]);
            console.log('  ✓ Classrooms seeded');
        } else {
            console.log('  ⊘ Classrooms already exist');
        }
    } catch (error) {
        console.log('  ⚠ Classroom seeding skipped:', error.message);
    }
}

async function seedTeachers() {
    try {
        const count = await TeacherRecord.countDocuments();
        if (count === 0) {
            await TeacherRecord.insertMany([
                {
                    employeeId: 'EMP001',
                    name: 'Dr. Rajesh Kumar',
                    email: 'rajesh.kumar@college.edu',
                    phone: '9876543210',
                    department: 'CSE',
                    subjects: [
                        { subjectName: 'Data Structures', subjectCode: 'CS201', branch: 'CSE', semester: '3rd Sem' },
                        { subjectName: 'Algorithms', subjectCode: 'CS301', branch: 'CSE', semester: '5th Sem' }
                    ],
                    designation: 'Professor',
                    qualification: 'Ph.D. in Computer Science',
                    experience: 15,
                    specialization: 'Algorithms and Data Structures',
                    isActive: true
                },
                {
                    employeeId: 'EMP002',
                    name: 'Prof. Priya Sharma',
                    email: 'priya.sharma@college.edu',
                    phone: '9876543211',
                    department: 'CSE',
                    subjects: [
                        { subjectName: 'Database Systems', subjectCode: 'CS202', branch: 'CSE', semester: '4th Sem' },
                        { subjectName: 'Web Technologies', subjectCode: 'CS302', branch: 'CSE', semester: '6th Sem' }
                    ],
                    designation: 'Associate Professor',
                    qualification: 'M.Tech, Ph.D.',
                    experience: 10,
                    specialization: 'Database Management',
                    isActive: true
                }
            ]);
            console.log('  ✓ Teachers seeded');
        } else {
            console.log('  ⊘ Teachers already exist');
        }
    } catch (error) {
        console.log('  ⚠ Teacher seeding skipped:', error.message);
    }
}

async function seedStudents() {
    try {
        const count = await StudentRecord.countDocuments();
        if (count === 0) {
            await StudentRecord.insertMany([
                {
                    rollNumber: 'CSE2021001',
                    name: 'Amit Patel',
                    email: 'amit.patel@student.edu',
                    phone: '9123456780',
                    department: 'CSE',
                    semester: '5th Sem',
                    branch: 'CSE',
                    section: 'A',
                    isActive: true
                },
                {
                    rollNumber: 'CSE2021002',
                    name: 'Sneha Reddy',
                    email: 'sneha.reddy@student.edu',
                    phone: '9123456781',
                    department: 'CSE',
                    semester: '5th Sem',
                    branch: 'CSE',
                    section: 'A',
                    isActive: true
                },
                {
                    rollNumber: 'CSE2021003',
                    name: 'Rahul Verma',
                    email: 'rahul.verma@student.edu',
                    phone: '9123456782',
                    department: 'CSE',
                    semester: '5th Sem',
                    branch: 'CSE',
                    section: 'A',
                    isActive: true
                }
            ]);
            console.log('  ✓ Students seeded');
        } else {
            console.log('  ⊘ Students already exist');
        }
    } catch (error) {
        console.log('  ⚠ Student seeding skipped:', error.message);
    }
}

async function seedTimetable() {
    try {
        const count = await Timetable.countDocuments();
        if (count === 0) {
            const sampleSlots = [];
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const lectures = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
            const subjects = [
                { name: 'Data Structures', teacher: 'Dr. Rajesh Kumar', room: 'A101' },
                { name: 'Database Systems', teacher: 'Prof. Priya Sharma', room: 'A102' },
                { name: 'Operating Systems', teacher: 'Dr. Amit Singh', room: 'A103' },
                { name: 'Computer Networks', teacher: 'Prof. Neha Gupta', room: 'A104' }
            ];

            let slotId = 1;
            for (const day of days) {
                for (let i = 0; i < 4; i++) {
                    const subject = subjects[i % subjects.length];
                    const startHour = 9 + i;
                    const endHour = startHour + 1;
                    
                    sampleSlots.push({
                        slotId: `SLOT${slotId++}`,
                        day: day,
                        lectureNumber: lectures[i],
                        startTime: `${String(startHour).padStart(2, '0')}:00`,
                        endTime: `${String(endHour).padStart(2, '0')}:00`,
                        subject: subject.name,
                        teacherName: subject.teacher,
                        room: subject.room,
                        branch: 'CSE',
                        semester: '5th Sem',
                        isActive: true
                    });
                }
            }

            await Timetable.insertMany(sampleSlots);
            console.log(`  ✓ Timetable seeded (${sampleSlots.length} slots)`);
        } else {
            console.log('  ⊘ Timetable already exists');
        }
    } catch (error) {
        console.log('  ⚠ Timetable seeding skipped:', error.message);
    }
}

// Run initialization
initializeDatabase();
