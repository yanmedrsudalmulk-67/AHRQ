import re

with open("components/AnalisaDataTab.tsx", "r") as f:
    content = f.read()

# 1. Extract the new table block and remove the branch I added
branch_start = """              ) : positionSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? (
                <div className="w-full flex flex-col gap-6 font-sans">
                  {/* Selector and Header */}"""

branch_end = """                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : ("""

# Find exactly where it is
start_idx = content.find(branch_start)
end_idx = content.find(branch_end)

if start_idx == -1 or end_idx == -1:
    print("Could not find the new branch to extract!")
    exit(1)

# Extract the new table (the inner part, not the whole branch)
# Actually, I'll just hardcode the new table here to be safe and clear.

new_table = """                  {/* Main Table Card (New AHRQ SOPS Design) */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 font-sans">Tabel Distribusi Frekuensi Pelaporan Peristiwa</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Menunjukkan perbandingan persentase jumlah laporan yang diserahkan dalam 12 bulan terakhir berdasarkan posisi staf
                        </p>
                      </div>
                      
                      {/* Search and Pagination Navigation */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-60">
                          <input 
                            type="text"
                            placeholder="Cari posisi staf..."
                            value={searchPositionQuery}
                            onChange={e => setSearchPositionQuery(e.target.value)}
                            className="bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer w-full transition-all"
                          />
                          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {totalPagesPosition > 1 && (
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                            <button 
                              onClick={() => setCurrentPagePosition(p => Math.max(1, p - 1))}
                              disabled={currentPagePosition === 1}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
                            >
                              Prev
                            </button>
                            <span className="text-[10px] font-black text-slate-500 px-2">
                              {currentPagePosition} / {totalPagesPosition}
                            </span>
                            <button 
                              onClick={() => setCurrentPagePosition(p => Math.min(totalPagesPosition, p + 1))}
                              disabled={currentPagePosition === totalPagesPosition}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

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
                            <th colSpan={paginatedComputedTableData.length} className="sticky top-0 z-20 p-3 text-center border-b border-slate-300/60 bg-[#D8D4EC] font-bold">
                              Posisi Staf
                            </th>
                          </tr>
                          <tr className="bg-[#E5E1F9] text-slate-800 font-semibold text-[11px] md:text-xs">
                            {paginatedComputedTableData.map((col, idx) => (
                              <th key={`hdr-ev-${idx}`} className="sticky top-[45px] z-20 p-3 text-center border-r border-b border-slate-300/60 align-bottom min-w-[130px] w-[130px] bg-[#E5E1F9] leading-snug">
                                {col.name}
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
                            {paginatedComputedTableData.map((col, idx) => (
                              <td key={`rsp-rs-ev-${idx}`} className="p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] bg-white">
                                {col.totalValid}
                              </td>
                            ))}
                          </tr>
                          {/* Row 2: Pilot Test Respondents */}
                          <tr className="hover:bg-blue-50/5 transition-colors bg-slate-50/60">
                            <td className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 text-[13px] bg-slate-50">
                              {paginatedComputedTableData.reduce((acc, col) => acc + (col.benchmarkCount || 0), 0).toLocaleString('id-ID')}
                            </td>
                            {paginatedComputedTableData.map((col, idx) => (
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
                                {paginatedComputedTableData.map((col, idx) => {
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
                                {paginatedComputedTableData.map((col, idx) => {
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
                    {/* Empty State when search returns no columns */}
                    {paginatedComputedTableData.length === 0 && (
                      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-700">Tidak Ada Posisi Staf</h4>
                        <p className="text-xs text-slate-400 mt-1">Tidak ada posisi staf yang cocok dengan kueri pencarian &ldquo;{searchPositionQuery}&rdquo;</p>
                      </div>
                    )}
                  </div>"""

# Remove the branch
content_without_branch = content[:start_idx] + content[end_idx + len(branch_end) - 6:] # Keep the `) : (` 

# Now find the OLD table in the fallback block
old_table_start = """                  {/* Main Table Card */}
                  <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 space-y-6 overflow-hidden">"""
old_table_end = """                    )}
                  </div>"""

old_start_idx = content_without_branch.find(old_table_start)
old_end_idx = content_without_branch.find(old_table_end, old_start_idx)

if old_start_idx != -1 and old_end_idx != -1:
    final_content = content_without_branch[:old_start_idx] + new_table + content_without_branch[old_end_idx + len(old_table_end):]
    with open("components/AnalisaDataTab.tsx", "w") as f:
        f.write(final_content)
    print("Successfully updated fallback table.")
else:
    print(f"Old table start found: {old_start_idx != -1}, Old table end found: {old_end_idx != -1}")
