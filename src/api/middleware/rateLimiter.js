const rateLimit = require('express-rate-limit');
const config = require('../../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimits.api.windowMs,
  max: config.rateLimits.api.max,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for job creation
const createJobLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 job creations per minute per IP
  message: {
    error: 'Too Many Requests',
    message: 'Too many job creation requests, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  createJobLimiter
};