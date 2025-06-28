const logger = require('./logger');

// Data cleaning and processing utilities
class DataProcessor {
  static async processVendorData(rawData, vendorType) {
    try {
      logger.info(`Processing data from ${vendorType} vendor`);

      // Clean and process the data
      let processedData = JSON.parse(JSON.stringify(rawData));

      // Remove PII and sensitive data
      processedData = this.removePII(processedData);

      // Trim strings
      processedData = this.trimStrings(processedData);

      // Normalize data structure
      processedData = this.normalizeData(processedData, vendorType);

      // Add processing metadata
      processedData._metadata = {
        processedAt: new Date().toISOString(),
        vendorType,
        version: '1.0'
      };

      logger.info(`Data processing completed for ${vendorType} vendor`);
      return processedData;
    } catch (error) {
      logger.error(`Data processing failed for ${vendorType} vendor:`, error);
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }

  static removePII(data) {
    const piiFields = [
      'ssn', 'social_security_number', 'credit_card', 'password',
      'secret', 'private_key', 'api_key', 'token'
    ];

    return this.recursiveClean(data, (key, value) => {
      if (typeof key === 'string' && piiFields.some(field => 
        key.toLowerCase().includes(field))) {
        return '[REDACTED]';
      }
      return value;
    });
  }

  static trimStrings(data) {
    return this.recursiveClean(data, (key, value) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return value;
    });
  }

  static normalizeData(data, vendorType) {
    // Vendor-specific normalization
    if (vendorType === 'sync') {
      return {
        ...data,
        source: 'sync_vendor',
        responseTime: 'immediate'
      };
    } else if (vendorType === 'async') {
      return {
        ...data,
        source: 'async_vendor',
        responseTime: 'delayed'
      };
    }
    return data;
  }

  static recursiveClean(obj, cleanFunction) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.recursiveClean(item, cleanFunction));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanFunction(key, value);
      if (cleanedValue !== null && typeof cleanedValue === 'object') {
        result[key] = this.recursiveClean(cleanedValue, cleanFunction);
      } else {
        result[key] = cleanedValue;
      }
    }
    return result;
  }
}

module.exports = {
  processVendorData: DataProcessor.processVendorData.bind(DataProcessor)
};
