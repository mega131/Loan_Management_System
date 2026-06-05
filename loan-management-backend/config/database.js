const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';

const sequelize = dialect === 'sqlite'
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: (msg) => logger.debug(msg),
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: dialect,
        logging: (msg) => logger.debug(msg),
        dialectOptions: dialect === 'postgres' && process.env.DB_SSL === 'true' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {},
      }
    );

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDatabase,
};
