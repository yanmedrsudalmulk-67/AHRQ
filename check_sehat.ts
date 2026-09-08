import { getSupabaseClient, getSurveys, isSurveyResponse } from './lib/db';

async function run() {
  const allSehat = await getSurveys('rssehatabadi');
  console.log("IDs:", allSehat.map(s => s.id));
  console.log("Valid surveys:", allSehat.filter(isSurveyResponse).length);
}
run();
