require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const { User } = require('./models');
const logger = require('./utils/logger');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5000;

async function seedAdmin() {
  try {
    const admin = await User.findOne({ where: { email: 'admin@lms.com' } });
    if (!admin) {
      await User.create({
        username: 'admin', email: 'admin@lms.com', passwordHash: 'Admin@12345',
        firstName: 'System', lastName: 'Admin', role: 'ADMIN', kycStatus: 'VERIFIED', isActive: true,
      });
      logger.info('✅ Default admin created');
    }

    const officer = await User.findOne({ where: { email: 'officer@lms.com' } });
    if (!officer) {
      await User.create({
        username: 'officer', email: 'officer@lms.com', passwordHash: 'Officer@12345',
        firstName: 'Loan', lastName: 'Officer', role: 'LOAN_OFFICER', kycStatus: 'VERIFIED', isActive: true,
      });
      logger.info('✅ Default loan officer created');
    }
  } catch (e) {
    logger.warn('Seed skipped:', e.message);
  }
}

async function startServer() {
  try {
    await connectDatabase();
    logger.info('✅ Database connected');
    await initializeRedis();
    await seedAdmin();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV}`);
    });

    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
