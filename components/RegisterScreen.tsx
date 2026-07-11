'use client';

import { useState } from 'react';
import { UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { createHospitalAccount } from '../lib/db';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: (hospital: { username: string; kodeRs: string; namaRs: string }) => void;
}

export default function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
  const [namaRs, setNamaRs] = useState('');
  const [kodeRs, setKodeRs] = useState('');
  const [alamatRs, setAlamatRs] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!namaRs || !kodeRs || !alamatRs) {
      setError('Semua field wajib diisi');
      return;
    }

    const username = kodeRs.trim().toLowerCase();

    try {
      await createHospitalAccount({
        username: username,
        kodeRs: kodeRs.trim(),
        namaRs: namaRs.trim(),
        alamatRs: alamatRs.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onRegisterSuccess({
          username: username,
          kodeRs: kodeRs.trim(),
          namaRs: namaRs.trim(),
        });
      }, 1500);
    } catch (err) {
      setError('Gagal mendaftarkan akun ke database.');
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
        disabled={success}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
      </button>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl p-8 my-8">
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-sans font-semibold text-white">Daftar Akun RS Baru</h2>
          <p className="text-xs text-slate-400">Daftarkan fasyankes Anda untuk mengukur budaya keselamatan pasien</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-xs text-indigo-400">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Akun Rumah Sakit berhasil didaftarkan! Mengalihkan ke login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama Rumah Sakit</label>
              <input
                type="text"
                required
                disabled={success}
                placeholder="cth: RSUD Harapan Bangsa"
                value={namaRs}
                onChange={e => setNamaRs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kode Fasyankes / RS</label>
              <input
                type="text"
                required
                disabled={success}
                placeholder="cth: RS320401"
                value={kodeRs}
                onChange={e => setKodeRs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Alamat Rumah Sakit</label>
            <input
              type="text"
              required
              disabled={success}
              placeholder="Jl. Kesehatan Raya No. 100, Jakarta"
              value={alamatRs}
              onChange={e => setAlamatRs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 disabled:opacity-50"
            />
          </div>

          <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs text-slate-400 space-y-1 leading-normal">
            <p className="font-semibold text-indigo-400 flex items-center gap-1">
              💡 Catatan Keamanan Akun:
            </p>
            <p>Untuk kemudahan login demo ini, setelah mendaftar gunakan <strong>Kode RS</strong> Anda baik sebagai username maupun password login portal fasyankes.</p>
          </div>

          <button
            type="submit"
            disabled={success}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" /> Registrasi Akun Rumah Sakit
          </button>
        </form>
      </div>
    </div>
  );
}
