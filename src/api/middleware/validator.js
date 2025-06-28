const Joi = require("joi");

const jobPayloadSchema = Joi.object({
  vendor: Joi.string().valid("sync", "async").required(),
  data: Joi.object().required(),
});

const webhookPayloadSchema = Joi.object({
  job_id: Joi.string().required(),
  status: Joi.string().valid("complete", "failed").required(),
  data: Joi.object().when("status", {
    is: "complete",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  error: Joi.string().optional(),
});

function validateJobPayload(payload) {
  return jobPayloadSchema.validate(payload);
}

function validateWebhookPayload(payload) {
  return webhookPayloadSchema.validate(payload);
}

module.exports = {
  validateJobPayload,
  validateWebhookPayload,
};
