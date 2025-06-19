import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (retries: number) => {
      return Math.min(1000 * Math.pow(2, retries), 30000);
    },
    logger: (level: string, message: string, details?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Supabase Realtime ${level}]:`, message, details);
      }
    },
    timeout: 10000,
  },
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'berally-chat@1.0.0',
    },
  },
}); 