import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://grzoctcojogqicaifozy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7VfY7RAomemifDTbDQcFhQ_87WO14Ho';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
