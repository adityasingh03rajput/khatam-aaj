const mongoose = require('mongoose');
const connectDB = require('../config/database');
const TimetableTable = require('../models/TimetableTable');

/**
 * Database Verification Script
 * Checks if data is being saved and retrieved correctly
 */

async function verifyDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        // Test 1: Check if collection exists
        console.log('📊 Test 1: Checking collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('  Available collections:', collectionNames);
        
        const hasTimetableTable = collectionNames.includes('timetabletables');
        console.log(`  TimetableTable collection exists: ${hasTimetableTable ? '✓' : '✗'}\n`);

        // Test 2: Count documents
        console.log('📊 Test 2: Counting documents...');
        const count = await TimetableTable.countDocuments();
        console.log(`  Total timetables in database: ${count}\n`);

        // Test 3: List all timetables
        console.log('📊 Test 3: Listing all timetables...');
        const timetables = await TimetableTable.find({});
        if (timetables.length === 0) {
            console.log('  ⚠️  No timetables found in database');
        } else {
            timetables.forEach((tt, index) => {
                console.log(`  ${index + 1}. ${tt.branch} - ${tt.semester}`);
                console.log(`     Periods: ${tt.periods.length}`);
                console.log(`     Created: ${tt.createdAt}`);
                console.log(`     Updated: ${tt.updatedAt}`);
            });
        }
        console.log('');

        // Test 4: Try to save a test timetable
        console.log('📊 Test 4: Testing save operation...');
        const testTimetable = {
            branch: 'TEST',
            semester: 'TEST',
            periods: [
                {
                    periodNumber: 1,
                    startTime: '09:00',
                    endTime: '10:00',
                    monday: { courseName: 'Test Course', roomNumber: 'T101', teacherName: 'Test Teacher' }
                }
            ]
        };

        const saved = await TimetableTable.findOneAndUpdate(
            { branch: 'TEST', semester: 'TEST' },
            testTimetable,
            { upsert: true, new: true }
        );
        console.log('  ✓ Test timetable saved successfully');
        console.log(`     ID: ${saved._id}`);
        console.log(`     Periods: ${saved.periods.length}\n`);

        // Test 5: Verify retrieval
        console.log('📊 Test 5: Testing retrieval...');
        const retrieved = await TimetableTable.findOne({ branch: 'TEST', semester: 'TEST' });
        if (retrieved) {
            console.log('  ✓ Test timetable retrieved successfully');
            console.log(`     Periods: ${retrieved.periods.length}`);
        } else {
            console.log('  ✗ Failed to retrieve test timetable');
        }
        console.log('');

        // Test 6: Clean up test data
        console.log('📊 Test 6: Cleaning up test data...');
        await TimetableTable.deleteOne({ branch: 'TEST', semester: 'TEST' });
        console.log('  ✓ Test data cleaned up\n');

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('✅ Database Verification Complete!');
        console.log('═══════════════════════════════════════');
        console.log(`Total Timetables: ${count}`);
        console.log(`Database: ${mongoose.connection.name}`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run verification
verifyDatabase();
