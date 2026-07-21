'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  RotateCcw, 
  Trash2, 
  Search, 
  Building2, 
  Mail, 
  Calendar, 
  AlertCircle,
  FileText,
  History,
  Check,
  X,
  Send,
  HelpCircle
} from 'lucide-react';
import { BenchmarkRequest, updateBenchmarkRequestStatus, deleteBenchmarkRequest } from '../lib/db';

interface PersetujuanBenchmarkTabProps {
  currentHospitalId: string;
  currentHospitalName: string;
  currentHospitalEmail?: string;
  requests: BenchmarkRequest[];
  onRefresh: () => void;
}

export default function PersetujuanBenchmarkTab({
  currentHospitalId,
  currentHospitalName,
  currentHospitalEmail,
  requests = [],
  onRefresh
}: PersetujuanBenchmarkTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'history'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<BenchmarkRequest | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter incoming requests (where current hospital is target_id or target_name)
  const incomingRequests = useMemo(() => {
    return requests.filter(r => {
      const isTarget = r.target_id === currentHospitalId || 
                       r.target_name.toLowerCase() === currentHospitalName.toLowerCase() ||
                       currentHospitalId === 'admin';
      const isPending = r.status === 'pending';
      return isTarget && isPending;
    });
  }, [requests, currentHospitalId, currentHospitalName]);

  // Filter history requests (all decided / requests where current hospital is target or requester)
  const historyRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = r.requester_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [requests, searchQuery]);

  const handleApprove = async (req: BenchmarkRequest) => {
    setIsProcessing(true);
    try {
      await updateBenchmarkRequestStatus(req.id, 'approved', currentHospitalName, actionNotes || 'Disetujui untuk perbandingan data benchmark');
      showNotification(`Permintaan benchmark dari ${req.requester_name} berhasil DISETUJUI.`, 'success');
      setSelectedRequestForDetail(null);
      setActionNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
      showNotification('Gagal memproses persetujuan. Coba lagi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (req: BenchmarkRequest) => {
    setIsProcessing(true);
    try {
      await updateBenchmarkRequestStatus(req.id, 'rejected', currentHospitalName, actionNotes || 'Ditolak oleh rumah sakit tujuan');
      showNotification(`Permintaan benchmark dari ${req.requester_name} DITOLAK.`, 'success');
      setSelectedRequestForDetail(null);
      setActionNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
      showNotification('Gagal memproses penolakan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (req: BenchmarkRequest) => {
    if (!confirm(`Apakah Anda yakin ingin mencabut persetujuan benchmark untuk ${req.requester_name}?`)) return;
    setIsProcessing(true);
    try {
      await updateBenchmarkRequestStatus(req.id, 'revoked', currentHospitalName, 'Persetujuan dicabut oleh rumah sakit tujuan');
      showNotification(`Persetujuan benchmark untuk ${req.requester_name} telah DICABUT.`, 'success');
      onRefresh();
    } catch (err) {
      console.error(err);
      showNotification('Gagal mencabut persetujuan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHistory = async (reqId: string) => {
    if (!confirm("Hapus catatan riwayat ini?")) return;
    try {
      await deleteBenchmarkRequest(reqId);
      showNotification('Riwayat berhasil dihapus.', 'success');
      onRefresh();
    } catch (err) {
      showNotification('Gagal menghapus riwayat.', 'error');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold border ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Keamanan & Tata Kelola Data Supabase
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Persetujuan Benchmark Data</h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Kelola izin berbagi data hasil survei budaya keselamatan pasien secara realtime. Data rumah sakit Anda aman dan hanya dapat dibandingkan oleh rumah sakit lain setelah disetujui.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 shrink-0">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-400/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider block">Rumah Sakit Anda</span>
              <span className="text-sm font-bold text-white block truncate max-w-[200px]">{currentHospitalName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('incoming')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'incoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Permintaan Masuk</span>
            {incomingRequests.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat & Akses Benchmark ({requests.length})</span>
          </button>
        </div>

        {/* Search filter for history */}
        {activeSubTab === 'history' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama rumah sakit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-sans"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'incoming' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800">Daftar Permintaan Benchmark Menunggu Persetujuan</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total Pending: <strong className="text-blue-700">{incomingRequests.length}</strong>
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Tidak Ada Permintaan Menunggu</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Saat ini tidak ada rumah sakit lain yang mengajukan permintaan izin benchmark data kepada rumah sakit Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Rumah Sakit Pemohon</th>
                    <th className="py-3.5 px-4">Email Kontak</th>
                    <th className="py-3.5 px-4">Tanggal Permintaan</th>
                    <th className="py-3.5 px-4 text-center">Tahun Data</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center min-w-[200px]">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {incomingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span>{req.requester_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.requester_email || 'Tidak tersedia'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(req.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-blue-700">
                        {req.requested_year}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          Menunggu Persetujuan
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedRequestForDetail(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            Detail
                          </button>

                          <button
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui
                          </button>

                          <button
                            onClick={() => handleReject(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-sm text-slate-800">Riwayat Permintaan & Pengaturan Izin Benchmark</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total Riwayat: <strong className="text-indigo-700">{historyRequests.length}</strong>
            </span>
          </div>

          {historyRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Belum Ada Riwayat</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Riwayat permintaan yang Anda kirim atau terima akan tercatat di sini beserta status keputusan dan tanggalnya.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">RS Pemohon</th>
                    <th className="py-3.5 px-4">RS Tujuan</th>
                    <th className="py-3.5 px-4">Tanggal Permintaan</th>
                    <th className="py-3.5 px-4">Tanggal Keputusan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Pengambil Keputusan</th>
                    <th className="py-3.5 px-4 text-center">Kelola Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {historyRequests.map((req) => {
                    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    let label: string = req.status;

                    if (req.status === 'approved') {
                      badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
                      label = "Disetujui";
                    } else if (req.status === 'rejected') {
                      badgeClass = "bg-rose-100 text-rose-800 border-rose-300";
                      label = "Ditolak";
                    } else if (req.status === 'pending') {
                      badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
                      label = "Menunggu";
                    } else if (req.status === 'revoked') {
                      badgeClass = "bg-slate-200 text-slate-800 border-slate-300";
                      label = "Dicabut";
                    }

                    const isTargetOfReq = req.target_id === currentHospitalId || req.target_name === currentHospitalName || currentHospitalId === 'admin';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {req.requester_name}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-900">
                          {req.target_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(req.decided_at)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {req.decided_by || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {req.status === 'approved' && isTargetOfReq && (
                              <button
                                onClick={() => handleRevoke(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Cabut persetujuan agar RS pemohon tidak dapat melihat data benchmark lagi"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Cabut Akses
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteHistory(req.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="Hapus riwayat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail & Action Modal */}
      <AnimatePresence>
        {selectedRequestForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 font-sans"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-emerald-400 rounded-xl border border-blue-400/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Detail Permintaan Benchmark</h3>
                    <p className="text-xs text-blue-200">Evaluasi izin akses perbandingan data survei</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequestForDetail(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Rumah Sakit Pemohon:</span>
                    <strong className="text-slate-900 text-sm block">{selectedRequestForDetail.requester_name}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Email Kontak:</span>
                    <strong className="text-blue-700 text-sm block">{selectedRequestForDetail.requester_email || '-'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Tanggal Pengajuan:</span>
                    <strong className="text-slate-800 block">{formatDate(selectedRequestForDetail.created_at)}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Tahun Data Yang Diminta:</span>
                    <strong className="text-indigo-700 text-sm block">{selectedRequestForDetail.requested_year}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Data Yang Akan Dibandingkan:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Dimensi Budaya Keselamatan</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Capaian Per Item</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Posisi Staf</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Unit / Area Kerja</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Interaksi Pasien</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">Masa Kerja</span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-indigo-900 font-semibold">
                    <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      &quot;Apakah Anda mengizinkan rumah sakit ini menggunakan data rumah sakit Anda sebagai benchmark pada fitur Analisa Data?&quot;
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Catatan / Pesan Persetujuan (Opsional):</label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Contoh: Disetujui untuk perbandingan evaluasi mutu bersama..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedRequestForDetail(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handleReject(selectedRequestForDetail)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak Permintaan
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handleApprove(selectedRequestForDetail)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui Permintaan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
