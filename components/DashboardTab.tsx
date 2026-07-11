'use client';

import { SurveySubmission } from '../lib/db';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Award, ShieldAlert, Heart, TrendingUp, Sparkles, Database } from 'lucide-react';

interface DashboardTabProps {
  submissions: SurveySubmission[];
  isSupabase: boolean;
}

export default function DashboardTab({ submissions, isSupabase }: DashboardTabProps) {
  // If there are no submissions, don't crash
  const totalSubmissions = submissions.length;

  // Calculate Average Scores
  const avgOverall = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_keseluruhan || 0), 0) / totalSubmissions) 
    : 0;

  const avgA = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_a || 0), 0) / totalSubmissions) 
    : 0;
  const avgB = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_b || 0), 0) / totalSubmissions) 
    : 0;
  const avgC = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_c || 0), 0) / totalSubmissions) 
    : 0;
  const avgD = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_d || 0), 0) / totalSubmissions) 
    : 0;
  const avgF = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.skor_f || 0), 0) / totalSubmissions) 
    : 0;

  // Data for composite scores chart
  const compositeData = [
    { name: 'Unit Kerja (A)', skor: avgA, fill: '#6366f1' },
    { name: 'Pimpinan (B)', skor: avgB, fill: '#4f46e5' },
    { name: 'Komunikasi (C)', skor: avgC, fill: '#818cf8' },
    { name: 'Pelaporan (D)', skor: avgD, fill: '#3b82f6' },
    { name: 'RS Anda (F)', skor: avgF, fill: '#4338ca' },
  ];

  // Group by Staff Position
  const positionGroups: Record<string, number> = {};
  submissions.forEach(s => {
    const pos = s.posisi_staf || 'Lainnya';
    // Shorten long labels for charts
    const shortPos = pos.length > 25 ? pos.substring(0, 22) + '...' : pos;
    positionGroups[shortPos] = (positionGroups[shortPos] || 0) + 1;
  });

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#3b82f6', '#1d4ed8', '#0284c7', '#0369a1'];
  const pieData = Object.entries(positionGroups).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length]
  }));

  // Group by Unit and Calculate average
  const unitGroups: Record<string, { total: number; count: number }> = {};
  submissions.forEach(s => {
    const u = s.unit_kerja || 'Lainnya';
    const shortUnit = u.length > 25 ? u.substring(0, 22) + '...' : u;
    if (!unitGroups[shortUnit]) {
      unitGroups[shortUnit] = { total: 0, count: 0 };
    }
    unitGroups[shortUnit].total += s.skor_keseluruhan || 0;
    unitGroups[shortUnit].count += 1;
  });

  const unitData = Object.entries(unitGroups).map(([name, data]) => ({
    name,
    skor: Math.round(data.total / data.count)
  })).sort((a, b) => b.skor - a.skor);

  // Safety status label
  const getSafetyStatus = (score: number) => {
    if (score >= 80) return { label: 'Sangat Baik (Kuat)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (score >= 60) return { label: 'Baik (Sedang)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (score >= 40) return { label: 'Cukup (Butuh Perhatian)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Kurang (Prioritas Perbaikan)', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const status = getSafetyStatus(avgOverall);

  return (
    <div className="space-y-6">
      {/* Supabase connection alert */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isSupabase 
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800' 
          : 'bg-amber-500/5 border-amber-500/20 text-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isSupabase ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">
              {isSupabase ? 'Koneksi Supabase Cloud Aktif' : 'Berjalan dalam Mode Penyimpanan Lokal (Local Storage)'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSupabase 
                ? 'Seluruh data survei tersinkronisasi secara real-time ke database cloud Supabase Anda.' 
                : 'Data disimpan di browser Anda. Hubungkan ke Supabase di tab Pengaturan untuk sinkronisasi cloud.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Responden</span>
            <h3 className="text-3xl font-display font-bold text-slate-800">{totalSubmissions}</h3>
            <span className="text-[10px] text-slate-500">Staf RS yang berpartisipasi</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Rerata Skor Positif</span>
            <h3 className="text-3xl font-display font-bold text-slate-800">{avgOverall}%</h3>
            <span className="text-[10px] text-slate-500">Target kelulusan akreditasi {'>'}70%</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Predikat Budaya RS</span>
            <div className={`text-xs px-2.5 py-1 rounded-full font-semibold border mt-1.5 w-fit ${status.color}`}>
              {status.label}
            </div>
            <span className="text-[10px] text-slate-500">Berdasarkan skor AHRQ</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Kekuatan Utama</span>
            <h3 className="text-sm font-semibold text-slate-800 truncate max-w-[160px] mt-1">
              {avgB >= avgA && avgB >= avgC ? 'Kepemimpinan RS (B)' : avgC >= avgA ? 'Keterbukaan Komunikasi (C)' : 'Kerja Sama Tim (A)'}
            </h3>
            <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Skor Tertinggi
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composite Score Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-800">Skor Budaya Keselamatan Pasien per Bagian (%)</h4>
            <p className="text-xs text-slate-400">Rerata persentase tanggapan positif berdasarkan komposit kuesioner AHRQ 2.0</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compositeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Skor Positif']} />
                <Bar dataKey="skor" radius={[4, 4, 0, 0]}>
                  {compositeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Units Performance */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-800">Skor Budaya Keselamatan per Unit Kerja</h4>
              <p className="text-xs text-slate-400">Peringkat unit berdasarkan rerata skor positif keseluruhan</p>
            </div>
            {unitData.length > 0 ? (
              <div className="space-y-3.5">
                {unitData.slice(0, 4).map((unit, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[240px]">{unit.name}</span>
                      <span className="font-bold text-slate-800">{unit.skor}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          unit.skor >= 80 ? 'bg-indigo-600' : unit.skor >= 60 ? 'bg-indigo-400' : 'bg-indigo-200'
                        }`}
                        style={{ width: `${unit.skor}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">Belum ada data unit kerja.</div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 italic block mt-4">Kriteria: Kuat ({'>'}75%), Sedang (50-75%), Lemah ({'<'}50%)</span>
        </div>
      </div>

      {/* Demographics / Pie Chart */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-800">Distribusi Responden Berdasarkan Posisi Staf</h4>
          <p className="text-xs text-slate-400">Komposisi profesi staf medis dan non-medis yang telah mengisi kuesioner</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-60 flex justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center text-slate-400 text-xs">Belum ada data responden.</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{entry.value} Responden</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
