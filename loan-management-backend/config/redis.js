const redis = require('redis');
const logger = require('../utils/logger');
require('dotenv').config();

// Local memory fallback if redis fails
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }
  async setex(key, seconds, value) {
    this.cache.set(key, { value, expires: Date.now() + seconds * 1000 });
  }
  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  async del(key) {
    this.cache.delete(key);
  }
}

let client = new MemoryCache();
let useRedis = false;

async function initializeRedis() {
  try {
    const redisClient = redis.createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) return new Error('Retry limit reached');
          return 1000;
        }
      }
    });

    redisClient.on('error', (err) => logger.warn('Redis Client Error, falling back to memory cache', err.message));
    
    await redisClient.connect();
    client = redisClient;
    useRedis = true;
    logger.info('Redis connection established');
  } catch (error) {
    logger.warn('Unable to connect to Redis. Using Memory Cache instead.');
  }
}

// Wrapper to provide consistent API
const cache = {
  setex: async (key, seconds, value) => {
    if (useRedis) return client.setEx(key, seconds, value);
    return client.setex(key, seconds, value);
  },
  get: async (key) => {
    if (useRedis) return client.get(key);
    return client.get(key);
  },
  del: async (key) => {
    if (useRedis) return client.del(key);
    return client.del(key);
  }
};

module.exports = {
  redisClient: cache,
  initializeRedis,
};
