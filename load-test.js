/**
 * ============================================================
 *  k6 Load Test — Hubo Events API
 * ============================================================
 *  Targets the Express backend served behind the ALB.
 *
 *  Install:  brew install k6   OR   https://k6.io/docs/get-started/installation
 *
 *  Run (basic):
 *    k6 run load-test.js
 *
 *  Run with env overrides:
 *    k6 run \
 *      -e BASE_URL=http://hubo-alb-100517741.ap-south-1.elb.amazonaws.com \
 *      -e ADMIN_EMAIL=your@email.com \
 *      -e ADMIN_PASSWORD=yourpassword \
 *      load-test.js
 *
 *  Before running, create the output dir:
 *    mkdir -p results
 * ============================================================
 *
 *  Scenario weights (realistic for an event ticket site):
 *    40% — Health checks      GET  /health
 *    35% — Registrations      POST /api/register          (DB write)
 *    15% — Payment orders     POST /api/create-order      (DB write + Razorpay API)
 *     5% — Ticket lookup      GET  /api/ticket/:id        (DB read)
 *     5% — Admin dashboard    POST /api/admin/login
 *                             GET  /api/admin/stats
 *                             GET  /api/admin/users
 * ============================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

// ── Custom metrics ──────────────────────────────────────────
const errorRate     = new Rate("errors");
const apiRespTime   = new Trend("api_response_time", true);
const dbQueryTime   = new Trend("db_query_time", true);
const totalRequests = new Counter("total_requests");

// ── Config ──────────────────────────────────────────────────
const BASE_URL       = __ENV.BASE_URL       || "http://hubo-alb-100517741.ap-south-1.elb.amazonaws.com";
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || "admin@example.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "password";

// ── Traffic stages ──────────────────────────────────────────
export const options = {
  stages: [
    { duration: "2m",  target: 50  },   // Warm-up ramp
    { duration: "5m",  target: 50  },   // Steady baseline
    { duration: "1m",  target: 200 },   // Spike burst
    { duration: "5m",  target: 200 },   // Sustained peak — ASG should scale
    { duration: "2m",  target: 300 },   // Push harder
    { duration: "5m",  target: 300 },   // Hold at max
    { duration: "3m",  target: 50  },   // Cool down
    { duration: "2m",  target: 0   },   // Drain
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],  // 95th < 500ms, 99th < 1.5s
    errors:            ["rate<0.05"],                 // Error rate < 5%
    api_response_time: ["p(95)<400"],                 // General API calls < 400ms
    db_query_time:     ["p(95)<300"],                 // DB-heavy endpoints < 300ms
  },
};

// ── Realistic Indian user data pools ───────────────────────
const NAMES = [
  "Rohan Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta",
  "Rahul Singh",  "Ananya Verma", "Vikram Joshi", "Kavita Nair",
  "Arjun Reddy",  "Pooja Mehta", "Siddharth Rao", "Divya Iyer",
];
const CATEGORIES = ["Music", "Dancing", "Comedy & Mimicry", "Dialogue Delivery"];
const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai",
  "Kolkata", "Hyderabad", "Pune", "Ahmedabad",
];

function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept":       "application/json",
  };
}

// ── Validate response and track metrics ─────────────────────
function validate(res, name, expectedStatus = 200) {
  totalRequests.add(1);
  const ok = check(res, {
    [`${name} — status ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name} — body not empty`]:           (r) => r.body && r.body.length > 0,
    [`${name} — no server error`]:          (r) => r.status < 500,
  });
  errorRate.add(!ok);
  return ok;
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 1 — Health check (40% of traffic)
//  Simulates load-balancer pings and uptime monitors
// ════════════════════════════════════════════════════════════
function healthScenario() {
  group("Health — GET /health", () => {
    const res = http.get(`${BASE_URL}/health`);
    apiRespTime.add(res.timings.duration);
    validate(res, "Health check");
    sleep(randomIntBetween(1, 2));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 2 — User registration (35% of traffic)
//  Simulates attendees filling out the registration form.
//  This is a DB write — tests PostgreSQL write throughput.
// ════════════════════════════════════════════════════════════
function registrationScenario() {
  const name = randomItem(NAMES);
  const uid  = randomIntBetween(10000, 9999999);
  const city = randomItem(CITIES);

  group("Register — POST /api/register", () => {
    const payload = JSON.stringify({
      name:     `${name} ${uid}`,
      email:    `user${uid}@loadtest.dev`,
      phone:    `+91${randomIntBetween(7000000000, 9999999999)}`,
      address:  `${randomIntBetween(1, 999)} Test Nagar, ${city}`,
      category: randomItem(CATEGORIES),
      amount:   800,
    });

    const res = http.post(`${BASE_URL}/api/register`, payload, {
      headers: jsonHeaders(),
    });
    dbQueryTime.add(res.timings.duration);
    validate(res, "Registration");
    sleep(randomIntBetween(1, 3));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 3 — Payment order creation (15% of traffic)
//  Simulates the checkout flow: creates a Razorpay order and
//  a pending DB record. NOTE: this makes a real Razorpay API
//  call on each request. Keep VU count moderate to avoid
//  hitting Razorpay rate limits during extended runs.
// ════════════════════════════════════════════════════════════
function createOrderScenario() {
  const uid = randomIntBetween(10000, 9999999);

  group("Payment — POST /api/create-order", () => {
    const payload = JSON.stringify({
      amount: 800,
      ticketData: {
        name:     `LoadTest User ${uid}`,
        email:    `loadtest${uid}@example.com`,
        phone:    `+91${randomIntBetween(7000000000, 9999999999)}`,
        category: randomItem(CATEGORIES),
        address:  `${randomIntBetween(1, 999)} Stage Road, Mumbai`,
      },
    });

    const res = http.post(`${BASE_URL}/api/create-order`, payload, {
      headers: jsonHeaders(),
    });
    apiRespTime.add(res.timings.duration);

    totalRequests.add(1);
    // Accept 200 (success) or 502/504 (Razorpay API timeout under load).
    // We only fail the check on a 5xx from the Express server itself.
    check(res, {
      "Create order — server alive": (r) => r.status < 500,
    });
    errorRate.add(res.status >= 500);

    sleep(randomIntBetween(2, 5));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 4 — Ticket lookup (5% of traffic)
//  Simulates attendees opening their ticket confirmation link.
//  Uses random UUIDs — most will 404, which is expected and
//  treated as valid (tests the DB read path without crashes).
// ════════════════════════════════════════════════════════════
function ticketLookupScenario() {
  group("Ticket — GET /api/ticket/:id", () => {
    // Generate a random v4-like UUID
    const fakeId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });

    const res = http.get(`${BASE_URL}/api/ticket/${fakeId}`, {
      headers: jsonHeaders(),
    });
    dbQueryTime.add(res.timings.duration);
    totalRequests.add(1);

    // 404 is expected for random IDs — only fail on 5xx
    const ok = check(res, {
      "Ticket lookup — no server error": (r) => r.status < 500,
      "Ticket lookup — responded":       (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(!ok);
    sleep(randomIntBetween(1, 2));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 5 — Admin dashboard (5% of traffic)
//  Simulates an admin session: login → stats → user list.
//  Protected routes require the admin_token cookie.
// ════════════════════════════════════════════════════════════
function adminScenario() {
  let cookie = "";

  group("Admin — POST /api/admin/login", () => {
    const payload = JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const res = http.post(`${BASE_URL}/api/admin/login`, payload, {
      headers: jsonHeaders(),
    });
    apiRespTime.add(res.timings.duration);
    validate(res, "Admin login");

    // Extract the HTTP-only cookie for subsequent requests
    const setCookie = res.headers["Set-Cookie"] || "";
    const match = setCookie.match(/admin_token=([^;]+)/);
    if (match) cookie = match[1];
    sleep(randomIntBetween(1, 2));
  });

  // If login failed, don't hammer protected routes
  if (!cookie) return;

  const authHeaders = { ...jsonHeaders(), Cookie: `admin_token=${cookie}` };

  group("Admin — GET /api/admin/stats", () => {
    const res = http.get(`${BASE_URL}/api/admin/stats`, { headers: authHeaders });
    dbQueryTime.add(res.timings.duration);
    validate(res, "Admin stats");
    sleep(randomIntBetween(2, 4));
  });

  group("Admin — GET /api/admin/users", () => {
    const res = http.get(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    dbQueryTime.add(res.timings.duration);
    validate(res, "Admin users");
    sleep(randomIntBetween(2, 4));
  });
}

// ── Main: weighted scenario selection ───────────────────────
export default function () {
  const roll = Math.random();

  if (roll < 0.40) {
    healthScenario();           // 40% — health / uptime
  } else if (roll < 0.75) {
    registrationScenario();     // 35% — user registrations (DB write)
  } else if (roll < 0.90) {
    createOrderScenario();      // 15% — payment order creation
  } else if (roll < 0.95) {
    ticketLookupScenario();     //  5% — ticket lookup (DB read)
  } else {
    adminScenario();            //  5% — admin dashboard
  }
}

// ── Summary report ──────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    timestamp:       new Date().toISOString(),
    totalRequests:   data.metrics.total_requests?.values?.count || 0,
    errorRate:       ((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2) + "%",
    avgResponseTime: Math.round(data.metrics.http_req_duration?.values?.avg || 0) + "ms",
    p95ResponseTime: Math.round(data.metrics.http_req_duration?.values?.["p(95)"] || 0) + "ms",
    p99ResponseTime: Math.round(data.metrics.http_req_duration?.values?.["p(99)"] || 0) + "ms",
    p95ApiTime:      Math.round(data.metrics.api_response_time?.values?.["p(95)"] || 0) + "ms",
    p95DbTime:       Math.round(data.metrics.db_query_time?.values?.["p(95)"] || 0) + "ms",
    peakVUs:         data.metrics.vus_max?.values?.value || 0,
  };

  console.log("\n═══ LOAD TEST SUMMARY ═══");
  console.log(JSON.stringify(summary, null, 2));

  return {
    "results/summary.json": JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}
