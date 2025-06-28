const Bull = require("bull");
const config = require("../config");
const Job = require("../models/job");
const logger = require("../utils/logger");
const VendorFactory = require("../vendors/vendorFactory");
const { processVendorData } = require("../utils/dataProcessor");
const RateLimiter = require("./rateLimiter");

// Create queue
const jobQueue = new Bull("job processing", config.redis.url);

// Create rate limiters for each vendor
const syncVendorLimiter = new RateLimiter("sync", config.rateLimits.syncVendor);
const asyncVendorLimiter = new RateLimiter(
  "async",
  config.rateLimits.asyncVendor
);

// Process jobs
jobQueue.process(config.worker.concurrency, async (bullJob) => {
  const { requestId, vendor, data } = bullJob.data;

  logger.info(`Processing job ${requestId}`, { vendor });

  try {
    // Find the job in database
    const job = await Job.findByRequestId(requestId);
    if (!job) {
      throw new Error(`Job ${requestId} not found in database`);
    }

    // Mark job as processing
    await job.markAsProcessing();

    // Get appropriate rate limiter
    const rateLimiter =
      vendor === "sync" ? syncVendorLimiter : asyncVendorLimiter;

    // Wait for rate limit
    await rateLimiter.waitForSlot();

    // Get vendor client
    const vendorClient = VendorFactory.getVendor(vendor);

    // Make vendor call
    const vendorResponse = await vendorClient.fetchData(data, requestId);

    // For synchronous vendors, process the response immediately
    if (vendor === "sync") {
      const processedData = await processVendorData(vendorResponse, vendor);
      await job.markAsComplete(processedData);

      logger.info(`Job ${requestId} completed`, { vendor });
    } else {
      // For async vendors, the response will come via webhook
      logger.info(`Job ${requestId} submitted to async vendor`, { vendor });
    }
  } catch (error) {
    logger.error(`Job ${requestId} failed:`, error);

    try {
      const job = await Job.findByRequestId(requestId);
      if (job && job.canRetry()) {
        // Retry the job
        const delay = config.worker.retryDelay * job.attempts;
        await jobQueue.add(
          { requestId, vendor, data },
          {
            delay,
            attempts: 1,
          }
        );
        logger.info(`Job ${requestId} scheduled for retry`, {
          attempt: job.attempts + 1,
          delay,
        });
      } else if (job) {
        await job.markAsFailed(error);
      }
    } catch (dbError) {
      logger.error(`Failed to update job ${requestId} status:`, dbError);
    }

    throw error;
  }
});

// Job event handlers
jobQueue.on("completed", (job) => {
  logger.info(`Job ${job.data.requestId} completed successfully`);
});

jobQueue.on("failed", (job, err) => {
  logger.error(`Job ${job.data.requestId} failed:`, err);
});

jobQueue.on("stalled", (job) => {
  logger.warn(`Job ${job.data.requestId} stalled`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing job queue...");
  await jobQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing job queue...");
  await jobQueue.close();
  process.exit(0);
});

module.exports = jobQueue;
