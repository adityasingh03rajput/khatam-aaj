/**
 * Setup Sample Users for Testing
 * Creates sample student and teacher accounts
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');

async function setupSampleUsers() {
    try {
        console.log('🚀 Setting up sample users...\n');

        // Connect to database
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        const sampleUsers = [
            // Students
            {
                userId: '2024CSE001',
                email: 'john.doe@student.com',
                password: 'student123',
                name: 'John Doe',
                role: 'student',
                branch: 'CSE',
                semester: '5',
                rollNo: 'CSE001',
                phone: '1234567890'
            },
            {
                userId: '2024CSE002',
                email: 'jane.smith@student.com',
                password: 'student123',
                name: 'Jane Smith',
                role: 'student',
                branch: 'CSE',
                semester: '5',
                rollNo: 'CSE002',
                phone: '1234567891'
            },
            {
                userId: '2024ECE001',
                email: 'bob.johnson@student.com',
                password: 'student123',
                name: 'Bob Johnson',
                role: 'student',
                branch: 'ECE',
                semester: '5',
                rollNo: 'ECE001',
                phone: '1234567892'
            },
            {
                userId: '2024ME001',
                email: 'alice.brown@student.com',
                password: 'student123',
                name: 'Alice Brown',
                role: 'student',
                branch: 'ME',
                semester: '5',
                rollNo: 'ME001',
                phone: '1234567893'
            },
            // Teachers
            {
                userId: 'T001',
                email: 'dr.smith@college.com',
                password: 'teacher123',
                name: 'Dr. Smith',
                role: 'teacher',
                department: 'CSE',
                subject: 'Data Structures',
                phone: '9876543210'
            },
            {
                userId: 'T002',
                email: 'prof.johnson@college.com',
                password: 'teacher123',
                name: 'Prof. Johnson',
                role: 'teacher',
                department: 'CSE',
                subject: 'Database Systems',
                phone: '9876543211'
            },
            {
                userId: 'T003',
                email: 'dr.williams@college.com',
                password: 'teacher123',
                name: 'Dr. Williams',
                role: 'teacher',
                department: 'CSE',
                subject: 'Operating Systems',
                phone: '9876543212'
            },
            // Admin
            {
                userId: 'ADMIN001',
                email: 'admin@college.com',
                password: 'admin123',
                name: 'System Administrator',
                role: 'admin',
                phone: '9999999999'
            }
        ];

        console.log('📝 Creating sample users...\n');

        let created = 0;
        let skipped = 0;

        for (const userData of sampleUsers) {
            try {
                // Check if user already exists
                const existing = await User.findOne({ userId: userData.userId });
                
                if (existing) {
                    console.log(`⚠️  User ${userData.userId} (${userData.name}) already exists - skipping`);
                    skipped++;
                    continue;
                }

                // Create new user
                const user = new User(userData);
                await user.save();
                
                console.log(`✓ Created ${userData.role}: ${userData.userId} (${userData.name})`);
                created++;
            } catch (error) {
                console.error(`✗ Failed to create ${userData.userId}:`, error.message);
            }
        }

        console.log('\n📋 Setup Summary:');
        console.log('─────────────────────────────────────────');
        console.log(`✓ Users created: ${created}`);
        console.log(`⚠️  Users skipped: ${skipped}`);
        console.log('─────────────────────────────────────────\n');

        console.log('📖 Sample Credentials:');
        console.log('\nStudents:');
        console.log('  2024CSE001 / student123 (John Doe - CSE Sem 5)');
        console.log('  2024CSE002 / student123 (Jane Smith - CSE Sem 5)');
        console.log('  2024ECE001 / student123 (Bob Johnson - ECE Sem 5)');
        console.log('  2024ME001 / student123 (Alice Brown - ME Sem 5)');
        console.log('\nTeachers:');
        console.log('  T001 / teacher123 (Dr. Smith - CSE)');
        console.log('  T002 / teacher123 (Prof. Johnson - CSE)');
        console.log('  T003 / teacher123 (Dr. Williams - CSE)');
        console.log('\nAdmin:');
        console.log('  ADMIN001 / admin123 (System Administrator)');
        console.log('\n🎉 Setup completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
setupSampleUsers();
