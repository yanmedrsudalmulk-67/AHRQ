'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import InputDataTab from '../../../components/InputDataTab';
import { getSupabaseClient } from '../../../lib/supabase';
import { getMysqlSurveyLinkConfig, saveMysqlSurvey, saveMysqlSurveySubmission } from '../../../lib/mysqlClient';
import { SurveyData, convertIndoDateToISO } from '../../../lib/db';
import { getLogo, LogoData } from '../../../lib/logo';

export default function PublicSurveyPage() {
  const params = useParams();
  const token = params?.token as string;
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<LogoData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Coba ambil konfigurasi dari MySQL Hostinger terlebih dahulu
        let data: any = null;
        try {
          data = await getMysqlSurveyLinkConfig(token);
        } catch (e) {
          console.warn("Gagal mengambil konfigurasi dari MySQL API:", e);
        }

        // 2. Fallback ke Supabase jika ada
        if (!data) {
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: sbData } = await supabase
              .from('ahrq_surveys')
              .select('*')
              .eq('id', `LINK_CONFIG_${token}`)
              .single();
            if (sbData) {
              data = sbData;
            }
          }
        }

        if (!data) {
          setError('Mohon maaf, tautan survei yang Anda buka sudah tidak aktif, telah kedaluwarsa, atau tidak ditemukan. Silakan hubungi administrator Rumah Sakit untuk memperoleh tautan survei yang terbaru.');
          setLoading(false);
          return;
        }

        const jumlahResponden = data.jumlah_responden !== undefined ? data.jumlah_responden : data.jumlahResponden;
        if (jumlahResponden !== 1 && data.isActive === false) {
          setError('Mohon maaf, tautan survei yang Anda buka sudah dinonaktifkan oleh administrator.');
          setLoading(false);
          return;
        }

        let parsedScores = data.dimensi_scores || data.dimensiScores || data;
        if (typeof parsedScores === 'string') {
          try {
            parsedScores = JSON.parse(parsedScores);
          } catch (e) {
            console.error("Gagal parse dimensi_scores", e);
            parsedScores = {};
          }
        }

        // Validate expiration date
        if (parsedScores.expiryDate) {
          const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          if (todayStr > parsedScores.expiryDate) {
            setError('Mohon maaf, tautan survei yang Anda buka sudah tidak aktif, telah kedaluwarsa, atau tidak ditemukan. Silakan hubungi administrator Rumah Sakit untuk memperoleh tautan survei yang terbaru.');
            setLoading(false);
            return;
          }
        }

        // Validate max respondents
        if (parsedScores.maxRespondents) {
          const max = parseInt(parsedScores.maxRespondents, 10);
          if (!isNaN(max)) {
            const current = parsedScores.respondentCount || 0;
            if (current >= max) {
              setError('Mohon maaf, tautan survei yang Anda buka sudah tidak aktif, telah mencapai batas maksimal jumlah responden, atau tidak ditemukan. Silakan hubungi administrator Rumah Sakit untuk memperoleh tautan survei yang terbaru.');
              setLoading(false);
              return;
            }
          }
        }

        // Validate prevent duplicate
        if (parsedScores.preventDuplicate !== false) {
          if (localStorage.getItem(`survey_submitted_${token}`)) {
            setError('Anda sudah mengisi survei ini dari perangkat ini. Terima kasih atas partisipasi Anda.');
            setLoading(false);
            return;
          }
        }

        setConfig({
          rsName: parsedScores.rsName || parsedScores.hospital_name || data.nama_rs || 'Rumah Sakit',
          identifier: data.unit_kerja || parsedScores.hospital_id || parsedScores.user_id,
          hospitalId: data.hospital_id || parsedScores.hospital_id || data.unit_kerja,
          userId: data.user_id || parsedScores.user_id || data.unit_kerja,
          createdBy: data.created_by || parsedScores.created_by || data.unit_kerja,
          hospitalName: data.hospital_name || parsedScores.hospital_name || parsedScores.rsName || 'Rumah Sakit'
        });

        // Load logo
        const savedLogo = await getLogo();
        if (savedLogo) {
          setLogo(savedLogo);
        }

      } catch (err) {
        setError('Terjadi kesalahan saat memuat survei.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleSaveSurvey = async (survey: SurveyData) => {
    // 1. Simpan ke database MySQL Hostinger
    try {
      await saveMysqlSurvey(survey, {
        token,
        hospitalId: config.hospitalId,
        userId: config.userId,
        createdBy: config.createdBy,
        hospitalName: config.hospitalName,
        identifier: config.identifier
      });
    } catch (mysqlErr) {
      console.warn("Gagal simpan ke MySQL API, mencoba fallback:", mysqlErr);
      const supabase = getSupabaseClient();
      if (supabase) {
        const dbRow: any = {
          id: survey.id,
          nama_rs: config.rsName,
          unit_kerja: survey.unitKerja,
          jumlah_responden: survey.jumlahResponden,
          tanggal_input: convertIndoDateToISO(survey.tanggalInput),
          dimensi_scores: {
            ...survey.dimensiScores,
            username: config.identifier,
            hospital_id: config.hospitalId,
            user_id: config.userId,
            created_by: config.createdBy,
            hospital_name: config.hospitalName
          },
          hospital_id: config.hospitalId,
          user_id: config.userId,
          created_by: config.createdBy,
          hospital_name: config.hospitalName
        };
        await supabase.from('ahrq_surveys').insert([dbRow]);
      } else {
        throw mysqlErr;
      }
    }
    
    // Set flag local agar tidak duplikat
    localStorage.setItem(`survey_submitted_${token}`, 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white border border-slate-200 p-10 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Survei Tidak Tersedia</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-black tracking-tight">{config.rsName}</h2>
              <p className="text-sm font-medium text-slate-600">Portal Survei Budaya Keselamatan Pasien</p>
            </div>
          </div>
        </div>
        
        {/* We use InputDataTab directly. It handles its own wrapper, sticky header, etc. */}
        <InputDataTab 
          currentRsName={config.rsName} 
          identifier={config.identifier}
          isPublic={true}
          onSaveSurvey={handleSaveSurvey} 
        />
      </div>
    </div>
  );
}
