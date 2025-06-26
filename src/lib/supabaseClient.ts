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

/**
 * Validates that the user is properly authenticated and has a valid session
 * @param user - The user object from useUser hook
 * @returns Promise<{isValid: boolean, error?: string}>
 */
export const validateUserAuth = async (user: any): Promise<{isValid: boolean, error?: string}> => {
  if (!user) {
    return { isValid: false, error: 'No user found - please log in' };
  }

  try {
    // Get current session to ensure it's valid
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { isValid: false, error: 'Authentication error - please refresh and try again' };
    }
    
    if (!session) {
      return { isValid: false, error: 'No active session - please log in again' };
    }
    
    // Verify the user ID matches the session
    if (session.user.id !== user.id) {
      return { isValid: false, error: 'Session mismatch - please refresh and try again' };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { isValid: false, error: 'Authentication validation failed' };
  }
}; 