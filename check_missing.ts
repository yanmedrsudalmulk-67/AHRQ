import { getSupabaseClient } from './lib/db';

async function run() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from('ahrq_surveys').select('*').eq('id', 'srv_1785590067666');
  if (data && data.length > 0) {
    console.log(JSON.stringify(data[0], null, 2));
  }
}
run();
