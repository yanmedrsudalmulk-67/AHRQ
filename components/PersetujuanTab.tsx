'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Check, 
  X, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  Send,
  AlertCircle,
  Database,
  Copy
} from 'lucide-react';
import { HospitalAccount, updateHospitalAccountStatus, getEmailNotifications, EmailNotification } from '../lib/db';
import useSWR from 'swr';

interface PersetujuanTabProps {
  accounts: HospitalAccount[];
  onMutateAccounts: () => void;
}

export default function PersetujuanTab({ accounts, onMutateAccounts }: PersetujuanTabProps) {
  const [selectedAccount, setSelectedAccount] = useState<HospitalAccount | null>(null);
  const [accountToApprove, setAccountToApprove] = useState<HospitalAccount | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const sqlMigration = `ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending';
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.email_notifications (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

NOTIFY pgrst, reload_schema;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigration);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // SWR to poll email logs in real-time
  const { data: emailLogs = [], mutate: mutateEmails } = useSWR('email_logs', getEmailNotifications, {
    fallbackData: [],
    refreshInterval: 3000
  });

  const handleApprove = async () => {
    if (!accountToApprove) return;
    
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateHospitalAccountStatus(accountToApprove.id, 'Active', 'Administrator Pusat');
      setSuccessMsg(`Akun ${accountToApprove.namaRs} berhasil disetujui dan diaktifkan.`);
      setAccountToApprove(null);
      onMutateAccounts();
      mutateEmails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyetujui akun.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    if (!rejectReason.trim()) {
      setErrorMsg('Mohon masukkan alasan penolakan.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateHospitalAccountStatus(selectedAccount.id, 'Rejected', 'Administrator Pusat', rejectReason.trim());
      setSuccessMsg(`Pendaftaran akun ${selectedAccount.namaRs} telah ditolak.`);
      setIsRejectOpen(false);
      setRejectReason('');
      setSelectedAccount(null);
      onMutateAccounts();
      mutateEmails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menolak akun.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats summary for accounts
  const totalPending = accounts.filter(a => a.status === 'Pending').length;
  const totalActive = accounts.filter(a => a.status === 'Active').length;
  const totalRejected = accounts.filter(a => a.status === 'Rejected').length;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            Persetujuan Akun Rumah Sakit
          </h2>
          <p className="text-xs text-slate-400 mt-1">Verifikasi pendaftaran fasyankes baru, aktifkan akun, dan kirimkan email notifikasi</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 bg-yellow-500/5 rounded-2xl border border-yellow-500/20 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Menunggu Persetujuan</span>
            <span className="text-2xl font-extrabold text-yellow-400 mt-0.5 block">{totalPending} RS</span>
          </div>
        </div>

        <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Akun Aktif</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-0.5 block">{totalActive} RS</span>
          </div>
        </div>

        <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pendaftaran Ditolak</span>
            <span className="text-2xl font-extrabold text-red-400 mt-0.5 block">{totalRejected} RS</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>

          {(errorMsg.toLowerCase().includes('schema cache') || 
            errorMsg.toLowerCase().includes('column') || 
            errorMsg.toLowerCase().includes('approval_date') || 
            errorMsg.toLowerCase().includes('relation') || 
            errorMsg.toLowerCase().includes('email_notifications') ||
            errorMsg.toLowerCase().includes('does not exist')) && (
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
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-all cursor-pointer text-[10px]"
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
                <p className="text-emerald-400 font-medium">✓ Selesai! Setelah itu, silakan klik ulang tombol persetujuan atau penolakan akun.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Daftar Permohonan Registrasi</h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold font-mono">Total: {accounts.length}</span>
        </div>

        <div className="overflow-x-auto">
          {accounts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Building2 className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-sm">Belum ada data pendaftaran akun rumah sakit di database.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-300 divide-y divide-white/5">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 text-center w-12">No</th>
                  <th className="p-4">Nama RS / Wilayah</th>
                  <th className="p-4">Email / Kontak</th>
                  <th className="p-4">Penanggung Jawab</th>
                  <th className="p-4 text-center">Tanggal Daftar</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((acc, index) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-center font-bold text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">{acc.namaRs}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {acc.kotaKab || '-'}, {acc.provinsi || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {acc.emailRs || '-'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {acc.noWhatsapp || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{acc.penanggungJawab || '-'}</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">{acc.jabatan || '-'}</div>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-400">
                      {acc.created_at ? new Date(acc.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {acc.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-full font-bold text-[10px]">
                          <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} /> Pending
                        </span>
                      )}
                      {acc.status === 'Active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      )}
                      {acc.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-full font-bold text-[10px]">
                          <XCircle className="w-3 h-3" /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAccount(acc);
                            setIsDetailOpen(true);
                          }}
                          title="Lihat Detail"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        {acc.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => setAccountToApprove(acc)}
                              disabled={actionLoading}
                              title="Setujui Akun"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAccount(acc);
                                setIsRejectOpen(true);
                              }}
                              disabled={actionLoading}
                              title="Tolak Akun"
                              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 2: Email Sending Log History */}
      <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Riwayat Pengiriman Email & Notifikasi (Database Logs)
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Log real-time yang memverifikasi bahwa sistem otomatis mengirimkan email notifikasi pendaftaran ke Administrator Utama (<strong>yanmedrsudalmulk@gmail.com</strong>) dan email aktivasi/penolakan ke Rumah Sakit.
          </p>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {emailLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">Belum ada email yang dikirim oleh sistem.</p>
          ) : (
            emailLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                  log.type === 'admin_notification' 
                    ? 'bg-yellow-500/5 border-yellow-500/10' 
                    : log.type === 'approval' 
                      ? 'bg-emerald-500/5 border-emerald-500/10' 
                      : 'bg-red-500/5 border-red-500/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-sm">{log.subject}</p>
                    <p className="text-[10px] text-slate-400">
                      <strong>Kepada:</strong> <span className="text-indigo-300">{log.to_email}</span> • 
                      <strong> Tipe:</strong> <span className="uppercase text-cyan-400 font-mono font-bold text-[9px] ml-1">{log.type}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '-'}
                  </span>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-normal">
                  {log.body}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL 1: Detail Akun Rumah Sakit (12 Fields) */}
      {isDetailOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Detail Registrasi Akun Rumah Sakit
              </h3>
              <button 
                onClick={() => { setIsDetailOpen(false); setSelectedAccount(null); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70dvh] overflow-y-auto">
              
              {/* Status Section */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Permohonan</span>
                <div>
                  {selectedAccount.status === 'Pending' && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Menunggu Persetujuan
                    </span>
                  )}
                  {selectedAccount.status === 'Active' && (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Aktif / Disetujui
                    </span>
                  )}
                  {selectedAccount.status === 'Rejected' && (
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full font-bold text-xs flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Grid 1: Identitas Fasyankes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1">
                  <MapPin className="w-3.5 h-3.5" /> 1. Identitas Fasyankes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500">Nama Rumah Sakit:</span>
                    <p className="font-bold text-sm text-white">{selectedAccount.namaRs}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Kode Fasyankes (RS):</span>
                    <p className="font-bold text-sm text-white">{selectedAccount.kodeRs || '-'}</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <span className="text-slate-500">Alamat Lengkap:</span>
                    <p className="font-medium text-slate-200">{selectedAccount.alamatRs}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Provinsi:</span>
                    <p className="font-bold text-slate-200">{selectedAccount.provinsi || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Kota / Kabupaten:</span>
                    <p className="font-bold text-slate-200">{selectedAccount.kotaKab || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Grid 2: Penanggung Jawab */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1">
                  <User className="w-3.5 h-3.5" /> 2. Penanggung Jawab & Kontak resmi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500">Nama Penanggung Jawab:</span>
                    <p className="font-bold text-sm text-white">{selectedAccount.penanggungJawab || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Jabatan:</span>
                    <p className="font-bold text-slate-200">{selectedAccount.jabatan || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Nomor WhatsApp:</span>
                    <p className="font-bold text-slate-200 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {selectedAccount.noWhatsapp || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Email Resmi RS:</span>
                    <p className="font-bold text-slate-200 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {selectedAccount.emailRs || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid 3: Akun Kredensial */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 3. Kredensial Akun Portal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500">Username Login:</span>
                    <p className="font-bold text-sm text-white">{selectedAccount.username}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Password:</span>
                    <p className="font-bold text-slate-500">•••••••• (Hashed Securely)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Tanggal Registrasi:</span>
                    <p className="font-medium text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {selectedAccount.created_at ? new Date(selectedAccount.created_at).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval/Rejection details (if approved or rejected) */}
              {(selectedAccount.approvedBy || selectedAccount.rejectionReason) && (
                <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider border-b border-slate-800 pb-1">
                    ⚙️ Riwayat Keputusan Admin
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedAccount.approvedBy && (
                      <div className="space-y-1">
                        <span className="text-slate-500">Diproses Oleh:</span>
                        <p className="font-bold text-slate-200">{selectedAccount.approvedBy}</p>
                      </div>
                    )}
                    {selectedAccount.approvalDate && (
                      <div className="space-y-1">
                        <span className="text-slate-500">Waktu Keputusan:</span>
                        <p className="font-medium text-slate-300">{new Date(selectedAccount.approvalDate).toLocaleString('id-ID')}</p>
                      </div>
                    )}
                    {selectedAccount.rejectionReason && (
                      <div className="col-span-1 sm:col-span-2 space-y-1">
                        <span className="text-red-400 font-semibold">Alasan Penolakan:</span>
                        <p className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg text-red-300 leading-normal">
                          {selectedAccount.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 bg-slate-950/40 border-t border-slate-800/80 flex justify-end gap-3">
              <button
                onClick={() => { setIsDetailOpen(false); setSelectedAccount(null); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
              
              {selectedAccount.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRejectOpen(true);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tolak Akun
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailOpen(false);
                      setAccountToApprove(selectedAccount);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Setujui Akun
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Dialog Alasan Penolakan */}
      {isRejectOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Alasan Penolakan Akun</h3>
              <button 
                onClick={() => { setIsRejectOpen(false); setRejectReason(''); setSelectedAccount(null); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-300 leading-normal">
                  <p>Anda menolak pendaftaran akun untuk <strong>{selectedAccount.namaRs}</strong>. Rumah Sakit akan otomatis menerima notifikasi email mengenai status ini.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tuliskan Alasan Penolakan <span className="text-red-400">*</span></label>
                  <textarea
                    required
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="cth: Mohon lampirkan data penanggung jawab yang sah, atau verifikasi nomor email resmi RS Anda."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-950/40 border-t border-slate-800/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsRejectOpen(false); setRejectReason(''); setSelectedAccount(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Memproses...' : 'Tolak & Kirim Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Persetujuan */}
      {accountToApprove && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-950/20">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Konfirmasi
              </h3>
              <button 
                onClick={() => setAccountToApprove(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-sm text-slate-300 leading-relaxed text-center">
              Apakah Anda yakin ingin menyetujui pendaftaran akun untuk <strong className="text-white">{accountToApprove.namaRs}</strong>?
              <br/><br/>
              Akun ini akan langsung diaktifkan dan sistem akan mengirimkan email notifikasi persetujuan kepada rumah sakit.
            </div>

            <div className="p-6 bg-slate-950/40 border-t border-slate-800/80 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setAccountToApprove(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 w-full"
              >
                {actionLoading ? 'Memproses...' : 'Setuju & Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
