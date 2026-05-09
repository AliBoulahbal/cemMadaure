const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return mongoose.connection;
    }

    // Check if connecting
    if (mongoose.connection.readyState === 2) {
      console.log('⏳ MongoDB connection in progress...');
      return mongoose.connection;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Please make sure MongoDB is running and MONGODB_URI is correct in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;