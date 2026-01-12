import { createClient } from '@supabase/supabase-js';

/**
 * Robust environment variable accessor for browser, Vite, and CI/CD environments.
 */
const getEnvVar = (key: string): string | undefined => {
  try {
    // 1. Try Vite/Standard ESM meta env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env[key]) return (import.meta as any).env[key];
    }
    
    // 2. Try Node-style process.env (often shimmed by bundlers or Netlify)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
    }

    // 3. Try direct window properties (manual injection or fallback)
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key];
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}:`, e);
  }
  return undefined;
};

// These are your default fallback values from the initial setup
const DEFAULT_URL = 'https://fubxlnumxxtxndknvuhd.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YnhsbnVteHh0eG5ka252dWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTQ1MTMsImV4cCI6MjA4MzQzMDUxM30.Czj1HYsnK4XtdESHYQJl4rW8PsjA0sXwlVbxvfQ-ZWY';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

if (supabaseUrl === DEFAULT_URL && !getEnvVar('VITE_SUPABASE_URL')) {
  console.info('Using default Supabase URL. Set VITE_SUPABASE_URL to override.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
