import { getSupabaseClient } from './lib/db';

async function run() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("No supabase client");
    return;
  }
  const { data: accounts, error: err1 } = await supabase.from('hospital_accounts').select('*').in('username', ['rsudalmulk', 'rssehatabadi']);
  console.log("Accounts:", JSON.stringify(accounts, null, 2));

  const { data: surveys, error: err2 } = await supabase.from('ahrq_surveys').select('id, hospital_id, user_id, created_by, tanggal_input').limit(50);
  
  // Also check if there are surveys specifically for these accounts
  const { data: specificSurveys, error: err3 } = await supabase.from('ahrq_surveys').select('id, hospital_id, user_id, tanggal_input, created_by').or('user_id.eq.rsudalmulk,hospital_id.eq.rsudalmulk,user_id.eq.rssehatabadi,hospital_id.eq.rssehatabadi');
  console.log("Specific Surveys:", JSON.stringify(specificSurveys, null, 2));
}

run();
