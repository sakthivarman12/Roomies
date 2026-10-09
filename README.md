# Roomies — Live together. Split smarter.

A mobile-first roommate management app: shared expenses, rent & bills, settlements, chores, shopping list,
announcements and notifications — with a separate login for every roommate.

**It runs 100% locally.** No database, API keys or Supabase are needed. Data persists in your browser's
`localStorage`, behind a service/repository layer designed to be swapped for Supabase later.

## Features

- **Auth** – signup, login, logout, forgot/reset password, per-user accounts (OWNER / ADMIN / MEMBER)
- **Households** – create or join with an invite code (`RM-XXXXXX`), multi-household ready (switcher), edit details, house rules, documents
- **Expenses** – add / edit / delete, equal · percentage · custom splits (validated), receipt photo, search + category/person/date/status filters
- **Settlements** – settle up (UPI / Cash / Bank Transfer), payment requests, balances computed per roommate pair
- **Animated receipt** – thermal-printer style receipt with line-by-line reveal, stamp, barcode; save / print / share
- **Bills** – recurring bills, mark paid (auto-creates the expense + next month's bill), overdue / upcoming states
- **Chores** – assign, status flow (upcoming → in progress → completed / overdue), recurring **rotation** between roommates
- **House** – roommates (roles, balances, chores), shopping list (tick / swipe-to-delete), announcements (react + acknowledge)
- **Notifications**, **analytics** (category donut, monthly trend, contributions, outstanding balances), **transactions** history
- **Map** (bottom nav) – roommates' shared locations on an OpenStreetMap, with opt-in location sharing, a home marker and Instagram-style 24-hour updates/stories (photo or video, optional location pin). Updates can also be saved to the household Gallery. Media stays inside Roomies (images as data URLs, videos in IndexedDB) — never the phone's camera roll
- **Room fund** (Profile → Room fund) – a common pot everyone (including visiting friends) can chip into; pay expenses, bills and delivery orders from it so nobody owes anybody
- **House setup & joining** – when creating a house tick the shared costs (rent, Wi-Fi, drinking/sump/tank water, gas, maid, outside work) to create recurring bills. New people join with the invite code and wait on a *Waiting for approval* screen; the owner/admins get a notification, then approve them as **Roommate** or **Friend (visiting)** and toggle what they can see (fund, all expenses, adding expenses, locations). Access can be edited any time
- **Call & WhatsApp** buttons on every roommate (list and profile)
- **Gallery folders** – anyone can create folders, upload or take photos/videos into them, and move items between folders
- **Shopping** (Profile → Shopping) – browse groceries and food, build a basket for Zepto / Instamart / Blinkit / Amazon / Swiggy / Zomato, open the app to order, then record and split it (room fund or one payer). Prices and delivery times are sample data — these services have no public API
- **Pay back** via GPay / PhonePe / Paytm / UPI deep links (each person's UPI ID is in their profile); you confirm "Mark as paid" because a browser can't verify the payment
- **Analytics drill-down** – tap a donut slice, a month bar or a person's bar to see every record, totals by category and by person, and all-time history
- **Add (+) menu** – top-right on Home and Map: one dropdown for every "add" action (expense, settle up, update, chore, shopping item, event, photos/videos, bill, announcement, document, roommate)
- **Notifications** (Profile → Notifications) – synthesised tones with volume + vibration, an on-screen balloon-pop / confetti-blast / banner when the app is open, and device notification-panel alerts (service worker) when it is in the background; test button included
- **Permissions** – notifications, location and camera/mic requested during onboarding and from Profile → Permissions. (Browsers never grant blanket photo-library access or "draw over other apps"; files are picked per use)
- **Events** (Profile → Events) – plan house events with RSVP (going / maybe / can't) and notifications
- **Gallery** (Profile → Gallery) – shared photos; photos switched on as "Home background" fade slowly in random order inside the blue Home summary card. **Triple-tap the Gallery tab** to unlock/lock a private *Hidden* folder (only the uploader sees it; hidden photos never appear in the background)
- **App theme** (Profile → App theme) – dark (default) / light / system, 6 accent colours, glass intensity, app icon (also the favicon), icon stroke weight, navigation bar style (floating / docked / icons-only) and animation level (full / subtle / off); everything applies live and is saved per user
- **Profile & settings** – edit profile + photo, change password, notifications, reset demo data
- **Responsive** – bottom-nav mobile app; sidebar + right activity rail on desktop; glassmorphism UI, dark-by-default themes; reduced-motion support
- **PWA foundation** – manifest, icon, theme colour, mobile metadata

## Tech stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · Framer Motion · Lucide icons

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npm run lint
```

## Folder structure

```
app/
  (auth)/    welcome, login, signup, forgot, household (create/join), onboarding/*
  (app)/     home, expenses(+[id]), transactions, bills, chores, house, roommates/[id],
             notifications, analytics, profile      ← guarded by AppShell
components/  ui/ (design system) · dashboard/ · expenses/ · chores/ · room/ · sheets/ · auth/
hooks/       useApp, useAction, useGuard, useOnOpen
lib/
  services/    interfaces (types.ts) + local implementations — the ONLY layer UI calls to mutate data
  repository/  Repository interface + LocalRepository (localStorage)
  selectors.ts pure derived data (balances, transactions, analytics)
  permissions.ts role checks, enforced inside services (not just hidden buttons)
  mock/seed.ts demo data     supabase/ client placeholder + schema.sql (future)
store/       db.ts – external store (useSyncExternalStore) over the repository
types/       domain models (UUID ids, ISO timestamps, Supabase-friendly)
```

Architecture: `UI → hooks → services → repository → localStorage (now) | Supabase (later)`.

## Environment variables

Copy `.env.example` → `.env.local`. Both are optional and unused until Supabase is wired in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Mock data & security notes

- Seed: 1 household, 4 roommates, 20+ expenses over 5 months, 5 bills, 8 chores, payments, shopping, announcements, notifications (INR).
- Passwords are stored as a **mock hash** in localStorage — fine for a local prototype, never for production. Supabase Auth replaces it entirely.
- Every service call re-checks household membership/role (`lib/permissions.ts`); data is always filtered by the active household.

## Supabase migration plan

1. Add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `npm i @supabase/supabase-js`.
2. Run `lib/supabase/schema.sql` (tables, FKs, helper `is_household_member`, RLS starter policies) and finish the per-table write policies.
3. Implement the interfaces in `lib/services/types.ts` with Supabase (`AuthService` → Supabase Auth, others → tables/RPCs), then re-bind them in `lib/services/index.ts`.
4. Replace `LocalRepository` reads with Supabase queries + realtime subscriptions feeding `store/db.ts` (or query hooks).
5. Move invite handling to a secure RPC, receipts/documents to Supabase Storage, and payments to Razorpay/Stripe/UPI intents inside `paymentService.settle`.

Integration points: `lib/services/index.ts` (bindings), `lib/repository/index.ts`, `lib/supabase/client.ts`, `lib/permissions.ts` → RLS policies.

## Deploy

Any Node host works (Vercel recommended): `npm run build` then `npm start`, or import the repo into Vercel.
Without Supabase the app is still per-browser, so deploy only as a demo until the Supabase layer is added.

## Roadmap

Supabase auth + realtime sync · push notifications & offline caching (service worker) · real payment rails ·
receipt OCR · expense categories budgets · recurring-expense automation · multi-currency · email/WhatsApp invites.
