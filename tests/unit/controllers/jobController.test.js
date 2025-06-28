const request = require('supertest');
const app = require('../../../src/app');
const Job = require('../../../src/models/job');

jest.mock('../../../src/models/Job');
jest.mock('../../../src/utils/queue');

describe('Job Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /jobs', () => {
    it('should create a new job and return request_id', async () => {
      const mockJob = {
        requestId: 'test-uuid',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Job.mockImplementation(() => mockJob);

      const response = await request(app)
        .post('/jobs')
        .send({ test: 'data' })
        .expect(200);

      expect(response.body).toHaveProperty('request_id');
      expect(mockJob.save).toHaveBeenCalled();
    });

    it('should return 400 for empty payload', async () => {
      await request(app)
        .post('/jobs')
        .send({})
        .expect(400);
    });
  });

  describe('GET /jobs/:requestId', () => {
    it('should return job status and result when complete', async () => {
      const mockJob = {
        requestId: 'test-uuid',
        status: 'complete',
        result: { data: 'test' }
      };

      Job.findOne = jest.fn().mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/jobs/test-uuid')
        .expect(200);

      expect(response.body.status).toBe('complete');
      expect(response.body.result).toEqual({ data: 'test' });
    });

    it('should return 404 for non-existent job', async () => {
      Job.findOne = jest.fn().mockResolvedValue(null);

      await request(app)
        .get('/jobs/non-existent')
        .expect(404);
    });
  });
});
