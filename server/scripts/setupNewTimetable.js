const mongoose = require('mongoose');
const Timetable = require('../models/clean/Timetable');
const User = require('../models/clean/User');

// College Schedule: 9:40 AM - 4:10 PM (Mon-Fri)
const LECTURE_SCHEDULE = [
    { number: 1, startTime: '09:40', endTime: '10:40', duration: 60 },
    { number: 2, startTime: '10:40', endTime: '11:40', duration: 60 },
    { number: 3, startTime: '11:40', endTime: '12:40', duration: 60 },
    // Lunch break 12:40-13:10
    { number: 4, startTime: '13:10', endTime: '14:10', duration: 60 },
    // 10 min break 14:10-14:20
    { number: 5, startTime: '14:20', endTime: '15:15', duration: 55 },
    { number: 6, startTime: '15:15', endTime: '16:10', duration: 55 }
];

const BREAKS = [
    { type: 'lunch', startTime: '12:40', endTime: '13:10' },
    { type: 'short', startTime: '14:10', endTime: '14:20' }
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Sample subjects for different branches/semesters
const SUBJECTS = {
    'CSE-3': [
        'Data Structures',
        'Database Management Systems',
        'Operating Systems',
        'Computer Networks',
        'Software Engineering',
        'Web Technologies'
    ],
    'CSE-5': [
        'Machine Learning',
        'Artificial Intelligence',
        'Cloud Computing',
        'Big Data Analytics',
        'Cyber Security',
        'Mobile Computing'
    ],
    'ECE-3': [
        'Digital Electronics',
        'Signals and Systems',
        'Microprocessors',
        'Communication Systems',
        'Control Systems',
        'Electromagnetic Theory'
    ]
};

const ROOMS = {
    'A': ['A101', 'A102', 'A103', 'A104', 'A105', 'A106'],
    'B': ['B101', 'B102', 'B103', 'B104', 'B105', 'B106'],
    'C': ['C101', 'C102', 'C103', 'C104', 'C105', 'C106']
};

async function setupNewTimetable() {
    try {
        await mongoose.connect('mongodb://localhost:27017/letsbunk', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Get teachers
        const teachers = await User.find({ role: 'teacher' });
        
        if (teachers.length === 0) {
            console.log('No teachers found. Creating sample teachers...');
            
            // Create sample teachers
            const sampleTeachers = [
                { userId: 'sir@12', name: 'Alok Vishwakarma', email: 'alok@college.edu', password: 'sir@12', role: 'teacher', department: 'CSE', subject: 'Data Structures' },
                { userId: 'mam@122', name: 'Priya Sharma', email: 'priya@college.edu', password: 'mam@122', role: 'teacher', department: 'CSE', subject: 'Database Management' },
                { userId: 'T003', name: 'Rajesh Kumar', email: 'rajesh@college.edu', password: 'teacher123', role: 'teacher', department: 'CSE', subject: 'Operating Systems' },
                { userId: 'T004', name: 'Anita Singh', email: 'anita@college.edu', password: 'teacher123', role: 'teacher', department: 'CSE', subject: 'Computer Networks' },
                { userId: 'T005', name: 'Vikram Patel', email: 'vikram@college.edu', password: 'teacher123', role: 'teacher', department: 'ECE', subject: 'Digital Electronics' }
            ];
            
            for (const teacher of sampleTeachers) {
                await User.create(teacher);
            }
            
            console.log('Sample teachers created');
        }
        
        // Refresh teachers list
        const allTeachers = await User.find({ role: 'teacher' });
        console.log(`Found ${allTeachers.length} teachers`);
        
        // Clear existing timetables
        await Timetable.deleteMany({});
        console.log('Cleared existing timetables');
        
        // Create timetables for different branches, semesters, and sections
        const configurations = [
            { branch: 'CSE', semester: '3', sections: ['A', 'B', 'C'] },
            { branch: 'CSE', semester: '5', sections: ['A', 'B'] },
            { branch: 'ECE', semester: '3', sections: ['A', 'B'] }
        ];
        
        for (const config of configurations) {
            const subjectKey = `${config.branch}-${config.semester}`;
            const subjects = SUBJECTS[subjectKey] || SUBJECTS['CSE-3'];
            
            for (const section of config.sections) {
                const schedule = [];
                
                // Generate schedule for each day
                for (const day of DAYS) {
                    // Add breaks
                    for (const breakPeriod of BREAKS) {
                        schedule.push({
                            dayOfWeek: day,
                            periodNumber: 0,
                            startTime: breakPeriod.startTime,
                            endTime: breakPeriod.endTime,
                            subject: breakPeriod.type === 'lunch' ? 'LUNCH BREAK' : 'BREAK',
                            teacherId: 'BREAK',
                            room: '-',
                            type: 'break'
                        });
                    }
                    
                    // Add lectures
                    for (let i = 0; i < LECTURE_SCHEDULE.length; i++) {
                        const lecture = LECTURE_SCHEDULE[i];
                        const subject = subjects[i % subjects.length];
                        const teacher = allTeachers[Math.floor(Math.random() * allTeachers.length)];
                        const room = ROOMS[section][i % ROOMS[section].length];
                        
                        schedule.push({
                            dayOfWeek: day,
                            periodNumber: lecture.number,
                            startTime: lecture.startTime,
                            endTime: lecture.endTime,
                            subject: subject,
                            teacherId: teacher.userId,
                            room: room,
                            type: 'lecture'
                        });
                    }
                }
                
                // Create timetable
                const timetable = await Timetable.create({
                    branch: config.branch,
                    semester: config.semester,
                    section: section,
                    academicYear: '2024-2025',
                    schedule: schedule,
                    isActive: true
                });
                
                console.log(`✓ Created timetable for ${config.branch} Sem ${config.semester} Section ${section}`);
            }
        }
        
        console.log('\n✓ All timetables created successfully!');
        
        // Display sample timetable
        const sampleTimetable = await Timetable.findOne({ branch: 'CSE', semester: '3', section: 'A' });
        console.log('\nSample Monday Schedule (CSE 3rd Sem Section A):');
        const mondaySchedule = sampleTimetable.schedule
            .filter(p => p.dayOfWeek === 'monday')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        for (const period of mondaySchedule) {
            console.log(`${period.startTime}-${period.endTime}: ${period.subject} (${period.room}) - ${period.teacherId}`);
        }
        
    } catch (error) {
        console.error('Error setting up timetables:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the setup
setupNewTimetable();
