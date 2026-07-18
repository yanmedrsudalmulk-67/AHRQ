'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CountUp from './CountUp';
import { FileText, Printer, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Users, Calendar, Filter, ChevronDown, Clock, Building2, UserCircle } from 'lucide-react';
import { DIMENSI_INFO, DIMENSI_ITEMS } from '../lib/scoring';
import { SurveyData, getMasterBenchmark } from '../lib/db';

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
      if (s.id === 'MASTER_BENCHMARK') return false;
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

  // Master Benchmark from surveys prop
  const [masterBenchmarkData, setMasterBenchmarkData] = useState<Record<string, { min: number, max: number }> | null>(null);

  useEffect(() => {
    // Attempt to load from surveys first
    const mb = surveys.find(s => s.id === 'MASTER_BENCHMARK');
    if (mb && mb.dimensiScores) {
      setMasterBenchmarkData(mb.dimensiScores as any);
    } else {
      // Otherwise fetch from database
      const loadBenchmark = async () => {
        try {
          const data = await getMasterBenchmark();
          if (data) {
            setMasterBenchmarkData(data);
          }
        } catch (err) {
          console.error("Gagal memuat master benchmark di LaporanTab", err);
        }
      };
      loadBenchmark();
    }
  }, [surveys]);

  // Dynamic unique positions mapping based on inputted surveys
  const uniquePositions = useMemo(() => {
    if (selectedProfesi !== 'Semua Profesi') {
      return [selectedProfesi];
    }
    const positions = new Set<string>();
    surveys.forEach(s => {
      if (s.id === 'MASTER_BENCHMARK') return;
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw && raw.posisiStaf) {
        positions.add(raw.posisiStaf);
      }
    });
    if (positions.size === 0) {
      // Fallback standard positions if no data has been entered yet
      return [
        'Perawat',
        'Dokter Spesialis',
        'Apoteker'
      ];
    }
    return Array.from(positions).sort();
  }, [surveys, selectedProfesi]);

  // Calculate composite positive response percentage for a specific position and dimension
  const getPositionStats = (dimId: string, position: string) => {
    const positionSurveys = filteredSurveys.filter(s => {
      if (s.id === 'MASTER_BENCHMARK') return false;
      const raw = (s.dimensiScores as any)?._rawAnswers;
      return raw && raw.posisiStaf === position;
    });

    let totalPositive = 0;
    let totalValid = 0;

    positionSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        DIMENSI_ITEMS[dimId].forEach(item => {
          const ansKey = 'ans' + item.section;
          const ansVal = raw[ansKey] ? raw[ansKey][item.id] : undefined;

          if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
          const val = Number(ansVal);
          totalValid++;
          if (item.isReversed) {
            if (val === 1 || val === 2) totalPositive++;
          } else {
            if (val === 4 || val === 5) totalPositive++;
          }
        });
      }
    });

    const percentage = totalValid > 0 ? (totalPositive / totalValid) * 100 : null;
    return { percentage, respondentsCount: positionSurveys.length };
  };

  // Calculate average positive composite percentage across all 10 dimensions for a specific position
  const getAverageCompositeForPosition = (position: string) => {
    let sum = 0;
    let count = 0;
    DIMENSION_ORDER.forEach(dimId => {
      const { percentage } = getPositionStats(dimId, position);
      if (percentage !== null) {
        sum += percentage;
        count++;
      }
    });
    return count > 0 ? sum / count : null;
  };

  // Calculate average pilot benchmark across all 10 dimensions
  const getAverageBenchmark = () => {
    let sum = 0;
    DIMENSION_ORDER.forEach(dimId => {
      const bMin = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
      const bMax = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
      sum += (bMin + bMax) / 2;
    });
    return sum / DIMENSION_ORDER.length;
  };

  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    filteredSurveys.forEach(s => {
      if (s.id === 'MASTER_BENCHMARK') return;
      if (s.unitKerja) {
        units.add(s.unitKerja);
      } else {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw && raw.unitKerja) units.add(raw.unitKerja);
      }
    });
    if (units.size === 0) {
      return ['IGD', 'ICU', 'Rawat Inap', 'Rawat Jalan'];
    }
    return Array.from(units).sort();
  }, [filteredSurveys]);

  const getUnitStats = (dimId: string, unit: string) => {
    const unitSurveys = filteredSurveys.filter(s => {
      if (s.id === 'MASTER_BENCHMARK') return false;
      const raw = (s.dimensiScores as any)?._rawAnswers;
      return s.unitKerja === unit || (raw && raw.unitKerja === unit);
    });

    let totalPositive = 0;
    let totalValid = 0;

    unitSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        DIMENSI_ITEMS[dimId].forEach(item => {
          const ansKey = 'ans' + item.section;
          const ansVal = raw[ansKey] ? raw[ansKey][item.id] : undefined;
          if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
          const val = Number(ansVal);
          totalValid++;
          if (item.isReversed) {
            if (val === 1 || val === 2) totalPositive++;
          } else {
            if (val === 4 || val === 5) totalPositive++;
          }
        });
      }
    });

    const percentage = totalValid > 0 ? (totalPositive / totalValid) * 100 : null;
    return {
      percentage,
      count: unitSurveys.length
    };
  };

  const getAverageCompositeForUnit = (unit: string) => {
    let sum = 0;
    let count = 0;
    DIMENSION_ORDER.forEach(dimId => {
      const { percentage } = getUnitStats(dimId, unit);
      if (percentage !== null) {
        sum += percentage;
        count++;
      }
    });
    return count > 0 ? sum / count : null;
  };

  // Get CSS class and background pill styling based on score ranges (AHRQ SOPS standard threshold colors)
  const getCellColorClass = (val: number | null) => {
    if (val === null) return 'text-slate-500 font-medium';
    if (val >= 75) return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
    if (val >= 50) return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
    return 'text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
  };

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
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] md:rounded-[32px] -z-10 shadow-lg shadow-blue-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-indigo-500/10 transition-all transform-gpu duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-cyan-500/10 transition-all transform-gpu duration-700"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-[27px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-600 to-indigo-700 tracking-tight">
              Laporan Detail Hasil Survei Budaya Keselamatan Pasien
            </h1>
            <p className="text-sm md:text-base font-semibold text-slate-600">
              Berdasarkan AHRQ Hospital Survey on Patient Safety Culture (SOPS) Version 2.0
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-xl text-white transition-all transform-gpu shadow-md text-sm font-semibold whitespace-nowrap print:hidden shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100"><Building2 className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Rumah Sakit</p>
              <p className="text-sm font-bold text-slate-800">{namaRs}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100"><Users className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Responden</p>
              <p className="text-sm font-bold text-slate-800">{filteredSurveys.length} Staf</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100"><Clock className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Update Terakhir</p>
              <p className="text-sm font-bold text-slate-800">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl flex flex-col md:flex-row md:flex-wrap gap-4 md:items-center print:hidden shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-2 md:mr-4 shrink-0">
          <Filter className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Filter Data:</span>
        </div>
        
        <div className="relative w-full md:w-auto">
          <select 
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400/50 transition-all transform-gpu cursor-pointer w-full md:w-auto"
          >
            {tahunOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative w-full md:w-auto">
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400/50 transition-all transform-gpu cursor-pointer w-full md:w-auto md:max-w-[200px] md:truncate"
          >
            {unitOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative w-full md:w-auto">
          <select 
            value={selectedProfesi}
            onChange={(e) => setSelectedProfesi(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400/50 transition-all transform-gpu cursor-pointer w-full md:w-auto md:max-w-[200px] md:truncate"
          >
            {profesiOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
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
              className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-md"
            >
              {/* Card Header */}
              <div className="p-5 md:p-6 bg-white/[0.03] border-b border-white/5 relative flex items-center gap-4">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-md"></div>
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
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center transition-all transform-gpu duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.posPercent}%` }}
                          title={`Positif: ${stat.posPercent}%`}
                        >
                          {stat.posPercent > 8 && <CountUp value={stat.posPercent} className="text-[10px] font-extrabold text-emerald-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center transition-all transform-gpu duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.neuPercent}%` }}
                          title={`Netral: ${stat.neuPercent}%`}
                        >
                          {stat.neuPercent > 8 && <CountUp value={stat.neuPercent} className="text-[10px] font-extrabold text-yellow-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center transition-all transform-gpu duration-1000 ease-out group-hover:brightness-110"
                          style={{ width: `${stat.negPercent}%` }}
                          title={`Negatif: ${stat.negPercent}%`}
                        >
                          {stat.negPercent > 8 && <CountUp value={stat.negPercent} className="text-[10px] font-extrabold text-rose-950" />}
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-slate-600 to-slate-500 flex items-center justify-center transition-all transform-gpu duration-1000 ease-out group-hover:brightness-110"
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
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Respon Positif Dimensi</p>
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

      {/* Comparison Table Section (Glassmorphism Premium Design) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-md p-6 md:p-8 space-y-6 mt-8 md:mt-12"
      >
        <div className="space-y-3 border-b border-white/5 pb-5">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Perbandingan Rata-rata Persentase Respon Positif Dimensi Berdasarkan Posisi Staf
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">
            Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Percontohan berdasarkan Posisi Staf (AHRQ SOPS Versi 2.0)
          </p>
        </div>

        {/* Dynamic Metadata Badges & Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-slate-950/40 p-5 rounded-2xl border border-white/5">
          {/* Metadata Badges */}
          <div className="lg:col-span-2 flex flex-wrap gap-3">
            <div className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-2.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-300">Total Responden RS Anda:</span>
              <span className="text-sm font-black text-white">{filteredSurveys.length} Staf</span>
            </div>
            <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-slate-300">Total Responden RS Percontohan (Pilot):</span>
              <span className="text-sm font-black text-white">100+ RS</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-x-4 gap-y-2 text-[10px] md:text-xs">
            <div className="flex items-center gap-2 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md"></span>
              <span className="text-emerald-400 font-bold">Kekuatan (≥ 75%)</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/5 px-2.5 py-1.5 rounded-lg border border-yellow-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-md"></span>
              <span className="text-yellow-400 font-bold">Sedang (50% - 74%)</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md"></span>
              <span className="text-rose-400 font-bold">Prioritas (&lt; 50%)</span>
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper with Horizontal Scroll */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-sm relative max-h-[650px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b-2 border-white/15 bg-slate-900/90 sticky top-0 z-30 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-white">
                <th className="py-4 px-4 text-center w-12 border-r border-white/10 shadow-sm">No</th>
                <th className="py-4 px-5 min-w-[280px] text-center border-r border-white/10 shadow-sm">Dimensi Budaya Keselamatan</th>
                <th className="py-4 px-4 text-center min-w-[150px] border-r border-white/10 shadow-sm">Dataset</th>
                <th className="py-4 px-4 text-center min-w-[120px] border-r border-white/10 shadow-sm">Total Responden</th>
                {uniquePositions.map(pos => {
                  // Count active respondents for each position to make column header extremely informative
                  const count = filteredSurveys.filter(s => (s.dimensiScores as any)?._rawAnswers?.posisiStaf === pos).length;
                  return (
                    <th key={pos} className="py-4 px-5 min-w-[190px] text-center border-r border-white/10 last:border-r-0 font-black text-indigo-300">
                      <div className="flex flex-col items-center">
                        <span>{pos}</span>
                        <span className="text-[10px] text-indigo-400/80 font-mono tracking-normal normal-case mt-0.5">(N = {count})</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DIMENSION_ORDER.map((dimId, idx) => {
                const dimInfo = DIMENSI_INFO[dimId];
                
                // Get benchmark value from database or fallback from static config
                const bMin = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
                const bMax = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
                const bAvg = (bMin + bMax) / 2;

                return (
                  <Fragment key={dimId}>
                    {/* Row 1: Rumah Sakit Anda */}
                    <tr className="hover:bg-white/[0.01] transition-all transform-gpu border-b border-white/5">
                      <td rowSpan={2} className="py-5 px-4 text-center font-extrabold text-indigo-400 border-r border-white/10 bg-slate-900/40">
                        {idx + 1}
                      </td>
                      <td rowSpan={2} className="py-5 px-5 font-bold text-slate-100 border-r border-white/10 bg-slate-900/40">
                        <div className="space-y-1.5 max-w-[320px]">
                          <div className="text-white text-xs md:text-sm tracking-tight leading-snug">{dimInfo.nama}</div>
                          <div className="text-[10px] text-slate-400 font-normal leading-relaxed">{dimInfo.deskripsi}</div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-cyan-400 text-center border-r border-white/10 bg-cyan-500/[0.02]">
                        RS Anda
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-200 border-r border-white/10 bg-cyan-500/[0.02]">
                        {filteredSurveys.length}
                      </td>
                      {uniquePositions.map((pos, posIdx) => {
                        const { percentage } = getPositionStats(dimId, pos);
                        return (
                          <td key={`pos-rs-${dimId}-${pos}`} className={`py-3 px-5 text-center border-r border-white/10 bg-cyan-500/[0.02] ${posIdx === uniquePositions.length - 1 ? 'last:border-r-0' : ''}`}>
                            {percentage !== null ? (
                              <span className={getCellColorClass(percentage)}>
                                {percentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium italic text-[11px]">Tidak Ada Data</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 2: Rumah Sakit Percontohan (Pilot Hospital) */}
                    <tr className="hover:bg-white/[0.01] transition-all transform-gpu bg-slate-900/20">
                      <td className="py-3 px-4 font-bold text-emerald-400 text-center border-r border-white/10">
                        RS Percontohan
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 border-r border-white/10 font-bold">
                        -
                      </td>
                      {uniquePositions.map((pos, posIdx) => (
                        <td key={`pos-pilot-${dimId}-${pos}`} className={`py-3 px-5 text-center border-r border-white/10 ${posIdx === uniquePositions.length - 1 ? 'last:border-r-0' : ''}`}>
                          <div className="flex flex-col items-center justify-center">
                            <span className={getCellColorClass(bAvg)}>{bAvg.toFixed(1)}%</span>
                            <span className="text-[9px] text-emerald-400/70 font-mono font-medium mt-0.5">({bMin}% - {bMax}%)</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}

              {/* Rata-rata Seluruh Dimensi Rows */}
              {/* Row 1: Rumah Sakit Anda Average */}
              <tr className="bg-indigo-950/20 border-t-2 border-indigo-500/40 hover:bg-white/[0.01] transition-all transform-gpu">
                <td rowSpan={2} className="py-5 px-4 text-center font-black text-indigo-300 border-r border-white/10 bg-indigo-950/10">
                  ★
                </td>
                <td rowSpan={2} className="py-5 px-5 font-black text-white border-r border-white/10 bg-indigo-950/10">
                  <div className="space-y-1">
                    <div className="text-indigo-200 text-xs md:text-sm font-extrabold uppercase tracking-wide">Rata-rata Seluruh Dimensi</div>
                    <p className="text-[10px] text-slate-400 font-normal leading-normal">Hasil rata-rata persentase respon positif di seluruh 10 dimensi keselamatan pasien</p>
                  </div>
                </td>

                <td className="py-4 px-4 font-bold text-cyan-400 text-center border-r border-white/10 bg-cyan-500/[0.02]">
                  RS Anda
                </td>
                <td className="py-4 px-4 text-center font-black text-slate-100 border-r border-white/10 bg-cyan-500/[0.02]">
                  {filteredSurveys.length}
                </td>
                {uniquePositions.map((pos, posIdx) => {
                  const avgVal = getAverageCompositeForPosition(pos);
                  return (
                    <td key={`pos-avg-rs-${pos}`} className={`py-4 px-5 text-center border-r border-white/10 bg-cyan-500/[0.02] font-black ${posIdx === uniquePositions.length - 1 ? 'last:border-r-0' : ''}`}>
                      {avgVal !== null ? (
                        <span className={getCellColorClass(avgVal)}>
                          {avgVal.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium italic text-[11px]">Tidak Ada Data</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Rumah Sakit Percontohan Average */}
              <tr className="bg-indigo-950/20 hover:bg-white/[0.01] transition-all transform-gpu">
                <td className="py-4 px-4 font-bold text-emerald-400 text-center border-r border-white/10">
                  RS Percontohan
                </td>
                <td className="py-4 px-4 text-center text-slate-500 border-r border-white/10 font-bold">
                  -
                </td>
                {uniquePositions.map((pos, posIdx) => {
                  const avgB = getAverageBenchmark();
                  return (
                    <td key={`pos-avg-pilot-${pos}`} className={`py-4 px-5 text-center border-r border-white/10 font-black ${posIdx === uniquePositions.length - 1 ? 'last:border-r-0' : ''}`}>
                      <span className={getCellColorClass(avgB)}>
                        {avgB.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Unit Kerja Comparison Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-[20px] md:rounded-[24px] overflow-hidden shadow-md p-6 md:p-8 space-y-6 mt-8 md:mt-12"
      >
        <div className="space-y-3 border-b border-white/5 pb-5">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Perbandingan Rata-rata Respon Positif Dimensi Budaya Keselamatan Pasien Berdasarkan Unit Kerja
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">
            Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Percontohan berdasarkan Unit Kerja (AHRQ SOPS Versi 2.0)
          </p>
        </div>

        {/* Dynamic Metadata Badges & Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-slate-950/40 p-5 rounded-2xl border border-white/5">
          {/* Metadata Badges */}
          <div className="lg:col-span-2 flex flex-wrap gap-3">
            <div className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-2.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-300">Total Responden RS Anda:</span>
              <span className="text-sm font-black text-white">{filteredSurveys.length} Staf</span>
            </div>
            <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-slate-300">Total Unit Kerja:</span>
              <span className="text-sm font-black text-white">{uniqueUnits.length} Unit</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 lg:col-span-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md"></div><span className="text-[10px] font-bold text-emerald-400">&ge; 75%</span></div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-md"></div><span className="text-[10px] font-bold text-yellow-400">50-74%</span></div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"><div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-md"></div><span className="text-[10px] font-bold text-rose-400">&lt; 50%</span></div>
          </div>
        </div>

        {/* The Scrollable Table Container */}
        <div className="overflow-x-auto rounded-[16px] border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-sm relative custom-scrollbar pb-2">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="bg-[#0f172a] text-slate-300 uppercase tracking-wider font-semibold border-b-2 border-indigo-500/30 sticky top-0 z-20">
              <tr>
                <th className="py-4 px-4 text-center w-12 border-r border-white/10 shadow-sm sticky left-0 z-30 bg-[#0f172a]">No</th>
                <th className="py-4 px-5 min-w-[280px] text-center border-r border-white/10 shadow-sm sticky left-12 z-30 bg-[#0f172a]">Dimensi Budaya Keselamatan</th>
                <th className="py-4 px-4 text-center min-w-[150px] border-r border-white/10 shadow-sm">Dataset</th>
                <th className="py-4 px-4 text-center min-w-[120px] border-r border-white/10 shadow-sm">Total Responden</th>
                {uniqueUnits.map(unit => {
                  const count = filteredSurveys.filter(s => s.unitKerja === unit || (s.dimensiScores as any)?._rawAnswers?.unitKerja === unit).length;
                  return (
                    <th key={unit} className="py-4 px-5 min-w-[190px] text-center border-r border-white/10 last:border-r-0 font-black text-indigo-300">
                      <div className="flex flex-col items-center">
                        <span className="whitespace-normal break-words">{unit}</span>
                        <span className="text-[10px] text-indigo-400/80 font-mono tracking-normal normal-case mt-0.5">(N = {count})</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20 text-slate-300">
              {DIMENSION_ORDER.map((dimId, idx) => {
                const bMin = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
                const bMax = masterBenchmarkData && masterBenchmarkData[dimId] ? masterBenchmarkData[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
                const bAvg = (bMin + bMax) / 2;

                return (
                  <Fragment key={`unit-comp-${dimId}`}>
                    {/* Row 1: Rumah Sakit Anda */}
                    <tr className="hover:bg-white/[0.01] transition-all transform-gpu border-b border-white/5">
                      <td rowSpan={2} className="py-5 px-4 text-center font-extrabold text-indigo-400 border-r border-white/10 bg-slate-900/40 sticky left-0 z-10">
                        {idx + 1}
                      </td>
                      <td rowSpan={2} className="py-5 px-5 font-bold text-white border-r border-white/10 bg-slate-900/40 sticky left-12 z-10 leading-snug">
                        <div className="space-y-1.5 max-w-[320px]">
                          <p>{DIMENSI_INFO[dimId].nama}</p>
                          <p className="text-[10px] text-slate-400 font-normal leading-relaxed">{DIMENSI_INFO[dimId].deskripsi}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-400 text-center border-r border-white/10 bg-cyan-500/[0.02]">
                        RS Anda
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-200 border-r border-white/10 bg-cyan-500/[0.02]">
                        {filteredSurveys.length}
                      </td>
                      {uniqueUnits.map((unit, unitIdx) => {
                        const { percentage } = getUnitStats(dimId, unit);
                        return (
                          <td key={`unit-rs-${dimId}-${unit}`} className={`py-3 px-5 text-center border-r border-white/10 bg-cyan-500/[0.02] ${unitIdx === uniqueUnits.length - 1 ? 'last:border-r-0' : ''}`}>
                            {percentage !== null ? (
                              <span className={getCellColorClass(percentage)}>
                                {percentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium italic text-[11px]">Tidak Ada Data</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Row 2: Rumah Sakit Percontohan (Pilot Hospital) */}
                    <tr className="hover:bg-white/[0.01] transition-all transform-gpu bg-slate-900/20">
                      <td className="py-3 px-4 font-bold text-emerald-400 text-center border-r border-white/10">
                        RS Percontohan
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 border-r border-white/10 font-bold">
                        -
                      </td>
                      {uniqueUnits.map((unit, unitIdx) => (
                        <td key={`unit-pilot-${dimId}-${unit}`} className={`py-3 px-5 text-center border-r border-white/10 ${unitIdx === uniqueUnits.length - 1 ? 'last:border-r-0' : ''}`}>
                          <div className="flex flex-col items-center justify-center">
                            <span className={getCellColorClass(bAvg)}>{bAvg.toFixed(1)}%</span>
                            <span className="text-[9px] text-emerald-400/70 font-mono font-medium mt-0.5">({bMin}% - {bMax}%)</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}

              {/* Rata-rata Seluruh Dimensi Rows */}
              {/* Row 1: Rumah Sakit Anda Average */}
              <tr className="bg-indigo-950/20 border-t-2 border-indigo-500/40 hover:bg-white/[0.01] transition-all transform-gpu">
                <td rowSpan={2} className="py-5 px-4 text-center font-black text-indigo-300 border-r border-white/10 bg-indigo-950/10 sticky left-0 z-10">
                  ★
                </td>
                <td rowSpan={2} className="py-5 px-5 font-black text-white border-r border-white/10 bg-indigo-950/10 sticky left-12 z-10">
                  <div className="space-y-1">
                    <div className="text-indigo-200 text-xs md:text-sm font-extrabold uppercase tracking-wide">Rata-rata Seluruh Dimensi</div>
                    <p className="text-[10px] text-slate-400 font-normal leading-normal">Hasil rata-rata persentase respon positif di seluruh 10 dimensi keselamatan pasien</p>
                  </div>
                </td>
                <td className="py-4 px-4 font-bold text-cyan-400 text-center border-r border-white/10 bg-cyan-500/[0.02]">
                  RS Anda
                </td>
                <td className="py-4 px-4 text-center font-black text-slate-100 border-r border-white/10 bg-cyan-500/[0.02]">
                  {filteredSurveys.length}
                </td>
                {uniqueUnits.map((unit, unitIdx) => {
                  const avgVal = getAverageCompositeForUnit(unit);
                  return (
                    <td key={`unit-avg-rs-${unit}`} className={`py-4 px-5 text-center border-r border-white/10 bg-cyan-500/[0.02] font-black ${unitIdx === uniqueUnits.length - 1 ? 'last:border-r-0' : ''}`}>
                      {avgVal !== null ? (
                        <span className={getCellColorClass(avgVal)}>
                          {avgVal.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium italic text-[11px]">Tidak Ada Data</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              
              {/* Row 2: Rumah Sakit Percontohan Average */}
              <tr className="bg-indigo-950/20 hover:bg-white/[0.01] transition-all transform-gpu">
                <td className="py-4 px-4 font-bold text-emerald-400 text-center border-r border-white/10">
                  RS Percontohan
                </td>
                <td className="py-4 px-4 text-center text-slate-500 border-r border-white/10 font-bold">
                  -
                </td>
                {uniqueUnits.map((unit, unitIdx) => {
                  const avgB = getAverageBenchmark();
                  return (
                    <td key={`unit-avg-pilot-${unit}`} className={`py-4 px-5 text-center border-r border-white/10 font-black ${unitIdx === uniqueUnits.length - 1 ? 'last:border-r-0' : ''}`}>
                      <span className={getCellColorClass(avgB)}>
                        {avgB.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
