'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CountUp from './CountUp';
import { FileText, Printer, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Users, Calendar, Filter, ChevronDown, Clock, Building2, UserCircle } from 'lucide-react';
import { DIMENSI_INFO } from '../lib/scoring';
import { SurveyData } from '../lib/db';

const ALL_QUESTIONS = [
  // Bagian A
  { id: 1, section: 'A', code: 'A1', text: 'Di unit ini, kami bekerja sama sebagai tim yang efektif', dim: 'd1' },
  { id: 2, section: 'A', code: 'A2', text: 'Di unit ini, kami memiliki staf yang cukup untuk menangani beban kerja', dim: 'd2' },
  { id: 3, section: 'A', code: 'A3', text: 'Staf di unit ini bekerja lebih lama dari waktu terbaik untuk perawatan pasien', dim: 'd2', isReversed: true },
  { id: 4, section: 'A', code: 'A4', text: 'Unit ini meninjau prosedur kerja secara berkala untuk menentukan apakah diperlukan perubahan untuk meningkatkan keselamatan pasien', dim: 'd3' },
  { id: 5, section: 'A', code: 'A5', text: 'Unit ini terlalu bergantung pada staf sementara, pengganti, atau panggilan', dim: 'd2', isReversed: true },
  { id: 6, section: 'A', code: 'A6', text: 'Di unit ini, staf merasa bahwa kesalahan yang terjadi dianggap sebagai kesalahan mereka sendiri', dim: 'd4', isReversed: true },
  { id: 7, section: 'A', code: 'A7', text: 'Ketika sebuah insiden dilaporkan di unit ini, rasanya seperti orangnya yang ditulis, bukan masalahnya', dim: 'd4', isReversed: true },
  { id: 8, section: 'A', code: 'A8', text: 'Selama saat sibuk, staf di unit ini saling membantu satu sama lain', dim: 'd1' },
  { id: 9, section: 'A', code: 'A9', text: 'Di unit ini, ada staf yang memiliki perilaku tidak menyenangkan dalam bekerja', dim: 'd1', isReversed: true },
  { id: 10, section: 'A', code: 'A10', text: 'Ketika staf melakukan kesalahan, unit ini berfokus pada pembelajaran daripada menyalahkan secara personal', dim: 'd4' },
  { id: 11, section: 'A', code: 'A11', text: 'Kecepatan kerja di unit ini sangat terburu-buru sehingga berdampak negatif pada keselamatan pasien', dim: 'd2', isReversed: true },
  { id: 12, section: 'A', code: 'A12', text: 'Di unit ini, setiap perubahan untuk meningkatkan keselamatan pasien dilakukan evaluasi, untuk melihat seberapa baik perubahan tersebut bekerja', dim: 'd3' },
  { id: 13, section: 'A', code: 'A13', text: 'Di unit ini, dukungan bagi staf yang terlibat dalam kesalahan keselamatan pasien masih kurang', dim: 'd4', isReversed: true },
  { id: 14, section: 'A', code: 'A14', text: 'Di unit ini, masalah keselamatan pasien yang sama memungkinkan dapat terus terjadi', dim: 'd4', isReversed: true },
  
  // Bagian B
  { id: 1, section: 'B', code: 'B1', text: 'Atasan, manajer, atau pemimpin klinis saya secara serius mempertimbangkan saran dari staf untuk meningkatkan keselamatan pasien', dim: 'd5' },
  { id: 2, section: 'B', code: 'B2', text: 'Atasan, manajer, atau pemimpin klinis saya menginginkan kita bekerja lebih cepat saat waktu sibuk, bahkan jika itu berarti mengambil jalan pintas', dim: 'd5', isReversed: true },
  { id: 3, section: 'B', code: 'B3', text: 'Atasan, manajer, atau pemimpin klinis saya mengambil tindakan untuk mengatasi masalah keselamatan pasien yang menjadi perhatian mereka', dim: 'd5' },
  
  // Bagian C
  { id: 1, section: 'C', code: 'C1', text: 'Kami diberi informasi tentang kesalahan yang terjadi pada unit ini', dim: 'd7' },
  { id: 2, section: 'C', code: 'C2', text: 'Ketika kesalahan terjadi pada unit ini, kami mendiskusikan cara-cara untuk mencegahnya terjadi lagi', dim: 'd7' },
  { id: 3, section: 'C', code: 'C3', text: 'Di unit ini, kami diberi tahu tentang perubahan yang dibuat berdasarkan laporan kejadian', dim: 'd7' },
  { id: 4, section: 'C', code: 'C4', text: 'Di unit ini, staf angkat bicara jika mereka melihat sesuatu yang dapat berdampak negatif terhadap perawatan pasien', dim: 'd6' },
  { id: 5, section: 'C', code: 'C5', text: 'Ketika staf di unit ini melihat seseorang yang memiliki wewenang lebih besar melakukan sesuatu yang tidak aman bagi pasien, mereka berani angkat bicara', dim: 'd6' },
  { id: 6, section: 'C', code: 'C6', text: 'Ketika staf di unit ini angkat bicara, mereka yang memiliki wewenang lebih besar akan terbuka terhadap masalah keselamatan pasien mereka', dim: 'd6' },
  { id: 7, section: 'C', code: 'C7', text: 'Di unit ini, staf takut untuk bertanya ketika ada sesuatu yang tidak beres', dim: 'd6', isReversed: true },
  
  // Bagian D
  { id: 1, section: 'D', code: 'D1', text: 'Ketika terjadi kesalahan yang terdeteksi dan dikoreksi sebelum memengaruhi pasien, seberapa sering hal ini dilaporkan?', dim: 'd8' },
  { id: 2, section: 'D', code: 'D2', text: 'Ketika terjadi kesalahan tetapi tidak berpotensi membahayakan pasien, seberapa sering hal ini dilaporkan?', dim: 'd8' },
  
  // Bagian F
  { id: 1, section: 'F', code: 'F1', text: 'Tindakan manajemen rumah sakit menunjukkan bahwa keselamatan pasien adalah prioritas utama', dim: 'd9' },
  { id: 2, section: 'F', code: 'F2', text: 'Manajemen rumah sakit menyediakan sumber daya yang memadai untuk meningkatkan keselamatan pasien', dim: 'd9' },
  { id: 3, section: 'F', code: 'F3', text: 'Manajemen rumah sakit tampaknya hanya tertarik pada keselamatan pasien setelah kejadian tidak diharapkan terjadi', dim: 'd9', isReversed: true },
  { id: 4, section: 'F', code: 'F4', text: 'Ketika memindahkan pasien dari satu unit ke unit lain, informasi penting sering kali terlewatkan', dim: 'd10', isReversed: true },
  { id: 5, section: 'F', code: 'F5', text: 'Selama pergantian shift, informasi perawatan pasien yang penting sering terlewatkan', dim: 'd10', isReversed: true },
  { id: 6, section: 'F', code: 'F6', text: 'Selama pergantian shift, ada waktu yang memadai untuk bertukar semua informasi penting tentang perawatan pasien', dim: 'd10' }
];

