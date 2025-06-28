const redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

let client;

async function createRedisClient() {
  try {
    client = redis.createClient({
      url: config.redis.url,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('end', () => {
      logger.info('Redis connection ended');
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

// Initialize client
if (!client) {
  createRedisClient().catch(error => {
    logger.error('Failed to initialize Redis client:', error);
  });
}

module.exports = client;