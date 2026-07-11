'use client';

import { useState, useEffect } from 'react';
import { LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getHospitalAccounts } from '../lib/db';

interface LoginScreenProps {
  onBack: () => void;
  onLoginSuccess: (role: 'rs' | 'admin', identifier: string, name: string) => void;
  onGoToRegister: () => void;
  registeredHospitals: Array<{ username: string; kodeRs: string; namaRs: string }>;
}

export default function LoginScreen({
  onBack,
  onLoginSuccess,
  onGoToRegister,
  registeredHospitals,
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'rs' | 'admin'>('rs');
  const [rsUsername, setRsUsername] = useState('');
  const [rsPassword, setRsPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
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

  const handleRsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rsUsername || !rsPassword) {
      setError('Username dan password harus diisi');
      return;
    }

    const found = hospitals.find(
      h => h.username.toLowerCase() === rsUsername.toLowerCase() && h.kodeRs === rsPassword
    );

    if (found) {
      onLoginSuccess('rs', found.username, found.namaRs);
    } else {
      setError('Kombinasi Username RS dan Kode RS salah');
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
    <div className="min-h-screen bg-slate-950/30 backdrop-blur-xs text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl p-8">
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-sans font-semibold text-white">Selamat Datang</h2>
          <p className="text-xs text-slate-400">Silakan login ke dalam Sistem Survei AHRQ SOPS 2.0</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 mb-6">
          <button
            onClick={() => { setActiveTab('rs'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rs' 
                ? 'bg-indigo-600 text-white font-semibold shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portal Rumah Sakit
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-indigo-600 text-white font-semibold shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin Utama
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Hospital Login Form */}
        {activeTab === 'rs' && (
          <form onSubmit={handleRsSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username Rumah Sakit</label>
              <input
                type="text"
                required
                placeholder="cth: rskepresidenan"
                value={rsUsername}
                onChange={e => setRsUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kode RS (Password)</label>
              <input
                type="password"
                required
                placeholder="Masukkan Kode RS (cth: RS1002)"
                value={rsPassword}
                onChange={e => setRsPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Masuk ke Portal RS
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium underline cursor-pointer"
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
              <label className="text-xs font-semibold text-slate-300">Username Admin Utama</label>
              <input
                type="text"
                required
                placeholder="SURVEYRSAM"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Masuk Admin Utama
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
