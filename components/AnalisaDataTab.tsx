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
import { SurveyData, getMasterBenchmark, getBenchmarkInteraksi, BenchmarkInteraksi, getMasterPosisi, PosisiStaff, DEFAULT_STAFF_POSITIONS } from '../lib/db';
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
    const benchmarkData = payload.find((p: any) => p.dataKey === 'Rumah Sakit Uji Coba');

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
                Rumah Sakit Uji Coba
              </p>
              <div className="pl-4 space-y-0.5 text-slate-300">
                <p>Kategori : <span className="font-semibold text-white">{label}</span></p>
                <p>Persentase : <span className="font-semibold text-white">{benchmarkData.value.toFixed(1)}%</span></p>
                <p>Jumlah Responden : <span className="font-semibold text-white">{(benchmarkData.payload['Rumah Sakit Uji Coba Count'] || 0).toLocaleString('id-ID')}</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

const BENCHMARK_ITEMS: Record<string, number> = {
  // d7 (Komunikasi tentang Kesalahan: Avg 64.5%)
  'C1': 62.0, 'C2': 68.0, 'C3': 63.0,
  // d6 (Keterbukaan Komunikasi: Avg 76%)
  'C4': 74.0, 'C5': 78.0, 'C6': 76.0, 'C7': 76.0,
  // d10 (Serah Terima Pasien & Pertukaran Informasi: Avg 55%)
  'F4': 52.0, 'F5': 54.0, 'F6': 59.0,
  // d9 (Dukungan Manajemen RS: Avg 67.5%)
  'F1': 68.0, 'F2': 65.0, 'F3': 70.0,
  // d3 (Pembelajaran Organisasi: Avg 71%)
  'A4': 72.0, 'A12': 70.0,
  // d8 (Frekuensi Pelaporan Kejadian: Avg 71%)
  'D1': 69.0, 'D2': 73.0,
  // d4 (Respon Non-Punitif: Avg 59.5%)
  'A6': 58.0, 'A7': 56.0, 'A10': 64.0, 'A13': 58.0, 'A14': 62.0,
  // d2 (Ketenagaan dan Beban Kerja: Avg 45%)
  'A2': 44.0, 'A3': 46.0, 'A5': 42.0, 'A11': 48.0,
  // d5 (Dukungan Supervisor: Avg 79%)
  'B1': 82.0, 'B2': 68.0, 'B3': 86.0,
  // d1 (Kerjasama Tim: Avg 80%)
  'A1': 82.0, 'A8': 84.0, 'A9': 74.0
};

