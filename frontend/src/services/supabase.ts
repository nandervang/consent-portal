import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Database operation failed');
}

// Helper function to get signed URL for PDF access
export async function getSignedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('pdf-documents')
    .createSignedUrl(path, expiresIn);

  if (error) {
    handleSupabaseError(error);
  }

  return data.signedUrl;
}