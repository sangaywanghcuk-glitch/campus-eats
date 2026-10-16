const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    // Connects to MongoDB using your environment variable, or falls back to a local database
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus-eats');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectMongo };