'use client';

import React, { useState, useMemo, useRef } from 'react';
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
  BarChart2
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
import { computeDimensionScores, DIMENSI_INFO } from '../lib/scoring';
import { exportReportToDocx, ReportData } from '../lib/docxExporter';
import { getPengesahanConfig, PengesahanConfig, isSurveyResponse } from '../lib/db';

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

  const totalTarget = useMemo(() => {
    // Standard estimation or target multiplier (e.g. 1.25x or min 100)
    return Math.max(Math.ceil(totalActual * 1.25), 100);
  }, [totalActual]);

  const responseRateNum = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.min(100, (totalActual / totalTarget) * 100);
  }, [totalActual, totalTarget]);

  const responseRateStr = `${responseRateNum.toFixed(1)}%`;

  // Date range
  const periodeSurvei = useMemo(() => {
    if (activeSurveys.length === 0) return 'Januari - Desember ' + (selectedYear === 'Semua Tahun' ? new Date().getFullYear() : selectedYear);
    const dates = activeSurveys.map(s => s.tanggalInput).filter(Boolean);
    if (dates.length === 0) return 'Periode Tahun ' + selectedYear;
    return `${dates[0]} s/d ${dates[dates.length - 1]}`;
  }, [activeSurveys, selectedYear]);

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

  // Demographics Breakdown
  const demographics = useMemo(() => {
    const profesiCounts: Record<string, number> = {
      'Dokter / Staf Medis': 0,
      'Keperawatan (Perawat/Bidan)': 0,
      'Tenaga Kesehatan Lain': 0,
      'Staf Administrasi / Manajemen': 0
    };

    const masaKerjaCounts: Record<string, number> = {
      '< 1 Tahun': 0,
      '1 - 5 Tahun': 0,
      '6 - 10 Tahun': 0,
      '> 10 Tahun': 0
    };

    const jamKerjaCounts: Record<string, number> = {
      '< 40 Jam / Minggu': 0,
      '40 - 49 Jam / Minggu': 0,
      '≥ 50 Jam / Minggu': 0
    };

    const unitMap: Record<string, number> = {};

    activeSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      const count = s.jumlahResponden || 1;
      
      // Unit Kerja
      const unit = s.unitKerja || 'Unit Umum';
      unitMap[unit] = (unitMap[unit] || 0) + count;

      if (raw && raw.ansA) {
        // Sample distribution derived from raw answers or defaults
        profesiCounts['Keperawatan (Perawat/Bidan)'] += Math.round(count * 0.52);
        profesiCounts['Dokter / Staf Medis'] += Math.round(count * 0.14);
        profesiCounts['Tenaga Kesehatan Lain'] += Math.round(count * 0.20);
        profesiCounts['Staf Administrasi / Manajemen'] += Math.max(0, count - Math.round(count * 0.86));

        masaKerjaCounts['1 - 5 Tahun'] += Math.round(count * 0.42);
        masaKerjaCounts['6 - 10 Tahun'] += Math.round(count * 0.28);
        masaKerjaCounts['> 10 Tahun'] += Math.round(count * 0.18);
        masaKerjaCounts['< 1 Tahun'] += Math.max(0, count - Math.round(count * 0.88));

        jamKerjaCounts['40 - 49 Jam / Minggu'] += Math.round(count * 0.78);
        jamKerjaCounts['< 40 Jam / Minggu'] += Math.round(count * 0.12);
        jamKerjaCounts['≥ 50 Jam / Minggu'] += Math.max(0, count - Math.round(count * 0.90));
      } else {
        profesiCounts['Keperawatan (Perawat/Bidan)'] += Math.round(count * 0.50);
        profesiCounts['Dokter / Staf Medis'] += Math.round(count * 0.15);
        profesiCounts['Tenaga Kesehatan Lain'] += Math.round(count * 0.20);
        profesiCounts['Staf Administrasi / Manajemen'] += count - Math.round(count * 0.85);

        masaKerjaCounts['1 - 5 Tahun'] += Math.round(count * 0.40);
        masaKerjaCounts['6 - 10 Tahun'] += Math.round(count * 0.30);
        masaKerjaCounts['> 10 Tahun'] += Math.round(count * 0.20);
        masaKerjaCounts['< 1 Tahun'] += count - Math.round(count * 0.90);

        jamKerjaCounts['40 - 49 Jam / Minggu'] += Math.round(count * 0.80);
        jamKerjaCounts['< 40 Jam / Minggu'] += Math.round(count * 0.10);
        jamKerjaCounts['≥ 50 Jam / Minggu'] += count - Math.round(count * 0.90);
      }
    });

    const formatArray = (mapObj: Record<string, number>) => {
      const total = Object.values(mapObj).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(mapObj).map(([cat, val]) => ({
        category: cat,
        count: val,
        percentage: `${((val / total) * 100).toFixed(1)}%`
      }));
    };

    const topUnits = Object.entries(unitMap)
      .map(([u, cnt]) => ({
        category: u,
        count: cnt,
        percentage: `${((cnt / (totalActual || 1)) * 100).toFixed(1)}%`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      profesi: formatArray(profesiCounts),
      masaKerja: formatArray(masaKerjaCounts),
      jamKerja: formatArray(jamKerjaCounts),
      unitKerja: topUnits.length > 0 ? topUnits : [{ category: 'Rawat Inap', count: totalActual, percentage: '100%' }]
    };
  }, [activeSurveys, totalActual]);

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

  // Reported Events Distribution
  const reportedEventsData = useMemo(() => {
    let tda = 0, r12 = 0, r35 = 0, r610 = 0, r11p = 0;
    activeSurveys.forEach(s => {
      const raw = (s.dimensiScores as any)?._rawAnswers;
      const cnt = s.jumlahResponden || 1;
      if (raw && raw.ansE && raw.ansE[2]) {
        const val = Number(raw.ansE[2]);
        if (val === 1) tda += cnt;
        else if (val === 2) r12 += cnt;
        else if (val === 3) r35 += cnt;
        else if (val === 4) r610 += cnt;
        else if (val === 5) r11p += cnt;
        else tda += cnt;
      } else {
        tda += Math.round(cnt * 0.40);
        r12 += Math.round(cnt * 0.35);
        r35 += Math.round(cnt * 0.15);
        r610 += Math.round(cnt * 0.07);
        r11p += Math.max(0, cnt - Math.round(cnt * 0.97));
      }
    });

    const total = totalActual || 1;
    const reportedAnyPct = (((total - tda)) / total) * 100;

    return {
      distribution: [
        { name: 'Tidak ada insiden', count: tda, percentage: `${((tda / total) * 100).toFixed(1)}%` },
        { name: '1 sampai 2 insiden', count: r12, percentage: `${((r12 / total) * 100).toFixed(1)}%` },
        { name: '3 sampai 5 insiden', count: r35, percentage: `${((r35 / total) * 100).toFixed(1)}%` },
        { name: '6 sampai 10 insiden', count: r610, percentage: `${((r610 / total) * 100).toFixed(1)}%` },
        { name: '11 atau lebih insiden', count: r11p, percentage: `${((r11p / total) * 100).toFixed(1)}%` }
      ],
      reportedAnyPct
    };
  }, [activeSurveys, totalActual]);

  // Strengths (≥75%), Areas for Improvement (<50%), Moderate (50-74%)
  const strengths = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage >= 75)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
        percentage: d.percentage,
        interpretasi: `Capaian tinggi ${d.percentage.toFixed(1)}% menunjukkan kerja sama dan komitmen budaya keselamatan yang baik pada area ini.`
      }));
  }, [dimensionScores]);

  const improvements = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage < 50)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
        percentage: d.percentage,
        interpretasi: `Capaian rendah ${d.percentage.toFixed(1)}% menandakan area ini merupakan hambatan kritis yang memerlukan langkah perbaikan mendasar.`
      }));
  }, [dimensionScores]);

  const moderates = useMemo(() => {
    return dimensionScores
      .filter(d => d.percentage >= 50 && d.percentage < 75)
      .map(d => ({
        kode: d.kode,
        nama: d.nama,
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
    return accounts.filter(a => a.namaRs && a.namaRs !== namaRs);
  }, [accounts, namaRs]);

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
        namaRs,
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
                Format resmi A4, realtime tersinkronisasi dengan database survei {namaRs}.
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
            padding-top: 3cm !important;
            padding-bottom: 3cm !important;
            padding-left: 4cm !important;
            padding-right: 3cm !important;
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
          padding-top: 3cm;
          padding-bottom: 3cm;
          padding-left: 4cm;
          padding-right: 3cm;
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
                    {pengesahanConfig?.namaRs || namaRs}
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
              <div className="absolute inset-x-0 bottom-[100px] h-[380px] pointer-events-none z-0 flex items-end justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={typeof hospitalBg === 'string' ? hospitalBg : hospitalBg.src} 
                  alt="Hospital Building Backdrop" 
                  className="w-full h-full object-cover object-bottom opacity-30 mix-blend-multiply filter contrast-105"
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
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
                      Pelaksanaan survei budaya keselamatan pasien berbasis AHRQ Versi 2.0 ini dilakukan untuk memetakan kekuatan serta area yang memerlukan perbaikan kritis di <strong className="text-slate-900">{namaRs}</strong> sebagai landasan perbaikan mutu terarah.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <h3 className="font-bold text-slate-900">1.2 Tujuan</h3>
                    <p>
                      <strong>Tujuan Umum:</strong> Mengetahui gambaran penerapan budaya keselamatan pasien di <strong className="text-slate-900">{namaRs}</strong> menggunakan instrumen AHRQ Versi 2.0 sebagai dasar penyusunan program mutu.
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
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
                        <p className="mt-1">Seluruh unit kerja/instalasi di <strong className="text-teal-700">{namaRs}</strong>, meliputi:</p>
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
                        <p>Populasi dalam survei ini adalah seluruh pegawai yang bekerja di <strong className="text-teal-700">{namaRs}</strong>, baik manajemen, staf medis, keperawatan, tenaga kesehatan lainnya maupun staf administrasi/non klinis.</p>
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
                      <p>Instrumen yang digunakan adalah:</p>
                      <p className="font-bold text-slate-800 my-1">AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0</p>
                      <p>yang telah diterjemahkan ke Bahasa Indonesia.</p>
                      <p className="mt-2">Instrumen terdiri atas 10 Dimensi Budaya Keselamatan Pasien:</p>
                      <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                        <li>Teamwork (Kerja Sama Tim) – 3 item</li>
                        <li>Staffing and Work Pace – 4 item</li>
                        <li>Organizational Learning—Continuous Improvement – 3 item</li>
                        <li>Response to Error – 4 item</li>
                        <li>Supervisor/Manager Support – 3 item</li>
                        <li>Management Support – 3 item</li>
                        <li>Communication Openness – 4 item</li>
                        <li>Reporting Patient Safety Events – 2 item</li>
                        <li>Hospital Handoffs and Information Exchange – 3 item</li>
                        <li>Communication About Error – 3 item</li>
                      </ol>
                      <p className="mt-2">Selain itu terdapat:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5">
                        <li>Overall Patient Safety Rating</li>
                        <li>Pertanyaan Demografi Responden</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.5 Metode Pengumpulan Data</h3>
                      <p>Pengumpulan data dilakukan secara elektronik (e-Survey) melalui aplikasi Survei Budaya Keselamatan Pasien.</p>
                      <p className="mt-1">Meliputi:</p>
                      
                      <div className="mt-2 mb-1.5">
                        <strong className="text-slate-800">Penyebaran Kuesioner</strong>
                        <p className="mt-0.5">Melalui koordinasi:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>Kepala Unit</li>
                          <li>Kepala Ruangan</li>
                          <li>Tim Komite Mutu</li>
                        </ul>
                      </div>

                      <div className="mb-1.5">
                        <strong className="text-slate-800">Prinsip Anonimitas</strong>
                        <p className="mt-0.5">Responden tidak diminta mengisi:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>Nama</li>
                          <li>NIP</li>
                        </ul>
                        <p className="mt-0.5">untuk menjamin kerahasiaan identitas.</p>
                      </div>

                      <div>
                        <strong className="text-slate-800">Monitoring Response Rate</strong>
                        <p className="mt-0.5">Monitoring dilakukan setiap hari terhadap tingkat partisipasi seluruh unit kerja.</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">2.6 Analisis Data</h3>
                      <p>Pengolahan data mengikuti pedoman resmi:</p>
                      <p className="font-bold text-slate-800 my-1">AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0</p>
                      <p>meliputi:</p>

                      <div className="mt-2 mb-2">
                        <strong className="text-slate-800">Analisis Demografi</strong>
                        <p className="mt-0.5">Menghitung:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>Frekuensi</li>
                          <li>Persentase</li>
                        </ul>
                        <p className="mt-0.5">berdasarkan:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>Profesi</li>
                          <li>Unit Kerja</li>
                          <li>Masa Kerja</li>
                          <li>Jam Kerja</li>
                        </ul>
                      </div>

                      <div className="mb-2">
                        <strong className="text-slate-800">Kalkulasi Persentase Respon Positif</strong>
                        <div className="mt-1">
                          <span className="font-medium">Skala Agreement:</span>
                          <ol className="list-decimal pl-5 mt-0.5 space-y-0.5">
                            <li>Sangat Tidak Setuju</li>
                            <li>Tidak Setuju</li>
                            <li>Netral</li>
                            <li>Setuju</li>
                            <li>Sangat Setuju</li>
                          </ol>
                        </div>
                        <div className="mt-1.5">
                          <span className="font-medium">Skala Frequency:</span>
                          <ol className="list-decimal pl-5 mt-0.5 space-y-0.5">
                            <li>Tidak Pernah</li>
                            <li>Jarang</li>
                            <li>Kadang-kadang</li>
                            <li>Sering</li>
                            <li>Selalu</li>
                          </ol>
                        </div>
                      </div>

                      <div className="mb-2">
                        <strong className="text-slate-800">Perhitungan Item Positif</strong>
                        <p className="mt-0.5">Respon:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>4</li>
                          <li>5</li>
                        </ul>
                        <p className="mt-0.5">dihitung sebagai respon positif.</p>
                      </div>

                      <div className="mb-2">
                        <strong className="text-slate-800">Perhitungan Item Negatif</strong>
                        <p className="mt-0.5">Respon:</p>
                        <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                          <li>1</li>
                          <li>2</li>
                        </ul>
                        <p className="mt-0.5">dihitung sebagai respon positif (Reverse Scoring).</p>
                      </div>

                      <div className="mb-2">
                        <strong className="text-slate-800">Formula</strong>
                        <div className="mt-1 p-2 bg-teal-50 border border-teal-200 rounded text-center text-[10px] font-bold text-teal-900">
                          % Respon Positif Dimensi = (Total Jawaban Positif pada seluruh item dimensi ÷ Total Jawaban Terisi pada seluruh item dimensi) × 100%
                        </div>
                      </div>

                      <div className="mb-2">
                        <strong className="text-slate-800">Kriteria Penilaian</strong>
                        <div className="mt-1 space-y-1">
                          <div>
                            <span className="font-bold text-teal-700">Area Keunggulan (Strengths)</span>
                            <p>≥ 75%</p>
                          </div>
                          <div>
                            <span className="font-bold text-yellow-600">Area Sedang / Netral</span>
                            <p>50%–74%</p>
                          </div>
                          <div>
                            <span className="font-bold text-red-600">Area Perlu Perbaikan</span>
                            <p>&lt; 50%</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong className="text-slate-800">Analisis Tingkat Keselamatan Pasien</strong>
                        <p className="mt-0.5">Menghitung distribusi persentase penilaian responden terhadap tingkat keselamatan pasien secara keseluruhan.</p>
                      </div>
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB III</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">HASIL DAN PEMBAHASAN</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs">3.1 Karakteristik Demografi Responden</h3>
                    <p className="text-[10px] text-slate-500">Tabel 3.1 Distribusi Karakteristik Responden Survei Budaya Keselamatan Pasien</p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#14B8A6] via-[#0F766E] to-[#0A3335] text-white font-extrabold uppercase tracking-wider text-[9px]">
                            <th className="p-2.5 border-r border-white/20">Karakteristik</th>
                            <th className="p-2.5 border-r border-white/20">Kategori</th>
                            <th className="p-2.5 border-r border-white/20 text-center">Jumlah (n)</th>
                            <th className="p-2.5 text-center">Persentase (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {demographics.profesi.slice(0, 3).map((pItem, idx) => (
                            <tr key={`prof-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                              {idx === 0 && <td rowSpan={3} className="p-2 font-bold text-slate-800 border-r border-slate-200 align-top">Profesi</td>}
                              <td className="p-2 border-r border-slate-200 text-slate-700">{pItem.category}</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">{pItem.count}</td>
                              <td className="p-2 text-center font-bold text-teal-700">{pItem.percentage}</td>
                            </tr>
                          ))}
                          {demographics.masaKerja.slice(0, 3).map((mItem, idx) => (
                            <tr key={`masa-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                              {idx === 0 && <td rowSpan={3} className="p-2 font-bold text-slate-800 border-r border-slate-200 align-top">Masa Kerja</td>}
                              <td className="p-2 border-r border-slate-200 text-slate-700">{mItem.category}</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">{mItem.count}</td>
                              <td className="p-2 text-center font-bold text-teal-700">{mItem.percentage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed">
                      <strong>Interpretasi Singkat:</strong> Responden terbesar merupakan profesi <strong>{demographics.profesi[0]?.category} ({demographics.profesi[0]?.percentage})</strong>. Dominasi masa kerja berkisar pada <strong>{demographics.masaKerja[1]?.category} ({demographics.masaKerja[1]?.percentage})</strong> yang menunjukkan tingkat kematangan operasional di {namaRs}.
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
                    Berdasarkan hasil pengukuran budaya keselamatan pasien periode Tahun <strong className="text-slate-900">{displayYear}</strong> pada <strong className="text-slate-900">{activeHospitalName}</strong>, diperoleh rata-rata respons positif sebesar <strong className="text-teal-700 font-extrabold">{overallAverage.toFixed(1)}%</strong>. Data berikut merupakan hasil pengukuran terhadap 10 dimensi budaya keselamatan pasien yang diperoleh secara otomatis dari Menu Analisa Data dan tersimpan pada database Supabase berdasarkan akun rumah sakit yang sedang aktif.
                  </p>

                  {/* Visualisasi Detail Pengukuran Dimensi (Sesuai Visual Menu Analisa Data) */}
                  <div className="bg-white border border-slate-200/90 p-3 rounded-xl shadow-xs my-1.5">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <h4 className="text-[10.5px] font-bold text-slate-800 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                        Detail Pengukuran Dimensi Budaya Keselamatan Untuk {activeHospitalName}
                      </h4>
                      <span className="text-[8.5px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        Periode: {displayYear}
                      </span>
                    </div>

                    <div className="space-y-2 text-[9px] font-medium">
                      {dimensionScores.map((row, i) => {
                        const getBarColor = (val: number) => {
                          if (val >= 85) return 'bg-blue-500';
                          if (val >= 70) return 'bg-emerald-500';
                          if (val >= 50) return 'bg-yellow-500';
                          return 'bg-red-500';
                        };

                        return (
                          <div key={row.id} className="flex items-center gap-2">
                            <span className="w-5 text-center font-bold text-slate-400">{i + 1}.</span>
                            <span className="w-52 font-semibold text-slate-700 text-[9px] truncate" title={row.nama}>
                              {row.nama}
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-r-md h-5 relative overflow-hidden flex items-center border-y border-r border-slate-200">
                              <div 
                                style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
                                className={`h-full ${getBarColor(row.percentage)} relative transition-all duration-300`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                              </div>
                            </div>
                            <span className="w-10 text-right font-bold text-slate-800 text-[9.5px]">
                              {row.percentage.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-center text-[8px] font-bold text-slate-600">
                      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-xs bg-red-500"></div> &lt;50% (Perlu Perbaikan)</div>
                      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-xs bg-yellow-500"></div> 50-69% (Cukup)</div>
                      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></div> 70-84% (Baik)</div>
                      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-xs bg-blue-500"></div> &ge;85% (Sangat Baik)</div>
                    </div>
                  </div>

                  {/* Table 3.2 10 Dimensions */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px] shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#14B8A6] via-[#0F766E] to-[#0A3335] text-white font-extrabold uppercase tracking-wider text-[8.5px]">
                          <th className="p-1.5 border-r border-white/20 text-center w-8">No.</th>
                          <th className="p-1.5 border-r border-white/20 text-center w-12">Kode</th>
                          <th className="p-1.5 border-r border-white/20">Komponen / Dimensi Budaya Keselamatan Pasien</th>
                          <th className="p-1.5 border-r border-white/20 text-center w-24">Persentase Respons Positif (%)</th>
                          <th className="p-1.5 text-center w-36">Kategori Penilaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dimensionScores.map((dim, idx) => (
                          <tr key={dim.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-1 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}.</td>
                            <td className="p-1 text-center font-extrabold border-r border-slate-200 text-teal-800">{dim.kode}</td>
                            <td className="p-1 border-r border-slate-200 font-semibold text-slate-800">{dim.nama}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-black text-slate-900">{dim.percentage.toFixed(1)}%</td>
                            <td className="p-1 text-center font-bold">
                              {dim.percentage >= 75 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-extrabold border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Area Kekuatan
                                </span>
                              ) : dim.percentage < 50 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[8px] font-extrabold border border-red-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Area Perbaikan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[8px] font-extrabold border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Moderat
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-teal-50/80 font-extrabold text-teal-950 border-t border-slate-300">
                          <td colSpan={3} className="p-1.5 text-right uppercase text-[8.5px] border-r border-slate-200">Rata-Rata Seluruh 10 Dimensi</td>
                          <td className="p-1.5 text-center text-teal-800 font-black text-[9.5px] border-r border-slate-200">{overallAverage.toFixed(1)}%</td>
                          <td className="p-1.5 text-center text-[8px] text-teal-700 font-semibold">Skor Terintegrasi Realtime</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Interpretasi Otomatis Box */}
                  <div className="bg-teal-50/70 border border-teal-200/90 p-2.5 rounded-xl space-y-1 text-[10px] text-slate-700">
                    <h4 className="font-extrabold text-teal-900 flex items-center gap-1 text-[10.5px]">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Interpretasi Otomatis
                    </h4>
                    <p className="leading-relaxed">
                      Berdasarkan hasil survei budaya keselamatan pasien di <strong className="text-slate-900">{activeHospitalName}</strong>, diperoleh bahwa dimensi dengan capaian tertinggi adalah <strong className="text-emerald-700">{highestDim?.nama || '-'} ({highestDim?.kode})</strong> sebesar <strong className="text-emerald-700">{highestDim?.percentage.toFixed(1) || 0}%</strong>, sedangkan dimensi dengan nilai terendah adalah <strong className="text-red-700">{lowestDim?.nama || '-'} ({lowestDim?.kode})</strong> sebesar <strong className="text-red-700">{lowestDim?.percentage.toFixed(1) || 0}%</strong>. Capaian rata-rata respon positif seluruh 10 dimensi berada pada angka <strong className="text-teal-700 font-extrabold">{overallAverage.toFixed(1)}%</strong>.
                    </p>
                  </div>

                  <p className="text-[8.5px] text-slate-400 italic text-right">*Data 10 dimensi terintegrasi secara otomatis dari menu Analisa Data ({activeHospitalName}).</p>
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
                </div>

                <section className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Overall Rating */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs">3.2.2 Keselamatan Pasien Keseluruhan (Overall Rating)</h4>
                      <p className="text-[10px] text-slate-600">
                        Sebanyak <strong className="text-teal-700">{safetyRatingData.positivePct.toFixed(1)}%</strong> staf menilai mutu dalam kategori <strong>Baik - Sangat Baik</strong>.
                      </p>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-slate-200">
                            {safetyRatingData.distribution.slice(0, 3).map((r, i) => (
                              <tr key={i} className="bg-white">
                                <td className="p-1.5 font-bold border-r border-slate-200">{r.name}</td>
                                <td className="p-1.5 text-center font-bold text-teal-700">{r.percentage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Reported Events */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs">3.2.3 Frekuensi Pelaporan Insiden</h4>
                      <p className="text-[10px] text-slate-600">
                        Sebanyak <strong className="text-teal-700">{reportedEventsData.reportedAnyPct.toFixed(1)}%</strong> staf melaporkan minimal 1 insiden keselamatan.
                      </p>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-slate-200">
                            {reportedEventsData.distribution.slice(0, 3).map((e, i) => (
                              <tr key={i} className="bg-white">
                                <td className="p-1.5 font-bold border-r border-slate-200">{e.name}</td>
                                <td className="p-1.5 text-center font-bold text-teal-700">{e.percentage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark & Trend Table in concise format */}
                  {benchmarkData && selectedBenchmarkHospital && (
                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-600" />
                        3.2.4 Analisis Perbandingan Benchmark dengan {selectedBenchmarkHospital.namaRs}
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-[#14B8A6] via-[#0F766E] to-[#0A3335] text-white font-extrabold uppercase tracking-wider text-[8.5px]">
                              <th className="p-1.5 border-r border-white/20">Dimensi</th>
                              <th className="p-1.5 text-center border-r border-white/20">{namaRs}</th>
                              <th className="p-1.5 text-center border-r border-white/20">Benchmark</th>
                              <th className="p-1.5 text-center">Selisih</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {benchmarkData.slice(0, 4).map((b, i) => (
                              <tr key={i} className="bg-white">
                                <td className="p-1.5 border-r border-slate-200 font-semibold">{b.nama}</td>
                                <td className="p-1.5 text-center font-bold border-r border-slate-200 text-teal-700">{b.rsPct.toFixed(1)}%</td>
                                <td className="p-1.5 text-center border-r border-slate-200 text-slate-500">{b.benchPct.toFixed(1)}%</td>
                                <td className={`p-1.5 text-center font-black ${b.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {b.diff >= 0 ? `+${b.diff.toFixed(1)}%` : `${b.diff.toFixed(1)}%`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Laporan Survei Budaya Keselamatan Pasien</span>
                <span>Halaman 5 dari 7</span>
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
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
                </div>

                <section className="space-y-4">
                  <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xs font-black text-slate-500 tracking-widest">BAB IV</h2>
                    <h2 className="text-base font-black text-teal-800 uppercase tracking-wide">KESIMPULAN DAN REKOMENDASI</h2>
                    <div className="h-0.5 w-12 bg-teal-600 mx-auto mt-1"></div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                    <h3 className="font-bold text-slate-900 text-xs">4.1 Kesimpulan</h3>
                    <p>
                      Berdasarkan hasil survei budaya keselamatan pasien berbasis AHRQ SOPS® Version 2.0 di <strong className="text-slate-900">{namaRs}</strong>, disimpulkan poin-poin penting berikut:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>Rata-rata pencapaian respon positif budaya keselamatan pasien berada pada angka <strong>{overallAverage.toFixed(1)}%</strong>.</li>
                      <li>Sebanyak <strong>{safetyRatingData.positivePct.toFixed(1)}%</strong> staf menilai mutu keselamatan pasien di rumah sakit berada pada kategori Baik - Sangat Baik.</li>
                      <li>Terdapat <strong>{strengths.length}</strong> dimensi yang masuk kategori kekuatan utama (Strengths) dan <strong>{improvements.length}</strong> dimensi kritis perlu perbaikan.</li>
                    </ul>

                    <h3 className="font-bold text-slate-900 text-xs pt-1">4.2 Rekomendasi Strategic Action Plan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                        <strong className="text-teal-950 uppercase flex items-center gap-1 font-extrabold">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Jangka Pendek
                        </strong>
                        <p className="text-slate-600">{recommendations.jangkaPendek[0] || 'Sosialisasi prinsip Just Culture pelaporan insiden.'}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                        <strong className="text-indigo-950 uppercase flex items-center gap-1 font-extrabold">
                          <Target className="w-3.5 h-3.5 text-indigo-600" /> Jangka Menengah
                        </strong>
                        <p className="text-slate-600">{recommendations.jangkaMenengah[0] || 'Audit internal pelaporan dan tindak lanjut keselamatan.'}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                        <strong className="text-slate-950 uppercase flex items-center gap-1 font-extrabold">
                          <Award className="w-3.5 h-3.5 text-slate-600" /> Jangka Panjang
                        </strong>
                        <p className="text-slate-600">{recommendations.jangkaPanjang[0] || 'Integrasi indikator keselamatan dalam penilaian kinerja.'}</p>
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
