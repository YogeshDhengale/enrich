const jobProcessor = require("../../../src/workers/jobProcessor");
const Job = require("../../../src/models/job");
const vendorFactory = require("../../../src/vendors/vendorFactory");

jest.mock("../../../src/models/Job");
jest.mock("../../../src/vendors/vendorFactory");

describe("Job Processor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process sync vendor job successfully", async () => {
    const mockJob = {
      requestId: "test-uuid",
      vendor: "sync",
      payload: { test: "data" },
      save: jest.fn(),
    };

    const mockVendor = {
      processRequest: jest.fn().mockResolvedValue({ result: "success" }),
    };

    Job.findOne = jest.fn().mockResolvedValue(mockJob);
    vendorFactory.getVendor = jest.fn().mockReturnValue(mockVendor);

    await jobProcessor.processJob({ requestId: "test-uuid" });

    expect(mockVendor.processRequest).toHaveBeenCalledWith({ test: "data" });
    expect(mockJob.save).toHaveBeenCalled();
  });
});
