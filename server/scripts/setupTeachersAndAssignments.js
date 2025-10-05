const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const TeacherAssignment = require('../models/TeacherAssignment');
const TimetableTable = require('../models/TimetableTable');

const TEACHERS = [
    {
        userId: 'sir@12',
        email: 'alok.vishwakarma@global.org.in',
        password: 'adi*tya',
        name: 'Alok Vishwakarma',
        role: 'teacher',
        department: 'CSE',
        subject: 'Physics',
        phone: '9876543210'
    },
    {
        userId: 'mam@122',
        email: 'priya.sharma@global.org.in',
        password: 'adi*tya',
        name: 'Priya Sharma',
        role: 'teacher',
        department: 'CSE',
        subject: 'Mathematics',
        phone: '9876543211'
    },
    {
        userId: 'sir@13',
        email: 'rajesh.kumar@global.org.in',
        password: 'adi*tya',
        name: 'Rajesh Kumar',
        role: 'teacher',
        department: 'CSE',
        subject: 'Data Structures',
        phone: '9876543212'
    },
    {
        userId: 'mam@123',
        email: 'anjali.verma@global.org.in',
        password: 'adi*tya',
        name: 'Anjali Verma',
        role: 'teacher',
        department: 'CSE',
        subject: 'Database Systems',
        phone: '9876543213'
    }
];

const ASSIGNMENTS = [
    // Alok Vishwakarma (sir@12) - Physics
    { teacherId: 'sir@12', teacherName: 'Alok Vishwakarma', branch: 'CSE', semester: '3', subject: 'Physics', room: 'A102', dayOfWeek: 'monday', periodNumber: 5, startTime: '11:30', endTime: '12:30' },
    { teacherId: 'sir@12', teacherName: 'Alok Vishwakarma', branch: 'CSE', semester: '3', subject: 'Physics', room: 'A102', dayOfWeek: 'wednesday', periodNumber: 5, startTime: '11:30', endTime: '12:30' },
    { teacherId: 'sir@12', teacherName: 'Alok Vishwakarma', branch: 'CSE', semester: '3', subject: 'Physics', room: 'A102', dayOfWeek: 'friday', periodNumber: 5, startTime: '11:30', endTime: '12:30' },
    
    // Priya Sharma (mam@122) - Mathematics
    { teacherId: 'mam@122', teacherName: 'Priya Sharma', branch: 'CSE', semester: '3', subject: 'Mathematics', room: 'A101', dayOfWeek: 'monday', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
    { teacherId: 'mam@122', teacherName: 'Priya Sharma', branch: 'CSE', semester: '3', subject: 'Mathematics', room: 'A101', dayOfWeek: 'tuesday', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
    { teacherId: 'mam@122', teacherName: 'Priya Sharma', branch: 'CSE', semester: '3', subject: 'Mathematics', room: 'A101', dayOfWeek: 'thursday', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
    
    // Rajesh Kumar (sir@13) - Data Structures
    { teacherId: 'sir@13', teacherName: 'Rajesh Kumar', branch: 'CSE', semester: '5', subject: 'Data Structures', room: 'B201', dayOfWeek: 'monday', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
    { teacherId: 'sir@13', teacherName: 'Rajesh Kumar', branch: 'CSE', semester: '5', subject: 'Data Structures', room: 'B201', dayOfWeek: 'wednesday', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
    
    // Anjali Verma (mam@123) - Database Systems
    { teacherId: 'mam@123', teacherName: 'Anjali Verma', branch: 'CSE', semester: '5', subject: 'Database Systems', room: 'B202', dayOfWeek: 'monday', periodNumber: 2, startTime: '09:00', endTime: '10:00' },
    { teacherId: 'mam@123', teacherName: 'Anjali Verma', branch: 'CSE', semester: '5', subject: 'Database Systems', room: 'B202', dayOfWeek: 'tuesday', periodNumber: 2, startTime: '09:00', endTime: '10:00' }
];

async function setupTeachersAndAssignments() {
    try {
        console.log('🚀 Setting up Teachers and Assignments...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create teachers
        console.log('👨‍🏫 Creating teacher accounts...');
        let teachersCreated = 0;
        let teachersSkipped = 0;

        for (const teacherData of TEACHERS) {
            const existing = await User.findOne({ userId: teacherData.userId });
            if (existing) {
                console.log(`⚠️  ${teacherData.userId} already exists`);
                teachersSkipped++;
                continue;
            }

            const teacher = new User(teacherData);
            await teacher.save();
            console.log(`✓ Created: ${teacherData.userId} (${teacherData.name})`);
            teachersCreated++;
        }

        console.log(`\n📊 Teachers: ${teachersCreated} created, ${teachersSkipped} skipped\n`);

        // Create assignments
        console.log('📚 Creating lecture assignments...');
        await TeacherAssignment.deleteMany({}); // Clear existing
        
        for (const assignment of ASSIGNMENTS) {
            await TeacherAssignment.create(assignment);
        }
        
        console.log(`✓ Created ${ASSIGNMENTS.length} lecture assignments\n`);

        // Summary
        console.log('=' .repeat(60));
        console.log('✅ Setup Complete!');
        console.log('='.repeat(60));
        console.log(`Teachers: ${TEACHERS.length}`);
        console.log(`Assignments: ${ASSIGNMENTS.length}`);
        console.log('\n🔐 Teacher Credentials:');
        TEACHERS.forEach(t => {
            console.log(`   ${t.userId} / adi*tya (${t.name} - ${t.subject})`);
        });
        console.log('\n📚 Sample Assignments:');
        console.log('   sir@12: Physics in A102 (CSE 3rd Sem)');
        console.log('   mam@122: Mathematics in A101 (CSE 3rd Sem)');
        console.log('   sir@13: Data Structures in B201 (CSE 5th Sem)');
        console.log('   mam@123: Database Systems in B202 (CSE 5th Sem)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setupTeachersAndAssignments();
