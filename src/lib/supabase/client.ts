import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role (for API routes)
let serverInstance: ReturnType<typeof createClient> | null = null;

export function getServerSupabaseClient() {
  if (serverInstance) return serverInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  serverInstance = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverInstance;
}

// Client-side Supabase client (for browser) - if needed later
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  clientInstance = createClient(url, anonKey);
  return clientInstance;
}
