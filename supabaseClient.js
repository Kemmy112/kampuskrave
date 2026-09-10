import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase env vars. Check that .env has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, and restart the dev server.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);