const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class MockSyncVendor {
  constructor() {
    this.baseUrl = config.vendors.sync.url;
    this.timeout = config.vendors.sync.timeout;
  }

  async fetchData(data, requestId) {
    try {
      logger.info(`Calling sync vendor for job ${requestId}`);
      
      const response = await axios.post(this.baseUrl, {
        requestId,
        data
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      });

      logger.info(`Sync vendor responded for job ${requestId}`, {
        status: response.status
      });

      return response.data;
    } catch (error) {
      logger.error(`Sync vendor error for job ${requestId}:`, error);
      throw new Error(`Sync vendor failed: ${error.message}`);
    }
  }
}

module.exports = MockSyncVendor;