const DIMENSION_ORDER = [
  'd7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'
];

interface LaporanTabProps {
  surveys: SurveyData[];
  namaRs: string;
}

export default function LaporanTab({ surveys, namaRs }: LaporanTabProps) {
  const [currentDate, setCurrentDate] = useState('');
  
  // Filter States
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua Tahun');
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua Unit Kerja');
  const [selectedProfesi, setSelectedProfesi] = useState<string>('Semua Profesi');
  
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, []);

  // Options for filters based on available data
  const tahunOptions = useMemo(() => {
    const years = new Set<string>();
    surveys.forEach(s => {
      const year = s.tanggalInput.split(' ').pop();
      if (year && !isNaN(Number(year))) years.add(year);
      else if (s.tanggalInput.includes('-')) years.add(s.tanggalInput.split('-')[0]);
    });
    return ['Semua Tahun', ...Array.from(years).sort().reverse()];
  }, [surveys]);

  const unitOptions = useMemo(() => {
    const units = new Set<string>();
    surveys.forEach(s => {
      if (s.unitKerja) units.add(s.unitKerja);
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw && raw.unitKerja) units.add(raw.unitKerja);
    });
    return ['Semua Unit Kerja', ...Array.from(units).sort()];
  }, [surveys]);

  const profesiOptions = useMemo(() => {
    const profesi = new Set<string>();
    surveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw && raw.posisiStaf) profesi.add(raw.posisiStaf);
    });
    return ['Semua Profesi', ...Array.from(profesi).sort()];
  }, [surveys]);

  // Filtered Surveys
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      let match = true;
      const raw = (s.dimensiScores as any)?._rawAnswers;
      
      if (selectedTahun !== 'Semua Tahun') {
        const y = s.tanggalInput.includes(selectedTahun);
        if (!y) match = false;
      }
      
      if (selectedUnit !== 'Semua Unit Kerja') {
        const u1 = s.unitKerja === selectedUnit;
        const u2 = raw?.unitKerja === selectedUnit;
        if (!u1 && !u2) match = false;
      }
      
      if (selectedProfesi !== 'Semua Profesi') {
        if (raw?.posisiStaf !== selectedProfesi) match = false;
      }
      
      return match;
    });
  }, [surveys, selectedTahun, selectedUnit, selectedProfesi]);

  const calculateQuestionStats = (q: any) => {
    let pos = 0, neu = 0, neg = 0, missing = 0;
    
    filteredSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers || {};
      const ansKey = 'ans' + q.section;
      const val = raw[ansKey] ? raw[ansKey][q.id] : undefined;
      
      if (val === undefined || val === null || val === 9) {
        missing++;
      } else {
        if (q.isReversed) {
          if (val === 1 || val === 2) pos++;
          else if (val === 3) neu++;
          else if (val === 4 || val === 5) neg++;
        } else {
          if (val === 4 || val === 5) pos++;
          else if (val === 3) neu++;
          else if (val === 1 || val === 2) neg++;
        }
      }
    });
    
    const total = filteredSurveys.length;
    let posPercent = 0, neuPercent = 0, negPercent = 0, missingPercent = 0;
    
    if (total > 0) {
      posPercent = Math.round((pos / total) * 100);
      neuPercent = Math.round((neu / total) * 100);
      negPercent = Math.round((neg / total) * 100);
      missingPercent = 100 - posPercent - neuPercent - negPercent; // ensure 100%
      if (missingPercent < 0) missingPercent = 0;
    }
    
    return { pos, neu, neg, missing, total, posPercent, neuPercent, negPercent, missingPercent };
  };

  const getDimensionStatus = (percent: number) => {
    if (percent >= 80) return { label: 'Sangat Baik', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (percent >= 70) return { label: 'Baik', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (percent >= 50) return { label: 'Cukup', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    return { label: 'Perlu Perbaikan', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
      {/* Premium Header */}
      <div className="relative p-6 md:p-8 rounded-[24px] md:rounded-[32px] overflow-hidden group">
        <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[24px] md:rounded-[32px] -z-10 shadow-[0_8px_32px_rgba(99,102,241,0.15)]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -z-10 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-[27px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 tracking-tight">
              Laporan Detail Hasil Survei Budaya Keselamatan Pasien
            </h1>
            <p className="text-sm md:text-base font-semibold text-[#c9cfe6]">
              Berdasarkan AHRQ Hospital Survey on Patient Safety Culture (SOPS) Version 2.0
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] text-sm font-semibold whitespace-nowrap print:hidden shrink-0"
          >
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/20"><Building2 className="w-5 h-5 text-indigo-400" /></div>
            <div>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Rumah Sakit</p>
              <p className="text-sm font-bold text-white">{namaRs}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/20"><Users className="w-5 h-5 text-purple-400" /></div>
            <div>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Responden</p>
              <p className="text-sm font-bold text-white">{filteredSurveys.length} Staf</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/20"><Clock className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Update Terakhir</p>
              <p className="text-sm font-bold text-white">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-wrap gap-4 items-center print:hidden shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2 mr-4">
          <Filter className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-white/80">Filter Data:</span>
        </div>
        
        <div className="relative">
          <select 
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="appearance-none bg-slate-900 border border-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all cursor-pointer"
          >
            {tahunOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="appearance-none bg-slate-900 border border-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all cursor-pointer max-w-[200px] truncate"
          >
            {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            value={selectedProfesi}
            onChange={(e) => setSelectedProfesi(e.target.value)}
            className="appearance-none bg-slate-900 border border-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all cursor-pointer max-w-[200px] truncate"
          >
            {profesiOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Dimensions Content */}
      <div className="space-y-6 md:space-y-8">
        {DIMENSION_ORDER.map((dimId, index) => {
          const dimInfo = DIMENSI_INFO[dimId];
          const questions = ALL_QUESTIONS.filter(q => q.dim === dimId);
          
          let sumPosPercent = 0;
          const qStats = questions.map(q => {
            const stat = calculateQuestionStats(q);
            sumPosPercent += stat.posPercent;
            return { q, stat };
          });
          const avgPosPercent = questions.length > 0 ? Math.round(sumPosPercent / questions.length) : 0;
          const status = getDimensionStatus(avgPosPercent);

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              key={dimId} 
              className="bg-[#121826]/80 backdrop-blur-xl border border-white/10 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            >
              {/* Card Header */}
              <div className="p-5 md:p-6 bg-white/[0.03] border-b border-white/5 relative flex items-center gap-4">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-lg md:text-xl font-black text-indigo-300">{index + 1}</span>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{dimInfo.nama}</h2>
                  <p className="text-xs md:text-sm text-white/50 mt-1">{dimInfo.deskripsi}</p>
                </div>
              </div>

              {/* Questions List */}
              <div className="p-5 md:p-6 space-y-6">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-slate-300">Positif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                    <span className="text-xs font-semibold text-slate-300">Netral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
                    <span className="text-xs font-semibold text-slate-300">Negatif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-slate-500"></div>
                    <span className="text-xs font-semibold text-slate-300">Tidak Menjawab / Tidak Tahu</span>
                  </div>
                </div>
                {qStats.map(({ q, stat }, qIdx) => (
                  <div key={q.id} className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    {/* Question Text */}
                    <div className="xl:w-2/5 shrink-0 flex gap-3">
                      <span className="text-sm font-bold text-indigo-300 pt-0.5">{q.code}{q.isReversed && !q.code.endsWith('R') ? 'R' : ''} &mdash;</span>
                      <p className="text-sm font-medium text-slate-200 leading-relaxed">{q.text}</p>
                    </div>

                    {/* Chart Container */}
                    <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Stacked Bar */}
                      <div className="flex-1 w-full h-8 flex rounded-xl overflow-hidden bg-slate-900 border border-white/5 relative group cursor-crosshair">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center transition-all duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.posPercent}%` }}
                          title={`Positif: ${stat.posPercent}%`}
                        >
                          {stat.posPercent > 8 && <CountUp value={stat.posPercent} className="text-[10px] font-extrabold text-emerald-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center transition-all duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.neuPercent}%` }}
                          title={`Netral: ${stat.neuPercent}%`}
                        >
                          {stat.neuPercent > 8 && <CountUp value={stat.neuPercent} className="text-[10px] font-extrabold text-yellow-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center transition-all duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.negPercent}%` }}
                          title={`Negatif: ${stat.negPercent}%`}
                        >
                          {stat.negPercent > 8 && <CountUp value={stat.negPercent} className="text-[10px] font-extrabold text-rose-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-slate-600 to-slate-500 flex items-center justify-center transition-all duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.missingPercent}%` }}
                          title={`Tidak Menjawab / Tidak Tahu: ${stat.missingPercent}%`}
                        >
                          {stat.missingPercent > 8 && <CountUp value={stat.missingPercent} className="text-[10px] font-extrabold text-white" />}
                        </div>
                      </div>

                      {/* Missing info on the right */}
                      <div className="w-full md:w-32 shrink-0 flex items-center md:justify-end gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <span className="text-slate-400">Tidak Menjawab / Tidak Tahu <CountUp value={stat.missingPercent} className="font-bold text-white" /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Card for Dimension */}
              <div className="bg-black/20 p-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Respon Positif Komposit</p>
                  <div className="flex items-center gap-3 mt-1">
                    <CountUp value={avgPosPercent} className="text-2xl font-black text-white" />
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color} ${status.border}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                
                {/* Visual indicator (Decorative) */}
                <div className={`p-3 rounded-xl border ${status.border} ${status.bg} flex items-center justify-center`}>
                  {avgPosPercent >= 70 ? (
                    <TrendingUp className={`w-5 h-5 ${status.color}`} />
                  ) : avgPosPercent >= 50 ? (
                    <AlertTriangle className={`w-5 h-5 ${status.color}`} />
                  ) : (
                    <TrendingDown className={`w-5 h-5 ${status.color}`} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
