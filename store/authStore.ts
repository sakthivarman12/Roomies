import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserRow } from '../types/database';

interface AuthState {
  session: Session | null;
  profile: UserRow | null;
  initializing: boolean;
  hasRoom: boolean | null; // null = unknown/loading
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserRow | null) => void;
  setInitializing: (v: boolean) => void;
  setHasRoom: (v: boolean | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  initializing: true,
  hasRoom: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
  setHasRoom: (hasRoom) => set({ hasRoom }),
}));
