import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Declare supabase client variable to be defined below
let supabaseClient: any;

// Type definition for Supabase storage file
type SupabaseFile = {
  id: string;
  name: string;
  bucket_id?: string;
  owner?: string;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
  size?: number;
};

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
        remove: async () => ({}),
        list: async () => ({ data: [], error: null })
      })
    }
  };
}

// Export the supabase client after it's properly initialized
export const supabase = supabaseClient;

// Constants for PDF storage
export const STORAGE_BUCKET = 'strategy-buddy';
export const PDF_FOLDER = 'predefined';

// Get all predefined PDFs from Supabase storage
export async function getPredefinedPdfs(): Promise<SupabaseFile[]> {
  const { data, error } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .list(PDF_FOLDER);
    
  if (error) {
    console.error('Error fetching predefined PDFs:', error);
    return [];
  }
  
  // Filter for PDF files only
  return data?.filter((file: SupabaseFile) => 
    file.name.toLowerCase().endsWith('.pdf')
  ) || [];
}

// Get public URL for a PDF
export async function getPdfUrl(path: string) {
  const fullPath = path.startsWith(PDF_FOLDER) ? path : `${PDF_FOLDER}/${path}`;
  
  const { data } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fullPath);
    
  return data?.publicUrl || '';
}

export type Subscription = {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due';
  price_id: string;
  expires_at: string;
};