# Multi-Vendor Data Fetch Service

A scalable Node.js service that handles data fetching from multiple external vendors with different characteristics (rate limits, sync/async responses) through a unified API.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [API Documentation](#api-documentation)
- [Load Testing](#load-testing)
- [Deployment](#deployment)
- [Configuration](#configuration)

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│  API Server │───▶│    Queue    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  MongoDB    │    │   Worker    │
                   └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │Mock Vendors │
                                    │ - Sync API  │
                                    │ - Async API │
                                    └─────────────┘
```

**Key Components:**

- **API Server**: Express.js REST API with job creation and status endpoints
- **Background Worker**: Processes jobs from Redis queue with rate limiting
- **Mock Vendors**: Two test vendors (synchronous and asynchronous)
- **MongoDB**: Persistent storage for job data and results
- **Redis**: Message queue and rate limiting

## 📁 Project Structure

```
enrich/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── jobController.js
│   │   │   └── webhookController.js
│   │   ├── routes/
│   │   │   ├── jobs.js
│   │   │   └── webhooks.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validator.js
│   │   └── server.js
│   ├── workers/
│   │   ├── jobProcessor.js
│   │   └── rateLimiter.js
│   ├── vendors/
│   │   ├── mockSyncVendor.js
│   │   ├── mockAsyncVendor.js
│   │   └── vendorFactory.js
│   ├── models/
│   │   └── Job.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── index.js
│   ├── utils/
│   │   ├── dataProcessor.js
│   │   ├── logger.js
│   │   └── queue.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   ├── workers/
│   │   └── utils/
│   ├── integration/
│   │   └── api.test.js
│   └── load/
│       ├── load-test.js
│       └── results/
├── scripts/
│   ├── setup.sh
│   └── deploy.sh
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx.conf
├── package.json
├── package-lock.json
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YogeshDhengale/enrich.git
cd enrich

# Copy environment file
cp .env

# Start all services
docker-compose up -d

# Check service health
curl http://localhost:3000/health
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start MongoDB and Redis (using Docker)
docker-compose up -d mongodb redis

# Set environment variables
export NODE_ENV=development
export MONGODB_URI=mongodb://localhost:27017/multi-vendor-service
export REDIS_URL=redis://localhost:6379

# Start the API server
npm run dev:api

# Start the worker (in another terminal)
npm run dev:worker

# Start mock vendors (in another terminal)
npm run dev:vendors
```

## 💻 Local Development

### Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Run tests
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env` file based:

```env
NODE_ENV=development
PORT=3000
WORKER_PORT=3001
VENDOR_PORT=3002

# Database
MONGODB_URI=mongodb://localhost:27017/multi-vendor-service

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
SYNC_VENDOR_RATE_LIMIT=10
ASYNC_VENDOR_RATE_LIMIT=5

# Logging
LOG_LEVEL=info

# Security
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
```

## 📚 API Documentation

### Core Endpoints

#### 1. Create Job

```http
POST /api/v1/jobs
Content-Type: application/json

{
  "vendor": "sync",
  "data": {
    "userId": "123",
    "query": "user-profile"
  }
}
```

**Response:**

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Get Job Status

```http
GET /api/v1/jobs/{request_id}
```

**Response (Processing):**

```json
{
  "status": "processing",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Response (Complete):**

```json
{
  "status": "complete",
  "result": {
    "userId": "123",
    "profile": {...}
  },
  "created_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:30:05Z"
}
```

#### 3. Vendor Webhook

```http
POST /api/v1/vendor-webhook/{vendor}
Content-Type: application/json

{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "complete",
  "data": {...}
}
```

#### 4. Health Check

```http
GET /health
```

### cURL Examples

```bash
# Create a job
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"vendor":"sync","data":{"userId":"123"}}'

# Get job status
curl http://localhost:3000/api/v1/jobs/{request_id}

# Health check
curl http://localhost:3000/health
```

## 🔧 Load Testing

### Using k6

```bash
# Install k6
npm install -g k6

# Run load test
k6 run tests/load/load-test.js

# With custom parameters
k6 run --vus 200 --duration 60s tests/load/load-test.js
```

### Using Apache Bench

```bash
# Test POST endpoint (create jobs)
ab -n 1000 -c 50 -T application/json -p tests/load/job-payload.json \
   http://localhost:3000/api/v1/jobs

# Test GET endpoint
ab -n 1000 -c 50 http://localhost:3000/api/v1/jobs/test-id
```

### Sample Load Test Results

```
Requests:      10,000
Duration:      60s
Rate:          166.67 req/s
Latency:
  p50: 45ms
  p95: 120ms
  p99: 250ms
Success Rate:  99.8%
```

## 🚀 Deployment

### Docker Production Deployment

```bash
# Build production image
docker build -f docker/Dockerfile -t multi-vendor-service:latest .

# Deploy with production compose
docker-compose -f docker/docker-compose.prod.yml up -d

# Scale workers
docker-compose -f docker/docker-compose.prod.yml up -d --scale worker=3
```

## ⚙️ Configuration

### Rate Limiting Configuration

```javascript
// src/config/rateLimits.js
module.exports = {
  syncVendor: {
    requests: 10,
    window: "1m",
  },
  asyncVendor: {
    requests: 5,
    window: "1m",
  },
};
```

### Worker Configuration

```javascript
// src/config/worker.js
module.exports = {
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000,
  jobTimeout: 30000,
};
```

### MongoDB Indexes

```javascript
// Ensure proper indexing for performance
db.jobs.createIndex({ request_id: 1 }, { unique: true });
db.jobs.createIndex({ status: 1, created_at: 1 });
db.jobs.createIndex({ created_at: 1 }, { expireAfterSeconds: 86400 });
```

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 📊 Monitoring

### Metrics Collection

- Request/response times
- Queue depth
- Error rates
- Vendor response times
- Rate limit usage

### Logging

```javascript
// Structured logging with Winston
logger.info("Job processed", {
  jobId: job.id,
  vendor: job.vendor,
  duration: Date.now() - job.startTime,
  status: "complete",
});
```

### Health Checks

```http
GET /health
GET /health/detailed
```

## 🔒 Security

- Input validation with Joi
- Rate limiting per IP
- API key authentication
- PII data scrubbing
- CORS configuration
- Helmet.js security headers

## 🛠️ Development Tools

- **ESLint + Prettier**: Code formatting
- **Husky**: Git hooks
- **Jest**: Testing framework
- **Winston**: Logging
- **Joi**: Input validation

## 🆘 Support

- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the Postman collection for API examples

---

**Built with ❤️ using Node.js, Express, MongoDB, and Redis**
