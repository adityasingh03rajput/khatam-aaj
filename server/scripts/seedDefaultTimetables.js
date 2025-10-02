const mongoose = require('mongoose');
const TimetableTable = require('../models/TimetableTable');

const MONGODB_URI = 'mongodb://localhost:27017/letsbunk';

// Sample timetable data for different branches and semesters
const sampleTimetables = [
    {
        branch: "Computer Science",
        semester: "1st Semester",
        periods: [
            {
                periodNumber: 1,
                startTime: "08:00",
                endTime: "09:00",
                monday: { courseName: "Mathematics", roomNumber: "A101", teacherName: "Dr. Smith" },
                tuesday: { courseName: "Physics", roomNumber: "B202", teacherName: "Dr. Johnson" },
                wednesday: { courseName: "Chemistry", roomNumber: "C303", teacherName: "Dr. Williams" },
                thursday: { courseName: "Mathematics", roomNumber: "A101", teacherName: "Dr. Smith" },
                friday: { courseName: "Physics Lab", roomNumber: "Lab1", teacherName: "Dr. Johnson" },
                saturday: { courseName: "Computer Science", roomNumber: "D404", teacherName: "Dr. Davis" }
            },
            {
                periodNumber: 2,
                startTime: "09:00",
                endTime: "10:00",
                monday: { courseName: "English", roomNumber: "A102", teacherName: "Prof. Brown" },
                tuesday: { courseName: "Mathematics", roomNumber: "A101", teacherName: "Dr. Smith" },
                wednesday: { courseName: "Data Structures", roomNumber: "D405", teacherName: "Dr. Wilson" },
                thursday: { courseName: "English", roomNumber: "A102", teacherName: "Prof. Brown" },
                friday: { courseName: "Chemistry Lab", roomNumber: "Lab2", teacherName: "Dr. Williams" },
                saturday: { courseName: "Project Work", roomNumber: "Lab3", teacherName: "Dr. Davis" }
            },
            {
                periodNumber: 3,
                startTime: "10:00",
                endTime: "11:00",
                monday: { courseName: "Computer Science", roomNumber: "D404", teacherName: "Dr. Davis" },
                tuesday: { courseName: "Chemistry", roomNumber: "C303", teacherName: "Dr. Williams" },
                wednesday: { courseName: "Physics", roomNumber: "B202", teacherName: "Dr. Johnson" },
                thursday: { courseName: "Computer Science", roomNumber: "D404", teacherName: "Dr. Davis" },
                friday: { courseName: "Mathematics Tutorial", roomNumber: "A101", teacherName: "Dr. Smith" },
                saturday: { courseName: "Seminar", roomNumber: "Auditorium", teacherName: "Guest Faculty" }
            },
            {
                periodNumber: 4,
                startTime: "11:00",
                endTime: "12:00",
                monday: { courseName: "BREAK", roomNumber: "", teacherName: "" }
            },
            {
                periodNumber: 5,
                startTime: "12:00",
                endTime: "13:00",
                monday: { courseName: "Digital Electronics", roomNumber: "E505", teacherName: "Dr. Kumar" },
                tuesday: { courseName: "Algorithms", roomNumber: "D406", teacherName: "Dr. Wilson" },
                wednesday: { courseName: "Computer Networks", roomNumber: "D407", teacherName: "Dr. Patel" },
                thursday: { courseName: "Digital Electronics", roomNumber: "E505", teacherName: "Dr. Kumar" },
                friday: { courseName: "Software Engineering", roomNumber: "D408", teacherName: "Dr. Sharma" },
                saturday: { courseName: "Break", roomNumber: "", teacherName: "" }
            },
            {
                periodNumber: 6,
                startTime: "13:00",
                endTime: "14:00",
                monday: { courseName: "LUNCH", roomNumber: "", teacherName: "" }
            },
            {
                periodNumber: 7,
                startTime: "14:00",
                endTime: "15:00",
                monday: { courseName: "Database Systems", roomNumber: "D409", teacherName: "Dr. Singh" },
                tuesday: { courseName: "Operating Systems", roomNumber: "D410", teacherName: "Dr. Gupta" },
                wednesday: { courseName: "Machine Learning", roomNumber: "AI Lab", teacherName: "Dr. Sharma" },
                thursday: { courseName: "Database Systems", roomNumber: "D409", teacherName: "Dr. Singh" },
                friday: { courseName: "Web Development", roomNumber: "D411", teacherName: "Dr. Patel" },
                saturday: { courseName: "Sports", roomNumber: "Ground", teacherName: "PE Teacher" }
            },
            {
                periodNumber: 8,
                startTime: "15:00",
                endTime: "16:00",
                monday: { courseName: "Project Work", roomNumber: "Lab3", teacherName: "Dr. Davis" },
                tuesday: { courseName: "Elective Course", roomNumber: "E506", teacherName: "Dr. Kumar" },
                wednesday: { courseName: "Break", roomNumber: "", teacherName: "" },
                thursday: { courseName: "Project Work", roomNumber: "Lab3", teacherName: "Dr. Davis" },
                friday: { courseName: "Elective Course", roomNumber: "E506", teacherName: "Dr. Kumar" },
                saturday: { courseName: "Library Time", roomNumber: "Library", teacherName: "Librarian" }
            }
        ]
    },
    {
        branch: "Electronics",
        semester: "3rd Semester",
        periods: [
            {
                periodNumber: 1,
                startTime: "08:00",
                endTime: "09:00",
                monday: { courseName: "Circuit Theory", roomNumber: "E101", teacherName: "Dr. Kumar" },
                tuesday: { courseName: "Digital Electronics", roomNumber: "E102", teacherName: "Dr. Patel" },
                wednesday: { courseName: "Signals & Systems", roomNumber: "E103", teacherName: "Dr. Singh" },
                thursday: { courseName: "Circuit Theory", roomNumber: "E101", teacherName: "Dr. Kumar" },
                friday: { courseName: "Lab Session", roomNumber: "ELab1", teacherName: "Dr. Kumar" },
                saturday: { courseName: "Workshop", roomNumber: "Workshop", teacherName: "Dr. Patel" }
            },
            {
                periodNumber: 2,
                startTime: "09:00",
                endTime: "10:00",
                monday: { courseName: "Mathematics", roomNumber: "E104", teacherName: "Dr. Sharma" },
                tuesday: { courseName: "Control Systems", roomNumber: "E105", teacherName: "Dr. Gupta" },
                wednesday: { courseName: "Microprocessors", roomNumber: "E106", teacherName: "Dr. Kumar" },
                thursday: { courseName: "Mathematics", roomNumber: "E104", teacherName: "Dr. Sharma" },
                friday: { courseName: "Lab Session", roomNumber: "ELab2", teacherName: "Dr. Patel" },
                saturday: { courseName: "Project Work", roomNumber: "E107", teacherName: "Dr. Singh" }
            },
            {
                periodNumber: 3,
                startTime: "10:00",
                endTime: "11:00",
                monday: { courseName: "Communication Systems", roomNumber: "E108", teacherName: "Dr. Gupta" },
                tuesday: { courseName: "Power Electronics", roomNumber: "E109", teacherName: "Dr. Kumar" },
                wednesday: { courseName: "VLSI Design", roomNumber: "E110", teacherName: "Dr. Patel" },
                thursday: { courseName: "Communication Systems", roomNumber: "E108", teacherName: "Dr. Gupta" },
                friday: { courseName: "Tutorial", roomNumber: "E101", teacherName: "Dr. Kumar" },
                saturday: { courseName: "Seminar", roomNumber: "E111", teacherName: "Guest Faculty" }
            }
        ]
    },
    {
        branch: "Mechanical",
        semester: "5th Semester",
        periods: [
            {
                periodNumber: 1,
                startTime: "08:00",
                endTime: "09:00",
                monday: { courseName: "Thermodynamics", roomNumber: "M101", teacherName: "Dr. Wilson" },
                tuesday: { courseName: "Fluid Mechanics", roomNumber: "M102", teacherName: "Dr. Davis" },
                wednesday: { courseName: "Heat Transfer", roomNumber: "M103", teacherName: "Dr. Wilson" },
                thursday: { courseName: "Thermodynamics", roomNumber: "M101", teacherName: "Dr. Wilson" },
                friday: { courseName: "Lab Session", roomNumber: "MLab1", teacherName: "Dr. Davis" },
                saturday: { courseName: "Workshop", roomNumber: "Workshop", teacherName: "Dr. Wilson" }
            },
            {
                periodNumber: 2,
                startTime: "09:00",
                endTime: "10:00",
                monday: { courseName: "Machine Design", roomNumber: "M104", teacherName: "Dr. Kumar" },
                tuesday: { courseName: "Manufacturing", roomNumber: "M105", teacherName: "Dr. Patel" },
                wednesday: { courseName: "CAD/CAM", roomNumber: "M106", teacherName: "Dr. Singh" },
                thursday: { courseName: "Machine Design", roomNumber: "M104", teacherName: "Dr. Kumar" },
                friday: { courseName: "Lab Session", roomNumber: "MLab2", teacherName: "Dr. Patel" },
                saturday: { courseName: "Project Work", roomNumber: "M107", teacherName: "Dr. Davis" }
            },
            {
                periodNumber: 3,
                startTime: "10:00",
                endTime: "11:00",
                monday: { courseName: "Industrial Engineering", roomNumber: "M108", teacherName: "Dr. Sharma" },
                tuesday: { courseName: "Quality Control", roomNumber: "M109", teacherName: "Dr. Gupta" },
                wednesday: { courseName: "Operations Research", roomNumber: "M110", teacherName: "Dr. Kumar" },
                thursday: { courseName: "Industrial Engineering", roomNumber: "M108", teacherName: "Dr. Sharma" },
                friday: { courseName: "Tutorial", roomNumber: "M101", teacherName: "Dr. Wilson" },
                saturday: { courseName: "Seminar", roomNumber: "M111", teacherName: "Guest Faculty" }
            }
        ]
    },
    {
        branch: "Civil",
        semester: "7th Semester",
        periods: [
            {
                periodNumber: 1,
                startTime: "08:00",
                endTime: "09:00",
                monday: { courseName: "Structural Analysis", roomNumber: "C101", teacherName: "Dr. Brown" },
                tuesday: { courseName: "Geotechnical Engineering", roomNumber: "C102", teacherName: "Dr. Johnson" },
                wednesday: { courseName: "Transportation Engineering", roomNumber: "C103", teacherName: "Dr. Wilson" },
                thursday: { courseName: "Structural Analysis", roomNumber: "C101", teacherName: "Dr. Brown" },
                friday: { courseName: "Lab Session", roomNumber: "CLab1", teacherName: "Dr. Johnson" },
                saturday: { courseName: "Site Visit", roomNumber: "Field", teacherName: "Dr. Wilson" }
            },
            {
                periodNumber: 2,
                startTime: "09:00",
                endTime: "10:00",
                monday: { courseName: "Environmental Engineering", roomNumber: "C104", teacherName: "Dr. Davis" },
                tuesday: { courseName: "Water Resources", roomNumber: "C105", teacherName: "Dr. Kumar" },
                wednesday: { courseName: "Construction Management", roomNumber: "C106", teacherName: "Dr. Patel" },
                thursday: { courseName: "Environmental Engineering", roomNumber: "C104", teacherName: "Dr. Davis" },
                friday: { courseName: "Lab Session", roomNumber: "CLab2", teacherName: "Dr. Kumar" },
                saturday: { courseName: "Project Work", roomNumber: "C107", teacherName: "Dr. Brown" }
            },
            {
                periodNumber: 3,
                startTime: "10:00",
                endTime: "11:00",
                monday: { courseName: "Building Materials", roomNumber: "C108", teacherName: "Dr. Singh" },
                tuesday: { courseName: "Surveying", roomNumber: "C109", teacherName: "Dr. Gupta" },
                wednesday: { courseName: "Estimation & Costing", roomNumber: "C110", teacherName: "Dr. Sharma" },
                thursday: { courseName: "Building Materials", roomNumber: "C108", teacherName: "Dr. Singh" },
                friday: { courseName: "Tutorial", roomNumber: "C101", teacherName: "Dr. Brown" },
                saturday: { courseName: "Seminar", roomNumber: "C111", teacherName: "Guest Faculty" }
            }
        ]
    },
    {
        branch: "IT",
        semester: "4th Semester",
        periods: [
            {
                periodNumber: 1,
                startTime: "08:00",
                endTime: "09:00",
                monday: { courseName: "Data Structures", roomNumber: "IT101", teacherName: "Dr. Wilson" },
                tuesday: { courseName: "Computer Networks", roomNumber: "IT102", teacherName: "Dr. Kumar" },
                wednesday: { courseName: "Database Systems", roomNumber: "IT103", teacherName: "Dr. Singh" },
                thursday: { courseName: "Data Structures", roomNumber: "IT101", teacherName: "Dr. Wilson" },
                friday: { courseName: "Lab Session", roomNumber: "ITLab1", teacherName: "Dr. Kumar" },
                saturday: { courseName: "Workshop", roomNumber: "Workshop", teacherName: "Dr. Singh" }
            },
            {
                periodNumber: 2,
                startTime: "09:00",
                endTime: "10:00",
                monday: { courseName: "Operating Systems", roomNumber: "IT104", teacherName: "Dr. Patel" },
                tuesday: { courseName: "Software Engineering", roomNumber: "IT105", teacherName: "Dr. Sharma" },
                wednesday: { courseName: "Web Technologies", roomNumber: "IT106", teacherName: "Dr. Gupta" },
                thursday: { courseName: "Operating Systems", roomNumber: "IT104", teacherName: "Dr. Patel" },
                friday: { courseName: "Lab Session", roomNumber: "ITLab2", teacherName: "Dr. Sharma" },
                saturday: { courseName: "Project Work", roomNumber: "IT107", teacherName: "Dr. Wilson" }
            },
            {
                periodNumber: 3,
                startTime: "10:00",
                endTime: "11:00",
                monday: { courseName: "Java Programming", roomNumber: "IT108", teacherName: "Dr. Davis" },
                tuesday: { courseName: "Python Programming", roomNumber: "IT109", teacherName: "Dr. Kumar" },
                wednesday: { courseName: "Machine Learning", roomNumber: "IT110", teacherName: "Dr. Singh" },
                thursday: { courseName: "Java Programming", roomNumber: "IT108", teacherName: "Dr. Davis" },
                friday: { courseName: "Tutorial", roomNumber: "IT101", teacherName: "Dr. Wilson" },
                saturday: { courseName: "Seminar", roomNumber: "IT111", teacherName: "Guest Faculty" }
            }
        ]
    }
];

async function seedDefaultTimetables() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        console.log('🌱 Seeding default timetables...');

        for (const timetableData of sampleTimetables) {
            const existing = await TimetableTable.findOne({
                branch: timetableData.branch,
                semester: timetableData.semester
            });

            if (!existing) {
                const newTimetable = new TimetableTable({
                    branch: timetableData.branch,
                    semester: timetableData.semester,
                    periods: timetableData.periods,
                    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                    isActive: true,
                    lastModifiedBy: 'System (Default Data)'
                });

                await newTimetable.save();
                console.log(`✅ Created default timetable: ${timetableData.branch} - ${timetableData.semester}`);
            } else {
                console.log(`⚠️  Timetable already exists: ${timetableData.branch} - ${timetableData.semester}`);
            }
        }

        console.log('\n🎉 Default timetables seeded successfully!');
        console.log(`📊 Created ${sampleTimetables.length} timetables`);

        const totalTimetables = await TimetableTable.countDocuments();
        console.log(`📈 Total timetables in database: ${totalTimetables}`);

    } catch (error) {
        console.error('❌ Error seeding timetables:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
seedDefaultTimetables();
