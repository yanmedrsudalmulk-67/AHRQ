'use client';

import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import useSWR from 'swr';
import InputDataTab from './InputDataTab';
import GrafikTab from './GrafikTab';
import LaporanTab from './LaporanTab';
import PengaturanTab from './PengaturanTab';
import DashboardTable from './DashboardTable';
import PersetujuanTab from './PersetujuanTab';
import { getSurveys, saveSurvey, getHospitalAccounts } from '../lib/db';
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
      <header className="md:hidden flex-none w-full z-40 bg-[#050B14]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="p-0.5 bg-blue-600 text-white rounded-lg border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 w-8 h-8">
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
      <aside className="w-full fixed bottom-0 left-0 z-50 md:relative md:w-64 bg-slate-950/90 md:bg-gradient-to-b md:from-[#00244d]/75 md:via-[#0c1a36]/80 md:to-[#020918]/80 backdrop-blur-3xl border-t border-white/10 md:border-t-0 md:border-r md:border-white/10 md:pt-16 md:px-5 md:pb-5 flex flex-col justify-between shrink-0 no-print shadow-[0_-15px_40px_rgba(0,0,0,0.6)] md:shadow-[inset_1px_1px_0_rgba(255,255,255,0.06)] md:shadow-2xl md:shadow-blue-950/40 md:h-full md:overflow-hidden pb-safe">
        
        <div className="md:space-y-6 flex-1 flex flex-col justify-center md:justify-start">
          
          {/* Brand/Title - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="p-0 bg-blue-600 text-white rounded-lg border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 w-[50px] h-[50px]">
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
              className="h-px w-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch w-full px-2 py-2 md:p-0 md:space-y-1.5 h-[80px] md:h-auto gap-1">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'dashboard' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[15px] leading-none">Dashboard</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 md:mb-[6px] rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'input'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <ClipboardCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'input' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Input Data Survei</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Survei</span>
            </button>

            <button
              onClick={() => setActiveTab('grafik')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'grafik'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <BarChart2 className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'grafik' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Analisis Grafik</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Grafik</span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'laporan'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <FileText className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'laporan' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Laporan Detail</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Laporan</span>
            </button>

            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                  : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <Settings className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'pengaturan' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
              <span className="hidden md:block text-[14px] leading-none">Pengaturan RS</span>
              <span className="md:hidden text-[10px] mt-1 tracking-wide">Setelan</span>
            </button>

            {role === 'admin' && (
              <button
                onClick={() => setActiveTab('persetujuan')}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 flex-1 md:flex-none py-2 md:py-0 md:h-[39px] md:px-4 rounded-2xl md:rounded-xl font-bold transition-all cursor-pointer relative ${
                  activeTab === 'persetujuan'
                    ? 'text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] md:shadow-none border border-white/20 md:border-transparent scale-105 md:scale-100'
                    : 'text-slate-400 hover:text-indigo-300 md:hover:bg-white/[0.03] border border-transparent hover:bg-white/5'
                }`}
              >
                <ShieldCheck className={`w-[22px] h-[22px] md:w-4 md:h-4 ${activeTab === 'persetujuan' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] md:drop-shadow-none' : ''}`} /> 
                <span className="hidden md:block text-[14px] leading-none">Persetujuan Akun</span>
                <span className="md:hidden text-[10px] mt-1 tracking-wide">Persetujuan</span>
                
                {pendingAccountsCount > 0 && (
                  <span className="absolute top-1 right-2 md:top-2 md:right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-bounce shadow-md">
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
                  className="h-px w-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                />
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-[14px] font-bold flex items-center gap-3 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log Out Akun
              </button>
            </div>
            
          </nav>
        </div>
      </aside>

      {/* Main Container - Independently Scrollable */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto md:h-full pb-24 md:pb-8">
        
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
                  className="px-4 py-2 bg-yellow-500 text-slate-950 hover:bg-yellow-400 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                >
                  Buka Menu Persetujuan <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Stats Summary Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="p-5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden group shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden</span>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-white leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalRespondents}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Staf fasyankes yang berpartisipasi</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              </div>

              <div className="p-5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden group shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Kerja Terdata</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-white leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{totalUnits}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">IGD, ICU, Rawat Inap & Jalan</p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              </div>

              <div className="p-5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/10 space-y-4 shadow-2xl shadow-blue-950/20 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden group shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Respon Positif</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[45px] italic font-extrabold text-cyan-400 leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1">{overallScorePercent}%</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Kategori: <strong className="text-emerald-400">{overallScorePercent >= 75 ? 'LULUS KUAT' : (overallScorePercent === 0 ? 'BELUM ADA DATA' : 'PERLU PERBAIKAN')}</strong></p>
                </div>
                {/* Decorative Bottom Line Accent (Glassmorphism 2.0) */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
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

      </main>
    </div>
  );
}
