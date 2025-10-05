/**
 * Enroll Real Students and Teacher
 * Creates teacher_adi and all CSE students
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');

const TEACHER = {
    userId: 'teacher_adi',
    email: 'aditya@global.org.in',
    password: 'adi*tya',
    name: 'Aditya Singh',
    role: 'teacher',
    department: 'CSE',
    subject: 'Computer Science',
    phone: '9999999999'
};

const STUDENTS = [
    { userId: '0246CE243D05', name: 'Aman Vishwakama', email: 'aman.letcse2024@global.org.in', branch: 'CSE', semester: '3' },
    { userId: '0246CS231001', name: 'Aabhash Soni', email: 'aabhashsoni2@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231002', name: 'Aarchi Lahariya', email: 'aarchilahariya@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231003', name: 'Aarna Shrivas', email: 'aarna742005@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231004', name: 'Aashutosh Yadav', email: 'ashuyadav73523@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231005', name: 'Aayush Giri', email: 'heyayush27@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231007', name: 'Abhik Soni', email: 'abhik.cs231007@global.org.in', branch: 'CSE', semester: '5' },
    { userId: '0246CS231008', name: 'Abhinav Shukla', email: 'abhinavshuklaa632@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246cs231009', name: 'Abhinay Mishra', email: 'abhinaym107@gmail.com', branch: 'CSE', semester: '5' },
    { userId: '0246CS231010', name: 'Abhishek Jain', email: 'abhishek.jain.100k@gmail.com', branch: 'CSE', semester: '5' }
];

async function enrollUsers() {
    try {
        console.log('🚀 Enrolling Real Students and Teacher...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create teacher
        console.log('👨‍🏫 Creating teacher account...');
        const existingTeacher = await User.findOne({ userId: TEACHER.userId });
        if (existingTeacher) {
            console.log(`⚠️  Teacher ${TEACHER.userId} already exists`);
        } else {
            const teacher = new User(TEACHER);
            await teacher.save();
            console.log(`✓ Created teacher: ${TEACHER.userId} (${TEACHER.name})`);
        }

        console.log('\n📝 Creating student accounts...\n');
        let created = 0;
        let skipped = 0;

        for (const studentData of STUDENTS) {
            try {
                const existing = await User.findOne({ userId: studentData.userId });
                if (existing) {
                    console.log(`⚠️  ${studentData.userId} already exists - skipping`);
                    skipped++;
                    continue;
                }

                const student = new User({
                    ...studentData,
                    password: 'adi*tya',
                    role: 'student',
                    rollNo: studentData.userId
                });
                await student.save();
                console.log(`✓ ${studentData.userId} - ${studentData.name}`);
                created++;
            } catch (error) {
                console.error(`✗ Failed ${studentData.userId}:`, error.message);
            }
        }

        console.log('\n✅ Enrollment Complete!');
        console.log(`Created: ${created} students`);
        console.log(`Skipped: ${skipped} students`);
        console.log('\n🔐 Credentials:');
        console.log(`Teacher: teacher_adi / adi*tya`);
        console.log(`Students: [userId] / adi*tya`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

enrollUsers();
