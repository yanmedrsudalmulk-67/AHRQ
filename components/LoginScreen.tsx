'use client';

import { useState, useEffect } from 'react';
import { LogIn, ArrowLeft, ShieldCheck, ClipboardCheck, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { getHospitalAccounts, updateLastLogin } from '../lib/db';
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

      if (status === 'Disabled') {
        setError('Akun rumah sakit Anda telah dinonaktifkan oleh Administrator. Silakan hubungi Admin Utama untuk informasi lebih lanjut.');
        return;
      }

      if (status === 'Archived') {
        setError('Akun rumah sakit Anda telah diarsipkan/dihapus oleh Administrator. Silakan hubungi Admin Utama untuk informasi lebih lanjut.');
        return;
      }

      // Record last login timestamp in Supabase
      updateLastLogin(found.id || found.username).catch(err => console.warn("Update last login error:", err));

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
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col justify-center items-center md:items-start md:pl-16 lg:pl-28 p-6 relative overflow-hidden">
      {/* Decorative ambient glows for Glassmorphism depth */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      {/* Back button on the top-right corner */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 text-slate-800 hover:text-blue-700 flex items-center gap-2 text-sm font-black transition-all bg-white/50 hover:bg-white/80 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-white/60 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-20"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Glassmorphism 2.0 Card */}
      <div className="w-full max-w-md bg-white/45 backdrop-blur-3xl rounded-[36px] border border-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22),0_0_1px_1px_rgba(255,255,255,0.7)_inset] p-8 relative overflow-hidden group z-10">
        {/* Specular gloss glow inside card */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none"></div>
        {/* Shine effect sweep overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

        <div className="text-center space-y-4 mb-8 relative z-10">
          <div className="mx-auto p-0.5 bg-white text-blue-600 rounded-2xl border-2 border-teal-400 ring-2 ring-white shadow-md flex items-center justify-center shrink-0 w-20 h-20 overflow-hidden relative group/logo">
            <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-125 p-1" />
            ) : (
              <ShieldCheck className="w-14 h-14 text-blue-600" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-[33px] font-sans font-black text-slate-900 tracking-tight drop-shadow-sm">Selamat Datang</h2>
            <div className="text-[10px] sm:text-[10.5px] text-slate-700 font-extrabold uppercase tracking-wider leading-snug space-y-0.5">
              <p className="text-slate-600">SILAHKAN MASUK UNTUK MENGAKSES</p>
              <p className="text-[#45556c] font-black text-[11px] sm:text-[11.5px] tracking-tight">SISTEM SURVEI BUDAYA KESELAMATAN PASIEN</p>
              <p className="text-slate-600">MENGGUNAKAN INSTRUMEN AHRQ SOPS V2.0</p>
            </div>
          </div>
        </div>

        {/* Tab Selector with Glassmorphism 2.0 */}
        <div className="flex bg-slate-900/10 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/60 mb-6 relative z-10 shadow-inner">
          <button
            onClick={() => { setActiveTab('rs'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'rs' 
                ? 'bg-gradient-to-r from-[#43B8BD] to-[#2FA7A7] text-white shadow-[0_8px_20px_rgba(67,184,189,0.3)] ring-1 ring-white/50' 
                : 'text-slate-800 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            Portal Rumah Sakit
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-gradient-to-r from-[#43B8BD] to-[#2FA7A7] text-white shadow-[0_8px_20px_rgba(67,184,189,0.3)] ring-1 ring-white/50' 
                : 'text-slate-800 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            Admin Utama
          </button>
        </div>

        <div className="relative z-10">
          {error && (
            <div className="mb-6 p-4 bg-red-500/15 backdrop-blur-xl border border-red-500/40 rounded-2xl text-[11px] text-red-700 text-center font-black uppercase tracking-tight shadow-sm animate-in fade-in zoom-in">
              {error}
            </div>
          )}

          {/* Hospital Login Form */}
          {activeTab === 'rs' && (
            <form onSubmit={handleRsSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Username Rumah Sakit</label>
                <input
                  type="text"
                  required
                  placeholder="Masukan Username"
                  value={rsUsername}
                  onChange={e => setRsUsername(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-2xl border border-white/70 rounded-2xl px-5 py-3.5 text-sm focus:bg-white/90 focus:border-[#43B8BD] focus:ring-4 focus:ring-[#43B8BD]/20 transition-all outline-none text-slate-900 placeholder-slate-500 font-bold shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showRsPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan Password"
                    value={rsPassword}
                    onChange={e => setRsPassword(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-2xl border border-white/70 rounded-2xl px-5 py-3.5 text-sm focus:bg-white/90 focus:border-[#43B8BD] focus:ring-4 focus:ring-[#43B8BD]/20 transition-all outline-none text-slate-900 placeholder-slate-500 font-bold pr-14 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRsPassword(!showRsPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-[#43B8BD] transition-colors cursor-pointer"
                  >
                    {showRsPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#43B8BD] to-[#2FA7A7] hover:from-[#369C9F] hover:to-[#1E6F73] text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-md shadow-teal-500/15 hover:shadow-lg hover:shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all transform-gpu cursor-pointer flex items-center justify-center gap-2 group ring-1 ring-white/40"
              >
                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" /> Masuk ke Portal RS
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="text-[#2FA7A7] hover:text-[#1E6F73] text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer bg-white/50 hover:bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/60 shadow-sm hover:shadow-md inline-block"
                >
                  Daftar Akun Rumah Sakit
                </button>
              </div>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Username Admin Utama</label>
                <input
                  type="text"
                  required
                  placeholder="Masukan Username"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-2xl border border-white/70 rounded-2xl px-5 py-3.5 text-sm focus:bg-white/90 focus:border-[#43B8BD] focus:ring-4 focus:ring-[#43B8BD]/20 transition-all outline-none text-slate-900 placeholder-slate-500 font-bold shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-2xl border border-white/70 rounded-2xl px-5 py-3.5 text-sm focus:bg-white/90 focus:border-[#43B8BD] focus:ring-4 focus:ring-[#43B8BD]/20 transition-all outline-none text-slate-900 placeholder-slate-500 font-bold pr-14 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-[#43B8BD] transition-colors cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#43B8BD] to-[#2FA7A7] hover:from-[#369C9F] hover:to-[#1E6F73] text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-md shadow-teal-500/15 hover:shadow-lg hover:shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all transform-gpu cursor-pointer flex items-center justify-center gap-2 group ring-1 ring-white/40"
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
