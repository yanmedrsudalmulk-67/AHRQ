'use client';

import { useState, useMemo } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  BarChart2, ShieldAlert, Award, TrendingUp, Info, Activity,
  Calendar, Building2, BrainCircuit, Lightbulb, FileText, Download, CheckCircle2,
  ListFilter
} from 'lucide-react';
import { SurveyData } from '../lib/db';
import { computeDimensionScores } from '../lib/scoring';

interface GrafikTabProps {
  surveys: SurveyData[];
}

const queryClient = new QueryClient();

const fetchAI = async (prompt: string) => {
  const res = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: 'gemini-3.5-flash' })
  });
  if (!res.ok) throw new Error('AI Fetch failed');
  const data = await res.json();
  return data.text as string;
};

function GrafikTabContent({ surveys }: GrafikTabProps) {
  const actualSurveys = useMemo(() => surveys.filter(s => s.id !== 'MASTER_BENCHMARK'), [surveys]);

  const actualDataYears = useMemo(() => {
    const years = new Set<string>();
    actualSurveys.forEach(s => {
      if (s.tanggalInput) {
        const y = s.tanggalInput.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [actualSurveys]);

  const allSelectableYears = useMemo(() => {
    const years = new Set<string>([...actualDataYears]);
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 3; i++) {
      years.add(i.toString());
    }
    years.add('2025');
    years.add('2026');
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [actualDataYears]);

  const [mode, setMode] = useState<'Tunggal' | 'Perbandingan'>('Tunggal');
  const currentYear = new Date().getFullYear().toString();
  
  // Use actualDataYears to default to a year that actually has data
  const [tahun1, setTahun1] = useState<string>(actualDataYears[0] || currentYear);
  const [tahun2, setTahun2] = useState<string>(actualDataYears[1] || actualDataYears[0] || currentYear);
  const [chartType, setChartType] = useState<'Bar' | 'Line'>('Bar');

  const masterBenchmarkData = useMemo(() => {
    const mb = surveys.find(s => s.id === 'MASTER_BENCHMARK');
    return mb ? (mb.dimensiScores as any) : undefined;
  }, [surveys]);

  const computeStats = (targetSurveys: SurveyData[]) => {
    return computeDimensionScores(targetSurveys, masterBenchmarkData);
  };

  const dataTahun1 = useMemo(() => computeStats(actualSurveys.filter(s => s.tanggalInput?.startsWith(tahun1))), [actualSurveys, tahun1]);
  const dataTahun2 = useMemo(() => computeStats(actualSurveys.filter(s => s.tanggalInput?.startsWith(tahun2))), [actualSurveys, tahun2]);

  const combinedData = useMemo(() => {
    return dataTahun1.map((d1, i) => {
      const d2 = dataTahun2[i];
      return {
        dimensiSingkat: d1.nama,
        'Capaian': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 1': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 2': parseFloat(d2.percentage.toFixed(2)),
        'BenchmarkMin': d1.benchmarkMin,
        'BenchmarkMax': d1.benchmarkMax,
        id: d1.id, d1, d2
      };
    });
  }, [dataTahun1, dataTahun2]);

  const aiPrompt = useMemo(() => {
    if (combinedData.length === 0) return null;
    let text = `Buatkan Analisis Otomatis dan Rekomendasi Peningkatan berformat Markdown (maksimal 4 paragraf analisis, dan 4 bullet points rekomendasi) untuk hasil survei budaya keselamatan pasien RS berikut.\n`;
    text += `Gunakan Bahasa Indonesia formal, profesional, jelas, objektif untuk Direktur RS.\n\n`;
    
    if (mode === 'Tunggal') {
      text += `Data Capaian Tahun ${tahun1}:\n`;
      combinedData.forEach(d => {
        text += `- ${d.dimensiSingkat}: ${d['Capaian']}% (Kategori: ${d['Capaian'] >= 75 ? 'Kuat' : d['Capaian'] >= 50 ? 'Sedang' : 'Lemah'})\n`;
      });
    } else {
      text += `Perbandingan Capaian Tahun ${tahun1} vs ${tahun2}:\n`;
      combinedData.forEach(d => {
        const diff = d['Tahun 2'] - d['Tahun 1'];
        text += `- ${d.dimensiSingkat}: Tahun ${tahun1}=${d['Tahun 1']}%, Tahun ${tahun2}=${d['Tahun 2']}% (Selisih: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%)\n`;
      });
    }
    
    text += `\nFokus pada kekuatan organisasi, kelemahan, dan tindakan perbaikan spesifik. Jangan berikan pengantar basa-basi, langsung berikan section "### Analisis" dan "### Rekomendasi Peningkatan".`;
    return text;
  }, [combinedData, mode, tahun1, tahun2]);

  const { data: aiResponse, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-analysis', aiPrompt],
    queryFn: () => fetchAI(aiPrompt!),
    enabled: !!aiPrompt,
    staleTime: Infinity,
  });

  const rsName = actualSurveys.length > 0 ? actualSurveys[0].namaRs : "Rumah Sakit";

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload.d1;
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl text-xs space-y-3 min-w-[200px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-2">{payload[0].payload.dimensiSingkat}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-emerald-600">
              <span className="font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive Response:</span>
              <strong className="text-sm">{data.percentage.toFixed(2)}%</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Neutral Response:</span>
              <strong>{data.neutralPercentage.toFixed(2)}%</strong>
            </div>
            <div className="flex justify-between items-center text-rose-500">
              <span className="font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Negative Response:</span>
              <strong>{data.negativePercentage.toFixed(2)}%</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-blue-600 font-bold">
            <span>Nilai Komposit:</span>
            <span>{data.komposit.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl text-xs space-y-2 min-w-[200px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-2">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center" style={{ color: p.color }}>
              <span className="font-semibold">{p.name}:</span>
              <strong className="text-sm">{p.value.toFixed(2)}%</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (actualSurveys.length === 0) {
    return (
      <div className="p-12 bg-white/[0.07] border border-white/10 rounded-[24px] shadow-sm text-center space-y-4 max-w-xl mx-auto my-12 backdrop-blur-xl">
        <BarChart2 className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">Belum Ada Data Survei</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Silakan masukkan respon survei terlebih dahulu pada menu <strong>Input Data Survei</strong> untuk memvisualisasikan Business Intelligence Dashboard.
        </p>
      </div>
    );
  }

  return (
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 pb-20 p-6 -m-6 rounded-[24px]">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.07] border border-white/10 p-6 rounded-[24px] backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">Analisa Grafik Budaya Keselamatan Pasien</h1>
          <p className="text-sm text-slate-400 mt-1">Visualisasi capaian seluruh dimensi Survei Budaya Keselamatan Pasien AHRQ SOPS Version 2.0.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl border border-white/10">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">{mode === 'Tunggal' ? `Periode ${tahun1}` : `Perbandingan ${tahun1} vs ${tahun2}`}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.07] border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ListFilter className="w-3 h-3 text-emerald-400" /> Mode Analisis
            </label>
            <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-xl border border-white/10">
              <button onClick={() => setMode('Tunggal')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'Tunggal' ? 'bg-white/10 text-emerald-400 shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}>Periode Tunggal</button>
              <button onClick={() => setMode('Perbandingan')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white/10 text-cyan-400 shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}>Perbandingan Periode</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" /> {mode === 'Tunggal' ? 'Periode Tahun' : 'Tahun Pertama'}
            </label>
            <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 focus:border-emerald-500 outline-none w-32 [&>option]:bg-slate-900">
              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {mode === 'Perbandingan' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" /> Tahun Kedua
              </label>
              <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 focus:border-cyan-500 outline-none w-32 [&>option]:bg-slate-900">
                {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-slate-500" /> Jenis Grafik
          </label>
          <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-xl border border-white/10">
            <button onClick={() => setChartType('Bar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${chartType === 'Bar' ? 'bg-white/10 text-slate-200 shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}><BarChart2 className="w-4 h-4" /> Bar</button>
            <button onClick={() => setChartType('Line')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${chartType === 'Line' ? 'bg-white/10 text-slate-200 shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}><TrendingUp className="w-4 h-4" /> Line</button>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.07] border border-white/10 p-6 rounded-[24px] backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          {chartType === 'Bar' ? <BarChart2 className="w-5 h-5 text-emerald-400" /> : <TrendingUp className="w-5 h-5 text-cyan-400" />}
          Hasil Perbandingan Pengukuran Komposit Untuk {rsName}
        </h3>
        <div className="w-full text-xs font-medium">
          {chartType === 'Bar' ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-10 text-center align-bottom">No.</th>
                    <th className="p-3 w-64 align-bottom">Komponen Budaya<br/>Keselamatan Pasien</th>
                    <th className="p-3 align-bottom text-center">Persentase Respons Positif</th>
                    <th className="p-3 w-40 text-center border-l border-white/10">
                      <div>Rata-rata RS Percontohan<br/>(% Respons Positif)</div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-emerald-400">
                        <span className="w-1/2 text-center">MIN</span>
                        <span className="w-1/2 text-center border-l border-white/5">MAX</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {combinedData.map((row, i) => {
                    const getBarColor = (val: number) => {
                      if (val >= 85) return 'bg-blue-500';
                      if (val >= 70) return 'bg-emerald-500';
                      if (val >= 50) return 'bg-yellow-500';
                      return 'bg-red-500';
                    };

                    return (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-3 text-center font-bold text-slate-500 align-top pt-5">{i + 1}.</td>
                        <td className="p-3 font-semibold text-slate-200 text-xs align-top pt-5 pr-4 leading-relaxed">{row.dimensiSingkat}</td>
                        <td className="p-3 align-middle py-4">
                          {mode === 'Tunggal' ? (
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-1 bg-slate-800/50 rounded-r-md h-7 relative overflow-hidden flex items-center border-y border-r border-slate-700/50 shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${row.Capaian}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`h-full ${getBarColor(row.Capaian)} relative group-hover:brightness-110 transition-all`}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                </motion.div>
                              </div>
                              <span className="text-sm font-bold text-slate-200 w-12 text-right">{row.Capaian.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <div className="space-y-2 w-full pt-1">
                              {/* Bar Tahun 1 */}
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-[10px] text-slate-500 w-14 text-right">Thn {tahun1}</span>
                                <div className="flex-1 bg-slate-800/50 rounded-r-md h-5 relative overflow-hidden flex items-center border-y border-r border-slate-700/50 shadow-inner">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${row['Tahun 1']}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full ${getBarColor(row['Tahun 1'])} relative group-hover:brightness-110 transition-all opacity-70`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                  </motion.div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 w-10 text-right">{row['Tahun 1'].toFixed(0)}%</span>
                              </div>
                              {/* Bar Tahun 2 */}
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-[10px] text-slate-500 w-14 text-right">Thn {tahun2}</span>
                                <div className="flex-1 bg-slate-800/50 rounded-r-md h-6 relative overflow-hidden flex items-center border-y border-r border-slate-700/50 shadow-inner">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${row['Tahun 2']}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                    className={`h-full ${getBarColor(row['Tahun 2'])} relative group-hover:brightness-110 transition-all`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                  </motion.div>
                                </div>
                                <span className="text-sm font-bold text-slate-200 w-10 text-right">{row['Tahun 2'].toFixed(0)}%</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-0 border-l border-white/10 text-center font-bold text-slate-300 text-sm align-middle bg-slate-900/20">
                          <div className="flex h-full items-center justify-center min-h-[60px]">
                            <span className="w-1/2 py-2">{row.d1.benchmarkMin}%</span>
                            <span className="w-1/2 py-2 border-l border-white/5">{row.d1.benchmarkMax}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[11px] font-medium text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> &lt;50% (Perlu Perbaikan)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div> 50-69% (Cukup)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 70-84% (Baik)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> &ge;85% (Sangat Baik)</div>
              </div>
            </div>
          ) : (
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dimensiSingkat" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                  <YAxis type="number" domain={[0, 100]} stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip content={<CustomLineTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#94a3b8' }} />
                  {mode === 'Tunggal' ? (
                    <Line type="monotone" dataKey="Capaian" stroke="#34d399" strokeWidth={3} dot={{ r: 6, fill: '#34d399', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8 }} />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="Tahun 1" stroke="#34d399" strokeWidth={3} dot={{ r: 5, fill: '#34d399' }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Tahun 2" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: '#38bdf8' }} activeDot={{ r: 7 }} />
                    </>
                  )}
                  <ReferenceLine y={50} stroke="#f87171" strokeDasharray="4 4" />
                  <ReferenceLine y={75} stroke="#34d399" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.07] border border-white/10 p-6 md:p-8 rounded-[24px] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -z-10 -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" /> Analisis Otomatis
          </h3>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
            {aiLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            ) : aiResponse ? (
              <div dangerouslySetInnerHTML={{ 
                __html: aiResponse
                  .replace(/### Analisis/g, '')
                  .replace(/### Rekomendasi Peningkatan/g, '')
                  .replace(/\n\n/g, '<br/><br/>') 
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
                  .replace(/\* (.*?)(?=<br|$)/g, '<li class="ml-4 list-disc text-slate-300">$1</li>')
              }} className="leading-relaxed space-y-2" />
            ) : <p className="text-slate-400">Menunggu analisis data...</p>}
          </div>
        </div>

        <div className="bg-white/[0.07] border border-white/10 p-6 md:p-8 rounded-[24px] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -z-10 -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-emerald-400" /> Rekomendasi Peningkatan
          </h3>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
            {aiLoading ? (
               <div className="space-y-3 animate-pulse"><div className="h-4 bg-white/10 rounded w-full"></div><div className="h-4 bg-white/10 rounded w-5/6"></div></div>
            ) : aiResponse ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-200">Berdasarkan hasil analisis BI Dashboard, direkomendasikan tindak lanjut berikut:</p>
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <ul className="space-y-2 text-emerald-100 list-none m-0 p-0">
                    {combinedData.filter(d => d.d1.percentage < 50).slice(0, 4).map(d => (
                      <li key={d.id} className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">Fokuskan evaluasi akar masalah pada <strong className="text-emerald-300">{d.dimensiSingkat}</strong> yang memiliki skor rendah ({d.d1.percentage.toFixed(1)}%).</span>
                      </li>
                    ))}
                    {combinedData.filter(d => d.d1.percentage < 50).length === 0 && (
                      <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Pertahankan capaian unggul pada seluruh dimensi dan teruskan budaya pelaporan yang baik.</span></li>
                    )}
                  </ul>
                </div>
              </div>
            ) : <p className="text-slate-400">Menunggu rekomendasi sistem...</p>}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 px-2 pt-4">
        <span>Dicetak pada: {new Date().toLocaleString('id-ID')}</span>
        <span>AHRQ SOPS 2.0 BI Dashboard - {rsName}</span>
      </div>
    </motion.div>
  );
}

export default function GrafikTab(props: GrafikTabProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GrafikTabContent {...props} />
    </QueryClientProvider>
  );
}
