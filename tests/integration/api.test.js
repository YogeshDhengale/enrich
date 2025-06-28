const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Job = require('../../src/models/job');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/multivendor_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Job.deleteMany({});
  });

  describe('Job Flow', () => {
    it('should create job, process it, and return result', async () => {
      // Create job
      const createResponse = await request(app)
        .post('/jobs')
        .send({ testData: 'value' })
        .expect(200);

      const requestId = createResponse.body.request_id;
      expect(requestId).toBeDefined();

      // Check initial status
      const statusResponse = await request(app)
        .get(`/jobs/${requestId}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('pending');

      // Simulate job processing
      await Job.findOneAndUpdate(
        { requestId },
        { 
          status: 'complete',
          result: { processed: true },
          completedAt: new Date()
        }
      );

      // Check final status
      const finalResponse = await request(app)
        .get(`/jobs/${requestId}`)
        .expect(200);

      expect(finalResponse.body.status).toBe('complete');
      expect(finalResponse.body.result).toEqual({ processed: true });
    });
  });

  describe('Webhook Tests', () => {
    it('should handle async vendor webhook', async () => {
      const job = new Job({
        requestId: 'test-webhook',
        status: 'processing',
        vendor: 'async',
        payload: { test: 'data' }
      });
      await job.save();

      await request(app)
        .post('/vendor-webhook/async')
        .send({
          requestId: 'test-webhook',
          result: { webhookData: 'received' }
        })
        .expect(200);

      const updatedJob = await Job.findOne({ requestId: 'test-webhook' });
      expect(updatedJob.status).toBe('complete');
      expect(updatedJob.result.webhookData).toBe('received');
    });
  });
});