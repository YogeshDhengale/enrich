const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

class MockAsyncVendor {
  constructor() {
    this.baseUrl = config.vendors.async.url;
    this.timeout = config.vendors.async.timeout;
    this.webhookUrl = config.vendors.async.webhookUrl;
  }

  async fetchData(data, requestId) {
    try {
      logger.info(`Calling async vendor for job ${requestId}`);

      const response = await axios.post(
        this.baseUrl,
        {
          requestId,
          data,
          webhookUrl: this.webhookUrl,
        },
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        },
      );

      logger.info(`Async vendor accepted job ${requestId}`, {
        status: response.status,
      });

      return response.data;
    } catch (error) {
      logger.error(`Async vendor error for job ${requestId}:`, error);
      throw new Error(`Async vendor failed: ${error.message}`);
    }
  }
}

module.exports = MockAsyncVendor;
