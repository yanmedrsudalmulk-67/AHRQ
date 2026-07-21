import re

with open("components/AnalisaDataTab.tsx", "r") as f:
    content = f.read()

# We need to replace the table that was mistakenly put in unitSubView
# It starts at:
#                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
#                    <div className="overflow-auto max-h-[75vh] border border-slate-200/60 rounded-xl relative shadow-sm">

start_str = """                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="overflow-auto max-h-[75vh] border border-slate-200/60 rounded-xl relative shadow-sm">"""

end_str = """                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? ("""

replacement = """                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Bar Chart of Average Safety Score (1-5) */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Rata-Rata Skor Penilaian Keselamatan</h3>
                        <p className="text-slate-500 text-xs">Skor berkisar antara 1.00 (Buruk) hingga 5.00 (Luar Biasa).</p>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={unitSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 5]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                            <RechartsTooltip formatter={(val: any) => [val, 'Rata-rata Skor']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="average" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="average" position="right" fill="#be123c" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right: Percent Positive (Excellent/Very Good Rating 4-5) */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Respons Positif (Nilai &ge; 4)</h3>
                        <p className="text-slate-500 text-xs">Proporsi staf yang menilai keselamatan pasien di atas kategori Sangat Baik &amp; Luar Biasa.</p>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={unitSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Respons Positif']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="positiveRate" fill="#fb7185" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="positiveRate" position="right" formatter={(val: any) => `${val}%`} fill="#e11d48" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Table */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Tabel Komparasi Penilaian Keselamatan</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3">Posisi Staf / Jabatan</th>
                            <th className="p-3 text-center">Jumlah Responden</th>
                            <th className="p-3 text-center">Rata-Rata Skor</th>
                            <th className="p-3 text-center">Persentase Respons Positif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unitSafetyScores.map(row => (
                            <tr key={row.name} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-3 font-semibold text-slate-700">{row.name}</td>
                              <td className="p-3 text-center font-bold text-slate-500">{row.count}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-extrabold">
                                  {row.average} / 5.0
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md font-extrabold text-xs">
                                  {row.positiveRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? ("""

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + content[end_idx + len(end_str):]
    with open("components/AnalisaDataTab.tsx", "w") as f:
        f.write(new_content)
    print("Successfully restored unitSubView.")
else:
    print(f"Start found: {start_idx != -1}, End found: {end_idx != -1}")
