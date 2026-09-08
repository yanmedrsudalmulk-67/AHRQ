import { getSurveys } from './lib/db';

async function run() {
  const all = await getSurveys();
  console.log("Total getSurveys returned:", all.length);
}
run();
