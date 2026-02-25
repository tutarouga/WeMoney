import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqbmcndvkyayldybbava.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WS7yPz72TwtbAXFly9NpOQ_6Wl27k1H';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
