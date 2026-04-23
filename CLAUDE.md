# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Monorepo with two independent apps:

- `client/` — Next.js 16 frontend (React 19, TypeScript, Tailwind CSS)
- `server/` — Express + TypeScript REST API backend

## Commands

### Client (`cd client/`)
```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build
npm run lint      # Run ESLint
```

### Server (`cd server/`)
```bash
npm run dev           # Start with tsx watch (hot reload) on port 5000
npm run build         # Compile TypeScript to dist/
npm start             # Run compiled output (single process)
npm run start:cluster # Run compiled output with Node cluster (multi-process)
npm run deploy        # build + pm2:start (production)
```

PM2 commands: `pm2:start`, `pm2:stop`, `pm2:reload`, `pm2:restart`, `pm2:logs`, `pm2:status`

### Database (Prisma, run from `server/`)
```bash
npx prisma migrate dev   # Apply migration and regenerate client
npx prisma generate      # Regenerate client only (no migration)
```

## Architecture

### Payment Flow (Razorpay)
1. Client POSTs `{ amount, ticketData }` to `POST /api/create-order` → server creates Razorpay order and a `registrations` row with `status: 'initiated'`
2. Server returns `{ orderId, key, amount }` → client dynamically loads Razorpay CheckoutJS SDK and opens the payment modal
3. On modal success, Razorpay calls the `handler` callback with `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` — the **client** then POSTs these to `POST /api/verify-payment`
4. Server verifies HMAC signature, creates a `payments` row, updates `registrations.status` to `paid`, sends a WhatsApp ticket (fire-and-forget), and returns `{ success: true }`
5. Razorpay also sends a server-to-server `POST /api/webhook` on `payment.captured` as a fallback — this uses raw body (`express.raw`) for signature verification

### API Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/create-order` | — | Create Razorpay order + registration row |
| POST | `/api/verify-payment` | — | Verify client-side Razorpay payment |
| POST | `/api/webhook` | — | Razorpay server-to-server webhook (raw body) |
| POST | `/api/register` | — | Standalone registration (no payment) |
| GET | `/api/ticket/:id` | — | Fetch ticket by ID |
| POST | `/api/admin/login` | — | Admin login → sets `admin_token` cookie |
| POST | `/api/admin/logout` | — | Clear admin cookie |
| GET | `/api/admin/stats` | JWT cookie | Aggregate stats |
| GET | `/api/admin/users` | JWT cookie | List registrations |
| POST | `/api/admin/resend-ticket` | JWT cookie | Resend WhatsApp ticket |

### Database (PostgreSQL + Prisma)
Self-hosted PostgreSQL on EC2, accessed via Prisma ORM. Schema: `server/prisma/schema.prisma`. Prisma client singleton: `server/src/services/prismaService.ts`.

Two models:
- `Registration` (`registrations`) — one row per purchase attempt; `status` cycles `initiated → paid | failed`. Fields `paytm_order_id` and `paytm_payment_id` are **legacy names** that now store Razorpay order/payment IDs.
- `Payment` (`payments`) — one row per confirmed transaction, linked via `registration_id` FK. Also uses legacy `paytm_*` field names for Razorpay values.
- `ticket_id` is generated at order creation as `HB-<random8>` and is the permanent friendly ticket identifier.

### Production Server
The server can run as a single process (`npm start`) or via Node's built-in cluster module (`npm run start:cluster` / `src/cluster.ts`) which spawns one worker per CPU. PM2 manages the cluster in production. The cluster auto-restarts crashed workers and forwards SIGTERM/SIGINT gracefully.

### Admin Panel
Protected by JWT stored in an HTTP-only `admin_token` cookie. Server validates against `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars — no user table.

### Notifications
WhatsApp via Meta Graph API v22.0 (`server/src/services/whatsappService.ts`), using pre-approved template `ticket_confirmation`. Called fire-and-forget (non-blocking `.catch()`) after payment verification and webhook.

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@<EC2-HOST>:5432/dbname
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
META_WA_ACCESS_TOKEN=
META_WA_PHONE_NUMBER_ID=
```

### Client (`client/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Key Architectural Notes

- The Razorpay webhook (`POST /api/webhook`) requires the raw request body for HMAC verification — `app.use('/api/webhook', express.raw(...))` must be registered **before** `express.json()` in `app.ts`.
- CORS is configured in `app.ts` to allow the production domains plus `localhost:3000`. Add new frontend origins there, not via env vars.
- `client/src/components/ui/water-wave/index.d.ts` is a type stub for the `jquery.ripples` plugin used in the contact section.
- The ticket amount is hardcoded to ₹800 in `client/src/app/checkout/page.tsx` — change it there when pricing changes.
