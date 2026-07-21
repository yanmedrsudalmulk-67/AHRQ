import re

with open("components/AnalisaDataTab.tsx", "r") as f:
    content = f.read()

start_str = """              ) : positionSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Posisi Staf ({tahun1})
                    </h2>"""

end_str = """                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : ("""

replacement = """              ) : positionSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6 font-sans">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Posisi Staf ({tahun1})
                      </h2>
                      <p className="text-slate-500 text-xs">Menampilkan perbandingan distribusi penilaian keselamatan pasien berdasarkan posisi staf antara rumah sakit Anda dengan Rumah Sakit Uji Coba.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl">
                        <span className="text-xs font-extrabold text-slate-600 font-sans">Pilih Tahun:</span>
                        <select 
                          value={tahun1} 
                          onChange={e => setTahun1(e.target.value)} 
                          className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                        >
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
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
              ) : positionSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? (
                <div className="w-full flex flex-col gap-6 font-sans">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Peristiwa Yang Dilaporkan Berdasarkan Posisi Staf ({tahun1})
                      </h2>
                      <p className="text-slate-500 text-xs">Menampilkan perbandingan distribusi jumlah peristiwa keselamatan pasien yang dilaporkan berdasarkan posisi staf.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl">
                        <span className="text-xs font-extrabold text-slate-600 font-sans">Pilih Tahun:</span>
                        <select 
                          value={tahun1} 
                          onChange={e => setTahun1(e.target.value)} 
                          className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                        >
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="overflow-auto max-h-[75vh] border border-slate-200/60 rounded-xl relative shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[800px] font-sans">
                        <thead>
                          <tr className="bg-[#D8D4EC] text-slate-800 font-semibold uppercase tracking-wider text-[11px] md:text-xs">
                            <th rowSpan={2} className="sticky left-0 top-0 z-30 p-4 border-r border-b border-slate-300/60 w-[200px] min-w-[200px] bg-[#D8D4EC] align-bottom shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              Jumlah Peristiwa<br/>Yang Dilaporkan
                            </th>
                            <th rowSpan={2} className="sticky top-0 z-20 p-4 border-r border-b border-slate-300/60 text-center w-28 bg-[#D8D4EC] align-bottom">
                              Dataset
                            </th>
                            <th colSpan={filteredComputedTableData.length} className="sticky top-0 z-20 p-3 text-center border-b border-slate-300/60 bg-[#D8D4EC] font-bold">
                              Posisi Staf
                            </th>
                          </tr>
                          <tr className="bg-[#E5E1F9] text-slate-800 font-semibold text-[11px] md:text-xs">
                            {filteredComputedTableData.map((col, idx) => (
                              <th key={`hdr-ev-${idx}`} className="sticky top-[45px] z-20 p-3 text-center border-r border-b border-slate-300/60 align-bottom min-w-[130px] w-[130px] bg-[#E5E1F9] leading-snug">
                                {col.unit}
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
                            {filteredComputedTableData.map((col, idx) => (
                              <td key={`rsp-rs-ev-${idx}`} className="p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] bg-white">
                                {col.totalValid}
                              </td>
                            ))}
                          </tr>
                          {/* Row 2: Pilot Test Respondents */}
                          <tr className="hover:bg-blue-50/5 transition-colors bg-slate-50/60">
                            <td className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 text-[13px] bg-slate-50">
                              {filteredComputedTableData.reduce((acc, col) => acc + (col.benchmarkCount || 0), 0).toLocaleString('id-ID')}
                            </td>
                            {filteredComputedTableData.map((col, idx) => (
                              <td key={`rsp-bm-ev-${idx}`} className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 last:border-r-0 text-[13px] bg-slate-50">
                                {(col.benchmarkCount || 0).toLocaleString('id-ID')}
                              </td>
                            ))}
                          </tr>

                          {/* Data Rows for each Event Category */}
                          {['Tidak ada', '1 sampai 2', '3 sampai 5', '6 hingga 10', '11 atau lebih'].map((cat, catIdx) => (
                            <Fragment key={cat}>
                              <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                <td rowSpan={2} className={`sticky left-0 z-10 p-3.5 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-middle font-bold text-slate-800 text-[13px] md:text-sm ${catIdx % 2 === 0 ? 'bg-slate-100/90' : 'bg-white'}`}>
                                  {cat}
                                </td>
                                <td className={`p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                  Rumah Sakit Anda
                                </td>
                                {filteredComputedTableData.map((col, idx) => {
                                  const pct = col.percentages[cat] || 0;
                                  return (
                                    <td key={`val-rs-ev-${cat}-${idx}`} className={`p-3 text-center text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                      {col.totalValid === 0 ? '-' : `${pct.toFixed(0)}%`}
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                <td className={`p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                  Rumah Sakit Uji Coba
                                </td>
                                {filteredComputedTableData.map((col, idx) => {
                                  const bmVal = col.benchmark ? col.benchmark[cat] : 0;
                                  return (
                                    <td key={`val-bm-ev-${cat}-${idx}`} className={`p-3 text-center font-semibold text-slate-800 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                      {bmVal ? bmVal.toFixed(0) : 0}%
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
              ) : ("""

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + content[end_idx + len(end_str):]
    with open("components/AnalisaDataTab.tsx", "w") as f:
        f.write(new_content)
    print("Successfully replaced positionSubView table.")
else:
    print(f"Start found: {start_idx != -1}, End found: {end_idx != -1}")
