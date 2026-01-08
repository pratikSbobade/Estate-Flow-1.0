
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fubxlnumxxtxndknvuhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YnhsbnVteHh0eG5ka252dWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTQ1MTMsImV4cCI6MjA4MzQzMDUxM30.Czj1HYsnK4XtdESHYQJl4rW8PsjA0sXwlVbxvfQ-ZWY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
