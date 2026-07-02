import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdhypfeplqtsvdddshee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHlwZmVwbHF0c3ZkZGRzaGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODcyNjcsImV4cCI6MjA5ODI2MzI2N30.yiUaSGFBSokmx4EOEVaYVY72R-hG72EkTirmXVl8Ec8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);