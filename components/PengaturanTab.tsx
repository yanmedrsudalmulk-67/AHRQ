'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Settings, 
  Save, 
  UploadCloud, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Trash2, 
  Loader2, 
  Check, 
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  Database,
  Key,
  Copy,
  RefreshCw,
  Wifi,
  WifiOff,
  Terminal
} from 'lucide-react';
import { saveWallpaper, clearWallpaper, WallpaperData } from '../lib/wallpaper';
import { saveLogo, clearLogo, LogoData } from '../lib/logo';
import { isSupabaseConnected, testSupabaseConnection } from '../lib/supabase';
import { syncAllLocalDataToSupabase } from '../lib/db';

interface PengaturanTabProps {
  namaRs: string;
  onUpdateRsName: (name: string) => void;
  onResetData: () => void;
  activeWallpaper: WallpaperData | null;
  onUpdateWallpaper: (wallpaper: WallpaperData | null) => void;
  activeLogo: LogoData | null;
  onUpdateLogo: (logo: LogoData | null) => void;
}

export default function PengaturanTab({ 
  namaRs, 
  onUpdateRsName, 
  activeWallpaper,
  onUpdateWallpaper,
  activeLogo,
  onUpdateLogo
}: PengaturanTabProps) {
  const [tempName, setTempName] = useState(namaRs);
  const [alamatRs, setAlamatRs] = useState('Jl. Kesehatan Raya No. 100, Jakarta');
  const [isSaved, setIsSaved] = useState(false);
  
  // Wallpaper states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wallpaperUrlInput, setWallpaperUrlInput] = useState('');
  const [wallpaperUrlType, setWallpaperUrlType] = useState<'image' | 'video'>('image');
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'url'>('upload');
  
  // Logo states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [activeLogoSubTab, setActiveLogoSubTab] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const hasSupabase = isSupabaseConnected();

  // Supabase integrations
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<null | { success: boolean; message: string; tableMissing: boolean }>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<null | { success: boolean; message: string; surveysSynced: number; accountsSynced: number; wallpaperSynced: boolean }>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRsName(tempName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnResult(null);
    try {
      const res = await testSupabaseConnection();
      setConnResult(res);
    } catch (e: any) {
      setConnResult({ success: false, message: e.message || String(e), tableMissing: false });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSyncData = async () => {
    if (!confirm('Apakah Anda yakin ingin menyinkronkan data kuesioner dan akun lokal ke database Supabase? Tindakan ini akan mengunggah data yang belum tersimpan di cloud.')) {
      return;
    }
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllLocalDataToSupabase();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({
        success: false,
        message: e.message || String(e),
        surveysSynced: 0,
        accountsSynced: 0,
        wallpaperSynced: false
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sqlText = `-- SCRIPT SQL SCHEMA UNTUK SUPABASE SQL EDITOR --
-- Jalankan kode ini di tab "SQL Editor" pada dashboard Supabase Anda --

-- 1. Tabel Kuesioner AHRQ
CREATE TABLE IF NOT EXISTS ahrq_surveys (
  id TEXT PRIMARY KEY,
  nama_rs TEXT,
  unit_kerja TEXT,
  jumlah_responden INTEGER,
  tanggal_input TEXT,
  dimensi_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE ahrq_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Seluruhnya" ON ahrq_surveys;
CREATE POLICY "Akses Publik Seluruhnya" ON ahrq_surveys FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabel Pengaturan Aplikasi (Wallpaper, dll)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Seluruhnya" ON app_settings;
CREATE POLICY "Akses Publik Seluruhnya" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabel Akun Fasyankes
CREATE TABLE IF NOT EXISTS hospital_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  kode_rs TEXT,
  nama_rs TEXT,
  alamat_rs TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE hospital_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Akses Publik Seluruhnya" ON hospital_accounts;
CREATE POLICY "Akses Publik Seluruhnya" ON hospital_accounts FOR ALL USING (true) WITH CHECK (true);

-- 4. Set Up Storage Bucket untuk Unggah Wallpaper
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Membaca Publik" ON storage.objects;
CREATE POLICY "Membaca Publik" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Mengunggah Publik" ON storage.objects;
CREATE POLICY "Mengunggah Publik" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Memperbarui Publik" ON storage.objects;
CREATE POLICY "Memperbarui Publik" ON storage.objects FOR UPDATE USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Menghapus Publik" ON storage.objects;
CREATE POLICY "Menghapus Publik" ON storage.objects FOR DELETE USING (bucket_id = 'wallpapers');

-- 5. Set Up Storage Bucket untuk Unggah Logo AHRQ
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Membaca Publik Logo" ON storage.objects;
CREATE POLICY "Membaca Publik Logo" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Mengunggah Publik Logo" ON storage.objects;
CREATE POLICY "Mengunggah Publik Logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "Memperbarui Publik Logo" ON storage.objects;
CREATE POLICY "Memperbarui Publik Logo" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Menghapus Publik Logo" ON storage.objects;
CREATE POLICY "Menghapus Publik Logo" ON storage.objects FOR DELETE USING (bucket_id = 'logos');`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Drag & drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');

    if (!isImage && !isVideo) {
      setUploadError('Format berkas tidak didukung. Harap unggah gambar (PNG, JPG, JPEG) atau video.');
      return;
    }

    if (isVideo && file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran video terlalu besar. Batas maksimal unggah video adalah 5MB.');
      return;
    }

    if (isImage && file.size > 15 * 1024 * 1024) {
      setUploadError('Ukuran gambar terlalu besar. Batas maksimal adalah 15MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const fileType = isVideo ? 'video' : 'image';
        
        try {
          const savedWp = await saveWallpaper(base64Data, fileType, file.name);
          onUpdateWallpaper(savedWp);
        } catch (err: any) {
          console.error("Gagal menyimpan berkas:", err);
          setUploadError(err?.message || 'Gagal menyimpan wallpaper ke sistem. Silakan coba lagi.');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setUploadError('Gagal membaca berkas.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadError('Terjadi kesalahan saat memproses berkas.');
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallpaperUrlInput.trim()) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const savedWp = await saveWallpaper(wallpaperUrlInput.trim(), 'image', 'url_wallpaper');
      onUpdateWallpaper(savedWp);
      setWallpaperUrlInput('');
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || 'Gagal menyimpan URL wallpaper.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearWallpaper = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus wallpaper kustom dan kembali ke latar belakang bawaan?')) {
      setIsUploading(true);
      try {
        await clearWallpaper();
        onUpdateWallpaper(null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Logo handlers
  const handleLogoDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLogoDragging(true);
  };

  const handleLogoDragLeave = () => {
    setIsLogoDragging(false);
  };

  const processLogoFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      setLogoUploadError('Format berkas tidak didukung. Harap unggah gambar (PNG, JPG, JPEG, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Ukuran gambar terlalu besar. Batas maksimal adalah 5MB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        try {
          const savedLogo = await saveLogo(base64Data, file.name);
          onUpdateLogo(savedLogo);
        } catch (err: any) {
          console.error("Gagal menyimpan logo:", err);
          setLogoUploadError(err?.message || 'Gagal menyimpan logo ke sistem. Silakan coba lagi.');
        } finally {
          setIsUploadingLogo(false);
        }
      };

      reader.onerror = () => {
        setLogoUploadError('Gagal membaca berkas.');
        setIsUploadingLogo(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLogoUploadError('Terjadi kesalahan saat memproses berkas.');
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processLogoFile(file);
    }
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processLogoFile(file);
    }
  };

  const handleLogoUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoUrlInput.trim()) return;

    setIsUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const savedLogo = await saveLogo(logoUrlInput.trim(), 'url_logo');
      onUpdateLogo(savedLogo);
      setLogoUrlInput('');
    } catch (err: any) {
      console.error(err);
      setLogoUploadError(err?.message || 'Gagal menyimpan URL logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleClearLogo = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus logo kustom dan kembali menggunakan lambang bawaan?')) {
      setIsUploadingLogo(true);
      try {
        await clearLogo();
        onUpdateLogo(null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-indigo-400" /> Pengaturan Sistem
          </h2>
          <p className="text-xs text-slate-400 mt-1">Konfigurasikan profil fasyankes dan wallpaper personalisasi Anda.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Database className={`w-3.5 h-3.5 ${hasSupabase ? 'text-emerald-400' : 'text-amber-500'}`} />
          {hasSupabase ? 'Database Supabase Terhubung' : 'Database Lokal (Fallback)'}
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse">
          <Save className="w-4 h-4" /> Pengaturan profil fasyankes berhasil diperbarui!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identitas Rumah Sakit */}
        <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-400" /> Profil Fasyankes
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Nama Rumah Sakit / Instansi</label>
              <input
                type="text"
                required
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Alamat Lengkap</label>
              <input
                type="text"
                required
                value={alamatRs}
                onChange={e => setAlamatRs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-500/15 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Perbarui Profil RS
              </button>
            </div>
          </form>
        </div>

        {/* Wallpaper Konfigurasi */}
        <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-cyan-400" /> Wallpaper Latar Belakang
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Ubah latar belakang halaman utama, login, dan landing page.</p>
          </div>

          {/* Sub-tab Selection */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveSubTab('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'upload' 
                  ? 'bg-slate-850 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unggah Berkas
            </button>
            <button
              onClick={() => setActiveSubTab('url')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'url' 
                  ? 'bg-slate-850 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gunakan Tautan/URL
            </button>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {activeSubTab === 'upload' ? (
            /* Upload File Tab */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/10'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, video/mp4, video/webm"
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-medium">Sedang memproses dan menyinkronkan ke Supabase...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 rounded-xl inline-block border border-slate-800">
                    <UploadCloud className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Tarik & Letakkan berkas di sini, atau <span className="text-indigo-400 underline">pilih berkas</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    Mendukung gambar kustom (PNG, JPG, JPEG) hingga maks. 15MB atau video (MP4/WebM) hingga maks. 5MB.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Paste URL Tab */
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Tautan / URL Gambar Latar Belakang</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://contoh.com/wallpaper.jpg"
                    value={wallpaperUrlInput}
                    onChange={e => setWallpaperUrlInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 font-mono text-xs"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Masukkan tautan URL langsung ke gambar (PNG/JPG). Video latar belakang tidak lagi menggunakan tautan URL dan wajib diunggah secara langsung pada tab &quot;Unggah Berkas&quot; dengan batasan maksimal 5MB.
                </p>
              </div>
 
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading || !wallpaperUrlInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Terapkan Tautan
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Active Wallpaper Preview & Management */}
          {activeWallpaper && (
            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  {activeWallpaper.type === 'video' ? (
                    <>
                      <VideoIcon className="w-3.5 h-3.5 text-cyan-400" /> Video Aktif
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Gambar Aktif
                    </>
                  )}
                </span>
                <button
                  onClick={handleClearWallpaper}
                  disabled={isUploading}
                  className="text-red-400 hover:text-red-300 transition-all text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Wallpaper
                </button>
              </div>

              {/* Live Thumbnail Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {activeWallpaper.type === 'video' ? (
                  <video
                    src={activeWallpaper.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeWallpaper.url}
                    alt="Wallpaper preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-300 max-w-[200px] truncate">
                  {activeWallpaper.url}
                </div>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[10.5px] text-slate-400 flex gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Wallpaper kustom secara otomatis disinkronkan ke tabel <code className="text-indigo-400 font-mono">app_settings</code> dan media berkas disimpan ke dalam bucket <code className="text-indigo-400 font-mono">wallpapers</code> di Supabase Anda, serta disimpan di peramban secara otomatis sebagai cadangan instan.
            </p>
          </div>
        </div>

        {/* Logo AHRQ Konfigurasi */}
        <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-400 animate-pulse" /> Logo Instansi / AHRQ
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Ubah logo lambang instansi yang tampil di Side Bar dan Hero Section halaman utama.</p>
          </div>

          {/* Sub-tab Selection */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveLogoSubTab('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeLogoSubTab === 'upload' 
                  ? 'bg-slate-850 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unggah Berkas
            </button>
            <button
              onClick={() => setActiveLogoSubTab('url')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeLogoSubTab === 'url' 
                  ? 'bg-slate-850 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gunakan Tautan/URL
            </button>
          </div>

          {logoUploadError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{logoUploadError}</span>
            </div>
          )}

          {activeLogoSubTab === 'upload' ? (
            /* Upload File Tab */
            <div
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
              onDrop={handleLogoDrop}
              onClick={() => logoFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isLogoDragging 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/10'
              }`}
            >
              <input
                type="file"
                ref={logoFileInputRef}
                onChange={handleLogoFileChange}
                accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                className="hidden"
              />
              
              {isUploadingLogo ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-medium">Sedang memproses dan menyinkronkan ke Supabase...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 rounded-xl inline-block border border-slate-800">
                    <UploadCloud className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Tarik & Letakkan logo di sini, atau <span className="text-indigo-400 underline">pilih berkas</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    Mendukung format gambar (PNG, JPG, JPEG, SVG) hingga maks. 5MB.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Paste URL Tab */
            <form onSubmit={handleLogoUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Tautan / URL Logo Baru</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://contoh.com/logo.png"
                    value={logoUrlInput}
                    onChange={e => setLogoUrlInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-200 font-mono text-xs"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Masukkan tautan URL langsung ke gambar logo instansi Anda (PNG/JPG/SVG).
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingLogo || !logoUrlInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Terapkan Tautan
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Active Logo Preview & Management */}
          {activeLogo && (
            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Logo Aktif
                </span>
                <button
                  onClick={handleClearLogo}
                  disabled={isUploadingLogo}
                  className="text-red-400 hover:text-red-300 transition-all text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Logo
                </button>
              </div>

              {/* Live Thumbnail Preview */}
              <div className="relative p-4 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[100px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeLogo.url}
                  alt="Logo preview"
                  className="max-h-[80px] w-auto object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-300 max-w-[200px] truncate">
                  {activeLogo.url}
                </div>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[10.5px] text-slate-400 flex gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Logo kustom secara otomatis disinkronkan ke tabel <code className="text-indigo-400 font-mono">app_settings</code> dan media berkas disimpan ke dalam bucket <code className="text-indigo-400 font-mono">logos</code> di Supabase Anda, serta disimpan di peramban secara otomatis sebagai cadangan instan.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Database Integration Settings */}
      <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" /> Integrasi Database Supabase Cloud
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan database cloud Supabase untuk mengaktifkan sinkronisasi real-time instan dan penyimpanan permanen bagi seluruh unit kerja fasyankes Anda.
          </p>
        </div>

        {/* Database Connection Status Block */}
        <div className={`p-5 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          hasSupabase 
            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
            : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
        }`}>
          <div className="flex items-start gap-3">
            {hasSupabase ? (
              <Wifi className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <WifiOff className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold text-sm">
                Status: {hasSupabase ? 'Koneksi Cloud Aktif' : 'Berjalan Secara Lokal (Luring)'}
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-xl">
                {hasSupabase 
                  ? 'Aplikasi terhubung dengan aman ke database cloud Supabase melalui variabel lingkungan sistem. Seluruh data kuesioner, akun RS, dan wallpaper akan disinkronkan secara otomatis.' 
                  : 'Aplikasi saat ini menyimpan semua data secara lokal pada peramban web Anda. Untuk mengaktifkan sinkronisasi database cloud otomatis, atur variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di server.'
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConn}
              className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700/60 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isTestingConn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> Menguji...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Uji Koneksi Database
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSyncData}
              disabled={isSyncing || !hasSupabase}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyinkronkan...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" /> Sinkronkan Data ke Cloud
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connection results feedback */}
        {connResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-fadeIn ${
            connResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {connResult.success ? <Wifi className="w-4 h-4 shrink-0 mt-0.5" /> : <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <span className="font-bold">{connResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</span>
              <p className="opacity-90 leading-relaxed">{connResult.message}</p>
              {connResult.tableMissing && (
                <button
                  type="button"
                  onClick={() => setShowSqlSchema(true)}
                  className="mt-2 text-[10px] font-bold underline text-indigo-300 hover:text-indigo-200 block text-left cursor-pointer"
                >
                  Tampilkan Script Pembuatan Tabel (SQL Schema)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sync results feedback */}
        {syncResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-fadeIn ${
            syncResult.success 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">{syncResult.success ? 'Sinkronisasi Selesai' : 'Peringatan Sinkronisasi'}</span>
              <p className="opacity-90 leading-relaxed">{syncResult.message}</p>
              <div className="flex gap-4 pt-1 text-[11px] font-semibold text-slate-300">
                <span>📊 Survei Disalin: <strong className="text-emerald-400 font-mono">{syncResult.surveysSynced}</strong></span>
                <span>🔐 Akun RS Disalin: <strong className="text-emerald-400 font-mono">{syncResult.accountsSynced}</strong></span>
                <span>🖼️ Wallpaper: <strong className="text-emerald-400 font-mono">{syncResult.wallpaperSynced ? 'Disinkronkan' : 'Sesuai'}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* SQL Schema collapsible section */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="w-full px-4 py-3 bg-slate-950/60 hover:bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-300 transition-all outline-none cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Tampilkan Script SQL Schema Pembuatan Tabel (Supabase)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {showSqlSchema ? '[Sembunyikan]' : '[Buka/Salin]'}
            </span>
          </button>

          {showSqlSchema && (
            <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950 text-[11px] text-slate-300">
              <p className="text-slate-400 leading-relaxed">
                Salin kode di bawah ini, buka panel <strong>SQL Editor</strong> di dashboard Supabase Anda, buat kueri baru (<strong>New Query</strong>), tempel kodenya, dan klik <strong>Run</strong>. Ini akan secara otomatis membuat seluruh tabel, mengaktifkan keamanan baris (RLS), dan membuat bucket penyimpanan wallpaper kustom.
              </p>

              <div className="relative">
                <pre className="p-4 bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-mono overflow-x-auto text-slate-300 max-h-64 scrollbar-thin">
                  {`-- SCRIPT SQL SCHEMA UNTUK SUPABASE SQL EDITOR --
-- Jalankan kode ini di tab "SQL Editor" pada dashboard Supabase Anda --

-- 1. Tabel Kuesioner AHRQ
CREATE TABLE IF NOT EXISTS ahrq_surveys (
  id TEXT PRIMARY KEY,
  nama_rs TEXT,
  unit_kerja TEXT,
  jumlah_responden INTEGER,
  tanggal_input TEXT,
  dimensi_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE ahrq_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses Publik Seluruhnya" ON ahrq_surveys FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabel Pengaturan Aplikasi (Wallpaper, dll)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses Publik Seluruhnya" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabel Akun Fasyankes
CREATE TABLE IF NOT EXISTS hospital_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  kode_rs TEXT,
  nama_rs TEXT,
  alamat_rs TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE hospital_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses Publik Seluruhnya" ON hospital_accounts FOR ALL USING (true) WITH CHECK (true);

-- 4. Set Up Storage Bucket untuk Unggah Wallpaper
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Membaca Publik" ON storage.objects;
CREATE POLICY "Membaca Publik" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Mengunggah Publik" ON storage.objects;
CREATE POLICY "Mengunggah Publik" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Memperbarui Publik" ON storage.objects;
CREATE POLICY "Memperbarui Publik" ON storage.objects FOR UPDATE USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Menghapus Publik" ON storage.objects;
CREATE POLICY "Menghapus Publik" ON storage.objects FOR DELETE USING (bucket_id = 'wallpapers');

-- 5. Set Up Storage Bucket untuk Unggah Logo AHRQ
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Membaca Publik Logo" ON storage.objects;
CREATE POLICY "Membaca Publik Logo" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Mengunggah Publik Logo" ON storage.objects;
CREATE POLICY "Mengunggah Publik Logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "Memperbarui Publik Logo" ON storage.objects;
CREATE POLICY "Memperbarui Publik Logo" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Menghapus Publik Logo" ON storage.objects;
CREATE POLICY "Menghapus Publik Logo" ON storage.objects FOR DELETE USING (bucket_id = 'logos');`}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-850 flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                  {copiedSql ? 'Disalin!' : 'Salin SQL'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
