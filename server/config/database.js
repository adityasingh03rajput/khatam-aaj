const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MongoDB connection string
        // For local MongoDB: mongodb://localhost:27017/letsbunk
        // For MongoDB Atlas: use your connection string
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letsbunk';
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        });
        
        console.log('✓ MongoDB Connected Successfully');
        console.log(`  Database: ${mongoose.connection.name}`);
        console.log(`  Host: ${mongoose.connection.host}`);
        
    } catch (error) {
        console.error('✗ MongoDB Connection Error:', error.message);
        console.log('  Server will continue without database (using in-memory storage)');
        console.log('  To use database features, please start MongoDB:');
        console.log('    - Install MongoDB from https://www.mongodb.com/try/download/community');
        console.log('    - Or use MongoDB Atlas cloud database');
        // Don't exit - allow server to run without database
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

module.exports = connectDB;
