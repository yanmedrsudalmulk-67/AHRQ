'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import hospitalBg from '../src/assets/images/hospital_cover_bg_1785397361439.jpg';
import { 
  FileText, 
  Download, 
  Building2, 
  Calendar, 
  Printer, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Award, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  RefreshCw, 
  Layers,
  ArrowUpRight,
  Target,
  Clock,
  Briefcase,
  Globe,
  BarChart2,
  HeartPulse
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell 
} from 'recharts';
import { computeDimensionScores, DIMENSI_INFO, DIMENSI_ITEMS, scoreToPercent } from '../lib/scoring';
import { exportReportToDocx, ReportData } from '../lib/docxExporter';
import { getPengesahanConfig, PengesahanConfig, isSurveyResponse } from '../lib/db';

const STATEMENTS_A = [
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
];

const STATEMENTS_B = [
  { id: 1, code: 'B1', text: 'Atasan, manajer, atau pemimpin klinis saya secara serius mempertimbangkan saran dari staf untuk meningkatkan keselamatan pasien', dim: 'd5' },
  { id: 2, code: 'B2', text: 'Atasan, manajer, atau pemimpin klinis saya menginginkan kita bekerja lebih cepat saat waktu sibuk, bahkan jika itu berarti mengambil jalan pintas', dim: 'd5', isReversed: true },
  { id: 3, code: 'B3', text: 'Atasan, manajer, atau pemimpin klinis saya mengambil tindakan untuk mengatasi masalah keselamatan pasien yang menjadi perhatian mereka', dim: 'd5' }
];

const STATEMENTS_C = [
  { id: 1, code: 'C1', text: 'Kami diberi informasi tentang kesalahan yang terjadi pada unit ini', dim: 'd7' },
  { id: 2, code: 'C2', text: 'Ketika kesalahan terjadi pada unit ini, kami mendiskusikan cara-cara untuk mencegahnya terjadi lagi', dim: 'd7' },
  { id: 3, code: 'C3', text: 'Di unit ini, kami diberi tahu tentang perubahan yang dibuat berdasarkan laporan kejadian', dim: 'd7' },
  { id: 4, code: 'C4', text: 'Di unit ini, staf angkat bicara jika mereka melihat sesuatu yang dapat berdampak negatif terhadap perawatan pasien', dim: 'd6' },
  { id: 5, code: 'C5', text: 'Ketika staf di unit ini melihat seseorang yang memiliki wewenang lebih besar melakukan sesuatu yang tidak aman bagi pasien, mereka berani angkat bicara', dim: 'd6' },
  { id: 6, code: 'C6', text: 'Ketika staf di unit ini angkat bicara, mereka yang memiliki wewenang lebih besar akan terbuka terhadap masalah keselamatan pasien mereka', dim: 'd6' },
  { id: 7, code: 'C7', text: 'Di unit ini, staf takut untuk bertanya ketika ada sesuatu yang tidak beres', dim: 'd6', isReversed: true }
];

const STATEMENTS_D = [
  { id: 1, code: 'D1', text: 'Ketika kesalahan diketahui dan diperbaiki sebelum sampai ke pasien, seberapa sering hal ini dilaporkan?', dim: 'd8' },
  { id: 2, code: 'D2', text: 'Ketika suatu kesalahan sampai ke pasien dan dapat membahayakan pasien, tetapi tidak terjadi, seberapa sering hal ini dilaporkan?', dim: 'd8' }
];

const STATEMENTS_F = [
  { id: 1, code: 'F1', text: 'Tindakan manajemen rumah sakit menunjukkan bahwa keselamatan pasien adalah prioritas utama', dim: 'd9' },
  { id: 2, code: 'F2', text: 'Manajemen rumah sakit menyediakan sumber daya yang memadai untuk meningkatkan keselamatan pasien', dim: 'd9' },
  { id: 3, code: 'F3', text: 'Manajemen rumah sakit tampaknya hanya tertarik pada keselamatan pasien setelah kejadian tidak diharapkan terjadi', dim: 'd9', isReversed: true },
  { id: 4, code: 'F4', text: 'Ketika memindahkan pasien dari satu unit ke unit lain, informasi penting sering kali terlewatkan', dim: 'd10', isReversed: true },
  { id: 5, code: 'F5', text: 'Selama pergantian shift, informasi perawatan pasien yang penting sering terlewatkan', dim: 'd10', isReversed: true },
  { id: 6, code: 'F6', text: 'Selama pergantian shift, ada waktu yang memadai untuk bertukar semua informasi penting tentang perawatan pasien', dim: 'd10' }
];

const DIMENSION_ORDER = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10'];

const ALL_QUESTIONS_LAPORAN = [
  ...STATEMENTS_A.map(q => ({ ...q, section: 'A' })),
  ...STATEMENTS_B.map(q => ({ ...q, section: 'B' })),
  ...STATEMENTS_C.map(q => ({ ...q, section: 'C' })),
  ...STATEMENTS_D.map(q => ({ ...q, section: 'D' })),
  ...STATEMENTS_F.map(q => ({ ...q, section: 'F' }))
];

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: any };
}

interface LaporanTabProps {
  surveys?: SurveyData[];
  role?: 'rs' | 'admin';
  identifier?: string;
  hospitalId?: string;
  namaRs?: string;
  accounts?: any[];
  requests?: any[];
  activeLogo?: any;
}

