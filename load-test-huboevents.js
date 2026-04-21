/**
 * ============================================================
 *  k6 Load Test — huboevents.in (Supabase Edge Functions)
 * ============================================================
 *  Frontend : https://huboevents.in  (Next.js)
 *  API      : https://dtwqlvzlfvavabzbddnv.supabase.co/functions/v1
 *  Auth     : Authorization: Bearer <publishable_key>
 *
 *  Install:  https://k6.io/docs/get-started/installation
 *
 *  Run (defaults — uses embedded keys):
 *    k6 run load-test-huboevents.js
 *
 *  Run with overrides:
 *    k6 run \
 *      -e FRONTEND_URL=https://huboevents.in \
 *      -e SUPABASE_URL=https://dtwqlvzlfvavabzbddnv.supabase.co/functions/v1 \
 *      -e SUPABASE_KEY=sb_publishable_6C4-FWVCeCzL1huO4IdcoA_whBLynh6 \
 *      -e ADMIN_EMAIL=jalajkumar23989@email.com \
 *      -e ADMIN_PASSWORD=jalaj \
 *      load-test-huboevents.js
 *
 *  Before running:
 *    mkdir -p results
 *
 * ============================================================
 *  Traffic breakdown:
 *    40% — Homepage          GET  huboevents.in/
 *    20% — Checkout page     GET  huboevents.in/checkout
 *    20% — Registration      POST /register
 *    10% — Create order      POST /create-order   (Razorpay + DB)
 *     5% — Ticket lookup     GET  /ticket?id=:id
 *     5% — Admin dashboard   POST /admin/login → /admin/stats → /admin/users
 *
 *  Stages (mimics a viral WhatsApp share spike):
 *    0–2m   50 VUs   warm-up
 *    2–7m   50 VUs   steady baseline
 *    7–8m   200 VUs  spike
 *    8–13m  200 VUs  sustained peak
 *    13–15m 350 VUs  ceiling push
 *    15–20m 350 VUs  hold at max
 *    20–23m 50 VUs   cool down
 *    23–25m 0 VUs    drain
 * ============================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

// ── Targets ─────────────────────────────────────────────────
const FRONTEND_URL   = __ENV.FRONTEND_URL  || "https://huboevents.in";
const SUPABASE_URL   = __ENV.SUPABASE_URL  || "https://dtwqlvzlfvavabzbddnv.supabase.co/functions/v1";
const SUPABASE_KEY   = __ENV.SUPABASE_KEY  || "sb_publishable_6C4-FWVCeCzL1huO4IdcoA_whBLynh6";
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL   || "admin@example.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD|| "password";

// ── Custom metrics ──────────────────────────────────────────
const errorRate   = new Rate("errors");
const pageLoad    = new Trend("page_load_time",     true);
const apiResp     = new Trend("api_response_time",  true);
const dbQuery     = new Trend("db_query_time",      true);
const ttfb        = new Trend("time_to_first_byte", true);
const totalReqs   = new Counter("total_requests");

// ── Stages ──────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: "2m",  target: 50  },
    { duration: "5m",  target: 50  },
    { duration: "1m",  target: 200 },
    { duration: "5m",  target: 200 },
    { duration: "2m",  target: 350 },
    { duration: "5m",  target: 350 },
    { duration: "3m",  target: 50  },
    { duration: "2m",  target: 0   },
  ],

  thresholds: {
    // Supabase Edge Functions are globally distributed — stricter TTFB
    page_load_time:     ["p(95)<1000"],
    time_to_first_byte: ["p(95)<300"],
    api_response_time:  ["p(95)<600"],  // Edge fn cold start can add ~200ms
    db_query_time:      ["p(95)<500"],
    http_req_duration:  ["p(95)<1200", "p(99)<3000"],
    errors:             ["rate<0.05"],
  },
};

// ── Data pools ──────────────────────────────────────────────
const NAMES = [
  "Rohan Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta",
  "Rahul Singh",  "Ananya Verma", "Vikram Joshi", "Kavita Nair",
  "Arjun Reddy",  "Pooja Mehta", "Siddharth Rao", "Divya Iyer",
  "Karan Malhotra","Simran Kaur", "Nikhil Desai",  "Meera Pillai",
];
const CATEGORIES = ["Music", "Dancing", "Comedy & Mimicry", "Dialogue Delivery"];
const CITIES     = ["Mumbai","Delhi","Bangalore","Chennai","Kolkata","Hyderabad","Pune","Jaipur","Lucknow","Ahmedabad"];

const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
];

// Base headers for every Supabase Edge Function call
function apiHeaders(extra = {}) {
  return {
    "Content-Type":  "application/json",
    "Accept":        "application/json",
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

function browserHeaders() {
  return {
    "User-Agent":      randomItem(USER_AGENTS),
    "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
  };
}

// ── Validate + track ─────────────────────────────────────────
function validate(res, name, allowedStatuses = [200]) {
  totalReqs.add(1);
  const ok = check(res, {
    [`${name} — status ok`]:       (r) => allowedStatuses.includes(r.status),
    [`${name} — no server error`]: (r) => r.status < 500,
  });
  errorRate.add(!ok);
  return ok;
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 1 — Homepage (40%)
// ════════════════════════════════════════════════════════════
function homepageScenario() {
  group("Frontend — GET /", () => {
    const res = http.get(`${FRONTEND_URL}/`, { headers: browserHeaders() });
    pageLoad.add(res.timings.duration);
    ttfb.add(res.timings.waiting);
    validate(res, "Homepage");
    sleep(randomIntBetween(3, 8));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 2 — Checkout page view (20%)
// ════════════════════════════════════════════════════════════
function checkoutPageScenario() {
  group("Frontend — GET /checkout", () => {
    const res = http.get(`${FRONTEND_URL}/checkout`, { headers: browserHeaders() });
    pageLoad.add(res.timings.duration);
    ttfb.add(res.timings.waiting);
    validate(res, "Checkout page");
    sleep(randomIntBetween(5, 15));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 3 — Registration (20%)
//  POST /functions/v1/register — DB write
// ════════════════════════════════════════════════════════════
function registrationScenario() {
  const uid  = randomIntBetween(10000, 9999999);
  const name = randomItem(NAMES);
  const city = randomItem(CITIES);

  group("Edge Fn — POST /register", () => {
    const res = http.post(
      `${SUPABASE_URL}/register`,
      JSON.stringify({
        name:     `${name} ${uid}`,
        email:    `user${uid}@loadtest.dev`,
        phone:    `+91${randomIntBetween(7000000000, 9999999999)}`,
        address:  `${randomIntBetween(1, 999)} Test Nagar, ${city}`,
        category: randomItem(CATEGORIES),
        amount:   800,
      }),
      { headers: apiHeaders() }
    );
    dbQuery.add(res.timings.duration);
    validate(res, "Registration");
    sleep(randomIntBetween(1, 3));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 4 — Create Razorpay order (10%)
//  POST /functions/v1/create-order — DB write + Razorpay API
//  Each call hits Razorpay's API — keep VUs reasonable.
// ════════════════════════════════════════════════════════════
function createOrderScenario() {
  const uid = randomIntBetween(10000, 9999999);

  group("Edge Fn — POST /create-order", () => {
    const res = http.post(
      `${SUPABASE_URL}/create-order`,
      JSON.stringify({
        amount: 800,
        ticketData: {
          name:     `LoadTest ${uid}`,
          email:    `lt${uid}@example.com`,
          phone:    `+91${randomIntBetween(7000000000, 9999999999)}`,
          category: randomItem(CATEGORIES),
          address:  `${randomIntBetween(1, 999)} Stage Rd, ${randomItem(CITIES)}`,
        },
      }),
      { headers: apiHeaders() }
    );
    apiResp.add(res.timings.duration);
    totalReqs.add(1);

    // 5xx = our function crashed; Razorpay upstream errors are non-5xx
    check(res, { "Create order — fn alive": (r) => r.status < 500 });
    errorRate.add(res.status >= 500);
    sleep(randomIntBetween(2, 5));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 5 — Ticket lookup (5%)
//  GET /functions/v1/ticket?id=:uuid
//  Random UUIDs → 404 expected; only 5xx counts as error.
// ════════════════════════════════════════════════════════════
function ticketLookupScenario() {
  group("Edge Fn — GET /ticket", () => {
    const fakeId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });

    const res = http.get(
      `${SUPABASE_URL}/ticket?id=${fakeId}`,
      { headers: apiHeaders() }
    );
    dbQuery.add(res.timings.duration);
    totalReqs.add(1);

    check(res, { "Ticket lookup — no crash": (r) => r.status < 500 });
    errorRate.add(res.status >= 500);
    sleep(randomIntBetween(1, 2));
  });
}

// ════════════════════════════════════════════════════════════
//  SCENARIO 6 — Admin dashboard (5%)
//  POST /functions/v1/admin  (login)
//  GET  /functions/v1/admin/stats
//  GET  /functions/v1/admin/users
// ════════════════════════════════════════════════════════════
function adminScenario() {
  let token = "";

  group("Admin — POST /admin/login", () => {
    const res = http.post(
      `${SUPABASE_URL}/admin/login`,
      JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      { headers: apiHeaders() }
    );
    apiResp.add(res.timings.duration);
    validate(res, "Admin login");

    // Try JSON body token (Supabase Edge Fns typically return JSON, not cookies)
    try {
      const body = JSON.parse(res.body);
      token = body.token ?? body.access_token ?? "";
    } catch (_) {}

    // Also check Set-Cookie in case it uses cookie-based auth
    const setCookie = res.headers["Set-Cookie"] || "";
    const match = setCookie.match(/admin_token=([^;]+)/);
    if (match) token = match[1];

    sleep(randomIntBetween(1, 2));
  });

  if (!token) return;

  const authed = apiHeaders({ Cookie: `admin_token=${token}` });

  group("Admin — GET /admin/stats", () => {
    const res = http.get(`${SUPABASE_URL}/admin/stats`, { headers: authed });
    dbQuery.add(res.timings.duration);
    validate(res, "Admin stats");
    sleep(randomIntBetween(2, 4));
  });

  group("Admin — GET /admin/users", () => {
    const res = http.get(`${SUPABASE_URL}/admin/users`, { headers: authed });
    dbQuery.add(res.timings.duration);
    validate(res, "Admin users");
    sleep(randomIntBetween(1, 3));
  });
}

// ── Main: weighted scenario dispatch ────────────────────────
export default function () {
  const roll = Math.random();

  if      (roll < 0.40) homepageScenario();      // 40%
  else if (roll < 0.60) checkoutPageScenario();  // 20%
  else if (roll < 0.80) registrationScenario();  // 20%
  else if (roll < 0.90) createOrderScenario();   // 10%
  else if (roll < 0.95) ticketLookupScenario();  //  5%
  else                  adminScenario();          //  5%
}

// ── Summary ──────────────────────────────────────────────────
export function handleSummary(data) {
  const m = data.metrics;
  const pct = (key, p) => Math.round(m[key]?.values?.[p] ?? 0) + "ms";

  const summary = {
    timestamp:      new Date().toISOString(),
    frontend:       FRONTEND_URL,
    api:            SUPABASE_URL,
    peakVUs:        m.vus_max?.values?.value ?? 0,
    totalRequests:  m.total_requests?.values?.count ?? 0,
    errorRate:      ((m.errors?.values?.rate ?? 0) * 100).toFixed(2) + "%",

    http: {
      avg:  Math.round(m.http_req_duration?.values?.avg ?? 0) + "ms",
      p95:  pct("http_req_duration", "p(95)"),
      p99:  pct("http_req_duration", "p(99)"),
    },
    pageLoad: {
      p95:  pct("page_load_time", "p(95)"),
      ttfb: pct("time_to_first_byte", "p(95)"),
    },
    edgeFunctions: {
      p95Api: pct("api_response_time", "p(95)"),
      p95DB:  pct("db_query_time",     "p(95)"),
    },

    thresholds: Object.fromEntries(
      Object.entries(data.metrics)
        .filter(([, v]) => v.thresholds)
        .map(([k, v]) => [k, Object.values(v.thresholds).every(t => t.ok) ? "PASS" : "FAIL"])
    ),
  };

  console.log("\n═══ HUBOEVENTS LOAD TEST SUMMARY ═══");
  console.log(JSON.stringify(summary, null, 2));

  return {
    "results/huboevents-summary.json": JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}
