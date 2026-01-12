import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://app.captainapp.co.uk';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
