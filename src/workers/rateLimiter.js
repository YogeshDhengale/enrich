const redis = require("../config/redis");
const logger = require("../utils/logger");

class RateLimiter {
  constructor(vendorName, options) {
    this.vendorName = vendorName;
    this.requests = options.requests;
    this.window = options.window;
    this.key = `rate_limit:${vendorName}`;
  }

  async waitForSlot() {
    const now = Date.now();
    const windowStart = now - this.window;

    try {
      // Remove old entries
      await redis.zremrangebyscore(this.key, 0, windowStart);

      // Count current requests in window
      const currentCount = await redis.zcard(this.key);

      if (currentCount >= this.requests) {
        // Find when the oldest request will expire
        const oldestRequests = await redis.zrange(this.key, 0, 0, "WITHSCORES");
        if (oldestRequests.length > 0) {
          const oldestTime = parseInt(oldestRequests[1]);
          const waitTime = oldestTime + this.window - now;

          if (waitTime > 0) {
            logger.info(
              `Rate limit reached for ${this.vendorName}, waiting ${waitTime}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.waitForSlot(); // Recursive call after waiting
          }
        }
      }

      // Add current request to the window
      await redis.zadd(this.key, now, `${now}-${Math.random()}`);
      await redis.expire(this.key, Math.ceil(this.window / 1000));

      logger.debug(`Rate limit slot acquired for ${this.vendorName}`, {
        currentCount: currentCount + 1,
        maxRequests: this.requests,
      });
    } catch (error) {
      logger.error(`Rate limiter error for ${this.vendorName}:`, error);
      // If Redis fails, continue without rate limiting
    }
  }

  async getCurrentCount() {
    try {
      const now = Date.now();
      const windowStart = now - this.window;

      await redis.zremrangebyscore(this.key, 0, windowStart);
      return await redis.zcard(this.key);
    } catch (error) {
      logger.error(
        `Failed to get current count for ${this.vendorName}:`,
        error,
      );
      return 0;
    }
  }

  async reset() {
    try {
      await redis.del(this.key);
      logger.info(`Rate limit reset for ${this.vendorName}`);
    } catch (error) {
      logger.error(`Failed to reset rate limit for ${this.vendorName}:`, error);
    }
  }
}

module.exports = RateLimiter;
