import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  try {
    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Retry after 5 seconds
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

export default connectDB;
