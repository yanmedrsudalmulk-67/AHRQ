'use client';
import React, { useState, useMemo, useEffect, Fragment, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CountUp from './CountUp';
import { 
  Building, 
  Building2,
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
  BarChart3,
  ListChecks,
  HeartPulse,
  AlertTriangle,
  TriangleAlert,
  BarChart2,
  ShieldAlert,
  HeartHandshake,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Printer,
  FileText,
  FileSpreadsheet,
  ClipboardCheck,
  ArrowRight,
  Clock3,
  MessageSquareOff
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { SurveyData, getMasterBenchmark, getBenchmarkInteraksi, BenchmarkInteraksi } from '../lib/db';
import { computeDimensionScores, DIMENSI_INFO, DIMENSI_ITEMS, scoreToPercent } from '../lib/scoring';

const E1Tooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl text-xs space-y-3 min-w-[200px]">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center" style={{ color: p.color }}>
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span> 
              {p.name}:
            </span>
            <strong className="text-sm">{p.value.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ReportedEventsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rsData = payload.find((p: any) => p.dataKey === 'Rumah Sakit Anda');
    const benchmarkData = payload.find((p: any) => p.dataKey === 'Rumah Sakit Percontohan');

    return (
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl text-xs space-y-4 min-w-[260px] text-slate-200">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-2 text-sm">{label}</p>
        
        {rsData && (
          <div className="space-y-1">
            <p className="font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Rumah Sakit Anda
            </p>
            <div className="pl-4 space-y-0.5 text-slate-300">
              <p>Kategori : <span className="font-semibold text-white">{label}</span></p>
              <p>Persentase : <span className="font-semibold text-white">{rsData.value.toFixed(1)}%</span></p>
              <p>Jumlah Responden : <span className="font-semibold text-white">{rsData.payload['Rumah Sakit Anda Count'] || 0}</span></p>
            </div>
          </div>
        )}
        
        {benchmarkData && (
          <>
            <div className="border-t border-slate-800 my-2"></div>
            <div className="space-y-1">
              <p className="font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500"></span>
                Rumah Sakit Percontohan
              </p>
              <div className="pl-4 space-y-0.5 text-slate-300">
                <p>Kategori : <span className="font-semibold text-white">{label}</span></p>
                <p>Persentase : <span className="font-semibold text-white">{benchmarkData.value.toFixed(1)}%</span></p>
                <p>Jumlah Responden : <span className="font-semibold text-white">{(benchmarkData.payload['Rumah Sakit Percontohan Count'] || 0).toLocaleString('id-ID')}</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

interface AnalisaDataTabProps {
  surveys: SurveyData[];
  role: 'rs' | 'admin';
  identifier: string;
  namaRs: string;
  hospitalId: string;
}

function extractYear(tanggalStr?: string): string {
  if (!tanggalStr) return new Date().getFullYear().toString();
  const match = tanggalStr.match(/\b(20\d{2}|19\d{2})\b/);
  if (match) return match[1];
  const partsBySpace = tanggalStr.trim().split(/\s+/);
  const lastPart = partsBySpace[partsBySpace.length - 1];
  if (lastPart && !isNaN(Number(lastPart)) && lastPart.length === 4) return lastPart;
  const partsByDash = tanggalStr.split('-');
  if (partsByDash[0] && !isNaN(Number(partsByDash[0])) && partsByDash[0].length === 4) return partsByDash[0];
  return new Date().getFullYear().toString();
}

export default function AnalisaDataTab({ surveys, role, identifier, namaRs, hospitalId }: AnalisaDataTabProps) {
  const [activeView, setActiveView] = useState<'main' | 'hospital' | 'unit' | 'position' | 'tenure' | 'interaction' | 'benchmark'>('main');
  const [benchmarkSubView, setBenchmarkSubView] = useState<string | null>(null);
  const [hospitalSubView, setHospitalSubView] = useState<string | null>(null);
  const [positionSubView, setPositionSubView] = useState<string | null>(null);
  const [unitSubView, setUnitSubView] = useState<string | null>(null);
  const [tenureSubView, setTenureSubView] = useState<string | null>(null);
  const [interactionSubView, setInteractionSubView] = useState<string | null>(null);
  const [selectedDimId, setSelectedDimId] = useState<string>('d1');

  const [mode, setMode] = useState<'Tunggal' | 'Perbandingan'>('Tunggal');
  
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterProfesi, setFilterProfesi] = useState<string>('Semua');
  const [filterTenureRS, setFilterTenureRS] = useState<string>('Semua');
  const [filterTenureUnit, setFilterTenureUnit] = useState<string>('Semua');
  const [filterInteraction, setFilterInteraction] = useState<string>('Semua');
  
  const actualSurveys = useMemo(() => surveys.filter(s => s.id !== 'MASTER_BENCHMARK'), [surveys]);

  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    actualSurveys.forEach(s => {
      if (s.unitKerja) units.add(s.unitKerja);
    });
    return Array.from(units).sort();
  }, [actualSurveys]);

  const uniqueProfesi = useMemo(() => {
    const positions = new Set<string>();
    actualSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw?.posisiStaf) {
        positions.add(raw.posisiStaf);
      }
    });
    return Array.from(positions).sort();
  }, [actualSurveys]);
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

  const [benchmarkInteraksiData, setBenchmarkInteraksiData] = useState<BenchmarkInteraksi[]>([]);

  useEffect(() => {
    getBenchmarkInteraksi().then(setBenchmarkInteraksiData);
  }, []);

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

  const e1Stats = useMemo(() => {
    let targetSurveys = actualSurveys.filter(s => extractYear(s.tanggalInput) === tahun1);
    if (mode === 'Perbandingan') {
      targetSurveys = actualSurveys.filter(s => {
        const y = extractYear(s.tanggalInput);
        return y === tahun1 || y === tahun2;
      });
    }
    
    let totalValid = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    targetSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
        counts[raw.ansE as keyof typeof counts] += 1;
        totalValid += 1;
      }
    });

    const getPct = (val: number) => totalValid > 0 ? (val / totalValid) * 100 : 0;

    return [
      { kategori: 'Sangat Baik', 'Rumah Sakit Anda': getPct(counts[5]), 'Data Pembanding': 35 },
      { kategori: 'Baik', 'Rumah Sakit Anda': getPct(counts[4]), 'Data Pembanding': 45 },
      { kategori: 'Cukup', 'Rumah Sakit Anda': getPct(counts[3]), 'Data Pembanding': 15 },
      { kategori: 'Kurang', 'Rumah Sakit Anda': getPct(counts[2]), 'Data Pembanding': 4 },
      { kategori: 'Sangat Kurang', 'Rumah Sakit Anda': getPct(counts[1]), 'Data Pembanding': 1 },
    ];
  }, [actualSurveys, tahun1, tahun2, mode]);

  // SOPS 2.0 Question Items Mapping
  const STATEMENTS_A = useMemo(() => [
    { id: 1, code: 'A1', text: 'Di unit ini, kami bekerja sama sebagai tim yang efektif', dim: 'd1' },
    { id: 2, code: 'A2', text: 'Di unit ini, kami memiliki staf yang cukup untuk menangani beban kerja', dim: 'd2' },
    { id: 3, code: 'A3', text: 'Staf di unit ini bekerja lebih lama dari waktu terbaik untuk perawatan pasien', dim: 'd2', isReversed: true },
    { id: 4, code: 'A4', text: 'Unit ini meninjau prosedur kerja secara berkala untuk menentukan apakah diperlukan perubahan untuk meningkatkan keselamatan pasien', dim: 'd3' },
    { id: 5, code: 'A5', text: 'Unit ini terlalu bergantung pada staf sementara, pengganti, atau panggilan', dim: 'd2', isReversed: true },
    { id: 6, code: 'A6', text: 'Di unit ini, staf merasa bahwa kesalahan yang terjadi dianggap sebagai kesalahan mereka sendiri', dim: 'd4', isReversed: true },
    { id: 7, code: 'A7', text: 'Ketika sebuah insiden dilaporkan di unit ini, rasanya seperti orangnya yang ditulis, bukan masalahnya', dim: 'd4', isReversed: true },
    { id: 8, code: 'A8', text: 'Selama saat sibuk, staf di unit ini saling membantu satu sama lain', dim: 'd1' },
    { id: 9, code: 'A9', text: 'Di unit ini, ada staf yang memiliki perilaku tidak menyenangkan dalam bekerja', dim: 'd1', isReversed: true },
    { id: 10, code: 'A10', text: 'Ketika staf melakukan kesalahan, unit ini berfokus pada pembelajaran daripada menyalahkan secara personal', dim: 'd4' },
    { id: 11, code: 'A11', text: 'Kecepatan kerja di unit ini sangat terburu-buru sehingga berdampak negatif pada keselamatan pasien', dim: 'd2', isReversed: true },
    { id: 12, code: 'A12', text: 'Di unit ini, setiap perubahan untuk meningkatkan keselamatan pasien dilakukan evaluasi, untuk melihat seberapa baik perubahan tersebut bekerja', dim: 'd3' },
    { id: 13, code: 'A13', text: 'Di unit ini, dukungan bagi staf yang terlibat dalam kesalahan keselamatan pasien masih kurang', dim: 'd4', isReversed: true },
    { id: 14, code: 'A14', text: 'Di unit ini, masalah keselamatan pasien yang sama memungkinkan dapat terus terjadi', dim: 'd4', isReversed: true }
  ], []);

  const STATEMENTS_B = useMemo(() => [
    { id: 1, code: 'B1', text: 'Atasan, manajer, atau pemimpin klinis saya secara serius mempertimbangkan saran dari staf untuk meningkatkan keselamatan pasien', dim: 'd5' },
    { id: 2, code: 'B2', text: 'Atasan, manajer, atau pemimpin klinis saya menginginkan kita bekerja lebih cepat saat waktu sibuk, bahkan jika itu berarti mengambil jalan pintas', dim: 'd5', isReversed: true },
    { id: 3, code: 'B3', text: 'Atasan, manajer, atau pemimpin klinis saya mengambil tindakan untuk mengatasi masalah keselamatan pasien yang menjadi perhatian mereka', dim: 'd5' }
  ], []);

  const STATEMENTS_C = useMemo(() => [
    { id: 1, code: 'C1', text: 'Kami diberi informasi tentang kesalahan yang terjadi pada unit ini', dim: 'd7' },
    { id: 2, code: 'C2', text: 'Ketika kesalahan terjadi pada unit ini, kami mendiskusikan cara-cara untuk mencegahnya terjadi lagi', dim: 'd7' },
    { id: 3, code: 'C3', text: 'Di unit ini, kami diberi tahu tentang perubahan yang dibuat berdasarkan laporan kejadian', dim: 'd7' },
    { id: 4, code: 'C4', text: 'Di unit ini, staf angkat bicara jika mereka melihat sesuatu yang dapat berdampak negatif terhadap perawatan pasien', dim: 'd6' },
    { id: 5, code: 'C5', text: 'Ketika staf di unit ini melihat seseorang yang memiliki wewenang lebih besar melakukan sesuatu yang tidak aman bagi pasien, mereka berani angkat bicara', dim: 'd6' },
    { id: 6, code: 'C6', text: 'Ketika staf di unit ini angkat bicara, mereka yang memiliki wewenang lebih besar akan terbuka terhadap masalah keselamatan pasien mereka', dim: 'd6' },
    { id: 7, code: 'C7', text: 'Di unit ini, staf takut untuk bertanya ketika ada sesuatu yang tidak beres', dim: 'd6', isReversed: true }
  ], []);

  const STATEMENTS_D = useMemo(() => [
    { id: 1, code: 'D1', text: 'Ketika kesalahan diketahui dan diperbaiki sebelum sampai ke pasien, seberapa sering hal ini dilaporkan?', dim: 'd8' },
    { id: 2, code: 'D2', text: 'Ketika suatu kesalahan sampai ke pasien dan dapat membahayakan pasien, tetapi tidak terjadi, seberapa sering hal ini dilaporkan?', dim: 'd8' }
  ], []);

  const STATEMENTS_F = useMemo(() => [
    { id: 1, code: 'F1', text: 'Tindakan manajemen rumah sakit menunjukkan bahwa keselamatan pasien adalah prioritas utama', dim: 'd9' },
    { id: 2, code: 'F2', text: 'Manajemen rumah sakit menyediakan sumber daya yang memadai untuk meningkatkan keselamatan pasien', dim: 'd9' },
    { id: 3, code: 'F3', text: 'Manajemen rumah sakit tampaknya hanya tertarik pada keselamatan pasien setelah kejadian tidak diharapkan terjadi', dim: 'd9', isReversed: true },
    { id: 4, code: 'F4', text: 'Ketika memindahkan pasien dari satu unit ke unit lain, informasi penting sering kali terlewatkan', dim: 'd10', isReversed: true },
    { id: 5, code: 'F5', text: 'Selama pergantian shift, informasi perawatan pasien yang penting sering terlewatkan', dim: 'd10', isReversed: true },
    { id: 6, code: 'F6', text: 'Selama pergantian shift, ada waktu yang memadai untuk bertukar semua informasi penting tentang perawatan pasien', dim: 'd10' }
  ], []);

  const hospitalSurveys = useMemo(() => {
    return actualSurveys.filter(s => extractYear(s.tanggalInput) === tahun1);
  }, [actualSurveys, tahun1]);

  const hospitalSurveys2 = useMemo(() => {
    return actualSurveys.filter(s => extractYear(s.tanggalInput) === tahun2);
  }, [actualSurveys, tahun2]);

  const demografiStats = useMemo(() => {
    const total = hospitalSurveys.reduce((acc, s) => acc + (s.jumlahResponden || 1), 0);
    const posisiCounts: Record<string, number> = {};
    const g1TenureCounts: Record<string, number> = {};
    const g2TenureCounts: Record<string, number> = {};
    const g3WorkHoursCounts: Record<string, number> = {};
    const g4InteractionCounts: Record<string, number> = {};

    hospitalSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw) {
        const pos = raw.posisiStaf || 'Lainnya';
        posisiCounts[pos] = (posisiCounts[pos] || 0) + 1;

        const g1 = raw.ansG?.[1] || 'Tidak diisi';
        g1TenureCounts[g1] = (g1TenureCounts[g1] || 0) + 1;

        const g2 = raw.ansG?.[2] || 'Tidak diisi';
        g2TenureCounts[g2] = (g2TenureCounts[g2] || 0) + 1;

        const g3 = raw.ansG?.[3] || 'Tidak diisi';
        g3WorkHoursCounts[g3] = (g3WorkHoursCounts[g3] || 0) + 1;

        const g4 = raw.ansG?.[4] || 'Tidak diisi';
        g4InteractionCounts[g4] = (g4InteractionCounts[g4] || 0) + 1;
      } else {
        const pos = s.unitKerja || 'Perawat';
        posisiCounts[pos] = (posisiCounts[pos] || 0) + (s.jumlahResponden || 1);
      }
    });

    const posisiData = Object.entries(posisiCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const g1Data = Object.entries(g1TenureCounts).map(([name, value]) => ({ name, value }));
    const g2Data = Object.entries(g2TenureCounts).map(([name, value]) => ({ name, value }));
    const g3Data = Object.entries(g3WorkHoursCounts).map(([name, value]) => ({ name, value }));
    const g4Data = Object.entries(g4InteractionCounts).map(([name, value]) => ({ name, value }));

    const unitCounts: Record<string, number> = {};
    hospitalSurveys.forEach(s => {
      const unit = s.unitKerja || 'Instansi Umum';
      unitCounts[unit] = (unitCounts[unit] || 0) + (s.jumlahResponden || 1);
    });
    const unitData = Object.entries(unitCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { total, posisiData, g1Data, g2Data, g3Data, g4Data, unitData };
  }, [hospitalSurveys]);

  const hospitalDimensionScores = useMemo(() => {
    return computeDimensionScores(hospitalSurveys, masterBenchmarkData);
  }, [hospitalSurveys, masterBenchmarkData]);

  const ALL_QUESTIONS = useMemo<{ id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[]>(() => [
    ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
    ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
    ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
    ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
    ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
  ], [STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const calculateReportedEventsStats = useCallback((surveys: any[]) => {
    const counts: Record<string, number> = {
      'Tidak ada': 0,
      '1 sampai 2': 0,
      '3 sampai 5': 0,
      '6 hingga 10': 0,
      '11 atau lebih': 0
    };
    let total = 0;
    surveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        const val = raw.ansD?.[3];
        if (val && counts[val] !== undefined) {
          counts[val] += 1;
          total += 1;
        }
      }
    });
    const getPct = (key: string) => total > 0 ? (counts[key] / total) * 100 : 0;
    return {
      total,
      counts,
      percentages: {
        'Tidak ada': getPct('Tidak ada'),
        '1 sampai 2': getPct('1 sampai 2'),
        '3 sampai 5': getPct('3 sampai 5'),
        '6 hingga 10': getPct('6 hingga 10'),
        '11 atau lebih': getPct('11 atau lebih')
      }
    };
  }, []);

  const calculateQuestionStats = (q: any, surveysOverride?: any[]) => {
    let pos = 0, neu = 0, neg = 0, missing = 0;
    const targetSurveys = surveysOverride || hospitalSurveys;
    
    targetSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers || {};
      const ansKey = 'ans' + q.section;
      const val = raw[ansKey] ? raw[ansKey][q.id] : undefined;
      
      if (val === undefined || val === null || val === 9) {
        missing++;
      } else {
        const numVal = Number(val);
        if (q.isReversed) {
          if (numVal === 1 || numVal === 2) pos++;
          else if (numVal === 3) neu++;
          else if (numVal === 4 || numVal === 5) neg++;
        } else {
          if (numVal === 4 || numVal === 5) pos++;
          else if (numVal === 3) neu++;
          else if (numVal === 1 || numVal === 2) neg++;
        }
      }
    });
    
    const total = targetSurveys.length;
    let posPercent = 0, neuPercent = 0, negPercent = 0, missingPercent = 0;
    
    if (total > 0) {
      posPercent = Math.round((pos / total) * 100);
      neuPercent = Math.round((neu / total) * 100);
      negPercent = Math.round((neg / total) * 100);
      missingPercent = 100 - posPercent - neuPercent - negPercent;
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

  const perItemStats = useMemo(() => {
    const allQuestions: { id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[] = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      let totalValid = 0;
      let positive = 0;
      let neutral = 0;
      let negative = 0;

      hospitalSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw) {
          let ansVal: any = undefined;
          if (q.section === 'A') ansVal = raw.ansA?.[q.id];
          else if (q.section === 'B') ansVal = raw.ansB?.[q.id];
          else if (q.section === 'C') ansVal = raw.ansC?.[q.id];
          else if (q.section === 'D') ansVal = raw.ansD?.[q.id];
          else if (q.section === 'F') ansVal = raw.ansF?.[q.id];

          if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
          const val = Number(ansVal);
          totalValid++;

          if (q.isReversed) {
            if (val === 1 || val === 2) positive++;
            else if (val === 3) neutral++;
            else if (val === 4 || val === 5) negative++;
          } else {
            if (val === 4 || val === 5) positive++;
            else if (val === 3) neutral++;
            else if (val === 1 || val === 2) negative++;
          }
        } else {
          const score = survey.dimensiScores?.[q.dim] || 3.5;
          totalValid += 1;
          if (score >= 4.0) positive++;
          else if (score >= 3.0) neutral++;
          else negative++;
        }
      });

      const posRate = totalValid > 0 ? (positive / totalValid) * 100 : 0;
      const neutRate = totalValid > 0 ? (neutral / totalValid) * 100 : 0;
      const negRate = totalValid > 0 ? (negative / totalValid) * 100 : 0;

      return {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
        positive: parseFloat(posRate.toFixed(1)),
        neutral: parseFloat(neutRate.toFixed(1)),
        negative: parseFloat(negRate.toFixed(1)),
        totalValid
      };
    });
  }, [hospitalSurveys, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const patientSafetyStats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalValid = 0;

    hospitalSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
        counts[raw.ansE as 1|2|3|4|5] += 1;
        totalValid += 1;
      } else {
        const score = (survey.dimensiScores as any)?.E1 || 4.0;
        const rounded = Math.min(5, Math.max(1, Math.round(score))) as 1|2|3|4|5;
        counts[rounded] += 1;
        totalValid += 1;
      }
    });

    const average = totalValid > 0 
      ? Object.entries(counts).reduce((acc, [rating, count]) => acc + Number(rating) * count, 0) / totalValid 
      : 0;

    const data = [
      { name: 'Luar Biasa (5)', value: counts[5], rate: totalValid > 0 ? (counts[5]/totalValid)*100 : 0 },
      { name: 'Sangat Baik (4)', value: counts[4], rate: totalValid > 0 ? (counts[4]/totalValid)*100 : 0 },
      { name: 'Baik (3)', value: counts[3], rate: totalValid > 0 ? (counts[3]/totalValid)*100 : 0 },
      { name: 'Biasa (2)', value: counts[2], rate: totalValid > 0 ? (counts[2]/totalValid)*100 : 0 },
      { name: 'Buruk (1)', value: counts[1], rate: totalValid > 0 ? (counts[1]/totalValid)*100 : 0 },
    ];

    const positiveRate = totalValid > 0 ? ((counts[4] + counts[5]) / totalValid) * 100 : 0;

    return { counts, totalValid, average, data, positiveRate };
  }, [hospitalSurveys]);

  const eventsReportedStats = useMemo(() => {
    const d1Counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const d2Counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let d1Total = 0;
    let d2Total = 0;

    const d3Counts: Record<string, number> = {
      'Tidak ada': 0,
      '1 sampai 2': 0,
      '3 sampai 5': 0,
      '6 hingga 10': 0,
      '11 atau lebih': 0
    };
    let d3Total = 0;

    hospitalSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        const d1 = raw.ansD?.[1];
        if (d1 !== undefined && d1 !== null && d1 !== 9) {
          d1Counts[d1 as 1|2|3|4|5] += 1;
          d1Total += 1;
        }
        const d2 = raw.ansD?.[2];
        if (d2 !== undefined && d2 !== null && d2 !== 9) {
          d2Counts[d2 as 1|2|3|4|5] += 1;
          d2Total += 1;
        }
        const d3 = raw.ansD?.[3];
        if (d3) {
          d3Counts[d3] = (d3Counts[d3] || 0) + 1;
          d3Total += 1;
        }
      }
    });

    const d1Data = [
      { name: 'Selalu', value: d1Counts[5], fill: '#8b5cf6' },
      { name: 'Hampir Selalu', value: d1Counts[4], fill: '#a78bfa' },
      { name: 'Kadang-kadang', value: d1Counts[3], fill: '#c084fc' },
      { name: 'Jarang', value: d1Counts[2], fill: '#ddd6fe' },
      { name: 'Tidak Pernah', value: d1Counts[1], fill: '#ede9fe' }
    ];

    const d2Data = [
      { name: 'Selalu', value: d2Counts[5], fill: '#8b5cf6' },
      { name: 'Hampir Selalu', value: d2Counts[4], fill: '#a78bfa' },
      { name: 'Kadang-kadang', value: d2Counts[3], fill: '#c084fc' },
      { name: 'Jarang', value: d2Counts[2], fill: '#ddd6fe' },
      { name: 'Tidak Pernah', value: d2Counts[1], fill: '#ede9fe' }
    ];

    const d3Data = Object.entries(d3Counts).map(([name, value]) => ({ name, value }));

    return { d1Data, d2Data, d3Data, d1Total, d2Total, d3Total };
  }, [hospitalSurveys]);

  const filteredSurveysForReportedEvents = useMemo(() => {
    return actualSurveys.filter(survey => {
      // 1. Filter by Year (depends on Mode: Tunggal vs Perbandingan)
      const y = extractYear(survey.tanggalInput);
      if (mode === 'Tunggal') {
        if (y !== tahun1) return false;
      } else {
        if (y !== tahun1 && y !== tahun2) return false;
      }

      // Get raw answers
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (!raw) return false;

      // 2. Filter by Unit Kerja
      if (filterUnit !== 'Semua') {
        const unit = survey.unitKerja || 'Instansi Umum';
        if (unit !== filterUnit) return false;
      }

      // 3. Filter by Profesi/Jabatan
      if (filterProfesi !== 'Semua') {
        const pos = raw.posisiStaf || 'Lainnya';
        if (pos !== filterProfesi) return false;
      }

      // 4. Filter by Lama Kerja di Rumah Sakit (G1)
      if (filterTenureRS !== 'Semua') {
        const g1 = raw.ansG?.[1] || 'Tidak diisi';
        if (g1 !== filterTenureRS) return false;
      }

      // 5. Filter by Lama Kerja di Unit (G2)
      if (filterTenureUnit !== 'Semua') {
        const g2 = raw.ansG?.[2] || 'Tidak diisi';
        if (g2 !== filterTenureUnit) return false;
      }

      // 6. Filter by Interaksi dengan Pasien (G4)
      if (filterInteraction !== 'Semua') {
        const g4 = raw.ansG?.[4] || 'Tidak diisi';
        if (g4 !== filterInteraction) return false;
      }

      return true;
    });
  }, [actualSurveys, mode, tahun1, tahun2, filterUnit, filterProfesi, filterTenureRS, filterTenureUnit, filterInteraction]);

  const reportedEventsStats1 = useMemo(() => calculateReportedEventsStats(hospitalSurveys), [calculateReportedEventsStats, hospitalSurveys]);
  const reportedEventsStats2 = useMemo(() => calculateReportedEventsStats(hospitalSurveys2), [calculateReportedEventsStats, hospitalSurveys2]);

  const reportedEventsComparisonStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Tidak ada': 0,
      '1 sampai 2': 0,
      '3 sampai 5': 0,
      '6 hingga 10': 0,
      '11 atau lebih': 0
    };
    let total = 0;

    filteredSurveysForReportedEvents.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        const val = raw.ansD?.[3];
        if (val && counts[val] !== undefined) {
          counts[val] += 1;
          total += 1;
        }
      }
    });

    const getPct = (key: string) => total > 0 ? (counts[key] / total) * 100 : 0;

    return {
      total,
      counts,
      percentages: {
        'Tidak ada': getPct('Tidak ada'),
        '1 sampai 2': getPct('1 sampai 2'),
        '3 sampai 5': getPct('3 sampai 5'),
        '6 hingga 10': getPct('6 hingga 10'),
        '11 atau lebih': getPct('11 atau lebih')
      }
    };
  }, [filteredSurveysForReportedEvents]);

  const hospitalComments = useMemo(() => {
    const list: { id: string; text: string; unit: string; position: string; date: string }[] = [];
    hospitalSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      const text = raw?.komentar || (survey as any).komentar || (survey.dimensiScores as any)?.komentar || '';
      if (text && text.trim().length > 0) {
        list.push({
          id: survey.id,
          text: text.trim(),
          unit: survey.unitKerja || 'Umum',
          position: raw?.posisiStaf || 'Tenaga Kesehatan',
          date: survey.tanggalInput || 'Juli 2026'
        });
      }
    });

    return list;
  }, [hospitalSurveys, tahun1]);

  const positionDimensionScores = useMemo(() => {
    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };

      demografiStats.posisiData.forEach(pos => {
        const posSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.posisiStaf || 'Lainnya') === pos.name;
          } else {
            return (s.unitKerja || 'Perawat') === pos.name;
          }
        });

        let totalPositive = 0;
        let totalValid = 0;
        posSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            DIMENSI_ITEMS[dimId].forEach(item => {
              let ansVal: any = undefined;
              if (item.section === 'A') ansVal = raw.ansA?.[item.id];
              else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
              else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
              else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
              else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

              if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
              const val = Number(ansVal);
              totalValid++;
              if (item.isReversed) {
                if (val === 1 || val === 2) totalPositive++;
              } else {
                if (val === 4 || val === 5) totalPositive++;
              }
            });
          } else {
            const score = survey.dimensiScores?.[dimId] || 3.0;
            const posRate = scoreToPercent(score);
            const expectedAnswers = DIMENSI_ITEMS[dimId].length * (survey.jumlahResponden || 1);
            totalValid += expectedAnswers;
            totalPositive += Math.round(expectedAnswers * (posRate / 100));
          }
        });

        result[pos.name] = totalValid > 0 ? parseFloat(((totalPositive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats]);

  const positionItemScores = useMemo(() => {
    const allQuestions: { id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[] = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      const result: Record<string, any> = {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
      };

      demografiStats.posisiData.forEach(pos => {
        const posSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.posisiStaf || 'Lainnya') === pos.name;
          } else {
            return (s.unitKerja || 'Perawat') === pos.name;
          }
        });

        let totalValid = 0;
        let positive = 0;

        posSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            let ansVal: any = undefined;
            if (q.section === 'A') ansVal = raw.ansA?.[q.id];
            else if (q.section === 'B') ansVal = raw.ansB?.[q.id];
            else if (q.section === 'C') ansVal = raw.ansC?.[q.id];
            else if (q.section === 'D') ansVal = raw.ansD?.[q.id];
            else if (q.section === 'F') ansVal = raw.ansF?.[q.id];

            if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
            const val = Number(ansVal);
            totalValid++;

            if (q.isReversed) {
              if (val === 1 || val === 2) positive++;
            } else {
              if (val === 4 || val === 5) positive++;
            }
          } else {
            const score = survey.dimensiScores?.[q.dim] || 3.5;
            totalValid += 1;
            if (score >= 4.0) positive++;
          }
        });

        result[pos.name] = totalValid > 0 ? parseFloat(((positive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const positionSafetyScores = useMemo(() => {
    return demografiStats.posisiData.map(pos => {
      const posSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.posisiStaf || 'Lainnya') === pos.name;
        } else {
          return (s.unitKerja || 'Perawat') === pos.name;
        }
      });

      let totalValid = 0;
      let sumRating = 0;
      let positive = 0;

      posSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
          sumRating += Number(raw.ansE);
          totalValid++;
          if (raw.ansE === 4 || raw.ansE === 5) {
            positive++;
          }
        } else {
          const score = (survey.dimensiScores as any)?.E1 || 4.0;
          sumRating += score;
          totalValid++;
          if (score >= 4.0) {
            positive++;
          }
        }
      });

      const average = totalValid > 0 ? sumRating / totalValid : 0;
      const positiveRate = totalValid > 0 ? (positive / totalValid) * 100 : 0;

      return {
        name: pos.name,
        average: parseFloat(average.toFixed(2)),
        positiveRate: parseFloat(positiveRate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const positionReportingScores = useMemo(() => {
    return demografiStats.posisiData.map(pos => {
      const posSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.posisiStaf || 'Lainnya') === pos.name;
        } else {
          return (s.unitKerja || 'Perawat') === pos.name;
        }
      });

      let totalValid = 0;
      let reportedOneOrMore = 0;

      posSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw) {
          const ansVal = raw.ansD?.[3];
          if (ansVal && ansVal !== 'Tidak ada') {
            reportedOneOrMore++;
          }
          if (ansVal) {
            totalValid++;
          }
        }
      });

      const rate = totalValid > 0 ? (reportedOneOrMore / totalValid) * 100 : 0;

      return {
        name: pos.name,
        rate: parseFloat(rate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const unitDimensionScores = useMemo(() => {
    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };

      demografiStats.unitData.forEach(u => {
        const unitSurveys = hospitalSurveys.filter(s => (s.unitKerja || 'Instansi Umum') === u.name);

        let totalPositive = 0;
        let totalValid = 0;
        unitSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            DIMENSI_ITEMS[dimId].forEach(item => {
              let ansVal: any = undefined;
              if (item.section === 'A') ansVal = raw.ansA?.[item.id];
              else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
              else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
              else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
              else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

              if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
              const val = Number(ansVal);
              totalValid++;
              if (item.isReversed) {
                if (val === 1 || val === 2) totalPositive++;
              } else {
                if (val === 4 || val === 5) totalPositive++;
              }
            });
          } else {
            const score = survey.dimensiScores?.[dimId] || 3.0;
            const rate = scoreToPercent(score);
            const expectedAnswers = DIMENSI_ITEMS[dimId].length * (survey.jumlahResponden || 1);
            totalValid += expectedAnswers;
            totalPositive += Math.round(expectedAnswers * (rate / 100));
          }
        });

        result[u.name] = totalValid > 0 ? parseFloat(((totalPositive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats]);

  const unitItemScores = useMemo(() => {
    const allQuestions: { id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[] = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      const result: Record<string, any> = {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
      };

      demografiStats.unitData.forEach(u => {
        const unitSurveys = hospitalSurveys.filter(s => (s.unitKerja || 'Instansi Umum') === u.name);

        let totalValid = 0;
        let positive = 0;

        unitSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            let ansVal: any = undefined;
            if (q.section === 'A') ansVal = raw.ansA?.[q.id];
            else if (q.section === 'B') ansVal = raw.ansB?.[q.id];
            else if (q.section === 'C') ansVal = raw.ansC?.[q.id];
            else if (q.section === 'D') ansVal = raw.ansD?.[q.id];
            else if (q.section === 'F') ansVal = raw.ansF?.[q.id];

            if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
            const val = Number(ansVal);
            totalValid++;

            if (q.isReversed) {
              if (val === 1 || val === 2) positive++;
            } else {
              if (val === 4 || val === 5) positive++;
            }
          } else {
            const score = survey.dimensiScores?.[q.dim] || 3.5;
            totalValid += 1;
            if (score >= 4.0) positive++;
          }
        });

        result[u.name] = totalValid > 0 ? parseFloat(((positive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const unitSafetyScores = useMemo(() => {
    return demografiStats.unitData.map(u => {
      const unitSurveys = hospitalSurveys.filter(s => (s.unitKerja || 'Instansi Umum') === u.name);

      let totalValid = 0;
      let sumRating = 0;
      let positive = 0;

      unitSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
          sumRating += Number(raw.ansE);
          totalValid++;
          if (raw.ansE === 4 || raw.ansE === 5) {
            positive++;
          }
        } else {
          const score = (survey.dimensiScores as any)?.E1 || 4.0;
          sumRating += score;
          totalValid++;
          if (score >= 4.0) {
            positive++;
          }
        }
      });

      const average = totalValid > 0 ? sumRating / totalValid : 0;
      const positiveRate = totalValid > 0 ? (positive / totalValid) * 100 : 0;

      return {
        name: u.name,
        average: parseFloat(average.toFixed(2)),
        positiveRate: parseFloat(positiveRate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const unitReportingScores = useMemo(() => {
    return demografiStats.unitData.map(u => {
      const unitSurveys = hospitalSurveys.filter(s => (s.unitKerja || 'Instansi Umum') === u.name);

      let totalValid = 0;
      let reportedOneOrMore = 0;

      unitSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw) {
          const ansVal = raw.ansD?.[3];
          if (ansVal && ansVal !== 'Tidak ada') {
            reportedOneOrMore++;
          }
          if (ansVal) {
            totalValid++;
          }
        }
      });

      const rate = totalValid > 0 ? (reportedOneOrMore / totalValid) * 100 : 0;

      return {
        name: u.name,
        rate: parseFloat(rate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const tenureDimensionScores = useMemo(() => {
    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };

      demografiStats.g1Data.forEach(g1 => {
        const tenureSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.ansG?.[1] || 'Tidak diisi') === g1.name;
          }
          return false;
        });

        let totalPositive = 0;
        let totalValid = 0;
        tenureSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            DIMENSI_ITEMS[dimId].forEach(item => {
              let ansVal: any = undefined;
              if (item.section === 'A') ansVal = raw.ansA?.[item.id];
              else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
              else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
              else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
              else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

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

        result[g1.name] = totalValid > 0 ? parseFloat(((totalPositive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats]);

  const tenureItemScores = useMemo(() => {
    const allQuestions: { id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[] = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      const result: Record<string, any> = {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
      };

      demografiStats.g1Data.forEach(g1 => {
        const tenureSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.ansG?.[1] || 'Tidak diisi') === g1.name;
          }
          return false;
        });

        let totalValid = 0;
        let positive = 0;

        tenureSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            let ansVal: any = undefined;
            if (q.section === 'A') ansVal = raw.ansA?.[q.id];
            else if (q.section === 'B') ansVal = raw.ansB?.[q.id];
            else if (q.section === 'C') ansVal = raw.ansC?.[q.id];
            else if (q.section === 'D') ansVal = raw.ansD?.[q.id];
            else if (q.section === 'F') ansVal = raw.ansF?.[q.id];

            if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
            const val = Number(ansVal);
            totalValid++;

            if (q.isReversed) {
              if (val === 1 || val === 2) positive++;
            } else {
              if (val === 4 || val === 5) positive++;
            }
          }
        });

        result[g1.name] = totalValid > 0 ? parseFloat(((positive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const tenureSafetyScores = useMemo(() => {
    return demografiStats.g1Data.map(g1 => {
      const tenureSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.ansG?.[1] || 'Tidak diisi') === g1.name;
        }
        return false;
      });

      let totalValid = 0;
      let sumRating = 0;
      let positive = 0;

      tenureSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
          sumRating += Number(raw.ansE);
          totalValid++;
          if (raw.ansE === 4 || raw.ansE === 5) {
            positive++;
          }
        }
      });

      const average = totalValid > 0 ? sumRating / totalValid : 0;
      const positiveRate = totalValid > 0 ? (positive / totalValid) * 100 : 0;

      return {
        name: g1.name,
        average: parseFloat(average.toFixed(2)),
        positiveRate: parseFloat(positiveRate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const tenureReportingScores = useMemo(() => {
    return demografiStats.g1Data.map(g1 => {
      const tenureSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.ansG?.[1] || 'Tidak diisi') === g1.name;
        }
        return false;
      });

      let totalValid = 0;
      let reportedOneOrMore = 0;

      tenureSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw) {
          const ansVal = raw.ansD?.[3];
          if (ansVal && ansVal !== 'Tidak ada') {
            reportedOneOrMore++;
          }
          if (ansVal) {
            totalValid++;
          }
        }
      });

      const rate = totalValid > 0 ? (reportedOneOrMore / totalValid) * 100 : 0;

      return {
        name: g1.name,
        rate: parseFloat(rate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const interactionDimensionScores = useMemo(() => {
    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };

      demografiStats.g4Data.forEach(g4 => {
        const interactionSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.ansG?.[4] || 'Tidak diisi') === g4.name;
          }
          return false;
        });

        let totalPositive = 0;
        let totalValid = 0;
        interactionSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            DIMENSI_ITEMS[dimId].forEach(item => {
              let ansVal: any = undefined;
              if (item.section === 'A') ansVal = raw.ansA?.[item.id];
              else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
              else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
              else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
              else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

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

        result[g4.name] = totalValid > 0 ? parseFloat(((totalPositive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats]);

  const interactionItemScores = useMemo(() => {
    const allQuestions: { id: number; code: string; text: string; dim: string; isReversed?: boolean; section: string }[] = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      const result: Record<string, any> = {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
      };

      demografiStats.g4Data.forEach(g4 => {
        const interactionSurveys = hospitalSurveys.filter(s => {
          const raw = (s.dimensiScores as any)?._rawAnswers;
          if (raw) {
            return (raw.ansG?.[4] || 'Tidak diisi') === g4.name;
          }
          return false;
        });

        let totalValid = 0;
        let positive = 0;

        interactionSurveys.forEach(survey => {
          const raw = (survey.dimensiScores as any)?._rawAnswers;
          if (raw) {
            let ansVal: any = undefined;
            if (q.section === 'A') ansVal = raw.ansA?.[q.id];
            else if (q.section === 'B') ansVal = raw.ansB?.[q.id];
            else if (q.section === 'C') ansVal = raw.ansC?.[q.id];
            else if (q.section === 'D') ansVal = raw.ansD?.[q.id];
            else if (q.section === 'F') ansVal = raw.ansF?.[q.id];

            if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
            const val = Number(ansVal);
            totalValid++;

            if (q.isReversed) {
              if (val === 1 || val === 2) positive++;
            } else {
              if (val === 4 || val === 5) positive++;
            }
          }
        });

        result[g4.name] = totalValid > 0 ? parseFloat(((positive / totalValid) * 100).toFixed(1)) : 0;
      });

      return result;
    });
  }, [hospitalSurveys, demografiStats, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const interactionSafetyScores = useMemo(() => {
    return demografiStats.g4Data.map(g4 => {
      const interactionSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.ansG?.[4] || 'Tidak diisi') === g4.name;
        }
        return false;
      });

      let totalValid = 0;
      let sumRating = 0;
      let positive = 0;

      interactionSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
          sumRating += Number(raw.ansE);
          totalValid++;
          if (raw.ansE === 4 || raw.ansE === 5) {
            positive++;
          }
        }
      });

      const average = totalValid > 0 ? sumRating / totalValid : 0;
      const positiveRate = totalValid > 0 ? (positive / totalValid) * 100 : 0;

      return {
        name: g4.name,
        average: parseFloat(average.toFixed(2)),
        positiveRate: parseFloat(positiveRate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const interactionReportingScores = useMemo(() => {
    return demografiStats.g4Data.map(g4 => {
      const interactionSurveys = hospitalSurveys.filter(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          return (raw.ansG?.[4] || 'Tidak diisi') === g4.name;
        }
        return false;
      });

      let totalValid = 0;
      let reportedOneOrMore = 0;

      interactionSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw) {
          const ansVal = raw.ansD?.[3];
          if (ansVal && ansVal !== 'Tidak ada') {
            reportedOneOrMore++;
          }
          if (ansVal) {
            totalValid++;
          }
        }
      });

      const rate = totalValid > 0 ? (reportedOneOrMore / totalValid) * 100 : 0;

      return {
        name: g4.name,
        rate: parseFloat(rate.toFixed(1)),
        count: totalValid
      };
    });
  }, [hospitalSurveys, demografiStats]);

  const DIMENSION_ORDER = [
    'd7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'
  ];

  const getCellColorClass = (val: number | null) => {
    if (val === null) return 'text-slate-500 font-medium';
    if (val >= 75) return 'text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
    if (val >= 50) return 'text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
    return 'text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg px-2.5 py-1.5 font-bold inline-block whitespace-nowrap';
  };

  const averageBenchmark = useMemo(() => {
    let sum = 0;
    DIMENSION_ORDER.forEach(dimId => {
      const bMin = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
      const bMax = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
      sum += (bMin + bMax) / 2;
    });
    return sum / DIMENSION_ORDER.length;
  }, [masterBenchmarkData]);

  const getAverageCompositeForUnit = (unit: string) => {
    let sum = 0;
    let count = 0;
    unitDimensionScores.forEach(row => {
      if (row[unit] !== undefined && row[unit] !== 0) {
        sum += row[unit];
        count++;
      }
    });
    return count > 0 ? sum / count : null;
  };

  const getAverageCompositeForPosition = (position: string) => {
    let sum = 0;
    let count = 0;
    positionDimensionScores.forEach(row => {
      if (row[position] !== undefined && row[position] !== 0) {
        sum += row[position];
        count++;
      }
    });
    return count > 0 ? sum / count : null;
  };

  const getInteraksiStats = (dimId: string, type: 'langsung' | 'tidak') => {
    const interaksiSurveys = hospitalSurveys.filter(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (!raw || !raw.ansG) return false;
      const isLangsung = raw.ansG[4] === 'YA, saya melakukan interaksi atau kontak langsung dengan pasien';
      return type === 'langsung' ? isLangsung : !isLangsung;
    });

    let totalPositive = 0;
    let totalValid = 0;

    interaksiSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        DIMENSI_ITEMS[dimId].forEach(item => {
          const ansKey = 'ans' + item.section;
          const ansVal = (raw as any)[ansKey] ? (raw as any)[ansKey][item.id] : undefined;

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

    return {
      percentage: totalValid > 0 ? (totalPositive / totalValid) * 100 : null,
      count: interaksiSurveys.length
    };
  };

  const getAverageInteraksiStats = (type: 'langsung' | 'tidak') => {
    let sum = 0;
    let count = 0;
    DIMENSION_ORDER.forEach(dimId => {
      const { percentage } = getInteraksiStats(dimId, type);
      if (percentage !== null) {
        sum += percentage;
        count++;
      }
    });
    return count > 0 ? sum / count : null;
  };

  const countLangsung = useMemo(() => getInteraksiStats(DIMENSION_ORDER[0], 'langsung').count, [hospitalSurveys]);
  const countTidakLangsung = useMemo(() => getInteraksiStats(DIMENSION_ORDER[0], 'tidak').count, [hospitalSurveys]);

  const mainCards = [
    {
      id: 'hospital',
      title: 'Hasil Survei Budaya Keselamatan Rumah Sakit Anda',
      description: 'Menampilkan seluruh hasil analisis berdasarkan data survei rumah sakit',
      icon: <ClipboardCheck />,
      color: 'from-[#2563EB] to-[#1D4ED8]'
    },
    {
      id: 'benchmark',
      title: 'Hasil Perbandingan Dengan Rumah Sakit Percontohan',
      description: 'Analisis Perbandingan hasil survei dengan rumah sakit percontohan.',
      icon: <Building2 />,
      color: 'from-[#10B981] to-[#059669]'
    },
    {
      id: 'position',
      title: 'Hasil Perbandingan Berdasarkan Posisi Staf',
      description: 'Eksplorasi persepsi budaya keselamatan berdasarkan peran dan posisi staf.',
      icon: <Users />,
      color: 'from-[#F59E0B] to-[#F97316]'
    },
    {
      id: 'unit',
      title: 'Hasil Perbandingan Berdasarkan Unit / Area Kerja',
      description: 'Analisis Perbandingan budaya keselamatan antar unit / area kerja di rumah sakit.',
      icon: <Hospital />,
      color: 'from-[#14B8A6] to-[#0D9488]'
    },
    {
      id: 'interaction',
      title: 'Hasil Perbandingan Berdasarkan Interaksi Dengan Pasien',
      description: 'Korelasi budaya keselamatan dengan tingkat interaksi langsung staf dengan pasien.',
      icon: <HeartHandshake />,
      color: 'from-[#7C3AED] to-[#6366F1]'
    },
    {
      id: 'tenure',
      title: 'Hasil Perbandingan Berdasarkan Masa Jabatan / Lama Kerja',
      description: 'Analisis tren budaya keselamatan dikaitkan dengan pengalaman masa kerja staf.',
      icon: <Clock3 />,
      color: 'from-[#F97316] to-[#FB7185]'
    }
  ];

  return (
    <div className="h-full w-full bg-slate-50 overflow-y-auto p-0 font-sans">
      <AnimatePresence mode="wait">
        {activeView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-blue-900/30 mb-12 border border-white/20 backdrop-blur-xl group">
              {/* Decorative Glass Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <h1 className="text-[35px] font-black text-white tracking-tight">
                    Analisa Data
                  </h1>
                </div>
                <p className="text-blue-50 text-[16px] font-medium leading-relaxed max-w-4xl opacity-90">
                  Analisis komprehensif hasil Survei Budaya Keselamatan Pasien AHRQ SOPS 2.0 secara interaktif, realtime, dan terintegrasi dengan seluruh data survei.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
              {mainCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -12, scale: 1.03 }}
                  className="bg-white rounded-[28px] p-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col cursor-pointer group relative mt-[35px] backdrop-blur-md min-h-[300px]"
                  onClick={() => { setActiveView(card.id as any); setBenchmarkSubView(null); setPositionSubView(null); setUnitSubView(null); setTenureSubView(null); }}
                >
                  {/* Ribbon/Header */}
                  <div className={`absolute top-0 left-0 right-0 h-[24px] bg-gradient-to-r ${card.color} rounded-t-[28px] opacity-90 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Badge */}
                  <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 w-[70px] h-[70px] rounded-full bg-white/30 backdrop-blur-xl border-[4px] border-white shadow-[0_8px_16px_rgba(0,0,0,0.10)] flex items-center justify-center z-10 group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out">
                    <div className={`w-[54px] h-[54px] rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-[24px] font-bold shadow-inner`}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Content area offset for ribbon */}
                  <div className="mt-6 z-10 flex flex-col flex-1">
                    <h3 className="text-[24px] font-bold text-[#1F2937] mb-3 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-gray-600 transition-all font-['Poppins']">
                      {card.title}
                    </h3>
                    
                    <p className="text-[16px] font-normal text-[#6B7280] leading-[1.7] flex-1 mb-8">
                      {card.description}
                    </p>

                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
                       {/* Left side button */}
                       <div className="flex items-center gap-2 bg-[#2563EB] group-hover:bg-gradient-to-r group-hover:from-[#2563EB] group-hover:to-[#1D4ED8] text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                          Lihat Analisa
                          <ArrowRight className="w-4 h-4" />
                       </div>
                       
                       {/* Right side Icon */}
                       <div className="opacity-85 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 origin-bottom-right">
                          {React.cloneElement(card.icon as React.ReactElement<any>, { className: "w-[40px] h-[40px] text-gray-300 group-hover:text-[#1F2937] transition-colors duration-300" })}
                       </div>
                    </div>
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
                onClick={() => {
                  if (benchmarkSubView) {
                    setBenchmarkSubView(null);
                  } else if (hospitalSubView) {
                    setHospitalSubView(null);
                  } else if (positionSubView) {
                    setPositionSubView(null);
                  } else if (unitSubView) {
                    setUnitSubView(null);
                  } else if (tenureSubView) {
                    setTenureSubView(null);
                  } else if (interactionSubView) {
                    setInteractionSubView(null);
                  } else {
                    setActiveView('main');
                  }
                }}
                className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="pt-0 pb-0 mt-0">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {benchmarkSubView || hospitalSubView || positionSubView || unitSubView || tenureSubView || interactionSubView || mainCards.find(c => c.id === activeView)?.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  {(benchmarkSubView || hospitalSubView || positionSubView || unitSubView || tenureSubView || interactionSubView) ? 'Detail Analisis' : mainCards.find(c => c.id === activeView)?.description}
                </p>
              </div>
            </div>

            {activeView === 'benchmark' ? (
              !benchmarkSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Hospital className="w-5 h-5 text-blue-600" /> Pilih Tahun Survei
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto py-0 mt-0">
                  {[
                    { 
                      title: <>Perbandingan<br/>Pengukuran Dimensi</>, 
                      desc: 'Lihat perbandingan agregat dimensi.', 
                      icon: <BarChart3 className="w-[38px] h-[38px] text-[#2563EB] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />,
                      num: '01',
                      quarterColor: 'bg-[#2563EB]',
                      lineColor: 'bg-[#2563EB]',
                      cardAlign: 'justify-start items-start',
                      headerClasses: 'flex-row',
                      quarterClasses: 'bottom-0 right-0 rounded-tl-full',
                      quarterPadding: 'pt-8 pl-8',
                      iconPos: 'right',
                      textAlign: 'text-left',
                      iconAlign: 'items-start',
                      titleName: 'Perbandingan Pengukuran Dimensi',
                      iconAbsoluteClass: 'bottom-10 left-10'
                    },
                    { 
                      title: <>Perbandingan Hasil<br/>Per Item</>, 
                      desc: 'Modul Sedang Dalam Pengembangan', 
                      icon: <ListChecks className="w-[38px] h-[38px] text-[#14B8A6] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />,
                      num: '02',
                      quarterColor: 'bg-[#14B8A6]',
                      lineColor: 'bg-[#14B8A6]',
                      cardAlign: 'justify-start items-end',
                      headerClasses: 'flex-row-reverse',
                      quarterClasses: 'bottom-0 left-0 rounded-tr-full',
                      quarterPadding: 'pt-8 pr-8',
                      iconPos: 'left',
                      textAlign: 'text-right',
                      iconAlign: 'items-end',
                      titleName: 'Perbandingan Hasil Per Item',
                      iconAbsoluteClass: 'bottom-10 right-10'
                    },
                    { 
                      title: <>Perbandingan Penilaian<br/>Keselamatan Pasien</>, 
                      desc: 'Lihat perbandingan tingkat keselamatan pasien (E1).', 
                      icon: <HeartPulse className="w-[38px] h-[38px] text-[#F97316] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />,
                      num: '03',
                      quarterColor: 'bg-[#F97316]',
                      lineColor: 'bg-[#F97316]',
                      cardAlign: 'justify-end items-start',
                      headerClasses: 'flex-row',
                      quarterClasses: 'top-0 right-0 rounded-bl-full',
                      quarterPadding: 'pb-8 pl-8',
                      iconPos: 'left',
                      textAlign: 'text-left',
                      iconAlign: 'items-start',
                      titleName: 'Perbandingan Penilaian Keselamatan Pasien',
                      iconAbsoluteClass: 'top-10 left-10',
                      h3Classes: 'mr-[54px] ml-0 pt-0 text-left'
                    },
                    { 
                      title: <>Perbandingan Jumlah<br/>Peristiwa Dilaporkan</>, 
                      desc: 'Perbandingan distribusi jumlah kejadian keselamatan pasien.', 
                      icon: <TriangleAlert className="w-[38px] h-[38px] text-[#10B981] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />,
                      num: '04',
                      quarterColor: 'bg-[#10B981]',
                      lineColor: 'bg-[#10B981]',
                      cardAlign: 'justify-end items-start',
                      headerClasses: 'flex-row',
                      quarterClasses: 'top-0 left-0 rounded-br-full',
                      quarterPadding: 'pb-8 pr-8',
                      iconPos: 'right',
                      textAlign: 'text-left',
                      iconAlign: 'items-start',
                      titleName: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan',
                      iconAbsoluteClass: 'top-10 right-10',
                      h3Classes: 'ml-[54px]'
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => setBenchmarkSubView(item.titleName)}
                      className={`bg-white rounded-[40px] p-8 md:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] transition-all duration-500 group min-h-[320px] flex flex-col ${item.cardAlign} cursor-pointer relative overflow-hidden`}
                    >
                      {/* Mobile Badge */}
                      <div className={`md:hidden absolute top-6 ${item.iconPos === 'right' ? 'right-6' : 'left-6'} w-12 h-12 rounded-full ${item.quarterColor} flex items-center justify-center font-black text-white text-lg shadow-lg z-20`}>
                        {item.num}
                      </div>

                      <div className="flex flex-col w-full relative z-10 gap-5">
                        {/* Title and line */}
                        <div className="flex justify-between items-start w-full">
                          <div className={`flex flex-col ${item.iconAlign} w-full`}>
                            <h3 className={`text-[20px] md:text-[22px] font-bold text-slate-800 leading-[1.3] uppercase ${item.textAlign} ${item.h3Classes || ''}`}>
                              {item.title}
                            </h3>
                            <div className={`w-16 h-[3px] ${item.lineColor} mt-4 group-hover:w-24 transition-all duration-500 rounded-full`}></div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className={`text-[15px] text-slate-500 leading-[1.6] max-w-[90%] font-medium ${item.textAlign}`}>
                          {item.desc}
                        </p>
                      </div>

                      {/* Desktop Absolute Icon */}
                      <div className={`hidden md:block absolute ${item.iconAbsoluteClass} z-10`}>
                        {item.icon}
                      </div>

                      {/* Desktop Quarter Circle */}
                      <div className={`hidden md:flex absolute ${item.quarterClasses} w-[160px] h-[160px] ${item.quarterColor} flex-col items-center justify-center z-0 origin-center group-hover:scale-105 transition-transform duration-500 ease-out`}>
                        <div className={`flex flex-col items-center justify-center ${item.quarterPadding} w-full h-full`}>
                          <span className="text-white/90 text-[11px] font-bold tracking-[0.2em] uppercase mb-0.5">Hasil</span>
                          <span className="text-white font-black text-[42px] leading-none tracking-tight">{item.num}</span>
                          <span className="text-white/90 text-[9px] font-bold tracking-[0.1em] mt-1.5 uppercase text-center leading-tight whitespace-nowrap">Menu<br/>Analisis</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              ) : benchmarkSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Mode Selector and Filters */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setMode('Tunggal')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Tunggal
                      </button>
                      <button 
                        onClick={() => setMode('Perbandingan')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                                            style={{ transformOrigin: 'left', width: `${row.Capaian}%` }}
                                            className={`h-full ${getBarColor(row.Capaian)} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform`}
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
                                              style={{ transformOrigin: 'left', width: `${row['Tahun 1']}%` }}
                                              className={`h-full ${getBarColor(row['Tahun 1'])} relative group-hover:brightness-110 transition-all transform-gpu opacity-70 will-change-transform`}
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
                                              style={{ transformOrigin: 'left', width: `${row['Tahun 2']}%` }}
                                              className={`h-full ${getBarColor(row['Tahun 2'])} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform`}
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
              ) : benchmarkSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Mode Selector and Filters */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setMode('Tunggal')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Tunggal
                      </button>
                      <button 
                        onClick={() => setMode('Perbandingan')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-200 p-6 md:p-8 rounded-[24px] shadow-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-teal-600" />
                      Perbandingan Penilaian Keselamatan Pasien
                    </h3>
                    <p className="text-sm text-slate-500 mb-8">Bagaimana Anda menilai tingkat keselamatan pasien di unit kerja Anda? (Butir E1)</p>
                    
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={e1Stats} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <filter id="shadow-raised" x="-10%" y="-15%" width="125%" height="135%">
                              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.25" />
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                          <XAxis dataKey="kategori" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                          <YAxis type="number" domain={[0, 100]} stroke="#64748b" tickFormatter={(val) => `${val}%`} />
                          <RechartsTooltip content={<E1Tooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#475569', fontSize: '13px', fontWeight: 'bold' }} />
                          <Bar isAnimationActive={false} dataKey="Rumah Sakit Anda" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} filter="url(#shadow-raised)">
                            <LabelList dataKey="Rumah Sakit Anda" position="top" formatter={(val: number) => `${val.toFixed(1)}%`} fill="#059669" fontSize={11} fontWeight="bold" />
                            {e1Stats.map((entry, index) => (
                              <Cell key={`cell-rs-${index}`} fill="#10b981" />
                            ))}
                          </Bar>
                          <Bar isAnimationActive={false} dataKey="Data Pembanding" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={60} filter="url(#shadow-raised)">
                            <LabelList dataKey="Data Pembanding" position="top" formatter={(val: number) => `${val}%`} fill="#475569" fontSize={11} fontWeight="bold" />
                            {e1Stats.map((entry, index) => (
                              <Cell key={`cell-bp-${index}`} fill="#64748b" />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>
              ) : benchmarkSubView === 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Mode Selector and Filters */}
                  <div className="flex flex-col gap-6 bg-white border border-slate-200 p-6 rounded-[20px] shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setMode('Tunggal')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Periode Tunggal
                        </button>
                        <button 
                          onClick={() => setMode('Perbandingan')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Perbandingan (2 Periode)
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {mode === 'Tunggal' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                            <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Bandingkan:</span>
                            <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="text-slate-400 font-bold">VS</span>
                            <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Unit Filter */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Kerja</label>
                        <select 
                          value={filterUnit} 
                          onChange={e => setFilterUnit(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer transition-all truncate"
                        >
                          <option value="Semua">Semua Unit Kerja ({uniqueUnits.length})</option>
                          {uniqueUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>

                      {/* Profesi Filter */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profesi / Jabatan</label>
                        <select 
                          value={filterProfesi} 
                          onChange={e => setFilterProfesi(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer transition-all truncate"
                        >
                          <option value="Semua">Semua Profesi ({uniqueProfesi.length})</option>
                          {uniqueProfesi.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tenure RS Filter */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Kerja RS</label>
                        <select 
                          value={filterTenureRS} 
                          onChange={e => setFilterTenureRS(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer transition-all truncate"
                        >
                          <option value="Semua">Semua Masa Kerja RS</option>
                          <option value="Kurang dari 1 tahun">Kurang dari 1 tahun</option>
                          <option value="1 hingga 5 tahun">1 hingga 5 tahun</option>
                          <option value="6 hingga 10 tahun">6 hingga 10 tahun</option>
                          <option value="11 tahun atau lebih">11 tahun atau lebih</option>
                        </select>
                      </div>

                      {/* Tenure Unit Filter */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Kerja Unit</label>
                        <select 
                          value={filterTenureUnit} 
                          onChange={e => setFilterTenureUnit(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer transition-all truncate"
                        >
                          <option value="Semua">Semua Masa Kerja Unit</option>
                          <option value="Kurang dari 1 tahun">Kurang dari 1 tahun</option>
                          <option value="1 hingga 5 tahun">1 hingga 5 tahun</option>
                          <option value="6 hingga 10 tahun">6 hingga 10 tahun</option>
                          <option value="11 tahun atau lebih">11 tahun atau lebih</option>
                        </select>
                      </div>

                      {/* Interaction Filter */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interaksi Pasien</label>
                        <select 
                          value={filterInteraction} 
                          onChange={e => setFilterInteraction(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer transition-all truncate"
                        >
                          <option value="Semua">Semua Interaksi</option>
                          <option value="YA, saya melakukan interaksi atau kontak langsung dengan pasien">Hanya Interaksi Langsung</option>
                          <option value="TIDAK, saya TIDAK melakukan interaksi atau kontak langsung dengan pasien">Tanpa Interaksi Langsung</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main Chart Card - Glassmorphism 2.0 style */}
                  <div className="bg-white rounded-[24px] shadow-[0_12px_40px_rgba(37,99,235,0.12)] border border-[rgba(37,99,235,0.10)] overflow-hidden">
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-8 text-white flex items-center justify-between">
                      <div className="space-y-1.5">
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Perbandingan Jumlah Peristiwa yang Dilaporkan</h2>
                        <p className="text-xs md:text-sm text-blue-100/80 font-medium">Membandingkan distribusi frekuensi pelaporan insiden keselamatan pasien dengan Rumah Sakit Percontohan</p>
                      </div>
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shrink-0 hidden sm:block">
                        <Activity className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                      {/* Sub-header info or reset filters */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                          <span>Total Responden Aktif:</span>
                          <span className="text-sm font-extrabold text-blue-800">{reportedEventsComparisonStats.total}</span>
                        </div>
                        {(filterUnit !== 'Semua' || filterProfesi !== 'Semua' || filterTenureRS !== 'Semua' || filterTenureUnit !== 'Semua' || filterInteraction !== 'Semua') && (
                          <button 
                            onClick={() => {
                              setFilterUnit('Semua');
                              setFilterProfesi('Semua');
                              setFilterTenureRS('Semua');
                              setFilterTenureUnit('Semua');
                              setFilterInteraction('Semua');
                            }}
                            className="text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Reset Semua Filter
                          </button>
                        )}
                      </div>

                      {/* Chart Area */}
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart 
                            data={[
                              {
                                kategori: 'Tidak Pernah',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['Tidak ada'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['Tidak ada'],
                                'Rumah Sakit Percontohan': 45,
                                'Rumah Sakit Percontohan Count': 4862,
                              },
                              {
                                kategori: '1–2 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['1 sampai 2'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['1 sampai 2'],
                                'Rumah Sakit Percontohan': 28,
                                'Rumah Sakit Percontohan Count': 3025,
                              },
                              {
                                kategori: '3–5 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['3 sampai 5'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['3 sampai 5'],
                                'Rumah Sakit Percontohan': 15,
                                'Rumah Sakit Percontohan Count': 1621,
                              },
                              {
                                kategori: '6–10 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['6 hingga 10'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['6 hingga 10'],
                                'Rumah Sakit Percontohan': 8,
                                'Rumah Sakit Percontohan Count': 864,
                              },
                              {
                                kategori: '≥11 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['11 atau lebih'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['11 atau lebih'],
                                'Rumah Sakit Percontohan': 4,
                                'Rumah Sakit Percontohan Count': 433,
                              },
                            ]} 
                            margin={{ top: 25, right: 10, left: -10, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient id="royalBlueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563EB" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                              </linearGradient>
                              <filter id="re-shadow" x="-5%" y="-10%" width="110%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.15" />
                              </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                            <XAxis 
                              dataKey="kategori" 
                              stroke="#64748b" 
                              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} 
                              tickLine={false}
                            />
                            <YAxis 
                              type="number" 
                              domain={[0, 100]} 
                              tickCount={11} 
                              stroke="#64748b" 
                              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                              tickLine={false}
                              tickFormatter={(val) => `${val}%`} 
                            />
                            <RechartsTooltip content={<ReportedEventsTooltip />} cursor={{ fill: 'rgba(37,99,235,0.02)' }} />
                            <Legend 
                              verticalAlign="top" 
                              align="right"
                              height={40} 
                              iconType="circle"
                              iconSize={10}
                              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} 
                            />
                            <Bar 
                              isAnimationActive={false} 
                              dataKey="Rumah Sakit Anda" 
                              fill="url(#royalBlueGrad)" 
                              radius={[6, 6, 0, 0]} 
                              maxBarSize={55} 
                              filter="url(#re-shadow)"
                            >
                              <LabelList 
                                dataKey="Rumah Sakit Anda" 
                                position="top" 
                                formatter={(val: number) => `${val.toFixed(1)}%`} 
                                fill="#1d4ed8" 
                                fontSize={11} 
                                fontWeight="bold" 
                              />
                            </Bar>
                            <Bar 
                              isAnimationActive={false} 
                              dataKey="Rumah Sakit Percontohan" 
                              fill="#E5E7EB" 
                              stroke="#9CA3AF" 
                              strokeWidth={1} 
                              radius={[6, 6, 0, 0]} 
                              maxBarSize={55}
                            >
                              <LabelList 
                                dataKey="Rumah Sakit Percontohan" 
                                position="top" 
                                formatter={(val: number) => `${val}%`} 
                                fill="#4b5563" 
                                fontSize={11} 
                                fontWeight="bold" 
                              />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Dynamic AI Analysis and Recommendations */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                        {/* Dynamic AI Interpretation Card */}
                        <div className="space-y-4 bg-blue-50/50 border border-blue-100 p-6 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                          <h4 className="text-sm font-extrabold text-blue-900 tracking-wider uppercase flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-600" /> Interpretasi & Analisis Otomatis AI
                          </h4>
                          <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                            {(() => {
                              const categories = [
                                { key: 'Tidak ada', label: 'Tidak Pernah Melaporkan Kejadian', bm: 45 },
                                { key: '1 sampai 2', label: 'Melaporkan 1-2 Kejadian', bm: 28 },
                                { key: '3 sampai 5', label: 'Melaporkan 3-5 Kejadian', bm: 15 },
                                { key: '6 hingga 10', label: 'Melaporkan 6-10 Kejadian', bm: 8 },
                                { key: '11 atau lebih', label: 'Melaporkan 11 atau lebih Kejadian', bm: 4 }
                              ];
                              
                              let maxCat = categories[0];
                              let maxPct = 0;
                              categories.forEach(c => {
                                const pct = reportedEventsComparisonStats.percentages[c.key as keyof typeof reportedEventsComparisonStats.percentages];
                                if (pct > maxPct) {
                                  maxPct = pct;
                                  maxCat = c;
                                }
                              });

                              if (maxPct === 0) {
                                return "Belum ada data survei keselamatan pasien yang terintegrasi untuk filter yang dipilih. Silakan isi data survei terlebih dahulu di menu Input Data atau sesuaikan filter Anda.";
                              }

                              const isTidakPernahMax = maxCat.key === 'Tidak ada';

                              return (
                                <span>
                                  Berdasarkan hasil survei, mayoritas responden Rumah Sakit Anda berada pada kategori <strong>&ldquo;Tidak Pernah Melaporkan Kejadian&rdquo;</strong> sebesar <strong>{maxPct.toFixed(1)}%</strong>, sedangkan rata-rata Rumah Sakit Percontohan sebesar <strong>{maxCat.bm}%</strong>. {
                                    isTidakPernahMax && maxPct > 45 
                                      ? 'Hal ini menunjukkan adanya kecenderungan pelaporan insiden yang masih lebih rendah dibandingkan rumah sakit pembanding. Diperlukan penguatan budaya pelaporan yang non-punitif, peningkatan edukasi mengenai Incident Reporting, serta penyederhanaan mekanisme pelaporan agar seluruh staf terdorong untuk melaporkan setiap kejadian keselamatan pasien.'
                                      : 'Hal ini menggambarkan dinamika pelaporan keselamatan pasien di lingkungan kerja Anda. Penting bagi manajemen untuk terus menjaga transparansi dan kemudahan pelaporan tanpa rasa takut akan sanksi (non-punitive culture) guna meningkatkan keselamatan pasien secara berkelanjutan.'
                                  }
                                </span>
                              );
                            })()}
                          </p>
                        </div>

                        {/* Standard AHRQ sops 2.0 Recommendations */}
                        <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                          <h4 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-indigo-600" /> Rekomendasi Peningkatan Pelaporan
                          </h4>
                          <ul className="text-xs md:text-sm text-slate-600 space-y-3.5">
                            {[
                              { text: "Meningkatkan budaya pelaporan insiden tanpa menyalahkan individu (Non-Punitive Culture).", icon: "✨" },
                              { text: "Melakukan sosialisasi pentingnya pelaporan IKP (Insiden Keselamatan Pasien) kepada seluruh staf.", icon: "📢" },
                              { text: "Menyederhanakan proses pelaporan melalui sistem digital terintegrasi yang mudah diakses.", icon: "📱" },
                              { text: "Melaksanakan monitoring tren pelaporan dan tindak lanjut insiden setiap bulan.", icon: "📈" },
                              { text: "Membandingkan capaian pelaporan dengan benchmark Rumah Sakit Percontohan secara berkala.", icon: "🔍" },
                              { text: "Menjadikan hasil analisis pelaporan sebagai dasar penyusunan program keselamatan pasien.", icon: "🛡️" }
                            ].map((rec, i) => (
                              <li key={i} className="flex gap-2.5 items-start">
                                <span className="bg-white shadow-sm border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0">{rec.icon}</span>
                                <span className="font-medium leading-relaxed text-slate-700">{rec.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : benchmarkSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Mode Selector and Filters */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setMode('Tunggal')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Tunggal
                      </button>
                      <button 
                        onClick={() => setMode('Perbandingan')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Perbandingan
                      </button>
                    </div>
                    
                    {mode === 'Tunggal' ? (
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 1:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 2:</span>
                          <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legend Info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500 shadow-sm"></div>
                        <span className="text-[11px] font-bold text-slate-600">Positif</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-500 shadow-sm"></div>
                        <span className="text-[11px] font-bold text-slate-600">Netral</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-rose-500 shadow-sm"></div>
                        <span className="text-[11px] font-bold text-slate-600">Negatif</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-slate-400 shadow-sm"></div>
                        <span className="text-[11px] font-bold text-slate-600">Tidak Menjawab / Tidak Tahu</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg tracking-wider uppercase">
                      Pembanding RS Percontohan (AHRQ)
                    </div>
                  </div>

                  {/* Dimension Grid list */}
                  <div className="grid grid-cols-1 gap-8">
                    {DIMENSION_ORDER.map((dimId, index) => {
                      const dimInfo = DIMENSI_INFO[dimId];
                      const questions = ALL_QUESTIONS.filter(q => q.dim === dimId);
                      
                      let sumPosPercent = 0;
                      let sumPosPercent2 = 0;
                      const qStats = questions.map(q => {
                        const stat = calculateQuestionStats(q);
                        const stat2 = mode === 'Perbandingan' ? calculateQuestionStats(q, hospitalSurveys2) : null;
                        sumPosPercent += stat.posPercent;
                        if (stat2) sumPosPercent2 += stat2.posPercent;
                        return { q, stat, stat2 };
                      });
                      const avgPosPercent = questions.length > 0 ? Math.round(sumPosPercent / questions.length) : 0;
                      const avgPosPercent2 = questions.length > 0 ? Math.round(sumPosPercent2 / questions.length) : 0;
                      const status = getDimensionStatus(avgPosPercent);
                      const status2 = getDimensionStatus(avgPosPercent2);

                      const bMin = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
                      const bMax = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;

                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          key={dimId} 
                          className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all group"
                        >
                          {/* Card Header */}
                          <div className="p-6 bg-slate-50/50 border-b border-slate-150 relative flex items-center gap-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-indigo-600"></div>
                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                              <span className="text-xl font-black text-indigo-600">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">{dimInfo.nama}</h3>
                              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-3xl">{dimInfo.deskripsi}</p>
                            </div>
                          </div>

                          {/* Questions Table */}
                          <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                              <thead>
                                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/30">
                                  <th className="p-4 w-16 text-center align-bottom">Item</th>
                                  <th className="p-4 align-bottom">Pernyataan / Kuesioner</th>
                                  <th className="p-4 align-bottom text-center">Persentase Respons Pasien (Positif/Netral/Negatif)</th>
                                  <th className="p-4 w-44 text-center border-l border-slate-150 bg-slate-50/60">
                                    <div>Rata-rata RS Percontohan<br/>(% Respons Positif)</div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-200 text-teal-600">
                                      <span className="w-1/2 text-center text-[9px]">MIN</span>
                                      <span className="w-1/2 text-center border-l border-slate-200 text-[9px]">MAX</span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {qStats.map(({ q, stat, stat2 }) => (
                                  <tr key={q.id} className="hover:bg-slate-50/30 transition-colors group">
                                    {/* Item Code */}
                                    <td className="p-4 text-center align-top pt-5">
                                      <span className="text-[14px] font-black text-indigo-600 leading-none">{q.code}{q.isReversed && !q.code.endsWith('R') ? 'R' : ''}</span>
                                      <div className="w-5 h-0.5 bg-indigo-500 mt-2 mx-auto rounded-full"></div>
                                    </td>
                                    {/* Item Text */}
                                    <td className="p-4 font-semibold text-slate-700 text-xs align-top pt-5 pr-4 leading-relaxed max-w-[280px]">
                                      {q.text}
                                    </td>
                                    {/* Bar charts (Tunggal or Perbandingan) */}
                                    <td className="p-4 align-middle py-4">
                                      <div className="flex flex-col gap-2 w-full">
                                        <div className="flex items-center gap-3">
                                          {mode === 'Perbandingan' && <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun1}</span>}
                                          <div className={`flex-1 ${mode === 'Tunggal' ? 'h-8' : 'h-6'} flex rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative`}>
                                            <div
                                              className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                              style={{ width: `${stat.posPercent}%` }}
                                            >
                                              {stat.posPercent >= 10 && <span className="text-[9px] font-black text-white">{stat.posPercent}%</span>}
                                            </div>
                                            <div
                                              className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                              style={{ width: `${stat.neuPercent}%` }}
                                            >
                                              {stat.neuPercent >= 10 && <span className="text-[9px] font-black text-white">{stat.neuPercent}%</span>}
                                            </div>
                                            <div
                                              className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                              style={{ width: `${stat.negPercent}%` }}
                                            >
                                              {stat.negPercent >= 10 && <span className="text-[9px] font-black text-white">{stat.negPercent}%</span>}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
                                            <div className="w-1.5 h-3 bg-slate-400 rounded-full"></div>
                                            <span className="text-[9px] text-slate-400 font-bold leading-tight">Tidak Menjawab/Tahu <span className="text-slate-800 font-black">{stat.missingPercent}%</span></span>
                                          </div>
                                        </div>
                                        {mode === 'Perbandingan' && stat2 && (
                                          <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun2}</span>
                                            <div className="flex-1 h-6 flex rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative opacity-80">
                                              <div
                                                className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                                style={{ width: `${stat2.posPercent}%` }}
                                              >
                                                {stat2.posPercent >= 10 && <span className="text-[9px] font-black text-white">{stat2.posPercent}%</span>}
                                              </div>
                                              <div
                                                className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                                style={{ width: `${stat2.neuPercent}%` }}
                                              >
                                                {stat2.neuPercent >= 10 && <span className="text-[9px] font-black text-white">{stat2.neuPercent}%</span>}
                                              </div>
                                              <div
                                                className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                                style={{ width: `${stat2.negPercent}%` }}
                                              >
                                                {stat2.negPercent >= 10 && <span className="text-[9px] font-black text-white">{stat2.negPercent}%</span>}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
                                              <div className="w-1.5 h-3 bg-slate-400 rounded-full"></div>
                                              <span className="text-[9px] text-slate-400 font-bold leading-tight">Tidak Menjawab/Tahu <span className="text-slate-800 font-black">{stat2.missingPercent}%</span></span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    {/* Benchmark MIN & MAX on the right */}
                                    <td className="p-0 border-l border-slate-150 text-center font-bold text-slate-700 text-xs align-middle bg-slate-50/60 w-44">
                                      <div className="flex h-full items-center justify-center min-h-[50px]">
                                        <span className="w-1/2 py-2">{bMin}%</span>
                                        <span className="w-1/2 py-2 border-l border-slate-150">{bMax}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary Footer */}
                          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col sm:flex-row gap-8">
                              <div className="flex flex-col gap-1">
                                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">RESPON POSITIF {mode === 'Perbandingan' ? `(${tahun1})` : 'DIMENSI'}</p>
                                <div className="flex items-center gap-4">
                                  <CountUp value={avgPosPercent} className="text-4xl font-black text-slate-800" />
                                  <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${status.bg} ${status.color} ${status.border} uppercase shadow-sm`}>
                                    {status.label}
                                  </div>
                                </div>
                              </div>
                              {mode === 'Perbandingan' && (
                                <div className="flex flex-col gap-1">
                                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">RESPON POSITIF ({tahun2})</p>
                                  <div className="flex items-center gap-4">
                                    <CountUp value={avgPosPercent2} className="text-4xl font-black text-slate-800" />
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${status2.bg} ${status2.color} ${status2.border} uppercase shadow-sm`}>
                                      {status2.label}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center hidden md:block">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-tight">Benchmark Dimensi (AHRQ)</p>
                                <p className="text-[13px] font-black text-slate-700">{bMin}.0% - {bMax}.0%</p>
                              </div>
                              <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-500 shadow-sm shadow-teal-500/10">
                                <TrendingUp className="w-7 h-7" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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
            ) : activeView === 'hospital' ? (
              !hospitalSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Hospital className="w-5 h-5 text-blue-600" /> Pilih Tahun Survei
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 6 Submenu cards with different color bottom borders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {[
                      { 
                        title: 'Demografi Responden', 
                        desc: 'Tinjau sebaran responden berdasarkan posisi, masa kerja, jam kerja, dan interaksi pasien.', 
                        icon: <Users className="w-8 h-8 text-blue-600" />, 
                        hoverClass: 'hover:shadow-blue-100 hover:border-blue-200',
                        lineBg: 'bg-blue-500'
                      },
                      { 
                        title: 'Hasil Pengukuran Dimensi', 
                        desc: 'Lihat capaian skor rata-rata untuk setiap dimensi budaya keselamatan pasien secara komprehensif.', 
                        icon: <BarChart2 className="w-8 h-8 text-emerald-600" />, 
                        hoverClass: 'hover:shadow-emerald-100 hover:border-emerald-200',
                        lineBg: 'bg-emerald-500'
                      },
                      { 
                        title: 'Hasil Per Item', 
                        desc: 'Menganalisis persentase respon positif, netral, dan negatif untuk setiap butir pertanyaan kuesioner.', 
                        icon: <ListChecks className="w-8 h-8 text-orange-600" />, 
                        hoverClass: 'hover:shadow-orange-100 hover:border-orange-200',
                        lineBg: 'bg-orange-500'
                      },
                      { 
                        title: 'Penilaian Keselamatan Pasien', 
                        desc: 'Evaluasi peringkat keselamatan pasien secara umum berdasarkan persepsi langsung staf medis.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        hoverClass: 'hover:shadow-rose-100 hover:border-rose-200',
                        lineBg: 'bg-rose-500'
                      },
                      { 
                        title: 'Jumlah Peristiwa Yang Dilaporkan', 
                        desc: 'Analisis frekuensi pelaporan kejadian keselamatan pasien oleh unit kerja dalam 12 bulan terakhir.', 
                        icon: <AlertTriangle className="w-8 h-8 text-purple-600" />, 
                        hoverClass: 'hover:shadow-purple-100 hover:border-purple-200',
                        lineBg: 'bg-purple-500'
                      },
                      { 
                        title: 'Komentar Survei', 
                        desc: 'Eksplorasi saran, masukan bebas, dan tanggapan tertulis langsung dari para responden.', 
                        icon: <ShieldAlert className="w-8 h-8 text-slate-600" />, 
                        hoverClass: 'hover:shadow-slate-200 hover:border-slate-300',
                        lineBg: 'bg-slate-500'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setHospitalSubView(item.title)}
                        className={`bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all flex flex-col cursor-pointer relative overflow-hidden ${item.hoverClass} group pb-8`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                          {item.desc}
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto">
                          Lihat Detail
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                        {/* Dynamic identity line at the bottom */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${item.lineBg} rounded-b-[20px] transition-all duration-300 group-hover:h-2.5`} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : hospitalSubView === 'Demografi Responden' ? (
                <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
                  {/* Laporan AHRQ V2 Style */}
                  <div id="demografi-report" className="bg-white border border-slate-200 p-8 md:p-12 rounded-[24px] shadow-xl shadow-slate-200/50">
                    
                    {/* Header Laporan */}
                    <div className="border-b-4 border-blue-600 pb-6 mb-8">
                      <div className="mb-2">
                        <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Demografi Responden Rumah Sakit</h1>
                          <p className="text-sm font-medium text-slate-500 mt-1">Sistem Survei Budaya Keselamatan Pasien AHRQ 2.0</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Rumah Sakit</span>
                        <span className="block text-sm font-bold text-blue-900">{namaRs}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Periode Survei</span>
                        <span className="block text-sm font-bold text-blue-900">Tahun {tahun1}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Responden</span>
                        <span className="block text-sm font-bold text-blue-900">{demografiStats.total} Staf</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Generate</span>
                        <span className="block text-sm font-bold text-blue-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="space-y-10">
                      
                      {/* Section 1 */}
                      <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">1</span>
                          Statistik Administrasi Survei
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-bold">
                              <tr>
                                <th className="p-3.5 border-b border-slate-200 text-center">Statistik</th>
                                <th className="p-3.5 border-b border-slate-200 text-center">Jumlah</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-slate-700 font-medium">Jumlah Survei Selesai</td>
                                <td className="p-3.5 text-slate-800 font-bold text-center">{demografiStats.total}</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-slate-700 font-medium">Jumlah Link Survei Dibagikan</td>
                                <td className="p-3.5 text-slate-800 font-bold text-center">{demografiStats.total}</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-slate-700 font-medium">Jumlah Responden</td>
                                <td className="p-3.5 text-slate-800 font-bold text-center">{demografiStats.total}</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-slate-700 font-medium">Response Rate</td>
                                <td className="p-3.5 text-slate-800 font-bold text-center">100%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Section 2 */}
                      <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">2</span>
                          Posisi Staf di Rumah Sakit
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-bold">
                              <tr>
                                <th className="p-3.5 border-b border-slate-200 text-center">Jabatan / Kategori Staf</th>
                                <th className="p-3.5 border-b border-slate-200 text-center w-32">Jumlah</th>
                                <th className="p-3.5 border-b border-slate-200 text-center w-32">Persentase</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {demografiStats.posisiData.length > 0 ? (
                                demografiStats.posisiData.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                    <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                    <td className="p-3.5 text-slate-600 font-semibold text-center">
                                      {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(1) : 0}%
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Section 3 */}
                      <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">3</span>
                          Unit / Area Kerja
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-bold">
                              <tr>
                                <th className="p-3.5 border-b border-slate-200 text-center">Unit Utama (Primary Work Area)</th>
                                <th className="p-3.5 border-b border-slate-200 text-center w-32">Jumlah</th>
                                <th className="p-3.5 border-b border-slate-200 text-center w-32">Persentase</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {demografiStats.unitData.length > 0 ? (
                                demografiStats.unitData.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                    <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                    <td className="p-3.5 text-slate-600 font-semibold text-center">
                                      {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(1) : 0}%
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Section 4 & 5 (Lama Bekerja) Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">4</span>
                            Lama Bekerja (RS Ini)
                          </h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-600 font-bold">
                                <tr>
                                  <th className="p-3.5 border-b border-slate-200 text-center">Durasi (Tahun)</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">N</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {demografiStats.g1Data.length > 0 ? (
                                  demografiStats.g1Data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                      <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                      <td className="p-3.5 text-slate-600 font-semibold text-center">
                                        {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(0) : 0}%
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">5</span>
                            Lama Bekerja (Unit Saat Ini)
                          </h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-600 font-bold">
                                <tr>
                                  <th className="p-3.5 border-b border-slate-200 text-center">Durasi (Tahun)</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">N</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {demografiStats.g2Data.length > 0 ? (
                                  demografiStats.g2Data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                      <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                      <td className="p-3.5 text-slate-600 font-semibold text-center">
                                        {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(0) : 0}%
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>

                      {/* Section 6 & 7 (Jam & Interaksi) Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">6</span>
                            Jam Kerja per Minggu
                          </h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-600 font-bold">
                                <tr>
                                  <th className="p-3.5 border-b border-slate-200 text-center">Durasi (Jam)</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">N</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {demografiStats.g3Data.length > 0 ? (
                                  demografiStats.g3Data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                      <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                      <td className="p-3.5 text-slate-600 font-semibold text-center">
                                        {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(0) : 0}%
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">7</span>
                            Interaksi Langsung dgn Pasien
                          </h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-600 font-bold">
                                <tr>
                                  <th className="p-3.5 border-b border-slate-200 text-center">Kategori</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">N</th>
                                  <th className="p-3.5 border-b border-slate-200 text-center">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {demografiStats.g4Data.length > 0 ? (
                                  demografiStats.g4Data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 text-slate-700 font-medium">{item.name}</td>
                                      <td className="p-3.5 text-slate-800 font-bold text-center">{item.value}</td>
                                      <td className="p-3.5 text-slate-600 font-semibold text-center">
                                        {demografiStats.total > 0 ? ((item.value / demografiStats.total) * 100).toFixed(0) : 0}%
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-400 italic">Data tidak tersedia</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>

                      {/* Section 8: Ringkasan Naratif Demografi */}
                      <section className="bg-blue-50/40 border border-blue-100 p-6 rounded-[20px]">
                        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-black">8</span>
                          Ringkasan Naratif Demografi
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          Berdasarkan {demografiStats.total} responden dari {namaRs}, profil tenaga kesehatan didominasi oleh perawat dan tenaga medis yang bekerja penuh waktu dengan mayoritas berinteraksi langsung dengan pasien. Masa bakti rata-rata di rumah sakit dan unit menunjukkan komitmen yang kuat, meskipun terdapat rotasi staf yang terlihat dari persentase staf dengan masa kerja kurang dari setahun. Data ini menjadi landasan penting dalam menginterpretasikan respon survei budaya keselamatan pasien.
                        </p>
                      </section>

                    </div>
                  </div>
                </div>
              ) : hospitalSubView === 'Hasil Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setMode('Tunggal')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Periode Tunggal
                        </button>
                        <button 
                          onClick={() => setMode('Perbandingan')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Perbandingan
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      {mode === 'Tunggal' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Bandingkan:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <span className="text-slate-400 font-bold">VS</span>
                          <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Duplicated Detailed Table without Benchmarks */}
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-[24px] shadow-lg shadow-blue-500/5">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" />
                      Detail Pengukuran Dimensi Budaya Keselamatan Untuk {namaRs}
                    </h3>
                    <div className="w-full text-xs font-medium">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-3 w-12 text-center align-bottom">No.</th>
                              <th className="p-3 w-80 align-bottom">Komponen Budaya Keselamatan Pasien</th>
                              <th className="p-3 align-bottom text-center">Persentase Respons Positif</th>
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
                                  <td className="p-3 font-semibold text-slate-700 text-xs align-top pt-5 pr-4 leading-relaxed">
                                    {row.dimensiSingkat}
                                  </td>
                                  <td className="p-3 align-middle py-4">
                                    {mode === 'Tunggal' ? (
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="flex-1 bg-slate-100 rounded-r-md h-7 relative overflow-hidden flex items-center border-y border-r border-slate-200 shadow-inner">
                                          <motion.div 
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            style={{ transformOrigin: 'left', width: `${row.Capaian}%` }}
                                            className={`h-full ${getBarColor(row.Capaian)} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform`}
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
                                              style={{ transformOrigin: 'left', width: `${row['Tahun 1']}%` }}
                                              className={`h-full ${getBarColor(row['Tahun 1'])} relative group-hover:brightness-110 transition-all transform-gpu opacity-70 will-change-transform`}
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
                                              style={{ transformOrigin: 'left', width: `${row['Tahun 2']}%` }}
                                              className={`h-full ${getBarColor(row['Tahun 2'])} relative group-hover:brightness-110 transition-all transform-gpu will-change-transform`}
                                            >
                                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                            </motion.div>
                                          </div>
                                          <span className="text-sm font-bold text-slate-700 w-10 text-right">{row['Tahun 2'].toFixed(0)}%</span>
                                        </div>
                                      </div>
                                    )}
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
              ) : hospitalSubView === 'Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setMode('Tunggal')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Periode Tunggal
                        </button>
                        <button 
                          onClick={() => setMode('Perbandingan')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Periode Perbandingan
                        </button>
                      </div>
                      
                      {mode === 'Tunggal' ? (
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Tahun:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 1:</span>
                            <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 2:</span>
                            <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-32 cursor-pointer transition-all">
                              {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {DIMENSION_ORDER.map((dimId, index) => {
                        const dimInfo = DIMENSI_INFO[dimId];
                        const questions = ALL_QUESTIONS.filter(q => q.dim === dimId);
                        
                        let sumPosPercent = 0;
                        let sumPosPercent2 = 0;
                        const qStats = questions.map(q => {
                          const stat = calculateQuestionStats(q);
                          const stat2 = mode === 'Perbandingan' ? calculateQuestionStats(q, hospitalSurveys2) : null;
                          sumPosPercent += stat.posPercent;
                          if (stat2) sumPosPercent2 += stat2.posPercent;
                          return { q, stat, stat2 };
                        });
                        const avgPosPercent = questions.length > 0 ? Math.round(sumPosPercent / questions.length) : 0;
                        const avgPosPercent2 = questions.length > 0 ? Math.round(sumPosPercent2 / questions.length) : 0;
                        const status = getDimensionStatus(avgPosPercent);
                        const status2 = getDimensionStatus(avgPosPercent2);

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            key={dimId} 
                            className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all group"
                          >
                            {/* Card Header */}
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 relative flex items-center gap-5">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-indigo-600"></div>
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-xl font-black text-indigo-600">{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">{dimInfo.nama}</h3>
                                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-3xl">{dimInfo.deskripsi}</p>
                              </div>
                            </div>

                            {/* Questions List */}
                            <div className="p-6 md:p-8 space-y-8">
                              {/* Legend - Minimalist one-line layout */}
                              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pb-8 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm"></div>
                                  <span className="text-[12px] font-bold text-slate-600">Positif</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-3.5 h-3.5 rounded bg-yellow-500 shadow-sm"></div>
                                  <span className="text-[12px] font-bold text-slate-600">Netral</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-3.5 h-3.5 rounded bg-rose-500 shadow-sm"></div>
                                  <span className="text-[12px] font-bold text-slate-600">Negatif</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-3.5 h-3.5 rounded bg-slate-400 shadow-sm"></div>
                                  <span className="text-[12px] font-bold text-slate-600">Tidak Menjawab / Tidak Tahu</span>
                                </div>
                              </div>
                              
                              <div className="space-y-12">
                                {qStats.map(({ q, stat, stat2 }) => (
                                  <div key={q.id} className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                    {/* Question Code & Text */}
                                    <div className="lg:w-[45%] flex gap-5">
                                      <div className="flex flex-col items-center">
                                        <span className="text-[15px] font-black text-indigo-600 leading-none">{q.code}{q.isReversed && !q.code.endsWith('R') ? 'R' : ''}</span>
                                        <div className="w-5 h-0.5 bg-indigo-600 mt-2 rounded-full"></div>
                                      </div>
                                      <p className="text-[14px] font-bold text-slate-700 leading-[1.6]">{q.text}</p>
                                    </div>

                                    {/* Bar Chart and N/A label */}
                                    <div className="flex-1 flex flex-col gap-3">
                                      <div className="flex items-center gap-4">
                                        {mode === 'Perbandingan' && <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun1}</span>}
                                        <div className={`flex-1 ${mode === 'Tunggal' ? 'h-10' : 'h-8'} flex rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative`}>
                                          <div 
                                            className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                            style={{ width: `${stat.posPercent}%` }}
                                          >
                                            {stat.posPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.posPercent}%</span>}
                                          </div>
                                          <div 
                                            className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                            style={{ width: `${stat.neuPercent}%` }}
                                          >
                                            {stat.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.neuPercent}%</span>}
                                          </div>
                                          <div 
                                            className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                            style={{ width: `${stat.negPercent}%` }}
                                          >
                                            {stat.negPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.negPercent}%</span>}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 min-w-[140px] shrink-0">
                                          <div className="w-2 h-4 bg-slate-400 rounded-full"></div>
                                          <div className="leading-tight">
                                            <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Menjawab /</p>
                                            <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Tahu <span className="text-slate-800 font-black">{stat.missingPercent}%</span></p>
                                          </div>
                                        </div>
                                      </div>

                                      {mode === 'Perbandingan' && stat2 && (
                                        <div className="flex items-center gap-4">
                                          <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun2}</span>
                                          <div className="flex-1 h-8 flex rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative opacity-80">
                                            <div 
                                              className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                              style={{ width: `${stat2.posPercent}%` }}
                                            >
                                              {stat2.posPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.posPercent}%</span>}
                                            </div>
                                            <div 
                                              className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                              style={{ width: `${stat2.neuPercent}%` }}
                                            >
                                              {stat2.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.neuPercent}%</span>}
                                            </div>
                                            <div 
                                              className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                              style={{ width: `${stat2.negPercent}%` }}
                                            >
                                              {stat2.negPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.negPercent}%</span>}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 min-w-[140px] shrink-0">
                                            <div className="w-2 h-4 bg-slate-400 rounded-full"></div>
                                            <div className="leading-tight">
                                              <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Menjawab /</p>
                                              <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Tahu <span className="text-slate-800 font-black">{stat2.missingPercent}%</span></p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Summary Footer */}
                            <div className="bg-white p-6 md:p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                              <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex flex-col gap-1">
                                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">RESPON POSITIF {mode === 'Perbandingan' ? `(${tahun1})` : 'DIMENSI'}</p>
                                  <div className="flex items-center gap-4">
                                    <CountUp value={avgPosPercent} className="text-4xl font-black text-slate-800" />
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${status.bg} ${status.color} ${status.border} uppercase shadow-sm`}>
                                      {status.label}
                                    </div>
                                  </div>
                                </div>
                                {mode === 'Perbandingan' && (
                                  <div className="flex flex-col gap-1">
                                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">RESPON POSITIF ({tahun2})</p>
                                    <div className="flex items-center gap-4">
                                      <CountUp value={avgPosPercent2} className="text-4xl font-black text-slate-800" />
                                      <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${status2.bg} ${status2.color} ${status2.border} uppercase shadow-sm`}>
                                        {status2.label}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center hidden md:block">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-tight">Benchmark (AHRQ)</p>
                                  <p className="text-[13px] font-black text-slate-700">72.0% - 85.0%</p>
                                </div>
                                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-500/10">
                                  <TrendingUp className="w-7 h-7" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : hospitalSubView === 'Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setMode('Tunggal')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Periode Tunggal
                        </button>
                        <button 
                          onClick={() => setMode('Perbandingan')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Perbandingan
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      {mode === 'Tunggal' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Bandingkan:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <span className="text-slate-400 font-bold">VS</span>
                          <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer [&>option]:bg-white">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Duplicated Penilaian Keselamatan Pasien Chart Card without Benchmarks */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white border border-slate-200 p-6 md:p-8 rounded-[24px] shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" />
                      Grafik Penilaian Keselamatan Pasien
                    </h3>
                    <p className="text-sm text-slate-500 mb-8">Bagaimana Anda menilai tingkat keselamatan pasien di unit kerja Anda? (Butir E1)</p>
                    
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={e1Stats} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <filter id="shadow-raised-rose" x="-10%" y="-15%" width="125%" height="135%">
                              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#9f1239" floodOpacity="0.15" />
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                          <XAxis dataKey="kategori" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                          <YAxis type="number" domain={[0, 100]} stroke="#64748b" tickFormatter={(val) => `${val}%`} />
                          <RechartsTooltip content={<E1Tooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#475569', fontSize: '13px', fontWeight: 'bold' }} />
                          <Bar isAnimationActive={false} dataKey="Rumah Sakit Anda" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} filter="url(#shadow-raised-rose)">
                            <LabelList dataKey="Rumah Sakit Anda" position="top" formatter={(val: number) => `${val.toFixed(1)}%`} fill="#be123c" fontSize={11} fontWeight="bold" />
                            {e1Stats.map((entry, index) => (
                              <Cell key={`cell-rs-${index}`} fill="#f43f5e" />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>
              ) : hospitalSubView === 'Jumlah Peristiwa Yang Dilaporkan' ? (
                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setMode('Tunggal')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Tunggal' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Tunggal
                      </button>
                      <button 
                        onClick={() => setMode('Perbandingan')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'Perbandingan' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Periode Perbandingan
                      </button>
                    </div>
                    
                    {mode === 'Tunggal' ? (
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none w-32 cursor-pointer transition-all">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 1:</span>
                          <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none w-32 cursor-pointer transition-all">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun 2:</span>
                          <select value={tahun2} onChange={e => setTahun2(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none w-32 cursor-pointer transition-all">
                            {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Chart Card - Glassmorphism 2.0 style */}
                  <div className="bg-white rounded-[24px] shadow-[0_12px_40px_rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.10)] overflow-hidden">
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-800 p-8 text-white flex items-center justify-between">
                      <div className="space-y-1.5">
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Detail Distribusi Jumlah Peristiwa yang Dilaporkan</h2>
                        <p className="text-xs md:text-sm text-purple-100/80 font-medium">Distribusi frekuensi pelaporan insiden keselamatan pasien berdasarkan data responden rumah sakit Anda</p>
                      </div>
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shrink-0 hidden sm:block">
                        <Activity className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-8">
                      {/* Sub-header info */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100">
                          <span>Total Responden {mode === 'Perbandingan' ? `(${tahun1})` : 'Aktif'}:</span>
                          <span className="text-sm font-extrabold text-purple-800">{reportedEventsStats1.total}</span>
                        </div>
                        {mode === 'Perbandingan' && (
                          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100">
                            <span>Total Responden ({tahun2}):</span>
                            <span className="text-sm font-extrabold text-orange-800">{reportedEventsStats2?.total || 0}</span>
                          </div>
                        )}
                      </div>

                      {/* Chart Area */}
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart 
                            data={[
                              {
                                kategori: 'Tidak Pernah',
                                'Rumah Sakit Anda': reportedEventsStats1.percentages['Tidak ada'],
                                'Rumah Sakit Anda Count': reportedEventsStats1.counts['Tidak ada'],
                                ...(mode === 'Perbandingan' && {
                                  'Tahun 2': reportedEventsStats2?.percentages['Tidak ada'] || 0,
                                  'Tahun 2 Count': reportedEventsStats2?.counts['Tidak ada'] || 0,
                                })
                              },
                              {
                                kategori: '1–2 Kejadian',
                                'Rumah Sakit Anda': reportedEventsStats1.percentages['1 sampai 2'],
                                'Rumah Sakit Anda Count': reportedEventsStats1.counts['1 sampai 2'],
                                ...(mode === 'Perbandingan' && {
                                  'Tahun 2': reportedEventsStats2?.percentages['1 sampai 2'] || 0,
                                  'Tahun 2 Count': reportedEventsStats2?.counts['1 sampai 2'] || 0,
                                })
                              },
                              {
                                kategori: '3–5 Kejadian',
                                'Rumah Sakit Anda': reportedEventsStats1.percentages['3 sampai 5'],
                                'Rumah Sakit Anda Count': reportedEventsStats1.counts['3 sampai 5'],
                                ...(mode === 'Perbandingan' && {
                                  'Tahun 2': reportedEventsStats2?.percentages['3 sampai 5'] || 0,
                                  'Tahun 2 Count': reportedEventsStats2?.counts['3 sampai 5'] || 0,
                                })
                              },
                              {
                                kategori: '6–10 Kejadian',
                                'Rumah Sakit Anda': reportedEventsStats1.percentages['6 hingga 10'],
                                'Rumah Sakit Anda Count': reportedEventsStats1.counts['6 hingga 10'],
                                ...(mode === 'Perbandingan' && {
                                  'Tahun 2': reportedEventsStats2?.percentages['6 hingga 10'] || 0,
                                  'Tahun 2 Count': reportedEventsStats2?.counts['6 hingga 10'] || 0,
                                })
                              },
                              {
                                kategori: '≥11 Kejadian',
                                'Rumah Sakit Anda': reportedEventsStats1.percentages['11 atau lebih'],
                                'Rumah Sakit Anda Count': reportedEventsStats1.counts['11 atau lebih'],
                                ...(mode === 'Perbandingan' && {
                                  'Tahun 2': reportedEventsStats2?.percentages['11 atau lebih'] || 0,
                                  'Tahun 2 Count': reportedEventsStats2?.counts['11 atau lebih'] || 0,
                                })
                              },
                            ]} 
                            margin={{ top: 25, right: 10, left: -10, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#6d28d9" />
                              </linearGradient>
                              <filter id="re-shadow-purple" x="-15%" y="-15%" width="130%" height="140%">
                                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.35" />
                              </filter>
                              {mode === 'Perbandingan' && (
                                <>
                                  <linearGradient id="orangeGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#c2410c" />
                                  </linearGradient>
                                  <filter id="re-shadow-orange" x="-15%" y="-15%" width="130%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#7c2d12" floodOpacity="0.35" />
                                  </filter>
                                </>
                              )}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                            <XAxis 
                              dataKey="kategori" 
                              stroke="#64748b" 
                              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} 
                              tickLine={false}
                            />
                            <YAxis 
                              type="number" 
                              domain={[0, 100]} 
                              tickCount={11} 
                              stroke="#64748b" 
                              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                              tickLine={false}
                              tickFormatter={(val) => `${val}%`} 
                            />
                            <RechartsTooltip content={<ReportedEventsTooltip />} cursor={{ fill: 'rgba(139,92,246,0.02)' }} />
                            <Legend 
                              verticalAlign="top" 
                              align="right"
                              height={40} 
                              iconType="circle"
                              iconSize={10}
                              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} 
                            />
                            <Bar 
                              isAnimationActive={false} 
                              name={mode === 'Perbandingan' ? `Tahun ${tahun1}` : 'Rumah Sakit Anda'}
                              dataKey="Rumah Sakit Anda" 
                              fill="url(#purpleGrad)" 
                              radius={[6, 6, 0, 0]} 
                              maxBarSize={55} 
                              filter="url(#re-shadow-purple)"
                            >
                              <LabelList 
                                dataKey="Rumah Sakit Anda" 
                                position="top" 
                                formatter={(val: number) => `${val.toFixed(1)}%`} 
                                fill="#6d28d9" 
                                fontSize={11} 
                                fontWeight="bold" 
                              />
                            </Bar>
                            {mode === 'Perbandingan' && (
                              <Bar 
                                isAnimationActive={false} 
                                name={`Tahun ${tahun2}`}
                                dataKey="Tahun 2" 
                                fill="url(#orangeGrad2)" 
                                radius={[6, 6, 0, 0]} 
                                maxBarSize={55} 
                                filter="url(#re-shadow-orange)"
                              >
                                <LabelList 
                                  dataKey="Tahun 2" 
                                  position="top" 
                                  formatter={(val: number) => `${val.toFixed(1)}%`} 
                                  fill="#c2410c" 
                                  fontSize={11} 
                                  fontWeight="bold" 
                                />
                              </Bar>
                            )}
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-center justify-end bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-base font-bold text-slate-800">Masukan &amp; Saran Tertulis Responden</h3>
                      <p className="text-slate-500 text-xs">Umpan balik kualitatif langsung dari lembar kuesioner bagian komentar bebas.</p>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {hospitalComments.length > 0 ? (
                        hospitalComments.map((comment, index) => (
                          <div key={comment.id || index} className="p-5 bg-slate-50 rounded-2xl border-l-4 border-slate-500 space-y-3 relative">
                            <p className="text-sm italic font-medium text-slate-700 leading-relaxed">
                              &ldquo;{comment.text}&rdquo;
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400 border-t border-slate-200/40 pt-2">
                              <span className="text-slate-600 px-2 py-0.5 bg-slate-200/50 rounded-md truncate max-w-[200px]">
                                {comment.position}
                              </span>
                              <span className="text-slate-500 font-medium">
                                {comment.unit}
                              </span>
                              <span className="font-medium shrink-0">
                                {comment.date}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
                          <MessageSquareOff className="w-10 h-10 text-slate-300" />
                          <div>
                            <p className="font-bold text-slate-700">Tidak ada komentar</p>
                            <p className="text-xs mt-1">Belum ada saran atau masukan tertulis dari responden pada periode ini.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : activeView === 'unit' ? (
              !unitSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection / Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" /> Pilih Sub-Analisis Perbandingan Unit / Area Kerja
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan unit / area kerja.', 
                        icon: <BarChart2 className="w-8 h-8 text-emerald-600" />, 
                        colorClass: 'border-b-4 border-emerald-500 hover:shadow-emerald-100'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap unit.', 
                        icon: <ListChecks className="w-8 h-8 text-orange-600" />, 
                        colorClass: 'border-b-4 border-orange-500 hover:shadow-orange-100'
                      },
                      { 
                        title: 'Perbandingan Penilaian Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) lintas berbagai unit / departemen kerja.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        colorClass: 'border-b-4 border-rose-500 hover:shadow-rose-100'
                      },
                      { 
                        title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara berbagai unit / area kerja.', 
                        icon: <AlertTriangle className="w-8 h-8 text-purple-600" />, 
                        colorClass: 'border-b-4 border-purple-500 hover:shadow-purple-100'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setUnitSubView(item.title)}
                        className={`bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all flex flex-col cursor-pointer ${item.colorClass} group`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                          {item.desc}
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto">
                          Lihat Detail Perbandingan
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" /> Perbandingan Dimensi Berdasarkan Unit / Area Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main chart and detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Pilih Dimensi Budaya</h3>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                        {Object.keys(DIMENSI_INFO).map(dimId => {
                          const info = DIMENSI_INFO[dimId];
                          return (
                            <button
                              key={dimId}
                              onClick={() => setSelectedDimId(dimId)}
                              className={`w-full text-left p-3 rounded-xl transition-all text-xs font-semibold flex items-start gap-2.5 ${selectedDimId === dimId ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-extrabold">{info.kode}</span>
                              <span className="flex-1 leading-normal">{info.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-md">{DIMENSI_INFO[selectedDimId]?.kode}</span>
                          {DIMENSI_INFO[selectedDimId]?.nama}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                          {DIMENSI_INFO[selectedDimId]?.deskripsi}
                        </p>
                      </div>

                      {/* Chart displaying positive response rate by unit */}
                      <div className="h-[280px] w-full">
                        {demografiStats.unitData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            Belum ada data untuk tahun ini.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                              layout="vertical"
                              data={demografiStats.unitData.map(u => {
                                const scoreObj = unitDimensionScores.find(s => s.id === selectedDimId);
                                const score = scoreObj ? scoreObj[u.name] : 0;
                                return {
                                  name: u.name,
                                  value: score,
                                };
                              })}
                              margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                              <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Respons Positif']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                                <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} fill="#047857" fontSize={11} fontWeight="bold" />
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>                  {/* Summary Comparison Grid - Detailed Unit Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Respon Positif Dimensi Budaya Keselamatan Pasien Berdasarkan Unit Kerja
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Percontohan berdasarkan Unit Kerja (AHRQ SOPS Versi 2.0)
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[16px] border border-slate-200 shadow-sm bg-white/50 relative custom-scrollbar pb-2">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b-2 border-slate-200 sticky top-0 z-20">
                          <tr>
                            <th className="py-4 px-4 text-center w-12 border-r border-slate-200/80 sticky left-0 z-30 bg-slate-50">No</th>
                            <th className="py-4 px-5 min-w-[280px] text-center border-r border-slate-200/80 sticky left-12 z-30 bg-slate-50">Dimensi Budaya Keselamatan</th>
                            <th className="py-4 px-4 text-center min-w-[150px] border-r border-slate-200/80">Dataset</th>
                            <th className="py-4 px-4 text-center min-w-[120px] border-r border-slate-200/80">Total Responden</th>
                            {demografiStats.unitData.map(u => (
                              <th key={u.name} className="py-4 px-5 min-w-[190px] text-center border-r border-slate-200/80 last:border-r-0 font-black text-indigo-600">
                                <div className="flex flex-col items-center">
                                  <span className="whitespace-normal break-words">{u.name}</span>
                                  <span className="text-[10px] text-indigo-500/80 font-mono tracking-normal normal-case mt-0.5">(N = {u.value})</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/30 text-slate-600">
                          {DIMENSION_ORDER.map((dimId, idx) => {
                            const bMin = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
                            const bMax = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
                            const bAvg = (bMin + bMax) / 2;

                            return (
                              <Fragment key={`unit-comp-${dimId}`}>
                                <tr className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                                  <td rowSpan={2} className="py-5 px-4 text-center font-extrabold text-indigo-600 border-r border-slate-200/80 bg-slate-50/80 sticky left-0 z-10">
                                    {idx + 1}
                                  </td>
                                  <td rowSpan={2} className="py-5 px-5 font-bold text-slate-800 border-r border-slate-200/80 bg-slate-50/80 sticky left-12 z-10 leading-snug">
                                    <div className="space-y-1.5 max-w-[320px]">
                                      <p>{DIMENSI_INFO[dimId].nama}</p>
                                      <p className="text-[10px] text-slate-500 font-normal leading-relaxed">{DIMENSI_INFO[dimId].deskripsi}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-cyan-600 text-center border-r border-slate-200/80 bg-cyan-50/40">RS Anda</td>
                                  <td className="py-3 px-4 text-center font-extrabold text-slate-700 border-r border-slate-200/80 bg-cyan-50/40">{hospitalSurveys.length}</td>
                                  {demografiStats.unitData.map((u, unitIdx) => {
                                    const scoreObj = unitDimensionScores.find(s => s.id === dimId);
                                    const percentage = scoreObj ? scoreObj[u.name] : null;
                                    return (
                                      <td key={`unit-rs-${dimId}-${u.name}`} className={`py-3 px-5 text-center border-r border-slate-200/80 bg-cyan-50/40 ${unitIdx === demografiStats.unitData.length - 1 ? 'last:border-r-0' : ''}`}>
                                        {percentage !== null ? <span className={getCellColorClass(percentage)}>{percentage.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr className="hover:bg-slate-50/30 transition-all bg-slate-50/10">
                                  <td className="py-3 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Percontohan</td>
                                  <td className="py-3 px-4 text-center text-slate-400 border-r border-slate-200/80 font-bold">-</td>
                                  {demografiStats.unitData.map((u, unitIdx) => (
                                    <td key={`unit-pilot-${dimId}-${u.name}`} className={`py-3 px-5 text-center border-r border-slate-200/80 ${unitIdx === demografiStats.unitData.length - 1 ? 'last:border-r-0' : ''}`}>
                                      <div className="flex flex-col items-center justify-center">
                                        <span className={getCellColorClass(bAvg)}>{bAvg.toFixed(1)}%</span>
                                        <span className="text-[9px] text-emerald-600/70 font-mono font-medium mt-0.5">({bMin}% - {bMax}%)</span>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              </Fragment>
                            );
                          })}
                          <tr className="bg-indigo-50/40 border-t-2 border-indigo-200/80 hover:bg-indigo-50/50 transition-all">
                            <td rowSpan={2} className="py-5 px-4 text-center font-black text-indigo-600 border-r border-slate-200/80 bg-indigo-50/60 sticky left-0 z-10">★</td>
                            <td rowSpan={2} className="py-5 px-5 font-black text-slate-800 border-r border-slate-200/80 bg-indigo-50/60 sticky left-12 z-10">
                              <div className="space-y-1">
                                <div className="text-indigo-700 text-xs font-extrabold uppercase tracking-wide">Rata-rata Seluruh Dimensi</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-bold text-cyan-600 text-center border-r border-slate-200/80 bg-cyan-50/30">RS Anda</td>
                            <td className="py-4 px-4 text-center font-black text-slate-700 border-r border-slate-200/80 bg-cyan-50/30">{hospitalSurveys.length}</td>
                            {demografiStats.unitData.map((u, unitIdx) => {
                              const avgVal = getAverageCompositeForUnit(u.name);
                              return (
                                <td key={`unit-avg-rs-${u.name}`} className={`py-4 px-5 text-center border-r border-slate-200/80 bg-cyan-50/30 font-black ${unitIdx === demografiStats.unitData.length - 1 ? 'last:border-r-0' : ''}`}>
                                  {avgVal !== null ? <span className={getCellColorClass(avgVal)}>{avgVal.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="bg-indigo-50/20 hover:bg-indigo-50/30 transition-all">
                            <td className="py-4 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Percontohan</td>
                            <td className="py-4 px-4 text-center text-slate-400 border-r border-slate-200/80 font-bold">-</td>
                            {demografiStats.unitData.map((u, unitIdx) => (
                              <td key={`unit-avg-pilot-${u.name}`} className={`py-4 px-5 text-center border-r border-slate-200/80 font-black ${unitIdx === demografiStats.unitData.length - 1 ? 'last:border-r-0' : ''}`}>
                                <span className={getCellColorClass(averageBenchmark)}>{averageBenchmark.toFixed(1)}%</span>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Berdasarkan Unit / Area Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dimension selector to filter items */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Dimensi Budaya Keselamatan:</label>
                      <select
                        value={selectedDimId}
                        onChange={(e) => setSelectedDimId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none cursor-pointer"
                      >
                        {Object.keys(DIMENSI_INFO).map(dimId => (
                          <option key={dimId} value={dimId}>
                            [{DIMENSI_INFO[dimId].kode}] {DIMENSI_INFO[dimId].nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">Daftar Pertanyaan &amp; Perbandingan Positif (% Setuju / Sangat Setuju)</h3>
                      <div className="divide-y divide-slate-100 space-y-4">
                        {unitItemScores.filter(item => item.dimId === selectedDimId).map(q => (
                          <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">{q.id}</span>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed">{q.text}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {demografiStats.unitData.map(u => {
                                const val = q[u.name] || 0;
                                return (
                                  <div key={u.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[120px]">{u.name}</span>
                                      <span className="text-xs font-semibold text-slate-500 mt-0.5">{u.value} Responden</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Unit Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Bar Chart of Average Safety Score (1-5) */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Rata-Rata Skor Penilaian Keselamatan</h3>
                        <p className="text-slate-500 text-xs">Skor berkisar antara 1.00 (Buruk) hingga 5.00 (Luar Biasa).</p>
                      </div>

                      <div className="h-[300px] w-full">
                        {demografiStats.unitData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            Belum ada data untuk tahun ini.
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>

                    {/* Right: Percent Positive (Excellent/Very Good Rating 4-5) */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Respons Positif (Nilai &ge; 4)</h3>
                        <p className="text-slate-500 text-xs">Proporsi staf yang menilai keselamatan pasien di atas kategori Sangat Baik &amp; Luar Biasa.</p>
                      </div>

                      <div className="h-[300px] w-full">
                        {demografiStats.unitData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            Belum ada data untuk tahun ini.
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Distribution Table */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Tabel Komparasi Penilaian Keselamatan Lintas Unit</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3">Unit / Area Kerja</th>
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
                                  {row.average.toFixed(2)} / 5.00
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded-md font-bold ${row.positiveRate >= 75 ? 'bg-emerald-50 text-emerald-700' : row.positiveRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                  {row.positiveRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Peristiwa Yang Dilaporkan Berdasarkan Unit Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side: Bar Chart showing percentage of reporting >= 1 times */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Staf Yang Melaporkan Minimal 1 Insiden</h3>
                        <p className="text-slate-500 text-xs">Menunjukkan keaktifan unit dalam melaporkan insiden keselamatan pasien dalam 12 bulan terakhir.</p>
                      </div>

                      <div className="h-[300px] w-full">
                        {demografiStats.unitData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            Belum ada data untuk tahun ini.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                              layout="vertical"
                              data={unitReportingScores}
                              margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(val) => `${val}%`} />
                              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                              <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Persentase Pelaporan']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                              <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                <LabelList dataKey="rate" position="right" formatter={(val: any) => `${val}%`} fill="#6d28d9" fontSize={11} fontWeight="bold" />
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Right column: Info/Stats Summary */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Ikhtisar Pelaporan Unit</h3>
                        <p className="text-slate-500 text-xs">Pelajaran kualitatif dari pola pelaporan insiden di tingkat unit.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/40">
                          <span className="text-xs font-bold text-purple-700 block mb-1">Rekomendasi Utama</span>
                          <p className="text-[11px] font-medium text-purple-600 leading-relaxed">
                            Mendorong komunikasi terbuka tanpa rasa takut disalahkan (just culture) di seluruh unit kerja untuk memfasilitasi deteksi dini dan pembelajaran berkelanjutan dari kejadian nyaris cedera (KNC).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500">Pola Lintas Unit</span>
                          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Unit intensif (IGD, ICU, OK) memiliki paparan insiden lebih tinggi sehingga membutuhkan kepatuhan pelaporan yang lebih responsif.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Unit penunjang medis membutuhkan integrasi sistem pelaporan digital yang cepat dan mudah diakses.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : activeView === 'position' ? (
              !positionSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection / Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" /> Pilih Sub-Analisis Perbandingan Posisi Staf
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan posisi staf.', 
                        icon: <BarChart2 className="w-8 h-8 text-emerald-600" />, 
                        colorClass: 'border-b-4 border-emerald-500 hover:shadow-emerald-100'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS.', 
                        icon: <ListChecks className="w-8 h-8 text-orange-600" />, 
                        colorClass: 'border-b-4 border-orange-500 hover:shadow-orange-100'
                      },
                      { 
                        title: 'Perbandingan Penilaian Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) lintas berbagai posisi dan peran jabatan.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        colorClass: 'border-b-4 border-rose-500 hover:shadow-rose-100'
                      },
                      { 
                        title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara berbagai posisi staf.', 
                        icon: <AlertTriangle className="w-8 h-8 text-purple-600" />, 
                        colorClass: 'border-b-4 border-purple-500 hover:shadow-purple-100'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setPositionSubView(item.title)}
                        className={`bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all flex flex-col cursor-pointer ${item.colorClass} group`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                          {item.desc}
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto">
                          Lihat Detail Perbandingan
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" /> Perbandingan Dimensi Berdasarkan Posisi Staf ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main chart and detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Pilih Dimensi Budaya</h3>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                        {Object.keys(DIMENSI_INFO).map(dimId => {
                          const info = DIMENSI_INFO[dimId];
                          return (
                            <button
                              key={dimId}
                              onClick={() => setSelectedDimId(dimId)}
                              className={`w-full text-left p-3 rounded-xl transition-all text-xs font-semibold flex items-start gap-2.5 ${selectedDimId === dimId ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-extrabold">{info.kode}</span>
                              <span className="flex-1 leading-normal">{info.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-md">{DIMENSI_INFO[selectedDimId]?.kode}</span>
                          {DIMENSI_INFO[selectedDimId]?.nama}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                          {DIMENSI_INFO[selectedDimId]?.deskripsi}
                        </p>
                      </div>

                      {/* Chart displaying positive response rate by staff position */}
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={demografiStats.posisiData.map(pos => {
                              const scoreObj = positionDimensionScores.find(s => s.id === selectedDimId);
                              const score = scoreObj ? scoreObj[pos.name] : 0;
                              return {
                                name: pos.name,
                                value: score,
                              };
                            })}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Respons Positif']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} fill="#047857" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>                  {/* Summary Comparison Grid - Detailed Position Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Users className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Persentase Respon Positif Dimensi Berdasarkan Posisi Staf
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Percontohan berdasarkan Posisi Staf (AHRQ SOPS Versi 2.0)
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 relative max-h-[650px] custom-scrollbar pb-2">
                      <table className="w-full border-collapse text-left text-xs text-slate-600">
                        <thead>
                          <tr className="border-b-2 border-slate-200 bg-slate-50 sticky top-0 z-30 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            <th className="py-4 px-4 text-center w-12 border-r border-slate-200/80 shadow-sm">No</th>
                            <th className="py-4 px-5 min-w-[280px] text-center border-r border-slate-200/80 shadow-sm">Dimensi Budaya Keselamatan</th>
                            <th className="py-4 px-4 text-center min-w-[150px] border-r border-slate-200/80 shadow-sm">Dataset</th>
                            <th className="py-4 px-4 text-center min-w-[120px] border-r border-slate-200/80 shadow-sm">Total Responden</th>
                            {demografiStats.posisiData.map(pos => (
                              <th key={pos.name} className="py-4 px-5 min-w-[190px] text-center border-r border-slate-200/80 last:border-r-0 font-black text-indigo-600">
                                <div className="flex flex-col items-center">
                                  <span>{pos.name}</span>
                                  <span className="text-[10px] text-indigo-500/80 font-mono tracking-normal normal-case mt-0.5">(N = {pos.value})</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/30 text-slate-600">
                          {DIMENSION_ORDER.map((dimId, idx) => {
                            const bMin = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
                            const bMax = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
                            const bAvg = (bMin + bMax) / 2;

                            return (
                              <Fragment key={dimId}>
                                <tr className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                                  <td rowSpan={2} className="py-5 px-4 text-center font-extrabold text-indigo-600 border-r border-slate-200/80 bg-slate-50/80">
                                    {idx + 1}
                                  </td>
                                  <td rowSpan={2} className="py-5 px-5 font-bold text-slate-800 border-r border-slate-200/80 bg-slate-50/80">
                                    <div className="space-y-1.5 max-w-[320px]">
                                      <div className="text-slate-800 text-xs md:text-sm tracking-tight leading-snug">{DIMENSI_INFO[dimId].nama}</div>
                                      <div className="text-[10px] text-slate-500 font-normal leading-relaxed">{DIMENSI_INFO[dimId].deskripsi}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-cyan-600 text-center border-r border-slate-200/80 bg-cyan-50/40">RS Anda</td>
                                  <td className="py-3 px-4 text-center font-extrabold text-slate-700 border-r border-slate-200/80 bg-cyan-50/40">{hospitalSurveys.length}</td>
                                  {demografiStats.posisiData.map((pos, posIdx) => {
                                    const scoreObj = positionDimensionScores.find(s => s.id === dimId);
                                    const percentage = scoreObj ? scoreObj[pos.name] : null;
                                    return (
                                      <td key={`pos-rs-${dimId}-${pos.name}`} className={`py-3 px-5 text-center border-r border-slate-200/80 bg-cyan-50/40 ${posIdx === demografiStats.posisiData.length - 1 ? 'last:border-r-0' : ''}`}>
                                        {percentage !== null ? <span className={getCellColorClass(percentage)}>{percentage.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr className="hover:bg-slate-50/30 transition-all bg-slate-50/10">
                                  <td className="py-3 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Percontohan</td>
                                  <td className="py-3 px-4 text-center text-slate-400 border-r border-slate-200/80 font-bold">-</td>
                                  {demografiStats.posisiData.map((pos, posIdx) => (
                                    <td key={`pos-pilot-${dimId}-${pos.name}`} className={`py-3 px-5 text-center border-r border-slate-200/80 ${posIdx === demografiStats.posisiData.length - 1 ? 'last:border-r-0' : ''}`}>
                                      <div className="flex flex-col items-center justify-center">
                                        <span className={getCellColorClass(bAvg)}>{bAvg.toFixed(1)}%</span>
                                        <span className="text-[9px] text-emerald-600/70 font-mono font-medium mt-0.5">({bMin}% - {bMax}%)</span>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              </Fragment>
                            );
                          })}
                          <tr className="bg-indigo-50/40 border-t-2 border-indigo-200/80 hover:bg-indigo-50/50 transition-all">
                            <td rowSpan={2} className="py-5 px-4 text-center font-black text-indigo-600 border-r border-slate-200/80 bg-indigo-50/60">★</td>
                            <td rowSpan={2} className="py-5 px-5 font-black text-slate-800 border-r border-slate-200/80 bg-indigo-50/60">
                              <div className="space-y-1">
                                <div className="text-indigo-700 text-xs font-extrabold uppercase tracking-wide">Rata-rata Seluruh Dimensi</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-bold text-cyan-600 text-center border-r border-slate-200/80 bg-cyan-50/30">RS Anda</td>
                            <td className="py-4 px-4 text-center font-black text-slate-700 border-r border-slate-200/80 bg-cyan-50/30">{hospitalSurveys.length}</td>
                            {demografiStats.posisiData.map((pos, posIdx) => {
                              const avgVal = getAverageCompositeForPosition(pos.name);
                              return (
                                <td key={`pos-avg-rs-${pos.name}`} className={`py-4 px-5 text-center border-r border-slate-200/80 bg-cyan-50/30 font-black ${posIdx === demografiStats.posisiData.length - 1 ? 'last:border-r-0' : ''}`}>
                                  {avgVal !== null ? <span className={getCellColorClass(avgVal)}>{avgVal.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="bg-indigo-50/20 hover:bg-indigo-50/30 transition-all">
                            <td className="py-4 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Percontohan</td>
                            <td className="py-4 px-4 text-center text-slate-400 border-r border-slate-200/80 font-bold">-</td>
                            {demografiStats.posisiData.map((pos, posIdx) => (
                              <td key={`pos-avg-pilot-${pos.name}`} className={`py-4 px-5 text-center border-r border-slate-200/80 font-black ${posIdx === demografiStats.posisiData.length - 1 ? 'last:border-r-0' : ''}`}>
                                <span className={getCellColorClass(averageBenchmark)}>{averageBenchmark.toFixed(1)}%</span>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Berdasarkan Posisi Staf ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dimension selector to filter items */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Dimensi Budaya Keselamatan:</label>
                      <select
                        value={selectedDimId}
                        onChange={(e) => setSelectedDimId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none cursor-pointer"
                      >
                        {Object.keys(DIMENSI_INFO).map(dimId => (
                          <option key={dimId} value={dimId}>
                            [{DIMENSI_INFO[dimId].kode}] {DIMENSI_INFO[dimId].nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">Daftar Pertanyaan &amp; Perbandingan Positif (% Setuju / Sangat Setuju)</h3>
                      <div className="divide-y divide-slate-100 space-y-4">
                        {positionItemScores.filter(item => item.dimId === selectedDimId).map(q => (
                          <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">{q.id}</span>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed">{q.text}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {demografiStats.posisiData.map(pos => {
                                const val = q[pos.name] || 0;
                                return (
                                  <div key={pos.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[120px]">{pos.name}</span>
                                      <span className="text-xs font-semibold text-slate-500 mt-0.5">{pos.value} Responden</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Posisi Staf ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            data={positionSafetyScores}
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
                            data={positionSafetyScores}
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
                          {positionSafetyScores.map(row => (
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
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Peristiwa Yang Dilaporkan Berdasarkan Posisi Staf ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 columns: Chart */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Staf Melaporkan &ge; 1 Peristiwa</h3>
                        <p className="text-slate-500 text-xs">Proporsi responden yang melaporkan setidaknya 1 kejadian tidak diharapkan dalam 12 bulan terakhir.</p>
                      </div>

                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={positionReportingScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} tickFormatter={(v) => v.length > 20 ? v.substring(0, 18) + '...' : v} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Melaporkan Kejadian']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="rate" position="right" formatter={(val: any) => `${val}%`} fill="#6d28d9" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right column: Info/Stats Summary */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Ikhtisar Pelaporan</h3>
                        <p className="text-slate-500 text-xs">Pelajaran kualitatif dari pola pelaporan insiden.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/40">
                          <span className="text-xs font-bold text-purple-700 block mb-1">Rekomendasi Utama</span>
                          <p className="text-[11px] font-medium text-purple-600 leading-relaxed">
                            Mendorong budaya non-punitif (bebas dari rasa menyalahkan) sangat krusial untuk meningkatkan keaktifan pelaporan insiden, terutama bagi peran non-medis dan staf administrasi.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500">Pola Berdasarkan Peran</span>
                          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Perawat dan Bidan cenderung memiliki keaktifan pelaporan insiden tertinggi di unit perawatan langsung.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Tenaga pendukung non-medis membutuhkan penyederhanaan alur dan media pelaporan digital.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : activeView === 'tenure' ? (
              !tenureSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection / Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" /> Pilih Sub-Analisis Perbandingan Berdasarkan Masa Jabatan / Lama Kerja
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan masa jabatan / lama kerja staf.', 
                        icon: <BarChart2 className="w-8 h-8 text-emerald-600" />, 
                        colorClass: 'border-b-4 border-emerald-500 hover:shadow-emerald-100'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok masa jabatan.', 
                        icon: <ListChecks className="w-8 h-8 text-orange-600" />, 
                        colorClass: 'border-b-4 border-orange-500 hover:shadow-orange-100'
                      },
                      { 
                        title: 'Perbandingan Penilaian Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan masa jabatan atau lama kerja staf.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        colorClass: 'border-b-4 border-rose-500 hover:shadow-rose-100'
                      },
                      { 
                        title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok masa jabatan staf.', 
                        icon: <AlertTriangle className="w-8 h-8 text-purple-600" />, 
                        colorClass: 'border-b-4 border-purple-500 hover:shadow-purple-100'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setTenureSubView(item.title)}
                        className={`bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all flex flex-col cursor-pointer ${item.colorClass} group`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                          {item.desc}
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto">
                          Lihat Detail Perbandingan
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : tenureSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" /> Perbandingan Dimensi Berdasarkan Masa Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main chart and detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Pilih Dimensi Budaya</h3>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                        {Object.keys(DIMENSI_INFO).map(dimId => {
                          const info = DIMENSI_INFO[dimId];
                          return (
                            <button
                              key={dimId}
                              onClick={() => setSelectedDimId(dimId)}
                              className={`w-full text-left p-3 rounded-xl transition-all text-xs font-semibold flex items-start gap-2.5 ${selectedDimId === dimId ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-extrabold">{info.kode}</span>
                              <span className="flex-1 leading-normal">{info.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-md">{DIMENSI_INFO[selectedDimId]?.kode}</span>
                          {DIMENSI_INFO[selectedDimId]?.nama}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                          {DIMENSI_INFO[selectedDimId]?.deskripsi}
                        </p>
                      </div>

                      {/* Chart displaying positive response rate by tenure */}
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={demografiStats.g1Data.map(g1 => {
                              const scoreObj = tenureDimensionScores.find(s => s.id === selectedDimId);
                              const score = scoreObj ? scoreObj[g1.name] : 0;
                              return {
                                name: g1.name,
                                value: score,
                              };
                            })}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Respons Positif']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} fill="#047857" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Tabel Komparasi Seluruh Dimensi</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3 w-12 text-center">Kode</th>
                            <th className="p-3">Dimensi Budaya Keselamatan</th>
                            {demografiStats.g1Data.map(g1 => (
                              <th key={g1.name} className="p-3 text-center truncate max-w-[150px]">{g1.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tenureDimensionScores.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-3 text-center font-extrabold text-slate-500 bg-slate-50">{row.kode}</td>
                              <td className="p-3 font-semibold text-slate-700">{row.name}</td>
                              {demografiStats.g1Data.map(g1 => {
                                const val = row[g1.name] || 0;
                                let color = 'text-red-600 bg-red-50';
                                if (val >= 75) color = 'text-emerald-700 bg-emerald-50';
                                else if (val >= 50) color = 'text-amber-700 bg-amber-50';
                                return (
                                  <td key={g1.name} className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded-md font-bold text-xs ${color}`}>
                                      {val}%
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : tenureSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Berdasarkan Masa Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dimension selector to filter items */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Dimensi Budaya Keselamatan:</label>
                      <select
                        value={selectedDimId}
                        onChange={(e) => setSelectedDimId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none cursor-pointer"
                      >
                        {Object.keys(DIMENSI_INFO).map(dimId => (
                          <option key={dimId} value={dimId}>
                            [{DIMENSI_INFO[dimId].kode}] {DIMENSI_INFO[dimId].nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">Daftar Pertanyaan &amp; Perbandingan Positif (% Setuju / Sangat Setuju)</h3>
                      <div className="divide-y divide-slate-100 space-y-4">
                        {tenureItemScores.filter(item => item.dimId === selectedDimId).map(q => (
                          <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">{q.id}</span>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed">{q.text}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {demografiStats.g1Data.map(g1 => {
                                const val = q[g1.name] || 0;
                                return (
                                  <div key={g1.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[120px]">{g1.name}</span>
                                      <span className="text-xs font-semibold text-slate-500 mt-0.5">{g1.value} Responden</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : tenureSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Masa Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            data={tenureSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 5]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
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
                            data={tenureSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
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
                            <th className="p-3">Masa Kerja</th>
                            <th className="p-3 text-center">Jumlah Responden</th>
                            <th className="p-3 text-center">Rata-Rata Skor</th>
                            <th className="p-3 text-center">Persentase Respons Positif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tenureSafetyScores.map(row => (
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
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Peristiwa Yang Dilaporkan Berdasarkan Masa Kerja ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 columns: Chart */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Staf Melaporkan &ge; 1 Peristiwa</h3>
                        <p className="text-slate-500 text-xs">Proporsi responden yang melaporkan setidaknya 1 kejadian tidak diharapkan dalam 12 bulan terakhir.</p>
                      </div>

                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={tenureReportingScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Melaporkan Kejadian']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="rate" position="right" formatter={(val: any) => `${val}%`} fill="#6d28d9" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right column: Info/Stats Summary */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Ikhtisar Pelaporan</h3>
                        <p className="text-slate-500 text-xs">Pelajaran kualitatif dari pola pelaporan insiden berdasarkan masa kerja.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/40">
                          <span className="text-xs font-bold text-purple-700 block mb-1">Rekomendasi Utama</span>
                          <p className="text-[11px] font-medium text-purple-600 leading-relaxed">
                            Mendorong staf baru (masa kerja &lt; 1 tahun) agar merasa aman dan dibimbing dalam melaporkan insiden tanpa takut akan sanksi demi deteksi dini risiko klinis.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500">Pola Berdasarkan Masa Kerja</span>
                          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Staf senior (masa kerja &gt; 5 tahun) umumnya menunjukkan persentase pelaporan yang stabil, dipengaruhi oleh pemahaman mendalam tentang alur pelaporan.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Edukasi berkesinambungan tentang jenis-jenis insiden (termasuk nyaris cedera) harus diberikan berkala di setiap jenjang masa kerja.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : activeView === 'interaction' ? (
              !interactionSubView ? (
                <div className="w-full space-y-6">
                  {/* Period selection / Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-rose-600" /> Pilih Sub-Analisis Perbandingan Berdasarkan Interaksi Dengan Pasien
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                      <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                        {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan interaksi langsung staf dengan pasien.', 
                        icon: <BarChart2 className="w-8 h-8 text-emerald-600" />, 
                        colorClass: 'border-b-4 border-emerald-500 hover:shadow-emerald-100'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok interaksi pasien.', 
                        icon: <ListChecks className="w-8 h-8 text-orange-600" />, 
                        colorClass: 'border-b-4 border-orange-500 hover:shadow-orange-100'
                      },
                      { 
                        title: 'Perbandingan Penilaian Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan tingkat interaksi langsung staf dengan pasien.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        colorClass: 'border-b-4 border-rose-500 hover:shadow-rose-100'
                      },
                      { 
                        title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok staf berdasarkan interaksi pasien.', 
                        icon: <AlertTriangle className="w-8 h-8 text-purple-600" />, 
                        colorClass: 'border-b-4 border-purple-500 hover:shadow-purple-100'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setInteractionSubView(item.title)}
                        className={`bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-all flex flex-col cursor-pointer ${item.colorClass} group`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                          {item.desc}
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto">
                          Lihat Detail Perbandingan
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : interactionSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" /> Perbandingan Dimensi Berdasarkan Interaksi Dengan Pasien ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main chart and detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Pilih Dimensi Budaya</h3>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                        {Object.keys(DIMENSI_INFO).map(dimId => {
                          const info = DIMENSI_INFO[dimId];
                          return (
                            <button
                              key={dimId}
                              onClick={() => setSelectedDimId(dimId)}
                              className={`w-full text-left p-3 rounded-xl transition-all text-xs font-semibold flex items-start gap-2.5 ${selectedDimId === dimId ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-extrabold">{info.kode}</span>
                              <span className="flex-1 leading-normal">{info.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-md">{DIMENSI_INFO[selectedDimId]?.kode}</span>
                          {DIMENSI_INFO[selectedDimId]?.nama}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                          {DIMENSI_INFO[selectedDimId]?.deskripsi}
                        </p>
                      </div>

                      {/* Chart displaying positive response rate by interaction */}
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={demografiStats.g4Data.map(g4 => {
                              const scoreObj = interactionDimensionScores.find(s => s.id === selectedDimId);
                              const score = scoreObj ? scoreObj[g4.name] : 0;
                              return {
                                name: g4.name,
                                value: score,
                              };
                            })}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Respons Positif']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="value" position="right" formatter={(val: any) => `${val}%`} fill="#047857" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Summary Comparison Grid - Detailed Interaction Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL KOMPARATIF INTERAKSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Stethoscope className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Respon Positif Dimensi Budaya Keselamatan Pasien Berdasarkan Hubungan Langsung dengan Pasien
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Percontohan berdasarkan interaksi dengan pasien (AHRQ SOPS Versi 2.0)
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[16px] border border-slate-200 shadow-sm bg-white/50 relative custom-scrollbar pb-2">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b-2 border-slate-200 sticky top-0 z-20">
                          <tr>
                            <th rowSpan={2} className="py-4 px-4 text-center w-12 border-r border-slate-200/80 bg-slate-50 sticky left-0 z-30 shadow-sm">No</th>
                            <th rowSpan={2} className="py-4 px-5 min-w-[280px] text-center border-r border-slate-200/80 bg-slate-50 sticky left-12 z-30 shadow-sm">Dimensi Budaya Keselamatan</th>
                            <th colSpan={2} className="py-3 px-4 text-center border-r border-slate-200/80 bg-cyan-50/60 font-black text-cyan-800">Rumah Sakit Anda</th>
                            <th colSpan={2} className="py-3 px-4 text-center border-r border-slate-200/80 bg-emerald-50/60 font-black text-emerald-800">RS Percontohan (Benchmark)</th>
                          </tr>
                          <tr className="bg-slate-50/80">
                            <th className="py-3 px-3 text-center border-r border-slate-200/80 text-[10px] font-bold text-indigo-600">Hub. Langsung<br/>(N = {countLangsung})</th>
                            <th className="py-3 px-3 text-center border-r border-slate-200/80 text-[10px] font-bold text-indigo-600">Tak Langsung<br/>(N = {countTidakLangsung})</th>
                            <th className="py-3 px-3 text-center border-r border-slate-200/80 text-[10px] font-bold text-emerald-600">Hub. Langsung</th>
                            <th className="py-3 px-3 text-center border-r border-slate-200/80 text-[10px] font-bold text-emerald-600">Tak Langsung</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/30 text-slate-600">
                          {DIMENSION_ORDER.map((dimId, idx) => {
                            const statsLangsung = getInteraksiStats(dimId, 'langsung');
                            const statsTidak = getInteraksiStats(dimId, 'tidak');
                            
                            const bmData = benchmarkInteraksiData.find(b => b.dimensi === dimId);
                            const bmLangsung = bmData ? bmData.dengan_pasien : 0;
                            const bmTidak = bmData ? bmData.tanpa_pasien : 0;

                            return (
                              <tr key={`interaksi-dim-${dimId}`} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                                <td className="py-4 px-4 text-center font-extrabold text-indigo-600 border-r border-slate-200/80 bg-slate-50/80 sticky left-0 z-10 shadow-sm">{idx + 1}</td>
                                <td className="py-4 px-5 font-bold text-slate-800 border-r border-slate-200/80 bg-slate-50/80 sticky left-12 z-10 shadow-sm leading-snug">
                                  <div className="space-y-1.5 max-w-[320px]">
                                    <p>{DIMENSI_INFO[dimId].nama}</p>
                                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">{DIMENSI_INFO[dimId].deskripsi}</p>
                                  </div>
                                </td>
                                
                                <td className="py-3 px-4 text-center border-r border-slate-200/80 bg-cyan-50/30">
                                  {statsLangsung.percentage !== null ? <span className={getCellColorClass(statsLangsung.percentage)}>{statsLangsung.percentage.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                </td>
                                <td className="py-3 px-4 text-center border-r border-slate-200/80 bg-cyan-50/30">
                                  {statsTidak.percentage !== null ? <span className={getCellColorClass(statsTidak.percentage)}>{statsTidak.percentage.toFixed(1)}%</span> : <span className="text-slate-400 italic text-[11px]">N/A</span>}
                                </td>

                                <td className="py-3 px-4 text-center border-r border-slate-200/80 font-bold text-slate-600 bg-emerald-50/10">
                                  {bmLangsung > 0 ? <span className={getCellColorClass(bmLangsung)}>{bmLangsung.toFixed(1)}%</span> : '-'}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-600 bg-emerald-50/10">
                                  {bmTidak > 0 ? <span className={getCellColorClass(bmTidak)}>{bmTidak.toFixed(1)}%</span> : '-'}
                                </td>
                              </tr>
                            );
                          })}

                          <tr className="bg-indigo-50/40 border-t-2 border-indigo-200/80 hover:bg-indigo-50/50 transition-all font-black">
                            <td className="py-5 px-4 text-center font-black text-indigo-600 border-r border-slate-200/80 bg-indigo-50/60 sticky left-0 z-10 shadow-sm">★</td>
                            <td className="py-5 px-5 font-black text-slate-800 border-r border-slate-200/80 bg-indigo-50/60 sticky left-12 z-10 shadow-sm">
                              <div className="space-y-1">
                                <div className="text-indigo-700 text-xs font-extrabold uppercase tracking-wide">Rata-rata Seluruh Dimensi</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center border-r border-slate-200/80 bg-cyan-50/40">
                              {(() => { const v = getAverageInteraksiStats('langsung'); return v !== null ? <span className={getCellColorClass(v)}>{v.toFixed(1)}%</span> : '-'; })()}
                            </td>
                            <td className="py-4 px-4 text-center border-r border-slate-200/80 bg-cyan-50/40">
                              {(() => { const v = getAverageInteraksiStats('tidak'); return v !== null ? <span className={getCellColorClass(v)}>{v.toFixed(1)}%</span> : '-'; })()}
                            </td>
                            <td className="py-4 px-4 text-center border-r border-slate-200/80 text-slate-700 bg-emerald-50/20">
                              {benchmarkInteraksiData.length > 0 ? <span className={getCellColorClass(benchmarkInteraksiData.reduce((acc, b) => acc + b.dengan_pasien, 0) / benchmarkInteraksiData.length)}>{(benchmarkInteraksiData.reduce((acc, b) => acc + b.dengan_pasien, 0) / benchmarkInteraksiData.length).toFixed(1)}%</span> : '-'}
                            </td>
                            <td className="py-4 px-4 text-center text-slate-700 bg-emerald-50/20">
                              {benchmarkInteraksiData.length > 0 ? <span className={getCellColorClass(benchmarkInteraksiData.reduce((acc, b) => acc + b.tanpa_pasien, 0) / benchmarkInteraksiData.length)}>{(benchmarkInteraksiData.reduce((acc, b) => acc + b.tanpa_pasien, 0) / benchmarkInteraksiData.length).toFixed(1)}%</span> : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : interactionSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-orange-600" /> Perbandingan Hasil Per Item Kuesioner ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dimension selector and items table */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-1 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Filter Dimensi</h3>
                      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                        {Object.keys(DIMENSI_INFO).map(dimId => {
                          const info = DIMENSI_INFO[dimId];
                          return (
                            <button
                              key={dimId}
                              onClick={() => setSelectedDimId(dimId)}
                              className={`w-full text-left p-3 rounded-xl transition-all text-xs font-semibold flex items-start gap-2.5 ${selectedDimId === dimId ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-extrabold">{info.kode}</span>
                              <span className="flex-1 leading-normal">{info.nama}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-3 space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-extrabold rounded-md">{DIMENSI_INFO[selectedDimId]?.kode}</span>
                          {DIMENSI_INFO[selectedDimId]?.nama}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                          Menampilkan perbandingan persentase respon positif per item kuesioner SOPS 2.0 berdasarkan tingkat interaksi pasien.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {interactionItemScores.filter(q => q.dimId === selectedDimId).map(q => (
                          <div key={q.id} className="border-b border-slate-100 pb-4 last:border-none last:pb-0">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black">{q.id}</span>
                            <p className="text-xs font-bold text-slate-700 mt-2 mb-3 leading-relaxed">{q.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {demografiStats.g4Data.map(g4 => {
                                const val = q[g4.name] || 0;
                                return (
                                  <div key={g4.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-slate-400 truncate max-w-[120px]">{g4.name}</span>
                                      <span className="text-xs font-semibold text-slate-500 mt-0.5">{g4.value} Responden</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : interactionSubView === 'Perbandingan Penilaian Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Keselamatan Pasien Berdasarkan Interaksi Pasien ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Bar Chart of Average Safety Score (1-5) */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Rata-Rata Skor Penilaian Keselamatan</h3>
                        <p className="text-slate-500 text-xs">Skor berkisar antara 1.00 (Buruk) hingga 5.00 (Luar Biasa).</p>
                      </div>

                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={interactionSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 5]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
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

                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={interactionSafetyScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
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
                            <th className="p-3">Kategori Interaksi Pasien</th>
                            <th className="p-3 text-center">Jumlah Responden</th>
                            <th className="p-3 text-center">Rata-Rata Skor</th>
                            <th className="p-3 text-center">Persentase Respons Positif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {interactionSafetyScores.map(row => (
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
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Peristiwa Yang Dilaporkan Berdasarkan Interaksi Pasien ({tahun1})
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">Pilih Tahun:</span>
                        <select value={tahun1} onChange={e => setTahun1(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none w-32 cursor-pointer">
                          {allSelectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 columns: Chart */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Persentase Staf Melaporkan &ge; 1 Peristiwa</h3>
                        <p className="text-slate-500 text-xs">Proporsi responden yang melaporkan setidaknya 1 kejadian tidak diharapkan dalam 12 bulan terakhir.</p>
                      </div>

                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            layout="vertical"
                            data={interactionReportingScores}
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                            <RechartsTooltip formatter={(val: any) => [`${val}%`, 'Melaporkan Kejadian']} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }} />
                            <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="rate" position="right" formatter={(val: any) => `${val}%`} fill="#6d28d9" fontSize={11} fontWeight="bold" />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right column: Info/Stats Summary */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Ikhtisar Pelaporan</h3>
                        <p className="text-slate-500 text-xs">Pelajaran kualitatif dari pola pelaporan insiden berdasarkan interaksi staf dengan pasien.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/40">
                          <span className="text-xs font-bold text-purple-700 block mb-1">Rekomendasi Utama</span>
                          <p className="text-[11px] font-medium text-purple-600 leading-relaxed">
                            Mendorong keterbukaan pelaporan bagi staf yang tidak berinteraksi langsung agar terus berpartisipasi aktif dalam mitigasi risiko sistemik.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500">Pola Berdasarkan Interaksi</span>
                          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Staf yang sering berinteraksi langsung dengan pasien memiliki peluang deteksi risiko klinis yang lebih tinggi, meningkatkan frekuensi pelaporan insiden.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                              <span>Sistem pelaporan harus tetap responsif, ramah, dan bebas menyalahkan (no-blame culture) di semua lini interaksi staf.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
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
              )
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
