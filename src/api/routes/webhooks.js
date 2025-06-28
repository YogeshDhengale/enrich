const express = require('express');
const WebhookController = require('../controllers/webhookController');

const router = express.Router();

// POST /api/v1/vendor-webhook/:vendor - Handle vendor webhooks
router.post('/:vendor', WebhookController.handleVendorWebhook);

module.exports = router;