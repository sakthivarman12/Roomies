import { getSupabaseClient } from "@/lib/supabase/client";

/** Supabase Auth calls used by the login and signup pages. Callers check isSupabaseConfigured() first. */

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return supabase;
}

export async function remoteSignIn(email: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
}

export async function remoteSignUp(input: { name: string; email: string; phone: string; password: string }): Promise<void> {
  const { data, error } = await client().auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { name: input.name.trim(), phone: input.phone.trim() } },
  });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Account created. Confirm your email in Supabase, then log in.");
}

export async function remoteSignOut(): Promise<void> {
  await getSupabaseClient()?.auth.signOut();
}