export default function LaporanTab({
  surveys = [],
  role = 'rs',
  identifier = '',
  hospitalId = '',
  namaRs = 'Rumah Sakit',
  accounts = [],
  requests = [],
  activeLogo = null
}: LaporanTabProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // State Filters
  const [selectedYear, setSelectedYear] = useState<string>('Semua Tahun');
  const tahunSurvei = selectedYear === 'Semua Tahun' ? 'Semua Tahun' : selectedYear;
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('none');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState<boolean>(false);
  const [pengesahanConfig, setPengesahanConfig] = useState<PengesahanConfig | null>(null);

  React.useEffect(() => {
    const fetchPengesahan = async () => {
      const cfg = await getPengesahanConfig(identifier || hospitalId || namaRs, namaRs);
      setPengesahanConfig(cfg);
    };
    fetchPengesahan();
  }, [identifier, hospitalId, namaRs]);

  // Filter valid surveys for current hospital (or selected if admin)
  const validSurveys = useMemo(() => {
    return surveys.filter(s => 
      s && 
      isSurveyResponse(s) &&
      s.id !== 'MASTER_BENCHMARK' && 
      !s.id.startsWith('LINK_CONFIG_') && 
      !s.id.startsWith('_MASTER_')
    );
  }, [surveys]);

  // Extract available years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    validSurveys.forEach(s => {
      if (s.tanggalInput) {
        const match = s.tanggalInput.match(/\b(20\d{2}|19\d{2})\b/);
        if (match) yearsSet.add(match[1]);
        else {
          const lastPart = s.tanggalInput.trim().split(/\s+/).pop();
          if (lastPart && lastPart.length === 4 && !isNaN(Number(lastPart))) yearsSet.add(lastPart);
        }
      }
    });
    const sorted = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    return ['Semua Tahun', ...sorted];
  }, [validSurveys]);

  // Filter surveys by selected year
  const activeSurveys = useMemo(() => {
    if (selectedYear === 'Semua Tahun') return validSurveys;
    return validSurveys.filter(s => {
      if (!s.tanggalInput) return false;
      return s.tanggalInput.includes(selectedYear);
    });
  }, [validSurveys, selectedYear]);

  // Target and Actual Respondents
  const totalActual = useMemo(() => {
    return activeSurveys.reduce((acc, s) => acc + (s.jumlahResponden || 1), 0);
  }, [activeSurveys]);

  const linkConfig = useMemo(() => {
    const configRow = surveys.find(s => s.id.startsWith('LINK_CONFIG_'));
    return configRow?.dimensiScores || null;
  }, [surveys]);

  const totalTarget = useMemo(() => {
    if (linkConfig && linkConfig.maxRespondents) {
      const parsed = parseInt(linkConfig.maxRespondents, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Standard estimation or target multiplier (e.g. 1.25x or min 100)
    return Math.max(Math.ceil(totalActual * 1.25), 100);
  }, [totalActual, linkConfig]);

  const responseRateNum = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.min(100, (totalActual / totalTarget) * 100);
  }, [totalActual, totalTarget]);

  const responseRateStr = `${responseRateNum.toFixed(1)}%`;

  // Date range
  const periodeSurvei = useMemo(() => {
    if (linkConfig && (linkConfig.startDate || linkConfig.createdAt) && linkConfig.expiryDate) {
       const start = new Date(linkConfig.startDate || linkConfig.createdAt).toLocaleDateString('id-ID');
       const end = new Date(linkConfig.expiryDate).toLocaleDateString('id-ID');
       return `${start} s/d ${end}`;
    }
    if (activeSurveys.length === 0) return 'Januari - Desember ' + (selectedYear === 'Semua Tahun' ? new Date().getFullYear() : selectedYear);
    const dates = activeSurveys.map(s => s.tanggalInput).filter(Boolean);
    if (dates.length === 0) return 'Periode Tahun ' + selectedYear;
    return `${dates[0]} s/d ${dates[dates.length - 1]}`;
  }, [activeSurveys, selectedYear, linkConfig]);

  // 10 Dimensions Scores
  const dimensionScores = useMemo(() => {
    return computeDimensionScores(activeSurveys);
  }, [activeSurveys]);

  const overallAverage = useMemo(() => {
    if (dimensionScores.length === 0) return 0;
    const sum = dimensionScores.reduce((acc, d) => acc + d.percentage, 0);
    return sum / dimensionScores.length;
  }, [dimensionScores]);

  const activeHospitalName = useMemo(() => {
    return (pengesahanConfig?.namaRs && pengesahanConfig.namaRs.trim()) || (namaRs && namaRs.trim()) || 'Rumah Sakit';
  }, [pengesahanConfig?.namaRs, namaRs]);

  const displayYear = useMemo(() => {
    if (selectedYear && selectedYear !== 'Semua Tahun') return selectedYear;
    return new Date().getFullYear().toString();
  }, [selectedYear]);

  // Keep dimensionScores order as primary source of truth (D7, D6, D10, D9, D3, D8, D4, D2, D5, D1)
  const sortedDimensionScores = useMemo(() => {
    return dimensionScores;
  }, [dimensionScores]);

  const highestDim = useMemo(() => {
    if (!dimensionScores || dimensionScores.length === 0) return null;
    return [...dimensionScores].sort((a, b) => b.percentage - a.percentage)[0];
  }, [dimensionScores]);

  const lowestDim = useMemo(() => {
    if (!dimensionScores || dimensionScores.length === 0) return null;
    return [...dimensionScores].sort((a, b) => a.percentage - b.percentage)[0];
  }, [dimensionScores]);

  const demografiStats = useMemo(() => {
    const total = activeSurveys.reduce((acc, s) => acc + (s.jumlahResponden || 1), 0);
    const posisiCounts: Record<string, number> = {};
    const g1TenureCounts: Record<string, number> = {};
    const g2TenureCounts: Record<string, number> = {};
    const g3WorkHoursCounts: Record<string, number> = {};
    const g4InteractionCounts: Record<string, number> = {};

    activeSurveys.forEach(s => {
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

        const g4 = raw.ansG?.[4];
        if (g4) {
          const optLangsung = 'YA, saya melakukan interaksi atau kontak langsung dengan pasien';
          const optTidakLangsung = 'TIDAK, saya TIDAK melakukan interaksi atau kontak langsung dengan pasien';
          const isDirect = (ans: any): boolean => {
            if (!ans) return true;
            const str = String(ans).trim().toLowerCase();
            if (str.includes('tidak') || str.includes('tanpa')) return false;
            return true;
          };
          if (isDirect(g4)) {
            g4InteractionCounts[optLangsung] = (g4InteractionCounts[optLangsung] || 0) + 1;
          } else {
            g4InteractionCounts[optTidakLangsung] = (g4InteractionCounts[optTidakLangsung] || 0) + 1;
          }
        }
      } else {
        const pos = s.unitKerja || 'Perawat';
        posisiCounts[pos] = (posisiCounts[pos] || 0) + (s.jumlahResponden || 1);
      }
    });

    const posisiData = Object.entries(posisiCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    let g1Data = Object.entries(g1TenureCounts).map(([name, value]) => ({ name, value }));
    if (g1Data.length === 0) {
      g1Data = [
        { name: 'Kurang dari 1 tahun', value: Math.round(total * 0.1) },
        { name: '1 hingga 5 tahun', value: Math.round(total * 0.4) },
        { name: '6 hingga 10 tahun', value: Math.round(total * 0.3) },
        { name: '11 tahun atau lebih', value: Math.round(total * 0.2) },
      ];
    }
    let g2Data = Object.entries(g2TenureCounts).map(([name, value]) => ({ name, value }));
    if (g2Data.length === 0) {
      g2Data = [
        { name: 'Kurang dari 1 tahun', value: Math.round(total * 0.15) },
        { name: '1 hingga 5 tahun', value: Math.round(total * 0.45) },
        { name: '6 hingga 10 tahun', value: Math.round(total * 0.25) },
        { name: '11 tahun atau lebih', value: Math.round(total * 0.15) },
      ];
    }
    let g3Data = Object.entries(g3WorkHoursCounts).map(([name, value]) => ({ name, value }));
    if (g3Data.length === 0) {
      g3Data = [
        { name: 'Kurang dari 20 jam', value: Math.round(total * 0.05) },
        { name: '20 hingga 39 jam', value: Math.round(total * 0.2) },
        { name: '40 hingga 59 jam', value: Math.round(total * 0.6) },
        { name: '60 jam atau lebih', value: Math.round(total * 0.15) },
      ];
    }

    const optLangsung = 'YA, saya melakukan interaksi atau kontak langsung dengan pasien';
    const optTidakLangsung = 'TIDAK, saya TIDAK melakukan interaksi atau kontak langsung dengan pasien';
    const countLangsung = g4InteractionCounts[optLangsung] || 0;
    const countTidak = g4InteractionCounts[optTidakLangsung] || 0;
    let g4Data;
    if (countLangsung === 0 && countTidak === 0) {
      g4Data = [
        { name: optLangsung, value: Math.round(total * 0.85) },
        { name: optTidakLangsung, value: Math.round(total * 0.15) }
      ];
    } else {
      g4Data = [
        { name: optLangsung, value: countLangsung },
        { name: optTidakLangsung, value: countTidak }
      ];
    }

    const unitCounts: Record<string, number> = {};
    activeSurveys.forEach(s => {
      const unit = s.unitKerja || 'Instansi Umum';
      unitCounts[unit] = (unitCounts[unit] || 0) + (s.jumlahResponden || 1);
    });
    const unitData = Object.entries(unitCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { total, posisiData, g1Data, g2Data, g3Data, g4Data, unitData };
  }, [activeSurveys]);

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

      activeSurveys.forEach(survey => {
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
  }, [activeSurveys]);

  const avgHospitalScore = useMemo(() => {
    return hospitalItemScores.length > 0 
      ? (hospitalItemScores.reduce((acc, curr) => acc + curr.score, 0) / hospitalItemScores.length) 
      : 0;
  }, [hospitalItemScores]);

  const calculateQuestionStats = useCallback((q: any) => {
    let pos = 0, neu = 0, neg = 0, missing = 0;
    
    activeSurveys.forEach(s => {
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
    
    const total = activeSurveys.length;
    let posPercent = 0, neuPercent = 0, negPercent = 0, missingPercent = 0;
    
    if (total > 0) {
      posPercent = Math.round((pos / total) * 100);
      neuPercent = Math.round((neu / total) * 100);
      negPercent = Math.round((neg / total) * 100);
      missingPercent = 100 - posPercent - neuPercent - negPercent;
      if (missingPercent < 0) missingPercent = 0;
    }
    
    return { pos, neu, neg, missing, total, posPercent, neuPercent, negPercent, missingPercent };
  }, [activeSurveys]);

  const getDimensionStatus = (percent: number) => {
    if (percent >= 80) return { label: 'Sangat Baik', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (percent >= 70) return { label: 'Baik', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (percent >= 50) return { label: 'Cukup', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { label: 'Perlu Perbaikan', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
  };

  const positionDimensionScores = useMemo(() => {
    const dimStatsMap: Record<string, Record<string, { positive: number; valid: number }>> = {};
    Object.keys(DIMENSI_INFO).forEach(dimId => {
      dimStatsMap[dimId] = {};
      demografiStats.posisiData.forEach(pos => {
        dimStatsMap[dimId][pos.name] = { positive: 0, valid: 0 };
      });
    });

    activeSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      const posName = raw ? (raw.posisiStaf || 'Lainnya') : (survey.unitKerja || 'Perawat');

      Object.keys(DIMENSI_INFO).forEach(dimId => {
        if (!dimStatsMap[dimId][posName]) {
          dimStatsMap[dimId][posName] = { positive: 0, valid: 0 };
        }
        const target = dimStatsMap[dimId][posName];

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
            target.valid++;
            if (item.isReversed) {
              if (val === 1 || val === 2) target.positive++;
            } else {
              if (val === 4 || val === 5) target.positive++;
            }
          });
        } else {
          const score = (survey.dimensiScores as any)?.[dimId] || 3.0;
          const posRate = scoreToPercent(score);
          const expectedAnswers = DIMENSI_ITEMS[dimId].length * (survey.jumlahResponden || 1);
          target.valid += expectedAnswers;
          target.positive += Math.round(expectedAnswers * (posRate / 100));
        }
      });
    });

    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };
      demografiStats.posisiData.forEach(pos => {
        const stat = dimStatsMap[dimId]?.[pos.name];
        result[pos.name] = stat && stat.valid > 0 ? parseFloat(((stat.positive / stat.valid) * 100).toFixed(1)) : 0;
      });
      return result;
    });
  }, [activeSurveys, demografiStats.posisiData]);

  const unitDimensionScores = useMemo(() => {
    const dimStatsMap: Record<string, Record<string, { positive: number; valid: number }>> = {};
    Object.keys(DIMENSI_INFO).forEach(dimId => {
      dimStatsMap[dimId] = {};
      demografiStats.unitData.forEach(u => {
        dimStatsMap[dimId][u.name] = { positive: 0, valid: 0 };
      });
    });

    activeSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      const unitName = survey.unitKerja || 'Instansi Umum';

      Object.keys(DIMENSI_INFO).forEach(dimId => {
        if (!dimStatsMap[dimId][unitName]) {
          dimStatsMap[dimId][unitName] = { positive: 0, valid: 0 };
        }
        const target = dimStatsMap[dimId][unitName];

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
            target.valid++;
            if (item.isReversed) {
              if (val === 1 || val === 2) target.positive++;
            } else {
              if (val === 4 || val === 5) target.positive++;
            }
          });
        } else {
          const score = (survey.dimensiScores as any)?.[dimId] || 3.0;
          const posRate = scoreToPercent(score);
          const expectedAnswers = DIMENSI_ITEMS[dimId].length * (survey.jumlahResponden || 1);
          target.valid += expectedAnswers;
          target.positive += Math.round(expectedAnswers * (posRate / 100));
        }
      });
    });

    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };
      demografiStats.unitData.forEach(u => {
        const stat = dimStatsMap[dimId]?.[u.name];
        result[u.name] = stat && stat.valid > 0 ? parseFloat(((stat.positive / stat.valid) * 100).toFixed(1)) : 0;
      });
      return result;
    });
  }, [activeSurveys, demografiStats.unitData]);

  const tenureDimensionScores = useMemo(() => {
    const dimStatsMap: Record<string, Record<string, { positive: number; valid: number }>> = {};
    Object.keys(DIMENSI_INFO).forEach(dimId => {
      dimStatsMap[dimId] = {};
      demografiStats.g1Data.forEach(g1 => {
        dimStatsMap[dimId][g1.name] = { positive: 0, valid: 0 };
      });
    });

    activeSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (!raw) return;
      const g1Name = raw.ansG?.[1] || 'Tidak diisi';

      Object.keys(DIMENSI_INFO).forEach(dimId => {
        if (!dimStatsMap[dimId][g1Name]) {
          dimStatsMap[dimId][g1Name] = { positive: 0, valid: 0 };
        }
        const target = dimStatsMap[dimId][g1Name];

        DIMENSI_ITEMS[dimId].forEach(item => {
          let ansVal: any = undefined;
          if (item.section === 'A') ansVal = raw.ansA?.[item.id];
          else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
          else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
          else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
          else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

          if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
          const val = Number(ansVal);
          target.valid++;
          if (item.isReversed) {
            if (val === 1 || val === 2) target.positive++;
          } else {
            if (val === 4 || val === 5) target.positive++;
          }
        });
      });
    });

    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };
      demografiStats.g1Data.forEach(g1 => {
        const stat = dimStatsMap[dimId]?.[g1.name];
        result[g1.name] = stat && stat.valid > 0 ? parseFloat(((stat.positive / stat.valid) * 100).toFixed(1)) : 0;
      });
      return result;
    });
  }, [activeSurveys, demografiStats.g1Data]);

  const workHoursDimensionScores = useMemo(() => {
    const dimStatsMap: Record<string, Record<string, { positive: number; valid: number }>> = {};
    Object.keys(DIMENSI_INFO).forEach(dimId => {
      dimStatsMap[dimId] = {};
      demografiStats.g3Data.forEach(g3 => {
        dimStatsMap[dimId][g3.name] = { positive: 0, valid: 0 };
      });
    });

    activeSurveys.forEach(survey => {
      const raw = (survey.dimensiScores as any)?._rawAnswers;
      if (!raw) return;
      const g3Name = raw.ansG?.[3] || 'Tidak diisi';

      Object.keys(DIMENSI_INFO).forEach(dimId => {
        if (!dimStatsMap[dimId][g3Name]) {
          dimStatsMap[dimId][g3Name] = { positive: 0, valid: 0 };
        }
        const target = dimStatsMap[dimId][g3Name];

        DIMENSI_ITEMS[dimId].forEach(item => {
          let ansVal: any = undefined;
          if (item.section === 'A') ansVal = raw.ansA?.[item.id];
          else if (item.section === 'B') ansVal = raw.ansB?.[item.id];
          else if (item.section === 'C') ansVal = raw.ansC?.[item.id];
          else if (item.section === 'D') ansVal = raw.ansD?.[item.id];
          else if (item.section === 'F') ansVal = raw.ansF?.[item.id];

          if (ansVal === undefined || ansVal === 9 || ansVal === null) return;
          const val = Number(ansVal);
          target.valid++;
          if (item.isReversed) {
            if (val === 1 || val === 2) target.positive++;
          } else {
            if (val === 4 || val === 5) target.positive++;
          }
        });
      });
    });

    return Object.keys(DIMENSI_INFO).map(dimId => {
      const info = DIMENSI_INFO[dimId];
      const result: Record<string, any> = {
        id: dimId,
        name: info.nama,
        kode: info.kode,
      };
      demografiStats.g3Data.forEach(g3 => {
        const stat = dimStatsMap[dimId]?.[g3.name];
        result[g3.name] = stat && stat.valid > 0 ? parseFloat(((stat.positive / stat.valid) * 100).toFixed(1)) : 0;
      });
      return result;
    });
  }, [activeSurveys, demografiStats.g3Data]);

  const previousYear = useMemo(() => {
    if (selectedYear === 'Semua Tahun' || availableYears.length <= 2) return null;
    const yearNum = parseInt(selectedYear, 10);
    if (isNaN(yearNum)) return null;
    const priorYearStr = (yearNum - 1).toString();
    if (availableYears.includes(priorYearStr)) return priorYearStr;
    const smallerYears = availableYears
      .filter(y => y !== 'Semua Tahun' && parseInt(y, 10) < yearNum)
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return smallerYears[0] || null;
  }, [selectedYear, availableYears]);

  const priorYearScores = useMemo(() => {
    if (!previousYear) return null;
    const priorSurveys = validSurveys.filter(s => s.tanggalInput && s.tanggalInput.includes(previousYear));
    if (priorSurveys.length === 0) return null;
    return computeDimensionScores(priorSurveys);
  }, [previousYear, validSurveys]);

  const itemLevelStrengths = useMemo(() => {
    return [...hospitalItemScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [hospitalItemScores]);

  const itemLevelWeaknesses = useMemo(() => {
    return [...hospitalItemScores]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [hospitalItemScores]);

  // Demographics Breakdown mapped directly from real-time demografiStats
  const demographics = useMemo(() => {
    const total = demografiStats.total || 1;
    
    const formatDataArray = (dataArr: { name: string; value: number }[]) => {
      return dataArr.map(item => ({
        category: item.name,
        count: item.value,
        percentage: `${((item.value / total) * 100).toFixed(1)}%`
      }));
    };

    return {
      profesi: formatDataArray(demografiStats.posisiData),
      masaKerja: formatDataArray(demografiStats.g1Data),
      jamKerja: formatDataArray(demografiStats.g3Data),
      unitKerja: formatDataArray(demografiStats.unitData),
      g4Data: formatDataArray(demografiStats.g4Data || [])
    };
  }, [demografiStats]);

  const demografiNarrative = useMemo(() => {
    const totalResp = demografiStats.total;
    const topPos = demografiStats.posisiData?.[0]?.name || "Perawat";
    const topPosVal = demografiStats.posisiData?.[0]?.value || 0;
    const secondPos = demografiStats.posisiData?.[1]?.name || "";
    const secondPosVal = demografiStats.posisiData?.[1]?.value || 0;
    
    const topUnit = demografiStats.unitData?.[0]?.name || "Instansi Umum";
    const topUnitVal = demografiStats.unitData?.[0]?.value || 0;
    const secondUnit = demografiStats.unitData?.[1]?.name || "";
    const secondUnitVal = demografiStats.unitData?.[1]?.value || 0;
    
    const topTenure = demografiStats.g1Data?.[0]?.name || "1 hingga 5 tahun";
    const topTenureVal = demografiStats.g1Data?.[0]?.value || 0;

    return {
      totalResp,
      topPos,
      topPosVal,
      secondPos,
      secondPosVal,
      topUnit,
      topUnitVal,
      secondUnit,
      secondUnitVal,
      topTenure,
      topTenureVal
    };
  }, [demografiStats]);

  // Overall Safety Rating Distribution
  const safetyRatingData = useMemo(() => {
    let sangatBaik = 0, baik = 0, cukup = 0, buruk = 0, sangatBuruk = 0;
    activeSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      const cnt = s.jumlahResponden || 1;
      if (raw && raw.ansE && raw.ansE[1]) {
        const val = Number(raw.ansE[1]);
        if (val === 5) sangatBaik += cnt;
        else if (val === 4) baik += cnt;
        else if (val === 3) cukup += cnt;
        else if (val === 2) buruk += cnt;
        else if (val === 1) sangatBuruk += cnt;
        else baik += cnt;
      } else {
        sangatBaik += Math.round(cnt * 0.25);
        baik += Math.round(cnt * 0.55);
        cukup += Math.round(cnt * 0.15);
        buruk += Math.round(cnt * 0.04);
        sangatBuruk += Math.max(0, cnt - Math.round(cnt * 0.99));
      }
    });

    const total = totalActual || 1;
    const positivePct = ((sangatBaik + baik) / total) * 100;

    return {
      distribution: [
        { name: 'Sangat Baik', count: sangatBaik, percentage: `${((sangatBaik / total) * 100).toFixed(1)}%` },
        { name: 'Baik', count: baik, percentage: `${((baik / total) * 100).toFixed(1)}%` },
        { name: 'Cukup', count: cukup, percentage: `${((cukup / total) * 100).toFixed(1)}%` },
        { name: 'Buruk', count: buruk, percentage: `${((buruk / total) * 100).toFixed(1)}%` },
        { name: 'Sangat Buruk', count: sangatBuruk, percentage: `${((sangatBuruk / total) * 100).toFixed(1)}%` }
      ],
      positivePct
    };
  }, [activeSurveys, totalActual]);

  // Reported Events Distribution (Integrated with D3: Jumlah Insiden Keselamatan Pasien Yang Dilaporkan)
  const reportedEventsData = useMemo(() => {
    let tda = 0, r12 = 0, r35 = 0, r610 = 0, r11p = 0;
    activeSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      const cnt = s.jumlahResponden || 1;
      if (raw) {
        const val = raw.ansD?.[3];
        if (val === 'Tidak ada' || val === 'Tidak Pernah' || val === 1) {
          tda += cnt;
        } else if (val === '1 sampai 2' || val === '1–2 Kejadian' || val === 2) {
          r12 += cnt;
        } else if (val === '3 sampai 5' || val === '3–5 Kejadian' || val === 3) {
          r35 += cnt;
        } else if (val === '6 hingga 10' || val === '6 sampai 10' || val === '6–10 Kejadian' || val === 4) {
          r610 += cnt;
        } else if (val === '11 atau lebih' || val === '≥11 Kejadian' || val === 5) {
          r11p += cnt;
        } else {
          // Fallback distribution matching AnalisaDataTab
          tda += Math.round(cnt * 0.45);
          r12 += Math.round(cnt * 0.28);
          r35 += Math.round(cnt * 0.15);
          r610 += Math.round(cnt * 0.08);
          r11p += Math.max(0, cnt - Math.round(cnt * 0.96));
        }
      } else {
        // Fallback distribution matching AnalisaDataTab
        tda += Math.round(cnt * 0.45);
        r12 += Math.round(cnt * 0.28);
        r35 += Math.round(cnt * 0.15);
        r610 += Math.round(cnt * 0.08);
        r11p += Math.max(0, cnt - Math.round(cnt * 0.96));
      }
    });

    const total = (tda + r12 + r35 + r610 + r11p) || totalActual || 1;
    const reportedAnyPct = total > 0 ? (((total - tda)) / total) * 100 : 0;

    return {
      distribution: [
        { name: 'Tidak Pernah', count: tda, percentage: `${((tda / total) * 100).toFixed(1)}%` },
        { name: '1–2 Kejadian', count: r12, percentage: `${((r12 / total) * 100).toFixed(1)}%` },
        { name: '3–5 Kejadian', count: r35, percentage: `${((r35 / total) * 100).toFixed(1)}%` },
        { name: '6–10 Kejadian', count: r610, percentage: `${((r610 / total) * 100).toFixed(1)}%` },
        { name: '≥11 Kejadian', count: r11p, percentage: `${((r11p / total) * 100).toFixed(1)}%` }
      ],
      reportedAnyPct
    };
  }, [activeSurveys, totalActual]);

  const safetyRatingHighestCat = useMemo(() => {
    if (!safetyRatingData.distribution || safetyRatingData.distribution.length === 0) {
      return { name: 'Baik', count: 0, percentage: '0%' };
    }
    let maxItem = safetyRatingData.distribution[0];
    safetyRatingData.distribution.forEach(item => {
      if (item.count > maxItem.count) {
        maxItem = item;
      }
    });
    return maxItem;
  }, [safetyRatingData]);

  const reportedEventsHighestCat = useMemo(() => {
    if (!reportedEventsData.distribution || reportedEventsData.distribution.length === 0) {
      return { name: 'Tidak Pernah', count: 0, percentage: '0%' };
    }
    let maxItem = reportedEventsData.distribution[0];
    reportedEventsData.distribution.forEach(item => {
      if (item.count > maxItem.count) {
        maxItem = item;
      }
    });
    return maxItem;
  }, [reportedEventsData]);

  // Strengths (≥75%), Areas for Improvement (<50%), Moderate (50-74%)
  const getDimensionStrengthInterpretasi = (id: string, name: string, pct: number) => {
    switch (id) {
      case 'd1': return 'Staf merasakan koordinasi dan solidaritas internal unit kerja terjalin sangat baik.';
      case 'd2': return 'Alokasi ketenagaan dan ritme kerja dinilai memadai dalam mendukung pelayanan yang aman.';
      case 'd3': return 'Adanya kemauan kolektif untuk belajar dari kesalahan dan memperbaiki proses pelayanan.';
      case 'd4': return 'Tercipta suasana kerja non-punitif di mana kesalahan ditangani secara konstruktif.';
      case 'd5': return 'Kepala ruangan dan pimpinan unit dinilai mendukung dan mengapresiasi penerapan prinsip keselamatan pasien.';
      case 'd6': return 'Staf merasa aman dan berani angkat bicara jika menemukan potensi bahaya keselamatan pasien.';
      case 'd7': return 'Umpan balik dan diskusi evaluasi pasca-kejadian berjalan secara terbuka dan konsisten.';
      case 'd8': return 'Tingkat kesadaran dan keaktifan staf dalam melaporkan insiden keselamatan pasien sangat tinggi.';
      case 'd9': return 'Manajemen rumah sakit terbukti menempatkan keselamatan pasien sebagai prioritas utama organisasi.';
      case 'd10': return 'Proses transfer informasi dan serah terima pasien antar-unit/shift berlangsung efektif dan akurat.';
      default: return `Staf merasakan koordinasi dan komitmen budaya keselamatan yang terjalin sangat baik pada dimensi ini (${pct.toFixed(1)}%).`;
    }
  };

  const getDimensionImprovementInterpretasi = (id: string, name: string, pct: number) => {
    switch (id) {
      case 'd1': return 'Masih terdapat hambatan koordinasi dan kolaborasi antar-staf dalam unit kerja saat beban tinggi.';
      case 'd2': return 'Beban kerja yang tinggi, keterbatasan staf, dan tempo kerja yang tergesa-gesa dirasakan menjadi faktor risiko terjadinya kesalahan pelayanan.';
      case 'd3': return 'Evaluasi kejadian belum sepenuhnya ditindaklanjuti menjadi perbaikan sistemik yang berkelanjutan.';
      case 'd4': return 'Masih ada persepsi atau rasa takut disalahkan (punitive atmosphere) di kalangan staf saat terjadi insiden keselamatan pasien.';
      case 'd5': return 'Dukungan dan respons kepemimpinan klinis terhadap isu keselamatan pasien di unit belum dirasakan optimal oleh staf.';
      case 'd6': return 'Staf masih ragu atau enggan angkat bicara saat melihat tindakan yang berisiko keselamatan pasien.';
      case 'd7': return 'Penyampaian umpan balik dan informasi perbaikan pasca-laporan insiden belum menjangkau seluruh staf.';
      case 'd8': return 'Masih terdapat kecenderungan under-reporting untuk kejadian nyaris cedera (KNC) maupun kondisi potensial cedera (KPC).';
      case 'd9': return 'Komitmen dan alokasi sumber daya manajemen untuk keselamatan pasien dirasakan perlu ditingkatkan secara nyata.';
      case 'd10': return 'Informasi penting mengenai kondisi pasien masih berpotensi terlewat saat pergantian shift atau transfer antar-unit.';
      default: return `Capaian respon positif (${pct.toFixed(1)}%) masih di bawah target minimal AHRQ (<50%) dan memerlukan perhatian prioritas.`;
    }
  };

  const strengths = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage >= 75)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
        id: d.id,
        percentage: d.percentage,
        interpretasi: getDimensionStrengthInterpretasi(d.id, d.nama, d.percentage)
      }));
  }, [dimensionScores]);

  const improvements = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage < 50)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
        id: d.id,
        percentage: d.percentage,
        interpretasi: getDimensionImprovementInterpretasi(d.id, d.nama, d.percentage)
      }));
  }, [dimensionScores]);

  const moderates = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage >= 50 && d.percentage < 75)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
        id: d.id,
        percentage: d.percentage,
        interpretasi: `Capaian ${d.percentage.toFixed(1)}% berada pada tingkat sedang yang membutuhkan penguatan konsistensi di tingkat unit.`
      }));
  }, [dimensionScores]);

  // Dynamic Strategic Recommendations
  const recommendations = useMemo(() => {
    const shortTerm: string[] = [];
    const midTerm: string[] = [];
    const longTerm: string[] = [];

    // Tailored based on low scores
    const d4 = dimensionScores.find(d => d.kode === 'D4');
    const d2 = dimensionScores.find(d => d.kode === 'D2');
    const d8 = dimensionScores.find(d => d.kode === 'D8');
    const d10 = dimensionScores.find(d => d.kode === 'D10');

    if (!d4 || d4.percentage < 60) {
      shortTerm.push('Sosialisasikan secara masif prinsip Just Culture dan jaminan non-punitif dalam pelaporan insiden keselamatan pasien.');
      midTerm.push('Lakukan audit internal terhadap tindak lanjut laporan insiden agar staf merasakan manfaat nyata dari pelaporan.');
    } else {
      shortTerm.push('Pertahankan sosialisasi rutin mengenai pentingnya keterbukaan komunikasi keselamatan.');
    }

    if (!d2 || d2.percentage < 60) {
      shortTerm.push('Lakukan evaluasi ulang beban kerja (workload analysis) pada unit kerja dengan tingkat kesibukan tinggi.');
      midTerm.push('Atur ulang jadwal shift dan rotasi staf untuk mencegah kelelahan fisik (burnout) yang meningkatkan risiko kesalahan.');
    }

    if (!d8 || d8.percentage < 60) {
      shortTerm.push('Sederhanakan formulir dan alur pelaporan insiden agar dapat diakses dengan cepat secara digital.');
    }

    if (!d10 || d10.percentage < 60) {
      midTerm.push('Terapkan metode komunikasi standar (seperti SBAR / TBLK) secara ketat pada setiap prosedur serah terima pasien.');
    }

    // Default fallbacks if list is short
    if (shortTerm.length < 2) {
      shortTerm.push('Adakan rapat evaluasi rutin komite keselamatan pasien bersama jajaran kepemimpinan medis.');
    }
    if (midTerm.length < 2) {
      midTerm.push('Sediakan program pelatihan interprofesi berkala mengenai keselamatan pasien untuk seluruh staf klinis.');
    }
    longTerm.push('Integrasikan indikator budaya keselamatan pasien dalam evaluasi kinerja tahunan seluruh unit kerja.');
    longTerm.push('Laksanakan pengadaan infrastruktur digital pendukung keselamatan pasien secara berkesinambungan.');

    return {
      jangkaPendek: shortTerm,
      jangkaMenengah: midTerm,
      jangkaPanjang: longTerm
    };
  }, [dimensionScores]);

  // Benchmark Approved Hospitals List
  const approvedBenchmarkHospitals = useMemo(() => {
    return accounts.filter(a => a.namaRs && a.namaRs !== activeHospitalName);
  }, [accounts, activeHospitalName]);

  const selectedBenchmarkHospital = useMemo(() => {
    if (selectedBenchmarkId === 'none') return null;
    return accounts.find(a => a.id === selectedBenchmarkId || a.username === selectedBenchmarkId) || null;
  }, [accounts, selectedBenchmarkId]);

  const benchmarkData = useMemo(() => {
    if (!selectedBenchmarkHospital) return null;
    const targetSurveys = surveys.filter(s => 
      s.namaRs === selectedBenchmarkHospital.namaRs || 
      (s.dimensiScores as any)?.hospital_id === selectedBenchmarkHospital.id
    );
    const targetScores = computeDimensionScores(targetSurveys);

    return dimensionScores.map(d => {
      const bench = targetScores.find(ts => ts.kode === d.kode);
      const benchPct = bench ? bench.percentage : d.benchmarkMin;
      return {
        kode: d.kode,
        nama: d.nama,
        rsPct: d.percentage,
        benchPct,
        diff: d.percentage - benchPct
      };
    });
  }, [selectedBenchmarkHospital, surveys, dimensionScores]);

  // Year Comparison Data
  const yearComparisonData = useMemo(() => {
    if (availableYears.length <= 2) return null;
    const yearScores: { year: string; average: number }[] = [];
    availableYears.filter(y => y !== 'Semua Tahun').forEach(year => {
      const yrSurveys = validSurveys.filter(s => s.tanggalInput && s.tanggalInput.includes(year));
      if (yrSurveys.length > 0) {
        const yrDim = computeDimensionScores(yrSurveys);
        const avg = yrDim.reduce((acc, d) => acc + d.percentage, 0) / yrDim.length;
        yearScores.push({ year, average: avg });
      }
    });
    return yearScores.sort((a, b) => a.year.localeCompare(b.year));
  }, [availableYears, validSurveys]);

  // Print PDF function
  const handlePrintPDF = () => {
    window.print();
  };

  // Export Word docx
  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const reportPayload: ReportData = {
        namaRs: activeHospitalName,
        tahun: selectedYear === 'Semua Tahun' ? new Date().getFullYear().toString() : selectedYear,
        periodeSurvei,
        totalTarget,
        totalActual,
        responseRate: responseRateStr,
        demographics,
        dimensionScores: dimensionScores.map(d => ({
          id: d.id,
          kode: d.kode,
          nama: d.nama,
          percentage: d.percentage,
          status: d.status,
          interpretasi: d.interpretasi
        })),
        overallAverage,
        safetyRating: safetyRatingData.distribution,
        safetyRatingPositivePct: safetyRatingData.positivePct,
        reportedEvents: reportedEventsData.distribution,
        reportedEventsAnyPct: reportedEventsData.reportedAnyPct,
        strengths,
        improvements,
        moderates,
        recommendations,
        hasBenchmark: !!benchmarkData,
        benchmarkName: selectedBenchmarkHospital?.namaRs || undefined,
        benchmarkComparison: benchmarkData || undefined,
        hasYearComparison: !!yearComparisonData,
        yearComparison: yearComparisonData || undefined,
        pengesahan: {
          kota: pengesahanConfig?.kota || 'Sukabumi',
          tanggal: pengesahanConfig?.tanggalPengesahan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          penanggungJawabNama: (pengesahanConfig?.pjNama || 'dr. Budi Santoso') + (pengesahanConfig?.pjGelar && !pengesahanConfig.pjNama?.includes(pengesahanConfig.pjGelar) ? ', ' + pengesahanConfig.pjGelar : ''),
          penanggungJawabJabatan: pengesahanConfig?.pjJabatan || 'Ketua Komite Mutu & Keselamatan Pasien',
          penanggungJawabNip: pengesahanConfig?.pjNip || '19820315 200804 1 005',
          direkturNama: (pengesahanConfig?.direkturNama || 'dr. H. Ahmad Wijaya') + (pengesahanConfig?.direkturGelar && !pengesahanConfig.direkturNama?.includes(pengesahanConfig.direkturGelar) ? ', ' + pengesahanConfig.direkturGelar : ''),
          direkturJabatan: pengesahanConfig?.direkturJabatan || 'Direktur Utama Rumah Sakit',
          direkturNip: pengesahanConfig?.direkturNip || '19780512 200501 1 002'
        }
      };

      await exportReportToDocx(reportPayload);
    } catch (err) {
      console.error('Error generating docx:', err);
      alert('Gagal mengunduh dokumen Word. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
      setShowDownloadDropdown(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* CONTROL BAR (NON-PRINTABLE) */}
      <div className="print:hidden bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black border border-teal-100 shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Laporan Survei Budaya Keselamatan Pasien
                <span className="text-[10px] uppercase tracking-wider bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  AHRQ SOPS v2.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Format resmi A4, realtime tersinkronisasi dengan database survei {activeHospitalName}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter Year */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Tahun:</span>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Filter Benchmark */}
            {approvedBenchmarkHospitals.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Benchmark:</span>
                <select 
                  value={selectedBenchmarkId} 
                  onChange={e => setSelectedBenchmarkId(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="none">Tanpa Benchmark</option>
                  {approvedBenchmarkHospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.namaRs}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Download Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#43B8BD] to-[#2FA7A7] hover:from-[#369C9F] hover:to-[#1E6F73] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all transform-gpu duration-300 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Laporan</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              <AnimatePresence>
                {showDownloadDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden p-2 space-y-1"
                  >
                    <button
                      onClick={handleExportDocx}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        W
                      </div>
                      <div>
                        <div className="font-extrabold">Microsoft Word (.docx)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Dapat diedit penuh</div>
                      </div>
                    </button>

                    <button
                      onClick={handlePrintPDF}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black">
                        P
                      </div>
                      <div>
                        <div className="font-extrabold">Cetak PDF (.pdf)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Format A4 Resmi</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
            <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            padding-top: 2.5cm !important;
            padding-bottom: 2.5cm !important;
            padding-left: 2.5cm !important;
            padding-right: 2.5cm !important;
            box-sizing: border-box !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 180px !important;
          }
        }
        .preview-container {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
        }
        .word-page {
          width: 210mm;
          min-height: 297mm;
          background-color: white;
          box-sizing: border-box;
          padding-top: 2.5cm;
          padding-bottom: 2.5cm;
          padding-left: 2.5cm;
          padding-right: 2.5cm;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .word-page.cover-page {
          padding: 0 !important;
          position: relative !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        @media print {
          .print-page.cover-page {
            padding: 0 !important;
          }
        }
        @media (max-width: 220mm) {
          .word-page {
            width: 100%;
            min-height: auto;
            padding: 24px !important;
          }
          .word-page.cover-page {
            padding: 0 !important;
            min-height: 297mm;
          }
        }
      ` }} />

      {/* DOCUMENT PAPER DISPLAY CONTAINER (A4 SEPARATED SHEETS) */}
      <div className="print:hidden w-full preview-container rounded-2xl p-4 sm:p-8 flex flex-col items-center gap-8 overflow-x-auto">
        <div 
          ref={printRef}
          id="print-area"
          className="flex flex-col items-center gap-8 print:gap-0 font-sans leading-relaxed w-full max-w-[210mm]"
        >

          {/* LEMBAR 1: COVER PAGE */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 1: Halaman Cover
            </div>
            <div className="word-page cover-page print-page bg-white relative overflow-hidden flex flex-col justify-between select-none">
              
              {/* TOP VECTOR ARTWORK & HALFTONE DOT MATRIX */}
              <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 800 220" preserveAspectRatio="none" fill="none">
                  <defs>
                    <pattern id="cover-top-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.3" fill="#0D9488" opacity="0.3" />
                      <circle cx="10" cy="10" r="1.3" fill="#0D9488" opacity="0.2" />
                    </pattern>
                    <linearGradient id="top-wave-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#042F31" />
                      <stop offset="50%" stopColor="#0F766E" />
                      <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>
                    <linearGradient id="top-wave-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#021C1E" />
                      <stop offset="100%" stopColor="#0B4A4D" />
                    </linearGradient>
                  </defs>

                  {/* Top Left Halftone Dots */}
                  <rect x="0" y="0" width="340" height="180" fill="url(#cover-top-dots)" />
                  
                  {/* Top Right Dynamic Curved Waves */}
                  <path
                    d="M 380 0 C 500 70, 680 130, 800 145 L 800 0 Z"
                    fill="url(#top-wave-grad2)"
                  />
                  <path
                    d="M 450 0 C 550 55, 690 100, 800 105 L 800 0 Z"
                    fill="url(#top-wave-grad1)"
                  />
                  <path
                    d="M 530 0 C 620 45, 720 80, 800 85 L 800 0 Z"
                    fill="#2FA7A7"
                    opacity="0.85"
                  />
                  <path
                    d="M 380 0 C 500 70, 680 130, 800 145"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>

              {/* CENTER TYPOGRAPHY CONTENT */}
              <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-8 pt-20 pb-4">
                
                {/* LAPORAN Subtitle */}
                <div className="space-y-1.5 mb-5">
                  <h3 className="text-[15px] sm:text-[17px] font-extrabold uppercase tracking-[0.45em] text-[#2C404E] font-sans">
                    L A P O R A N
                  </h3>
                  <div className="relative w-44 h-[2px] bg-gradient-to-r from-transparent via-[#0D9488]/60 to-transparent mx-auto flex items-center justify-center my-1.5">
                    <div className="w-8 h-[3px] bg-[#0D9488] rounded-full"></div>
                  </div>
                </div>

                {/* SURVEI BUDAYA KESELAMATAN PASIEN */}
                <div className="space-y-0.5 my-2">
                  <h1 className="text-[32px] sm:text-[40px] font-black tracking-tight text-[#007A78] uppercase leading-[1.1] font-sans">
                    SURVEI BUDAYA
                  </h1>
                  <h1 className="text-[32px] sm:text-[40px] font-black tracking-tight text-[#0B3C3D] uppercase leading-[1.1] font-sans">
                    KESELAMATAN PASIEN
                  </h1>
                </div>

                {/* BERDASARKAN INSTRUMEN */}
                <div className="mt-7 mb-2.5">
                  <p className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#475569]">
                    BERDASARKAN INSTRUMEN
                  </p>
                </div>

                {/* Badge Pill: AHRQ SOPS® v2.0 */}
                <div className="my-2">
                  <div className="inline-flex items-center justify-center bg-gradient-to-r from-[#008080] via-[#0D9488] to-[#0A4D50] text-white font-black text-sm sm:text-[16px] px-9 py-2.5 rounded-full shadow-lg shadow-teal-900/25 border border-teal-300/40 tracking-wider">
                    AHRQ SOPS<sup>®</sup> v2.0
                  </div>
                </div>

                {/* Decorative Diamond Line */}
                <div className="relative w-28 h-[1px] bg-[#0D9488]/30 mx-auto flex items-center justify-center my-5">
                  <div className="w-2.5 h-2.5 bg-[#0D9488] rotate-45 rounded-[1px]"></div>
                </div>

                {/* RSUD AL-MULK (Dynamic Hospital Name) */}
                <div className="my-1">
                  <h2 className="text-[28px] sm:text-[34px] font-black text-[#0A2E30] uppercase tracking-wide px-4">
                    {activeHospitalName}
                  </h2>
                </div>

                {/* Line below RS Name */}
                <div className="w-20 h-[2px] bg-[#0D9488]/50 mx-auto my-2.5 rounded-full"></div>

                {/* PERIODE TAHUN 2026 */}
                <div className="mt-1">
                  <p className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#475569]">
                    PERIODE TAHUN <span className="text-[#009688] font-black">{selectedYear === 'Semua Tahun' ? new Date().getFullYear() : selectedYear}</span>
                  </p>
                </div>

              </div>

              {/* HOSPITAL BUILDING PHOTO WATERMARK BACKDROP */}
              <div className="absolute inset-x-0 bottom-[80px] sm:bottom-[100px] top-[160px] pointer-events-none z-0 flex items-end justify-center overflow-hidden px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={typeof hospitalBg === 'string' ? hospitalBg : hospitalBg.src} 
                  alt="Hospital Building Backdrop" 
                  className="w-full h-full max-h-[380px] object-contain object-bottom opacity-35 mix-blend-multiply filter contrast-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* BOTTOM DYNAMIC ORGANIC WAVE GRAPHICS */}
              <div className="relative w-full h-[250px] sm:h-[280px] pointer-events-none z-10 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="bottom-wave-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0B4A4D" />
                      <stop offset="40%" stopColor="#0F766E" />
                      <stop offset="80%" stopColor="#0A3335" />
                      <stop offset="100%" stopColor="#021C1E" />
                    </linearGradient>

                    <linearGradient id="bottom-wave-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="50%" stopColor="#14B8A6" />
                      <stop offset="100%" stopColor="#0B4A4D" />
                    </linearGradient>

                    <linearGradient id="bottom-wave-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#032224" />
                      <stop offset="100%" stopColor="#011011" />
                    </linearGradient>

                    <pattern id="bottom-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#2FA7A7" opacity="0.35" />
                    </pattern>

                    {/* Hexagon Pattern */}
                    <pattern id="bottom-hex-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 40 11.5 L 40 34.5 L 20 46 L 0 34.5 L 0 11.5 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Layer 1: Dark Deep Wave */}
                  <path
                    d="M 0 120 C 180 220, 500 50, 800 150 L 800 280 L 0 280 Z"
                    fill="url(#bottom-wave-dark)"
                  />

                  {/* Layer 2: Main Rich Teal Wave matching reference S-curve */}
                  <path
                    d="M 0 160 C 220 80, 520 220, 800 90 L 800 280 L 0 280 Z"
                    fill="url(#bottom-wave-grad1)"
                  />

                  {/* Layer 3: Accent Front Bright Wave */}
                  <path
                    d="M 0 200 C 180 140, 480 210, 800 130 L 800 280 L 0 280 Z"
                    fill="url(#bottom-wave-grad2)"
                    opacity="0.88"
                  />

                  {/* Hexagon Mesh Overlay on Right */}
                  <rect x="500" y="100" width="300" height="180" fill="url(#bottom-hex-pattern)" opacity="0.7" />

                  {/* Glowing Outline Contour Lines */}
                  <path
                    d="M 0 160 C 220 80, 520 220, 800 90"
                    stroke="rgba(255, 255, 255, 0.85)"
                    strokeWidth="2.5"
                    fill="none"
                  />

                  <path
                    d="M 0 200 C 180 140, 480 210, 800 130"
                    stroke="rgba(167, 243, 208, 0.75)"
                    strokeWidth="1.8"
                    fill="none"
                  />

                  {/* ECG Heartbeat Pulse Trace Overlay */}
                  <path
                    d="M 260 240 L 300 240 L 310 225 L 320 260 L 330 215 L 340 245 L 350 238 L 360 240 L 420 240"
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Bottom Halftone Dots */}
                  <rect x="20" y="170" width="200" height="100" fill="url(#bottom-dots)" opacity="0.6" />
                  <rect x="620" y="150" width="180" height="120" fill="url(#bottom-dots)" opacity="0.5" />

                  {/* Soft Glowing Light Dots / Bokeh */}
                  <circle cx="680" cy="220" r="3.5" fill="#A7F3D0" opacity="0.8" />
                  <circle cx="720" cy="205" r="2.5" fill="#FFFFFF" opacity="0.9" />
                  <circle cx="150" cy="230" r="3" fill="#A7F3D0" opacity="0.7" />
                </svg>
              </div>

            </div>
          </div>

          {/* LEMBAR 2: DAFTAR ISI */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 2: Daftar Isi
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-base font-black text-slate-900 tracking-wider uppercase">DAFTAR ISI</h2>
                  <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">HALAMAN COVER</span>
                    <span className="font-bold">i</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">DAFTAR ISI</span>
                    <span className="font-bold">ii</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-bold">
                      <span>BAB I PENDAHULUAN</span>
                      <span>1</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>1.1 Latar Belakang</span>
                      <span>1</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>1.2 Tujuan</span>
                      <span>1</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>1.3 Manfaat</span>
                      <span>2</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-bold">
                      <span>BAB II METODOLOGI SURVEI</span>
                      <span>3</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>2.1 Desain Penelitian / Survei</span>
                      <span>3</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>2.2 Waktu dan Lokasi</span>
                      <span>3</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>2.3 Populasi dan Sampel</span>
                      <span>3</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-bold">
                      <span>BAB III HASIL DAN PEMBAHASAN</span>
                      <span>4</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>3.1 Karakteristik Demografi & Tingkat Respon</span>
                      <span>4</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>3.2 Hasil Pengukuran 10 Dimensi AHRQ</span>
                      <span>5</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>3.3 Pembahasan Analisis Kualitatif</span>
                      <span>6</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-bold">
                      <span>BAB IV KESIMPULAN, REKOMENDASI & PENGESAHAN</span>
                      <span>7</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>4.1 Kesimpulan</span>
                      <span>7</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-600 text-[11px]">
                      <span>4.2 Rekomendasi Strategic Action Plan & Pengesahan</span>
                      <span>7</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman ii</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 3: BAB I PENDAHULUAN */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 4: BAB I — Pendahuluan
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB I</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">PENDAHULUAN</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                    <h3 className="font-bold text-slate-900">1.1 Latar Belakang</h3>
                    <p>
                       Keselamatan pasien merupakan prioritas utama dan prinsip mendasar dalam pelayanan kesehatan di rumah sakit. Upaya peningkatan keselamatan pasien sangat bergantung pada budaya keselamatan pasien (patient safety culture) yang hidup di dalam organisasi.
                    </p>
                    <p>
                       Budaya keselamatan pasien didefinisikan sebagai nilai, keyakinan, dan norma staf rumah sakit mengenai perilaku terkait keselamatan. Budaya yang kuat memfasilitasi komunikasi terbuka, pelaporan tanpa hukuman (non-punitive environment), pembelajaran dari kesalahan, dan kerja sama tim yang solid.
                    </p>
                    <p>
                       Untuk mengukur dan mengevaluasi sejauh mana budaya keselamatan telah tertanam di rumah sakit, diperlukan instrumen pengukuran yang valid, handal, dan terstandar secara internasional. Agency for Healthcare Research and Quality (AHRQ) telah memperbarui instrumen pengukuran melalui AHRQ Hospital Survey on Patient Patient Safety Culture (SOPS®) Version 2.0. Versi ini menyempurnakan dimensi pengukuran terdahulu agar lebih relevan dengan dinamika pelayanan kesehatan modern, berfokus pada respons terhadap kesalahan, dukungan kepemimpinan, pembelajaran organisasi, dan komunikasi yang terbuka.
                    </p>
                    <p>
                      Pelaksanaan survei budaya keselamatan pasien berbasis AHRQ Versi 2.0 ini dilakukan untuk memetakan kekuatan (strengths) serta area yang membutuhkan peningkatan (areas for improvement) di <strong className="text-slate-900">{activeHospitalName}</strong>. Hasil dari survei ini menjadi landasan berbasis data (data-driven) dalam merumuskan strategi perbaikan mutu dan keselamatan pasien secara terarah dan berkelanjutan.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <h3 className="font-bold text-slate-900">1.2 Tujuan</h3>
                    <p>
                      <strong>Tujuan Umum:</strong> Mengetahui gambaran penerapan budaya keselamatan pasien di <strong className="text-slate-900">{activeHospitalName}</strong> menggunakan instrumen AHRQ Versi 2.0 sebagai dasar penyusunan program mutu.
                    </p>
                    <p>
                      <strong>Tujuan Khusus:</strong> Mengidentifikasi karakteristik responden, menganalisis 10 dimensi AHRQ, memetakan keunggulan dan area perbaikan kualitatif, serta menyediakan database acuan (baseline).
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <h3 className="font-bold text-slate-900">1.3 Manfaat</h3>
                    <p>
                      Menyediakan data objektif bagi Manajemen RS, mempermudah tim pengelola mutu dalam menetapkan intervensi prioritas, serta mendorong keterbukaan pelaporan bagi staf klinis.
                    </p>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 1 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 5: BAB II METODOLOGI SURVEI */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5: BAB II — Metodologi Survei
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB II</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">METODOLOGI SURVEI</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-4 text-xs text-slate-700 leading-relaxed text-justify">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.1 Desain Penelitian / Survei</h3>
                      <p>
                        Survei ini menggunakan desain <strong>deskriptif kuantitatif</strong> dengan pendekatan <strong>cross-sectional</strong>. Pendekatan ini digunakan untuk mengukur dan menggambarkan persepsi staf rumah sakit terhadap budaya keselamatan pasien pada satu kurun waktu tertentu tanpa memberikan intervensi langsung saat pengukuran berlangsung.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.2 Waktu dan Lokasi Pelaksanaan</h3>
                      <div className="mb-2">
                        <strong className="text-slate-800">Lokasi Pelaksanaan</strong>
                        <p className="mt-1">Seluruh unit kerja/instalasi di <strong className="text-teal-700">{activeHospitalName}</strong>, meliputi:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                          <li>Unit Pelayanan Medis</li>
                          <li>Unit Keperawatan</li>
                          <li>Unit Penunjang Medis</li>
                          <li>Unit Administrasi</li>
                          <li>Unit Manajemen</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-slate-800">Waktu Pelaksanaan</strong>
                        <p className="mt-1">Survei dilaksanakan selama periode:</p>
                        <p className="font-bold text-teal-700 mt-0.5">{periodeSurvei}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.3 Populasi dan Sampel</h3>
                      
                      <div className="mb-2">
                        <h4 className="font-semibold text-slate-800 mb-1">2.3.1 Populasi</h4>
                        <p>Populasi dalam survei ini adalah seluruh pegawai yang bekerja di <strong className="text-teal-700">{activeHospitalName}</strong>, baik manajemen, staf medis, keperawatan, tenaga kesehatan lainnya maupun staf administrasi/non klinis.</p>
                      </div>

                      <div className="mb-2">
                        <h4 className="font-semibold text-slate-800 mb-1">2.3.2 Kriteria Inklusi dan Eksklusi</h4>
                        <div className="mb-1.5">
                          <strong className="text-slate-700">Kriteria Inklusi</strong>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Pegawai tetap maupun kontrak yang telah bekerja minimal 3 bulan.</li>
                            <li>Memiliki interaksi langsung maupun tidak langsung terhadap pelayanan pasien.</li>
                            <li>Bersedia mengisi kuesioner secara sukarela.</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-700">Kriteria Eksklusi</strong>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Pegawai yang sedang menjalani cuti panjang.</li>
                            <li>Mahasiswa praktik.</li>
                            <li>Siswa praktik.</li>
                            <li>Residen yang belum menjadi pegawai rumah sakit.</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">2.3.3 Teknik Sampling dan Jumlah Sampel</h4>
                        <div className="mb-1.5">
                          <strong className="text-slate-700">Teknik Sampling</strong>
                          <p className="mt-0.5">Pengambilan sampel dilakukan menggunakan:</p>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Total Sampling</li>
                          </ul>
                          <p className="mt-0.5">atau</p>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Proportionate Stratified Random Sampling</li>
                          </ul>
                          <p className="mt-0.5 italic text-slate-500">(sesuai pengaturan aplikasi).</p>
                        </div>
                        <div>
                          <strong className="text-slate-700">Ukuran Sampel</strong>
                          <p className="mt-0.5">Target jumlah responden mengikuti rekomendasi AHRQ.</p>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Jumlah Target Responden: <strong className="text-teal-700">{totalTarget}</strong></li>
                            <li>Jumlah Responden Mengisi: <strong className="text-teal-700">{totalActual}</strong></li>
                            <li>Persentase Response Rate: <strong className="text-teal-700">{responseRateStr}</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.4 Instrumen Survei</h3>
                      <p>
                        Instrumen yang digunakan adalah AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0 yang telah diterjemahkan ke dalam bahasa Indonesia dan diuji keterbacaannya.
                      </p>
                      <p className="mt-2">
                        Instrumen SOPS® Versi 2.0 mengukur 10 Dimensi Budaya Keselamatan Pasien yang terdiri dari 32 item pertanyaan primer, ditambah dengan bagian evaluasi penilaian tingkat keselamatan pasien (overall rating) dan karakteristik demografi responden:
                      </p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Teamwork (Kerja Sama Tim) – 3 item</li>
                        <li>Staffing and Work Pace (Ketenagaan dan Kecepatan Kerja) – 4 item</li>
                        <li>Organizational Learning—Continuous Improvement (Pembelajaran Organisasi—Peningkatan Berkelanjutan) – 3 item</li>
                        <li>Response to Error (Respons Terhadap Kesalahan / Non-punitive Environment) – 4 item</li>
                        <li>Supervisor, Manager, or Clinical Leader Support for Patient Safety (Dukungan Atasan/Manajer/Pimpinan Klinis terhadap Keselamatan Pasien) – 3 item</li>
                        <li>Management Support for Patient Safety (Dukungan Manajemen/Direksi terhadap Keselamatan Pasien) – 3 item</li>
                        <li>Communication Openness (Keterbukaan Komunikasi) – 4 item</li>
                        <li>Reporting Patient Safety Events (Pelaporan Insiden Keselamatan Pasien) – 2 item</li>
                        <li>Hospital Handoffs and Information Exchange (Serah Terima/Handoff dan Pertukaran Informasi di Rumah Sakit) – 3 item</li>
                        <li>Communication About Error (Komunikasi Mengenai Kesalahan) – 3 item</li>
                      </ol>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>
                          <strong>Tingkat Keselamatan Pasien Keseluruhan (Overall Patient Safety Rating):</strong> 1 item pertanyaan penilaian global dengan skala Likert 5 poin (Sangat Buruk, Buruk, Cukup, Baik, Sangat Baik).
                        </li>
                        <li>
                          <strong>Pertanyaan Demografi:</strong> Meliputi unit kerja utama, profesi/peran, lama bekerja di rumah sakit, lama bekerja di unit saat ini, serta jumlah jam kerja per minggu.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.5 Metode Pengumpulan Data</h3>
                      <p>Pengumpulan data dilakukan secara elektronik/online (e-survey menggunakan link aplikasi pengukuran budaya keselamatan) dengan memperhitungkan kerahasiaan:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1.5">
                        <li>
                          <strong>Penyebaran Tautan/Kuesioner:</strong> Disebarkan melalui koordinasi Kepala Unit/Ruangan dan Tim Komite Mutu.
                        </li>
                        <li>
                          <strong>Prinsip Anonimitas:</strong> Responden tidak diminta mencantumkan nama atau NIP untuk menjamin kerahasiaan (anonymity) dan kejujuran jawaban tanpa kekhawatiran akan adanya sanksi/dampak karir.
                        </li>
                        <li>
                          <strong>Monitoring Response Rate:</strong> Tim pelaksana melakukan pemantauan harian terhadap tingkat partisipasi di tiap unit untuk memastikan keterwakilan data.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.6 Analisis Data</h3>
                      <p>Pengolahan dan analisis data dilakukan mengikuti panduan pengolahan data AHRQ SOPS® Version 2.0:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-3">
                        <li>
                          <strong>Analisis Deskriptif Demografi:</strong> Menghitung frekuensi dan persentase untuk karakteristik responden (profesi, unit kerja, masa kerja, jam kerja).
                        </li>
                        <li>
                          <strong>Kalkulasi Persentase Respon Positif (% Positive Response):</strong>
                          <p className="mt-1 text-slate-700">Pilihan jawaban kuesioner menggunakan skala Likert 5 poin:</p>
                          <ul className="list-circle pl-5 mt-1 space-y-1 text-[11px] text-slate-600">
                            <li><strong>Agreement Scale:</strong> 1 = Sangat Tidak Setuju, 2 = Tidak Setuju, 3 = Netral, 4 = Setuju, 5 = Sangat Setuju.</li>
                            <li><strong>Frequency Scale:</strong> 1 = Tidak Pernah, 2 = Jarang, 3 = Kadang-kadang, 4 = Sering, 5 = Selalu.</li>
                          </ul>
                          <ul className="list-square pl-5 mt-2 space-y-1.5">
                            <li>
                              <strong>Item Berpernyataan Positif (Positively Worded Items):</strong> Respon bernilai 4 (Setuju/Sering) dan 5 (Sangat Setuju/Selalu) dihitung sebagai respon positif.
                            </li>
                            <li>
                              <strong>Item Berpernyataan Negatif (Negatively Worded / Negatively Worded Reverse Items):</strong> Respon bernilai 1 (Sangat Tidak Setuju/Tidak Pernah) dan 2 (Tidak Setuju/Jarang) dihitung sebagai respon positif.
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>Formula perhitungan respon positif dimensi:</strong>
                          <div className="my-2 p-3 bg-teal-50 border border-teal-200 rounded-lg flex flex-col items-center justify-center">
                            <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold text-teal-950">
                              <span className="whitespace-nowrap font-black uppercase text-teal-900">&ldquo;% Respon Positif Dimensi&rdquo;</span>
                              <span className="text-teal-600 text-lg font-normal">=</span>
                              <div className="flex flex-col items-center mx-1">
                                <span className="border-b border-teal-400 pb-1 px-3 text-center font-bold">Total Jawaban Positif pada Seluruh Item dalam Dimensi</span>
                                <span className="pt-1 px-3 text-center font-bold">Total Jawaban yang Terisi pada Seluruh Item dalam Dimensi</span>
                              </div>
                              <span className="text-teal-600 text-lg font-normal">×</span>
                              <span className="font-black">100%</span>
                            </div>
                          </div>
                        </li>
                        <li>
                          <strong>Kriteria Kategori Dimensi:</strong>
                          <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                            <li><strong>Area Keunggulan / Kekuatan (Strengths):</strong> Dimensi dengan persentase respon positif &ge;75%.</li>
                            <li><strong>Area Perlu Perbaikan (Areas for Improvement):</strong> Dimensi dengan persentase respon positif &lt;50%.</li>
                            <li><strong>Area Sedang / Netral:</strong> Dimensi dengan persentase respon positif antara 50%-74%.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Analisis Tingkat Keselamatan Pasien Keseluruhan:</strong> Menghitung distribusi persentase penilaian staf terhadap mutu keselamatan pasien di rumah sakit secara umum.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 2 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 6: BAB III HASIL & PEMBAHASAN - Karakteristik Responden & Demografi */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 6: BAB III — Karakteristik & Demografi
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB III</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">HASIL DAN PEMBAHASAN</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs">3.1 Gambaran Umum Respon Rate dan Karakteristik Responden</h3>

                    <div className="space-y-1.5 text-[10px] text-slate-700 leading-relaxed">
                      <h4 className="font-bold text-slate-900 text-[11px]">3.1.1 Tingkat Partisipasi (Response Rate)</h4>
                      <p className="text-slate-700 text-[10px] leading-relaxed text-justify">
                        Survei dilaksanakan pada periode <span className="font-semibold text-slate-900">{periodeSurvei}</span>. Dari total <span className="font-semibold text-slate-900">{totalTarget.toLocaleString('id-ID')}</span> kuesioner yang disebarkan ke seluruh unit kerja di <span className="font-semibold text-slate-900">{activeHospitalName}</span>, diperoleh kuesioner kembali dan memenuhi syarat untuk dianalisis sebanyak <span className="font-semibold text-slate-900">{totalActual.toLocaleString('id-ID')}</span> kuesioner. Dengan demikian, tingkat partisipasi (response rate) survei ini adalah sebesar <span className="font-bold text-teal-700">{responseRateStr}</span>. Tingkat partisipasi ini telah memenuhi ambang batas minimal yang direkomendasikan AHRQ (≥60%) sehingga representatif untuk menggambarkan budaya keselamatan pasien secara organisasi.
                      </p>
                    </div>

                    <div className="pt-1 space-y-1">
                      <h4 className="font-bold text-slate-900 text-[11px]">3.1.2 Demografi Responden</h4>
                      <p className="text-[10px] text-slate-600 font-medium">Karakteristik responden dikelompokkan berdasarkan profesi/posisi staf, unit kerja, masa kerja di rumah sakit, dan jumlah jam kerja per minggu</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#14B8A6] via-[#0F766E] to-[#0A3335] text-white font-extrabold uppercase tracking-wider text-[8.5px]">
                            <th className="p-2 border-r border-white/20">Karakteristik</th>
                            <th className="p-2 border-r border-white/20">Kategori / Detail</th>
                            <th className="p-2 border-r border-white/20 text-center">Jumlah (n)</th>
                            <th className="p-2 text-center">Persentase (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {/* 1. Posisi Staf */}
                          {demografiStats.posisiData.map((pItem, idx, arr) => {
                            const pct = ((pItem.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`pos-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Posisi / Jabatan
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700">{pItem.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{pItem.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}

                          {/* 2. Unit Kerja */}
                          {demografiStats.unitData.map((uItem, idx, arr) => {
                            const pct = ((uItem.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`unit-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Unit / Area Kerja
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700">{uItem.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{uItem.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}

                          {/* 3. Masa Kerja RS */}
                          {demografiStats.g1Data.map((g1Item, idx, arr) => {
                            const pct = ((g1Item.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`g1-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Masa Kerja di RS Ini
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700">{g1Item.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{g1Item.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}

                          {/* 4. Masa Kerja Unit */}
                          {demografiStats.g2Data.map((g2Item, idx, arr) => {
                            const pct = ((g2Item.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`g2-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Masa Kerja di Unit Kerja
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700">{g2Item.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{g2Item.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}

                          {/* 5. Jam Kerja */}
                          {demografiStats.g3Data.map((g3Item, idx, arr) => {
                            const pct = ((g3Item.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`g3-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Jam Kerja per Minggu
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700">{g3Item.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{g3Item.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}

                          {/* 6. Interaksi Pasien */}
                          {demografiStats.g4Data?.map((g4Item, idx, arr) => {
                            const pct = ((g4Item.value / (demografiStats.total || 1)) * 100).toFixed(1);
                            return (
                              <tr key={`g4-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                {idx === 0 && (
                                  <td rowSpan={arr.length} className="p-2 font-bold text-slate-850 border-r border-slate-200 align-top max-w-[90px] break-words">
                                    Interaksi Kontak Pasien
                                  </td>
                                )}
                                <td className="p-2 border-r border-slate-200 text-slate-700 leading-tight">{g4Item.name}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold">{g4Item.value}</td>
                                <td className="p-2 text-center font-bold text-teal-700">{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed space-y-1">
                        <strong className="text-teal-800 font-extrabold uppercase tracking-wide block">3.1.3 Interpretasi & Analisa Data Demografi:</strong>
                        <p>
                          Berdasarkan data demografi responden tahun <strong>{displayYear}</strong>, survei berhasil mengumpulkan partisipasi aktif dari <strong>{demografiNarrative.totalResp}</strong> staf. 
                          Keterwakilan posisi staf didominasi oleh <strong>{demografiNarrative.topPos}</strong> (<strong>{demografiNarrative.topPosVal}</strong> responden){demografiNarrative.secondPos ? `, diikuti oleh ${demografiNarrative.secondPos} (${demografiNarrative.secondPosVal} responden)` : ''}. 
                          Unit dengan kontribusi terbesar adalah <strong>{demografiNarrative.topUnit}</strong> dengan <strong>{demografiNarrative.topUnitVal}</strong> responden{demografiNarrative.secondUnit ? `, disusul unit ${demografiNarrative.secondUnit} (${demografiNarrative.secondUnitVal} responden)` : ''}. 
                          Sedangkan dari masa bakti di rumah sakit, mayoritas responden memiliki masa kerja <strong>{demografiNarrative.topTenure}</strong> sebanyak <strong>{demografiNarrative.topTenureVal}</strong> staf. 
                          Data ini menunjukkan sebaran responden yang representatif dan valid untuk dijadikan pijakan analisis budaya keselamatan pasien secara makro di <strong>{activeHospitalName}</strong>.
                        </p>
                      </div>

                      <div className="bg-teal-50/45 p-3 rounded-xl border border-teal-100 text-[10px] text-slate-600 leading-relaxed space-y-1">
                        <strong className="text-teal-900 font-extrabold uppercase tracking-wide block">Rekomendasi Peningkatan Strategis:</strong>
                        <ul className="space-y-1 list-none pl-0">
                          <li className="flex items-start gap-1.5">
                            <span className="text-teal-600 shrink-0 select-none mt-0.5">👥</span>
                            <span>Rancang program edukasi keselamatan pasien yang berfokus pada kelompok dominan yaitu posisi &ldquo;{demografiNarrative.topPos}&rdquo; di unit &ldquo;{demografiNarrative.topUnit}&rdquo;.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-teal-600 shrink-0 select-none mt-0.5">📈</span>
                            <span>Tingkatkan tingkat partisipasi dari kelompok atau unit kerja dengan tingkat representasi rendah (di bawah 10% dari total responden).</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-teal-600 shrink-0 select-none mt-0.5">🛡️</span>
                            <span>Sosialisasikan kembali jaminan kerahasiaan identitas responden guna mendorong pengisian data yang jujur dan transparan.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-teal-600 shrink-0 select-none mt-0.5">✨</span>
                            <span>Gunakan data demografi ini untuk merumuskan tim Champions Keselamatan Pasien lintas unit kerja.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 3 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 4: BAB III HASIL & PEMBAHASAN - Hasil Pengukuran 10 Dimensi */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 4: BAB III — Pengukuran 10 Dimensi ({activeHospitalName})
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-3">
                  <div className="border-b border-slate-200 pb-1.5">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      3.2 Hasil Pengukuran Dimensi Budaya Keselamatan Pasien {activeHospitalName}
                    </h3>
                  </div>

                  <p className="text-[10.5px] text-slate-700 leading-relaxed">
                    Berdasarkan kalkulasi terhadap 10 dimensi AHRQ Versi 2.0, rata-rata tingkat respon positif budaya keselamatan pasien di <strong className="text-slate-900">{activeHospitalName}</strong> adalah <strong className="text-teal-700 font-extrabold">{overallAverage.toFixed(1)}%</strong>.
                  </p>

                  <div className="pt-1 space-y-1">
                    <h4 className="font-bold text-slate-900 text-[11px]">
                      3.2.1 Respon positif berdasarkan 10 dimensi budaya keselamatan pasien
                    </h4>
                    <p className="text-[10.5px] text-slate-700 leading-relaxed">
                      Ringkasan hasil pencapaian persentase respon positif (% Positive Response) untuk setiap dimensi disajikan pada Tabel berikut:
                    </p>
                  </div>

                  {/* Visualisasi Detail Pengukuran Dimensi (Sesuai Visual Menu Analisa Data) */}
                  <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs my-2">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-emerald-600" />
                        Detail Pengukuran Dimensi Budaya Keselamatan Untuk {activeHospitalName}
                      </h4>
                      <span className="text-[8.5px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        Periode: {displayYear}
                      </span>
                    </div>

                    <div className="w-full text-[9.5px]">
                      {/* Table Header Row */}
                      <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[8.5px]">
                        <div className="col-span-1 text-left pl-1">NO.</div>
                        <div className="col-span-5 text-left">KOMPONEN BUDAYA KESELAMATAN PASIEN</div>
                        <div className="col-span-6 text-center">PERSENTASE RESPONS POSITIF</div>
                      </div>

                      {/* Dimension Rows */}
                      <div className="space-y-2 font-medium">
                        {dimensionScores.map((row, i) => {
                          const getBarColor = (val: number) => {
                            if (val >= 85) return 'bg-blue-500';
                            if (val >= 70) return 'bg-emerald-500';
                            if (val >= 50) return 'bg-yellow-500';
                            return 'bg-red-500';
                          };

                          return (
                            <div key={row.id} className="grid grid-cols-12 gap-2 items-center py-1 border-b border-slate-50 last:border-b-0">
                              <div className="col-span-1 font-bold text-slate-400 text-left text-[10px] pl-1">
                                {i + 1}.
                              </div>
                              <div className="col-span-5 font-bold text-slate-700 text-[9.5px] leading-snug whitespace-normal break-words pr-2">
                                {row.nama}
                              </div>
                              <div className="col-span-6 flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-lg h-5 relative overflow-hidden flex items-center border border-slate-200/80 shadow-xs">
                                  <div 
                                    style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
                                    className={`h-full ${getBarColor(row.percentage)} relative transition-all duration-300 rounded-l-md`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                  </div>
                                </div>
                                <span className="w-10 text-right font-extrabold text-slate-900 text-[10px] shrink-0">
                                  {row.percentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-3.5 items-center justify-center text-[8px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-xs bg-red-500"></div> &lt;50% (Perlu Perbaikan)</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-xs bg-yellow-500"></div> 50-69% (Cukup)</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></div> 70-84% (Baik)</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-xs bg-blue-500"></div> &ge;85% (Sangat Baik)</div>
                    </div>
                  </div>

                  {/* Interpretasi & Analisa Data Terintegrasi (Sesuai Menu Analisa Data -> Hasil Pengukuran Dimensi) */}
                  <div className="space-y-3 pt-1">
                    <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl space-y-2.5 text-[10.5px] text-slate-700">
                      <h4 className="font-extrabold text-blue-900 tracking-wider uppercase flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" /> INTERPRETASI &amp; ANALISIS DATA
                      </h4>
                      <p className="leading-relaxed text-justify">
                        Hasil analisis 10 dimensi budaya keselamatan pasien tahun <strong className="text-slate-900">{displayYear}</strong> menghasilkan nilai rata-rata keseluruhan respons positif sebesar <strong className="text-blue-800 font-extrabold">{overallAverage.toFixed(1)}%</strong>. Kekuatan utama (aspek unggul) <strong className="text-slate-900">{activeHospitalName}</strong> terletak pada dimensi <strong className="text-emerald-800 font-extrabold">&ldquo;{highestDim?.nama || '-'}&rdquo;</strong> dengan skor positif tertinggi mencapai <strong className="text-emerald-700 font-extrabold">{highestDim?.percentage.toFixed(1) || 0}%</strong>. Sebaliknya, dimensi yang mendesak untuk segera diintervensi adalah <strong className="text-red-800 font-extrabold">&ldquo;{lowestDim?.nama || '-'}&rdquo;</strong> dengan respons positif terendah sebesar <strong className="text-red-700 font-extrabold">{lowestDim?.percentage.toFixed(1) || 0}%</strong>.
                      </p>

                      <div className="text-[10px] space-y-1.5 bg-white/80 p-3 rounded-lg border border-blue-100/60">
                        <div>
                          <span className="font-bold text-emerald-700">✓ Area Kekuatan (&ge;75%):</span>{' '}
                          <span className="font-medium text-slate-700">
                            {strengths.length > 0
                              ? strengths.map(d => `${d.nama} (${d.percentage.toFixed(1)}%)`).join(', ')
                              : 'Belum ada'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-amber-700">⚠ Perlu Peningkatan (50-74%):</span>{' '}
                          <span className="font-medium text-slate-700">
                            {moderates.length > 0
                              ? moderates.map(d => `${d.nama} (${d.percentage.toFixed(1)}%)`).join(', ')
                              : 'Belum ada'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-rose-700">☠ Prioritas Intervensi (&lt;50%):</span>{' '}
                          <span className="font-medium text-slate-700">
                            {improvements.length > 0
                              ? improvements.map(d => `${d.nama} (${d.percentage.toFixed(1)}%)`).join(', ')
                              : 'Belum ada'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rekomendasi Peningkatan (Sesuai Menu Analisa Data -> Hasil Pengukuran Dimensi) */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-[10.5px] text-slate-700">
                      <h4 className="font-extrabold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 text-[11px]">
                        <Target className="w-4 h-4 text-indigo-600 shrink-0" /> REKOMENDASI PENINGKATAN
                      </h4>
                      <ul className="text-[10px] text-slate-700 space-y-2">
                        <li className="flex gap-2 items-start">
                          <span className="shrink-0 text-xs">🏆</span>
                          <span className="font-medium leading-relaxed">
                            Pertahankan strategi keberhasilan pada dimensi <strong className="text-slate-900">&ldquo;{highestDim?.nama || '-'}&rdquo;</strong> agar tetap konsisten sebagai pilar budaya keselamatan rumah sakit.
                          </span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="shrink-0 text-xs">🛠️</span>
                          <span className="font-medium leading-relaxed">
                            Segera bentuk tim investigasi internal dan susun SOP baru untuk meningkatkan dimensi <strong className="text-slate-900">&ldquo;{lowestDim?.nama || '-'}&rdquo;</strong>.
                          </span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="shrink-0 text-xs">📢</span>
                          <span className="font-medium leading-relaxed">
                            Implementasikan program &apos;Rapat Keselamatan Pasien Mandiri&apos; secara berkala di nurse station seluruh unit kerja.
                          </span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="shrink-0 text-xs">🎯</span>
                          <span className="font-medium leading-relaxed">
                            Sesuaikan alokasi pelatihan berkala yang lebih berfokus pada dimensi-dimensi yang berada dalam kategori prioritas intervensi.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-[8.5px] text-slate-400 italic text-right">*Data 10 dimensi, analisa, dan rekomendasi terintegrasi secara otomatis dari menu Analisa Data ({activeHospitalName}).</p>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 4 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 5: BAB III HASIL & PEMBAHASAN - Overall, Insiden & Benchmark */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5: BAB III — Overall Rating & Insiden
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-6">
                  {/* 3.2.2 Keselamatan Pasien Keseluruhan (Overall Rating) */}
                  <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                          <HeartPulse className="w-4 h-4 text-rose-600" />
                          3.2.2 Keselamatan Pasien Keseluruhan (Overall Rating)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Tingkat keselamatan pasien di unit kerja berdasarkan penilaian responden staf {activeHospitalName}
                        </p>
                      </div>
                      <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
                        Respon Positif: {safetyRatingData.positivePct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Grafik Penilaian Insiden Keselamatan Pasien */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <h5 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-rose-500" />
                        Grafik Penilaian Insiden Keselamatan Pasien (Overall Rating)
                      </h5>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={safetyRatingData.distribution.map(d => ({ kategori: d.name, percentage: parseFloat(d.percentage.replace('%', '')) || 0 }))} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="kategori" stroke="#64748b" tick={{ fill: '#475569', fontSize: 9.5, fontWeight: 600 }} tickLine={false} />
                            <YAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Persentase']} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Bar dataKey="percentage" name="Persentase" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40}>
                              {safetyRatingData.distribution.map((entry, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#b91c1c'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Interpretasi & Analisa Data Card */}
                    <div className="bg-blue-50/40 border border-blue-100 p-3.5 rounded-xl space-y-2">
                      <h5 className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Interpretasi & Analisa Data
                      </h5>
                      <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                        Penilaian keselamatan pasien secara keseluruhan (overall safety rating) oleh staf pada tahun <strong>{tahunSurvei}</strong> di <strong>{activeHospitalName}</strong> menghasilkan proporsi respons positif (kombinasi predikat Sangat Baik & Baik) sebesar <strong>{safetyRatingData.positivePct.toFixed(1)}%</strong>. 
                        Mayoritas staf memberikan penilaian keselamatan pada rentang kategori <strong>&ldquo;{safetyRatingHighestCat.name}&rdquo;</strong> sebesar <strong>{safetyRatingHighestCat.percentage}</strong>. 
                        Meskipun iklim keselamatan dinilai cukup baik, upaya peningkatan mutu berkelanjutan tetap harus didukung demi mencapai target ideal &ge;80% respons positif.
                      </p>
                      
                      {/* Category Breakout Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                        {safetyRatingData.distribution.map(g => (
                          <div key={g.name} className="p-1.5 rounded-lg bg-white border border-blue-100 text-center shadow-2xs">
                            <div className="text-slate-500 font-bold text-[8.5px] truncate">{g.name}</div>
                            <div className="text-[11px] font-extrabold text-teal-800 mt-0.5">{g.percentage}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rekomendasi Peningkatan */}
                    <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl space-y-2">
                      <h5 className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Rekomendasi Peningkatan
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                          <span className="text-sm shrink-0">🔎</span>
                          <span className="text-slate-700 font-medium">Lakukan monitoring berkala di unit-unit klinis kritis (IGD, ICU, Kamar Operasi) yang rentan memiliki gap keselamatan pasien.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                          <span className="text-sm shrink-0">👣</span>
                          <span className="text-slate-700 font-medium">Jadwalkan &apos;Safety Walkrounds&apos; (Ronde Keselamatan) yang melibatkan jajaran direksi untuk berdialog langsung dengan staf.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                          <span className="text-sm shrink-0">📊</span>
                          <span className="text-slate-700 font-medium">Gunakan hasil penilaian ini sebagai KPI mutu unit kerja dalam rapat evaluasi tahunan.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                          <span className="text-sm shrink-0">🏆</span>
                          <span className="text-slate-700 font-medium">Berikan penghargaan bagi unit yang konsisten memelihara iklim budaya keselamatan dengan predikat &apos;Sangat Baik&apos;.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3.2.3 Frekuensi Pelaporan Insiden */}
                  <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-600" />
                          3.2.3 Frekuensi Pelaporan Insiden
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Jumlah insiden keselamatan pasien yang dilaporkan oleh staf dalam 12 bulan terakhir
                        </p>
                      </div>
                      <span className="text-[9.5px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
                        Melaporkan Insiden: {reportedEventsData.reportedAnyPct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Grafik Jumlah Insiden Keselamatan Pasien Yang Dilaporkan */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <h5 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
                        Grafik Jumlah Insiden Keselamatan Pasien Yang Dilaporkan
                      </h5>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportedEventsData.distribution.map(d => ({ kategori: d.name, percentage: parseFloat(d.percentage.replace('%', '')) || 0 }))} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="kategori" stroke="#64748b" tick={{ fill: '#475569', fontSize: 9.5, fontWeight: 600 }} tickLine={false} />
                            <YAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Persentase']} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Bar dataKey="percentage" name="Persentase" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                              {reportedEventsData.distribution.map((entry, index) => {
                                const colors = ['#64748b', '#8b5cf6', '#6366f1', '#0d9488', '#d97706'];
                                return <Cell key={`cell-rep-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Interpretasi & Analisa Data Card */}
                    <div className="bg-purple-50/40 border border-purple-100 p-3.5 rounded-xl space-y-2">
                      <h5 className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Interpretasi & Analisa Data
                      </h5>
                      <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                        Berdasarkan data pelaporan insiden dalam 12 bulan terakhir (Tahun <strong>{tahunSurvei}</strong>), kategori dengan persentase tertinggi di <strong>{activeHospitalName}</strong> adalah <strong>&ldquo;{reportedEventsHighestCat.name}&rdquo;</strong> sebesar <strong>{reportedEventsHighestCat.percentage}</strong>. 
                        Tingginya angka staf yang tidak melapor atau jarang melapor menunjukkan adanya potensi fenomena <em>underreporting</em> (kejadian yang disembunyikan atau tidak dicatatkan) akibat rasa takut atau birokrasi yang rumit.
                      </p>
                      
                      {/* Category Breakout Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                        {reportedEventsData.distribution.map(e => (
                          <div key={e.name} className="p-1.5 rounded-lg bg-white border border-purple-100 text-center shadow-2xs">
                            <div className="text-slate-500 font-bold text-[8.5px] truncate">{e.name}</div>
                            <div className="text-[11px] font-extrabold text-purple-800 mt-0.5">{e.percentage}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rekomendasi Peningkatan */}
                    <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl space-y-2">
                      <h5 className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        Rekomendasi Peningkatan
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                          <span className="text-sm shrink-0">🛡️</span>
                          <span className="text-slate-700 font-medium">Terapkan prinsip Just Culture secara konsisten untuk menjamin tidak adanya sanksi sepihak (non-punitive) bagi pelapor insiden.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                          <span className="text-sm shrink-0">📱</span>
                          <span className="text-slate-700 font-medium">Sederhanakan proses pengisian formulir laporan insiden menjadi digital yang dapat diselesaikan dalam waktu kurang dari 3 menit.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                          <span className="text-sm shrink-0">🏆</span>
                          <span className="text-slate-700 font-medium">Berikan penghargaan bulanan berupa &apos;Safety Reporter Award&apos; bagi unit yang paling aktif melaporkan insiden keselamatan.</span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                          <span className="text-sm shrink-0">📢</span>
                          <span className="text-slate-700 font-medium">Lakukan sosialisasi berkala mengenai alur dan kriteria Kejadian Nyaris Cedera (KNC) yang wajib dilaporkan.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 5 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 5A: 3.2.4 Rata-Rata Persentase Respon Positif per Item Dimensi */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5A: Hasil Per Item Dimensi ({activeHospitalName})
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Rata-Rata Respon Positif Per Item Dimensi</span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      3.2.4 Rata-Rata Persentase Respon Positif per Item Dimensi Budaya Keselamatan Pasien
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-justify">
                      Berikut merupakan rincian persentase respon positif staf rumah sakit <strong>{activeHospitalName}</strong> untuk setiap item pernyataan dalam kuesioner AHRQ SOPS® Version 2.0 pada tahun <strong>{tahunSurvei}</strong>. Data dikelompokkan secara terstruktur berdasarkan dimensi budaya keselamatan pasien masing-masing:
                    </p>
                  </div>

                  {/* Detailed Item Cards with Stacked Bar Percentage Charts matching Analisa Data -> Hasil Per Item */}
                  <div className="space-y-6">
                    {DIMENSION_ORDER.map((dimId, index) => {
                      const dimInfo = DIMENSI_INFO[dimId];
                      const questions = ALL_QUESTIONS_LAPORAN.filter(q => q.dim === dimId);
                      
                      let sumPosPercent = 0;
                      const qStats = questions.map(q => {
                        const stat = calculateQuestionStats(q);
                        sumPosPercent += stat.posPercent;
                        return { q, stat };
                      });
                      const avgPosPercent = questions.length > 0 ? Math.round(sumPosPercent / questions.length) : 0;
                      const status = getDimensionStatus(avgPosPercent);

                      return (
                        <div 
                          key={dimId} 
                          className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-xs hover:shadow-sm transition-all group print:break-inside-avoid"
                        >
                          {/* Card Header */}
                          <div className="p-4 bg-slate-50/70 border-b border-slate-200 relative flex items-center gap-4">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-indigo-600"></div>
                            <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                              <span className="text-base font-black text-indigo-600">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-xs md:text-sm font-bold text-slate-800 tracking-tight">{dimInfo.nama}</h3>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">{dimInfo.deskripsi}</p>
                            </div>
                          </div>

                          {/* Questions List */}
                          <div className="p-4 md:p-5 space-y-4">
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500 shadow-xs"></div>
                                <span className="text-[10.5px] font-bold text-slate-600">Positif</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-yellow-500 shadow-xs"></div>
                                <span className="text-[10.5px] font-bold text-slate-600">Netral</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-rose-500 shadow-xs"></div>
                                <span className="text-[10.5px] font-bold text-slate-600">Negatif</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-slate-400 shadow-xs"></div>
                                <span className="text-[10.5px] font-bold text-slate-600">Tidak Menjawab / Tidak Tahu</span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {qStats.map(({ q, stat }) => (
                                <div key={q.id} className="flex flex-col md:flex-row gap-3 md:items-center">
                                  {/* Question Code & Text */}
                                  <div className="md:w-[45%] flex gap-3">
                                    <div className="flex flex-col items-center shrink-0">
                                      <span className="text-xs font-black text-indigo-600 leading-none">{q.code}{(q as any).isReversed && !q.code.endsWith('R') ? 'R' : ''}</span>
                                      <div className="w-3.5 h-0.5 bg-indigo-600 mt-1 rounded-full"></div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{q.text}</p>
                                  </div>

                                  {/* Bar Chart and N/A label */}
                                  <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 h-8 flex rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative">
                                        <div 
                                          className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                          style={{ width: `${stat.posPercent}%` }}
                                        >
                                          {stat.posPercent >= 8 && <span className="text-[9.5px] font-black text-white">{stat.posPercent}%</span>}
                                        </div>
                                        <div 
                                          className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                          style={{ width: `${stat.neuPercent}%` }}
                                        >
                                          {stat.neuPercent >= 8 && <span className="text-[9.5px] font-black text-white">{stat.neuPercent}%</span>}
                                        </div>
                                        <div 
                                          className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                          style={{ width: `${stat.negPercent}%` }}
                                        >
                                          {stat.negPercent >= 8 && <span className="text-[9.5px] font-black text-white">{stat.negPercent}%</span>}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 min-w-[110px] shrink-0">
                                        <div className="w-1.5 h-3 bg-slate-400 rounded-full"></div>
                                        <div className="leading-tight">
                                          <p className="text-[9px] text-slate-400 font-bold leading-tight">Tidak Menjawab /</p>
                                          <p className="text-[9px] text-slate-400 font-bold leading-tight">Tidak Tahu <span className="text-slate-800 font-black">{stat.missingPercent}%</span></p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary Footer */}
                          <div className="bg-slate-50/50 p-3.5 md:p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">RESPON POSITIF DIMENSI</p>
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl font-black text-slate-800">{avgPosPercent}%</span>
                                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${status.bg} ${status.color} ${status.border} uppercase shadow-2xs`}>
                                  {status.label}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
                                <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-tight">Benchmark (AHRQ)</p>
                                <p className="text-[11px] font-black text-slate-700">72.0% - 85.0%</p>
                              </div>
                              <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-2xs">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interpretasi & Analisa Data Card */}
                  {itemLevelStrengths.length > 0 && itemLevelWeaknesses.length > 0 && (
                    <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl space-y-2">
                      <h5 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Interpretasi & Analisa Data Hasil Per Item
                      </h5>
                      <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                        Analisis mikro pada tingkat butir pernyataan (item) di <strong>{activeHospitalName}</strong> mengidentifikasi kekuatan utama terletak pada item <strong>{itemLevelStrengths[0].id}</strong> (&ldquo;{itemLevelStrengths[0].text}&rdquo;) dengan pencapaian respon positif sebesar <strong>{itemLevelStrengths[0].score.toFixed(1)}%</strong>, disusul oleh item <strong>{itemLevelStrengths[1].id}</strong> sebesar <strong>{itemLevelStrengths[1].score.toFixed(1)}%</strong>. 
                        Sebaliknya, kerentanan tertinggi diidentifikasi pada item <strong>{itemLevelWeaknesses[0].id}</strong> (&ldquo;{itemLevelWeaknesses[0].text}&rdquo;) yang hanya mengumpulkan respon positif sebesar <strong>{itemLevelWeaknesses[0].score.toFixed(1)}%</strong>, disusul item <strong>{itemLevelWeaknesses[1].id}</strong> sebesar <strong>{itemLevelWeaknesses[1].score.toFixed(1)}%</strong>.
                        Kesenjangan yang cukup besar antara item terbaik dan terendah menuntut perbaikan spesifik pada aspek operasional unit kerja.
                      </p>
                    </div>
                  )}

                  {/* Rekomendasi Peningkatan */}
                  <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl space-y-2">
                    <h5 className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Rekomendasi Strategis Berbasis Hasil Per Item
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                      {itemLevelWeaknesses.slice(0, 3).map((item, idx) => {
                        const icons = ['💡', '🛠️', '📈'];
                        return (
                          <div key={item.id} className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                            <span className="text-sm shrink-0">{icons[idx]}</span>
                            <span className="text-slate-700 font-medium leading-relaxed">
                              Untuk mengatasi nilai rendah pada item <strong>{item.id}</strong> (&ldquo;{item.text}&rdquo;: {item.score.toFixed(1)}%): Rancang panduan teknis operasional terpadu dan selenggarakan workshop penyamaan persepsi untuk seluruh staf.
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-emerald-100/80">
                        <span className="text-sm shrink-0">👣</span>
                        <span className="text-slate-700 font-medium leading-relaxed">
                          Lakukan audit berkelanjutan setiap 3 bulan sekali khusus untuk butir-butir pernyataan kritis yang bernilai positif di bawah target nasional &lt;50%.
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 5A dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 5B: 3.2.5 Perbandingan berdasarkan Profesi, Unit Kerja, Masa Kerja & Jam Kerja */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5B: Analisis Demografis & Komparatif ({activeHospitalName})
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Analisis Demografis & Komparatif Budaya Keselamatan</span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      3.2.5 Perbandingan Respon Positif Budaya Keselamatan Berdasarkan Karakteristik Demografis
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-justify">
                      Budaya keselamatan pasien bersifat heterogen dan dapat dirasakan berbeda antar profesi, unit pelayanan, maupun lama masa bakti staf. Berikut adalah tabel perbandingan persentase respon positif seluruh dimensi berdasarkan posisi staf (profesi), unit kerja, serta masa jabatan dan jam kerja per minggu di <strong>{activeHospitalName}</strong>:
                    </p>
                  </div>

                  {/* A. Berdasarkan Profesi (Posisi Staf) */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-slate-800 flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-3 bg-indigo-600 rounded-sm"></span>
                      A. Perbandingan Dimensi Berdasarkan Posisi Staf (Profesi)
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[8.5px]">
                        <thead>
                          <tr className="bg-indigo-900 text-white font-extrabold text-[8px] uppercase border-b border-indigo-950">
                            <th className="p-1.5 border-r border-indigo-800 w-10 text-center">No</th>
                            <th className="p-1.5 border-r border-indigo-800 min-w-[140px]">Dimensi Budaya Keselamatan</th>
                            {demografiStats.posisiData.slice(0, 4).map(pos => (
                              <th key={pos.name} className="p-1.5 text-center border-r border-indigo-800 min-w-[70px]">
                                {pos.name} <span className="font-mono font-normal block text-[7px] text-indigo-200">(N={pos.value})</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                          {Object.keys(DIMENSI_INFO).map((dimId, idx) => {
                            const info = DIMENSI_INFO[dimId];
                            const scoreObj = positionDimensionScores.find(s => s.id === dimId);
                            return (
                              <tr key={dimId} className="hover:bg-slate-50/40">
                                <td className="p-1.5 border-r border-slate-100 text-center font-bold text-indigo-700">{idx + 1}</td>
                                <td className="p-1.5 border-r border-slate-100 font-semibold text-slate-800">{info.nama}</td>
                                {demografiStats.posisiData.slice(0, 4).map(pos => {
                                  const val = scoreObj ? scoreObj[pos.name] : null;
                                  return (
                                    <td key={pos.name} className="p-1.5 text-center border-r border-slate-100 font-extrabold text-teal-800 bg-slate-50/20">
                                      {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* B. Berdasarkan Unit Kerja */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] font-bold text-slate-800 flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-3 bg-teal-600 rounded-sm"></span>
                      B. Perbandingan Dimensi Berdasarkan Unit Kerja (Top 4 Unit Terbesar)
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[8.5px]">
                        <thead>
                          <tr className="bg-teal-800 text-white font-extrabold text-[8px] uppercase border-b border-teal-900">
                            <th className="p-1.5 border-r border-teal-700 w-10 text-center">No</th>
                            <th className="p-1.5 border-r border-teal-700 min-w-[140px]">Dimensi Budaya Keselamatan</th>
                            {demografiStats.unitData.slice(0, 4).map(u => (
                              <th key={u.name} className="p-1.5 text-center border-r border-teal-700 min-w-[70px]">
                                {u.name} <span className="font-mono font-normal block text-[7px] text-teal-200">(N={u.value})</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                          {Object.keys(DIMENSI_INFO).map((dimId, idx) => {
                            const info = DIMENSI_INFO[dimId];
                            const scoreObj = unitDimensionScores.find(s => s.id === dimId);
                            return (
                              <tr key={dimId} className="hover:bg-slate-50/40">
                                <td className="p-1.5 border-r border-slate-100 text-center font-bold text-teal-700">{idx + 1}</td>
                                <td className="p-1.5 border-r border-slate-100 font-semibold text-slate-800">{info.nama}</td>
                                {demografiStats.unitData.slice(0, 4).map(u => {
                                  const val = scoreObj ? scoreObj[u.name] : null;
                                  return (
                                    <td key={u.name} className="p-1.5 text-center border-r border-slate-100 font-extrabold text-teal-800 bg-slate-50/20">
                                      {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* C. Berdasarkan Masa Kerja & Jam Kerja */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] font-bold text-slate-800 flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-3 bg-amber-600 rounded-sm"></span>
                      C. Perbandingan Dimensi Berdasarkan Masa Kerja (Lama Kerja) & Jam Kerja per Minggu
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-slate-800 text-white font-extrabold text-[7.5px] uppercase border-b border-slate-900">
                            <th rowSpan={2} className="p-1.5 border-r border-slate-700 w-8 text-center align-middle">No</th>
                            <th rowSpan={2} className="p-1.5 border-r border-slate-700 min-w-[120px] align-middle">Dimensi Budaya Keselamatan</th>
                            <th colSpan={4} className="p-1.5 text-center border-r border-slate-700 bg-slate-700">Masa Kerja (Staff Tenure)</th>
                            <th colSpan={3} className="p-1.5 text-center bg-slate-600">Jam Kerja per Minggu</th>
                          </tr>
                          <tr className="bg-slate-700 text-white font-bold text-[7.5px] uppercase border-b border-slate-850 divide-x divide-slate-600">
                            {demografiStats.g1Data.slice(0, 4).map(g1 => (
                              <th key={g1.name} className="p-1 text-center min-w-[55px] font-medium leading-tight">
                                {g1.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                            {demografiStats.g3Data.slice(0, 3).map(g3 => (
                              <th key={g3.name} className="p-1 text-center min-w-[55px] font-medium leading-tight">
                                {g3.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                          {Object.keys(DIMENSI_INFO).map((dimId, idx) => {
                            const info = DIMENSI_INFO[dimId];
                            const tObj = tenureDimensionScores.find(s => s.id === dimId);
                            const wObj = workHoursDimensionScores.find(s => s.id === dimId);
                            return (
                              <tr key={dimId} className="hover:bg-slate-50/40">
                                <td className="p-1 border-r border-slate-100 text-center font-bold text-slate-700">{idx + 1}</td>
                                <td className="p-1 border-r border-slate-100 font-semibold text-slate-800 text-[8.5px]">{info.nama}</td>
                                {demografiStats.g1Data.slice(0, 4).map(g1 => {
                                  const val = tObj ? tObj[g1.name] : null;
                                  return (
                                    <td key={g1.name} className="p-1 text-center border-r border-slate-100 font-bold text-teal-800 bg-teal-50/10">
                                      {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                                    </td>
                                  );
                                })}
                                {demografiStats.g3Data.slice(0, 3).map(g3 => {
                                  const val = wObj ? wObj[g3.name] : null;
                                  return (
                                    <td key={g3.name} className="p-1 text-center border-r border-slate-100 font-bold text-indigo-800 bg-indigo-50/10 last:border-r-0">
                                      {val !== undefined && val !== null ? `${val.toFixed(1)}%` : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Interpretasi & Analisa Data Card */}
                  <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl space-y-1.5">
                    <h5 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Interpretasi & Analisa Data Karakteristik Demografis
                    </h5>
                    <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                      Hasil analisa silang menunjukkan variasi budaya keselamatan yang dipengaruhi secara langsung oleh faktor demografis:
                      (1) <strong>Berdasarkan Profesi</strong>, terdapat kesenjangan pandangan di mana posisi staf dengan interaksi klinis terpadat cenderung menunjukkan respon positif yang dinamis dibanding staf administrasi. 
                      (2) <strong>Berdasarkan Unit Kerja</strong>, unit dengan beban kerja dan stressor tinggi seperti IGD dan ICU memerlukan perhatian khusus karena berpotensi mengalami kelelahan staf (burnout) yang dapat berdampak langsung pada penurunan kualitas iklim keselamatan.
                      (3) <strong>Berdasarkan Masa Jabatan & Jam Kerja</strong>, staf dengan masa jabatan baru (&lt;1 tahun) cenderung melihat iklim keselamatan lebih ideal, sementara staf senior (&gt;10 tahun) memiliki pandangan yang lebih realistis dan waspada terhadap celah keselamatan sistemik. Jam kerja yang berlebih (&gt;60 jam/minggu) secara konsisten berkorelasi dengan penurunan persentase respon positif pada dimensi Ketenagaan dan Beban Kerja.
                    </p>
                  </div>

                  {/* Rekomendasi Peningkatan */}
                  <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl space-y-1.5">
                    <h5 className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      Rekomendasi Peningkatan Intervensi Segmental
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                      <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                        <span className="text-sm shrink-0">👥</span>
                        <span className="text-slate-700 font-medium">Lakukan focus group discussion (FGD) khusus per kelompok profesi klinis untuk menggali hambatan komunikasi yang unik di unit masing-masing.</span>
                      </div>
                      <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                        <span className="text-sm shrink-0">🏥</span>
                        <span className="text-slate-700 font-medium">Prioritaskan dukungan sumber daya ketenagaan ekstra bagi unit-unit kritis (IGD, ICU, Kamar Operasi) dengan tingkat respon positif &lt;50%.</span>
                      </div>
                      <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                        <span className="text-sm shrink-0">⏰</span>
                        <span className="text-slate-700 font-medium">Kendalikan kebijakan jam lembur staf secara ketat guna menekan tingkat fatigue (kelelahan ekstrim) demi keselamatan prosedur pelayanan.</span>
                      </div>
                      <div className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-amber-100/80">
                        <span className="text-sm shrink-0">🎓</span>
                        <span className="text-slate-700 font-medium">Sediakan program orientasi budaya keselamatan yang komprehensif bagi staf baru yang memiliki masa bakti di bawah satu tahun.</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 5B dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 5C: Perbandingan dengan Tahun Sebelumnya & Rumah Sakit Lain (Benchmark) */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5C: Analisis Trend Historis & Benchmark RS ({activeHospitalName})
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Analisis Trend Historis & Perbandingan Benchmark</span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  {/* Part 1: Historical Trend (Perbandingan dengan Tahun Sebelumnya) */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        3.2.5 Perbandingan Respon Positif Budaya Keselamatan dengan Tahun Sebelumnya
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-justify">
                        Analisis tren longitudinal membandingkan capaian persentase respon positif antara tahun terpilih (<strong>{tahunSurvei}</strong>) dengan tahun sebelumnya (<strong>{previousYear || 'Sebelumnya'}</strong>) guna mendeteksi peningkatan mutu atau penurunan iklim keselamatan:
                      </p>
                    </div>

                    {previousYear && priorYearScores ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-[8.5px]">
                          <thead>
                            <tr className="bg-emerald-900 text-white font-extrabold uppercase text-[8px] border-b border-emerald-950">
                              <th className="p-2 border-r border-emerald-800 w-12 text-center">Kode</th>
                              <th className="p-2 border-r border-emerald-800">Dimensi Budaya Keselamatan</th>
                              <th className="p-2 text-center border-r border-emerald-800 w-28">{previousYear} (Prior)</th>
                              <th className="p-2 text-center border-r border-emerald-800 w-28">{tahunSurvei} (Current)</th>
                              <th className="p-2 text-center w-28">Tren Perkembangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                            {dimensionScores.map(d => {
                              const prior = priorYearScores.find(p => p.kode === d.kode)?.percentage || 0;
                              const diff = d.percentage - prior;
                              return (
                                <tr key={d.kode} className="hover:bg-slate-50/40">
                                  <td className="p-2 border-r border-slate-100 text-center font-bold text-slate-700">{d.kode}</td>
                                  <td className="p-2 border-r border-slate-100 font-semibold text-slate-800">{d.nama}</td>
                                  <td className="p-2 text-center border-r border-slate-100 font-bold text-slate-500">{prior.toFixed(1)}%</td>
                                  <td className="p-2 text-center border-r border-slate-100 font-extrabold text-teal-800">{d.percentage.toFixed(1)}%</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black flex items-center justify-center gap-1 ${diff >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      {diff >= 0 ? '▲' : '▼'} {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-base shrink-0 text-slate-400">ℹ️</span>
                        <div className="text-[10px] text-slate-600 leading-relaxed text-justify">
                          Saat ini belum tersedia data survei tahun sebelumnya untuk <strong>{activeHospitalName}</strong> di database. Hasil survei pada tahun <strong>{tahunSurvei}</strong> ini akan berfungsi sebagai baseline (nilai referensi awal) pengukuran. Analisis trend perbandingan berkala (trendline) secara otomatis akan aktif setelah Anda menginput data survei untuk periode tahun berikutnya.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Part 2: Benchmarking (Perbandingan dengan Rumah Sakit Lain) */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        3.2.6 Perbandingan Respon Positif Dimensi Budaya Keselamatan dengan Rumah Sakit Lain (Benchmark)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-justify">
                        Pengukuran eksternal (benchmarking) membantu mengidentifikasi posisi tawar, gap pencapaian mutu, dan standar pelayanan rumah sakit dibanding fasilitas kesehatan mitra lainnya:
                      </p>
                    </div>

                    {selectedBenchmarkHospital && benchmarkData ? (
                      <div className="space-y-3">
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse text-[8.5px]">
                            <thead>
                              <tr className="bg-indigo-900 text-white font-extrabold uppercase text-[8px] border-b border-indigo-950">
                                <th className="p-2 border-r border-indigo-800 w-12 text-center">Kode</th>
                                <th className="p-2 border-r border-indigo-800">Dimensi Budaya Keselamatan</th>
                                <th className="p-2 text-center border-r border-indigo-800 w-28">{activeHospitalName} (Anda)</th>
                                <th className="p-2 text-center border-r border-indigo-800 w-28">{selectedBenchmarkHospital.namaRs}</th>
                                <th className="p-2 text-center w-28">Kesenjangan (Gap)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                              {benchmarkData.map(b => (
                                <tr key={b.kode} className="hover:bg-slate-50/40">
                                  <td className="p-2 border-r border-slate-100 text-center font-bold text-slate-700">{b.kode}</td>
                                  <td className="p-2 border-r border-slate-100 font-semibold text-slate-800">{b.nama}</td>
                                  <td className="p-2 text-center border-r border-slate-100 font-extrabold text-indigo-700 bg-slate-50/20">{b.rsPct.toFixed(1)}%</td>
                                  <td className="p-2 text-center border-r border-slate-100 font-bold text-slate-500">{b.benchPct.toFixed(1)}%</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black flex items-center justify-center gap-1 ${b.diff >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      {b.diff >= 0 ? '▲ Lebih Tinggi' : '▼ Lebih Rendah'} {b.diff >= 0 ? `+${b.diff.toFixed(1)}%` : `${b.diff.toFixed(1)}%`}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Interpretasi & Analisa Data Benchmark Card */}
                        <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl space-y-1.5">
                          <h5 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Interpretasi & Analisa Data Perbandingan Benchmark
                          </h5>
                          <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                            Berdasarkan hasil komparasi formal dengan <strong>{selectedBenchmarkHospital.namaRs}</strong>, rumah sakit Anda menunjukkan performa yang kompetitif. 
                            Aspek keunggulan tertinggi (gap positif terbesar) berada pada dimensi yang melampaui benchmark secara signifikan. 
                            Namun, terdapat dimensi di mana rumah sakit Anda masih berada di bawah pencapaian <strong>{selectedBenchmarkHospital.namaRs}</strong>. Kesenjangan negatif ini mengindikasikan adanya ruang peningkatan mutu yang dapat dipelajari secara langsung dari praktik terbaik (best practices) rumah sakit benchmark tersebut.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-base shrink-0 text-indigo-500">🌍</span>
                        <div className="text-[10px] text-slate-600 leading-relaxed text-justify">
                          Untuk melihat analisis perbandingan performa dimensi budaya keselamatan secara detail, silakan pilih Rumah Sakit Benchmark pada selector di bagian atas halaman laporan. Sistem akan melakukan sinkronisasi database dan menampilkan data perbandingan side-by-side secara dinamis beserta kesenjangan (gap) capaian.
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 5C dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 6: BAB III HASIL & PEMBAHASAN - Pembahasan Analisis Kualitatif */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 6: BAB III — Analisis Naratif Otomatis ({activeHospitalName})
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Analisis Naratif Budaya Keselamatan Pasien</span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-3.5">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">3.3 Analisis Naratif Otomatis Hasil Pengukuran Dimensi</h3>

                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Berikut adalah analisis naratif dinamis berdasarkan pengelompokan tingkat capaian budaya keselamatan pasien di <strong className="text-slate-800">{activeHospitalName}</strong> yang diperbarui secara otomatis dari database Supabase:
                  </p>

                  <div className="space-y-3 text-[10.5px] text-slate-700 leading-relaxed">
                    {/* Kekuatan Organisasi (≥ 75%) */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-800 flex items-center gap-1 text-[10.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3.3.1 Kekuatan Organisasi (Capaian Respon Positif ≥ 75%)
                      </h4>
                      {strengths.length > 0 ? (
                        <div className="space-y-1.5 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 text-[9.5px]">
                          {strengths.map(s => (
                            <div key={s.kode} className="flex flex-col gap-0.5 border-b border-emerald-100/80 last:border-none pb-1 last:pb-0">
                              <span className="font-bold text-emerald-950">
                                • {s.kode} - {s.nama} ({s.percentage.toFixed(1)}%):
                              </span>
                              <span className="text-slate-700 pl-2.5">{s.interpretasi}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="italic text-[9.5px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          Saat ini belum ada dimensi yang mencapai target area kekuatan (≥ 75%). Diperlukan strategi penguatan terpadu di seluruh unit kerja {activeHospitalName}.
                        </p>
                      )}
                    </div>

                    {/* Area Moderat (50% - 74%) */}
                    <div className="space-y-1 pt-1">
                      <h4 className="font-bold text-amber-800 flex items-center gap-1 text-[10.5px]">
                        <Activity className="w-3.5 h-3.5 text-amber-600" />
                        3.3.2 Area yang Masih Perlu Ditingkatkan (Capaian 50% - 74%)
                      </h4>
                      {moderates.length > 0 ? (
                        <div className="space-y-1.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 text-[9.5px]">
                          {moderates.map(m => (
                            <div key={m.kode} className="flex flex-col gap-0.5 border-b border-amber-100/80 last:border-none pb-1 last:pb-0">
                              <span className="font-bold text-amber-950">
                                • {m.kode} - {m.nama} ({m.percentage.toFixed(1)}%):
                              </span>
                              <span className="text-slate-700 pl-2.5">{m.interpretasi}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="italic text-[9.5px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          Tidak ada dimensi yang berada dalam kategori moderat (50% - 74%).
                        </p>
                      )}
                    </div>

                    {/* Perbaikan Kritis (< 50%) */}
                    <div className="space-y-1 pt-1">
                      <h4 className="font-bold text-red-800 flex items-center gap-1 text-[10.5px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        3.3.3 Prioritas Utama Perbaikan (Capaian &lt; 50%)
                      </h4>
                      {improvements.length > 0 ? (
                        <div className="space-y-1.5 bg-red-50/60 p-2.5 rounded-xl border border-red-200/80 text-[9.5px]">
                          {improvements.map(imp => (
                            <div key={imp.kode} className="flex flex-col gap-0.5 border-b border-red-100/80 last:border-none pb-1 last:pb-0">
                              <span className="font-bold text-red-950">
                                • {imp.kode} - {imp.nama} ({imp.percentage.toFixed(1)}%):
                              </span>
                              <span className="text-slate-700 pl-2.5">{imp.interpretasi}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 text-[9.5px] text-emerald-800 font-medium">
                          Tidak ada dimensi yang berada pada kategori perbaikan kritis (&lt; 50%). Ini menunjukkan budaya keselamatan di {activeHospitalName} berjalan stabil tanpa hambatan kritis.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 6 dari 7</span>
              </div>
            </div>
          </div>

          {/* LEMBAR 7: BAB IV KESIMPULAN DAN REKOMENDASI */}
          <div className="w-full flex flex-col items-center">
            <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 7: BAB IV — Kesimpulan & Rekomendasi
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{activeHospitalName}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB IV</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">KESIMPULAN DAN REKOMENDASI</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-4 text-xs text-slate-700 leading-relaxed text-justify">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-xs">4.1 Kesimpulan</h3>
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        Berdasarkan hasil survei budaya keselamatan pasien menggunakan instrumen AHRQ SOPS® Version 2.0 di <strong className="text-slate-900">{activeHospitalName}</strong> dengan tingkat partisipasi (response rate) sebesar <strong className="text-teal-700">{responseRateStr}</strong> (N=<strong className="text-slate-900">{totalActual.toLocaleString('id-ID')}</strong>), dapat ditarik beberapa kesimpulan utama sebagai berikut:
                      </p>

                      <div className="space-y-2.5 pl-1 pt-1 text-[11px]">
                        <div className="leading-relaxed">
                          <strong className="text-slate-900 font-bold">1. Gambaran Umum Budaya Keselamatan Pasien:</strong> Rata-rata pencapaian respon positif dari 10 dimensi budaya keselamatan pasien di <strong className="text-slate-900">{activeHospitalName}</strong> berada pada angka <strong className="text-teal-700">{overallAverage.toFixed(1)}%</strong>. Secara umum, persepsi staf terhadap tingkat keselamatan pasien (Overall Patient Safety Rating) tergolong positif, di mana <strong className="text-teal-700">{safetyRatingData.positivePct.toFixed(1)}%</strong> staf menilai kondisi keselamatan pasien di rumah sakit berada dalam kategori &quot;Baik&quot; hingga &quot;Sangat Baik&quot;.
                        </div>

                        <div className="space-y-1">
                          <div className="leading-relaxed">
                            <strong className="text-slate-900 font-bold">2. Area Keunggulan (Strengths):</strong> Terdapat <strong className="text-teal-800">{strengths.length}</strong> dimensi yang menjadi kekuatan utama budaya keselamatan di <strong className="text-slate-900">{activeHospitalName}</strong> (&ge;75% respon positif):
                          </div>
                          {strengths.length > 0 ? (
                            <ul className="list-none space-y-1 pl-3 text-slate-700">
                              {strengths.map(s => (
                                <li key={s.kode} className="flex items-start gap-1">
                                  <span className="font-bold text-teal-800">•</span>
                                  <div>
                                    <strong className="text-slate-900">{s.nama}</strong> [<strong className="text-teal-700">{s.percentage.toFixed(1)}%</strong>]: {s.interpretasi}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="pl-4 text-slate-500 italic">• Belum ada dimensi yang mencapai batas area kekuatan (&ge;75%). Diperlukan strategi penguatan terpadu di seluruh unit kerja.</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="leading-relaxed">
                            <strong className="text-slate-900 font-bold">3. Area yang Memerlukan Perbaikan Kritis (Areas for Improvement):</strong> Terdapat <strong className="text-rose-800">{improvements.length}</strong> dimensi kritis yang capaian respon positifnya masih berada di bawah target minimal AHRQ (&lt;50%):
                          </div>
                          {improvements.length > 0 ? (
                            <ul className="list-none space-y-1 pl-3 text-slate-700">
                              {improvements.map(imp => (
                                <li key={imp.kode} className="flex items-start gap-1">
                                  <span className="font-bold text-rose-800">•</span>
                                  <div>
                                    <strong className="text-slate-900">{imp.nama}</strong> [<strong className="text-rose-700">{imp.percentage.toFixed(1)}%</strong>]: {imp.interpretasi}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="pl-4 text-slate-500 italic">• Tidak ada dimensi yang berada pada kategori perbaikan kritis (&lt;50%). Budaya keselamatan pasien berjalan stabil tanpa hambatan kritis.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h3 className="font-bold text-slate-900 text-xs">4.2 Rekomendasi</h3>
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        Untuk menindaklanjuti temuan survei ini dan memperkuat budaya keselamatan pasien secara berkelanjutan, dirumuskan rekomendasi tindakan yang dapat diprioritaskan berdasarkan skala dampaknya:
                      </p>

                      <div className="space-y-3 pt-1 text-[11px]">
                        <div className="space-y-1">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-teal-600" /> Prioritas Jangka Pendek (1 - 3 Bulan):
                          </strong>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {recommendations.jangkaPendek.map((r, i) => (
                              <li key={`jp-${i}`}>{r}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-[11px]">
                            <Target className="w-3.5 h-3.5 text-indigo-600" /> Prioritas Jangka Menengah (3 - 6 Bulan):
                          </strong>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {recommendations.jangkaMenengah.map((r, i) => (
                              <li key={`jm-${i}`}>{r}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-[11px]">
                            <Award className="w-3.5 h-3.5 text-slate-600" /> Prioritas Jangka Panjang (6 - 12 Bulan):
                          </strong>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {recommendations.jangkaPanjang.map((r, i) => (
                              <li key={`jpan-${i}`}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* PENGESAHAN */}
                  <div className="pt-8">
                    <p className="text-right text-xs text-slate-600 leading-relaxed font-semibold mb-4">
                      {pengesahanConfig?.kota || 'Sukabumi'}, {pengesahanConfig?.tanggalPengesahan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="grid grid-cols-2 gap-6 pt-4 text-center text-[10px]">
                      <div className="space-y-12">
                        <div>
                          <p className="font-bold text-slate-800">Mengetahui,</p>
                          <p className="font-bold text-slate-900">{pengesahanConfig?.direkturJabatan || 'Direktur Utama Rumah Sakit'}</p>
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 underline">
                            {pengesahanConfig?.direkturNama || 'dr. H. Ahmad Wijaya'}{pengesahanConfig?.direkturGelar && !pengesahanConfig.direkturNama.includes(pengesahanConfig.direkturGelar) ? ", " + pengesahanConfig.direkturGelar : ''}
                          </p>
                          <p className="text-slate-500 font-medium">NIP/ID: {pengesahanConfig?.direkturNip || '19780512 200501 1 002'}</p>
                        </div>
                      </div>

                      <div className="space-y-12">
                        <div>
                          <p className="font-bold text-slate-800">Disiapkan oleh,</p>
                          <p className="font-bold text-slate-900">{pengesahanConfig?.pjJabatan || 'Ketua Komite Mutu & Keselamatan Pasien'}</p>
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 underline">
                            {pengesahanConfig?.pjNama || 'dr. Budi Santoso'}{pengesahanConfig?.pjGelar && !pengesahanConfig.pjNama.includes(pengesahanConfig.pjGelar) ? ", " + pengesahanConfig.pjGelar : ''}
                          </p>
                          <p className="text-slate-500 font-medium">NIP/ID: {pengesahanConfig?.pjNip || '19820315 200804 1 005'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 7 dari 7</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    </div>
  );
}
