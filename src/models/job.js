const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vendor: {
      type: String,
      required: true,
      enum: ["sync", "async"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "complete", "failed"],
      default: "pending",
      index: true,
    },
    originalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    processedData: {
      type: mongoose.Schema.Types.Mixed,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      message: String,
      code: String,
      stack: String,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    vendorResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    processingStartedAt: Date,
    processingCompletedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
jobSchema.index({ status: 1, createdAt: 1 });
jobSchema.index({ vendor: 1, status: 1 });
jobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // TTL index - expire after 24 hours

// Update the updatedAt field before saving
jobSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
jobSchema.methods.markAsProcessing = function () {
  this.status = "processing";
  this.processingStartedAt = new Date();
  this.attempts += 1;
  return this.save();
};

jobSchema.methods.markAsComplete = function (result) {
  this.status = "complete";
  this.result = result;
  this.processingCompletedAt = new Date();
  return this.save();
};

jobSchema.methods.markAsFailed = function (error) {
  this.status = "failed";
  this.error = {
    message: error.message,
    code: error.code || "UNKNOWN_ERROR",
    stack: error.stack,
  };
  this.processingCompletedAt = new Date();
  return this.save();
};

jobSchema.methods.canRetry = function () {
  return this.attempts < this.maxAttempts;
};

// Static methods
jobSchema.statics.findByRequestId = function (requestId) {
  return this.findOne({ requestId });
};

jobSchema.statics.findPendingJobs = function (limit = 10) {
  return this.find({ status: "pending" }).sort({ createdAt: 1 }).limit(limit);
};

jobSchema.statics.getJobStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("Job", jobSchema);
