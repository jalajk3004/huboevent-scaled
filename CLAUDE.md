# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo with two independent apps:

- `client/` — Next.js 16 frontend (React 19, TypeScript, Tailwind CSS)
- `server/` — Express + TypeScript REST API backend

## Commands

### Client (`cd client/`)
```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build (static export via `next build`)
npm run lint      # Run ESLint
```

### Server (`cd server/`)
```bash
npm run dev       # Start with tsx watch (hot reload) on port 5000
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled output
```

## Architecture

### Payment Flow
The core feature is event ticket purchases via Paytm:
1. Client POSTs to `POST /api/create-order` → server creates a pending `registrations` row in Supabase and gets a Paytm `txnToken`
2. Client loads the Paytm CheckoutJS SDK dynamically and invokes the payment modal
3. After payment, Paytm form-POSTs to `POST /api/verify-payment` on the **Express server** (not Next.js)
4. Server verifies via `paytmService.verifyOrderStatus()`, updates `registrations` and inserts into `payments` in Supabase, sends a WhatsApp ticket via Meta Business API, then redirects to `{FRONTEND_URL}/checkout?payment=success|failed`

### Database (PostgreSQL + Prisma)
Self-hosted PostgreSQL on EC2, accessed via Prisma ORM. Schema lives in `server/prisma/schema.prisma`.

Two models:
- `Registration` (`registrations`) — one row per ticket purchase attempt; `status` cycles through `initiated → paid | failed`
- `Payment` (`payments`) — one row per confirmed Paytm transaction, linked via `registration_id` FK

Prisma client singleton is at `server/src/services/prismaService.ts`. After schema changes run:
```bash
npx prisma migrate dev   # apply migration and regenerate client
npx prisma generate      # regenerate client only (no migration)
```

### Admin Panel (`client/src/app/admin/page.tsx`)
Protected by JWT stored in an HTTP-only `admin_token` cookie. The server validates credentials from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars — there is no user table for admin accounts.

### Frontend Pages
- `/` (`src/app/page.tsx`) — Landing page with scroll-based video hero, About, Upcoming Shows, and Contact sections
- `/checkout` (`src/app/checkout/page.tsx`) — Ticket purchase form; integrates Paytm CheckoutJS via dynamic script injection
- `/admin` (`src/app/admin/page.tsx`) — Admin dashboard (stats, user list, resend tickets)

### Notifications
- WhatsApp: `server/src/services/whatsappService.ts` sends via Meta Graph API v22.0 using a pre-approved template named `ticket_confirmation`
- The `sendWhatsAppTicket` call in `verifyPayment` is fire-and-forget (non-blocking `.catch()`)

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@<EC2-HOST>:5432/dbname
PAYTM_MID=
PAYTM_MERCHANT_KEY=
PAYTM_WEBSITE=DEFAULT
PAYTM_HOST=https://securestage.paytmpayments.com
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

- The Paytm `verify-payment` callback URL must point to the **Express server** (not the Next.js app), because Paytm sends a form POST that needs to redirect to the frontend after processing. The client handles the redirect result via `?payment=success|failed` query params.
- CORS is configured on the Express server to allow credentials from `FRONTEND_URL` — this is required for the `admin_token` cookie to work cross-origin in development.
- The `client/src/components/ui/water-wave/index.d.ts` is a type stub for the `jquery.ripples` plugin used in the contact section.
