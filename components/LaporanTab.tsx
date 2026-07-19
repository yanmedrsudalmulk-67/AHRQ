'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileText, Construction } from 'lucide-react';

export default function LaporanTab() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-12 rounded-[40px] shadow-2xl shadow-indigo-500/5"
      >
        <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-indigo-100">
          <Construction className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
            MENU LAPORAN SURVEI <br />
            <span className="text-indigo-600">MASIH DALAM TAHAP PENGEMBANGAN</span>
          </h2>
          
          <div className="h-1.5 w-24 bg-gradient-to-r from-indigo-500 to-cyan-500 mx-auto rounded-full"></div>
          
          <p className="text-slate-500 font-medium text-lg pt-4 leading-relaxed">
            Kami sedang bekerja keras untuk menghadirkan fitur pelaporan yang komprehensif dan interaktif untuk Anda. 
            Terima kasih atas kesabaran Anda.
          </p>
        </div>

        <div className="pt-10 flex justify-center gap-4">
          <div className="px-6 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-black text-slate-400 uppercase tracking-widest shadow-sm">
            Coming Soon
          </div>
          <div className="px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-black text-indigo-600 uppercase tracking-widest shadow-sm">
            v2.1 Update
          </div>
        </div>
      </motion.div>
    </div>
  );
}
