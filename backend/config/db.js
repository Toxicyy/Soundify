// import mongoose from 'mongoose';
// import 'dotenv/config';

// const connectDB = async () => {
//   console.log(process.env.MONGO_URI);
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('Connected to MongoDB');
//   } catch (error) {
//     console.error('DB connection error:', error);
//   }
// };

// export default connectDB;


import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/Soundify");
    console.log('MongoDB connected');
  } catch (error) {
    console.error('DB connection error:', error);
    process.exit(1); // Завершить процесс при ошибке
  }
};

export default connectDB; 