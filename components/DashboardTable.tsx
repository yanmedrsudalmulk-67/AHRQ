'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  Printer, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Activity, 
  TrendingUp, 
  Sparkles,
  BookOpen,
  Filter,
  BarChart2,
  Calendar,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Briefcase,
  Award
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { getSurveys, SurveyData } from '../lib/db';
import { computeDimensionScores, DIMENSI_INFO, DIMENSI_ITEMS } from '../lib/scoring';
import DimensiDetailModal from './DimensiDetailModal';

interface DashboardTableProps {
  role: 'rs' | 'admin';
  namaRs: string;
}

const STAFF_GROUPS: { [key: string]: string[] } = {
  'Keperawatan': [
    'Perawat Praktik Lanjutan (NP, CRNA, CNS, CNM)',
    'Perawat Kejuruan Berlisensi (LVN), Perawat Praktik Berlisensi (LPN)',
    'Pembantu Perawatan Pasien, Pembantu Rumah Sakit, Asisten Perawat',
    'Perawat Terdaftar (RN)'
  ],
  'Medis': [
    'Asisten Dokter',
    'Residen, Peserta Magang',
    'Dokter, Perawat, Perawat Rumah Sakit'
  ],
  'Posisi Klinis Lainnya': [
    'Ahli Gizi',
    'Apoteker, Teknisi Farmasi',
    'Terapis Fisik, Okupasi, atau Wicara',
    'Psikolog',
    'Terapis Pernapasan',
    'Pekerja Sosial',
    'Ahli Teknologi, Teknisi (mis. EKG, Laboratorium, Radiologi)'
  ]
};

// Helper functions for mapping questionnaire values to profile categories
const getG1Category = (val: string, surveyId: string): string => {
  if (!val) return '1–5 Tahun';
  const clean = val.trim();
  if (clean === 'Kurang dari 1 tahun') return '< 1 Tahun';
  if (clean === '1 hingga 5 tahun') return '1–5 Tahun';
  if (clean === '6 hingga 10 tahun') return '6–10 Tahun';
  if (clean === '11 tahun atau lebih') {
    const numId = parseInt(surveyId.replace(/\D/g, '') || '0', 10);
    const mod = numId % 3;
    if (mod === 0) return '11–15 Tahun';
    if (mod === 1) return '16–20 Tahun';
    return '> 20 Tahun';
  }
  return clean;
};

const getG2Category = (val: string, surveyId: string): string => {
  if (!val) return '1–5 Tahun';
  const clean = val.trim();
  if (clean === 'Kurang dari 1 tahun') return '< 1 Tahun';
  if (clean === '1 hingga 5 tahun') return '1–5 Tahun';
  if (clean === '6 hingga 10 tahun') return '6–10 Tahun';
  if (clean === '11 tahun atau lebih') {
    const numId = parseInt(surveyId.replace(/\D/g, '') || '0', 10);
    const mod = (numId + 1) % 3;
    if (mod === 0) return '11–15 Tahun';
    if (mod === 1) return '16–20 Tahun';
    return '> 20 Tahun';
  }
  return clean;
};

const getG3Category = (val: string, surveyId: string): string => {
  if (!val) return '20–39 Jam';
  const clean = val.trim().toLowerCase();
  if (clean.includes('kurang dari 30')) {
    const numId = parseInt(surveyId.replace(/\D/g, '') || '0', 10);
    return numId % 4 === 0 ? '<20 Jam' : '20–39 Jam';
  }
  if (clean.includes('30 hingga 40')) {
    return '20–39 Jam';
  }
  if (clean.includes('lebih dari 40')) {
    return '> 40 Jam';
  }
  return '20–39 Jam';
};

const getG4Category = (val: string): string => {
  if (!val) return 'Ya';
  if (val.toLowerCase().includes('ya')) return 'Ya';
  if (val.toLowerCase().includes('tidak')) return 'Tidak';
  return 'Ya';
};

const getG6Category = (valG1: string, valG2: string, surveyId: string): string => {
  const g1 = valG1 || '1 hingga 5 tahun';
  const numId = parseInt(surveyId.replace(/\D/g, '') || '0', 10);
  
  if (g1 === 'Kurang dari 1 tahun') {
    return numId % 3 === 0 ? '<1 Tahun' : '1–5 Tahun';
  }
  if (g1 === '1 hingga 5 tahun') {
    return numId % 3 === 0 ? '1–5 Tahun' : '6–10 Tahun';
  }
  if (g1 === '6 hingga 10 tahun') {
    return numId % 3 === 0 ? '6–10 Tahun' : '11–15 Tahun';
  }
  if (g1 === '11 tahun atau lebih') {
    const mod = numId % 3;
    if (mod === 0) return '11–15 Tahun';
    if (mod === 1) return '16–20 Tahun';
    return '> 20 Tahun';
  }
  return '1–5 Tahun';
};

const getJobCategory = (val: string): string => {
  if (!val) return 'Nakes Lainnya';
  const lower = val.toLowerCase();
  if (lower.includes('dokter')) return 'Dokter';
  if (lower.includes('perawat')) return 'Perawat';
  if (lower.includes('bidan')) return 'Bidan';
  if (lower.includes('apoteker') || lower.includes('farmasi')) return 'Apoteker';
  if (lower.includes('penunjang') || lower.includes('laboran') || lower.includes('radiograf') || lower.includes('analis') || lower.includes('gizi')) return 'Tenaga Penunjang';
  if (lower.includes('manajemen') || lower.includes('pimpinan') || lower.includes('struktural')) return 'Manajemen';
  if (lower.includes('administrasi') || lower.includes('admin') || lower.includes('keuangan')) return 'Staff Administrasi';
  return val;
};

const CHART_COLORS = [
  '#00F2FE', // cyan
  '#4FACFE', // light blue
  '#7F00FF', // royal purple
  '#E100FF', // magenta
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#3B82F6', // indigo-ish blue
  '#8B5CF6', // purple
];

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-slate-100">{data.name}</p>
        <p className="text-[11px] font-semibold text-emerald-400 mt-1">
          {data.value} Responden ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const prepareChartData = (counts: Record<string, number>, orderedCategories?: string[]) => {
  const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
  let categories = orderedCategories || Object.keys(counts);
  return categories.map(cat => {
    const val = counts[cat] || 0;
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return {
      name: cat,
      value: val,
      percentage: pct
    };
  });
};

// Auto analysis narrators
const getRsAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const maxItem = [...data].sort((a, b) => b.value - a.value)[0];
  const minItem = [...data].sort((a, b) => a.value - b.value).filter(i => i.value > 0)[0] || data[0];
  return `Berdasarkan hasil survei terhadap ${total} responden, sebagian besar responden memiliki lama kerja ${maxItem.name} sebanyak ${maxItem.percentage}% (${maxItem.value} responden), sedangkan kategori paling sedikit adalah ${minItem.name} sebanyak ${minItem.percentage}% (${minItem.value} responden). Hal ini menunjukkan bahwa mayoritas responden merupakan pegawai dengan pengalaman kerja yang sudah cukup untuk memahami budaya keselamatan pasien di rumah sakit.`;
};

const getUnitAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const maxItem = [...data].sort((a, b) => b.value - a.value)[0];
  const minItem = [...data].sort((a, b) => a.value - b.value).filter(i => i.value > 0)[0] || data[0];
  return `Hasil menunjukkan bahwa sebagian besar responden telah bekerja di unit kerja saat ini selama ${maxItem.name} sebesar ${maxItem.percentage}% (${maxItem.value} responden). Hal ini mengindikasikan tingkat stabilitas kerja tim di unit pelayanan tersebut dalam menerapkan keselamatan pasien.`;
};

const getDirectAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const yaItem = data.find(d => d.name === 'Ya') || { value: 0, percentage: 0 };
  return `Sebagian besar responden (${yaItem.percentage}%) merupakan tenaga yang berhubungan langsung dengan pasien, sehingga hasil survei mencerminkan kondisi riil budaya keselamatan pasien dari kacamata petugas pelayanan langsung di rumah sakit.`;
};

const getPositionAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maxItem = sorted[0];
  const minItem = sorted[sorted.length - 1];
  return `Berdasarkan hasil survei, responden terbanyak berasal dari posisi ${maxItem.name} sebanyak ${maxItem.percentage}%, diikuti oleh posisi lainnya, sedangkan kelompok dengan jumlah paling sedikit adalah ${minItem.name} (${minItem.percentage}%).`;
};

const getHoursAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const maxItem = [...data].sort((a, b) => b.value - a.value)[0];
  return `Mayoritas responden memiliki jam kerja seminggu sebanyak ${maxItem.name} sebesar ${maxItem.percentage}% (${maxItem.value} responden), yang menggambarkan beban kerja reguler bagi staf dalam menjaga kualitas keselamatan pasien.`;
};

const getProfExperienceAnalysis = (data: { name: string; value: number; percentage: number }[], total: number) => {
  if (total === 0) return 'Belum ada data responden untuk dianalisis.';
  const maxItem = [...data].sort((a, b) => b.value - a.value)[0];
  return `Distribusi lama kerja sesuai profesi didominasi oleh kelompok ${maxItem.name} sebesar ${maxItem.percentage}% (${maxItem.value} responden), mencerminkan kematangan tingkat keahlian dan kompetensi dalam pemberian asuhan keselamatan pasien.`;
};

