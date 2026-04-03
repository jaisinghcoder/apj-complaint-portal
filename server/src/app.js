const express = require('express');
const cors = require('cors');
const path = require('path');

const { authRouter } = require('./routes/auth');
const { complaintsRouter } = require('./routes/complaints');
const { supportRouter } = require('./routes/support');
const { notificationsRouter } = require('./routes/notifications');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));

  const origin = process.env.CLIENT_ORIGIN || true; // Allow all origins for development
  app.use(
    cors({
      origin,
      credentials: false,
    }),
  );

  // Serve uploaded files as static assets
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/complaints', complaintsRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/notifications', notificationsRouter);

  app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Server error';
    return res.status(status).json({ error: { message } });
  });

  return app;
}

module.exports = { createApp };
