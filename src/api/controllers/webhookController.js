const Job = require('../../models/job');
const logger = require('../../utils/logger');
const { processVendorData } = require('../../utils/dataProcessor');

class WebhookController {
  // Handle vendor webhook callbacks
  static async handleVendorWebhook(req, res) {
    try {
      const { vendor } = req.params;
      const { job_id, status, data, error } = req.body;

      if (!job_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'job_id is required'
        });
      }

      const job = await Job.findByRequestId(job_id);
      if (!job) {
        logger.warn(`Webhook received for unknown job: ${job_id}`, { vendor });
        return res.status(404).json({
          error: 'Not Found',
          message: 'Job not found'
        });
      }

      // Validate vendor matches
      if (job.vendor !== vendor) {
        logger.warn(`Vendor mismatch for job ${job_id}`, {
          expected: job.vendor,
          received: vendor
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Vendor mismatch'
        });
      }

      logger.info(`Webhook received for job ${job_id}`, {
        vendor,
        status,
        hasData: !!data
      });

      // Process the webhook based on status
      if (status === 'complete' && data) {
        // Process and clean the vendor data
        const processedData = await processVendorData(data, vendor);
        await job.markAsComplete(processedData);
        
        logger.info(`Job ${job_id} completed via webhook`, { vendor });
      } else if (status === 'failed' || error) {
        const errorMessage = error || 'Vendor reported failure';
        await job.markAsFailed(new Error(errorMessage));
        
        logger.error(`Job ${job_id} failed via webhook`, {
          vendor,
          error: errorMessage
        });
      } else {
        logger.warn(`Unknown webhook status for job ${job_id}`, {
          vendor,
          status,
          body: req.body
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid webhook payload'
        });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process webhook'
      });
    }
  }
}

module.exports = WebhookController;
