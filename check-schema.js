import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqbmcndvkyayldybbava.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WS7yPz72TwtbAXFly9NpOQ_6Wl27k1H';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').update({ settings: {} }).eq('id', 'dummy');
  console.log('Update:', data, error);
}

checkSchema();
