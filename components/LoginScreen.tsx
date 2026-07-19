'use client';

import { useState, useEffect } from 'react';
import { LogIn, ArrowLeft, ShieldCheck, ClipboardCheck, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { getHospitalAccounts } from '../lib/db';
import { LogoData } from '../lib/logo';

interface LoginScreenProps {
  onBack: () => void;
  onLoginSuccess: (role: 'rs' | 'admin', identifier: string, name: string, hospitalId?: string) => void;
  onGoToRegister: () => void;
  registeredHospitals: Array<{ username: string; kodeRs: string; namaRs: string }>;
  activeLogo?: LogoData | null;
}

export default function LoginScreen({
  onBack,
  onLoginSuccess,
  onGoToRegister,
  registeredHospitals,
  activeLogo,
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'rs' | 'admin'>('rs');
  const [rsUsername, setRsUsername] = useState('');
  const [rsPassword, setRsPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showRsPassword, setShowRsPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await getHospitalAccounts();
        setHospitals(data);
      } catch (err) {
        console.error("Gagal memuat akun RS:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHospitals();
  }, [registeredHospitals]);

  const handleRsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rsUsername || !rsPassword) {
      setError('Username dan password harus diisi');
      return;
    }

    try {
      // Find the account by username (case-insensitive)
      const found = hospitals.find(
        h => h.username.toLowerCase() === rsUsername.toLowerCase().trim()
      );

      if (!found) {
        setError('Username Rumah Sakit tidak ditemukan.');
        return;
      }

      // Check Password
      let isMatch = false;
      if (found.password && (found.password.startsWith('$2a$') || found.password.startsWith('$2b$'))) {
        isMatch = await bcrypt.compare(rsPassword, found.password);
      } else {
        // Fallback check for plain text legacy accounts
        isMatch = found.password === rsPassword || found.kodeRs === rsPassword;
      }

      if (!isMatch) {
        setError('Password yang Anda masukkan salah.');
        return;
      }

      // Check Status
      const status = found.status || 'Active'; // Fallback for legacy accounts

      if (status === 'Pending') {
        setError('Akun Anda masih menunggu persetujuan Administrator.');
        return;
      }

      if (status === 'Rejected') {
        setError('Akun Anda belum disetujui. Silakan hubungi Administrator.');
        return;
      }

      // Proceed on Active status
      onLoginSuccess('rs', found.username, found.namaRs, found.id);
    } catch (err) {
      console.error("Login error:", err);
      setError('Terjadi kesalahan koneksi saat login.');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminUsername || !adminPassword) {
      setError('Username dan password harus diisi');
      return;
    }

    if (adminUsername === 'SURVEYRSAM' && adminPassword === '123456') {
      onLoginSuccess('admin', 'admin', 'Administrator Pusat');
    } else {
      setError('Username Admin Utama atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold transition-all transform-gpu cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="w-full max-w-md bg-white/30 backdrop-blur-2xl rounded-[32px] border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-white/30 p-8 relative overflow-hidden group">
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

        <div className="text-center space-y-4 mb-8 relative z-10">
          <div className="mx-auto p-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl border border-white/40 shadow-[0_12px_32px_rgba(37,99,235,0.35)] ring-1 ring-white/40 flex items-center justify-center shrink-0 w-20 h-20 overflow-hidden relative group/logo">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
            ) : (
              <ShieldCheck className="w-12 h-12" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-sans font-black text-slate-800 tracking-tight">Selamat Datang</h2>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Silakan login ke dalam Sistem Survei AHRQ SOPS 2.0</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 mb-6 relative z-10 shadow-inner">
          <button
            onClick={() => { setActiveTab('rs'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'rs' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] ring-1 ring-white/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Portal Rumah Sakit
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] ring-1 ring-white/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Admin Utama
          </button>
        </div>

        <div className="relative z-10">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl text-[11px] text-red-600 text-center font-black uppercase tracking-tight animate-in fade-in zoom-in">
              {error}
            </div>
          )}

          {/* Hospital Login Form */}
          {activeTab === 'rs' && (
            <form onSubmit={handleRsSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username Rumah Sakit</label>
                <input
                  type="text"
                  required
                  placeholder="Masukan Username"
                  value={rsUsername}
                  onChange={e => setRsUsername(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-bold shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showRsPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan Password"
                    value={rsPassword}
                    onChange={e => setRsPassword(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-bold pr-14 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRsPassword(!showRsPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showRsPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-[0_12px_24px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
              >
                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" /> Masuk ke Portal RS
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="text-blue-600 hover:text-indigo-700 text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer border-b-2 border-transparent hover:border-indigo-600 pb-0.5"
                >
                  Daftar Akun RS Anda
                </button>
              </div>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username Admin Utama</label>
                <input
                  type="text"
                  required
                  placeholder="Masukan Username"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-bold shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-bold pr-14 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-[0_12px_24px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
              >
                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" /> Masuk Admin Utama
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
