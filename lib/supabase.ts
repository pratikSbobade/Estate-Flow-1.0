
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Connection Credentials
 * Project: vkyfgxrwgrzcernmhbyk
 */
const supabaseUrl = 'https://vkyfgxrwgrzcernmhbyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreWZneHJ3Z3J6Y2Vybm1oYnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI3MTIsImV4cCI6MjA4NTM3ODcxMn0.fr43n2DiJliK7oVFlVJ2yNy2ySiSbU8RNY98MPnbPLU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
