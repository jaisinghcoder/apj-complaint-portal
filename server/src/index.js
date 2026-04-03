require('dotenv').config();

const { connectDB } = require('./db');
const { createApp } = require('./app');

async function main() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  const port = Number(process.env.PORT || 5000);
  await connectDB(process.env.MONGODB_URI);
  // Fix potential duplicate-null unique index on supports.ticketId
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const coll = db.collection('supports');
    const indexes = await coll.indexes();
    const ticketIdx = indexes.find((i) => i.key && i.key.ticketId === 1);
    if (ticketIdx && ticketIdx.unique && !ticketIdx.partialFilterExpression) {
      try {
        // drop the old strict unique index that treats null as a value
        try {
          await coll.dropIndex(ticketIdx.name);
        } catch (dropErr) {
          // fallback: try dropping by key specification
          try {
            await coll.dropIndex({ ticketId: 1 });
          } catch (dropErr2) {
            // ignore; we'll attempt to create partial index below
            // eslint-disable-next-line no-console
            console.warn('Could not drop existing ticketId index by name or key:', dropErr && dropErr.message, dropErr2 && dropErr2.message);
          }
        }
        // recreate as partial unique (only when ticketId exists and is not null)
        await coll.createIndex({ ticketId: 1 }, { unique: true, partialFilterExpression: { ticketId: { $exists: true, $ne: null } } });
        // eslint-disable-next-line no-console
        console.log('Recreated supports.ticketId index as partial unique to avoid duplicate null keys.');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not migrate supports.ticketId index:', e && e.message);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Index migration check failed:', e && e.message);
  }

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
