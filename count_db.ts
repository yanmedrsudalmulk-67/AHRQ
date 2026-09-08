import { getSupabaseClient } from './lib/db';

async function run() {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase.from('ahrq_surveys').select('*', { count: 'exact', head: true });
  console.log("Total rows in DB:", count);
}

run();
