const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

module.exports = { connectDB };
