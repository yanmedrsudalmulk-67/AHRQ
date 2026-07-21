import re

with open("components/AnalisaDataTab.tsx", "r") as f:
    content = f.read()

start_str = """                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Bar Chart of Average Safety Score (1-5) */}"""
                    
end_str = """                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? ("""

replacement = """                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="overflow-auto max-h-[75vh] border border-slate-200/60 rounded-xl relative shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[800px] font-sans">
                        <thead>
                          <tr className="bg-[#D8D4EC] text-slate-800 font-semibold uppercase tracking-wider text-[11px] md:text-xs">
                            <th rowSpan={2} className="sticky left-0 top-0 z-30 p-4 border-r border-b border-slate-300/60 w-[200px] min-w-[200px] bg-[#D8D4EC] align-bottom shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              Penilaian Keselamatan Pasien<br/>Unit/Area Kerja
                            </th>
                            <th rowSpan={2} className="sticky top-0 z-20 p-4 border-r border-b border-slate-300/60 text-center w-28 bg-[#D8D4EC] align-bottom">
                              Dataset
                            </th>
                            <th colSpan={positionSafetyScores.length} className="sticky top-0 z-20 p-3 text-center border-b border-slate-300/60 bg-[#D8D4EC] font-bold">
                              Posisi Staf
                            </th>
                          </tr>
                          <tr className="bg-[#E5E1F9] text-slate-800 font-semibold text-[11px] md:text-xs">
                            {positionSafetyScores.map((pos) => (
                              <th key={`hdr-${pos.name}`} className="sticky top-[45px] z-20 p-3 text-center border-r border-b border-slate-300/60 align-bottom min-w-[130px] w-[130px] bg-[#E5E1F9] leading-snug">
                                {pos.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80">
                          {/* Row 1: Your Hospital Respondents */}
                          <tr className="hover:bg-blue-50/5 transition-colors bg-white">
                            <td rowSpan={2} className="sticky left-0 z-10 bg-white p-3.5 border-r border-b border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-top">
                              <div className="flex flex-col gap-0.5 mt-1">
                                <span className="text-[11px] md:text-xs italic font-medium text-slate-700 text-right pr-2">Rumah Sakit Anda:</span>
                                <span className="text-[11px] md:text-xs italic font-semibold text-slate-900 text-right pr-2">Jumlah Responden</span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 text-[13px] bg-white">0</td>
                            {positionSafetyScores.map((pos) => (
                              <td key={`rsp-rs-${pos.name}`} className="p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] bg-white">
                                {pos.count}
                              </td>
                            ))}
                          </tr>
                          {/* Row 2: Pilot Test Respondents */}
                          <tr className="hover:bg-blue-50/5 transition-colors bg-slate-50/60">
                            <td className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 text-[13px] bg-slate-50">
                              {positionSafetyScores.reduce((acc, pos) => acc + (positionSafetyBenchmarks[pos.name]?.count || 0), 0).toLocaleString('id-ID')}
                            </td>
                            {positionSafetyScores.map((pos) => (
                              <td key={`rsp-bm-${pos.name}`} className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 last:border-r-0 text-[13px] bg-slate-50">
                                {(positionSafetyBenchmarks[pos.name]?.count || 0).toLocaleString('id-ID')}
                              </td>
                            ))}
                          </tr>

                          {/* Data Rows for each Rating Category */}
                          {[{label: 'Sangat Baik', key: 5}, {label: 'Baik', key: 4}, {label: 'Cukup', key: 3}, {label: 'Kurang', key: 2}, {label: 'Sangat Kurang', key: 1}].map((cat, catIdx) => (
                            <Fragment key={cat.label}>
                              <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                <td rowSpan={2} className={`sticky left-0 z-10 p-3.5 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-middle font-bold text-slate-800 text-[13px] md:text-sm ${catIdx % 2 === 0 ? 'bg-slate-100/90' : 'bg-white'}`}>
                                  {cat.label}
                                </td>
                                <td className={`p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                  Rumah Sakit Anda
                                </td>
                                {positionSafetyScores.map((pos) => {
                                  const pct = pos.count > 0 ? (pos.ratings[cat.key as 1|2|3|4|5] / pos.count) * 100 : 0;
                                  return (
                                    <td key={`val-rs-${cat.label}-${pos.name}`} className={`p-3 text-center text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                      {pos.count === 0 ? '-' : `${pct.toFixed(0)}%`}
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                <td className={`p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                  Rumah Sakit Uji Coba
                                </td>
                                {positionSafetyScores.map((pos) => {
                                  const bmVal = positionSafetyBenchmarks[pos.name] ? positionSafetyBenchmarks[pos.name][cat.label] : 0;
                                  return (
                                    <td key={`val-bm-${cat.label}-${pos.name}`} className={`p-3 text-center font-semibold text-slate-800 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                      {bmVal.toFixed(0)}%
                                    </td>
                                  );
                                })}
                              </tr>
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? ("""

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + content[end_idx + len(end_str):]
    with open("components/AnalisaDataTab.tsx", "w") as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print(f"Start found: {start_idx != -1}, End found: {end_idx != -1}")
