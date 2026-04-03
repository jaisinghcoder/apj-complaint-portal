const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  const uri = mongoUri || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Missing MONGODB_URI');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDB };
