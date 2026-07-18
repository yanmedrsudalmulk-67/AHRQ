'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ClipboardCheck, 
  BarChart2, 
  FileText, 
  Settings, 
  LogOut, 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  Trash2
} from 'lucide-react';
import useSWR, { mutate as globalMutate } from 'swr';
import InputDataTab from './InputDataTab';
import GrafikTab from './GrafikTab';
import LaporanTab from './LaporanTab';
import PengaturanTab from './PengaturanTab';
import PersetujuanTab from './PersetujuanTab';
import DashboardTable from './DashboardTable';
import { getSurveys, saveSurvey, getHospitalAccounts, deleteSurvey } from '../lib/db';
import { computeDimensionScores } from '../lib/scoring';
import { WallpaperData } from '../lib/wallpaper';
import { LogoData } from '../lib/logo';
import DashboardHeader from './DashboardHeader';

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: any };
}

interface DashboardProps {
  role: 'rs' | 'admin';
  identifier: string;
  hospitalId?: string;
  namaRs: string;
  onLogout: () => void;
  onUpdateRsName: (newName: string) => void;
  activeWallpaper: WallpaperData | null;
  onUpdateWallpaper: (wallpaper: WallpaperData | null) => void;
  activeLogo: LogoData | null;
  onUpdateLogo: (logo: LogoData | null) => void;
}

