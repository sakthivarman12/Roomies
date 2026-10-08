# Supabase integration point

Roomies runs fully locally. When Supabase is ready:

1. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Implement the interfaces in `lib/services/types.ts` (AuthService, RoomService, ExpenseService, ...)
   using `getSupabaseClient()` from `./client.ts`.
3. Re-bind them in `lib/services/index.ts` (`authService = supabaseAuthService`, ...).
4. Replace `LocalRepository` in `lib/repository/index.ts` with a Supabase-backed `Repository`
   (or have the store hydrate from Supabase queries + realtime channels).
5. Apply the SQL in `lib/supabase/schema.sql` and enable RLS.

UI components never import storage or Supabase directly.
