import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Authentication features will be disabled.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://fdzkziqmdtsdcgysxrbr.supabase.co', 
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkemt6aXFtZHRzZGNneXN4cmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDE1MDksImV4cCI6MjA4NzYxNzUwOX0.sbRaPe7vkOibr0i83RqlUQs_PIttrRfkTVv9ZD06kI0'
);
