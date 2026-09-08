import { getSupabaseClient } from './lib/db';

async function run() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: surveys, error } = await supabase.from('ahrq_surveys').select('*');
  if (error) console.error(error);
  
  if (surveys) {
    console.log("Total surveys:", surveys.length);
    const almulk = surveys.filter(s => {
      const dim = typeof s.dimensi_scores === 'string' ? JSON.parse(s.dimensi_scores) : s.dimensi_scores || {};
      const str = JSON.stringify(s).toLowerCase();
      return str.includes('almulk') || str.includes('al-mulk') || str.includes('sehatabadi') || str.includes('sehat abadi');
    });
    console.log("Found for rsudalmulk / rssehatabadi:", almulk.length);
    if (almulk.length > 0) {
      console.log("Sample:", JSON.stringify(almulk[0], null, 2));
      const config = almulk.filter(a => a.id.startsWith('LINK_CONFIG'));
      console.log("Configs found:", config.length);
      console.log("Sample Config:", JSON.stringify(config[0], null, 2));
    }
  }
}

run();
