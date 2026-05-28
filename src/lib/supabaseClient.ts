
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string | undefined): url is string => {
  try {
    if (!url) return false;
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
  const errorMsg = '🚨 [BRN Suite] Supabase URL or Anon Key is missing or invalid. Check your .env.local file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
