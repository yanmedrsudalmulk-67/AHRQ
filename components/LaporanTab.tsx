'use client';

import { useState, useEffect } from 'react';
import { FileText, Printer, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: number };
}

interface LaporanTabProps {
  surveys: SurveyData[];
  namaRs: string;
}

const DIMENSI_NAMES: { [key: string]: string } = {
  d7: 'Komunikasi tentang Kesalahan',
  d6: 'Keterbukaan Komunikasi',
  d10: 'Serah Terima Pasien & Pertukaran Informasi',
  d9: 'Dukungan Manajemen RS terhadap Keselamatan Pasien',
  d3: 'Pembelajaran Organisasi & Peningkatan Berkelanjutan',
  d8: 'Frekuensi Pelaporan Kejadian Keselamatan Pasien',
  d4: 'Respon terhadap Kesalahan secara Non-Punitif',
  d2: 'Ketenagaan dan Beban Kerja',
  d5: 'Dukungan Supervisor/Manajer untuk Keselamatan',
  d1: 'Kerjasama Tim',
};

const scoreToPercent = (score: number): number => {
  if (score === 5) return 96;
  if (score === 4) return 78;
  if (score === 3) return 48;
  if (score === 2) return 22;
  return 6;
};

export default function LaporanTab({ surveys, namaRs }: LaporanTabProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(surveys[0]?.id || 'compiled');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const selectedSurvey = surveys.find(s => s.id === selectedReportId);

  // Compile totals across all surveys
  const totalResponden = surveys.reduce((acc, curr) => acc + curr.jumlahResponden, 0);

  const rawAverages: { [key: string]: number } = {
    d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0, d9: 0, d10: 0
  };

  if (surveys.length > 0) {
    surveys.forEach(s => {
      if (s.dimensiScores) {
        Object.keys(rawAverages).forEach(key => {
          rawAverages[key] += s.dimensiScores[key] || 0;
        });
      }
    });
    Object.keys(rawAverages).forEach(key => {
      rawAverages[key] = parseFloat((rawAverages[key] / surveys.length).toFixed(2));
    });
  }

  // Get active scores based on selection (specific unit or compiled)
  const activeScores = selectedReportId === 'compiled' || !selectedSurvey
    ? rawAverages
    : (selectedSurvey.dimensiScores || rawAverages);

  const activeUnit = selectedReportId === 'compiled' || !selectedSurvey
    ? 'Kompilasi Seluruh Unit Kerja'
    : selectedSurvey.unitKerja;

  const activeRespondenCount = selectedReportId === 'compiled' || !selectedSurvey
    ? totalResponden
    : selectedSurvey.jumlahResponden;

  const activeTanggal = selectedReportId === 'compiled' || !selectedSurvey
    ? (currentDate || 'Memuat...')
    : selectedSurvey.tanggalInput;

  if (surveys.length === 0) {
    return (
      <div className="p-12 bg-slate-900/30 rounded-2xl border border-slate-800/60 text-center space-y-4 max-w-xl mx-auto my-12">
        <FileText className="w-12 h-12 text-indigo-500/30 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">Belum Ada Dokumen Laporan</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Seluruh data ditiadakan untuk menjamin kepatuhan data realtime. Silakan masukkan data kuesioner terlebih dahulu pada menu <strong className="text-indigo-400">Input Data Survei</strong> agar dokumen laporan otomatis terbuat secara realtime.
        </p>
      </div>
    );
  }

  // Generate assessment and actionable recommendation based on data
  const assessments = Object.keys(DIMENSI_NAMES).map(key => {
    const rawVal = activeScores[key];
    const percent = Math.round(scoreToPercent(rawVal));
    let status: 'LULUS_KUAT' | 'NETRAL' | 'PERLU_PERBAIKAN' = 'NETRAL';
    let label = 'Netral / Sedang';
    let colorClass = 'text-slate-400 bg-slate-950/40 border-slate-800';

    if (percent >= 75) {
      status = 'LULUS_KUAT';
      label = 'Kekuatan Budaya';
      colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (percent < 50) {
      status = 'PERLU_PERBAIKAN';
      label = 'Area Perbaikan';
      colorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
    }

    return {
      key,
      name: DIMENSI_NAMES[key],
      raw: rawVal,
      percent,
      status,
      label,
      colorClass,
    };
  });

  // Dynamic recommendation generators based on the lowest scoring areas
  const weakPoints = [...assessments]
    .filter(a => a.status === 'PERLU_PERBAIKAN')
    .sort((a, b) => a.percent - b.percent);

  const strongPoints = [...assessments]
    .filter(a => a.status === 'LULUS_KUAT')
    .sort((a, b) => b.percent - a.percent);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: black !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background: white !important;
            color: black !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          .print-badge {
            border: 1px solid #94a3b8 !important;
            color: black !important;
            background: #f1f5f9 !important;
          }
        }
      `}</style>

      {/* Control panel (no-print) */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-indigo-400" /> Dokumen & Laporan Cetak SOPS 2.0
          </h2>
          <p className="text-xs text-slate-400 mt-1">Pilih data survei untuk menghasilkan laporan komprehensif, rekomendasi taktis, dan format cetak.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedReportId}
            onChange={e => setSelectedReportId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 cursor-pointer"
          >
            <option value="compiled">Gabungan (Kompilasi RS)</option>
            {surveys.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {idx + 1}. {s.unitKerja} ({s.tanggalInput})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak PDF / Kertas
          </button>
        </div>
      </div>

      {/* Compiled Professional Report */}
      <div className="print-container bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 space-y-8 shadow-xl">
        
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20 font-bold tracking-wider">
              AHRQ OFFICIAL REPORT TEMPLATE
            </span>
            <h1 className="text-2xl font-sans font-bold text-white print-text-dark">Laporan Budaya Keselamatan Pasien</h1>
            <p className="text-sm text-slate-400 print-text-muted font-medium">{namaRs}</p>
          </div>

          <div className="space-y-1 text-left sm:text-right text-xs text-slate-400 print-text-muted">
            <p><strong>Cakupan Unit:</strong> {activeUnit}</p>
            <p><strong>Total Responden Staf:</strong> {activeRespondenCount} orang</p>
            <p><strong>Tanggal Dokumen:</strong> {activeTanggal}</p>
          </div>
        </div>

        {/* Overview Statement */}
        <div className="p-4 bg-slate-900/50 print-card rounded-xl border border-slate-800 text-xs text-slate-300 print-text-muted leading-relaxed">
          Dokumen ini berisi hasil analisis terstruktur mengenai kuesioner Budaya Keselamatan Pasien berdasarkan instrumen evaluasi resmi <strong>AHRQ SOPS (Surveys on Patient Safety Culture) Versi 2.0</strong>. Penilaian dikategorikan ke dalam 10 dimensi inti untuk mengukur seberapa kondusif fasyankes mendukung keselamatan pasien dalam aktivitas operasional harian.
        </div>

        {/* Dimension Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 print-text-dark flex items-center gap-2">
            Matriks Hasil Penilaian Dimensi AHRQ SOPS 2.0
          </h3>

          <div className="overflow-x-auto border border-slate-800/80 rounded-2xl print-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 print-badge text-slate-300 font-semibold">
                  <th className="p-4 w-12 text-center">NO</th>
                  <th className="p-4">DIMENSI BUDAYA KESELAMATAN PASIEN</th>
                  <th className="p-4 text-center w-24">SKOR (1-5)</th>
                  <th className="p-4 text-center w-28">RESPON POSITIF (%)</th>
                  <th className="p-4 text-center w-36">KATEGORI EVALUASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print-card">
                {assessments.map((item, idx) => (
                  <tr key={item.key} className="hover:bg-slate-900/20">
                    <td className="p-4 text-center font-mono font-bold text-slate-400 print-text-muted">{idx + 1}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-200 print-text-dark">{item.name}</p>
                    </td>
                    <td className="p-4 text-center font-mono font-semibold text-slate-300 print-text-dark">{item.raw}</td>
                    <td className="p-4 text-center font-mono font-bold text-indigo-400 print-text-dark">{item.percent}%</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border print-badge ${item.colorClass}`}>
                        {item.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 print-text-dark flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" /> AI-Generated Rekomendasi Taktis & Program Kerja
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recommendations to improve weak points */}
            <div className="p-5 bg-slate-900/40 print-card border border-slate-800 rounded-2xl space-y-4">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Program Perbaikan Prioritas (Area Lemah)
              </h4>

              {weakPoints.length === 0 ? (
                <p className="text-xs text-slate-400">Tidak ditemukan dimensi dengan nilai di bawah 50%. Budaya fasyankes berada pada tingkat yang stabil.</p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-800/50">
                  {weakPoints.slice(0, 2).map((weak, i) => (
                    <div key={weak.key} className={`space-y-1.5 ${i > 0 ? 'pt-4' : ''}`}>
                      <p className="text-xs font-bold text-slate-200 print-text-dark">{weak.name} ({weak.percent}% Respon Positif)</p>
                      
                      {/* Detailed action plan */}
                      <ul className="list-disc pl-4 text-[11px] text-slate-400 print-text-muted space-y-1">
                        {weak.key === 'd4' && (
                          <>
                            <li>Terapkan protokol <strong>&quot;Just Culture&quot;</strong> untuk memisahkan kesalahan manusia tidak disengaja dengan kelalaian sistematis.</li>
                            <li>Hapus pemberian sanksi atau surat peringatan langsung pada laporan incident awal.</li>
                            <li>Lakukan sharing session bulanan mengenai &quot;Lessons Learned&quot; dari insiden keselamatan pasien tanpa mencantumkan identitas pelaku.</li>
                          </>
                        )}
                        {weak.key === 'd2' && (
                          <>
                            <li>Review ulang rasio perawat-ke-pasien (nurse-to-patient ratio) di unit {activeUnit} terutama saat shift malam.</li>
                            <li>Sediakan tim backup on-call untuk mengantisipasi lonjakan pasien tak terduga.</li>
                            <li>Optimalkan otomatisasi pencatatan rekam medis elektronik guna memangkas durasi administrasi staf.</li>
                          </>
                        )}
                        {weak.key === 'd10' && (
                          <>
                            <li>Wajibkan penggunaan metode komunikasi terstruktur seperti <strong>SBAR (Situation, Background, Assessment, Recommendation)</strong>.</li>
                            <li>Gunakan lembar checklist verifikasi tertulis saat melakukan handover serah terima pasien antar-shift.</li>
                            <li>Sediakan waktu khusus 10-15 menit tenang (quiet zone) saat proses serah terima pasien berlangsung.</li>
                          </>
                        )}
                        {!['d4', 'd2', 'd10'].includes(weak.key) && (
                          <>
                            <li>Lakukan workshop dan sosialisasi intensif untuk seluruh jajaran staf medis terkait pentingnya budaya keselamatan pasien.</li>
                            <li>Sediakan kotak aspirasi atau sistem pelaporan anonim demi memberikan rasa aman bagi pelapor.</li>
                            <li>Lakukan peninjauan berkala (audit) terhadap jalannya Standard Operating Procedure (SOP) di unit kerja.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations to maintain strengths */}
            <div className="p-5 bg-slate-900/40 print-card border border-slate-800 rounded-2xl space-y-4">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Strategi Pemeliharaan (Kekuatan Budaya)
              </h4>

              {strongPoints.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada dimensi dengan nilai di atas 75%. Terus lakukan pemantauan dan peningkatkan mutu budaya fasyankes Anda.</p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-800/50">
                  {strongPoints.slice(0, 2).map((strong, i) => (
                    <div key={strong.key} className={`space-y-1.5 ${i > 0 ? 'pt-4' : ''}`}>
                      <p className="text-xs font-bold text-slate-200 print-text-dark">{strong.name} ({strong.percent}% Respon Positif)</p>
                      
                      <ul className="list-disc pl-4 text-[11px] text-slate-400 print-text-muted space-y-1">
                        <li>Jadikan unit kerja yang bersangkutan sebagai <strong>&quot;Role Model / Benchmark&quot;</strong> percontohan bagi departemen fasyankes lainnya.</li>
                        <li>Berikan apresiasi resmi berupa penghargaan berkala (safety award) kepada perwakilan staf fasyankes.</li>
                        <li>Dokumentasikan SOP dan cara kerja di bidang ini ke dalam modul onboarding staf medis baru.</li>
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Validation signatures (nice document realism) */}
        <div className="pt-12 border-t border-slate-800 flex justify-between items-end gap-6 text-xs text-slate-400 print-text-muted">
          <div>
            <p>Sistem Akreditasi Kemenkes RI</p>
            <p className="font-mono text-[10px] text-slate-600">ID Dokumen: SOPS-RSAM-{selectedReportId.substring(4, 10)}</p>
          </div>
          <div className="text-right space-y-12">
            <p>Disetujui Oleh,</p>
            <div className="border-t border-slate-700 pt-2 w-48 text-center ml-auto">
              <p className="font-semibold text-slate-200 print-text-dark">Ketua Komite Mutu & KKP</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
