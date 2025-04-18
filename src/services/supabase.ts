import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl || 'not set');
console.log('Supabase Anon Key:', supabaseAnonKey ? '[REDACTED]' : 'not set');

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

// Hardcoded backup Supabase URL - use this if env vars aren't set
const BACKUP_SUPABASE_URL = 'https://osjckwqhmylepezowcmr.supabase.co';
const BACKUP_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zamNrd3FobXlsZXBlem93Y21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI2NTc5OTgsImV4cCI6MTk5ODIzMzk5OH0.sqwzMi3e3P-BUcpBMNugckJ9kBVjUegJ3R3A-9wksWc';

// Declare supabase client variable to be defined below
let supabaseClient: any;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Using backup values.');
  }
  
  // Create Supabase client with proper URL and key
  supabaseClient = createClient(
    supabaseUrl || BACKUP_SUPABASE_URL, 
    supabaseAnonKey || BACKUP_SUPABASE_KEY, 
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    }
  );
  
  console.log('Supabase client initialized successfully');
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
  console.log(`Fetching PDFs from bucket: ${STORAGE_BUCKET}, folder: ${PDF_FOLDER}`);
  
  try {
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .list(PDF_FOLDER);
      
    if (error) {
      console.error('Error fetching predefined PDFs:', error);
      return [];
    }
    
    console.log('Raw storage response:', data);
    
    // Filter for PDF files only
    const pdfFiles = data?.filter((file: SupabaseFile) => 
      file.name.toLowerCase().endsWith('.pdf')
    ) || [];
    
    console.log('Filtered PDF files:', pdfFiles);
    return pdfFiles;
  } catch (e) {
    console.error('Exception fetching PDFs:', e);
    return [];
  }
}

// Get public URL for a PDF
export async function getPdfUrl(path: string) {
  const fullPath = path.startsWith(PDF_FOLDER) ? path : `${PDF_FOLDER}/${path}`;
  console.log(`Getting public URL for: ${fullPath}`);
  
  try {
    const { data } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fullPath);
      
    console.log('Public URL data:', data);
    return data?.publicUrl || '';
  } catch (e) {
    console.error('Error getting public URL:', e);
    return '';
  }
}

export type Subscription = {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due';
  price_id: string;
  expires_at: string;
};