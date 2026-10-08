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

## Demo accounts

Shown on the login screen in development only. Password for all: `roomies123`

| Name   | Email                 | Role   |
| ------ | --------------------- | ------ |
| Sakthi | sakthi@roomies.local  | OWNER  |
| Devi   | devi@roomies.local    | MEMBER |
| Arun   | arun@roomies.local    | MEMBER |
| Rahul  | rahul@roomies.local   | MEMBER |

Household: **Green Villa** · invite code `RM-7X92KP`. *Profile → Reset demo data* restores the seed.

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
