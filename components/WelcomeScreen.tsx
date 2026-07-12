'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowRight,
  Calendar,
  Clock
} from 'lucide-react';
import { LogoData } from '../lib/logo';

interface WelcomeScreenProps {
  onEnter: () => void;
  activeLogo?: LogoData | null;
}

export default function WelcomeScreen({ onEnter, activeLogo }: WelcomeScreenProps) {
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Clock format: HH:mm:ss WIB
      setTimeString(
        now.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        }) + ' WIB'
      );

      // Date format: Sen, 10 Jul 2026
      setDateString(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      id="welcome-screen-container" 
      className="min-h-screen lg:h-screen lg:max-h-screen bg-transparent text-slate-100 flex flex-col justify-between p-4 md:p-6 lg:p-8 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans select-none"
    >
      {/* Intense futuristic ambient neon glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[35%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none -z-10" />
      
      {/* 1. Header (Translucent Glass Bar) */}
      <header 
        id="welcome-header" 
        className="max-w-7xl mx-auto w-full flex justify-between items-center py-3.5 px-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div className="p-0.5 bg-blue-600 text-white rounded-xl border border-blue-400 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0 w-12 h-12">
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
            ) : (
              <ShieldCheck className="w-8 h-8 animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-sm text-slate-100 block font-sans">AHRQ SOPS v2.0</span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider font-bold block">Agency for Healthcare Research and Quality</span>
          </div>
        </div>

        {/* Real-time Date and Clock Widget (Premium & Futuristic) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Date pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.06] shadow-inner text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-medium tracking-wide">{dateString || 'Memuat...'}</span>
          </div>

          {/* Clock pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 backdrop-blur-md border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.12)] text-cyan-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold tracking-wider">{timeString || '--:--:-- WIB'}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area (Left-Aligned Layout) */}
      <main 
        id="welcome-main" 
        className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center items-start text-left py-6 lg:py-0 px-6"
      >
        
        {/* Headline & CTA */}
        <div className="space-y-6 flex flex-col justify-center items-start text-left w-[620px] max-w-[620px]">
          
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[51px] w-[533px] font-black text-white tracking-tight leading-[1.08] font-sans text-left"
            >
              Sistem Survei <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                Budaya Keselamatan Pasien
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#acbdd6] text-xs md:text-sm leading-relaxed w-[514px] text-justify font-light"
            >
              Platform digital untuk pelaksanaan, analisis, dan pelaporan Survei Budaya Keselamatan Pasien berbasis AHRQ SOPS Version 2.0 yang terintegrasi secara realtime guna mendukung peningkatan mutu pelayanan dan keselamatan pasien di rumah sakit
            </motion.p>
          </div>

          {/* Core Interactive Action */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-start"
          >
            <button
              onClick={onEnter}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl inline-flex items-center gap-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/45 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer text-sm tracking-wide"
            >
              MULAI SURVEI
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </motion.div>
            </button>
          </motion.div>

        </div>

      </main>

      {/* 3. Footer (Clean, Modern minimal signature) */}
      <footer 
        id="welcome-footer" 
        className="max-w-7xl mx-auto w-full py-4 border-t border-slate-900/60 text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 px-6"
      >
        <p>© 2026 Sistem Survei Budaya Keselamatan Pasien • AHRQ SOPS v2.0</p>
        <div className="flex gap-4 font-mono">
          <span className="hover:text-slate-400 transition-colors">STANDAR AKREDITASI KEMENKES</span>
        </div>
      </footer>

    </div>
  );
}
