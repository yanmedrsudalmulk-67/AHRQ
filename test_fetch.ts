import { getSupabaseClient, getSurveys } from './lib/db';

async function run() {
  const all = await getSurveys('rsudalmulk');
  console.log("Returned for rsudalmulk:", all.length);
  console.log("Surveys:", all.map(s => s.id));
  
  const allSehat = await getSurveys('rssehatabadi');
  console.log("Returned for rssehatabadi:", allSehat.length);
}
run();
