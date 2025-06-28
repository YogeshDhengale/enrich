import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");
const BASE_URL = "http://localhost:3000";

export const options = {
  stages: [
    { duration: "10s", target: 50 }, // Ramp up
    { duration: "40s", target: 200 }, // Stay at 200 users
    { duration: "10s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    errors: ["rate<0.1"], // Error rate under 10%
  },
};

export default function () {
  // POST /jobs
  const payload = JSON.stringify({
    userId: Math.floor(Math.random() * 1000),
    data: {
      timestamp: new Date(),
      value: Math.random() * 100,
    },
  });

  const postResponse = http.post(`${BASE_URL}/jobs`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const postCheck = check(postResponse, {
    "POST status is 200": (r) => r.status === 200,
    "POST has request_id": (r) => JSON.parse(r.body).request_id !== undefined,
  });

  errorRate.add(!postCheck);

  if (postResponse.status === 200) {
    const requestId = JSON.parse(postResponse.body).request_id;

    // Wait a bit before checking status
    sleep(1);

    // GET /jobs/:id
    const getResponse = http.get(`${BASE_URL}/jobs/${requestId}`);

    const getCheck = check(getResponse, {
      "GET status is 200": (r) => r.status === 200,
      "GET has status field": (r) => JSON.parse(r.body).status !== undefined,
    });

    errorRate.add(!getCheck);
  }

  sleep(1);
}
