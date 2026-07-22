const fs = require('fs');

const file = 'components/AnalisaDataTab.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `              ) : positionSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Berdasarkan Posisi Staf ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dimension selector to filter items */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Dimensi Budaya Keselamatan:</label>
                      <select
                        value={selectedDimId}
                        onChange={(e) => setSelectedDimId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none cursor-pointer"
                      >
                        {Object.keys(DIMENSI_INFO).map(dimId => (
                          <option key={dimId} value={dimId}>
                            [{DIMENSI_INFO[dimId].kode}] {DIMENSI_INFO[dimId].nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">Daftar Pertanyaan &amp; Perbandingan Positif (% Setuju / Sangat Setuju)</h3>
                      <div className="divide-y divide-slate-100 space-y-4">
                        {positionItemScores.filter(item => item.dimId === selectedDimId).map(q => (
                          <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">{q.id}</span>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed">{q.text}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {demografiStats.posisiData.map(pos => {
                                const val = q[pos.name] || 0;
                                return (
                                  <div key={pos.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[120px]">{pos.name}</span>
                                      <span className="text-xs font-semibold text-slate-500 mt-0.5">{pos.value} Responden</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>`;

const replaceStr = `              ) : positionSubView === 'Perbandingan Hasil Per Item' ? (
                (() => {
                  const customOrder = ['d7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'];
                  
                  // Calculate averages for summary cards
                  const rsAvgRaw = perItemStats.reduce((acc, curr) => acc + curr.positive, 0) / (perItemStats.length || 1);
                  const rsAvg = parseFloat(rsAvgRaw.toFixed(1));
                  
                  const pilotScoresByDim: Record<string, number> = {};
                  customOrder.forEach(dId => {
                    const min = masterBenchmarkData && (masterBenchmarkData as any)[dId] ? (masterBenchmarkData as any)[dId].min : DIMENSI_INFO[dId].benchmarkMin;
                    const max = masterBenchmarkData && (masterBenchmarkData as any)[dId] ? (masterBenchmarkData as any)[dId].max : DIMENSI_INFO[dId].benchmarkMax;
                    pilotScoresByDim[dId] = parseFloat(((min + max) / 2).toFixed(1));
                  });
                  
                  let totalPilotSum = 0;
                  perItemStats.forEach(item => {
                    totalPilotSum += (pilotScoresByDim[item.dimId] || 60);
                  });
                  const pilotAvg = parseFloat((totalPilotSum / (perItemStats.length || 1)).toFixed(1));

                  return (
                    <div className="w-full flex flex-col gap-6 animate-fade-in">
                      <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Berdasarkan Posisi Staf ({tahun1})
                          </h2>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            Menampilkan perbandingan hasil kuesioner SOPS per butir pertanyaan.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                            <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5">
                          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText className="w-6 h-6" /></div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Total Item Survei</p>
                            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{perItemStats.length}</h4>
                          </div>
                        </div>
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5">
                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ClipboardCheck className="w-6 h-6" /></div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Rata-rata RS Anda</p>
                            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{rsAvg}%</h4>
                          </div>
                        </div>
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5">
                          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Award className="w-6 h-6" /></div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Rata-rata RS Percontohan</p>
                            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{pilotAvg}%</h4>
                          </div>
                        </div>
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5">
                          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Users className="w-6 h-6" /></div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Jumlah Responden</p>
                            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{demografiStats.total}</h4>
                          </div>
                        </div>
                      </div>

                      {/* Main Table Container */}
                      <div className="bg-white border border-slate-200 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="overflow-x-auto w-full font-['Poppins']">
                          <table className="w-full text-left border-collapse text-[13px] min-w-[800px]">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white font-bold tracking-wide">
                                <th className="p-4 w-12 text-center border-b border-blue-900/20">No</th>
                                <th className="p-4 w-64 border-b border-blue-900/20">Dimensi Budaya Keselamatan Pasien</th>
                                <th className="p-4 border-b border-blue-900/20">Pernyataan (Item Survei)</th>
                                <th className="p-4 w-36 text-center border-b border-blue-900/20">Rumah Sakit Anda</th>
                                <th className="p-4 w-40 text-center border-b border-blue-900/20">Rumah Sakit Percontohan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {customOrder.map(dId => {
                                const groupItems = perItemStats.filter(item => item.dimId === dId);
                                const dimInfo = DIMENSI_INFO[dId];
                                if (!groupItems.length || !dimInfo) return null;

                                return (
                                  <React.Fragment key={dId}>
                                    {/* Dimension Group Header */}
                                    <tr className="bg-slate-50/80">
                                      <td colSpan={5} className="p-3 pl-4 font-bold text-slate-800 border-y border-slate-200 text-sm">
                                        {dimInfo.nama}
                                      </td>
                                    </tr>
                                    
                                    {/* Items */}
                                    {groupItems.map((item) => {
                                      const pilotScore = pilotScoresByDim[dId];
                                      const rsScore = item.positive;
                                      
                                      let highlightClass = '';
                                      if (rsScore > pilotScore) {
                                        highlightClass = 'bg-emerald-50 text-emerald-800 font-bold';
                                      } else if (rsScore < pilotScore) {
                                        highlightClass = 'bg-rose-50 text-rose-800 font-bold';
                                      } else {
                                        highlightClass = 'bg-amber-50 text-amber-800 font-bold';
                                      }

                                      return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 text-center font-bold text-slate-400 align-top">{item.id}</td>
                                          <td className="p-4 text-[#374151] align-top text-xs leading-relaxed font-semibold">{dimInfo.nama}</td>
                                          <td className="p-4 text-[#374151] align-top leading-relaxed pr-8">
                                            {item.text}
                                          </td>
                                          <td className={"p-4 text-center align-middle transition-colors " + highlightClass}>
                                            {rsScore}%
                                          </td>
                                          <td className="p-4 text-center align-middle font-bold text-slate-600">
                                            {pilotScore}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Success");
} else {
  console.log("Target string not found!");
}