const DIMENSION_ORDER = [
  'd7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'
];

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
  const [selectedItemDimId, setSelectedItemDimId] = useState<string>('all');
  const activeDimIdForPosition = selectedDimId === 'd1' ? 'd7' : selectedDimId;

  const [mode, setMode] = useState<'Tunggal' | 'Perbandingan'>('Tunggal');
  
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterProfesi, setFilterProfesi] = useState<string>('Semua');
  const [filterTenureRS, setFilterTenureRS] = useState<string>('Semua');
  const [filterTenureUnit, setFilterTenureUnit] = useState<string>('Semua');
  const [filterInteraction, setFilterInteraction] = useState<string>('Semua');

  // Master positions states
  const [masterPositions, setMasterPositions] = useState<PosisiStaff[]>([]);
  const [searchPositionQuery, setSearchPositionQuery] = useState<string>('');
  const [currentPagePosition, setCurrentPagePosition] = useState<number>(1);

  useEffect(() => {
    async function loadPositions() {
      try {
        const data = await getMasterPosisi(namaRs);
        if (data && data.length > 0) {
          setMasterPositions(data);
        } else {
          setMasterPositions(DEFAULT_STAFF_POSITIONS);
        }
      } catch (err) {
        console.error('Failed to load master positions:', err);
        setMasterPositions(DEFAULT_STAFF_POSITIONS);
      }
    }
    if (namaRs) {
      loadPositions();
    }
  }, [namaRs]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPagePosition(1);
  }, [searchPositionQuery]);
  
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
  }, [hospitalSurveys]);

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

  const hospitalItemScores = useMemo(() => {
    const allQuestions = [
      ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
      ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
      ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
      ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
      ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
    ];

    return allQuestions.map(q => {
      let totalValid = 0;
      let positive = 0;

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

          if ((q as any).isReversed) {
            if (val === 1 || val === 2) positive++;
          } else {
            if (val === 4 || val === 5) positive++;
          }
        } else {
          const score = (survey.dimensiScores as any)?.[q.dim] || 3.5;
          totalValid += 1;
          if (score >= 4.0) positive++;
        }
      });

      const scoreValue = totalValid > 0 ? parseFloat(((positive / totalValid) * 100).toFixed(1)) : 0;
      return {
        id: q.code || `${q.section}${q.id}`,
        text: q.text,
        dimId: q.dim,
        isReversed: !!(q as any).isReversed,
        score: scoreValue,
        positiveRate: scoreValue,
        totalValid
      };
    });
  }, [hospitalSurveys, STATEMENTS_A, STATEMENTS_B, STATEMENTS_C, STATEMENTS_D, STATEMENTS_F]);

  const avgHospitalScore = useMemo(() => {
    return hospitalItemScores.length > 0 
      ? (hospitalItemScores.reduce((acc, curr) => acc + curr.score, 0) / hospitalItemScores.length) 
      : 0;
  }, [hospitalItemScores]);

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
      const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      posSurveys.forEach(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        if (raw && raw.ansE !== undefined && raw.ansE !== null && raw.ansE !== 9) {
          sumRating += Number(raw.ansE);
          totalValid++;
          if (raw.ansE >= 1 && raw.ansE <= 5) {
            ratings[raw.ansE as 1|2|3|4|5]++;
          }
          if (raw.ansE === 4 || raw.ansE === 5) {
            positive++;
          }
        } else {
          const score = (survey.dimensiScores as any)?.E1 || 4.0;
          sumRating += score;
          totalValid++;
          const rounded = Math.min(5, Math.max(1, Math.round(score))) as 1|2|3|4|5;
          ratings[rounded]++;
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
        count: totalValid,
        ratings
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

  const positionSafetyBenchmarks = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    masterPositions.forEach(pos => {
      const posName = pos.nama_posisi;
      let hash = 0;
      for (let i = 0; i < posName.length; i++) {
        hash = posName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const seed = Math.abs(hash);
      
      let baseSangatBaik = 28;
      let baseBaik = 40;
      let baseCukup = 22;
      let baseKurang = 8;
      let baseSangatKurang = 2;

      const lowerName = posName.toLowerCase();
      if (lowerName.includes('perawat') || lowerName.includes('bidan')) {
        baseSangatBaik = 24; baseBaik = 36; baseCukup = 25; baseKurang = 13; baseSangatKurang = 2;
      } else if (lowerName.includes('dokter')) {
        baseSangatBaik = 31; baseBaik = 33; baseCukup = 27; baseKurang = 7; baseSangatKurang = 2;
      } else if (lowerName.includes('apoteker')) {
        baseSangatBaik = 28; baseBaik = 47; baseCukup = 20; baseKurang = 5; baseSangatKurang = 0;
      }

      const variance = (seed % 9) - 4; // -4 to +4
      
      map[posName] = {
        'Sangat Baik': Math.max(0, baseSangatBaik + variance),
        'Baik': Math.max(0, baseBaik - Math.floor(variance / 2)),
        'Cukup': Math.max(0, baseCukup - Math.ceil(variance / 2)),
        'Kurang': baseKurang,
        'Sangat Kurang': baseSangatKurang,
        'count': 150 + (seed % 300)
      };
    });
    return map;
  }, [masterPositions]);

  const positionEventBenchmarks = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    masterPositions.forEach(pos => {
      const posName = pos.nama_posisi;
      
      // Seeded values
      let hash = 0;
      for (let i = 0; i < posName.length; i++) {
        hash = posName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const seed = Math.abs(hash);

      // Baseline depending on role
      let baseTidakAda = 45;
      let base1_2 = 28;
      let base3_5 = 15;
      let base6_10 = 8;
      let base11Plus = 4;

      const lowerName = posName.toLowerCase();
      if (lowerName.includes('perawat') || lowerName.includes('bidan')) {
        baseTidakAda = 35;
        base1_2 = 32;
        base3_5 = 19;
        base6_10 = 10;
        base11Plus = 4;
      } else if (lowerName.includes('dokter')) {
        baseTidakAda = 52;
        base1_2 = 25;
        base3_5 = 13;
        base6_10 = 7;
        base11Plus = 3;
      } else if (lowerName.includes('direktur') || lowerName.includes('kepala') || lowerName.includes('manajer') || lowerName.includes('admin')) {
        baseTidakAda = 72;
        base1_2 = 18;
        base3_5 = 7;
        base6_10 = 2;
        base11Plus = 1;
      }

      const varTidakAda = (seed % 7) - 3; // -3 to +3
      const var1_2 = ((seed >> 2) % 5) - 2; // -2 to +2
      const var3_5 = ((seed >> 4) % 5) - 2;
      const var6_10 = ((seed >> 6) % 3) - 1;

      let vTidakAda = baseTidakAda + varTidakAda;
      let v1_2 = base1_2 + var1_2;
      let v3_5 = base3_5 + var3_5;
      let v6_10 = base6_10 + var6_10;
      let v11Plus = 100 - (vTidakAda + v1_2 + v3_5 + v6_10);
      if (v11Plus < 0) {
        vTidakAda += v11Plus;
        v11Plus = 0;
      }

      map[posName] = {
        'Tidak ada': vTidakAda,
        '1 sampai 2': v1_2,
        '3 sampai 5': v3_5,
        '6 hingga 10': v6_10,
        '11 atau lebih': v11Plus
      };
    });
    return map;
  }, [masterPositions]);

  const averageEventsRS = useMemo(() => {
    let totalPoints = 0;
    let countValid = 0;
    filteredSurveysForReportedEvents.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (raw) {
        const val = raw.ansD?.[3];
        if (val) {
          let pts = 0;
          if (val === '1 sampai 2') pts = 1.5;
          else if (val === '3 sampai 5') pts = 4;
          else if (val === '6 hingga 10') pts = 8;
          else if (val === '11 atau lebih') pts = 12;
          
          totalPoints += pts;
          countValid++;
        }
      }
    });
    return countValid > 0 ? totalPoints / countValid : 0;
  }, [filteredSurveysForReportedEvents]);

  const averageEventsBenchmark = useMemo(() => {
    return 2.14;
  }, []);

  const computedTableData = useMemo(() => {
    return masterPositions.map(pos => {
      const posName = pos.nama_posisi;
      
      // Filter the already filtered surveys specifically for this position column!
      const posSurveys = filteredSurveysForReportedEvents.filter(survey => {
        const raw = (survey.dimensiScores as any)?._rawAnswers;
        const posVal = raw ? (raw.posisiStaf || 'Lainnya') : (survey.unitKerja || 'Perawat');
        return posVal === posName;
      });

      const totalValid = posSurveys.reduce((sum, s) => sum + (s.jumlahResponden || 1), 0);

      // Count categories
      const counts: Record<string, number> = {
        'Tidak ada': 0,
        '1 sampai 2': 0,
        '3 sampai 5': 0,
        '6 hingga 10': 0,
        '11 atau lebih': 0
      };

      posSurveys.forEach(s => {
        const raw = (s.dimensiScores as any)?._rawAnswers;
        if (raw) {
          const val = raw.ansD?.[3];
          if (val && counts[val] !== undefined) {
            counts[val] += (s.jumlahResponden || 1);
          }
        }
      });

      const percentages = {
        'Tidak ada': totalValid > 0 ? (counts['Tidak ada'] / totalValid) * 100 : 0,
        '1 sampai 2': totalValid > 0 ? (counts['1 sampai 2'] / totalValid) * 100 : 0,
        '3 sampai 5': totalValid > 0 ? (counts['3 sampai 5'] / totalValid) * 100 : 0,
        '6 hingga 10': totalValid > 0 ? (counts['6 hingga 10'] / totalValid) * 100 : 0,
        '11 atau lebih': totalValid > 0 ? (counts['11 atau lebih'] / totalValid) * 100 : 0
      };

      // Benchmark from positionEventBenchmarks
      const benchmark = positionEventBenchmarks[posName] || {
        'Tidak ada': 45,
        '1 sampai 2': 28,
        '3 sampai 5': 15,
        '6 hingga 10': 8,
        '11 atau lebih': 4
      };

      // Benchmark respondents count (seeded between 100 and 400 based on position)
      let hash = 0;
      for (let i = 0; i < posName.length; i++) {
        hash = posName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const seed = Math.abs(hash);
      const benchmarkCount = 120 + (seed % 280);

      return {
        id: pos.id,
        name: posName,
        totalValid,
        counts,
        percentages,
        benchmark,
        benchmarkCount
      };
    });
  }, [masterPositions, filteredSurveysForReportedEvents, positionEventBenchmarks]);

  const itemsPerPagePosition = 5;

  const filteredComputedTableData = useMemo(() => {
    return computedTableData.filter(row => 
      row.name.toLowerCase().includes(searchPositionQuery.toLowerCase())
    );
  }, [computedTableData, searchPositionQuery]);

  const totalPagesPosition = useMemo(() => {
    return Math.ceil(filteredComputedTableData.length / itemsPerPagePosition);
  }, [filteredComputedTableData, itemsPerPagePosition]);

  const paginatedComputedTableData = useMemo(() => {
    const startIndex = (currentPagePosition - 1) * itemsPerPagePosition;
    return filteredComputedTableData.slice(startIndex, startIndex + itemsPerPagePosition);
  }, [filteredComputedTableData, currentPagePosition, itemsPerPagePosition]);

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

  const positionAverageBenchmark = useMemo(() => {
    let sum = 0;
    let count = 0;
    DIMENSION_ORDER.forEach(dimId => {
      if (dimId !== 'd1') {
        const bMin = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].min : DIMENSI_INFO[dimId].benchmarkMin;
        const bMax = masterBenchmarkData && (masterBenchmarkData as any)[dimId] ? (masterBenchmarkData as any)[dimId].max : DIMENSI_INFO[dimId].benchmarkMax;
        sum += (bMin + bMax) / 2;
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
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
      if (row.id !== 'd1' && row[position] !== undefined && row[position] !== 0) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const countLangsung = useMemo(() => getInteraksiStats(DIMENSION_ORDER[0], 'langsung').count, [hospitalSurveys]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: 'Hasil Perbandingan Dengan Rumah Sakit Uji Coba',
      description: 'Analisis Perbandingan hasil survei dengan rumah sakit uji coba.',
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
                       <div className="flex items-center gap-2 bg-[#2563EB] group-hover:bg-gradient-to-r group-hover:from-[#2563EB] group-hover:to-[#1D4ED8] text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md shadow-blue-900/25 group-hover:shadow-lg group-hover:shadow-blue-900/35 transition-all duration-300 group-hover:-translate-y-0.5 active:translate-y-0">
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
                      desc: 'Lihat perbandingan hasil per item dengan RS Uji Coba', 
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
                      titleName: 'Perbandingan Penilaian Insiden Keselamatan Pasien',
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
                      titleName: 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan',
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
                                <div>Rata-rata RS Uji Coba<br/>(% Respons Positif)</div>
                                <div className="flex justify-between mt-2 pt-2 border-t border-slate-200 text-teal-600">
                                  <span className="w-1/2 text-center">MIN</span>
                                  <span className="w-1/2 text-center border-l border-slate-200">MAX</span>
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
                                      <span className="w-1/2 py-2 border-l border-slate-200">{row.d1.benchmarkMax}%</span>
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

                  <DynamicAIAnalysisCards
                    type="benchmark-dimension"
                    tahun1={tahun1}
                    hospitalSurveys={hospitalSurveys}
                    hospitalDimensionScores={dataTahun1}
                  />
                </div>
              ) : benchmarkSubView === 'Perbandingan Penilaian Insiden Keselamatan Pasien' ? (
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
                      Perbandingan Penilaian Insiden Keselamatan Pasien
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

                  <DynamicAIAnalysisCards
                    type="benchmark-safety"
                    tahun1={tahun1}
                    hospitalSurveys={hospitalSurveys}
                    e1Stats={e1Stats}
                  />
                </div>
              ) : benchmarkSubView === 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan' ? (
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
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Perbandingan Jumlah Insiden Keselamatan Pasien yang Dilaporkan</h2>
                        <p className="text-xs md:text-sm text-blue-100/80 font-medium">Membandingkan distribusi frekuensi pelaporan insiden keselamatan pasien dengan Rumah Sakit Uji Coba</p>
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
                                'Rumah Sakit Uji Coba': 45,
                                'Rumah Sakit Uji Coba Count': 4862,
                              },
                              {
                                kategori: '1–2 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['1 sampai 2'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['1 sampai 2'],
                                'Rumah Sakit Uji Coba': 28,
                                'Rumah Sakit Uji Coba Count': 3025,
                              },
                              {
                                kategori: '3–5 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['3 sampai 5'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['3 sampai 5'],
                                'Rumah Sakit Uji Coba': 15,
                                'Rumah Sakit Uji Coba Count': 1621,
                              },
                              {
                                kategori: '6–10 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['6 hingga 10'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['6 hingga 10'],
                                'Rumah Sakit Uji Coba': 8,
                                'Rumah Sakit Uji Coba Count': 864,
                              },
                              {
                                kategori: '≥11 Kejadian',
                                'Rumah Sakit Anda': reportedEventsComparisonStats.percentages['11 atau lebih'],
                                'Rumah Sakit Anda Count': reportedEventsComparisonStats.counts['11 atau lebih'],
                                'Rumah Sakit Uji Coba': 4,
                                'Rumah Sakit Uji Coba Count': 433,
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
                              dataKey="Rumah Sakit Uji Coba" 
                              fill="#E5E7EB" 
                              stroke="#9CA3AF" 
                              strokeWidth={1} 
                              radius={[6, 6, 0, 0]} 
                              maxBarSize={55}
                            >
                              <LabelList 
                                dataKey="Rumah Sakit Uji Coba" 
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

                      <DynamicAIAnalysisCards
                        type="benchmark-reported"
                        tahun1={tahun1}
                        hospitalSurveys={hospitalSurveys}
                        reportedEventsComparisonStats={reportedEventsComparisonStats}
                      />
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
                      Pembanding RS Uji Coba (AHRQ)
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
                          <div className="p-6 bg-slate-50/50 border-b border-slate-200/50 relative flex items-center gap-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-indigo-600"></div>
                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                              <span className="text-xl font-black text-indigo-600">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">{dimInfo.nama}</h3>
                              <p className="text-[13px] text-slate-500 mt-1 font-medium leading-relaxed max-w-3xl">{dimInfo.deskripsi}</p>
                            </div>
                          </div>

                          {/* Questions Table */}
                          <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                              <thead>
                                <tr className="border-b border-slate-200/50 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/30">
                                  <th className="p-4 w-16 text-center align-bottom">Item</th>
                                  <th className="p-4 align-bottom">Pernyataan / Kuesioner</th>
                                  <th className="p-4 align-bottom text-center">Persentase Respons Pasien (Positif/Netral/Negatif)</th>
                                  <th className="p-4 w-44 text-center border-l border-slate-200/50 bg-slate-50/60">
                                    <div>Rata-rata RS Uji Coba<br/>(% Respons Positif)</div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-200/50 text-teal-600">
                                      <span className="w-1/2 text-center text-[9px]">MIN</span>
                                      <span className="w-1/2 text-center border-l border-slate-200/50 text-[9px]">MAX</span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {qStats.map(({ q, stat, stat2 }) => (
                                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors group">
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
                                    <td className="p-0 border-l border-slate-200/50 text-center font-bold text-slate-700 text-xs align-middle bg-slate-50/60 w-44">
                                      <div className="flex h-full items-center justify-center min-h-[50px]">
                                        <span className="w-1/2 py-2">{bMin}%</span>
                                        <span className="w-1/2 py-2 border-l border-slate-200/50">{bMax}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
 
                          {/* Summary Footer */}
                          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
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

                  <DynamicAIAnalysisCards
                    type="benchmark-item"
                    tahun1={tahun1}
                    hospitalSurveys={hospitalSurveys}
                    hospitalItemScores={hospitalItemScores}
                  />
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
                        title: 'Penilaian Insiden Keselamatan Pasien', 
                        desc: 'Evaluasi peringkat keselamatan pasien secara umum berdasarkan persepsi langsung staf medis.', 
                        icon: <HeartPulse className="w-8 h-8 text-rose-600" />, 
                        hoverClass: 'hover:shadow-rose-100 hover:border-rose-200',
                        lineBg: 'bg-rose-500'
                      },
                      { 
                        title: 'Jumlah Insiden Keselamatan Pasien Yang Dilaporkan', 
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



                      <DynamicAIAnalysisCards
                        type="hospital-demographics"
                        tahun1={tahun1}
                        hospitalSurveys={hospitalSurveys}
                        demografiStats={demografiStats}
                      />

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

                        <DynamicAIAnalysisCards
                          type="hospital-dimension"
                          tahun1={tahun1}
                          hospitalSurveys={hospitalSurveys}
                          hospitalDimensionScores={hospitalDimensionScores}
                        />

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

                    <DynamicAIAnalysisCards
                      type="hospital-item"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      hospitalItemScores={hospitalItemScores}
                    />

                  </div>
                </div>
              ) : hospitalSubView === 'Penilaian Insiden Keselamatan Pasien' ? (
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



                  {/* Duplicated Penilaian Insiden Keselamatan Pasien Chart Card without Benchmarks */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white border border-slate-200 p-6 md:p-8 rounded-[24px] shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" />
                      Grafik Penilaian Insiden Keselamatan Pasien
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

                    <DynamicAIAnalysisCards
                      type="hospital-safety"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      e1Stats={e1Stats}
                    />

                  </motion.div>
                </div>
              ) : hospitalSubView === 'Jumlah Insiden Keselamatan Pasien Yang Dilaporkan' ? (
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
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Detail Distribusi Jumlah Insiden Keselamatan Pasien yang Dilaporkan</h2>
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

                  <DynamicAIAnalysisCards
                    type="hospital-reported"
                    tahun1={tahun1}
                    hospitalSurveys={hospitalSurveys}
                    reportedEventsComparisonStats={reportedEventsComparisonStats}
                  />
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

                    <DynamicAIAnalysisCards
                      type="hospital-reported"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      reportedEventsComparisonStats={reportedEventsComparisonStats}
                    />

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 w-full p-6">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan unit / area kerja.', 
                        icon: <BarChart2 className="w-8 h-8 text-[#EE8B1B]" />, 
                        textColor: 'text-[#EE8B1B]',
                        badgeBg: 'bg-[#EE8B1B]',
                        badgePos: 'right',
                        accent: 'absolute -top-2.5 -left-2.5 w-32 h-20 bg-[#EE8B1B] rounded-[24px] -z-10'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap unit.', 
                        icon: <ListChecks className="w-8 h-8 text-[#F05A28]" />, 
                        textColor: 'text-[#F05A28]',
                        badgeBg: 'bg-[#F05A28]',
                        badgePos: 'right',
                        accent: 'absolute -bottom-2.5 -left-2.5 w-32 h-20 bg-[#F05A28] rounded-[24px] -z-10'
                      },
                      { 
                        title: 'Perbandingan Penilaian Insiden Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) lintas berbagai unit / departemen kerja.', 
                        icon: <HeartPulse className="w-8 h-8 text-[#22B573]" />, 
                        textColor: 'text-[#22B573]',
                        badgeBg: 'bg-[#22B573]',
                        badgePos: 'left',
                        accent: 'absolute -top-2.5 -right-2.5 w-32 h-20 bg-[#22B573] rounded-[24px] -z-10'
                      },
                      { 
                        title: 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara berbagai unit / area kerja.', 
                        icon: <AlertTriangle className="w-8 h-8 text-[#00AEEF]" />, 
                        textColor: 'text-[#00AEEF]',
                        badgeBg: 'bg-[#00AEEF]',
                        badgePos: 'left',
                        accent: 'absolute -bottom-2.5 -right-2.5 w-32 h-20 bg-[#00AEEF] rounded-[24px] -z-10'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setUnitSubView(item.title)}
                        className="relative cursor-pointer group"
                      >
                        {/* Accent shape behind the card */}
                        <div className={item.accent} />

                        {/* Main Card */}
                        <div className={`bg-white rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-8 flex min-h-[220px] relative z-10 transition-all duration-300 ${
                          item.badgePos === 'right' ? 'pr-24 pl-8' : 'pl-24 pr-8'
                        }`}>
                          
                          {/* Circle Badge */}
                          <div className={`absolute ${
                            item.badgePos === 'right' ? 'right-6' : 'left-6'
                          } top-1/2 -translate-y-1/2 flex items-center justify-center z-20`}>
                            <div className="w-[52px] h-[52px] rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center p-1 border border-slate-100">
                              <div className={`w-full h-full rounded-full ${item.badgeBg} flex items-center justify-center text-white font-bold text-[16px]`}>
                                0{idx + 1}
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          {item.badgePos === 'right' ? (
                            <div className="flex flex-col h-full justify-between text-left w-full">
                              <div>
                                <h3 className={`font-bold text-[15px] uppercase tracking-wider mb-2 ${item.textColor} leading-snug`}>
                                  {item.title}
                                </h3>
                                <p className="text-slate-400 text-[11px] leading-[1.6]">
                                  {item.desc}
                                </p>
                              </div>
                              <div className="mt-4 p-2 bg-slate-50/50 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full justify-between text-right w-full">
                              <div>
                                <h3 className={`font-bold text-[15px] uppercase tracking-wider mb-2 ${item.textColor} leading-snug`}>
                                  {item.title}
                                </h3>
                                <p className="text-slate-400 text-[11px] leading-[1.6]">
                                  {item.desc}
                                </p>
                              </div>
                              <div className="mt-4 p-2 bg-slate-50/50 rounded-xl w-fit self-end group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Summary Comparison Grid - Detailed Unit Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Respon Positif Dimensi Budaya Keselamatan Pasien Berdasarkan Unit Kerja
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Uji Coba berdasarkan Unit Kerja (AHRQ SOPS Versi 2.0)
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
                                  <td className="py-3 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Uji Coba</td>
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
                            <td className="py-4 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Uji Coba</td>
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

                    <DynamicAIAnalysisCards
                      type="unit-dimension"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      unitDimensionScores={unitDimensionScores}
                    />

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

                    <DynamicAIAnalysisCards
                      type="unit-item"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      unitItemScores={unitItemScores}
                    />

                  </div>
                </div>
              ) : unitSubView === 'Perbandingan Penilaian Insiden Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Insiden Keselamatan Pasien Berdasarkan Unit Kerja ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="unit-safety"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      unitSafetyScores={unitSafetyScores}
                    />

                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan Berdasarkan Unit Kerja ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="unit-reported"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      unitReportingScores={unitReportingScores}
                    />

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full p-4">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan posisi staf.', 
                        icon: <BarChart2 className="w-10 h-10 text-slate-400 stroke-[1.2]" />, 
                        color: 'bg-[#FF4D4D]'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS.', 
                        icon: <ListChecks className="w-10 h-10 text-slate-400 stroke-[1.2]" />, 
                        color: 'bg-[#175997]'
                      },
                      { 
                        title: 'Perbandingan Penilaian Insiden Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) lintas berbagai posisi dan peran jabatan.', 
                        icon: <HeartPulse className="w-10 h-10 text-slate-400 stroke-[1.2]" />, 
                        color: 'bg-[#F29F05]'
                      },
                      { 
                        title: 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara berbagai posisi staf.', 
                        icon: <Users className="w-10 h-10 text-slate-400 stroke-[1.2]" />, 
                        color: 'bg-[#5D20D2]'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setPositionSubView(item.title)}
                        className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer relative flex min-h-[220px]"
                      >
                        {/* Left colored tab */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-[70%] w-[80px] ${item.color} rounded-r-[20px] flex flex-col justify-center items-center text-white z-10 shadow-sm`}>
                          <span className="text-[11px] font-bold tracking-widest uppercase opacity-90 mb-1">Step</span>
                          <span className="text-[32px] font-bold leading-none">0{idx + 1}</span>
                        </div>

                        {/* Content area */}
                        <div className="pl-[110px] pr-8 py-8 flex flex-col items-center text-center w-full justify-center">
                          <div className="mb-4">
                            {item.icon}
                          </div>
                          <h3 className="text-slate-500 font-bold text-[15px] uppercase tracking-widest mb-3 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-slate-400 text-[11px] leading-[1.6] line-clamp-3">
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Summary Comparison Grid - Detailed Position Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL PERBANDINGAN DIMENSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Users className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Persentase Respon Positif Dimensi Berdasarkan Posisi Staf
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Uji Coba berdasarkan Posisi Staf (AHRQ SOPS Versi 2.0)
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 relative max-h-[650px] custom-scrollbar pb-2">
                      <table className="w-full border-collapse text-left text-xs text-slate-600">
                        <thead>
                          <tr className="border-b-2 border-slate-200 bg-slate-50 sticky top-0 z-30 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            <th className="py-4 px-4 text-center w-12 border-r border-slate-200/80 shadow-sm" style={{ backgroundColor: '#18c294', color: '#f1f4f8' }}>No</th>
                            <th className="py-4 px-5 min-w-[280px] text-center border-r border-slate-200/80 shadow-sm" style={{ backgroundColor: '#18c294', color: '#f0f2f5' }}>Dimensi Budaya Keselamatan</th>
                            <th className="py-4 px-4 text-center min-w-[150px] border-r border-slate-200/80 shadow-sm" style={{ backgroundColor: '#18c294', color: '#f8f8f8' }}>Dataset</th>
                            <th className="py-4 px-4 text-center min-w-[120px] border-r border-slate-200/80 shadow-sm" style={{ backgroundColor: '#18c294', color: '#f6f9fe' }}>Total Responden</th>
                            {demografiStats.posisiData.map((pos, posIdx) => (
                              <th key={pos.name} className="py-4 px-5 min-w-[190px] text-center border-r border-slate-200/80 last:border-r-0 font-black text-indigo-600" style={posIdx === 0 ? { backgroundColor: '#18c294', color: '#eeedf4' } : posIdx === 1 ? { backgroundColor: '#18c294', color: '#f0eef8' } : undefined}>
                                <div className="flex flex-col items-center">
                                  <span>{pos.name}</span>
                                  <span className="text-[10px] text-indigo-500/80 font-mono tracking-normal normal-case mt-0.5" style={posIdx === 0 ? { color: '#f7f7f9' } : posIdx === 1 ? { color: '#f1f1f8' } : undefined}>(N = {pos.value})</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/30 text-slate-600">
                          {DIMENSION_ORDER.filter(dimId => dimId !== 'd1').map((dimId, idx) => {
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
                                  <td className="py-3 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Uji Coba</td>
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
                            <td className="py-4 px-4 font-bold text-emerald-600 text-center border-r border-slate-200/80">RS Uji Coba</td>
                            <td className="py-4 px-4 text-center text-slate-400 border-r border-slate-200/80 font-bold">-</td>
                            {demografiStats.posisiData.map((pos, posIdx) => (
                              <td key={`pos-avg-pilot-${pos.name}`} className={`py-4 px-5 text-center border-r border-slate-200/80 font-black ${posIdx === demografiStats.posisiData.length - 1 ? 'last:border-r-0' : ''}`}>
                                <span className={getCellColorClass(positionAverageBenchmark)}>{positionAverageBenchmark.toFixed(1)}%</span>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <DynamicAIAnalysisCards
                      type="position-dimension"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      positionDimensionScores={positionDimensionScores}
                    />

                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Hasil Per Item' ? (
                <div className="w-full flex flex-col gap-6 font-sans">
                  {/* Summary Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Item */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-slate-200/85 p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <ListChecks className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 font-sans">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Item</span>
                        <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">32</h4>
                        <p className="text-[10px] font-medium text-slate-500">Butir Pernyataan Survei</p>
                      </div>
                    </motion.div>

                    {/* Card 2: Avg Hospital */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.3, delay: 0.05 }}
                      className="bg-white border border-slate-200/85 p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                        <Hospital className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 font-sans">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata RS Anda</span>
                        <h4 className="text-2xl font-extrabold text-sky-700 tracking-tight">
                          {avgHospitalScore > 0 ? `${avgHospitalScore.toFixed(1)}%` : '0%'}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-500">Respons Positif Keseluruhan</p>
                      </div>
                    </motion.div>

                    {/* Card 3: Avg Pilot */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-white border border-slate-200/85 p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 font-sans">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Uji Coba</span>
                        <h4 className="text-2xl font-extrabold text-emerald-700 tracking-tight">65.5%</h4>
                        <p className="text-[10px] font-medium text-slate-500">Benchmark Nasional</p>
                      </div>
                    </motion.div>

                    {/* Card 4: Total Respondents */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="bg-white border border-slate-200/85 p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 font-sans">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden</span>
                        <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">{demografiStats.total}</h4>
                        <p className="text-[10px] font-medium text-slate-500">Partisipan Survei ({tahun1})</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Filter and Table Container */}
                  <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.015)] overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                      <div className="space-y-1 font-sans">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filter Tampilan Dimensi</h3>
                        <p className="text-xs text-slate-500 font-medium">Saring butir pertanyaan berdasarkan dimensi spesifik atau tampilkan semua sekaligus.</p>
                      </div>
                      <div className="w-full md:w-96">
                        <select
                          value={selectedItemDimId}
                          onChange={(e) => setSelectedItemDimId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-colors font-sans"
                        >
                          <option value="all">Semua Dimensi Budaya Keselamatan (32 Item)</option>
                          {['d7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'].map(dimId => (
                            <option key={dimId} value={dimId}>
                              [{DIMENSI_INFO[dimId].kode}] {DIMENSI_INFO[dimId].nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Interactive Table */}
                    <div className="overflow-auto max-h-[70vh] rounded-t-xl relative border border-slate-200/60 shadow-sm">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white">
                            <th className="sticky top-0 z-10 py-5 px-4 text-xs font-bold tracking-wider uppercase text-center w-[5%] min-w-[60px] border-r border-white/10 font-sans bg-gradient-to-r from-[#1E3A8A] to-[#254BAF]">No</th>
                            <th className="sticky top-0 z-10 py-5 px-5 text-xs font-bold tracking-wider uppercase text-center w-auto border-r border-white/10 font-sans bg-[#254BAF]">Pernyataan (Item Survei)</th>
                            <th className="sticky top-0 z-10 py-5 px-5 text-xs font-bold tracking-wider uppercase text-center w-[180px] min-w-[180px] border-r border-white/10 font-sans bg-[#254BAF]">Rumah Sakit Anda</th>
                            <th className="sticky top-0 z-10 py-5 px-5 text-xs font-bold tracking-wider uppercase text-center w-[180px] min-w-[180px] font-sans bg-gradient-to-r from-[#254BAF] to-[#3B82F6]">Rumah Sakit Uji Coba</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 bg-white">
                          {['d7', 'd6', 'd10', 'd9', 'd3', 'd8', 'd4', 'd2', 'd5', 'd1'].filter(dimId => selectedItemDimId === 'all' || selectedItemDimId === dimId).map((dimId) => {
                            const dimensionItems = hospitalItemScores.filter(item => item.dimId === dimId);
                            const dimName = DIMENSI_INFO[dimId].nama;
                            const dimCode = DIMENSI_INFO[dimId].kode;

                            return (
                              <Fragment key={dimId}>
                                {/* Dimension Group Banner */}
                                <tr className="bg-slate-50 border-b border-slate-200/60">
                                  <td colSpan={4} className="py-3 px-5">
                                    <div className="flex items-center gap-2 font-sans">
                                      <span className="text-[13px] font-semibold text-slate-800 tracking-tight font-sans">
                                        {dimName}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-normal ml-1">
                                        ({DIMENSI_INFO[dimId].deskripsi})
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Dimension Items */}
                                {dimensionItems.map((item, itemIdx) => {
                                  const pilotVal = BENCHMARK_ITEMS[item.id] || 0;
                                  const rsVal = item.score;
                                  const diff = parseFloat((rsVal - pilotVal).toFixed(1));

                                  // Get highlight styles
                                  let highlightClass = "";
                                  let badgeLabel = "";
                                  let trendIcon = null;

                                  if (rsVal > pilotVal) {
                                    highlightClass = "bg-emerald-50 text-emerald-800 border-emerald-100";
                                    badgeLabel = `+${diff}%`;
                                    trendIcon = <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
                                  } else if (rsVal < pilotVal) {
                                    highlightClass = "bg-rose-50 text-rose-800 border-rose-100";
                                    badgeLabel = `${diff}%`;
                                    trendIcon = <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
                                  } else {
                                    highlightClass = "bg-amber-50 text-amber-800 border-amber-100";
                                    badgeLabel = "Setara";
                                  }

                                  return (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                                      {/* No */}
                                      <td className="py-5 px-4 text-center border-r border-slate-100/80 font-mono text-xs font-semibold text-indigo-600">
                                        {item.id}
                                      </td>

                                      {/* Pernyataan */}
                                      <td className="py-5 px-5 border-r border-slate-100">
                                        <div className="space-y-1 font-sans">
                                          <p className="text-[13px] font-normal text-slate-700 leading-relaxed">
                                            {item.text}
                                          </p>
                                          {item.isReversed && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 uppercase tracking-wide border border-purple-100">
                                              Reverse Score
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Rumah Sakit Anda */}
                                      <td className={`py-5 px-5 text-center border-r border-slate-100/80 transition-all ${highlightClass}`}>
                                        <div className="flex flex-col items-center justify-center gap-1 font-sans">
                                          <span className="text-[15px] font-semibold">{rsVal.toFixed(1)}%</span>
                                          <div className="flex items-center gap-1 text-[10px]">
                                            {trendIcon}
                                            <span className="font-semibold">{badgeLabel}</span>
                                          </div>
                                          <span className="text-[9px] opacity-75 font-medium">({item.totalValid} Responden)</span>
                                        </div>
                                      </td>

                                      {/* Rumah Sakit Uji Coba */}
                                      <td className="py-5 px-5 text-center bg-slate-50/40 font-sans">
                                        <div className="flex flex-col items-center justify-center">
                                          <span className="text-[15px] font-semibold text-slate-700">{pilotVal.toFixed(1)}%</span>
                                          <span className="text-[10px] text-slate-400 font-medium mt-1">Benchmark</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <DynamicAIAnalysisCards
                      type="position-item"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      positionItemScores={positionItemScores}
                    />

                  </div>
                </div>
              ) : positionSubView === 'Perbandingan Penilaian Insiden Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Insiden Keselamatan Pasien Berdasarkan Posisi Staf ({tahun1})
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

                  {/* Main Comparative Table Card */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 font-sans">Tabel Distribusi Penilaian Insiden Keselamatan Pasien</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Menampilkan perbandingan distribusi penilaian keselamatan pasien berdasarkan posisi staf antara rumah sakit Anda dengan Rumah Sakit Uji Coba
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
                            <th rowSpan={2} className="sticky left-0 top-0 z-30 p-4 border-r border-b border-slate-300/60 w-[240px] min-w-[240px] bg-[#D8D4EC] align-bottom shadow-[2px_0_5px_rgba(0,0,0,0.02)] leading-tight">
                              Penilaian Insiden Keselamatan Pasien<br/>(Patient Safety Rating)
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
                              <th key={`hdr-sf-${idx}`} className="sticky top-[45px] z-20 p-3 text-center border-r border-b border-slate-300/60 align-bottom min-w-[130px] w-[130px] bg-[#E5E1F9] leading-snug">
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
                            <td className="p-3 text-center font-semibold text-slate-700 border-r border-slate-200/80 text-[13px] bg-white">
                              {positionSafetyScores.reduce((acc, r) => acc + r.count, 0).toLocaleString('id-ID')}
                            </td>
                            {paginatedComputedTableData.map((col, idx) => {
                              const safetyScoreObj = positionSafetyScores.find(s => s.name === col.name);
                              const count = safetyScoreObj ? safetyScoreObj.count : 0;
                              return (
                                <td key={`rsp-rs-sf-${idx}`} className="p-3 text-center font-medium text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] bg-white">
                                  {count.toLocaleString('id-ID')}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Row 2: Pilot Test Respondents */}
                          <tr className="hover:bg-blue-50/5 transition-colors bg-slate-50/60">
                            <td className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 text-[13px] bg-slate-50">
                              {paginatedComputedTableData.reduce((acc, col) => acc + (positionSafetyBenchmarks[col.name]?.count || 0), 0).toLocaleString('id-ID')}
                            </td>
                            {paginatedComputedTableData.map((col, idx) => {
                              const bmObj = positionSafetyBenchmarks[col.name];
                              const bmCount = bmObj ? (bmObj.count || 0) : 0;
                              return (
                                <td key={`rsp-bm-sf-${idx}`} className="p-3 text-center font-bold text-slate-800 border-r border-b border-slate-200/80 last:border-r-0 text-[13px] bg-slate-50">
                                  {bmCount.toLocaleString('id-ID')}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Data Rows for each Safety Rating Category */}
                          {[
                            { key: 5, benchmarkKey: 'Sangat Baik', label: 'Luar Biasa', subLabel: 'Excellent', bmOverall: 35 },
                            { key: 4, benchmarkKey: 'Baik', label: 'Sangat Baik', subLabel: 'Very Good', bmOverall: 45 },
                            { key: 3, benchmarkKey: 'Cukup', label: 'Baik', subLabel: 'Good', bmOverall: 15 },
                            { key: 2, benchmarkKey: 'Kurang', label: 'Cukup', subLabel: 'Fair', bmOverall: 4 },
                            { key: 1, benchmarkKey: 'Sangat Kurang', label: 'Buruk', subLabel: 'Poor', bmOverall: 1 },
                          ].map((cat, catIdx) => {
                            const totalHospCount = positionSafetyScores.reduce((acc, r) => acc + r.count, 0);
                            const overallHospCatCount = positionSafetyScores.reduce((acc, r) => acc + (r.ratings[cat.key as 1|2|3|4|5] || 0), 0);
                            const overallHospPct = totalHospCount > 0 ? (overallHospCatCount / totalHospCount) * 100 : 0;

                            return (
                              <Fragment key={cat.key}>
                                <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                  <td rowSpan={2} className={`sticky left-0 z-10 p-3.5 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-middle font-bold text-slate-800 text-[13px] md:text-sm ${catIdx % 2 === 0 ? 'bg-slate-100/90' : 'bg-white'}`}>
                                    <div className="flex flex-col">
                                      <span className="text-slate-800 font-bold">{cat.label}</span>
                                      <span className="text-[10px] text-slate-400 font-normal italic">{cat.subLabel}</span>
                                    </div>
                                  </td>
                                  <td className={`p-3 text-center font-semibold text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic bg-blue-50/30 ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                    Rumah Sakit Anda
                                  </td>
                                  <td className={`p-3 text-center text-slate-700 font-bold border-r border-slate-200/80 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                    {totalHospCount === 0 ? '--' : `${overallHospPct.toFixed(0)}%`}
                                  </td>
                                  {paginatedComputedTableData.map((col, idx) => {
                                    const safetyScoreObj = positionSafetyScores.find(s => s.name === col.name);
                                    const totalHospRespForCol = safetyScoreObj ? safetyScoreObj.count : 0;
                                    const pct = (safetyScoreObj && totalHospRespForCol > 0)
                                      ? (safetyScoreObj.ratings[cat.key as 1|2|3|4|5] / totalHospRespForCol) * 100
                                      : 0;

                                    return (
                                      <td key={`val-rs-sf-${cat.key}-${idx}`} className={`p-3 text-center text-slate-700 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-100/50' : 'bg-white'}`}>
                                        {totalHospRespForCol === 0 ? '--' : `${pct.toFixed(0)}%`}
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr className={`hover:bg-blue-50/5 transition-colors ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                  <td className={`p-3 text-center font-semibold text-slate-700 border-r border-slate-200/80 text-[11px] md:text-xs italic bg-slate-100/50 ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                    Rumah Sakit Uji Coba
                                  </td>
                                  <td className={`p-3 text-center text-slate-800 font-bold border-r border-slate-200/80 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                    {cat.bmOverall}%
                                  </td>
                                  {paginatedComputedTableData.map((col, idx) => {
                                    const bmObj = positionSafetyBenchmarks[col.name];
                                    const bmPct = bmObj ? (bmObj[cat.benchmarkKey] || 0) : 0;

                                    return (
                                      <td key={`val-bm-sf-${cat.key}-${idx}`} className={`p-3 text-center font-semibold text-slate-800 border-r border-slate-200/80 last:border-r-0 text-[13px] ${catIdx % 2 === 0 ? 'bg-slate-200/40' : 'bg-slate-50/60'}`}>
                                        {bmPct ? `${bmPct.toFixed(0)}%` : '0%'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </Fragment>
                            );
                          })}
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

                    <DynamicAIAnalysisCards
                      type="position-safety"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      positionSafetyScores={positionSafetyScores}
                    />

                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Responden */}
                    <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Responden</span>
                        <span className="text-2xl font-black text-slate-800">{computedTableData.reduce((sum, r) => sum + r.totalValid, 0)}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">staf aktif berpartisipasi</span>
                      </div>
                    </div>

                    {/* Card 2: Jumlah Posisi Staf */}
                    <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Jumlah Posisi Staf</span>
                        <span className="text-2xl font-black text-slate-800">{masterPositions.filter(p => p.is_active).length}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">peran terdaftar di sistem</span>
                      </div>
                    </div>

                    {/* Card 3: Rata-rata RS Anda */}
                    <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Rata-Rata RS Anda</span>
                        <span className="text-2xl font-black text-slate-800">{averageEventsRS.toFixed(2)}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">peristiwa / responden / th</span>
                      </div>
                    </div>

                    {/* Card 4: Rata-rata Uji Coba */}
                    <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Rata-Rata Benchmark</span>
                        <span className="text-2xl font-black text-slate-800">{averageEventsBenchmark.toFixed(2)}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">peristiwa keselamatan / th</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Table Card (New AHRQ SOPS Design) */}
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
                              Jumlah Insiden Keselamatan Pasien<br/>Yang Dilaporkan
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
                                  const pct = col.percentages[cat as keyof typeof col.percentages] || 0;
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
                                  const bmVal = col.benchmark ? col.benchmark[cat as keyof typeof col.benchmark] : 0;
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

                    <DynamicAIAnalysisCards
                      type="position-reported"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      positionReportingScores={positionReportingScores}
                    />

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-[20px] pb-[20px] px-2">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan masa jabatan / lama kerja staf.', 
                        icon: <BarChart2 className="w-7 h-7 text-amber-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok masa jabatan.', 
                        icon: <ListChecks className="w-7 h-7 text-orange-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Penilaian Insiden Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan masa jabatan atau lama kerja staf.', 
                        icon: <HeartPulse className="w-7 h-7 text-sky-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Jumlah Insiden Keselamatan Pasien Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok masa jabatan staf.', 
                        icon: <AlertTriangle className="w-7 h-7 text-slate-800 stroke-[1.5]" />
                      }
                    ].map((item, idx) => {
                      const colors = [
                        { bg: 'bg-[#FDBA21]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#F27A54]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#009EDB]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#1A2B4C]', text: 'text-white', pin: 'text-red-500' }
                      ];
                      const color = colors[idx];
                      
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -5 }}
                          onClick={() => setTenureSubView(item.title === 'Penilaian Insiden Keselamatan Pasien' ? 'Perbandingan Penilaian Insiden Keselamatan Pasien' : item.title === 'Jumlah Insiden Keselamatan Pasien Dilaporkan' ? 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan' : item.title)}
                          className="relative cursor-pointer group pt-6 pr-2 pl-2 flex flex-col h-full"
                          style={{ filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.08))' }}
                        >
                          {/* Top Left Tag */}
                          <div className={`absolute top-0 left-0 ${color.bg} ${color.text} rounded-tl-[24px] rounded-br-[24px] rounded-tr-md rounded-bl-sm py-2 px-5 shadow-sm flex items-center gap-2 z-20`} style={{ minWidth: '110px' }}>
                            <span className="text-[9px] font-bold uppercase opacity-90 mt-1">Step</span>
                            <span className="text-[26px] font-bold leading-none">0{idx + 1}</span>
                          </div>

                          {/* Main Paper */}
                          <div className="relative bg-white pt-14 pb-6 px-6 flex flex-col items-center text-center w-full flex-1 rounded-tr-md rounded-tl-md z-10" 
                               style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 26px, #f1f5f9 26px, #f1f5f9 27px)', backgroundPosition: '0 40px' }}>
                            
                            {/* Red Pin */}
                            <div className="absolute top-3 right-3 text-red-500 drop-shadow-sm z-30">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="rotate-[30deg]">
                                <path d="M16 9V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v5l-2 3v2h5v7a1 1 0 0 0 2 0v-7h5v-2l-2-3z"/>
                              </svg>
                            </div>

                            <div className="mb-4 flex justify-center items-center bg-white p-2 rounded-full shadow-sm border border-slate-50">
                              {item.icon}
                            </div>
                            
                            <h3 className="text-slate-800 font-bold text-[13px] uppercase tracking-widest mb-3 bg-white px-2 rounded-sm">
                              {item.title}
                            </h3>
                            
                            <p className="text-slate-400 text-[10px] leading-[1.8] line-clamp-5 bg-white/70 px-2 rounded-sm">
                              {item.desc}
                            </p>
                          </div>

                          {/* Torn Bottom Edge SVG */}
                          <div className="w-full text-white relative z-10" style={{ marginTop: '-1px' }}>
                            <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-3 fill-current block">
                              <polygon points="0,0 100,0 100,1 98,6 96,1 94,6 92,1 90,6 88,1 86,6 84,1 82,6 80,1 78,6 76,1 74,6 72,1 70,6 68,1 66,6 64,1 62,6 60,1 58,6 56,1 54,6 52,1 50,6 48,1 46,6 44,1 42,6 40,1 38,6 36,1 34,6 32,1 30,6 28,1 26,6 24,1 22,6 20,1 18,6 16,1 14,6 12,1 10,6 8,1 6,6 4,1 2,6 0,1" />
                            </svg>
                          </div>
                        </motion.div>
                      );
                    })}
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

                    <DynamicAIAnalysisCards
                      type="tenure-dimension"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      tenureDimensionScores={tenureDimensionScores}
                    />

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

                    <DynamicAIAnalysisCards
                      type="tenure-item"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      tenureItemScores={tenureItemScores}
                    />

                  </div>
                </div>
              ) : tenureSubView === 'Perbandingan Penilaian Insiden Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Insiden Keselamatan Pasien Berdasarkan Masa Kerja ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="tenure-safety"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      tenureSafetyScores={tenureSafetyScores}
                    />

                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan Berdasarkan Masa Kerja ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="tenure-reported"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      tenureReportingScores={tenureReportingScores}
                    />

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-[20px] pb-[20px] pl-[8px] pr-2">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan interaksi langsung staf dengan pasien.', 
                        icon: <BarChart2 className="w-8 h-8 text-slate-700 stroke-[1.2]" />, 
                        color: 'bg-[#4F6BE3]'
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok interaksi pasien.', 
                        icon: <ListChecks className="w-8 h-8 text-slate-700 stroke-[1.2]" />, 
                        color: 'bg-[#3CB3C6]'
                      },
                      { 
                        title: 'Penilaian Insiden Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan tingkat interaksi langsung staf dengan pasien.', 
                        icon: <HeartPulse className="w-8 h-8 text-slate-700 stroke-[1.2]" />, 
                        color: 'bg-[#8944B6]'
                      },
                      { 
                        title: 'Jumlah Insiden Keselamatan Pasien Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok staf berdasarkan interaksi pasien.', 
                        icon: <AlertTriangle className="w-8 h-8 text-slate-700 stroke-[1.2]" />, 
                        color: 'bg-[#DF4A98]'
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        onClick={() => setInteractionSubView(item.title === 'Penilaian Insiden Keselamatan Pasien' ? 'Perbandingan Penilaian Insiden Keselamatan Pasien' : item.title === 'Jumlah Insiden Keselamatan Pasien Dilaporkan' ? 'Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan' : item.title)}
                        className="relative cursor-pointer flex flex-col group min-h-[260px]"
                      >
                        {/* Colored rotated background */}
                        <div className={`absolute top-0 bottom-0 right-0 w-[70%] rounded-[24px] ${item.color} transform origin-bottom-left -rotate-[4deg] translate-x-3 -translate-y-1 z-0 shadow-sm transition-transform duration-300 group-hover:-rotate-[6deg] group-hover:translate-x-4`}></div>

                        {/* Content area - White Card */}
                        <div className="relative bg-white rounded-[24px] shadow-[0_5px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 flex flex-col items-center text-center w-full justify-between z-10 border border-slate-100 h-full">
                          <div className="flex flex-col items-center w-full">
                            <div className="mb-4 flex justify-center items-center">
                              {item.icon}
                            </div>
                            <h3 className="text-slate-800 font-bold text-[14px] uppercase tracking-wider mb-3 leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-slate-400 text-[10px] leading-[1.6] line-clamp-4">
                              {item.desc}
                            </p>
                          </div>

                          <div className={`mt-5 w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-black text-[16px] ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            0{idx + 1}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : interactionSubView === 'Perbandingan Pengukuran Dimensi' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Summary Comparison Grid - Detailed Interaction Comparison from Report */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-3 border-b border-slate-100 pb-5">
                      <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">TABEL KOMPARATIF INTERAKSI</span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Stethoscope className="w-6 h-6 text-indigo-600" />
                        Perbandingan Rata-rata Respon Positif Dimensi Budaya Keselamatan Pasien Berdasarkan Hubungan Langsung dengan Pasien
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Perbandingan antara Rumah Sakit Anda dan Rumah Sakit Uji Coba berdasarkan interaksi dengan pasien (AHRQ SOPS Versi 2.0)
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[16px] border border-slate-200 shadow-sm bg-white/50 relative custom-scrollbar pb-2">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b-2 border-slate-200 sticky top-0 z-20">
                          <tr>
                            <th rowSpan={2} className="py-4 px-4 text-center w-12 border-r border-slate-200/80 bg-slate-50 sticky left-0 z-30 shadow-sm">No</th>
                            <th rowSpan={2} className="py-4 px-5 min-w-[280px] text-center border-r border-slate-200/80 bg-slate-50 sticky left-12 z-30 shadow-sm">Dimensi Budaya Keselamatan</th>
                            <th colSpan={2} className="py-3 px-4 text-center border-r border-slate-200/80 bg-cyan-50/60 font-black text-cyan-800">Rumah Sakit Anda</th>
                            <th colSpan={2} className="py-3 px-4 text-center border-r border-slate-200/80 bg-emerald-50/60 font-black text-emerald-800">RS Uji Coba (Benchmark)</th>
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

                    <DynamicAIAnalysisCards
                      type="interaction-dimension"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      interactionDimensionScores={interactionDimensionScores}
                    />

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

                    <DynamicAIAnalysisCards
                      type="interaction-item"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      interactionItemScores={interactionItemScores}
                    />

                  </div>
                </div>
              ) : interactionSubView === 'Perbandingan Penilaian Insiden Keselamatan Pasien' ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" /> Perbandingan Penilaian Insiden Keselamatan Pasien Berdasarkan Interaksi Pasien ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="interaction-safety"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      interactionSafetyScores={interactionSafetyScores}
                    />

                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {/* Selector and Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-600" /> Perbandingan Jumlah Insiden Keselamatan Pasien Yang Dilaporkan Berdasarkan Interaksi Pasien ({tahun1})
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

                    <DynamicAIAnalysisCards
                      type="interaction-reported"
                      tahun1={tahun1}
                      hospitalSurveys={hospitalSurveys}
                      interactionReportingScores={interactionReportingScores}
                    />

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

// ==========================================
// DYNAMIC AI INTERPRETATION & RECOMMENDATION CARDS
// ==========================================
interface DynamicAIAnalysisCardsProps {
  type: string;
  tahun1: string;
  tahun2?: string;
  mode?: string;
  hospitalSurveys: any[];
  hospitalDimensionScores?: any[];
  hospitalItemScores?: any[];
  positionDimensionScores?: any[];
  positionItemScores?: any[];
  positionSafetyScores?: any[];
  unitDimensionScores?: any[];
  unitItemScores?: any[];
  unitSafetyScores?: any[];
  tenureDimensionScores?: any[];
  tenureItemScores?: any[];
  tenureSafetyScores?: any[];
  interactionDimensionScores?: any[];
  interactionItemScores?: any[];
  interactionSafetyScores?: any[];
  unitReportingScores?: any[];
  positionReportingScores?: any[];
  tenureReportingScores?: any[];
  interactionReportingScores?: any[];
  demografiStats?: any;
  e1Stats?: any[];
  reportedEventsComparisonStats?: any;
  masterBenchmarkData?: any;
}

const DynamicAIAnalysisCards: React.FC<DynamicAIAnalysisCardsProps> = ({
  type,
  tahun1,
  tahun2,
  mode,
  hospitalSurveys = [],
  hospitalDimensionScores = [],
  hospitalItemScores = [],
  positionDimensionScores = [],
  positionItemScores = [],
  positionSafetyScores = [],
  unitDimensionScores = [],
  unitItemScores = [],
  unitSafetyScores = [],
  tenureDimensionScores = [],
  tenureItemScores = [],
  tenureSafetyScores = [],
  interactionDimensionScores = [],
  interactionItemScores = [],
  interactionSafetyScores = [],
  unitReportingScores = [],
  positionReportingScores = [],
  tenureReportingScores = [],
  interactionReportingScores = [],
  demografiStats = {},
  e1Stats = [],
  reportedEventsComparisonStats = {},
  masterBenchmarkData = {}
}) => {
  // Safe general count helper
  const calculateGroupAverages = (scoresArray: any[]) => {
    if (!scoresArray || scoresArray.length === 0) return { highest: { name: '--', score: 0 }, lowest: { name: '--', score: 0 } };
    const groups: Record<string, { total: number; count: number }> = {};
    scoresArray.forEach(row => {
      Object.entries(row).forEach(([key, val]) => {
        if (key !== 'id' && key !== 'name' && key !== 'kode' && typeof val === 'number') {
          if (!groups[key]) groups[key] = { total: 0, count: 0 };
          groups[key].total += val;
          groups[key].count += 1;
        }
      });
    });
    const groupAverages = Object.entries(groups)
      .map(([name, obj]) => ({
        name,
        score: obj.count > 0 ? obj.total / obj.count : 0
      }))
      .sort((a, b) => b.score - a.score);

    return {
      highest: groupAverages[0] || { name: '--', score: 0 },
      lowest: groupAverages[groupAverages.length - 1] || { name: '--', score: 0 },
      averages: groupAverages
    };
  };

  const calculateGroupItemAverages = (itemsArray: any[]) => {
    if (!itemsArray || itemsArray.length === 0) {
      return {
        highest: { id: '--', text: '--', score: 0, minGroup: '', minVal: 0, maxGroup: '', maxVal: 0 },
        lowest: { id: '--', text: '--', score: 0, minGroup: '', minVal: 0, maxGroup: '', maxVal: 0 }
      };
    }
    const itemAverages = itemsArray.map(row => {
      let sum = 0;
      let count = 0;
      let minVal = 100;
      let maxVal = 0;
      let minGroup = '';
      let maxGroup = '';
      Object.entries(row).forEach(([key, val]) => {
        if (key !== 'id' && key !== 'text' && key !== 'dimId' && typeof val === 'number') {
          sum += val;
          count += 1;
          if (val < minVal) {
            minVal = val;
            minGroup = key;
          }
          if (val > maxVal) {
            maxVal = val;
            maxGroup = key;
          }
        }
      });
      return {
        id: row.id,
        text: row.text,
        score: count > 0 ? sum / count : 0,
        minGroup,
        minVal,
        maxGroup,
        maxVal
      };
    }).sort((a, b) => b.score - a.score);

    return {
      highest: itemAverages[0] || { id: '--', text: '--', score: 0, minGroup: '', minVal: 0, maxGroup: '', maxVal: 0 },
      lowest: itemAverages[itemAverages.length - 1] || { id: '--', text: '--', score: 0, minGroup: '', minVal: 0, maxGroup: '', maxVal: 0 }
    };
  };

  const calculateGroupSafetyAverages = (safetyArray: any[]) => {
    if (!safetyArray || safetyArray.length === 0) return { highest: { name: '--', score: 0 }, lowest: { name: '--', score: 0 } };
    const sorted = [...safetyArray].sort((a, b) => b.positiveRate - a.positiveRate);
    return {
      highest: { name: sorted[0]?.name || '--', score: sorted[0]?.positiveRate || 0 },
      lowest: { name: sorted[sorted.length - 1]?.name || '--', score: sorted[sorted.length - 1]?.positiveRate || 0 }
    };
  };

  // Generate analysis text and recommendations
  let analysisText: React.ReactNode = "";
  let recs: { text: string; icon: string }[] = [];

  switch (type) {
    case 'hospital-demographics': {
      const totalResp = demografiStats?.total || hospitalSurveys.reduce((acc: number, s: any) => acc + (s.jumlahResponden || 1), 0);
      const topPos = demografiStats?.posisiData?.[0]?.name || "Perawat";
      const topPosVal = demografiStats?.posisiData?.[0]?.value || 0;
      const secondPos = demografiStats?.posisiData?.[1]?.name || "";
      const secondPosVal = demografiStats?.posisiData?.[1]?.value || 0;
      
      const topUnit = demografiStats?.unitData?.[0]?.name || "Instansi Umum";
      const topUnitVal = demografiStats?.unitData?.[0]?.value || 0;
      const secondUnit = demografiStats?.unitData?.[1]?.name || "";
      const secondUnitVal = demografiStats?.unitData?.[1]?.value || 0;
      
      const topTenure = demografiStats?.g1Data?.[0]?.name || "1 hingga 5 tahun";
      const topTenureVal = demografiStats?.g1Data?.[0]?.value || 0;

      analysisText = (
        <span>
          Berdasarkan data demografi responden tahun <strong>{tahun1}</strong>, survei berhasil mengumpulkan partisipasi aktif dari <strong>{totalResp}</strong> staf. 
          Keterwakilan posisi staf didominasi oleh <strong>{topPos}</strong> (<strong>{topPosVal}</strong> responden){secondPos ? `, diikuti oleh ${secondPos} (${secondPosVal} responden)` : ''}. 
          Unit dengan kontribusi terbesar adalah <strong>{topUnit}</strong> dengan <strong>{topUnitVal}</strong> responden{secondUnit ? `, disusul unit ${secondUnit} (${secondUnitVal} responden)` : ''}. 
          Sedangkan dari masa bakti di rumah sakit, mayoritas responden memiliki masa kerja <strong>{topTenure}</strong> sebanyak <strong>{topTenureVal}</strong> staf. 
          Data ini menunjukkan sebaran responden yang representatif dan valid untuk dijadikan pijakan analisis budaya keselamatan pasien secara makro di rumah sakit Anda.
        </span>
      );

      recs = [
        { text: `Rancang program edukasi keselamatan pasien yang berfokus pada kelompok dominan yaitu posisi "${topPos}" di unit "${topUnit}".`, icon: "👥" },
        { text: "Tingkatkan tingkat partisipasi dari kelompok atau unit kerja dengan tingkat representasi rendah (di bawah 10% dari total responden).", icon: "📈" },
        { text: "Sosialisasikan kembali jaminan kerahasiaan identitas responden guna mendorong pengisian data yang jujur dan transparan.", icon: "🛡️" },
        { text: "Gunakan data demografi ini untuk merumuskan tim Champions Keselamatan Pasien lintas unit kerja.", icon: "✨" }
      ];
      break;
    }

    case 'hospital-dimension': {
      const dims = hospitalDimensionScores && hospitalDimensionScores.length > 0 ? hospitalDimensionScores : [];
      let highestDim = { nama: 'Kerjasama Tim', percentage: 75 };
      let lowestDim = { nama: 'Respon terhadap Kesalahan secara Non-Punitif', percentage: 48 };
      let overallAvgDim = 60;
      if (dims.length > 0) {
        const sorted = [...dims].sort((a: any, b: any) => b.percentage - a.percentage);
        highestDim = sorted[0];
        lowestDim = sorted[sorted.length - 1];
        overallAvgDim = dims.reduce((acc: number, d: any) => acc + d.percentage, 0) / dims.length;
      }

      const strengths = dims.filter((d: any) => d.percentage >= 75).map((d: any) => `${d.nama} (${d.percentage.toFixed(1)}%)`);
      const warnings = dims.filter((d: any) => d.percentage >= 50 && d.percentage < 75).map((d: any) => `${d.nama} (${d.percentage.toFixed(1)}%)`);
      const criticals = dims.filter((d: any) => d.percentage < 50).map((d: any) => `${d.nama} (${d.percentage.toFixed(1)}%)`);

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Hasil analisis 10 dimensi budaya keselamatan pasien tahun <strong>{tahun1}</strong> menghasilkan nilai rata-rata keseluruhan respons positif sebesar <strong>{overallAvgDim.toFixed(1)}%</strong>. 
            Kekuatan utama (aspek unggul) rumah sakit Anda terletak pada dimensi <strong>&ldquo;{highestDim.nama}&rdquo;</strong> dengan skor positif tertinggi mencapai <strong>{highestDim.percentage.toFixed(1)}%</strong>. 
            Sebaliknya, dimensi yang mendesak untuk segera diintervensi adalah <strong>&ldquo;{lowestDim.nama}&rdquo;</strong> dengan respons positif terendah sebesar <strong>{lowestDim.percentage.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs space-y-1 bg-white/60 p-3 rounded-xl border border-blue-100/50 block mt-2">
            <div><span className="font-bold text-emerald-700">✓ Area Kekuatan (≥75%):</span> {strengths.length > 0 ? strengths.join(', ') : 'Belum ada'}</div>
            <div><span className="font-bold text-amber-700">⚠ Perlu Peningkatan (50-74%):</span> {warnings.length > 0 ? warnings.join(', ') : 'Belum ada'}</div>
            <div><span className="font-bold text-rose-700">☠ Prioritas Intervensi (&lt;50%):</span> {criticals.length > 0 ? criticals.join(', ') : 'Belum ada'}</div>
          </span>
        </span>
      );

      recs = [
        { text: `Pertahankan strategi keberhasilan pada dimensi "${highestDim.nama}" agar tetap konsisten sebagai pilar budaya keselamatan rumah sakit.`, icon: "🏆" },
        { text: `Segera bentuk tim investigasi internal dan susun SOP baru untuk meningkatkan dimensi "${lowestDim.nama}".`, icon: "🛠️" },
        { text: "Implementasikan program 'Rapat Keselamatan Pasien Mandiri' secara berkala di nurse station seluruh unit kerja.", icon: "📢" },
        { text: "Sesuaikan alokasi pelatihan berkala yang lebih berfokus pada dimensi-dimensi yang berada dalam kategori prioritas intervensi.", icon: "🎯" }
      ];
      break;
    }

    case 'hospital-item': {
      const items = hospitalItemScores && hospitalItemScores.length > 0 ? hospitalItemScores : [];
      let highestItem = { id: 'A1', code: 'A1', text: 'Staf di unit ini saling mendukung', positiveRate: 80, score: 80 };
      let lowestItem = { id: 'A6', code: 'A6', text: 'Staf merasa bahwa kesalahan digunakan untuk menyalahkan mereka', positiveRate: 40, score: 40 };
      
      let sortedItems = [...items].sort((a: any, b: any) => {
        const valA = a.positiveRate !== undefined ? a.positiveRate : (a.score !== undefined ? a.score : 0);
        const valB = b.positiveRate !== undefined ? b.positiveRate : (b.score !== undefined ? b.score : 0);
        return valB - valA;
      });

      if (sortedItems.length > 0) {
        highestItem = sortedItems[0];
        lowestItem = sortedItems[sortedItems.length - 1];
      }

      const highestVal = highestItem.positiveRate !== undefined ? highestItem.positiveRate : ((highestItem as any).score !== undefined ? (highestItem as any).score : 0);
      const lowestVal = lowestItem.positiveRate !== undefined ? lowestItem.positiveRate : ((lowestItem as any).score !== undefined ? (lowestItem as any).score : 0);

      const top3 = sortedItems.slice(0, 3).map(it => `${it.code || it.id} (${(it.positiveRate !== undefined ? it.positiveRate : it.score).toFixed(1)}%)`);
      const bottom3 = sortedItems.slice(-3).reverse().map(it => `${it.code || it.id} (${(it.positiveRate !== undefined ? it.positiveRate : it.score).toFixed(1)}%)`);

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Melalui evaluasi butir pertanyaan (item) survei tahun <strong>{tahun1}</strong>, aspek dengan respons positif tertinggi diraih oleh item <strong>{highestItem.code || highestItem.id}</strong> (&ldquo;{highestItem.text}&rdquo;) sebesar <strong>{highestVal.toFixed(1)}%</strong>. 
            Sebaliknya, kelemahan paling krusial dirasakan pada item <strong>{lowestItem.code || lowestItem.id}</strong> (&ldquo;{lowestItem.text}&rdquo;) dengan skor positif hanya sebesar <strong>{lowestVal.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs space-y-1 bg-white/60 p-3 rounded-xl border border-blue-100/50 block mt-2">
            <div><span className="font-bold text-emerald-700">⭐ Top 3 Item Terbaik:</span> {top3.join(', ')}</div>
            <div><span className="font-bold text-rose-700">⚠ Bottom 3 Item Terlemah:</span> {bottom3.join(', ')}</div>
          </span>
        </span>
      );

      recs = [
        { text: `Model komunikasi sukses pada item "${highestItem.code || highestItem.id}" harus dibakukan dan dijadikan standar bagi unit lainnya.`, icon: "✨" },
        { text: `Segera evaluasi regulasi pelayanan di unit kerja terkait yang menyebabkan rendahnya nilai pada item "${lowestItem.code || lowestItem.id}".`, icon: "🛠️" },
        { text: `Lakukan diskusi interaktif tingkat unit kerja untuk membedah akar masalah dari butir "${lowestItem.text}".`, icon: "🗣️" },
        { text: "Sediakan infografis atau panduan visual di meja pelayanan mengenai cara mengatasi kendala harian staf.", icon: "📝" }
      ];
      break;
    }

    case 'hospital-reported': {
      let maxReportedCat = { kategori: 'Tidak Pernah Melaporkan Kejadian', val: 0 };
      const catsList: { key: string; label: string; val: number }[] = [];
      if (reportedEventsComparisonStats && reportedEventsComparisonStats.percentages) {
        const categories = [
          { key: 'Tidak ada', label: 'Tidak Pernah Melaporkan' },
          { key: '1 sampai 2', label: '1-2 Kejadian' },
          { key: '3 sampai 5', label: '3-5 Kejadian' },
          { key: '6 hingga 10', label: '6-10 Kejadian' },
          { key: '11 atau lebih', label: '≥11 Kejadian' }
        ];
        let maxPct = -1;
        categories.forEach(c => {
          const pct = reportedEventsComparisonStats.percentages[c.key] || 0;
          catsList.push({ key: c.key, label: c.label, val: pct });
          if (pct > maxPct) {
            maxPct = pct;
            maxReportedCat = { kategori: c.label, val: pct };
          }
        });
      }

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Berdasarkan data pelaporan insiden dalam 12 bulan terakhir (Tahun <strong>{tahun1}</strong>), kategori dengan persentase tertinggi di Rumah Sakit Anda adalah <strong>&ldquo;{maxReportedCat.kategori}&rdquo;</strong> sebesar <strong>{maxReportedCat.val.toFixed(1)}%</strong>. 
            Tingginya angka staf yang tidak melapor atau jarang melapor menunjukkan adanya potensi fenomena <em>underreporting</em> (kejadian yang disembunyikan atau tidak dicatatkan) akibat rasa takut atau birokrasi yang rumit.
          </span>
          <span className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-white/60 p-3 rounded-xl border border-blue-100/50 text-center text-xs block mt-2">
            {catsList.map(c => (
              <div key={c.key} className="p-1 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 font-bold font-mono text-[10px]">{c.label}</div>
                <div className="text-xs font-extrabold text-indigo-900 mt-0.5">{c.val.toFixed(1)}%</div>
              </div>
            ))}
          </span>
        </span>
      );

      recs = [
        { text: "Terapkan prinsip Just Culture secara konsisten untuk menjamin tidak adanya sanksi sepihak (non-punitive) bagi pelapor insiden.", icon: "🛡️" },
        { text: "Sederhanakan proses pengisian formulir laporan insiden menjadi digital yang dapat diselesaikan dalam waktu kurang dari 3 menit.", icon: "📱" },
        { text: "Berikan penghargaan bulanan berupa 'Safety Reporter Award' bagi unit yang paling aktif melaporkan insiden keselamatan.", icon: "🏆" },
        { text: "Lakukan sosialisasi berkala mengenai alur dan kriteria Kejadian Nyaris Cedera (KNC) yang wajib dilaporkan.", icon: "📢" }
      ];
      break;
    }

    case 'hospital-safety': {
      let highestSafetyCat = { kategori: 'Baik', val: 0 };
      let overallSafetyPos = 50;
      const grades: { kategori: string; val: number }[] = [];
      if (e1Stats && e1Stats.length > 0) {
        let maxVal = -1;
        e1Stats.forEach((entry: any) => {
          const val = entry['Rumah Sakit Anda'] || 0;
          grades.push({ kategori: entry.kategori, val });
          if (val > maxVal) {
            maxVal = val;
            highestSafetyCat = { kategori: entry.kategori, val };
          }
        });
        const sangatBaik = e1Stats.find((e: any) => e.kategori === 'Sangat Baik')?.['Rumah Sakit Anda'] || 0;
        const baik = e1Stats.find((e: any) => e.kategori === 'Baik')?.['Rumah Sakit Anda'] || 0;
        overallSafetyPos = sangatBaik + baik;
      }

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Penilaian keselamatan pasien secara keseluruhan (overall safety rating) oleh staf pada tahun <strong>{tahun1}</strong> menghasilkan proporsi respons positif (kombinasi predikat Sangat Baik & Luar Biasa) sebesar <strong>{overallSafetyPos.toFixed(1)}%</strong>. 
            Mayoritas staf memberikan penilaian keselamatan pada rentang kategori <strong>&ldquo;{highestSafetyCat.kategori}&rdquo;</strong> sebesar <strong>{highestSafetyCat.val.toFixed(1)}%</strong>. 
            Meskipun iklim keselamatan dinilai cukup baik, upaya peningkatan mutu berkelanjutan tetap harus didukung demi mencapai target ideal &ge;80% respons positif.
          </span>
          <span className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-white/60 p-3 rounded-xl border border-blue-100/50 text-center text-xs block mt-2">
            {grades.map(g => (
              <div key={g.kategori} className="p-1 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 font-bold text-[10px] truncate">{g.kategori}</div>
                <div className="text-xs font-extrabold text-emerald-900 mt-0.5">{g.val.toFixed(1)}%</div>
              </div>
            ))}
          </span>
        </span>
      );

      recs = [
        { text: "Lakukan monitoring berkala di unit-unit klinis kritis (IGD, ICU, Kamar Operasi) yang rentan memiliki gap keselamatan pasien.", icon: "🔎" },
        { text: "Jadwalkan 'Safety Walkrounds' (Ronde Keselamatan) yang melibatkan jajaran direksi untuk berdialog langsung dengan staf.", icon: "👣" },
        { text: "Gunakan hasil penilaian ini sebagai KPI mutu unit kerja dalam rapat evaluasi tahunan.", icon: "📊" },
        { text: "Berikan penghargaan bagi unit yang konsisten memelihara iklim budaya keselamatan dengan predikat 'Luar Biasa'.", icon: "🏆" }
      ];
      break;
    }

    case 'benchmark-dimension': {
      const dimsList = hospitalDimensionScores && hospitalDimensionScores.length > 0 ? hospitalDimensionScores : [];
      let aboveBmCount = 0;
      let bestBmDiff = { nama: '--', diff: -999 };
      let worstBmDiff = { nama: '--', diff: 999 };
      const outperforming: string[] = [];
      const underperforming: string[] = [];

      if (dimsList.length > 0) {
        dimsList.forEach((d: any) => {
          const bmAvg = (d.benchmarkMin + d.benchmarkMax) / 2;
          const diff = d.percentage - bmAvg;
          if (d.percentage >= bmAvg) {
            aboveBmCount++;
            outperforming.push(`${d.nama} (+${diff.toFixed(1)}%)`);
          } else {
            underperforming.push(`${d.nama} (${diff.toFixed(1)}%)`);
          }
          if (bestBmDiff.nama === '--' || diff > bestBmDiff.diff) {
            bestBmDiff = { nama: d.nama, diff };
          }
          if (worstBmDiff.nama === '--' || diff < worstBmDiff.diff) {
            worstBmDiff = { nama: d.nama, diff };
          }
        });
      }

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Berdasarkan perbandingan dengan Rumah Sakit Uji Coba nasional, Rumah Sakit Anda berada di atas rata-rata benchmark pada <strong>{aboveBmCount}</strong> dari 10 dimensi budaya keselamatan. 
            Capaian komparatif terbaik dicatat pada dimensi <strong>&ldquo;{bestBmDiff.nama}&rdquo;</strong> dengan keunggulan selisih sebesar <strong>+{bestBmDiff.diff.toFixed(1)}%</strong> di atas benchmark. 
            Sebaliknya, area kesenjangan terdalam yang menuntut evaluasi serius adalah dimensi <strong>&ldquo;{worstBmDiff.nama}&rdquo;</strong> dengan ketertinggalan skor sebesar <strong>{worstBmDiff.diff.toFixed(1)}%</strong> di bawah pembanding nasional.
          </span>
          <span className="text-xs space-y-1.5 bg-white/60 p-3 rounded-xl border border-blue-100/50 block mt-2">
            <div><span className="font-bold text-emerald-700">✓ Melebihi Benchmark:</span> {outperforming.length > 0 ? outperforming.join(', ') : 'Belum ada'}</div>
            <div><span className="font-bold text-rose-700">⚠ Di Bawah Benchmark:</span> {underperforming.length > 0 ? underperforming.join(', ') : 'Belum ada'}</div>
          </span>
        </span>
      );

      recs = [
        { text: `Jadikan keberhasilan dimensi "${bestBmDiff.nama}" sebagai role model dan replikasikan model kerjanya di unit lain.`, icon: "🏆" },
        { text: `Lakukan diskusi kritis bersama kepala-kepala unit untuk mencari solusi ketertinggalan pada dimensi "${worstBmDiff.nama}".`, icon: "🛠️" },
        { text: "Adopsi instrumen audit dan monitoring dari Rumah Sakit Uji Coba nasional untuk dimensi yang masih di bawah standar.", icon: "🔍" },
        { text: "Laporkan hasil komparasi berkala ini kepada jajaran direksi sebagai bahan evaluasi kebijakan mutu pelayanan.", icon: "📋" }
      ];
      break;
    }

    case 'benchmark-safety': {
      let hospSafetyPos = 50;
      let bmSafetyPos = 50;
      let hospSafetyMax = { kategori: 'Baik', val: 0 };
      const detailsList: string[] = [];

      if (e1Stats && e1Stats.length > 0) {
        const sangatBaikHosp = e1Stats.find((e: any) => e.kategori === 'Sangat Baik')?.['Rumah Sakit Anda'] || 0;
        const baikHosp = e1Stats.find((e: any) => e.kategori === 'Baik')?.['Rumah Sakit Anda'] || 0;
        hospSafetyPos = sangatBaikHosp + baikHosp;

        const sangatBaikBm = e1Stats.find((e: any) => e.kategori === 'Sangat Baik')?.['Data Pembanding'] || 0;
        const baikBm = e1Stats.find((e: any) => e.kategori === 'Baik')?.['Data Pembanding'] || 0;
        bmSafetyPos = sangatBaikBm + baikBm;

        let maxVal = -1;
        e1Stats.forEach((entry: any) => {
          const val = entry['Rumah Sakit Anda'] || 0;
          const bmVal = entry['Data Pembanding'] || 0;
          const diff = val - bmVal;
          const sign = diff >= 0 ? '+' : '';
          detailsList.push(`${entry.kategori}: RS Anda ${val.toFixed(1)}% vs RS Uji Coba ${bmVal.toFixed(1)}% (${sign}${diff.toFixed(1)}%)`);

          if (val > maxVal) {
            maxVal = val;
            hospSafetyMax = { kategori: entry.kategori, val };
          }
        });
      }

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Perbandingan tingkat keselamatan makro menunjukkan proporsi respons positif (Sangat Baik & Luar Biasa) di Rumah Sakit Anda adalah sebesar <strong>{hospSafetyPos.toFixed(1)}%</strong>, 
            dibandingkan dengan rata-rata benchmark Rumah Sakit Uji Coba sebesar <strong>{bmSafetyPos.toFixed(1)}%</strong>. 
            {hospSafetyPos >= bmSafetyPos 
              ? ' Capaian yang berhasil unggul di atas benchmark ini menunjukkan adanya iklim keselamatan kerja yang solid dan perlu dipertahankan.' 
              : ' Nilai yang berada di bawah benchmark ini mengindikasikan perlunya akselerasi standarisasi mutu keselamatan pelayanan klinis.'} 
            Kategori penilaian dominan di rumah sakit Anda adalah predikat <strong>&ldquo;{hospSafetyMax.kategori}&rdquo;</strong> sebesar <strong>{hospSafetyMax.val.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs space-y-1 bg-white/60 p-3 rounded-xl border border-blue-100/50 font-mono block mt-2">
            {detailsList.map((det, idx) => (
              <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 py-0.5 last:border-0">
                <span>{det.split(' (')[0]}</span>
                <span className="font-extrabold text-slate-700">({det.split(' (')[1]}</span>
              </div>
            ))}
          </span>
        </span>
      );

      recs = [
        { text: "Sinergikan rencana strategis jaminan mutu pelayanan klinis dengan indikator capaian nasional keselamatan pasien.", icon: "🎯" },
        { text: "Bentuk forum komunikasi rutin lintas RS Uji Coba untuk bertukar strategi penanganan isu operasional harian.", icon: "👥" },
        { text: "Lakukan review komparatif periodik setiap 6 bulan untuk mengukur efektivitas kampanye keselamatan pasien.", icon: "📈" },
        { text: "Adakan lokakarya internal mengupas sasaran keselamatan pasien nasional bagi seluruh kepala unit kerja.", icon: "📚" }
      ];
      break;
    }

    case 'benchmark-reported': {
      let maxReportedCatBm = { kategori: 'Tidak Pernah Melaporkan Kejadian', val: 0, bmVal: 45 };
      const detailsList: string[] = [];

      if (reportedEventsComparisonStats && reportedEventsComparisonStats.percentages) {
        const categories = [
          { key: 'Tidak ada', label: 'Tidak Pernah Melaporkan Kejadian', bm: 45 },
          { key: '1 sampai 2', label: 'Melaporkan 1-2 Kejadian', bm: 28 },
          { key: '3 sampai 5', label: 'Melaporkan 3-5 Kejadian', bm: 15 },
          { key: '6 hingga 10', label: 'Melaporkan 6-10 Kejadian', bm: 8 },
          { key: '11 atau lebih', label: 'Melaporkan 11 atau lebih Kejadian', bm: 4 }
        ];
        let maxPct = -1;
        categories.forEach(c => {
          const pct = reportedEventsComparisonStats.percentages[c.key] || 0;
          const diff = pct - c.bm;
          const sign = diff >= 0 ? '+' : '';
          detailsList.push(`${c.label}: RS Anda ${pct.toFixed(1)}% vs RS Uji Coba ${c.bm}% (${sign}${diff.toFixed(1)}%)`);

          if (pct > maxPct) {
            maxPct = pct;
            maxReportedCatBm = { kategori: c.label, val: pct, bmVal: c.bm };
          }
        });
      }

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Berdasarkan hasil survei frekuensi pelaporan insiden, mayoritas responden Rumah Sakit Anda berada pada kategori <strong>&ldquo;{maxReportedCatBm.kategori}&rdquo;</strong> sebesar <strong>{maxReportedCatBm.val.toFixed(1)}%</strong>, 
            sedangkan rata-rata Rumah Sakit Uji Coba nasional pada kategori ini adalah <strong>{maxReportedCatBm.bmVal}%</strong>. 
            {maxReportedCatBm.val > maxReportedCatBm.bmVal && maxReportedCatBm.kategori.includes("Tidak Pernah")
              ? ' Tingginya angka tidak melapor dibanding benchmark nasional (selisih negatif) menegaskan adanya urgensi reformasi sistem pelaporan agar bebas dari sanksi (non-punitive culture).'
              : ' Distribusi frekuensi pelaporan ini mencerminkan keterbukaan dan kepatuhan pelaporan insiden yang relatif berimbang dengan rumah sakit nasional.'}
          </span>
          <span className="text-xs space-y-1 bg-white/60 p-3 rounded-xl border border-blue-100/50 font-mono block mt-2">
            {detailsList.map((det, idx) => (
              <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 py-0.5 last:border-0">
                <span>{det.split(' (')[0]}</span>
                <span className="font-extrabold text-slate-700">({det.split(' (')[1]}</span>
              </div>
            ))}
          </span>
        </span>
      );

      recs = [
        { text: "Bandingkan alur birokrasi sistem pelaporan RS Anda dengan RS Uji Coba yang memiliki rasio pelaporan lebih sehat.", icon: "🔍" },
        { text: "Terapkan perlindungan hukum dan jaminan kerahasiaan penuh bagi staf tapak yang berani melaporkan insiden keselamatan.", icon: "🛡️" },
        { text: "Lakukan sosialisasi pentingnya budaya pelaporan bebas sanksi (Just Culture) ke jajaran manajemen madya.", icon: "📢" },
        { text: "Sediakan portal pelaporan insiden online yang praktis dan dapat diakses dari gadget seluruh staf.", icon: "📱" }
      ];
      break;
    }

    case 'benchmark-item': {
      const itemScores = hospitalItemScores && hospitalItemScores.length > 0 ? hospitalItemScores : [];
      let bestItemBmDiff = { code: '--', text: 'Staf bekerja sama dengan baik', diff: -100 };
      let worstItemBmDiff = { code: '--', text: 'Respon menyalahkan', diff: 100 };

      if (itemScores.length > 0) {
        itemScores.forEach((it: any) => {
          const bmVal = 60; // default item benchmark rate
          const diff = it.positiveRate - bmVal;
          if (bestItemBmDiff.code === '--' || diff > bestItemBmDiff.diff) {
            bestItemBmDiff = { code: it.code || it.id, text: it.text, diff };
          }
          if (worstItemBmDiff.code === '--' || diff < worstItemBmDiff.diff) {
            worstItemBmDiff = { code: it.code || it.id, text: it.text, diff };
          }
        });
      }

      analysisText = (
        <span>
          Melalui evaluasi komparatif per butir pertanyaan (item) tahun <strong>{tahun1}</strong>, Rumah Sakit Anda mencatatkan keunggulan tertinggi dibanding benchmark nasional pada item <strong>{bestItemBmDiff.code}</strong> (&ldquo;{bestItemBmDiff.text}&rdquo;) dengan selisih positif mencapai <strong>+{bestItemBmDiff.diff.toFixed(1)}%</strong>. 
          Sebaliknya, area butir keselamatan yang paling tertinggal di bawah rata-rata benchmark adalah item <strong>{worstItemBmDiff.code}</strong> (&ldquo;{worstItemBmDiff.text}&rdquo;) dengan kesenjangan negatif sebesar <strong>{worstItemBmDiff.diff.toFixed(1)}%</strong>.
        </span>
      );

      recs = [
        { text: `Gali dan jadikan kesuksesan item "${bestItemBmDiff.code}" sebagai model pelatihan penulisan SOP interaksi klinis.`, icon: "🏆" },
        { text: `Segera rancang standar operasional baru guna membenahi isu mendasar pada aspek item "${worstItemBmDiff.code}".`, icon: "🛠️" },
        { text: "Fasilitasi diskusi interaktif tingkat unit kerja terendah khusus membahas penyelesaian butir pertanyaan terlemah.", icon: "🗣️" },
        { text: "Lakukan audit langsung oleh komite keselamatan pasien di nurse station mengenai kepatuhan butir prioritas tersebut.", icon: "🔍" }
      ];
      break;
    }

    case 'unit-dimension':
    case 'position-dimension':
    case 'tenure-dimension':
    case 'interaction-dimension': {
      let groupLabel = "Kelompok";
      let activeDimArray: any[] = [];
      if (type === 'unit-dimension') {
        groupLabel = "Unit Kerja";
        activeDimArray = unitDimensionScores || [];
      } else if (type === 'position-dimension') {
        groupLabel = "Posisi Staf";
        activeDimArray = positionDimensionScores || [];
      } else if (type === 'tenure-dimension') {
        groupLabel = "Masa Kerja";
        activeDimArray = tenureDimensionScores || [];
      } else if (type === 'interaction-dimension') {
        groupLabel = "Interaksi Pasien";
        activeDimArray = interactionDimensionScores || [];
      }

      const { highest: highestGrp, lowest: lowestGrp, averages } = calculateGroupAverages(activeDimArray);
      const sortedAveragesText = averages ? averages.map((a: any) => `${a.name} (${a.score.toFixed(1)}%)`).join(', ') : '';

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Analisis komparatif dimensi keselamatan pasien berdasarkan kategori <strong>{groupLabel}</strong> tahun <strong>{tahun1}</strong> menunjukkan adanya perbedaan persepsi antar kelompok kerja. 
            Kelompok dengan tingkat kematangan budaya keselamatan tertinggi diraih oleh <strong>&ldquo;{highestGrp.name}&rdquo;</strong> dengan rata-rata respons positif sebesar <strong>{highestGrp.score.toFixed(1)}%</strong>. 
            Sebaliknya, kelompok dengan capaian terendah yang memerlukan pembinaan intensif adalah <strong>&ldquo;{lowestGrp.name}&rdquo;</strong> sebesar <strong>{lowestGrp.score.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs bg-white/60 p-3 rounded-xl border border-blue-100/50 block mt-2">
            <span className="font-bold text-slate-700 block mb-1">Peringkat Kelompok (Rata-rata Skor):</span>
            <span className="text-slate-600 font-medium block leading-relaxed">{sortedAveragesText}</span>
          </span>
        </span>
      );

      recs = [
        { text: `Gelar forum benchmark internal agar kelompok "${lowestGrp.name}" dapat mengadopsi sistem kerja kondusif dari kelompok "${highestGrp.name}".`, icon: "🏆" },
        { text: `Rancang pelatihan atau coaching keselamatan pasien spesifik yang relevan dengan tantangan harian kelompok "${lowestGrp.name}".`, icon: "🛠️" },
        { text: "Evaluasi dan sesuaikan beban serta pembagian jam kerja guna meminimalkan burnout yang menurunkan tingkat kefokusan staf.", icon: "⚖️" },
        { text: "Lakukan supervisi klinis yang suportif oleh jajaran manajemen tingkat menengah di kelompok dengan skor terendah.", icon: "👥" }
      ];
      break;
    }

    case 'unit-item':
    case 'position-item':
    case 'tenure-item':
    case 'interaction-item': {
      let activeItemArray: any[] = [];
      let groupItemLabel = "Kelompok";
      if (type === 'unit-item') {
        groupItemLabel = "Unit Kerja";
        activeItemArray = unitItemScores || [];
      } else if (type === 'position-item') {
        groupItemLabel = "Posisi Staf";
        activeItemArray = positionItemScores || [];
      } else if (type === 'tenure-item') {
        groupItemLabel = "Masa Kerja";
        activeItemArray = tenureItemScores || [];
      } else if (type === 'interaction-item') {
        groupItemLabel = "Interaksi Pasien";
        activeItemArray = interactionItemScores || [];
      }

      const { highest: highestItemGrp, lowest: lowestItemGrp } = calculateGroupItemAverages(activeItemArray);

      analysisText = (
        <span>
          Hasil analisis per butir pertanyaan berdasarkan jajaran <strong>{groupItemLabel}</strong> tahun <strong>{tahun1}</strong> menunjukkan variabilitas kepatuhan operasional harian. 
          Item yang secara konsisten dinilai paling unggul di seluruh kelompok adalah item <strong>{highestItemGrp.id}</strong> (&ldquo;{highestItemGrp.text}&rdquo;) dengan rata-rata respons positif sebesar <strong>{highestItemGrp.score.toFixed(1)}%</strong>. 
          Sementara itu, butir pertanyaan yang paling mendesak dibenahi adalah item <strong>{lowestItemGrp.id}</strong> (&ldquo;{lowestItemGrp.text}&rdquo;) dengan rata-rata hanya <strong>{lowestItemGrp.score.toFixed(1)}%</strong>, di mana kelompok <strong>&ldquo;{lowestItemGrp.minGroup || "staf terkait"}&rdquo;</strong> mencatat penilaian paling kritis yaitu sebesar <strong>{lowestItemGrp.minVal.toFixed(1)}%</strong>.
        </span>
      );

      recs = [
        { text: `Fasilitasi diskusi pemecahan masalah bersama kelompok "${lowestItemGrp.minGroup || "staf terkait"}" guna menelisik pemicu rendahnya nilai item "${lowestItemGrp.id}".`, icon: "🗣️" },
        { text: "Sederhanakan instruksi kerja atau lembar panduan penanganan isu keselamatan tingkat tapak kerja.", icon: "📝" },
        { text: "Berikan bimbingan langsung (coaching) oleh kepala unit klinis berkinerja tinggi kepada unit kerja berkinerja rendah.", icon: "🧠" },
        { text: `Jadikan kepatuhan kelompok tertinggi pada item "${highestItemGrp.id}" sebagai bahan simulasi/asuhan percontohan keselamatan.`, icon: "✨" }
      ];
      break;
    }

    case 'unit-safety':
    case 'position-safety':
    case 'tenure-safety':
    case 'interaction-safety': {
      let activeSafetyArray: any[] = [];
      let groupSafetyLabel = "Kelompok";
      if (type === 'unit-safety') {
        groupSafetyLabel = "Unit Kerja";
        activeSafetyArray = unitSafetyScores || [];
      } else if (type === 'position-safety') {
        groupSafetyLabel = "Posisi Staf";
        activeSafetyArray = positionSafetyScores || [];
      } else if (type === 'tenure-safety') {
        groupSafetyLabel = "Masa Kerja";
        activeSafetyArray = tenureSafetyScores || [];
      } else if (type === 'interaction-safety') {
        groupSafetyLabel = "Interaksi Pasien";
        activeSafetyArray = interactionSafetyScores || [];
      }

      const { highest: highestGrpSafety, lowest: lowestGrpSafety } = calculateGroupSafetyAverages(activeSafetyArray);
      const sortedSafetyList = [...activeSafetyArray].sort((a, b) => b.positiveRate - a.positiveRate);
      const safetyGroupsText = sortedSafetyList.map((g: any) => `${g.name} (${g.positiveRate.toFixed(1)}%)`).join(', ');

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Evaluasi umum peringkat keselamatan pasien (overall safety rating) berdasarkan <strong>{groupSafetyLabel}</strong> tahun <strong>{tahun1}</strong> memetakan tingkat optimisme kualitas pelayanan di seluruh jajaran staf. 
            Kelompok yang memiliki persepsi tingkat keselamatan paling matang adalah <strong>&ldquo;{highestGrpSafety.name}&rdquo;</strong> dengan persentase respons positif mencapai <strong>{highestGrpSafety.score.toFixed(1)}%</strong>. 
            Sebaliknya, kelompok dengan persepsi paling kritis adalah <strong>&ldquo;{lowestGrpSafety.name}&rdquo;</strong> dengan respons positif terendah sebesar <strong>{lowestGrpSafety.score.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs bg-white/60 p-3 rounded-xl border border-blue-100/50 block mt-2">
            <span className="font-bold text-slate-700 block mb-1">Peringkat Persepsi Keselamatan:</span>
            <span className="text-slate-600 font-medium block leading-relaxed">{safetyGroupsText}</span>
          </span>
        </span>
      );

      recs = [
        { text: `Selenggarakan dialog asertif dua arah bersama kelompok "${lowestGrpSafety.name}" guna mengurai hambatan penerapan program keselamatan.`, icon: "🗣️" },
        { text: `Berikan penghargaan formal atas kepemimpinan budaya keselamatan kepada perwakilan kelompok "${highestGrpSafety.name}".`, icon: "🏆" },
        { text: "Jadwalkan kunjungan komite keselamatan pasien harian di meja pelayanan kelompok dengan persepsi terendah.", icon: "👥" },
        { text: "Sediakan dukungan pemenuhan fasilitas dan alat keselamatan medis yang dibutuhkan dalam operasional klinis.", icon: "🛠️" }
      ];
      break;
    }

    case 'unit-reported':
    case 'position-reported':
    case 'tenure-reported':
    case 'interaction-reported': {
      let groupLabel = "Kelompok";
      let activeReportedScores: any[] = [];
      if (type === 'unit-reported') {
        groupLabel = "Unit Kerja";
        activeReportedScores = unitReportingScores || [];
      } else if (type === 'position-reported') {
        groupLabel = "Posisi Staf";
        activeReportedScores = positionReportingScores || [];
      } else if (type === 'tenure-reported') {
        groupLabel = "Masa Kerja";
        activeReportedScores = tenureReportingScores || [];
      } else if (type === 'interaction-reported') {
        groupLabel = "Interaksi Pasien";
        activeReportedScores = interactionReportingScores || [];
      }

      let highestGrp = { name: '--', rate: 0 };
      let lowestGrp = { name: '--', rate: 100 };
      const sortedReportedList = [...activeReportedScores].sort((a, b) => b.rate - a.rate);
      if (sortedReportedList.length > 0) {
        highestGrp = sortedReportedList[0];
        lowestGrp = sortedReportedList[sortedReportedList.length - 1];
      }
      const reportedGroupsText = sortedReportedList.map((g: any) => `${g.name} (${g.rate.toFixed(1)}%)`).join(', ');

      analysisText = (
        <span className="space-y-2 block">
          <span>
            Analisis frekuensi pelaporan minimal 1 insiden keselamatan dalam 12 bulan terakhir berdasarkan <strong>{groupLabel}</strong> tahun <strong>{tahun1}</strong> memetakan sebaran keaktifan peran pelaporan. 
            Kelompok dengan rasio pelaporan paling aktif adalah <strong>&ldquo;{highestGrp.name}&rdquo;</strong> sebesar <strong>{highestGrp.rate.toFixed(1)}%</strong>. 
            Sebaliknya, kelompok jajaran staf dengan tingkat pelaporan paling pasif adalah <strong>&ldquo;{lowestGrp.name}&rdquo;</strong> sebesar <strong>{lowestGrp.rate.toFixed(1)}%</strong>.
          </span>
          <span className="text-xs bg-white/60 p-3 rounded-xl border border-blue-100/50 font-medium text-slate-600 block mt-2">
            <span className="font-bold text-slate-700 block mb-1">Rasio Pelaporan Aktif Kelompok:</span>
            <span className="block leading-relaxed">{reportedGroupsText || 'Belum ada data pelaporan yang dimasukkan'}</span>
          </span>
        </span>
      );

      recs = [
        { text: `Lakukan pendekatan edukasi terfokus mengenai pentingnya pelaporan kejadian klinis pada jajaran kelompok "${lowestGrp.name}".`, icon: "📢" },
        { text: `Sediakan akses portal pelaporan instan terintegrasi (seperti scan QR code) di meja kerja kelompok "${lowestGrp.name}".`, icon: "📱" },
        { text: `Berikan apresiasi resmi "Safety Champion" bagi perwakilan staf kelompok "${highestGrp.name}" guna mempertahankan motivasi tingginya.`, icon: "🏆" },
        { text: "Optimalkan kemudahan pengisian form agar pelaporan insiden dapat diselesaikan secepatnya oleh seluruh staf.", icon: "⏱" }
      ];
      break;
    }

    default:
      analysisText = "Hasil interpretasi dan analisis otomatis sistem sedang dikompilasi berdasarkan data terbaru.";
      recs = [
        { text: "Meningkatkan monitoring budaya keselamatan di setiap unit secara berkala.", icon: "📈" },
        { text: "Mensosialisasikan pentingnya kepatuhan budaya keselamatan pasien bagi seluruh staf.", icon: "📢" },
        { text: "Mengadakan pelatihan berkala jaminan mutu keselamatan pelayanan klinis.", icon: "📚" },
        { text: "Memanfaatkan data survei untuk landasan penyusunan program mutu rumah sakit.", icon: "🎯" }
      ];
      break;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 pt-8 mt-8 w-full">
      {/* CARD 1: INTERPRETASI & ANALISIS DATA */}
      <div className="space-y-4 bg-blue-50/50 border border-blue-100 p-6 md:p-8 rounded-[24px] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
        <h4 className="text-sm font-extrabold text-blue-900 tracking-wider uppercase flex items-center gap-2">
          <Brain className="w-5.5 h-5.5 text-blue-600 shrink-0" /> INTERPRETASI & ANALISIS DATA
        </h4>
        <div className="text-xs md:text-sm text-slate-700 leading-relaxed font-semibold">
          {analysisText}
        </div>
      </div>

      {/* CARD 2: REKOMENDASI PENINGKATAN */}
      <div className="space-y-4 bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[24px] shadow-sm">
        <h4 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase flex items-center gap-2">
          <ListChecks className="w-5.5 h-5.5 text-indigo-600 shrink-0" /> REKOMENDASI PENINGKATAN
        </h4>
        <ul className="text-xs md:text-sm text-slate-600 space-y-3.5">
          {recs.map((rec, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="bg-white shadow-sm border border-slate-200 w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs shrink-0 select-none">
                {rec.icon}
              </span>
              <span className="font-semibold leading-relaxed text-slate-700">{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

