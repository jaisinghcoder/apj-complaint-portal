require('dotenv').config();

const { connectDB } = require('./db');
const { createApp } = require('./app');

async function main() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  const port = Number(process.env.PORT || 5000);
  await connectDB(process.env.MONGODB_URI);

  const app = createApp();
  app.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
