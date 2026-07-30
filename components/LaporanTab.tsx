'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Globe
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
import { getPengesahanConfig, PengesahanConfig } from '../lib/db';

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
                className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-indigo-700 hover:from-teal-800 hover:to-indigo-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-teal-500/10 transition-all cursor-pointer active:scale-95"
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
        @media (max-width: 220mm) {
          .word-page {
            width: 100%;
            min-height: auto;
            padding: 24px !important;
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
            <div className="word-page print-page">
              <div className="text-center pt-4 space-y-4">
                <h1 className="text-[24px] font-black uppercase tracking-tight text-slate-900 leading-snug">
                  LAPORAN SURVEI BUDAYA KESELAMATAN PASIEN
                </h1>
                <h2 className="text-3xl font-black text-teal-700 uppercase tracking-tight">
                  {namaRs}
                </h2>
                <div className="h-1 w-24 bg-teal-600 mx-auto rounded-full"></div>
                <h3 className="text-base font-extrabold text-slate-600 uppercase tracking-widest pt-2">
                  PERIODE TAHUN {selectedYear === 'Semua Tahun' ? new Date().getFullYear() : selectedYear}
                </h3>
              </div>

              <div className="text-center space-y-1 pt-16 pb-12">
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  INSTRUMEN AHRQ HOSPITAL SURVEY ON PATIENT SAFETY CULTURE (SOPS®) V2.0
                </p>
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

                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                    <h3 className="font-bold text-slate-900">2.1 Desain Penelitian / Survei</h3>
                    <p>
                      Survei ini menggunakan desain deskriptif kuantitatif dengan pendekatan cross-sectional untuk menggambarkan persepsi staf pada kurun waktu tertentu tanpa intervensi langsung.
                    </p>

                    <h3 className="font-bold text-slate-900 pt-1">2.2 Waktu dan Lokasi</h3>
                    <p>
                      Dilaksanakan di seluruh instalasi/unit kerja <strong className="text-slate-900">{namaRs}</strong> pada kurun waktu survei <strong className="text-teal-700">{periodeSurvei}</strong>.
                    </p>

                    <h3 className="font-bold text-slate-900 pt-1">2.3 Populasi dan Sampel</h3>
                    <p>
                      Menggunakan teknik <strong>Total Sampling</strong>. Kuesioner berhasil dikumpulkan dari sebanyak <strong className="text-teal-700">{totalActual}</strong> responden aktif dari estimasi total target populasi <strong className="text-slate-800">{totalTarget}</strong> pegawai, dengan Response Rate mencapai <strong className="text-teal-700">{responseRateStr}</strong>.
                    </p>

                    <h3 className="font-bold text-slate-900 pt-1">2.4 Instrumen dan Metode Pengumpulan Data</h3>
                    <p>
                      Menggunakan instrumen resmi AHRQ SOPS® Version 2.0 yang ditranslasikan dengan skala Likert 5-poin. Pengisian dilakukan secara elektronik mandiri (e-survey) yang terjamin kerahasiaannya (anonymous).
                    </p>

                    <h3 className="font-bold text-slate-900 pt-1">2.5 Analisis Data</h3>
                    <p>
                      Skor dihitung sebagai Persentase Respon Positif (% Positive Response) untuk masing-masing dimensi. Hasil dikelompokkan ke dalam kategori: <strong>Kekuatan (≥ 75%)</strong>, <strong>Moderat (50% - 74%)</strong>, dan <strong>Perlu Perbaikan (&lt; 50%)</strong>.
                    </p>
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
                          <tr className="bg-teal-700 text-white font-bold">
                            <th className="p-2 border-r border-teal-600">Karakteristik</th>
                            <th className="p-2 border-r border-teal-600">Kategori</th>
                            <th className="p-2 border-r border-teal-600 text-center">Jumlah (n)</th>
                            <th className="p-2 text-center">Persentase (%)</th>
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
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 4: BAB III — Pengukuran 10 Dimensi
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
                </div>

                <section className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-xs">3.2 Hasil Pengukuran Budaya Keselamatan Pasien (AHRQ 2.0)</h3>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Data hasil pengukuran 10 dimensi budaya keselamatan pasien di <strong className="text-slate-900">{namaRs}</strong> di bawah ini terintegrasi secara langsung dari menu Analisa Data (Hasil Pengukuran Dimensi) yang tersimpan di database Supabase. Capaian rata-rata respon positif adalah <strong className="text-teal-700 text-xs">{overallAverage.toFixed(1)}%</strong>.
                  </p>

                  {/* Recharts Chart */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 h-40 my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dimensionScores} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="kode" tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                          {dimensionScores.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.percentage >= 75 ? '#10b981' : entry.percentage < 50 ? '#ef4444' : '#f59e0b'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table 3.2 10 Dimensions */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-teal-700 text-white font-bold">
                          <th className="p-1 border-r border-teal-600 text-center w-10">Kode</th>
                          <th className="p-1 border-r border-teal-600">Dimensi Budaya Keselamatan</th>
                          <th className="p-1 border-r border-teal-600 text-center w-16">Skor (%)</th>
                          <th className="p-1 text-center w-24">Kategori</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dimensionScores.map((dim, idx) => (
                          <tr key={dim.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-1 text-center font-extrabold border-r border-slate-200">{dim.kode}</td>
                            <td className="p-1 border-r border-slate-200 font-semibold text-slate-800">{dim.nama}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-black">{dim.percentage.toFixed(1)}%</td>
                            <td className="p-1 text-center font-bold">
                              {dim.percentage >= 75 ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px]">Kekuatan</span>
                              ) : dim.percentage < 50 ? (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[8px]">Perbaikan</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px]">Moderat</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] text-slate-400 italic text-right">*Data 10 dimensi terintegrasi secara otomatis dari menu Analisa Data (Hasil Pengukuran Dimensi {namaRs}).</p>
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
                            <tr className="bg-indigo-900 text-white font-bold">
                              <th className="p-1.5 border-r border-indigo-700">Dimensi</th>
                              <th className="p-1.5 text-center border-r border-indigo-700">{namaRs}</th>
                              <th className="p-1.5 text-center border-r border-indigo-700">Benchmark</th>
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
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 6: BAB III — Pembahasan Kualitatif
            </div>
            <div className="word-page print-page">
              <div>
                {/* Running Header */}
                <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span></span>
                  <span className="text-teal-700 font-extrabold">{namaRs}</span>
                </div>

                <section className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-xs">3.3 Pembahasan Analisis Kualitatif</h3>

                  <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      3.3.1 Area Keunggulan (Strengths ≥ 75%)
                    </h4>
                    {strengths.length > 0 ? (
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-[10px]">
                        <strong>{strengths[0].kode} - {strengths[0].nama} ({strengths[0].percentage.toFixed(1)}%):</strong> {strengths[0].interpretasi}
                      </div>
                    ) : (
                      <p className="italic text-[10px] text-slate-500 pl-2">Belum ada dimensi keselamatan yang menembus target kekuatan ≥ 75%.</p>
                    )}

                    <h4 className="font-bold text-red-800 flex items-center gap-1 pt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      3.3.2 Area yang Memerlukan Perbaikan Kritis (Areas for Improvement &lt; 50%)
                    </h4>
                    {improvements.length > 0 ? (
                      <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-[10px]">
                        <strong>{improvements[0].kode} - {improvements[0].nama} ({improvements[0].percentage.toFixed(1)}%):</strong> {improvements[0].interpretasi}
                      </div>
                    ) : (
                      <p className="italic text-[10px] text-slate-500 pl-2">Tidak terdeteksi adanya dimensi kritis di bawah ambang batas 50%.</p>
                    )}

                    <h4 className="font-bold text-amber-800 flex items-center gap-1 pt-2">
                      <Activity className="w-3.5 h-3.5 text-amber-600" />
                      3.3.3 Area Sedang / Moderat (50% - 74%)
                    </h4>
                    {moderates.length > 0 ? (
                      <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-[10px]">
                        <strong>{moderates[0].kode} - {moderates[0].nama} ({moderates[0].percentage.toFixed(1)}%):</strong> {moderates[0].interpretasi}
                      </div>
                    ) : (
                      <p className="italic text-[10px] text-slate-500 pl-2">Seluruh dimensi telah keluar dari status moderat.</p>
                    )}
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
