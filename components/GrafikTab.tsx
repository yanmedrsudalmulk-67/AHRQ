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
  const actualDataYears = useMemo(() => {
    const years = new Set<string>();
    surveys.forEach(s => {
      if (s.tanggalInput) {
        const y = s.tanggalInput.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [surveys]);

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

  const computeStats = (targetSurveys: SurveyData[]) => {
    return computeDimensionScores(targetSurveys);
  };

  const dataTahun1 = useMemo(() => computeStats(surveys.filter(s => s.tanggalInput?.startsWith(tahun1))), [surveys, tahun1]);
  const dataTahun2 = useMemo(() => computeStats(surveys.filter(s => s.tanggalInput?.startsWith(tahun2))), [surveys, tahun2]);

  const combinedData = useMemo(() => {
    return dataTahun1.map((d1, i) => {
      const d2 = dataTahun2[i];
      return {
        dimensiSingkat: d1.nama,
        'Capaian': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 1': parseFloat(d1.percentage.toFixed(2)),
        'Tahun 2': parseFloat(d2.percentage.toFixed(2)),
        'Benchmark': d1.benchmark,
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

  const rsName = surveys.length > 0 ? surveys[0].namaRs : "Rumah Sakit";

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

  if (surveys.length === 0) {
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
          Grafik {mode === 'Tunggal' ? 'Capaian 10 Dimensi' : 'Perbandingan Capaian 10 Dimensi'}
        </h3>
        <div className="h-[500px] w-full text-xs font-medium">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'Bar' ? (
              <BarChart data={combinedData} layout="horizontal" margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="dimensiSingkat" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                <YAxis type="number" domain={[0, 100]} stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip cursor={{ fill: '#1e293b' }} content={<CustomBarTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#94a3b8' }} />
                {mode === 'Tunggal' ? (
                  <Bar dataKey="Capaian" radius={[6, 6, 0, 0]} barSize={40}>
                    {combinedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Capaian >= 75 ? '#34d399' : entry.Capaian >= 50 ? '#fbbf24' : '#f87171'} />
                    ))}
                  </Bar>
                ) : (
                  <>
                    <Bar dataKey="Tahun 1" fill="#34d399" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="Tahun 2" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={24} />
                  </>
                )}
                <ReferenceLine y={50} stroke="#f87171" strokeDasharray="4 4" label={{ value: 'Batas Minimum 50%', fill: '#f87171', position: 'insideTopLeft' }} />
                <ReferenceLine y={75} stroke="#34d399" strokeDasharray="4 4" label={{ value: 'Target Unggul 75%', fill: '#34d399', position: 'insideTopLeft' }} />
              </BarChart>
            ) : (
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
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/[0.05] border border-white/20 p-6 md:p-8 rounded-[32px] backdrop-blur-3xl shadow-2xl shadow-black/50 overflow-hidden relative group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -z-10 group-hover:bg-teal-500/30 transition-colors duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
            <FileText className="w-5 h-5 text-teal-400" />
          </div>
          Hasil Survei Budaya Keselamatan Pasien {mode === 'Tunggal' ? tahun1 : `${tahun1} vs ${tahun2}`}
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-inner">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Dimensi Budaya Keselamatan</th>
                {mode === 'Tunggal' ? (
                  <>
                    <th className="p-4 text-center">Positive %</th>
                    <th className="p-4 text-center">Neutral %</th>
                    <th className="p-4 text-center">Negative %</th>
                    <th className="p-4 text-center">Komposit</th>
                    <th className="p-4 text-center">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-center">Tahun {tahun1}</th>
                    <th className="p-4 text-center">Tahun {tahun2}</th>
                    <th className="p-4 text-center">Selisih</th>
                    <th className="p-4 text-center">Tren</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {combinedData.map((row, i) => {
                const statusLabel = row.Capaian >= 75 ? 'Sangat Baik' : row.Capaian >= 60 ? 'Baik' : row.Capaian >= 50 ? 'Cukup' : 'Perlu Perbaikan';
                const statusColor = row.Capaian >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : row.Capaian >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : row.Capaian >= 50 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
                const diff = row['Tahun 2'] - row['Tahun 1'];
                return (
                  <tr key={row.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-4 text-center font-bold text-slate-500">{i + 1}</td>
                    <td className="p-4 font-semibold text-slate-200">{row.dimensiSingkat}</td>
                    {mode === 'Tunggal' ? (
                      <>
                        <td className="p-4 text-center font-bold text-emerald-400">{row.d1.percentage.toFixed(2)}%</td>
                        <td className="p-4 text-center font-medium text-slate-400">{row.d1.neutralPercentage.toFixed(2)}%</td>
                        <td className="p-4 text-center font-medium text-rose-400">{row.d1.negativePercentage.toFixed(2)}%</td>
                        <td className="p-4 text-center font-mono font-bold text-cyan-400">{row.d1.komposit.toFixed(2)}</td>
                        <td className="p-4 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>{statusLabel}</span></td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-center font-bold text-slate-400">{row['Tahun 1'].toFixed(2)}%</td>
                        <td className="p-4 text-center font-bold text-slate-200">{row['Tahun 2'].toFixed(2)}%</td>
                        <td className="p-4 text-center font-bold"><span className={diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}%</span></td>
                        <td className="p-4 text-center">
                          {diff > 0 ? <span className="inline-flex text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg gap-1 border border-emerald-500/20"><TrendingUp className="w-3 h-3" /> Naik</span>
                           : diff < 0 ? <span className="inline-flex text-red-400 text-xs font-bold bg-red-500/10 px-2.5 py-1 rounded-lg gap-1 border border-red-500/20"><Activity className="w-3 h-3" /> Turun</span>
                           : <span className="text-slate-500 text-xs font-bold">Stabil</span>}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
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
