const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

let dbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');
    dbConnected = true;
  } catch {
    console.warn('MongoDB unavailable. Using in-memory fallback.');
  }
};

const isConnected = () => dbConnected;

module.exports = { connectDB, isConnected };
