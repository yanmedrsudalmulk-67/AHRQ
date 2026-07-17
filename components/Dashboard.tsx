'use client';

import { useState, useEffect, useRef } from 'react';
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
import DashboardTable from './DashboardTable';
import PersetujuanTab from './PersetujuanTab';
import { getSurveys, saveSurvey, getHospitalAccounts, deleteSurvey } from '../lib/db';
import { WallpaperData } from '../lib/wallpaper';
import { LogoData } from '../lib/logo';
import DashboardHeader from './DashboardHeader';

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: number };
}

interface DashboardProps {
  role: 'rs' | 'admin';
  identifier: string;
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
  namaRs, 
  onLogout, 
  onUpdateRsName,
  activeWallpaper,
  onUpdateWallpaper,
  activeLogo,
  onUpdateLogo
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'grafik' | 'laporan' | 'pengaturan' | 'persetujuan'>('dashboard');
  const mainContainerRef = useRef<HTMLElement | null>(null);

  // Reset scroll to top immediately whenever activeTab changes
  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const [showRespondentsModal, setShowRespondentsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // SWR for real-time survey synchronization with background polling
  const { data: surveys = [], mutate, isLoading: surveysLoading } = useSWR('ahrq_surveys', getSurveys, {
    refreshInterval: 3000
  });

  // SWR for real-time hospital accounts with background polling (only for admin)
  const { data: accounts = [], mutate: mutateAccounts, isLoading: accountsLoading } = useSWR(
    role === 'admin' ? 'hospital_accounts' : null,
    getHospitalAccounts,
    { refreshInterval: 3000 }
  );

  const pendingAccountsCount = accounts.filter(a => a.status === 'Pending').length;

  const handleSaveSurvey = async (newSurvey: SurveyData) => {
    try {
      const saved = await saveSurvey(newSurvey);
      mutate();
    } catch (e) {
      console.error("Gagal menyimpan data survei:", e);
    }
  };

  const handleResetData = () => {
    mutate([]);
  };

  const handleDeleteSurvey = (id: string) => {
    if (role !== 'admin') {
      setNotification({ text: "Anda tidak memiliki hak akses untuk menghapus data responden.", type: 'error' });
      return;
    }
    setSurveyToDelete(id);
    setShowDeleteConfirm(true);
  };

  const executeDeleteSurvey = async () => {
    if (!surveyToDelete) return;
    if (role !== 'admin') {
      setNotification({ text: "Anda tidak memiliki hak akses untuk menghapus data responden.", type: 'error' });
      setShowDeleteConfirm(false);
      setSurveyToDelete(null);
      return;
    }

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
  const filteredSurveys = role === 'admin' 
    ? surveys 
    : surveys.filter(s => s.namaRs.toLowerCase() === namaRs.toLowerCase());

  // Statistics calculations
  const totalRespondents = filteredSurveys.reduce((acc, curr) => acc + curr.jumlahResponden, 0);
  const totalUnits = filteredSurveys.length;
  
  // Overall average percentage response
  const scoreToPercent = (score: number): number => {
    if (score === 5) return 96;
    if (score === 4) return 78;
    if (score === 3) return 48;
    if (score === 2) return 22;
    return 6;
  };

  let overallPercentSum = 0;
  let totalScoreCount = 0;

  filteredSurveys.forEach(s => {
    if (s.dimensiScores) {
      Object.values(s.dimensiScores).forEach(score => {
        overallPercentSum += scoreToPercent(score);
        totalScoreCount++;
      });
    }
  });

  const overallScorePercent = totalScoreCount > 0 
    ? Math.round(overallPercentSum / totalScoreCount) 
    : 0; // fallback realistic default

  return (
    <div className="h-[100dvh] md:h-screen w-full bg-slate-950/20 backdrop-blur-xs text-white flex flex-col md:flex-row font-sans overflow-hidden relative">
      
      {/* Mobile Top Header (Sticky on Mobile) */}
      <header className="md:hidden flex-none w-full z-40 bg-[#050B14]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-0.5 bg-blue-600 text-white rounded-lg border border-blue-400 shadow-md flex items-center justify-center shrink-0 w-8 h-8">
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
            ) : (
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-sans font-bold text-sm text-slate-100 tracking-tight">AHRQ SOPS v2.0</span>
            <p className="text-[9px] text-cyan-500 font-mono tracking-wider font-semibold block">Agency for Healthcare Research and Quality</p>
          </div>
        </div>
        {/* Optional Mobile Header Logout */}
        <button
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition-colors border border-transparent hover:bg-white/5"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Navigation - Sidebar on Desktop, Bottom Bar on Mobile */}
      <aside className="w-full fixed bottom-0 left-0 z-50 md:relative md:w-64 bg-slate-950/90 md:bg-gradient-to-b md:from-[#00244d]/75 md:via-[#0c1a36]/80 md:to-[#020918]/80 backdrop-blur-sm border-t border-white/10 md:border-t-0 md:border-r md:border-white/10 md:pt-16 md:px-5 md:pb-5 flex flex-col justify-between shrink-0 no-print shadow-md md:shadow-2xl md:shadow-blue-950/40 md:h-full md:overflow-hidden pb-safe">
        
        <div className="md:space-y-6 flex-1 flex flex-col justify-center md:justify-start">
          
          {/* Brand/Title - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="p-0.5 bg-blue-600 text-white rounded-xl border border-blue-400 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0 w-12 h-12">
              {activeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
              ) : (
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              )}
            </div>
            <div>
              <span className="font-sans font-bold text-[15px] text-slate-100 tracking-tight">AHRQ SOPS v2.0</span>
              <p className="text-[10px] text-cyan-500 font-mono tracking-wider font-semibold block">Agency for Healthcare Research and Quality</p>
            </div>
          </div>

          <div className="hidden md:block px-4">
            <motion.div 
              animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundSize: "200% 100%",
                backgroundImage: "linear-gradient(to right, #22d3ee, #6366f1, #a855f7, #6366f1, #22d3ee)"
              }}
              className="h-px w-full rounded-full shadow-md" 
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch w-full px-2 py-2 md:p-0 md:space-y-1.5 h-[80px] md:h-auto gap-1">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'dashboard' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[15px] leading-none">Dashboard</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'input'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <ClipboardCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'input' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Input Data Survei</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Survei</span>
            </button>

            <button
              onClick={() => setActiveTab('grafik')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'grafik'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <BarChart2 className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'grafik' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Analisis Grafik</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Grafik</span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'laporan'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <FileText className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'laporan' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Laporan Detail</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Laporan</span>
            </button>

            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <Settings className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'pengaturan' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Pengaturan RS</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Setelan</span>
            </button>

            {role === 'admin' && (
              <button
                onClick={() => setActiveTab('persetujuan')}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all transform-gpu cursor-pointer relative ${
                  activeTab === 'persetujuan'
                    ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-md md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                    : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
                }`}
              >
                <ShieldCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'persetujuan' ? 'text-white drop-shadow-md md:drop-shadow-none' : ''}`} /> 
                <span className="hidden md:block text-[14px] leading-none">Persetujuan Akun</span>
                <span className="md:hidden text-[10px] mt-1 tracking-wide">Persetujuan</span>
                
                {pendingAccountsCount > 0 && (
                  <span className="absolute top-1 right-2 md:top-2 md:right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white  shadow-md">
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
                    backgroundImage: "linear-gradient(to right, #22d3ee, #6366f1, #a855f7, #6366f1, #22d3ee)"
                  }}
                  className="h-px w-full rounded-full shadow-md" 
                />
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-[14px] font-bold flex items-center gap-3 transition-all transform-gpu cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log Out Akun
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

            {/* Quick alert for admin about pending registrations */}
            {role === 'admin' && pendingAccountsCount > 0 && (
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500/15 text-yellow-400 rounded-xl border border-yellow-500/20">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Permohonan Registrasi RS Menunggu Persetujuan</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Terdapat <strong className="text-yellow-400">{pendingAccountsCount} fasyankes baru</strong> yang mendaftar dan menunggu verifikasi Anda.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('persetujuan')}
                  className="px-4 py-2 bg-yellow-500 text-slate-950 hover:bg-yellow-400 text-xs font-bold rounded-xl transition-all transform-gpu cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                >
                  Buka Menu Persetujuan <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Stats Summary Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div 
                onClick={() => setShowRespondentsModal(true)}
                className="cursor-pointer p-5 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-slate-900/80 transition-all transform-gpu duration-300 relative overflow-hidden group shadow-md"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden</span>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all transform-gpu">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-white leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalRespondents}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Staf fasyankes yang berpartisipasi</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-md" />
              </div>

              <div className="p-5 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-slate-900/80 transition-all transform-gpu duration-300 relative overflow-hidden group shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Kerja Terdata</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all transform-gpu">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-white leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalUnits}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">IGD, ICU, Rawat Inap & Jalan</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-md" />
              </div>

              <div className="p-5 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-slate-900/80 transition-all transform-gpu duration-300 relative overflow-hidden group shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Respon Positif</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all transform-gpu">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-cyan-400 leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{overallScorePercent}%</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Kategori: <strong className="text-emerald-400">{overallScorePercent >= 75 ? 'LULUS KUAT' : (overallScorePercent === 0 ? 'BELUM ADA DATA' : 'PERLU PERBAIKAN')}</strong></p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-md" />
              </div>

            </div>

            {/* Tabel Hasil Survei AHRQ 10 Dimensi */}
            <DashboardTable role={role} namaRs={namaRs} />

          </div>
        )}

        {activeTab === 'input' && (
          <InputDataTab 
            currentRsName={namaRs} 
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
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" />
                      Daftar Responden
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Data staf yang telah berpartisipasi mengisi kuesioner.</p>
                  </div>
                  <button
                    onClick={() => setShowRespondentsModal(false)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 font-semibold">No</th>
                        <th className="px-6 py-4 font-semibold">Tanggal Input</th>
                        <th className="px-6 py-4 font-semibold">Posisi Staf</th>
                        <th className="px-6 py-4 font-semibold">Unit/Area Kerja</th>
                        {role === 'admin' && <th className="px-6 py-4 font-semibold text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredSurveys.length > 0 ? (
                        filteredSurveys.map((survey, index) => {
                          const rawAnswers = (survey.dimensiScores as any)?._rawAnswers || {};
                          return (
                            <tr key={survey.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{survey.tanggalInput}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{rawAnswers.posisiStaf || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{survey.unitKerja || '-'}</td>
                              {role === 'admin' && (
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => handleDeleteSurvey(survey.id)}
                                    className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all transform-gpu group border border-rose-500/20 hover:border-transparent inline-flex items-center justify-center"
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
                          <td colSpan={role === 'admin' ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
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
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-sm border border-rose-500/30 shadow-md rounded-2xl overflow-hidden p-6 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Trash2 className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-100">Hapus Data Responden</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Apakah Anda yakin ingin menghapus data responden ini?
                  </p>
                  <p className="text-xs text-rose-400/80 bg-rose-500/5 py-1.5 px-3 rounded-lg border border-rose-500/10 inline-block font-semibold">
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
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all transform-gpu disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={executeDeleteSurvey}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/15 transition-all transform-gpu flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
                  : 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50'
              }`}
            >
              {notification.type === 'success' ? (
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">✓</div>
              ) : (
                <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-[10px] font-bold">✕</div>
              )}
              <span className="text-xs font-semibold leading-none">{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
