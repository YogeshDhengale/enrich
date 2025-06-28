const MockSyncVendor = require("./mockSyncVendor");
const MockAsyncVendor = require("./mockAsyncVendor");

class VendorFactory {
  static getVendor(vendorType) {
    switch (vendorType) {
      case "sync":
        return new MockSyncVendor();
      case "async":
        return new MockAsyncVendor();
      default:
        throw new Error(`Unknown vendor type: ${vendorType}`);
    }
  }
}

module.exports = VendorFactory;
