const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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

async function enrollComplete() {
    try {
        console.log('🚀 Complete Enrollment Process Starting...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Create teacher
        console.log('👨‍🏫 Creating teacher account...');
        let teacherExists = await User.findOne({ userId: TEACHER.userId });
        if (!teacherExists) {
            const teacher = new User(TEACHER);
            await teacher.save();
            console.log(`✓ Created: ${TEACHER.userId} (${TEACHER.name})`);
        } else {
            console.log(`⚠️  Teacher ${TEACHER.userId} already exists`);
        }

        // Read student data from file
        const dataPath = path.join(__dirname, '../data/all_students.txt');
        let studentsData;
        
        if (fs.existsSync(dataPath)) {
            studentsData = fs.readFileSync(dataPath, 'utf8');
        } else {
            // Fallback to inline data (first 50 students as sample)
            studentsData = `0246CE243D05,Aman Vishwakama,aman.letcse2024@global.org.in,CSE,3
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
0246cs231021,Aditya Rajput,adityarajsir162@gmail.com,CSE,5
0246CS231022,Aditya Yadav,adtiyayadav105@gmail.com,CSE,5
0246CS231023,Aishwarya Sahu,aishwaryasahu841@gmail.com,CSE,5
0246CS231024,Akanksha Agrawal,akankshaagrawal.124@gmail.com,CSE,5
0246CS231025,Akanksha Kumari,a.akanksha050915@gmail.com,CSE,5
0246CS231026,Aksh Usrathe,akshusrathe007@gmail.com,CSE,5
0246CS231027,Akshansh Saraf,akshanshsaraf40@gmail.com,CSE,5
0246CS231028,Akshat Mishra,akshatishu2712@gmail.com,CSE,5
0246CS231030,Akshat Tripathi,akshattripathi213@gmail.com,CSE,5
0246CS231032,Aman Vishwakarma,amanvish7870@gmail.com,CSE,5
0246CS231033,Amit Ahirwar,amit.cs231033@global.org.in,CSE,5
0246CS231034,Anand Patel,opanand685@gmail.com,CSE,5
0246CS231035,Ananya Rajak,ananyarajak374@gmail.com,CSE,5
0246CS231036,Ananya Samaiya,ananyasamaiya05@gmail.com,CSE,5
0246CS231037,Animesh Singh,yuvrajsingh232415@gmail.com,CSE,5
0246CS231038,Anirudh Yadav,anirudh.yadav.1.11.2005@gmail.com,CSE,5
0246cs231039,Anjali Patel,anjalipatela78@gmail.com,CSE,5
0246CS231040,Anjali Rajak,anjalirajak205@gmail.com,CSE,5
0246CS231041,Ankit Pal,ankit003322@gmail.com,CSE,5
0246CS231043,Ansh Patel,ap3871071@gmail.com,CSE,5
0246CS231044,Ansh Patel,anshp8083@gmail.com,CSE,5
0246CS231045,Anshul Vishwakarma,santoshvishwakarma0215@gmail.com,CSE,5
0246CS231046,Anu Jain,anujain.aj021@gmail.com,CSE,5
0246CS231047,Anuj Ramraika,anujramraika12@gmail.com,CSE,5
0246CS231048,Anushka Shukla,anushkashukla1331@gmail.com,CSE,5
0246CS231049,Anushka Tiwari,at8770845306@gmail.com,CSE,5
0246CS231050,Anushri Nema,anushrinema89@gmail.com,CSE,5
0246CS231051,Aoosaf Khan,aoosafjunaid@gmail.com,CSE,5
0246CS231052,Apoorv Sethi,apoorv116oorv@gmail.com,CSE,5
0246CS231053,Apoorva Yadav,apoorva.cs231053@global.org.in,CSE,5
0246CS231054,Archie Yadav,archiey1404@gmail.com,CSE,5`;
        }

        const lines = studentsData.trim().split('\n').filter(line => line.trim());
        const students = lines.map(line => {
            const parts = line.split(',').map(p => p.trim());
            return {
                userId: parts[0],
                name: parts[1],
                email: parts[2],
                branch: parts[3] || 'CSE',
                semester: parts[4] || '5'
            };
        });

        console.log(`\n📝 Enrolling ${students.length} students...\n`);
        
        let created = 0, skipped = 0, errors = 0;
        const batchSize = 10;

        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];
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
                
                if (created % batchSize === 0) {
                    console.log(`✓ Enrolled ${created}/${students.length} students...`);
                }
            } catch (error) {
                errors++;
                if (errors <= 5) {
                    console.error(`✗ ${studentData.userId}: ${error.message}`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ ENROLLMENT COMPLETE!');
        console.log('='.repeat(60));
        console.log(`✓ Successfully created: ${created} students`);
        console.log(`⚠️  Already existed: ${skipped} students`);
        console.log(`✗ Errors: ${errors} students`);
        console.log(`📊 Total processed: ${students.length} students`);
        console.log('\n🔐 Login Credentials:');
        console.log(`   👨‍🏫 Teacher: teacher_adi / adi*tya`);
        console.log(`   👨‍🎓 Students: [userId] / adi*tya`);
        console.log('\n📚 Example Logins:');
        console.log(`   0246CS231001 / adi*tya (Aabhash Soni)`);
        console.log(`   0246CS231002 / adi*tya (Aarchi Lahariya)`);
        console.log(`   0246CS231003 / adi*tya (Aarna Shrivas)`);
        console.log('\n✅ All users can now login to the app!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

enrollComplete();
