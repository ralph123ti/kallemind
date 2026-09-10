import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdhypfeplqtsvdddshee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_99b6RzdDNp_K9cEXlS_giQ_OwvFx3Qt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,       // persists the session on-device between app launches
    autoRefreshToken: true,      // keeps the session alive without re-login
    persistSession: true,
    detectSessionInUrl: false,   // not relevant on native, avoids a warning
  },
});