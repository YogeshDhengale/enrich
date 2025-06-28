const Bull = require('bull');
const config = require('../config');
const logger = require('./logger');

// Create job queue
const jobQueue = new Bull('job processing', config.redis.url, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 1
  }
});

async function addJobToQueue(jobData) {
  try {
    const job = await jobQueue.add(jobData, {
      priority: jobData.vendor === 'sync' ? 1 : 2, // Higher priority for sync jobs
      delay: 0
    });
    
    logger.info(`Job added to queue`, {
      jobId: job.id,
      requestId: jobData.requestId,
      vendor: jobData.vendor
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to add job to queue:', error);
    throw error;
  }
}

async function getQueueStats() {
  try {
    const waiting = await jobQueue.getWaiting();
    const active = await jobQueue.getActive();
    const completed = await jobQueue.getCompleted();
    const failed = await jobQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    throw error;
  }
}

module.exports = {
  jobQueue,
  addJobToQueue,
  getQueueStats
};
