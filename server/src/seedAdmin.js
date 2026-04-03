require('dotenv').config();

const bcrypt = require('bcryptjs');

const { connectDB } = require('./db');
const { User } = require('./models/User');

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI');
  }
  if (!email || !password) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role: 'admin' });

  // eslint-disable-next-line no-console
  console.log('Seeded admin:', email);
  process.exit(0);
}

seedAdmin().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
