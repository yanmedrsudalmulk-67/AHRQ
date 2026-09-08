import { getSupabaseClient } from './lib/db';

async function run() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('ahrq_surveys').select('*').limit(2000);
  if (data) {
    const rs = data.filter(d => {
       const str = JSON.stringify(d).toLowerCase();
       return str.includes('almulk') || str.includes('sehatabadi');
    });
    console.log("Total matched:", rs.length);
    console.log("IDs:", rs.map(r => r.id));
  }
}
run();
