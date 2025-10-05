/**
 * Clean Database Script
 * Removes all old redundant collections and prepares for clean schema
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function cleanDatabase() {
    try {
        console.log('🧹 Starting Database Cleanup...\n');
        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Current Collections:');
        collections.forEach(c => console.log(`   - ${c.name}`));
        console.log();

        // Collections to keep
        const keepCollections = [
            'users',              // Main user authentication
            'timetabletables',    // Timetable data
            'periodattendances',  // Attendance records
            'teacherassignments', // Teacher assignments
            'studentprofiles'     // Student profiles
        ];

        // Collections to remove (redundant/old)
        const removeCollections = [
            'students',           // Redundant with users
            'studentrecords',     // Redundant with studentprofiles
            'teacherrecords',     // Redundant with users
            'attendancerecords',  // Old attendance model
            'activesessions'      // Will be recreated with TTL
        ];

        console.log('🗑️  Collections to Remove:');
        let removed = 0;
        
        for (const collName of removeCollections) {
            try {
                const exists = collections.find(c => c.name === collName);
                if (exists) {
                    await db.dropCollection(collName);
                    console.log(`   ✓ Dropped: ${collName}`);
                    removed++;
                } else {
                    console.log(`   ⚠️  Not found: ${collName}`);
                }
            } catch (error) {
                console.log(`   ✗ Error dropping ${collName}: ${error.message}`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Removed