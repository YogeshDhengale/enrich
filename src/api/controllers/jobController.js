const { v4: uuidv4 } = require('uuid');
const Job = require('../../models/job');
const { addJobToQueue } = require('../../utils/queue');
const logger = require('../../utils/logger');
const { validateJobPayload } = require('../middleware/validator');

class JobController {
  // Create a new job
  static async createJob(req, res) {
    try {
      // Validate input
      const { error, value } = validateJobPayload(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.details.map(d => d.message)
        });
      }

      const { vendor, data } = value;
      const requestId = uuidv4();

      // Create job in database
      const job = new Job({
        requestId,
        vendor,
        originalData: data,
        status: 'pending'
      });

      await job.save();

      // Add job to queue
      await addJobToQueue({
        requestId: job.requestId,
        vendor: job.vendor,
        data: job.originalData
      });

      logger.info('Job created successfully', {
        requestId: job.requestId,
        vendor: job.vendor
      });

      res.status(201).json({
        request_id: job.requestId
      });
    } catch (error) {
      logger.error('Error creating job:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create job'
      });
    }
  }

  // Get job status and result
  static async getJob(req, res) {
    try {
      const { request_id } = req.params;

      const job = await Job.findByRequestId(request_id);
      if (!job) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Job not found'
        });
      }

      const response = {
        status: job.status,
        created_at: job.createdAt.toISOString()
      };

      if (job.status === 'complete') {
        response.result = job.result;
        response.completed_at = job.processingCompletedAt?.toISOString();
      } else if (job.status === 'failed') {
        response.error = job.error?.message || 'Unknown error occurred';
        response.completed_at = job.processingCompletedAt?.toISOString();
      } else if (job.status === 'processing') {
        response.processing_started_at = job.processingStartedAt?.toISOString();
      }

      res.json(response);
    } catch (error) {
      logger.error('Error fetching job:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch job'
      });
    }
  }

  // Get job statistics (admin endpoint)
  static async getJobStats(req, res) {
    try {
      const stats = await Job.getJobStats();
      const formattedStats = {};
      
      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
      });

      res.json({
        statistics: formattedStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching job stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = JobController;
