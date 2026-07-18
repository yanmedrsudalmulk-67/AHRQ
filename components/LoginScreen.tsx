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

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 p-8">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto p-0.5 bg-blue-600 text-white rounded-xl border border-blue-400 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0 w-16 h-16">
            {activeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeLogo.url} alt="AHRQ Logo" className="w-full h-full object-contain scale-105" />
            ) : (
              <ShieldCheck className="w-10 h-10" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-sans font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-xs text-slate-500 font-medium">Silakan login ke dalam Sistem Survei AHRQ SOPS 2.0</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6">
          <button
            onClick={() => { setActiveTab('rs'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'rs' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Portal Rumah Sakit
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all transform-gpu cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Admin Utama
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-semibold animate-pulse">
            {error}
          </div>
        )}

        {/* Hospital Login Form */}
        {activeTab === 'rs' && (
          <form onSubmit={handleRsSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Username Rumah Sakit</label>
              <input
                type="text"
                required
                placeholder="Masukan Username"
                value={rsUsername}
                onChange={e => setRsUsername(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:shadow-xs transition-all transform-gpu outline-none text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Password</label>
              <div className="relative">
                <input
                  type={showRsPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan Password"
                  value={rsPassword}
                  onChange={e => setRsPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:shadow-xs transition-all transform-gpu outline-none text-slate-800 placeholder-slate-400 font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowRsPassword(!showRsPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showRsPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold rounded-xl text-sm shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/25 transition-all transform-gpu cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Masuk ke Portal RS
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-blue-600 hover:text-blue-700 text-xs font-bold underline cursor-pointer"
              >
                Daftar Akun RS Anda
              </button>
            </div>
          </form>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Username Admin Utama</label>
              <input
                type="text"
                required
                placeholder="Masukan Username"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:shadow-xs transition-all transform-gpu outline-none text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Password</label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:shadow-xs transition-all transform-gpu outline-none text-slate-800 placeholder-slate-400 font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold rounded-xl text-sm shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/25 transition-all transform-gpu cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Masuk Admin Utama
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
