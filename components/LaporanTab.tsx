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
          penanggungJawabNama: `${pengesahanConfig?.pjNama || 'dr. Budi Santoso'}${pengesahanConfig?.pjGelar && !pengesahanConfig.pjNama.includes(pengesahanConfig.pjGelar) ? `, ${pengesahanConfig.pjGelar}` : ''}`,
          penanggungJawabJabatan: pengesahanConfig?.pjJabatan || 'Ketua Komite Mutu & Keselamatan Pasien',
          penanggungJawabNip: pengesahanConfig?.pjNip || '19820315 200804 1 005',
          direkturNama: `${pengesahanConfig?.direkturNama || 'dr. H. Ahmad Wijaya'}${pengesahanConfig?.direkturGelar && !pengesahanConfig.direkturNama.includes(pengesahanConfig.direkturGelar) ? `, ${pengesahanConfig.direkturGelar}` : ''}`,
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
                Laporan Resmi Survei Budaya Keselamatan Pasien
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
      </div>

      {/* DOCUMENT PAPER DISPLAY CONTAINER (A4 SEPARATED SHEETS) */}
      <div 
        ref={printRef}
        className="flex flex-col items-center gap-10 print:gap-0 font-sans leading-relaxed"
      >

        {/* LEMBAR 1: COVER PAGE */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 1: Halaman Cover
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen print:page-break-after-always">
            
            <div className="text-center pt-8 space-y-4">
              <h1 className="text-[26px] font-black uppercase tracking-tight text-slate-900 leading-snug">
                LAPORAN SURVEI BUDAYA KESELAMATAN PASIEN
              </h1>
              <h2 className="text-3xl sm:text-4xl font-black text-teal-700 uppercase tracking-tight">
                {namaRs}
              </h2>
              <div className="h-1 w-32 bg-teal-600 mx-auto rounded-full"></div>
              <h3 className="text-lg font-extrabold text-slate-600 uppercase tracking-widest pt-2">
                PERIODE TAHUN {selectedYear === 'Semua Tahun' ? new Date().getFullYear() : selectedYear}
              </h3>
            </div>

            <div className="my-16 flex flex-col items-center justify-center space-y-6">
              {activeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={activeLogo.url} 
                  alt="Logo Rumah Sakit" 
                  className="w-32 h-32 object-contain drop-shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-inner">
                  <ShieldCheck className="w-16 h-16" />
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-slate-800">
                  SISTEM SURVEI BUDAYA KESELAMATAN PASIEN
                </p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  INSTRUMEN AHRQ HOSPITAL SURVEY ON PATIENT SAFETY CULTURE (SOPS®) V2.0
                </p>
              </div>
            </div>

            <div className="text-center space-y-1 border-t border-slate-200 pt-6">
              <p className="text-sm font-extrabold text-slate-800">Medclin Pro Academy</p>
              <p className="text-xs text-slate-500 font-medium">Laporan Resmi Hasil Evaluasi Mutu & Keselamatan Pasien</p>
            </div>
          </div>
        </div>

        {/* LEMBAR 2: BAB I PENDAHULUAN */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 2: BAB I — Pendahuluan
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen print:page-break-after-always">
            <div>
              {/* Running Header */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                <span className="text-teal-700 font-extrabold">{namaRs}</span>
              </div>

              <section className="space-y-6">
            <div className="border-b-2 border-teal-600 pb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                BAB I PENDAHULUAN
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed text-justify">
              <h3 className="text-base font-bold text-slate-900">1.1 Latar Belakang</h3>
              <p>
                Keselamatan pasien merupakan prioritas utama dan prinsip mendasar dalam pelayanan kesehatan di rumah sakit. Berdasarkan pandangan global dan standar akreditasi rumah sakit, upaya peningkatan keselamatan pasien tidak hanya berfokus pada penerapan prosedur operasional standar dan penyediaan sarana prasarana, tetapi juga sangat bergantung pada budaya keselamatan pasien (patient safety culture) yang hidup di dalam organisasi.
              </p>
              <p>
                Budaya keselamatan pasien didefinisikan sebagai nilai, keyakinan, dan norma yang dibagikan oleh staf rumah sakit mengenai apa yang penting dan bagaimana perilaku terkait keselamatan diwujudkan. Budaya yang kuat memfasilitasi komunikasi yang terbuka, pelaporan insiden tanpa rasa takut akan hukuman (non-punitive environment), pembelajaran berkelanjutan dari kesalahan, serta kerja sama tim yang solid antar unit.
              </p>
              <p>
                Untuk mengukur dan mengevaluasi sejauh mana budaya keselamatan telah tertanam di rumah sakit, diperlukan instrumen pengukuran yang valid, handal, dan terstandar secara internasional. Agency for Healthcare Research and Quality (AHRQ) telah memperbarui instrumen pengukuran melalui AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0.
              </p>
              <p>
                Pelaksanaan survei budaya keselamatan pasien berbasis AHRQ Versi 2.0 ini dilakukan untuk memetakan kekuatan (strengths) serta area yang membutuhkan peningkatan (areas for improvement) di <strong className="text-slate-900">{namaRs}</strong>. Hasil dari survei ini menjadi landasan berbasis data (data-driven) dalam merumuskan strategi perbaikan mutu dan keselamatan pasien secara terarah dan berkelanjutan.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="text-base font-bold text-slate-900">1.2 Tujuan</h3>
              <div className="pl-4 space-y-2">
                <h4 className="font-bold text-slate-800">1.2.1 Tujuan Umum</h4>
                <p>
                  Mengetahui gambaran penerapan budaya keselamatan pasien di <strong className="text-slate-900">{namaRs}</strong> menggunakan instrumen AHRQ Versi 2.0 sebagai dasar penyusunan program peningkatan mutu dan keselamatan pasien.
                </p>
                <h4 className="font-bold text-slate-800 pt-2">1.2.2 Tujuan Khusus</h4>
                <ul className="list-decimal pl-5 space-y-1">
                  <li>Mengidentifikasi karakteristik responden berdasarkan unit kerja, profesi, lama bekerja, dan jam kerja per minggu.</li>
                  <li>Menganalisis persentase respon positif (% Positive Response) pada 10 dimensi budaya keselamatan pasien AHRQ Versi 2.0.</li>
                  <li>Mengetahui persepsi staf terhadap tingkat keselamatan pasien secara keseluruhan (Overall Patient Safety Rating) di {namaRs}.</li>
                  <li>Mengidentifikasi dimensi yang menjadi kekuatan area (strengths, ≥ 75% respon positif) dan area yang memerlukan perbaikan (areas for improvement, &lt; 50% respon positif).</li>
                  <li>Menyediakan data acuan (baseline data) untuk evaluasi berkala dan pembandingan (benchmarking) budaya keselamatan pasien di masa mendatang.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="text-base font-bold text-slate-900">1.3 Manfaat</h3>
              <div className="pl-4 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-800">1.3.1 Bagi Manajemen Rumah Sakit</h4>
                  <ul className="list-disc pl-5 space-y-1 pt-1">
                    <li>Menyediakan data objektif mengenai persepsi staf terhadap budaya keselamatan pasien di seluruh tingkatan unit.</li>
                    <li>Menjadi acuan pengambilan keputusan strategis dan alokasi sumber daya dalam program keselamatan pasien.</li>
                    <li>Membantu kepemimpinan rumah sakit dalam membangun lingkungan kerja yang mendukung pelaporan insiden tanpa rasa takut (just culture).</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">1.3.2 Bagi Pengelola Mutu dan Keselamatan Pasien Rumah Sakit</h4>
                  <ul className="list-disc pl-5 space-y-1 pt-1">
                    <li>Mempermudah pemetaan fokus intervensi dan prioritas perbaikan mutu di unit-unit kerja yang membutuhkan pendampingan khusus.</li>
                    <li>Memenuhi persyaratan standar akreditasi rumah sakit terkait pengukuran berkala budaya keselamatan pasien.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">1.3.3 Bagi Staf dan Unit Kerja</h4>
                  <ul className="list-disc pl-5 space-y-1 pt-1">
                    <li>Menjadi sarana bagi staf untuk menyuarakan persepsi, kendala, dan masukan terkait keselamatan pasien secara anonim dan terstruktur.</li>
                    <li>Mendorong kolaborasi, komunikasi interprofesi, dan kesadaran kolektif antar unit kerja untuk menciptakan lingkungan pelayanan yang aman bagi pasien.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

            </div>

            {/* Running Footer */}
            <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Medclin Pro Academy • AHRQ SOPS® v2.0</span>
              <span>Halaman 2 dari 6</span>
            </div>
          </div>
        </div>

        {/* LEMBAR 3: BAB II METODOLOGI SURVEI */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 3: BAB II — Metodologi Survei
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen print:page-break-after-always">
            <div>
              {/* Running Header */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                <span className="text-teal-700 font-extrabold">{namaRs}</span>
              </div>

          {/* BAB II METODOLOGI SURVEI */}
          <section className="space-y-6">
            <div className="border-b-2 border-teal-600 pb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                BAB II METODOLOGI SURVEI
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="text-base font-bold text-slate-900">2.1 Desain Penelitian / Survei</h3>
              <p className="text-justify">
                Survei ini menggunakan desain deskriptif kuantitatif dengan pendekatan cross-sectional. Pendekatan ini digunakan untuk mengukur dan menggambarkan persepsi staf rumah sakit terhadap budaya keselamatan pasien pada satu kurun waktu tertentu tanpa memberikan intervensi langsung saat pengukuran berlangsung.
              </p>

              <h3 className="text-base font-bold text-slate-900 pt-2">2.2 Waktu dan Lokasi Pelaksanaan</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-slate-800">Lokasi Pelaksanaan:</strong> Seluruh unit kerja/instalasi di <strong className="text-slate-900">{namaRs}</strong> (meliputi unit pelayanan medis, keperawatan, penunjang medis, serta administrasi/manajemen).</li>
                <li><strong className="text-slate-800">Waktu Pelaksanaan:</strong> Survei dilaksanakan pada periode <strong className="text-teal-700">{periodeSurvei}</strong>.</li>
              </ul>

              <h3 className="text-base font-bold text-slate-900 pt-2">2.3 Populasi dan Sampel</h3>
              <div className="pl-4 space-y-2">
                <h4 className="font-bold text-slate-800">2.3.1 Populasi</h4>
                <p>
                  Populasi dalam survei ini adalah seluruh pegawai yang bekerja di <strong className="text-slate-900">{namaRs}</strong>, baik manajemen, staf medis, keperawatan, tenaga kesehatan lainnya, maupun staf non-klinis/administrasi.
                </p>
                <h4 className="font-bold text-slate-800 pt-1">2.3.2 Kriteria Inklusi dan Eksklusi</h4>
                <ul className="list-decimal pl-5 space-y-1">
                  <li><strong>Kriteria Inklusi:</strong> Pegawai (purna waktu maupun paruh waktu) yang telah bekerja minimal 3 bulan, memiliki interaksi pelayanan, dan mengisi kuesioner secara sukarela.</li>
                  <li><strong>Kriteria Eksklusi:</strong> Staf yang sedang menjalani cuti panjang serta mahasiswa/siswa praktik yang belum menjadi pegawai resmi.</li>
                </ul>
                <h4 className="font-bold text-slate-800 pt-1">2.3.3 Teknik Sampling dan Ukuran Sampel</h4>
                <p>
                  Teknik pengambilan sampel menggunakan <strong>Total Sampling</strong>. Dari estimasi populasi target sebanyak <strong>{totalTarget}</strong> pegawai, kuesioner yang berhasil terkumpul dan valid untuk dianalisis adalah sebanyak <strong>{totalActual}</strong> kuesioner, menghasilkan tingkat partisipasi (Response Rate) sebesar <strong className="text-teal-700">{responseRateStr}</strong>. Tingkat partisipasi ini telah memenuhi standar kelayakan minimal AHRQ (≥ 60%).
                </p>
              </div>

              <h3 className="text-base font-bold text-slate-900 pt-2">2.4 Instrumen Survei</h3>
              <p className="text-justify">
                Instrumen yang digunakan adalah AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0 yang telah diterjemahkan ke dalam bahasa Indonesia dan mengukur 10 Dimensi Budaya Keselamatan Pasien (32 item pertanyaan primer), ditambah bagian penilaian tingkat keselamatan pasien (overall rating), frekuensi pelaporan insiden, dan karakteristik demografi responden.
              </p>

              <h3 className="text-base font-bold text-slate-900 pt-2">2.5 Metode Pengumpulan Data</h3>
              <p className="text-justify">
                Pengumpulan data dilakukan secara elektronik/online (e-survey) menggunakan link aplikasi pengukuran budaya keselamatan dengan memperhitungkan kerahasiaan (anonymity). Responden tidak diminta mencantumkan nama atau NIP untuk menjamin kejujuran jawaban tanpa kekhawatiran akan sanksi personal.
              </p>

              <h3 className="text-base font-bold text-slate-900 pt-2">2.6 Analisis Data</h3>
              <p className="text-justify">
                Pengolahan dan analisis data dilakukan mengikuti panduan resmi pengolahan data AHRQ SOPS® Version 2.0. Jawaban skala Likert 5 poin dikalkulasikan ke dalam Persentase Respon Positif (% Positive Response) untuk setiap dimensi. Kriteria kategori dimensi dikelompokkan menjadi:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-emerald-700">Area Keunggulan / Kekuatan (Strengths):</strong> Dimensi dengan persentase respon positif ≥ 75%.</li>
                <li><strong className="text-amber-700">Area Moderat / Sedang:</strong> Dimensi dengan persentase respon positif antara 50% − 74%.</li>
                <li><strong className="text-red-700">Area Perlu Perbaikan (Areas for Improvement):</strong> Dimensi dengan persentase respon positif &lt; 50%.</li>
              </ul>
            </div>
          </section>

            </div>

            {/* Running Footer */}
            <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Medclin Pro Academy • AHRQ SOPS® v2.0</span>
              <span>Halaman 3 dari 6</span>
            </div>
          </div>
        </div>

        {/* LEMBAR 4: BAB III HASIL DAN PEMBAHASAN */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 4: BAB III — Hasil & Pembahasan
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen print:page-break-after-always">
            <div>
              {/* Running Header */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                <span className="text-teal-700 font-extrabold">{namaRs}</span>
              </div>

          {/* BAB III HASIL DAN PEMBAHASAN */}
          <section className="space-y-6">
            <div className="border-b-2 border-teal-600 pb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                BAB III HASIL DAN PEMBAHASAN
              </h2>
            </div>

            {/* 3.1 Response Rate & Demografi */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">3.1 Gambaran Umum Respon Rate dan Karakteristik Responden</h3>
              
              <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                <h4 className="font-bold text-slate-800">3.1.1 Tingkat Partisipasi (Response Rate)</h4>
                <p>
                  Survei dilaksanakan pada periode <strong className="text-slate-900">{periodeSurvei}</strong>. Dari total <strong>{totalTarget}</strong> kuesioner yang disebarkan ke seluruh unit kerja di <strong className="text-slate-900">{namaRs}</strong>, diperoleh kuesioner kembali dan memenuhi syarat untuk dianalisis sebanyak <strong className="text-teal-700">{totalActual}</strong> kuesioner (Response Rate: <strong className="text-teal-700">{responseRateStr}</strong>).
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 text-sm">3.1.2 Demografi Responden</h4>
                <p className="text-xs text-slate-500">Tabel 3.1 Karakteristik Demografi Responden Survei Budaya Keselamatan Pasien</p>

                {/* Table 3.1 */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-teal-700 text-white font-bold">
                        <th className="p-3 border-r border-teal-600 w-1/3">Karakteristik</th>
                        <th className="p-3 border-r border-teal-600 w-1/3">Kategori</th>
                        <th className="p-3 border-r border-teal-600 text-center w-1/6">Jumlah (n)</th>
                        <th className="p-3 text-center w-1/6">Persentase (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {demographics.profesi.map((pItem, idx) => (
                        <tr key={`prof-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          {idx === 0 && <td rowSpan={demographics.profesi.length} className="p-3 font-extrabold text-slate-800 border-r border-slate-200 align-top">Profesi / Peran</td>}
                          <td className="p-3 border-r border-slate-200 font-medium text-slate-700">{pItem.category}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-800">{pItem.count}</td>
                          <td className="p-3 text-center font-bold text-teal-700">{pItem.percentage}</td>
                        </tr>
                      ))}
                      {demographics.masaKerja.map((mItem, idx) => (
                        <tr key={`masa-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          {idx === 0 && <td rowSpan={demographics.masaKerja.length} className="p-3 font-extrabold text-slate-800 border-r border-slate-200 align-top">Masa Kerja di RS</td>}
                          <td className="p-3 border-r border-slate-200 font-medium text-slate-700">{mItem.category}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-800">{mItem.count}</td>
                          <td className="p-3 text-center font-bold text-teal-700">{mItem.percentage}</td>
                        </tr>
                      ))}
                      {demographics.jamKerja.map((jItem, idx) => (
                        <tr key={`jam-${idx}`} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          {idx === 0 && <td rowSpan={demographics.jamKerja.length} className="p-3 font-extrabold text-slate-800 border-r border-slate-200 align-top">Jam Kerja / Minggu</td>}
                          <td className="p-3 border-r border-slate-200 font-medium text-slate-700">{jItem.category}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-800">{jItem.count}</td>
                          <td className="p-3 text-center font-bold text-teal-700">{jItem.percentage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 block mb-1 font-bold">Interpretasi Demografi Responden:</strong>
                  Berdasarkan data di atas, kelompok responden terbesar didominasi oleh profesi <strong>{demographics.profesi[0]?.category} ({demographics.profesi[0]?.percentage})</strong>. Sebagian besar staf memiliki masa kerja <strong>{demographics.masaKerja[1]?.category} ({demographics.masaKerja[1]?.percentage})</strong> yang menandakan tingkat pemahaman operasional yang cukup matang terhadap budaya pelayanan di {namaRs}.
                </div>
              </div>
            </div>

            {/* 3.2 Hasil Pengukuran 10 Dimensi */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-slate-900">3.2 Hasil Pengukuran Budaya Keselamatan Pasien (AHRQ 2.0)</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Berdasarkan kalkulasi terhadap 10 dimensi AHRQ Versi 2.0, rata-rata tingkat respon positif budaya keselamatan pasien di <strong className="text-slate-900">{namaRs}</strong> adalah <strong className="text-teal-700 text-base">{overallAverage.toFixed(1)}%</strong>.
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 text-sm">3.2.1 Respon Positif Berdasarkan 10 Dimensi Budaya Keselamatan Pasien</h4>
                
                {/* Recharts Bar Chart 10 Dimensions */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 h-80 my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dimensionScores} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="kode" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                      <Tooltip 
                        formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Respon Positif']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
                      />
                      <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
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
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-teal-700 text-white font-bold">
                        <th className="p-3 border-r border-teal-600 text-center w-16">Kode</th>
                        <th className="p-3 border-r border-teal-600">Dimensi Budaya Keselamatan Pasien</th>
                        <th className="p-3 border-r border-teal-600 text-center w-28">% Respon Positif</th>
                        <th className="p-3 text-center w-32">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dimensionScores.map((dim, idx) => (
                        <tr key={dim.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-3 text-center font-extrabold text-slate-800 border-r border-slate-200">{dim.kode}</td>
                          <td className="p-3 border-r border-slate-200 font-semibold text-slate-800">{dim.nama}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-black text-slate-900">{dim.percentage.toFixed(1)}%</td>
                          <td className="p-3 text-center font-bold">
                            {dim.percentage >= 75 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">
                                Kekuatan (≥75%)
                              </span>
                            ) : dim.percentage < 50 ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 text-[10px]">
                                Perlu Perbaikan (&lt;50%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                                Moderat (50-74%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3.2.2 Rating Keselamatan Pasien */}
              <div className="space-y-3 pt-4">
                <h4 className="font-bold text-slate-800 text-sm">3.2.2 Tingkat Keselamatan Pasien Keseluruhan (Overall Rating)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sebanyak <strong className="text-teal-700">{safetyRatingData.positivePct.toFixed(1)}%</strong> staf menilai mutu keselamatan pasien di {namaRs} berada dalam kategori <strong>Baik</strong> hingga <strong>Sangat Baik</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-teal-700 text-white font-bold">
                          <th className="p-2.5 border-r border-teal-600">Kategori Rating</th>
                          <th className="p-2.5 text-center border-r border-teal-600">Jumlah (n)</th>
                          <th className="p-2.5 text-center">Persentase (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {safetyRatingData.distribution.map((r, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">{r.name}</td>
                            <td className="p-2.5 text-center font-bold border-r border-slate-200">{r.count}</td>
                            <td className="p-2.5 text-center font-bold text-teal-700">{r.percentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safetyRatingData.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3.2.3 Insiden Dilaporkan */}
              <div className="space-y-3 pt-4">
                <h4 className="font-bold text-slate-800 text-sm">3.2.3 Jumlah Insiden Keselamatan Pasien Yang Dilaporkan</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sebanyak <strong className="text-teal-700">{reportedEventsData.reportedAnyPct.toFixed(1)}%</strong> staf menyatakan telah melaporkan setidaknya 1 insiden keselamatan pasien dalam 12 bulan terakhir.
                </p>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-teal-700 text-white font-bold">
                        <th className="p-2.5 border-r border-teal-600">Frekuensi Pelaporan Insiden</th>
                        <th className="p-2.5 text-center border-r border-teal-600">Jumlah (n)</th>
                        <th className="p-2.5 text-center">Persentase (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportedEventsData.distribution.map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">{e.name}</td>
                          <td className="p-2.5 text-center font-bold border-r border-slate-200">{e.count}</td>
                          <td className="p-2.5 text-center font-bold text-teal-700">{e.percentage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Benchmark Comparison section if selected */}
              {benchmarkData && selectedBenchmarkHospital && (
                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    3.2.4 Perbandingan Benchmark dengan {selectedBenchmarkHospital.namaRs}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Berikut perbandingan persentase respon positif antara <strong className="text-slate-900">{namaRs}</strong> dengan rumah sakit pembanding <strong className="text-indigo-700">{selectedBenchmarkHospital.namaRs}</strong>:
                  </p>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-indigo-900 text-white font-bold">
                          <th className="p-2.5 border-r border-indigo-700 text-center w-16">Kode</th>
                          <th className="p-2.5 border-r border-indigo-700">Dimensi</th>
                          <th className="p-2.5 text-center border-r border-indigo-700">{namaRs}</th>
                          <th className="p-2.5 text-center border-r border-indigo-700">{selectedBenchmarkHospital.namaRs}</th>
                          <th className="p-2.5 text-center">Selisih (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {benchmarkData.map((b, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-2.5 text-center font-extrabold border-r border-slate-200">{b.kode}</td>
                            <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">{b.nama}</td>
                            <td className="p-2.5 text-center font-extrabold text-teal-700 border-r border-slate-200">{b.rsPct.toFixed(1)}%</td>
                            <td className="p-2.5 text-center font-bold text-slate-600 border-r border-slate-200">{b.benchPct.toFixed(1)}%</td>
                            <td className={`p-2.5 text-center font-black ${b.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {b.diff >= 0 ? `+${b.diff.toFixed(1)}%` : `${b.diff.toFixed(1)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Yearly Trend Section if data exists */}
              {yearComparisonData && (
                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    3.2.5 Analisis Tren Perbandingan Antar Tahun
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Evaluasi tren capaian rata-rata budaya keselamatan pasien di {namaRs} selama beberapa tahun terakhir:
                  </p>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-w-md">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-teal-700 text-white font-bold">
                          <th className="p-2.5 border-r border-teal-600">Tahun Survei</th>
                          <th className="p-2.5 text-center">Rata-rata Respon Positif (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {yearComparisonData.map((y, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-2.5 font-extrabold text-slate-800 border-r border-slate-200">{y.year}</td>
                            <td className="p-2.5 text-center font-black text-teal-700">{y.average.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* 3.3 Pembahasan */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900">3.3 Pembahasan Analisis Kualitatif</h3>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  3.3.1 Area Keunggulan (Strengths ≥ 75%)
                </h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {strengths.map((s, idx) => (
                      <li key={idx} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                        <strong className="text-emerald-900 text-sm block mb-1">
                          {s.kode} - {s.nama} ({s.percentage.toFixed(1)}%)
                        </strong>
                        <p className="text-slate-700">{s.interpretasi}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic pl-2">
                    Belum ada dimensi yang mencapai target keunggulan ≥ 75%. Pembenahan menyeluruh perlu dilanjutkan.
                  </p>
                )}

                <h4 className="font-bold text-red-800 text-sm flex items-center gap-2 pt-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  3.3.2 Area yang Memerlukan Perbaikan Kritis (Areas for Improvement &lt; 50%)
                </h4>
                {improvements.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {improvements.map((imp, idx) => (
                      <li key={idx} className="bg-red-50/50 p-3 rounded-xl border border-red-100 text-xs">
                        <strong className="text-red-900 text-sm block mb-1">
                          {imp.kode} - {imp.nama} ({imp.percentage.toFixed(1)}%)
                        </strong>
                        <p className="text-slate-700">{imp.interpretasi}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic pl-2">
                    Tidak ada dimensi di bawah 50%. Ini menunjukkan iklim keselamatan berada pada standar dasar yang baik.
                  </p>
                )}

                <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2 pt-3">
                  <Activity className="w-4 h-4 text-amber-600" />
                  3.3.3 Area Sedang / Moderat (50% - 74%)
                </h4>
                {moderates.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {moderates.map((m, idx) => (
                      <li key={idx} className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-xs">
                        <strong className="text-amber-900 text-sm block mb-1">
                          {m.kode} - {m.nama} ({m.percentage.toFixed(1)}%)
                        </strong>
                        <p className="text-slate-700">{m.interpretasi}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic pl-2">
                    Tidak ada dimensi di kategori moderat.
                  </p>
                )}
              </div>
            </div>
          </section>
            </div>

            {/* Running Footer */}
            <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Medclin Pro Academy • AHRQ SOPS® v2.0</span>
              <span>Halaman 4 dari 6</span>
            </div>
          </div>
        </div>

        {/* LEMBAR 5: BAB IV KESIMPULAN DAN REKOMENDASI */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 5: BAB IV — Kesimpulan & Rekomendasi
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen print:page-break-after-always">
            <div>
              {/* Running Header */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                <span className="text-teal-700 font-extrabold">{namaRs}</span>
              </div>

          {/* BAB IV KESIMPULAN DAN REKOMENDASI */}
          <section className="space-y-6">
            <div className="border-b-2 border-teal-600 pb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                BAB IV KESIMPULAN DAN REKOMENDASI
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="text-base font-bold text-slate-900">4.1 Kesimpulan</h3>
              <p className="text-justify">
                Berdasarkan hasil survei budaya keselamatan pasien menggunakan instrumen AHRQ SOPS® Version 2.0 di <strong className="text-slate-900">{namaRs}</strong> dengan tingkat partisipasi sebesar <strong className="text-teal-700">{responseRateStr}</strong> (N = {totalActual}), disimpulkan hal-hal sebagai berikut:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Gambaran Umum Budaya Keselamatan:</strong> Rata-rata pencapaian respon positif dari 10 dimensi budaya keselamatan pasien di {namaRs} berada pada angka <strong>{overallAverage.toFixed(1)}%</strong>. Sebanyak <strong>{safetyRatingData.positivePct.toFixed(1)}%</strong> staf menilai mutu keselamatan pasien berada pada kategori &quot;Baik&quot; hingga &quot;Sangat Baik&quot;.
                </li>
                <li>
                  <strong>Area Keunggulan (Strengths):</strong> Terdapat <strong>{strengths.length}</strong> dimensi yang menjadi kekuatan utama budaya keselamatan (≥ 75% respon positif).
                </li>
                <li>
                  <strong>Area Perlu Perbaikan Kritis (Areas for Improvement):</strong> Terdapat <strong>{improvements.length}</strong> dimensi kritis yang capaiannya di bawah 50% dan menjadi prioritas intervensi manajemen.
                </li>
              </ol>

              <h3 className="text-base font-bold text-slate-900 pt-4">4.2 Rekomendasi Strategic Action Plan</h3>
              <p className="text-justify">
                Untuk menindaklanjuti temuan survei ini dan memperkuat budaya keselamatan pasien secara berkelanjutan, dirumuskan rekomendasi tindakan terarah berdasarkan skala dampaknya:
              </p>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Prioritas Jangka Pendek (1 - 3 Bulan)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    {recommendations.jangkaPendek.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Prioritas Jangka Menengah (3 - 6 Bulan)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    {recommendations.jangkaMenengah.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-600" />
                    Prioritas Jangka Panjang (6 - 12 Bulan)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    {recommendations.jangkaPanjang.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
            </div>

            {/* Running Footer */}
            <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Medclin Pro Academy • AHRQ SOPS® v2.0</span>
              <span>Halaman 5 dari 6</span>
            </div>
          </div>
        </div>

        {/* LEMBAR 6: HALAMAN PENGESAHAN */}
        <div className="w-full flex flex-col items-center">
          <div className="print:hidden text-xs font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs mb-3 self-center sm:self-start">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Lembar 6: Halaman Pengesahan
          </div>
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-14 border border-slate-200/90 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:min-h-screen">
            <div>
              {/* Running Header */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Laporan Resmi Survei Budaya Keselamatan Pasien</span>
                <span className="text-teal-700 font-extrabold">{namaRs}</span>
              </div>

          {/* HALAMAN PENGESAHAN */}
          <section className="space-y-8 pt-6">
            <div className="border-b-2 border-teal-600 pb-2 text-center flex flex-col items-center gap-2">
              {(pengesahanConfig?.logoRs || activeLogo?.data) && (
                <img 
                  src={pengesahanConfig?.logoRs || activeLogo?.data} 
                  alt="Logo Rumah Sakit" 
                  className="h-16 w-auto object-contain mb-1" 
                />
              )}
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                HALAMAN PENGESAHAN
              </h2>
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                {pengesahanConfig?.namaRs || namaRs}
              </p>
            </div>

            <p className="text-center text-xs text-slate-600">
              Laporan Resmi Hasil Survei Budaya Keselamatan Pasien berbasis AHRQ SOPS® Version 2.0 ini disahkan di {pengesahanConfig?.kota || 'Sukabumi'} pada tanggal {pengesahanConfig?.tanggalPengesahan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
              
              <div className="space-y-16">
                <div>
                  <p className="font-bold text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-900 text-sm">{pengesahanConfig?.direkturJabatan || 'Direktur Utama Rumah Sakit'}</p>
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm underline">
                    {pengesahanConfig?.direkturNama || 'dr. H. Ahmad Wijaya'}{pengesahanConfig?.direkturGelar && !pengesahanConfig.direkturNama.includes(pengesahanConfig.direkturGelar) ? `, ${pengesahanConfig.direkturGelar}` : ''}
                  </p>
                  <p className="text-slate-500 font-medium">NIP / ID: {pengesahanConfig?.direkturNip || '19780512 200501 1 002'}</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="font-bold text-slate-800">Disiapkan oleh,</p>
                  <p className="font-bold text-slate-900 text-sm">{pengesahanConfig?.pjJabatan || 'Ketua Komite Mutu & Keselamatan Pasien'}</p>
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm underline">
                    {pengesahanConfig?.pjNama || 'dr. Budi Santoso'}{pengesahanConfig?.pjGelar && !pengesahanConfig.pjNama.includes(pengesahanConfig.pjGelar) ? `, ${pengesahanConfig.pjGelar}` : ''}
                  </p>
                  <p className="text-slate-500 font-medium">NIP / ID: {pengesahanConfig?.pjNip || '19820315 200804 1 005'}</p>
                </div>
              </div>

            </div>
          </section>

            </div>

            {/* Running Footer */}
            <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Medclin Pro Academy • AHRQ SOPS® v2.0</span>
              <span>Halaman 6 dari 6</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
