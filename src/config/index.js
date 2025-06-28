module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-vendor-service'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  rateLimits: {
    syncVendor: {
      requests: parseInt(process.env.SYNC_VENDOR_RATE_LIMIT) || 10,
      window: 60 * 1000 // 1 minute
    },
    asyncVendor: {
      requests: parseInt(process.env.ASYNC_VENDOR_RATE_LIMIT) || 5,
      window: 60 * 1000 // 1 minute
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
    retryAttempts: parseInt(process.env.WORKER_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.WORKER_RETRY_DELAY) || 1000,
    jobTimeout: parseInt(process.env.WORKER_JOB_TIMEOUT) || 30000
  },
  
  vendors: {
    sync: {
      url: process.env.SYNC_VENDOR_URL || 'http://localhost:3002/sync',
      timeout: 5000
    },
    async: {
      url: process.env.ASYNC_VENDOR_URL || 'http://localhost:3002/async',
      timeout: 5000,
      webhookUrl: process.env.ASYNC_WEBHOOK_URL || 'http://localhost:3000/api/v1/vendor-webhook/async'
    }
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    apiKey: process.env.API_KEY || 'your-api-key-change-in-production'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