export default function Dashboard({ 
  role, 
  identifier, 
  hospitalId,
  namaRs, 
  onLogout, 
  onUpdateRsName,
  activeWallpaper,
  onUpdateWallpaper,
  activeLogo,
  onUpdateLogo
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'grafik' | 'laporan' | 'pengaturan' | 'persetujuan' | 'master-posisi' | 'master-unit'>('dashboard');
  const mainContainerRef = useRef<HTMLElement | null>(null);

  // Reset scroll to top immediately whenever activeTab changes
  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const [showRespondentsModal, setShowRespondentsModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedRsFilter, setSelectedRsFilter] = useState<'all' | 'admin' | string>('admin');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // SWR for real-time survey synchronization with background polling
  const { data: surveys = [], mutate, isLoading: surveysLoading } = useSWR(
    role === 'admin' ? 'ahrq_surveys_all' : ['ahrq_surveys', hospitalId || identifier],
    () => getSurveys(role === 'admin' ? undefined : (hospitalId || identifier)),
    {
      refreshInterval: 3000
    }
  );

  // SWR for real-time hospital accounts with background polling (only for admin)
  const { data: accounts = [], mutate: mutateAccounts, isLoading: accountsLoading } = useSWR(
    role === 'admin' ? 'hospital_accounts' : null,
    getHospitalAccounts,
    { refreshInterval: 3000 }
  );

  const pendingAccountsCount = accounts.filter(a => a.status === 'Pending').length;

  const handleSaveSurvey = async (newSurvey: SurveyData) => {
    try {
      const surveyWithUser = {
        ...newSurvey,
        dimensiScores: {
          ...newSurvey.dimensiScores,
          username: identifier,
          hospital_id: hospitalId || identifier
        }
      };
      const saved = await saveSurvey(surveyWithUser, hospitalId || identifier, identifier, identifier, namaRs);
      mutate();
    } catch (e) {
      console.error("Gagal menyimpan data survei:", e);
    }
  };

  const handleResetData = () => {
    mutate([]);
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveyToDelete(id);
    setShowDeleteConfirm(true);
  };

  const executeDeleteSurvey = async () => {
    if (!surveyToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically filter out the deleted survey from the current list
      const updatedSurveys = surveys.filter(s => s.id !== surveyToDelete);
      
      // Mutate locally both the bound and global cache for 'ahrq_surveys' immediately
      mutate(updatedSurveys, false);
      globalMutate('ahrq_surveys', updatedSurveys, false);

      // Perform actual deletion on Supabase database
      await deleteSurvey(surveyToDelete);
      
      // Success feedback
      setNotification({ text: "Data responden berhasil dihapus.", type: 'success' });
      
      // Finally, trigger real background revalidation to make sure everyone is fully synchronized
      await mutate();
      await globalMutate('ahrq_surveys');
    } catch (e) {
      console.error("Gagal menghapus survei:", e);
      setNotification({ text: "Gagal menghapus data. Silakan coba kembali.", type: 'error' });
      // Rollback state in case of any database exception
      mutate();
      globalMutate('ahrq_surveys');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSurveyToDelete(null);
    }
  };

  // Filter surveys: Admin sees all, RS sees only their own
  const validSurveys = surveys.filter(s => s.namaRs !== '_LINK_CONFIG_' && s.namaRs !== '_MASTER_CONFIG_' && s.id !== 'MASTER_BENCHMARK');
  
  const filteredSurveys = useMemo(() => {
    return validSurveys.filter(s => {
      if (role === 'admin') {
        if (selectedRsFilter === 'admin') {
          const surveyUser = (s.dimensiScores as any)?.username;
          if (surveyUser) return surveyUser.toLowerCase() === 'admin';
          return s.namaRs === 'Administrator Pusat';
        } else if (selectedRsFilter === 'all') {
          return true;
        } else {
          const surveyUser = (s.dimensiScores as any)?.username;
          const surveyHospitalId = (s.dimensiScores as any)?.hospital_id;
          return (surveyUser?.toLowerCase() === selectedRsFilter.toLowerCase() || 
                  surveyHospitalId === selectedRsFilter || 
                  s.namaRs.toLowerCase() === selectedRsFilter.toLowerCase());
        }
      } else {
        const surveyUser = (s.dimensiScores as any)?.username;
        if (surveyUser) {
          return surveyUser.toLowerCase() === identifier.toLowerCase();
        }
        return s.namaRs.toLowerCase() === namaRs.toLowerCase();
      }
    });
  }, [validSurveys, role, identifier, namaRs, selectedRsFilter]);

  // Statistics calculations
  const totalRespondents = filteredSurveys.reduce((acc, curr) => acc + curr.jumlahResponden, 0);

  // Grouped Unit summary data
  const unitsSummary = useMemo(() => {
    const summaryMap: Record<string, { latestDate: string; count: number }> = {};
    filteredSurveys.forEach((survey) => {
      const unit = survey.unitKerja || 'Instansi Umum';
      if (!summaryMap[unit]) {
        summaryMap[unit] = { latestDate: survey.tanggalInput, count: 0 };
      }
      summaryMap[unit].count += (survey.jumlahResponden || 1);
    });
    return Object.entries(summaryMap).map(([unit, data]) => ({
      unit,
      tanggalInput: data.latestDate,
      jumlah: data.count,
    }));
  }, [filteredSurveys]);

  const totalUnits = unitsSummary.length;
  
  // Overall average percentage response using robust dimension scoring
  const overallScorePercent = useMemo(() => {
    if (filteredSurveys.length === 0) return 0;
    const calculatedDims = computeDimensionScores(filteredSurveys);
    if (calculatedDims.length === 0) return 0;
    const sum = calculatedDims.reduce((acc, dim) => acc + dim.percentage, 0);
    return Math.round(sum / calculatedDims.length);
  }, [filteredSurveys]);

  return (
    <div className="h-[100dvh] md:h-screen w-full bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans overflow-hidden relative">
      
      {/* Mobile Top Header (Sticky on Mobile) */}
      <header className="md:hidden flex-none w-full z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-0.5 bg-teal-500 text-white rounded-lg border border-teal-400 shadow-sm flex items-center justify-center shrink-0 w-8 h-8">
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
            ) : (
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-sans font-bold text-sm text-slate-800 tracking-tight">AHRQ SOPS v2.0</span>
            <p className="text-[9px] text-teal-600 font-mono tracking-wider font-bold block">Agency for Healthcare Research and Quality</p>
          </div>
        </div>
        {/* Optional Mobile Header Logout */}
        <button
          onClick={onLogout}
          className="text-slate-500 hover:text-rose-600 p-1 rounded-lg transition-colors border border-transparent hover:bg-slate-100"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Navigation - Sidebar on Desktop, Bottom Bar on Mobile */}
      <aside className="w-full fixed bottom-0 left-0 z-50 md:relative md:w-64 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 md:bg-gradient-to-b md:from-blue-800 md:to-indigo-950 text-white border-t border-blue-500/30 md:border-t-0 md:border-r md:border-blue-900/50 md:pt-12 md:px-5 md:pb-5 flex flex-col justify-between shrink-0 no-print shadow-2xl md:h-full md:overflow-hidden pb-safe">
        
        <div className="md:space-y-6 flex-1 flex flex-col justify-center md:justify-start">
          
          {/* Brand/Title - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="p-0.5 bg-blue-600 text-white rounded-xl border border-blue-400 shadow-md flex items-center justify-center shrink-0 w-12 h-12">
              {activeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>
            <div>
              <span className="font-sans font-extrabold text-[15px] text-white tracking-tight">AHRQ SOPS v2.0</span>
              <p className="text-[10px] text-blue-200 font-mono tracking-wider font-bold block">Agency for Healthcare Research and Quality</p>
            </div>
          </div>

          <div className="hidden md:block px-4">
            <motion.div 
              animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundSize: "200% 100%",
                backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(255,255,255,0.1))"
              }}
              className="h-px w-full rounded-full shadow-xs" 
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch w-full px-2 py-2 md:p-0 md:space-y-1.5 h-[80px] md:h-auto gap-1">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                  : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
              }`}
            >
              <LayoutDashboard className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'dashboard' ? 'text-black' : 'text-blue-200'}`} /> 
              <span className="hidden md:block text-[15px] leading-none">Dashboard</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'input'
                  ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                  : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
              }`}
            >
              <ClipboardCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'input' ? 'text-black' : 'text-blue-200'}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Input Data Survei</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Survei</span>
            </button>

            <button
              onClick={() => setActiveTab('grafik')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'grafik'
                  ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                  : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
              }`}
            >
              <BarChart2 className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'grafik' ? 'text-black' : 'text-blue-200'}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Analisis Grafik</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Grafik</span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'laporan'
                  ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                  : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
              }`}
            >
              <FileText className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'laporan' ? 'text-black' : 'text-blue-200'}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Laporan Survei</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Laporan</span>
            </button>

            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                  : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
              }`}
            >
              <Settings className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'pengaturan' ? 'text-black' : 'text-blue-200'}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Pengaturan</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Setelan</span>
            </button>

            {role === 'admin' && (
              <button
                onClick={() => setActiveTab('persetujuan')}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer relative ${
                  activeTab === 'persetujuan'
                    ? 'text-black bg-white shadow-lg scale-105 md:scale-100'
                    : 'text-blue-100 hover:text-white md:hover:bg-white/10 border border-transparent'
                }`}
              >
                <ShieldCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'persetujuan' ? 'text-black' : 'text-blue-200'}`} /> 
                <span className="hidden md:block text-[14px] leading-none">Persetujuan Akun</span>
                <span className="md:hidden text-[10px] mt-1 tracking-wide">Persetujuan</span>
                
                {pendingAccountsCount > 0 && (
                  <span className="absolute top-1 right-2 md:top-2 md:right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white shadow-md">
                    {pendingAccountsCount}
                  </span>
                )}
              </button>
            )}

            {/* Logout Button - Integrated inside menu list, positioned slightly downwards */}
            <div className="hidden md:block pt-4 mt-8 w-full">
              <div className="px-4 mb-4">
                <motion.div 
                  animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    backgroundSize: "200% 100%",
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(255,255,255,0.1))"
                  }}
                  className="h-px w-full rounded-full shadow-xs" 
                />
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl text-[14px] font-bold flex items-center gap-3 transition-all transform-gpu cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-blue-200" /> Log Out Akun
              </button>
            </div>
            
          </nav>
        </div>
      </aside>

      {/* Main Container - Independently Scrollable */}
      <main ref={mainContainerRef} className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto md:h-full pb-24 md:pb-8">
        
        {/* Dynamic View rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Greeting */}
            <DashboardHeader role={role} namaRs={namaRs} surveys={surveys} />

            {/* Filter Fasyankes / Rumah Sakit - Khusus Admin Utama */}
            {role === 'admin' && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase font-mono">SELEKSI SUMBER DATA</span>
                    <h4 className="text-sm font-bold text-slate-800">Tampilkan Data Fasyankes</h4>
                  </div>
                </div>
                
                <div className="w-full md:w-auto flex items-center gap-2">
                  <select
                    value={selectedRsFilter}
                    onChange={(e) => setSelectedRsFilter(e.target.value)}
                    className="w-full md:w-[280px] bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="admin">Administrator Pusat (Hanya Data Saya)</option>
                    <option value="all">Semua Rumah Sakit (Data Gabungan)</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.username}>
                        {acc.namaRs} ({acc.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quick alert for admin about pending registrations */}
            {role === 'admin' && pendingAccountsCount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Permohonan Registrasi RS Menunggu Persetujuan</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Terdapat <strong className="text-amber-600">{pendingAccountsCount} fasyankes baru</strong> yang mendaftar dan menunggu verifikasi Anda.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('persetujuan')}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all transform-gpu cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  Buka Menu Persetujuan <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Stats Summary Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div 
                onClick={() => setShowRespondentsModal(true)}
                className="cursor-pointer p-5 bg-white/85 backdrop-blur-md rounded-[22px] border border-slate-200/80 space-y-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] hover:border-teal-500/50 hover:bg-white transition-all transform-gpu duration-300 relative overflow-hidden group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Total Responden</span>
                  <div className="p-2 bg-teal-500/10 text-teal-600 rounded-lg border border-teal-200/30 group-hover:bg-teal-500/20 transition-all transform-gpu">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[40px] font-sans font-extrabold text-slate-800 leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalRespondents}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">Staf Fasyankes Yang Mengisi Survei</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-teal-400 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div 
                onClick={() => setShowUnitsModal(true)}
                className="cursor-pointer p-5 bg-white/85 backdrop-blur-md rounded-[22px] border border-slate-200/80 space-y-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] hover:border-blue-500/50 hover:bg-white transition-all transform-gpu duration-300 relative overflow-hidden group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Unit / Area Kerja Terdata</span>
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg border border-blue-200/30 group-hover:bg-blue-500/20 transition-all transform-gpu">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[40px] font-sans font-extrabold text-slate-800 leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalUnits}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">Total Unit / Area Kerja Yang Mengisi Survei</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-400 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-5 bg-white/85 backdrop-blur-md rounded-[22px] border border-slate-200/80 space-y-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] hover:border-orange-500 hover:bg-white transition-all transform-gpu duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Rata-Rata Respon Positif</span>
                  <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg border border-orange-200/30 group-hover:bg-orange-500/20 transition-all transform-gpu">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[40px] font-sans font-extrabold text-orange-600 leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{overallScorePercent}%</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">Kategori: <strong className="text-orange-600">{overallScorePercent >= 75 ? 'LULUS KUAT' : (overallScorePercent === 0 ? 'BELUM ADA DATA' : 'PERLU PERBAIKAN')}</strong></p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-orange-400 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

            </div>

            {/* Tabel Hasil Survei AHRQ 10 Dimensi */}
            <DashboardTable role={role} namaRs={namaRs} identifier={identifier} hospitalId={hospitalId} selectedRsFilter={selectedRsFilter} accounts={accounts} />

          </div>
        )}

        {activeTab === 'input' && (
          <InputDataTab 
            currentRsName={namaRs} 
            identifier={identifier}
            hospitalId={hospitalId}
            onSaveSurvey={handleSaveSurvey} 
          />
        )}

        {activeTab === 'grafik' && (
          <GrafikTab surveys={filteredSurveys} />
        )}

        {activeTab === 'laporan' && (
          <LaporanTab surveys={filteredSurveys} namaRs={namaRs} />
        )}

        {activeTab === 'pengaturan' && (
          <PengaturanTab 
            role={role}
            identifier={identifier}
            namaRs={namaRs} 
            onUpdateRsName={onUpdateRsName} 
            onResetData={handleResetData} 
            activeWallpaper={activeWallpaper}
            onUpdateWallpaper={onUpdateWallpaper}
            activeLogo={activeLogo}
            onUpdateLogo={onUpdateLogo}
          />
        )}

        {activeTab === 'persetujuan' && role === 'admin' && (
          <PersetujuanTab 
            accounts={accounts} 
            onMutateAccounts={mutateAccounts} 
          />
        )}
          </motion.div>
        </AnimatePresence>

        {/* Respondents Modal */}
        <AnimatePresence>
          {showRespondentsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRespondentsModal(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-[22px] overflow-hidden flex flex-col max-h-[85vh] text-slate-800"
              >
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      Daftar Responden
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Data staf yang telah berpartisipasi mengisi kuesioner.</p>
                  </div>
                  <button
                    onClick={() => setShowRespondentsModal(false)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-sm text-left text-slate-700">
                    <thead className="text-xs text-slate-600 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">No</th>
                        <th className="px-6 py-4 font-bold">Tanggal Input</th>
                        <th className="px-6 py-4 font-bold">Posisi Staf</th>
                        <th className="px-6 py-4 font-bold">Unit/Area Kerja</th>
                        {(role === 'admin' || role === 'rs') && <th className="px-6 py-4 font-bold text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredSurveys.length > 0 ? (
                        filteredSurveys.map((survey, index) => {
                          const rawAnswers = (survey.dimensiScores as any)?._rawAnswers || {};
                          return (
                            <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600">{survey.tanggalInput}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{rawAnswers.posisiStaf || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{survey.unitKerja || '-'}</td>
                              {(role === 'admin' || role === 'rs') && (
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => handleDeleteSurvey(survey.id)}
                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all transform-gpu border border-rose-200 hover:border-transparent inline-flex items-center justify-center cursor-pointer"
                                    title="Hapus Responden"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={(role === 'admin' || role === 'rs') ? 5 : 4} className="px-6 py-8 text-center text-slate-400 font-medium">
                            Belum ada data responden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Unit Kerja Terdata Modal */}
        <AnimatePresence>
          {showUnitsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUnitsModal(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-[22px] overflow-hidden flex flex-col max-h-[85vh] text-slate-800"
              >
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Unit / Area Kerja Terdata
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Data jumlah responden berdasarkan unit atau area kerja fasyankes.</p>
                  </div>
                  <button
                    onClick={() => setShowUnitsModal(false)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-sm text-left text-slate-700">
                    <thead className="text-xs text-slate-600 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold">No</th>
                        <th className="px-6 py-4 font-bold">Tanggal Input</th>
                        <th className="px-6 py-4 font-bold">Unit / Area Kerja</th>
                        <th className="px-6 py-4 font-bold">Posisi Staf</th>
                        <th className="px-6 py-4 font-bold text-center">Jumlah</th>
                        <th className="px-6 py-4 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredSurveys.length > 0 ? (
                        filteredSurveys.map((survey, index) => {
                          const rawAnswers = (survey.dimensiScores as any)?._rawAnswers || {};
                          return (
                            <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600">{survey.tanggalInput}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{survey.unitKerja || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{rawAnswers.posisiStaf || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-800">{survey.jumlahResponden || 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleDeleteSurvey(survey.id)}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all transform-gpu border border-rose-200 hover:border-transparent inline-flex items-center justify-center cursor-pointer"
                                  title="Hapus Responden"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                            Belum ada data kuesioner.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Premium Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteConfirm(false);
                    setSurveyToDelete(null);
                  }
                }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-[22px] overflow-hidden p-6 text-center space-y-6 text-slate-800"
              >
                <div className="w-16 h-16 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Trash2 className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-sans font-bold text-slate-800">Hapus Data Responden</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Apakah Anda yakin ingin menghapus data responden ini?
                  </p>
                  <p className="text-xs text-rose-600 bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-100 inline-block font-bold">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSurveyToDelete(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all transform-gpu disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={executeDeleteSurvey}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/10 transition-all transform-gpu flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDeleting ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Menghapus...
                      </span>
                    ) : (
                      <span>Ya, Hapus Data</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Premium Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
                notification.type === 'success'
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {notification.type === 'success' ? (
                <div className="w-5 h-5 rounded-md bg-teal-500/15 text-teal-600 border border-teal-200 flex items-center justify-center text-[10px] font-bold">✓</div>
              ) : (
                <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-600 border border-rose-200 flex items-center justify-center text-[10px] font-bold">✕</div>
              )}
              <span className="text-xs font-bold leading-none">{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
