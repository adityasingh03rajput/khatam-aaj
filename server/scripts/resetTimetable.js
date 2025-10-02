const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/letsbunk';

async function resetTimetable() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Drop the old Timetable collection (slot-based)
        try {
            await db.collection('timetables').drop();
            console.log('✓ Dropped old "timetables" collection (slot-based)');
        } catch (error) {
            if (error.message.includes('ns not found')) {
                console.log('⚠ Old "timetables" collection does not exist (already cleaned)');
            } else {
                throw error;
            }
        }

        // Optionally, you can also clear the TimetableTable collection if needed
        const clearTabularTimetable = process.argv.includes('--clear-all');
        if (clearTabularTimetable) {
            try {
                await db.collection('timetabletables').drop();
                console.log('✓ Dropped "timetabletables" collection (tabular)');
            } catch (error) {
                if (error.message.includes('ns not found')) {
                    console.log('⚠ "timetabletables" collection does not exist');
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ Database reset complete!');
        console.log('📊 Summary:');
        console.log('  - Old slot-based timetable collection removed');
        if (clearTabularTimetable) {
            console.log('  - Tabular timetable collection cleared');
        } else {
            console.log('  - Tabular timetable collection preserved');
            console.log('  - Use --clear-all flag to also clear tabular timetables');
        }

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
resetTimetable();
