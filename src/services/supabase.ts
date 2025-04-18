import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Declare supabase client variable to be defined below
let supabaseClient: any;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Using mock values.');
  }
  
  // Create Supabase client even if environment variables are missing - our auth bypass doesn't need them
  supabaseClient = createClient(
    supabaseUrl || 'https://example.com', 
    supabaseAnonKey || 'mock-key', 
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    }
  );
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client as fallback
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({})
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    }),
    storage: {
      from: () => ({
        upload: async () => ({}),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({})
      })
    }
  };
}

// Export the supabase client after it's properly initialized
export const supabase = supabaseClient;

export type Subscription = {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due';
  price_id: string;
  expires_at: string;
};