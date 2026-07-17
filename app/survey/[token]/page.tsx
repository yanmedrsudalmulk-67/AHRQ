'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import InputDataTab from '../../../components/InputDataTab';
import { getSupabaseClient } from '../../../lib/supabase';
import { SurveyData } from '../../../lib/db';
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
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Koneksi database tidak tersedia.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from('ahrq_surveys')
          .select('*')
          .eq('id', `LINK_CONFIG_${token}`)
          .single();

        if (fetchErr || !data) {
          setError('Mohon maaf, tautan survei yang Anda buka sudah tidak aktif, telah kedaluwarsa, atau tidak ditemukan. Silakan hubungi administrator Rumah Sakit untuk memperoleh tautan survei yang terbaru.');
          setLoading(false);
          return;
        }

        if (data.jumlah_responden !== 1) {
          setError('Mohon maaf, tautan survei yang Anda buka sudah tidak aktif, telah kedaluwarsa, atau tidak ditemukan. Silakan hubungi administrator Rumah Sakit untuk memperoleh tautan survei yang terbaru.');
          setLoading(false);
          return;
        }

        let parsedScores = data.dimensi_scores;
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
          rsName: parsedScores.rsName || 'Rumah Sakit',
          identifier: data.unit_kerja,
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
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase tidak terhubung");

    // We add it to the DB with the target hospital's name
    const dbRow = {
      id: survey.id,
      nama_rs: config.rsName,
      unit_kerja: survey.unitKerja,
      jumlah_responden: survey.jumlahResponden,
      tanggal_input: survey.tanggalInput ? survey.tanggalInput.split('T')[0] : new Date().toISOString().split('T')[0],
      dimensi_scores: survey.dimensiScores
    };

    const { error } = await supabase.from('ahrq_surveys').insert([dbRow]);
    if (error) {
      throw new Error(error.message);
    }
    
    // Increment respondent count on the link config silently
    try {
      const { data } = await supabase
        .from('ahrq_surveys')
        .select('dimensi_scores')
        .eq('id', `LINK_CONFIG_${token}`)
        .single();
        
      if (data) {
        let parsedScores = data.dimensi_scores;
        if (typeof parsedScores === 'string') {
          try {
            parsedScores = JSON.parse(parsedScores);
          } catch (e) {
            parsedScores = {};
          }
        }
        const currentCount = parsedScores?.respondentCount || 0;
        await supabase
          .from('ahrq_surveys')
          .update({
            dimensi_scores: { ...parsedScores, respondentCount: currentCount + 1 }
          })
          .eq('id', `LINK_CONFIG_${token}`);
      }
    } catch (e) {
      console.error("Gagal mengupdate jumlah responden link", e);
    }
    
    // Set flag
    localStorage.setItem(`survey_submitted_${token}`, 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020918] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-[#020918] flex items-center justify-center p-6 text-center">
        <div className="bg-[#0c1a36] border border-[#00244d] p-10 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Survei Tidak Tersedia</h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020918] p-0 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logo && (
              <img src={logo.url} alt="Logo RS" className="h-12 w-auto object-contain" />
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-100">{config.rsName}</h2>
              <p className="text-sm text-slate-400">Portal Survei Budaya Keselamatan Pasien</p>
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