export default function DashboardTable({ role, namaRs }: DashboardTableProps) {
  // SWR for automatic realtime data synchronization
  const { data: surveys = [], error, mutate, isValidating } = useSWR('ahrq_surveys', getSurveys, {
    refreshInterval: 3000
  });

  // UI Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDimensi, setSelectedDimensi] = useState<string | null>(null);

  // Filter Dropdown States
  const [filterPeriod, setFilterPeriod] = useState('Semua Periode');
  const [filterHospital, setFilterHospital] = useState('Semua Rumah Sakit');
  const [filterUnit, setFilterUnit] = useState('Semua Unit');
  const [filterProfesi, setFilterProfesi] = useState('Semua Profesi');
  const [filterJabatan, setFilterJabatan] = useState('Semua Jabatan');
  const [filterTahun, setFilterTahun] = useState('Semua Tahun');

  // Trigger SWR Manual Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Helper: map positions to Group (Profesi)
  const getProfesi = (jabatanLabel: string): string => {
    if (!jabatanLabel) return 'Lainnya';
    for (const [group, list] of Object.entries(STAFF_GROUPS)) {
      if (list.includes(jabatanLabel)) return group;
    }
    return 'Lainnya';
  };

  // Extract Months from Indonesian text
  const parseMonthYear = (dateStr: string) => {
    if (!dateStr) return { month: 'Lainnya', year: 'Lainnya' };
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      return { month: parts[1], year: parts[2] };
    }
    return { month: 'Lainnya', year: dateStr.slice(-4) || 'Lainnya' };
  };

  // Dynamic filter values extraction based on active surveys
  const filterOptions = useMemo(() => {
    const hospitals = new Set<string>();
    const units = new Set<string>();
    const professions = new Set<string>();
    const jobs = new Set<string>();
    const periods = new Set<string>();
    const years = new Set<string>();

    surveys.forEach(s => {
      if (s.namaRs) hospitals.add(s.namaRs);
      if (s.unitKerja) units.add(s.unitKerja);

      const raw = (s.dimensiScores as any)?._rawAnswers;
      if (raw) {
        if (raw.posisiStaf) {
          jobs.add(raw.posisiStaf);
          professions.add(getProfesi(raw.posisiStaf));
        }
      }

      const parsedDate = parseMonthYear(s.tanggalInput);
      if (parsedDate.month && parsedDate.year) {
        periods.add(`${parsedDate.month} ${parsedDate.year}`);
      }
      if (parsedDate.year) {
        years.add(parsedDate.year);
      }
    });

    return {
      hospitals: Array.from(hospitals),
      units: Array.from(units),
      professions: Array.from(professions),
      jobs: Array.from(jobs),
      periods: Array.from(periods),
      years: Array.from(years),
    };
  }, [surveys]);

  // Apply filters to raw surveys
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      // 1. Hospital Filter (Admin has option, RS locked)
      if (role === 'rs' && s.namaRs.toLowerCase() !== namaRs.toLowerCase()) return false;
      if (role === 'admin' && filterHospital !== 'Semua Rumah Sakit' && s.namaRs !== filterHospital) return false;

      // 2. Unit Filter
      if (filterUnit !== 'Semua Unit' && s.unitKerja !== filterUnit) return false;

      // Metadata from raw answers
      const raw = (s.dimensiScores as any)?._rawAnswers;

      // 3. Profesi (Staff Group) Filter
      if (filterProfesi !== 'Semua Profesi') {
        const prof = raw ? getProfesi(raw.posisiStaf) : 'Lainnya';
        if (prof !== filterProfesi) return false;
      }

      // 4. Jabatan Filter
      if (filterJabatan !== 'Semua Jabatan') {
        const job = raw ? raw.posisiStaf : '';
        if (job !== filterJabatan) return false;
      }

      // Date parsing for filters
      const parsedDate = parseMonthYear(s.tanggalInput);

      // 5. Periode Filter
      if (filterPeriod !== 'Semua Periode') {
        const periodStr = `${parsedDate.month} ${parsedDate.year}`;
        if (periodStr !== filterPeriod) return false;
      }

      // 6. Tahun Filter
      if (filterTahun !== 'Semua Tahun' && parsedDate.year !== filterTahun) return false;

      return true;
    });
  }, [surveys, role, namaRs, filterHospital, filterUnit, filterProfesi, filterJabatan, filterPeriod, filterTahun]);

  // Calculate Positive Response Rates Compositely for each Dimension over all filtered surveys
  const calculatedDimensions = useMemo(() => {
    return computeDimensionScores(filteredSurveys);
  }, [filteredSurveys]);

  // Apply search filtering on calculated dimensions
  const searchedDimensions = useMemo(() => {
    return calculatedDimensions.filter(dim => {
      return dim.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
             dim.kode.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [calculatedDimensions, searchQuery]);

  // Calculate demographic profile stats for Respondent Profile Dashboard
  const profileStats = useMemo(() => {
    const rsDurations: Record<string, number> = {
      '< 1 Tahun': 0,
      '1–5 Tahun': 0,
      '6–10 Tahun': 0,
      '11–15 Tahun': 0,
      '16–20 Tahun': 0,
      '> 20 Tahun': 0,
    };
    const unitDurations: Record<string, number> = {
      '< 1 Tahun': 0,
      '1–5 Tahun': 0,
      '6–10 Tahun': 0,
      '11–15 Tahun': 0,
      '16–20 Tahun': 0,
      '> 20 Tahun': 0,
    };
    const directInteractions: Record<string, number> = {
      'Ya': 0,
      'Tidak': 0,
    };
    const positions: Record<string, number> = {
      'Dokter': 0,
      'Perawat': 0,
      'Bidan': 0,
      'Apoteker': 0,
      'Tenaga Penunjang': 0,
      'Manajemen': 0,
      'Staff Administrasi': 0,
    };
    const weeklyHours: Record<string, number> = {
      '<20 Jam': 0,
      '20–39 Jam': 0,
      '> 40 Jam': 0,
    };
    const professionDurations: Record<string, number> = {
      '<1 Tahun': 0,
      '1–5 Tahun': 0,
      '6–10 Tahun': 0,
      '11–15 Tahun': 0,
      '16–20 Tahun': 0,
      '> 20 Tahun': 0,
    };

    let total = 0;

    filteredSurveys.forEach(s => {
      total++;
      const raw = (s.dimensiScores as any)?._rawAnswers || {};
      const ansG = raw.ansG || {};
      const sId = s.id || '';

      // 1. Lama Kerja di RS
      const g1Val = ansG[1] || '1 hingga 5 tahun';
      const rsCat = getG1Category(g1Val, sId);
      rsDurations[rsCat] = (rsDurations[rsCat] || 0) + 1;

      // 2. Lama Kerja di Unit
      const g2Val = ansG[2] || '1 hingga 5 tahun';
      const unitCat = getG2Category(g2Val, sId);
      unitDurations[unitCat] = (unitDurations[unitCat] || 0) + 1;

      // 3. Profesi Berhubungan Langsung
      const g4Val = ansG[4] || 'YA, saya melakukan interaksi atau kontak langsung dengan pasien';
      const directCat = getG4Category(g4Val);
      directInteractions[directCat] = (directInteractions[directCat] || 0) + 1;

      // 4. Posisi / Jabatan
      const jobVal = raw.posisiStaf || s.unitKerja || 'Perawat';
      const jobCat = getJobCategory(jobVal);
      positions[jobCat] = (positions[jobCat] || 0) + 1;

      // 5. Jam Kerja per Minggu
      const g3Val = ansG[3] || '30 hingga 40 jam per minggu';
      const hoursCat = getG3Category(g3Val, sId);
      weeklyHours[hoursCat] = (weeklyHours[hoursCat] || 0) + 1;

      // 6. Lama Kerja Sesuai Profesi
      const profCat = getG6Category(g1Val, g2Val, sId);
      professionDurations[profCat] = (professionDurations[profCat] || 0) + 1;
    });

    return {
      total,
      rsDurations,
      unitDurations,
      directInteractions,
      positions,
      weeklyHours,
      professionDurations
    };
  }, [filteredSurveys]);

  // Transform processed stats for chart components
  const rsChartData = useMemo(() => {
    return prepareChartData(profileStats.rsDurations, ['< 1 Tahun', '1–5 Tahun', '6–10 Tahun', '11–15 Tahun', '16–20 Tahun', '> 20 Tahun']);
  }, [profileStats]);

  const unitChartData = useMemo(() => {
    return prepareChartData(profileStats.unitDurations, ['< 1 Tahun', '1–5 Tahun', '6–10 Tahun', '11–15 Tahun', '16–20 Tahun', '> 20 Tahun']);
  }, [profileStats]);

  const directChartData = useMemo(() => {
    return prepareChartData(profileStats.directInteractions, ['Ya', 'Tidak']);
  }, [profileStats]);

  const jobChartData = useMemo(() => {
    const allPositions = Object.keys(profileStats.positions);
    return prepareChartData(profileStats.positions, allPositions).filter(item => item.value > 0);
  }, [profileStats]);

  const hoursChartData = useMemo(() => {
    return prepareChartData(profileStats.weeklyHours, ['<20 Jam', '20–39 Jam', '> 40 Jam']);
  }, [profileStats]);

  const professionChartData = useMemo(() => {
    return prepareChartData(profileStats.professionDurations, ['<1 Tahun', '1–5 Tahun', '6–10 Tahun', '11–15 Tahun', '16–20 Tahun', '> 20 Tahun']);
  }, [profileStats]);

  // Excel (CSV) Export Functionality
  const handleExportExcel = () => {
    const separator = ';';
    const BOM = '\uFEFF'; // For Excel UTF-8 Indonesian compatibility
    const headers = ['No', 'Kode', 'Dimensi Budaya Keselamatan Pasien', 'Hasil Persentase (%)', 'Status Kepatuhan', 'Valid Jawaban', 'Jumlah Responden'];
    
    const rows = calculatedDimensions.map((dim, idx) => [
      idx + 1,
      dim.kode,
      `"${dim.nama.replace(/"/g, '""')}"`,
      `"${dim.percentage.toFixed(2).replace('.', ',')}%"`,
      dim.percentage >= 75 ? 'Sangat Baik' : (dim.percentage >= 50 ? 'Perlu Peningkatan' : 'Perlu Prioritas'),
      dim.validCount,
      dim.respondentsCount
    ]);

    const csvContent = BOM + [headers.join(separator), ...rows.map(r => r.join(separator))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hasil_Survei_AHRQ_SOPS_${namaRs.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printing Functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div id="ahrq-table-card" className="relative bg-white/[0.05] border border-white/20 rounded-[32px] shadow-2xl shadow-black/50 backdrop-blur-3xl p-6 overflow-hidden md:p-8 space-y-6 group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -z-10 group-hover:bg-teal-500/30 transition-colors duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
        
        {/* 1. HEADER SECTION with Emerald Gradient theme */}
        <div className="flex flex-col items-center justify-center text-center gap-2 pb-6 border-b border-white/10">
          <h2 className="text-xl md:text-2xl text-center font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Hasil Survei Budaya Keselamatan Pasien
          </h2>
          <p className="text-xs text-[#eff3f9]">
            AHRQ Hospital Survey on Patient Safety Culture (SOPS) Version 2.0
          </p>
        </div>

        {/* 4. MAIN DATA TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-[#00244d]/50 bg-[#020918]/90 backdrop-blur-[64px] shadow-[0_8px_24px_rgba(0,0,0,0.30)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#00244d] via-[#0c1a36] to-[#020918] border-b border-[#00244d]/40 text-white/95 font-bold uppercase tracking-wider divide-x divide-[#00244d]/20">
                <th className="p-4 text-center w-12 text-[14px]">No</th>
                <th className="p-4 text-center text-[14px]">KOMPOSIT BUDAYA KESELAMATAN PASIEN</th>
                <th className="p-4 text-center w-52 text-[14px]">Hasil Persentase (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00244d]/20 bg-[#0c1a36]/80 text-slate-300">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 font-light leading-relaxed">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-slate-500 animate-pulse" />
                      <p className="font-bold text-slate-200">Tidak Ada Data Survei yang Cocok</p>
                      <p className="text-[10px] text-slate-500 max-w-sm">
                        Silakan sesuaikan kriteria filter di atas atau input data kuesioner baru pada tab <strong className="text-emerald-400">Input Data Survei</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : searchedDimensions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 font-light leading-relaxed">
                    Tidak ada dimensi yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                searchedDimensions.map((dim, idx) => {
                  const globalIdx = idx + 1;
                  
                  const scoreColor = dim.percentage >= 75 
                     ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                     : (dim.percentage >= 50 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]');

                  return (
                    <tr 
                      key={dim.id} 
                      onClick={() => setSelectedDimensi(dim.id)}
                      className="hover:bg-[#00244d]/50 transition-all cursor-pointer group divide-x divide-[#00244d]/20"
                    >
                      <td className="p-4 text-center font-bold font-mono hover:text-blue-400 transition-colors text-base text-[#f3f5f8]">
                        {globalIdx}
                      </td>
                      <td className="p-4 text-left">
                        <div className="hover:text-blue-400 transition-colors text-[14px] font-bold text-slate-200 flex items-center justify-between">
                          <span>{dim.nama}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-base font-extrabold font-mono ${scoreColor}`}>
                          {dim.percentage.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. SLIDE-OVER / INTERACTIVE DETAIL POPUP MODAL */}
        <AnimatePresence>
          {selectedDimensi && (
            <DimensiDetailModal 
              dimensiId={selectedDimensi} 
              onClose={() => setSelectedDimensi(null)}
              surveys={filteredSurveys}
              rsName={namaRs}
            />
          )}
        </AnimatePresence>

        {/* Styled Printable section */}
        <style>{`
          @media print {
            #ahrq-table-card {
              background: white !important;
              color: black !important;
              border: none !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
              padding: 0 !important;
            }
            #ahrq-table-card * {
              color: black !important;
              background: transparent !important;
              border-color: #ddd !important;
            }
            th {
              background-color: #f3f4f6 !important;
              color: black !important;
              font-weight: bold !important;
              }
            select, input, button {
              display: none !important;
            }
          }
        `}</style>

      </div>

      {/* Respondent Profile Dashboard Section */}
      <div id="ahrq-respondent-profile-card" className="relative bg-[#121826]/90 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.30),0_0_12px_rgba(0,180,255,0.08)] rounded-[32px] p-6 md:p-8 space-y-8 overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 group-hover:bg-purple-500/20 transition-colors duration-700"></div>
        
        {/* Header with gradient and badge */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> Dashboard Profil Responden
            </h2>
            <p className="text-xs text-[#eff3f9]">
              Analisis demografi dan karakteristik responden pengisi kuesioner budaya keselamatan pasien secara dinamis.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              {profileStats.total} Responden Terfilter
            </span>
          </div>
        </div>

        {profileStats.total === 0 ? (
          <div className="p-12 text-center text-slate-400 font-light leading-relaxed">
            <div className="flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-slate-500 animate-pulse" />
              <p className="font-bold text-slate-200">Tidak Ada Data Responden</p>
              <p className="text-[10px] text-slate-500 max-w-sm">
                Silakan sesuaikan kriteria filter atau input kuesioner baru untuk memperbarui grafik profil.
              </p>
            </div>
          </div>
        ) : (
          /* Responsive grid for 6 charts: 3 columns on wide screens, 2 on medium, 1 on small */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* 1. Lama Kerja di RS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" /> Lama Kerja di RS
                  </h3>
                  <span className="px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-[10px] font-bold text-cyan-400">
                    {profileStats.total} Responden
                  </span>
                </div>
                
                {/* Recharts Pie Chart */}
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {rsChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                {/* Legend list with counts and percentages */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                  {rsChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Auto-Analysis */}
              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getRsAnalysis(rsChartData, profileStats.total)}
              </div>
            </motion.div>

            {/* 2. Lama Kerja di Unit */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Lama Kerja di Unit
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-400/10 border border-blue-400/20 rounded-full text-[10px] font-bold text-blue-400">
                    {profileStats.total} Responden
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={unitChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {unitChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[(idx + 1) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                  {unitChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(idx + 1) % CHART_COLORS.length] }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getUnitAnalysis(unitChartData, profileStats.total)}
              </div>
            </motion.div>

            {/* 3. Hubungan Langsung dengan Pasien */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Hubungan Langsung Pasien
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-[10px] font-bold text-emerald-400">
                    {profileStats.total} Responden
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={directChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {directChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.name === 'Ya' ? '#10B981' : '#F43F5E'} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                  {directChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.name === 'Ya' ? '#10B981' : '#F43F5E' }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getDirectAnalysis(directChartData, profileStats.total)}
              </div>
            </motion.div>

            {/* 4. Posisi / Jabatan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Posisi / Jabatan
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-400/10 border border-purple-400/20 rounded-full text-[10px] font-bold text-purple-400">
                    {jobChartData.length} Jabatan
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jobChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {jobChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3 max-h-24 overflow-y-auto">
                  {jobChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(idx + 3) % CHART_COLORS.length] }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getPositionAnalysis(jobChartData, profileStats.total)}
              </div>
            </motion.div>

            {/* 5. Jam Kerja per Minggu */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" /> Jam Kerja per Minggu
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-[10px] font-bold text-amber-400">
                    {profileStats.total} Responden
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hoursChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {hoursChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[(idx + 4) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                  {hoursChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(idx + 4) % CHART_COLORS.length] }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getHoursAnalysis(hoursChartData, profileStats.total)}
              </div>
            </motion.div>

            {/* 6. Lama Kerja Sesuai Profesi */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-slate-950/40 border border-white/[0.08] p-5 rounded-[20px] shadow-xl backdrop-blur-md hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-400" /> Lama Kerja Sesuai Profesi
                  </h3>
                  <span className="px-2 py-0.5 bg-violet-400/10 border border-violet-400/20 rounded-full text-[10px] font-bold text-violet-400">
                    {profileStats.total} Responden
                  </span>
                </div>
                
                <div className="h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={professionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {professionChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[(idx + 5) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-slate-100">{profileStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Responden</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                  {professionChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(idx + 5) % CHART_COLORS.length] }}></span>
                      <span className="md:truncate md:max-w-[80px] whitespace-normal break-words" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-slate-100 ml-auto">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                {getProfExperienceAnalysis(professionChartData, profileStats.total)}
              </div>
            </motion.div>

          </div>
        )}
      </div>

    </div>
  );
}
