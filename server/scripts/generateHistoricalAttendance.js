const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const PeriodAttendance = require('../models/PeriodAttendance');
const StudentProfile = require('../models/StudentProfile');

// Generate attendance from June 1, 2024 to today
const START_DATE = new Date('2024-06-01');
const END_DATE = new Date();

// Attendance probability (80% chance of attending)
const ATTENDANCE_PROBABILITY = 0.8;

// Sample timetable for CSE 3rd Semester
const TIMETABLE_CSE_3 = [
    { day: 1, periodNumber: 1, subject: 'Mathematics', startTime: '08:00', endTime: '09:00', room: 'A101' },
    { day: 1, periodNumber: 2, subject: 'Chemistry', startTime: '09:00', endTime: '10:00', room: 'A102' },
    { day: 1, periodNumber: 3, subject: 'Programming', startTime: '10:00', endTime: '11:00', room: 'A103' },
    { day: 1, periodNumber: 5, subject: 'Physics', startTime: '11:30', endTime: '12:30', room: 'A102' },
    { day: 2, periodNumber: 1, subject: 'Mathematics', startTime: '08:00', endTime: '09:00', room: 'A101' },
    { day: 2, periodNumber: 2, subject: 'Chemistry', startTime: '09:00', endTime: '10:00', room: 'A102' },
    { day: 3, periodNumber: 1, subject: 'Programming Lab', startTime: '08:00', endTime: '09:00', room: 'Lab1' },
    { day: 3, periodNumber: 5, subject: 'Physics', startTime: '11:30', endTime: '12:30', room: 'A102' },
    { day: 4, periodNumber: 1, subject: 'Mathematics', startTime: '08:00', endTime: '09:00', room: 'A101' },
    { day: 5, periodNumber: 5, subject: 'Physics', startTime: '11:30', endTime: '12:30', room: 'A102' }
];

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function generateHistoricalAttendance() {
    try {
        console.log('🚀 Generating Historical Attendance Data...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Get all CSE 3rd semester students
        const students = await User.find({ 
            role: 'student', 
            branch: 'CSE', 
            semester: '3' 
        }).limit(20); // Limit for demo

        if (students.length === 0) {
            console.log('⚠️  No students found. Please run enrollment first.');
            process.exit(1);
        }

        console.log(`📝 Found ${students.length} students\n`);
        console.log('📅 Generating attendance from June 1, 2024 to today...\n');

        let totalRecords = 0;
        let currentDate = new Date(START_DATE);

        while (currentDate <= END_DATE) {
            const dayOfWeek = currentDate.getDay();
            
            // Skip Sundays
            if (dayOfWeek === 0) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Get lectures for this day
            const dayLectures = TIMETABLE_CSE_3.filter(l => l.day === dayOfWeek);

            // Generate attendance for each student for each lecture
            for (const student of students) {
                for (const lecture of dayLectures) {
                    // Random attendance (80% probability)
                    const attended = Math.random() < ATTENDANCE_PROBABILITY;
                    
                    // Check if record already exists
                    const existing = await PeriodAttendance.findOne({
                        studentId: student.userId,
                        date: currentDate,
                        periodNumber: lecture.periodNumber
                    });

                    if (!existing) {
                        const checkInTime = attended ? new Date(currentDate) : null;
                        if (checkInTime) {
                            const [hours, minutes] = lecture.startTime.split(':');
                            checkInTime.setHours(parseInt(hours), parseInt(minutes) + Math.floor(Math.random() * 15), 0);
                        }

                        await PeriodAttendance.create({
                            studentId: student.userId,
                            studentName: student.name,
                            branch: student.branch,
                            semester: student.semester,
                            date: new Date(currentDate),
                            dayOfWeek: DAY_NAMES[dayOfWeek],
                            periodNumber: lecture.periodNumber,
                            periodStartTime: lecture.startTime,
                            periodEndTime: lecture.endTime,
                            subject: lecture.subject,
                            room: lecture.room,
                            status: attended ? 'present' : 'absent',
                            checkInTime: checkInTime,
                            attendancePercentage: attended ? 100 : 0
                        });

                        totalRecords++;
                    }
                }
            }

            // Progress indicator
            if (totalRecords % 100 === 0) {
                console.log(`✓ Generated ${totalRecords} records...`);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log(`\n✅ Generated ${totalRecords} attendance records\n`);

        // Update student profiles
        console.log('📊 Updating student profiles...\n');
        
        for (const student of students) {
            const attendanceRecords = await PeriodAttendance.find({
                studentId: student.userId
            });

            const totalLectures = attendanceRecords.length;
            const attendedLectures = attendanceRecords.filter(r => r.status === 'present').length;
            const attendancePercentage = totalLectures > 0 ? (attendedLectures / totalLectures) * 100 : 0;

            // Calculate sessional marks based on attendance
            const sessionalMarks = Math.min(100, Math.round(attendancePercentage * 0.8 + Math.random() * 20));
            const cgpa = Math.min(10, (sessionalMarks / 10).toFixed(2));

            await StudentProfile.findOneAndUpdate(
                { studentId: student.userId },
                {
                    studentId: student.userId,
                    name: student.name,
                    email: student.email,
                    branch: student.branch,
                    semester: student.semester,
                    rollNo: student.userId,
                    assignedRoom: 'A102',
                    totalLectures,
                    attendedLectures,
                    overallAttendancePercentage: Math.round(attendancePercentage),
                    sessionalMarks,
                    cgpa,
                    sessionStartDate: START_DATE,
                    lastAttendanceDate: END_DATE
                },
                { upsert: true, new: true }
            );
        }

        console.log('✅ Student profiles updated\n');
        console.log('='.repeat(60));
        console.log('🎉 Historical Data Generation Complete!');
        console.log('='.repeat(60));
        console.log(`Total Records: ${totalRecords}`);
        console.log(`Students: ${students.length}`);
        console.log(`Date Range: ${START_DATE.toDateString()} to ${END_DATE.toDateString()}`);
        console.log(`Average Attendance: ${Math.round(ATTENDANCE_PROBABILITY * 100)}%`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

generateHistoricalAttendance();
