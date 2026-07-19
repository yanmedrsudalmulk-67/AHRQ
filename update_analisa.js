const fs = require('fs');

const content = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

const updatedContent = `'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Users, 
  Clock, 
  Activity, 
  Brain, 
  Hospital, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  Award,
  BarChart,
  ListChecks,
  HeartPulse,
  AlertTriangle,
  BarChart2
} from 'lucide-react';
import { computeDimensionScores } from '../lib/scoring';

interface SurveyData { id: string; namaRs: string; unitKerja: string; jumlahResponden: number; tanggalInput: string; dimensiScores: { [key: string]: any }; }

interface AnalisaDataTabProps {
  surveys: SurveyData[];
  role: 'rs' | 'admin';
  identifier: string;
  namaRs: string;
  hospitalId: string;
}

function extractYear(tanggalStr?: string): string {
  if (!tanggalStr) return new Date().getFullYear().toString();
  const match = tanggalStr.match(/\\b(20\\d{2}|19\\d{2})\\b/);
  if (match) return match[1];
  const partsBySpace = tanggalStr.trim().split(/\\s+/);
  const lastPart = partsBySpace[partsBySpace.length - 1];
  if (lastPart && !isNaN(Number(lastPart)) && lastPart.length === 4) return lastPart;
  const partsByDash = tanggalStr.split('-');
  if (partsByDash[0] && !isNaN(Number(partsByDash[0])) && partsByDash[0].length === 4) return partsByDash[0];
  return new Date().getFullYear().toString();
}

export default function AnalisaDataTab({ surveys, role, identifier, namaRs, hospitalId }: AnalisaDataTabProps) {
  const [activeView, setActiveView] = useState<'main' | 'hospital' | 'unit' | 'position' | 'tenure' | 'interaction' | 'benchmark'>('main');
  const [benchmarkSubView, setBenchmarkSubView] = useState<string | null>(null);

  const [mode, setMode] = useState<'Tunggal' | 'Perbandingan'>('Tunggal');
  
  const actualSurveys = useMemo(() => surveys.filter(s => s.id !== 'MASTER_BENCHMARK'), [surveys]);
  const actualDataYears = useMemo(() => {
    const years = new Set<string>();
    actualSurveys.forEach(s => years.add(extractYear(s.tanggalInput)));
    years.add('2024');
    years.add('2025');
    years.add('2026');
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [actualSurveys]);

  const currentYear = new Date().getFullYear().toString();
  const [tahun1, setTahun1] = useState<string>(actualDataYears[0] || currentYear);
  const [tahun2, setTahun2] = useState<string>(actualDataYears[1] || actualDataYears[0] || currentYear);

  const masterBenchmarkData = useMemo(() => {
    const mb = surveys.find(s => s.id === 'MASTER_BENCHMARK');
    return mb ? (mb.dimensiScores as any) : undefined;
  }, [surveys]);

  const dataTahun1 = useMemo(() => computeDimensionScores(actualSurveys.filter(s => extractYear(s.tanggalInput) === tahun1), masterBenchmarkData), [actualSurveys, tahun1, masterBenchmarkData]);
  const dataTahun2 = useMemo(() => computeDimensionScores(actualSurveys.filter(s => extractYear(s.tanggalInput) === tahun2), masterBenchmarkData), [actualSurveys, tahun2, masterBenchmarkData]);

  const combinedData = useMemo(() => {
    return dataTahun1.map((d1, i) => {
      const d2 = dataTahun2[i];
      return {
        dimensiSingkat: d1.nama,
        kode: d1.kode,
        'Capaian': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 1': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 2': parseFloat(d2 ? d2.percentage.toFixed(2) : '0'),
        'BenchmarkMin': d1.benchmarkMin,
        'BenchmarkMax': d1.benchmarkMax,
        id: d1.id, d1, d2
      };
    });
  }, [dataTahun1, dataTahun2]);

  const allSelectableYears = useMemo(() => {
    const years = new Set([...actualDataYears, '2024', '2025', '2026']);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [actualDataYears]);

  const mainCards = [
    {
      id: 'hospital',
      title: 'Hasil Survei Budaya Keselamatan Rumah Sakit Anda',
      description: 'Menampilkan seluruh hasil analisis berdasarkan data keseluruhan Rumah Sakit secara agregat.',
      icon: <Hospital className="w-8 h-8 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600',
      dataCount: surveys.length
    },
    {
      id: 'unit',
      title: 'Hasil Survei Berdasarkan Unit Kerja',
      description: 'Analisis komparatif budaya keselamatan antar unit / area kerja di rumah sakit.',
      icon: <Building className="w-8 h-8 text-teal-600" />,
      color: 'from-teal-500 to-emerald-600',
      dataCount: new Set(surveys.map(s => s.unitKerja)).size
    },
    {
      id: 'position',
      title: 'Hasil Survei Berdasarkan Posisi / Jabatan',
      description: 'Eksplorasi persepsi budaya keselamatan berdasarkan peran dan posisi staf.',
      icon: <Users className="w-8 h-8 text-purple-600" />,
      color: 'from-purple-500 to-fuchsia-600',
      dataCount: new Set(surveys.map(s => (s.dimensiScores as any)?._rawAnswers?.posisiStaf)).size
    },
    {
      id: 'tenure',
      title: 'Hasil Survei Berdasarkan Masa Kerja',
      description: 'Analisis tren budaya keselamatan dikaitkan dengan pengalaman masa kerja staf.',
      icon: <Clock className="w-8 h-8 text-amber-600" />,
      color: 'from-amber-500 to-orange-600',
      dataCount: new Set(surveys.map(s => (s.dimensiScores as any)?._rawAnswers?.lamaBekerjaRs)).size
    },
    {
      id: 'interaction',
      title: 'Hasil Survei Berdasarkan Interaksi Pasien',
      description: 'Korelasi budaya keselamatan dengan tingkat interaksi langsung staf dengan pasien.',
      icon: <Activity className="w-8 h-8 text-rose-600" />,
      color: 'from-rose-500 to-red-600',
      dataCount: new Set(surveys.map(s => (s.dimensiScores as any)?._rawAnswers?.interaksiPasien)).size
    },
    {
      id: 'benchmark',
      title: 'Hasil Perbandingan Dengan Rumah Sakit Percontohan',
      description: 'Analisis komparatif hasil survei dengan rumah sakit percontohan.',
      icon: <Award className="w-8 h-8 text-indigo-600" />,
      color: 'from-indigo-500 to-blue-700',
      dataCount: 4 // Special case
    }
  ];

  return (
    <div className="h-full w-full bg-slate-50 overflow-y-auto p-4 md:p-8 font-sans">
      <AnimatePresence mode="wait">
        {activeView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800 tracking-tight mb-3">
                Analisa Data
              </h1>
              <p className="text-slate-600 text-[15px] font-medium leading-relaxed max-w-4xl">
                Analisis komprehensif hasil Survei Budaya Keselamatan Pasien AHRQ SOPS 2.0 secara interaktif, realtime, dan terintegrasi dengan seluruh data survei.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col cursor-pointer group"
                  onClick={() => { setActiveView(card.id as any); setBenchmarkSubView(null); }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      {card.icon}
                    </div>
                    {card.id !== 'benchmark' && (
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-blue-100">
                        {card.dataCount} Kategori
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
                    {card.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm mb-6 flex-1 font-medium leading-relaxed">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-bold text-sm mt-auto group-hover:translate-x-1 transition-transform">
                    Lihat Analisa
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView !== 'main' && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto min-h-[600px] flex flex-col"
          >
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => benchmarkSubView ? setBenchmarkSubView(null) : setActiveView('main')}
                className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {benchmarkSubView || mainCards.find(c => c.id === activeView)?.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  {benchmarkSubView ? 'Detail Analisis' : mainCards.find(c => c.id === activeView)?.description}
                </p>
              </div>
            </div>

            {activeView === 'benchmark' ? (
              !benchmarkSubView ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                  {[
                    { title: 'Perbandingan Pengukuran Dimensi', icon: <BarChart className="w-8 h-8 text-indigo-600" /> },
                    { title: 'Perbandingan Hasil Per Item', icon: <ListChecks className="w-8 h-8 text-teal-600" /> },
                    { title: 'Perbandingan Penilaian Keselamatan Pasien', icon: <HeartPulse className="w-8 h-8 text-rose-600" /> },
                    { title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', icon: <AlertTriangle className="w-8 h-8 text-amber-600" /> },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      onClick={() => setBenchmarkSubView(item.title)}
                      className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col cursor-pointer items-center text-center group"
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {item.title === 'Perbandingan Pengukuran Dimensi' ? 'Lihat perbandingan agregat dimensi.' : 'Modul Sedang Dalam Pengembangan'}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : benchmarkSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Mode Selector and Filters */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setMode('Tunggal')}
                        className={\`px-4 py-2 rounded-lg text-sm font-bold transition-all \${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                      >
                        Periode Tunggal
                      </button>
                      <button 
                        onClick={() => setMode('Perbandingan')}
                        className={\`px-4 py-2 rounded-lg text-sm font-bold transition-all \${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                      >
                        Perbandingan (2 Periode)
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {mode === 'Tunggal' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Bandingkan:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <span className="text-slate-400 font-bold">VS</span>
                          <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-[24px] shadow-lg shadow-blue-500/5">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-teal-600" />
                      Hasil Perbandingan Pengukuran Dimensi Untuk {namaRs}
                    </h3>
                    <div className="w-full text-xs font-medium">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-3 w-10 text-center align-bottom">No.</th>
                              <th className="p-3 w-64 align-bottom">Komponen Budaya<br/>Keselamatan Pasien</th>
                              <th className="p-3 align-bottom text-center">Persentase Respons Positif</th>
                              <th className="p-3 w-40 text-center border-l border-slate-200">
                                <div>Rata-rata RS Percontohan<br/>(% Respons Positif)</div>
                                <div className="flex justify-between mt-2 pt-2 border-t border-slate-150 text-teal-600">
                                  <span className="w-1/2 text-center">MIN</span>
                                  <span className="w-1/2 text-center border-l border-slate-150">MAX</span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {combinedData.map((row, i) => {
                              const getBarColor = (val: number) => {
                                if (val >= 85) return 'bg-blue-500';
                                if (val >= 70) return 'bg-emerald-500';
                                if (val >= 50) return 'bg-yellow-500';
                                return 'bg-red-500';
                              };

                              return (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="p-3 text-center font-bold text-slate-400 align-top pt-5">{i + 1}.</td>
                                  <td className="p-3 font-semibold text-slate-700 text-xs align-top pt-5 pr-4 leading-relaxed">{row.dimensiSingkat}</td>
                                  <td className="p-3 align-middle py-4">
                                    {mode === 'Tunggal' ? (
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="flex-1 bg-slate-100 rounded-r-md h-7 relative overflow-hidden flex items-center border-y border-r border-slate-200 shadow-inner">
                                          <motion.div 
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            style={{ transformOrigin: 'left', width: \`\${row.Capaian}%\` }}
                                            className={\`h-full \${getBarColor(row.Capaian)} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform\`}
                                          >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                          </motion.div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 w-12 text-right">{row.Capaian.toFixed(0)}%</span>
                                      </div>
                                    ) : (
                                      <div className="space-y-2 w-full pt-1">
                                        {/* Bar Tahun 1 */}
                                        <div className="flex items-center gap-3 w-full">
                                          <span className="text-[10px] text-slate-400 w-14 text-right">Thn {tahun1}</span>
                                          <div className="flex-1 bg-slate-100 rounded-r-md h-5 relative overflow-hidden flex items-center border-y border-r border-slate-200 shadow-inner">
                                            <motion.div 
                                              initial={{ scaleX: 0 }}
                                              animate={{ scaleX: 1 }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              style={{ transformOrigin: 'left', width: \`\${row['Tahun 1']}%\` }}
                                              className={\`h-full \${getBarColor(row['Tahun 1'])} relative group-hover:brightness-110 transition-all transform-gpu opacity-70 will-change-transform\`}
                                            >
                                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                            </motion.div>
                                          </div>
                                          <span className="text-xs font-bold text-slate-500 w-10 text-right">{row['Tahun 1'].toFixed(0)}%</span>
                                        </div>
                                        {/* Bar Tahun 2 */}
                                        <div className="flex items-center gap-3 w-full">
                                          <span className="text-[10px] text-slate-400 w-14 text-right">Thn {tahun2}</span>
                                          <div className="flex-1 bg-slate-100 rounded-r-md h-6 relative overflow-hidden flex items-center border-y border-r border-slate-200 shadow-inner">
                                            <motion.div 
                                              initial={{ scaleX: 0 }}
                                              animate={{ scaleX: 1 }}
                                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                              style={{ transformOrigin: 'left', width: \`\${row['Tahun 2']}%\` }}
                                              className={\`h-full \${getBarColor(row['Tahun 2'])} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform\`}
                                            >
                                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                            </motion.div>
                                          </div>
                                          <span className="text-sm font-bold text-slate-700 w-10 text-right">{row['Tahun 2'].toFixed(0)}%</span>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-0 border-l border-slate-200 text-center font-bold text-slate-700 text-sm align-middle bg-slate-50">
                                    <div className="flex h-full items-center justify-center min-h-[60px]">
                                      <span className="w-1/2 py-2">{row.d1.benchmarkMin}%</span>
                                      <span className="w-1/2 py-2 border-l border-slate-150">{row.d1.benchmarkMax}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        
                        <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[11px] font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500 shadow-md"></div> &lt;50% (Perlu Perbaikan)</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-500 shadow-md"></div> 50-69% (Cukup)</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-md"></div> 70-84% (Baik)</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500 shadow-md"></div> &ge;85% (Sangat Baik)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex items-center justify-center flex-col text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    <Award className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Modul Sedang Dalam Pengembangan</h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Data untuk analisis {benchmarkSubView.toLowerCase()} akan ditampilkan di sini.
                  </p>
                </div>
              )
            ) : (
              <div className="flex-1 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex items-center justify-center flex-col text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                   {mainCards.find(c => c.id === activeView)?.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Modul Sedang Dalam Pengembangan</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Data untuk analisis {mainCards.find(c => c.id === activeView)?.title?.toLowerCase()} akan ditampilkan di sini.
                </p>
                <button 
                  onClick={() => setActiveView('main')}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali ke Menu Utama
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('components/AnalisaDataTab.tsx', updatedContent);
