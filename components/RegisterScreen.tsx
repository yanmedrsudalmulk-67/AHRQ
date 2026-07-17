'use client';

import { useState } from 'react';
import { UserPlus, ArrowLeft, ShieldCheck, Mail, Phone, MapPin, User, FileText, Lock, CheckCircle2, Database, Copy, Check } from 'lucide-react';
import { createHospitalAccount } from '../lib/db';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: (hospital: { username: string; kodeRs: string; namaRs: string }) => void;
}

export default function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
  const [namaRs, setNamaRs] = useState('');
  const [kodeRs, setKodeRs] = useState('');
  const [alamatRs, setAlamatRs] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kotaKab, setKotaKab] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [emailRs, setEmailRs] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlMigration = `ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS kode_rs TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS provinsi TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS kota_kab TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS penanggung_jawab TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS jabatan TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS no_whatsapp TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS email_rs TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending';
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.hospital_accounts ALTER COLUMN kode_rs DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.email_notifications (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigration);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 1. Validasi semua data wajib
    if (!namaRs || !alamatRs || !provinsi || !kotaKab || !penanggungJawab || !jabatan || !noWhatsapp || !emailRs || !username || !password || !confirmPassword) {
      setError('Semua field wajib diisi kecuali Kode Rumah Sakit.');
      return;
    }

    // 2. Validasi Panjang Password dan Kekuatan Password
    if (password.length < 6) {
      setError('Password harus memiliki panjang minimal 6 karakter.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError('Password harus mengandung minimal 1 huruf besar (kapital), 1 huruf kecil, dan 1 angka untuk keamanan fasyankes Anda.');
      return;
    }

    // 3. Validasi Konfirmasi Password
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setLoading(true);

    try {
      // 4. Buat akun dengan status 'Pending' secara default
      await createHospitalAccount({
        username: username.trim().toLowerCase(),
        kodeRs: kodeRs.trim() || undefined,
        namaRs: namaRs.trim(),
        alamatRs: alamatRs.trim(),
        password: password,
        provinsi: provinsi.trim(),
        kotaKab: kotaKab.trim(),
        penanggungJawab: penanggungJawab.trim(),
        jabatan: jabatan.trim(),
        noWhatsapp: noWhatsapp.trim(),
        emailRs: emailRs.trim().toLowerCase(),
        status: 'Pending'
      });

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Gagal mendaftarkan akun ke database Supabase.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B101E] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Decorative ambient glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-emerald-500/30 shadow-2xl p-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-sans font-bold text-white tracking-tight">Registrasi Berhasil Dikirim</h2>
            <p className="text-emerald-400 font-medium text-sm">Status Akun: Pending Approval</p>
          </div>

          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-left text-sm text-slate-300 leading-relaxed space-y-3">
            <p className="font-semibold text-white flex items-center gap-1.5">
              📢 Informasi Penting:
            </p>
            <p className="font-sans">
              Permohonan Anda sedang menunggu persetujuan <strong>Admin Pusat</strong>. Anda akan menerima email pemberitahuan setelah akun disetujui.
            </p>
            <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-400 space-y-1">
              <p>• <strong>Nama Rumah Sakit:</strong> {namaRs}</p>
              <p>• <strong>Email Terdaftar:</strong> {emailRs}</p>
              <p>• <strong>Username:</strong> {username}</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all transform-gpu cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            Kembali ke Login Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/30 backdrop-blur-xs text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all transform-gpu cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
      </button>

      <div className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800/80 shadow-2xl p-8 my-8">
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-sans font-semibold text-white">Daftar Akun Rumah Sakit</h2>
          <p className="text-xs text-slate-400">Daftarkan fasyankes Anda untuk mengukur budaya keselamatan pasien melalui persetujuan Admin</p>
        </div>

        {error && (
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">
              ⚠️ {error}
            </div>

            {(error.toLowerCase().includes('schema cache') || 
              error.toLowerCase().includes('column') || 
              error.toLowerCase().includes('approval_date') || 
              error.toLowerCase().includes('relation') || 
              error.toLowerCase().includes('email_notifications') ||
              error.toLowerCase().includes('does not exist')) && (
              <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Diperlukan Update Skema Database Supabase</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sistem mendeteksi bahwa database Supabase Anda belum memiliki kolom baru untuk persetujuan akun & notifikasi email. Silakan jalankan kueri SQL di bawah ini untuk memperbarui database Anda secara instan:
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-1">
                    <span>MIGRASI SQL (Salin & Jalankan di Supabase SQL Editor):</span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-all transform-gpu cursor-pointer text-[10px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Salin SQL
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-black/60 rounded-xl border border-slate-800 text-[10px] font-mono text-indigo-300 overflow-x-auto max-h-40 leading-relaxed select-all">
                    {sqlMigration}
                  </pre>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-white">🛠️ Langkah Mudah Update Database:</p>
                  <p>1. Masuk ke dashboard <strong>Supabase</strong> Anda.</p>
                  <p>2. Pilih proyek Anda, lalu klik menu <strong>SQL Editor</strong> di bilah sisi kiri.</p>
                  <p>3. Klik <strong>New Query</strong>, tempel (paste) kode SQL yang disalin di atas.</p>
                  <p>4. Klik tombol <strong>Run</strong> (atau tekan Ctrl+Enter / Cmd+Enter).</p>
                  <p className="text-emerald-400 font-medium">✓ Selesai! Setelah itu, silakan klik ulang tombol &quot;Daftar Akun Rumah Sakit&quot; di bawah.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BAGIAN 1: Identitas Rumah Sakit */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <MapPin className="w-3.5 h-3.5" /> 1. Identitas Rumah Sakit
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama Rumah Sakit <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: RSUD Al-Mulk"
                  value={namaRs}
                  onChange={e => setNamaRs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kode Rumah Sakit <span className="text-slate-500 text-[10px]">(Opsional)</span></label>
                <input
                  type="text"
                  placeholder="cth: RS320401"
                  value={kodeRs}
                  onChange={e => setKodeRs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alamat Rumah Sakit <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="cth: Jl. Pramuka No. 12, Kota Bengkulu"
                value={alamatRs}
                onChange={e => setAlamatRs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Provinsi <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: Bengkulu"
                  value={provinsi}
                  onChange={e => setProvinsi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kota / Kabupaten <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: Kota Bengkulu"
                  value={kotaKab}
                  onChange={e => setKotaKab(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: Penanggung Jawab & Kontak */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <User className="w-3.5 h-3.5" /> 2. Penanggung Jawab & Kontak
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama Penanggung Jawab <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: dr. Ahmad Fauzi"
                  value={penanggungJawab}
                  onChange={e => setPenanggungJawab(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Jabatan <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: Kepala Bidang Pelayanan Medik"
                  value={jabatan}
                  onChange={e => setJabatan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nomor WhatsApp <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="cth: 081234567890"
                  value={noWhatsapp}
                  onChange={e => setNoWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Resmi RS <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="cth: info@rsudalmulk.com"
                  value={emailRs}
                  onChange={e => setEmailRs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 3: Kredensial Akun */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Lock className="w-3.5 h-3.5" /> 3. Kredensial Akun Portal
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username Rumah Sakit <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="cth: rsudalmulk (digunakan untuk login)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter, huruf & angka"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Konfirmasi Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all transform-gpu outline-none text-slate-200"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all transform-gpu cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses Registrasi...
              </span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Daftar Akun Rumah Sakit
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
