const express = require("express");
const JobController = require("../controllers/jobController");

const router = express.Router();

// POST /api/v1/jobs - Create a new job
router.post("/", JobController.createJob);

// GET /api/v1/jobs/:request_id - Get job status and result
router.get("/:request_id", JobController.getJob);

// GET /api/v1/jobs/stats - Get job statistics (admin)
router.get("/admin/stats", JobController.getJobStats);

module.exports = router;
