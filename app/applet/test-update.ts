import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqbmcndvkyayldybbava.supabase.co';
const supabaseAnonKey = 'sb_publishable_WS7yPz72TwtbAXFly9NpOQ_6Wl27k1H';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: insertData, error: insertError } = await supabase.from('transactions').insert([
    {
      type: 'expense',
      amount: 10,
      category: 'test',
      description: 'test',
      date: new Date().toISOString().split('T')[0],
      is_recurring: false
    }
  ]).select();
  
  if (insertError) {
    console.error('Insert error:', insertError);
    return;
  }
  
  console.log('Inserted:', insertData);
  const id = insertData[0].id;
  
  const { data: updateData, error: updateError } = await supabase.from('transactions').update({ description: 'updated' }).eq('id', id).select();
  console.log('Updated:', updateData, updateError);
}

test();
