const fs = require('fs');

let code = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

const targetStr = `                        const qStats = questions.map(q => {
                          const stat = calculateQuestionStats(q);
                          const stat2 = mode === 'Perbandingan' ? calculateQuestionStats(q, hospitalSurveys2) : null;
                          sumPosPercent += stat.posPercent;
                          if (stat2) sumPosPercent2 += stat2.posPercent;
                          return { q, stat, stat2 };
                        });`;

const replacementStr = `                        const qStats = questions.map(q => {
                          const stat = calculateQuestionStats(q);
                          const stat2 = mode === 'Perbandingan' ? calculateQuestionStats(q, hospitalSurveys2) : null;
                          const bmStat = calculateQuestionStats(q, activeBenchmarkSurveys.length > 0 ? activeBenchmarkSurveys : undefined);
                          sumPosPercent += stat.posPercent;
                          if (stat2) sumPosPercent2 += stat2.posPercent;
                          return { q, stat, stat2, bmStat };
                        });`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('components/AnalisaDataTab.tsx', code, 'utf8');
  console.log('SUCCESS PART 1 (qStats)');
} else {
  console.log('Target string for qStats not found!');
}
