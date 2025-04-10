import mongoose from 'mongoose';

const link = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(link);
    console.log('MongoDB Connected');
  } catch (err) {
    console.log(err);
    process.exit(1); 
  }
};

export default connectDB;
