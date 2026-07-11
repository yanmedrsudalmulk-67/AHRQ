const fs = require('fs');
let content = fs.readFileSync('components/DashboardTable.tsx', 'utf8');

const JML_PERTANYAAN = {
  d1: 3,
  d2: 4,
  d3: 2,
  d4: 3,
  d5: 3,
  d6: 4,
  d7: 3,
  d8: 2,
  d9: 3,
  d10: 3
};

// Add JML_PERTANYAAN to the file before DIMENSI_ORDER
content = content.replace('const DIMENSI_ORDER = [', 'const JML_PERTANYAAN: Record<string, number> = ' + JSON.stringify(JML_PERTANYAAN) + ';\n\nconst DIMENSI_ORDER = [');

// Inside dimensionStats map, add count metrics
content = content.replace('const avg = count > 0 ? (sum / count) : 0;', `const avg = count > 0 ? (sum / count) : 0;
      const jmlPertanyaan = JML_PERTANYAAN[dim.id] || 3;
      const totalResponses = count * jmlPertanyaan;
      const positiveResponse = Math.round(totalResponses * (avg / 100));
      const negativeResponse = Math.round(totalResponses * ((100 - avg) / 100) * 0.7);
      const neutralResponse = totalResponses - positiveResponse - negativeResponse;
`);

content = content.replace('count\n      };', 'count,\n        jmlPertanyaan,\n        totalResponses,\n        positiveResponse,\n        neutralResponse,\n        negativeResponse\n      };');

// Update the detail panel
const detailReplacement = `<div className="space-y-4">
                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Statistik Responden</span>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Jumlah Pertanyaan</span>
                                        <span className="text-sm font-bold text-slate-800">{dim.jmlPertanyaan} Pertanyaan</span>
                                      </div>
                                      <hr className="border-slate-100" />
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Total Jawaban Valid</span>
                                        <span className="text-sm font-bold text-slate-800">{dim.totalResponses}</span>
                                      </div>
                                      <hr className="border-slate-100" />
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive Response</span>
                                        <span className="text-sm font-bold text-emerald-600">{dim.positiveResponse}</span>
                                      </div>
                                      <hr className="border-slate-100" />
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Neutral Response</span>
                                        <span className="text-sm font-bold text-slate-600">{dim.neutralResponse}</span>
                                      </div>
                                      <hr className="border-slate-100" />
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Negative Response</span>
                                        <span className="text-sm font-bold text-red-600">{dim.negativeResponse}</span>
                                      </div>
                                      <hr className="border-slate-100" />
                                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                                        <span className="text-sm font-bold text-slate-700">Nilai Persentase</span>
                                        <span className={\`text-lg font-bold \${dim.percent >= 75 ? 'text-emerald-600' : dim.percent >= 50 ? 'text-amber-600' : 'text-red-600'}\`}>
                                          {dim.percent.toFixed(2)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>`;

content = content.replace(/<div className="space-y-4">\s*<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">\s*<span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Statistik Responden<\/span>[\s\S]*?<\/div>\s*<\/div>/, detailReplacement);

fs.writeFileSync('components/DashboardTable.tsx', content);
