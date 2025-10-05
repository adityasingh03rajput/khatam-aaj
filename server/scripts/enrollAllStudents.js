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

const STUDENT_PASSWORD = 'adi*tya';

// All students data
const STUDENTS_DATA = `0246CE243D05,Aman Vishwakama,aman.letcse2024@global.org.in,CSE,3
0246CS231001,Aabhash Soni,aabhashsoni2@gmail.com,CSE,5
0246CS231002,Aarchi Lahariya,aarchilahariya@gmail.com,CSE,5
0246CS231003,Aarna Shrivas,aarna742005@gmail.com,CSE,5
0246CS231004,Aashutosh Yadav,ashuyadav73523@gmail.com,CSE,5
0246CS231005,Aayush Giri,heyayush27@gmail.com,CSE,5
0246CS231007,Abhik Soni,abhik.cs231007@global.org.in,CSE,5
0246CS231008,Abhinav Shukla,abhinavshuklaa632@gmail.com,CSE,5
0246cs231009,Abhinay Mishra,abhinaym107@gmail.com,CSE,5
0246CS231010,Abhishek Jain,abhishek.jain.100k@gmail.com,CSE,5
0246CS231011,Abhya Puri,abhyapuri07@gmail.com,CSE,5
0246CS231012,Adarsh Chandrol,adarshchandrol2004@gmail.com,CSE,5
0246CS231014,Adarsh Bagri,adarshbagri2005@gmail.com,CSE,5
0246CS231015,Aditi Mishra,aditimishra3131@gmail.com,CSE,5
0246CS231016,Aditi Patel,aditipateljbp14@gmail.com,CSE,5
0246CS231017,Aditya Jain,adityajain8946@gmail.com,CSE,5
0246CS231018,Aditya Namdeo,aditya.cs231018@global.org.in,CSE,5
0246CS231019,Aditya Patel,rp123luciferbang@gmail.com,CSE,5
0246CS231020,Aditya Singh,adityasinghk14@gmail.com,CSE,5
0246cs231021,Aditya Rajput,adityarajsir162@gmail.com,CSE,5`;

async function parseAndEnroll() {
    try {
        console.log('🚀 Starting Enrollment Process...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create teacher
        console.log('👨‍🏫 Creating teacher account...');
        const existingTeacher = await User.findOne({ userId: TEACHER.userId });
        if (!existingTeacher) {
            const teacher = new User(TEACHER);
            await teacher.save();
            console.log(`✓ Created: ${TEACHER.userId} (${TEACHER.name})\n`);
        } else {
            console.log(`⚠️  Teacher already exists\n`);
        }

        // Parse students
        const lines = STUDENTS_DATA.trim().split('\n');
        const students = lines.map(line => {
            const [userId, name, email, branch, semester] = line.split(',');
            return { userId, name, email, branch, semester };
        });

        console.log(`📝 Enrolling ${students.length} students...\n`);
        
        let created = 0, skipped = 0, errors = 0;

        for (const studentData of students) {
            try {
                const existing = await User.findOne({ userId: studentData.userId });
                if (existing) {
                    skipped++;
                    continue;
                }

                const student = new User({
                    ...studentData,
                    password: STUDENT_PASSWORD,
                    role: 'student',
                    rollNo: studentData.userId
                });
                await student.save();
                created++;
                
                if (created % 10 === 0) {
                    console.log(`✓ Enrolled ${created} students...`);
                }
            } catch (error) {
                errors++;
                console.error(`✗ ${studentData.userId}: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Enrollment Complete!');
        console.log('='.repeat(50));
        console.log(`✓ Created: ${created} students`);
        console.log(`⚠️  Skipped: ${skipped} students`);
        console.log(`✗ Errors: ${errors} students`);
        console.log('\n🔐 Login Credentials:');
        console.log(`   Teacher: teacher_adi / adi*tya`);
        console.log(`   Students: [userId] / adi*tya`);
        console.log('\n📚 Example Student Login:');
        console.log(`   0246CS231001 / adi*tya`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

parseAndEnroll();
