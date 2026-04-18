/**
 * ============================================================
 *  k6 Load Test — Hubo Events Frontend (Next.js via CloudFront)
 * ============================================================
 *  Targets the Next.js frontend served through CloudFront CDN.
 *  Tests page load performance, CDN cache behaviour, and
 *  resilience of the frontend under concurrent user traffic.
 *
 *  Install:  brew install k6   OR   https://k6.io/docs/get-started/installation
 *
 *  Run (basic):
 *    k6 run load-test-frontend.js
 *
 *  Run with env override:
 *    k6 run -e FRONTEND_URL=https://d2ve7lnplnj6nc.cloudfront.net load-test-frontend.js
 *    k6 run -e FRONTEND_URL=https://jayykayy.sbs load-test-frontend.js
 *
 *  Before running, create the output dir:
 *    mkdir -p results
 * ============================================================
 *
 *  Scenario weights (realistic for an event site):
 *    55% — Homepage       GET /            (landing page)
 *    35% — Checkout page  GET /checkout    (ticket purchase form)
 *    10% — Admin page     GET /admin       (dashboard — will redirect if not logged in)
 * ============================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

// ── Custom metrics ──────────────────────────────────────────
const errorRate      = new Rate("errors");
const pageLoadTime   = new Trend("page_load_time", true);
const ttfb           = new Trend("time_to_first_byte", true);
const totalRequests  = new Counter("total_requests");

// ── Config ──────────────────────────────────────────────────
const FRONTEND_URL = __ENV.FRONTEND_URL || "https://d2ve7lnplnj6nc.cloudfront.net";

// ── Traffic stages ──────────────────────────────────────────
export const options = {
  stages: [
    { duration: "2m",  target: 50  },   // Warm-up ramp
    { duration: "5m",  target: 50  },   // Steady baseline
    { duration: "1m",  target: 200 },   // Spike burst
    { duration: "5m",  target: 200 },   // Sustained peak
    { duration: "2m",  target: 300 },   // Push harder
    { duration: "5m",  target: 300 },   // Hold at max
    { duration: "3m",  target: 50  },   // Cool down
    { duration: "2m",  target: 0   },   // Drain
  ],
  thresholds: {
    // CloudFront CDN should be fast — stricter than the API thresholds
    http_req_duration: ["p(95)<800",  "p(99)<2000"],
    errors:            ["rate<0.01"],   // CDN should be near-zero errors
    page_load_time:    ["p(95)<800"],
    time_to_first_byte:["p(95)<300"],  // CloudFront TTFB should be low
  },
};

// ── Realistic browser user-agents ───────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
];

function browserHeaders() {
  return {
    "User-Agent":      randomItem(USER_AGENTS),
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection":      "keep-alive",
    "Cache-Control":   "no-cache",  // Bypass CDN cache — tests origin resilience
  };
}

function validate(res, name) {
  totalRequests.add(1);
  const ok = check(res, {
    [`${name} — status 200`]:     (r) => r.status === 200,
    [`${name} — body not empty`]: (r) => r.body && r.body.length > 100,
    [`${name} — no server error`]:(r) => r.status < 500,
  });
  errorRate.add(!ok);
  return ok;
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 1 — Homepage (55% of traffic)
//  Most visitors land here first. Tests the scroll-hero video
//  page, CDN delivery, and initial render performance.
// ════════════════════════════════════════════════════════════
function homepageScenario() {
  group("Frontend — GET /", () => {
    const res = http.get(`${FRONTEND_URL}/`, { headers: browserHeaders() });

    pageLoadTime.add(res.timings.duration);
    ttfb.add(res.timings.waiting);  // waiting = time to first byte

    validate(res, "Homepage");
    sleep(randomIntBetween(2, 5));  // Simulate reading the landing page
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 2 — Checkout page (35% of traffic)
//  Visitors who click "Grab Your Tickets". Tests the checkout
//  form render and Razorpay SDK script injection readiness.
// ════════════════════════════════════════════════════════════
function checkoutScenario() {
  group("Frontend — GET /checkout", () => {
    const res = http.get(`${FRONTEND_URL}/checkout`, { headers: browserHeaders() });

    pageLoadTime.add(res.timings.duration);
    ttfb.add(res.timings.waiting);

    validate(res, "Checkout page");
    sleep(randomIntBetween(3, 8));  // User fills out the form
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 3 — Admin page (10% of traffic)
//  Tests that the admin route loads (it will show the login
//  form if the user is unauthenticated — still a valid 200).
// ════════════════════════════════════════════════════════════
function adminPageScenario() {
  group("Frontend — GET /admin", () => {
    const res = http.get(`${FRONTEND_URL}/admin`, { headers: browserHeaders() });

    pageLoadTime.add(res.timings.duration);
    ttfb.add(res.timings.waiting);

    validate(res, "Admin page");
    sleep(randomIntBetween(1, 3));
  });
}

// ── Main: weighted scenario selection ───────────────────────
export default function () {
  const roll = Math.random();

  if (roll < 0.55) {
    homepageScenario();     // 55% — casual visitors on the landing page
  } else if (roll < 0.90) {
    checkoutScenario();     // 35% — visitors trying to buy tickets
  } else {
    adminPageScenario();    // 10% — admin access
  }
}

// ── Summary report ──────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    timestamp:       new Date().toISOString(),
    target:          FRONTEND_URL,
    totalRequests:   data.metrics.total_requests?.values?.count || 0,
    errorRate:       ((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2) + "%",
    avgResponseTime: Math.round(data.metrics.http_req_duration?.values?.avg || 0) + "ms",
    p95ResponseTime: Math.round(data.metrics.http_req_duration?.values?.["p(95)"] || 0) + "ms",
    p99ResponseTime: Math.round(data.metrics.http_req_duration?.values?.["p(99)"] || 0) + "ms",
    p95PageLoad:     Math.round(data.metrics.page_load_time?.values?.["p(95)"] || 0) + "ms",
    p95TTFB:         Math.round(data.metrics.time_to_first_byte?.values?.["p(95)"] || 0) + "ms",
    peakVUs:         data.metrics.vus_max?.values?.value || 0,
  };

  console.log("\n═══ FRONTEND LOAD TEST SUMMARY ═══");
  console.log(JSON.stringify(summary, null, 2));

  return {
    "results/frontend-summary.json": JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}
