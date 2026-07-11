import { getSupabaseClient } from './supabase';

export interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: number };
}

export interface HospitalAccount {
  id: string;
  username: string;
  kodeRs: string;
  namaRs: string;
  alamatRs: string;
  password?: string;
  created_at?: string;
}

export interface SurveySubmission {
  id: string;
  created_at: string;
  rs_id: string;
  nama_rs: string;
  posisi_staf: string;
  unit_kerja: string;
  bagian_a: Record<string, string>;
  bagian_b: Record<string, string>;
  bagian_c: Record<string, string>;
  bagian_d: Record<string, string>;
  bagian_e: string; // Peringkat keselamatan (1-5)
  bagian_f: Record<string, string>;
  bagian_g: Record<string, string>;
  bagian_h: string; // Komentar
  skor_a: number; // Percent positive
  skor_b: number;
  skor_c: number;
  skor_d: number;
  skor_f: number;
  skor_keseluruhan: number;
}

// Helpers for data mapping
export const mapToSurveyData = (item: any): SurveyData => ({
  id: item.id,
  namaRs: item.nama_rs || item.namaRs || '',
  unitKerja: item.unit_kerja || item.unitKerja || '',
  jumlahResponden: item.jumlah_responden !== undefined ? item.jumlah_responden : (item.jumlahResponden !== undefined ? item.jumlahResponden : 0),
  tanggalInput: item.tanggal_input || item.tanggalInput || '',
  dimensiScores: typeof item.dimensi_scores === 'string' 
    ? JSON.parse(item.dimensi_scores) 
    : (item.dimensi_scores || item.dimensiScores || {})
});

export const mapToHospitalAccount = (item: any): HospitalAccount => ({
  id: item.id,
  username: item.username || '',
  kodeRs: item.kode_rs || item.kodeRs || '',
  namaRs: item.nama_rs || item.namaRs || '',
  alamatRs: item.alamat_rs || item.alamatRs || '',
  password: item.password || '',
  created_at: item.created_at
});

// Check if an item is negative
export function isNegativeItem(groupId: string, itemId: string): boolean {
  if (groupId === 'bagian_a' && ['a3', 'a5', 'a6', 'a7', 'a9', 'a11', 'a13', 'a14'].includes(itemId)) return true;
  if (groupId === 'bagian_b' && itemId === 'b2') return true;
  if (groupId === 'bagian_c' && itemId === 'c7') return true;
  if (groupId === 'bagian_f' && ['f3', 'f4', 'f5'].includes(itemId)) return true;
  return false;
}

// Calculate percent positive score for a single group of answers
export function calculateGroupPositiveScore(groupId: string, answers: Record<string, string>): number {
  let positiveCount = 0;
  let validCount = 0;

  Object.entries(answers).forEach(([key, val]) => {
    if (!key.startsWith(groupId.split('_')[1])) return; 
    if (val === '9') return; 

    validCount++;
    const isNeg = isNegativeItem(groupId, key);
    if (isNeg) {
      if (val === '1' || val === '2') {
        positiveCount++;
      }
    } else {
      if (val === '4' || val === '5') {
        positiveCount++;
      }
    }
  });

  return validCount > 0 ? Math.round((positiveCount / validCount) * 100) : 0;
}

// Calculate the overall percent positive score
export function calculateOverallScore(submission: Partial<SurveySubmission>): number {
  const scores = [
    calculateGroupPositiveScore('bagian_a', submission.bagian_a || {}),
    calculateGroupPositiveScore('bagian_b', submission.bagian_b || {}),
    calculateGroupPositiveScore('bagian_c', submission.bagian_c || {}),
    calculateGroupPositiveScore('bagian_d', submission.bagian_d || {}),
    calculateGroupPositiveScore('bagian_f', submission.bagian_f || {})
  ];

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// 1. Fetch all surveys (strictly from Supabase, no localStorage)
export async function getSurveys(): Promise<SurveyData[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ahrq_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapToSurveyData);
      }
      if (error && error.code !== 'PGRST125' && error.code !== 'PGRST116') {
        console.warn("Supabase ahrq_surveys query failed:", error);
      }
    } catch (e) {
      console.error("Supabase ahrq_surveys exception:", e);
    }
  }

  return [];
}

// 2. Save a survey to Supabase directly (no localStorage)
export async function saveSurvey(survey: SurveyData): Promise<SurveyData> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRow = {
        id: survey.id,
        nama_rs: survey.namaRs,
        unit_kerja: survey.unitKerja,
        jumlah_responden: survey.jumlahResponden,
        tanggal_input: survey.tanggalInput,
        dimensi_scores: survey.dimensiScores
      };

      const { data, error } = await supabase
        .from('ahrq_surveys')
        .insert([dbRow])
        .select();

      if (!error && data && data.length > 0) {
        return mapToSurveyData(data[0]);
      }
      if (error) {
        throw new Error(`Gagal menyimpan survei ke database Supabase: ${error.message}`);
      }
    } catch (e: any) {
      console.error("Supabase insert ahrq_surveys exception:", e);
      throw new Error(e.message || "Gagal menyimpan survei ke database Supabase.");
    }
  }

  throw new Error("Koneksi Supabase belum terkonfigurasi.");
}

// 3. Fetch hospital accounts (strictly from Supabase, no localStorage)
export async function getHospitalAccounts(): Promise<HospitalAccount[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hospital_accounts')
        .select('*');

      if (!error && data) {
        return data.map(mapToHospitalAccount);
      }
      if (error && error.code !== 'PGRST125' && error.code !== '42P01') {
        console.warn("Supabase hospital_accounts query failed:", error);
      }
    } catch (e) {
      console.error("Supabase hospital_accounts exception:", e);
    }
  }

  return [];
}

// 4. Create hospital account in Supabase (no localStorage)
export async function createHospitalAccount(account: Omit<HospitalAccount, 'id'>): Promise<HospitalAccount> {
  const newAccount: HospitalAccount = {
    ...account,
    id: `rs-${Date.now()}`,
    created_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRow = {
        id: newAccount.id,
        username: newAccount.username,
        kode_rs: newAccount.kodeRs,
        nama_rs: newAccount.namaRs,
        alamat_rs: newAccount.alamatRs,
        password: newAccount.password || newAccount.kodeRs,
        created_at: newAccount.created_at
      };

      const { data, error } = await supabase
        .from('hospital_accounts')
        .insert([dbRow])
        .select();

      if (!error && data && data.length > 0) {
        return mapToHospitalAccount(data[0]);
      }
      if (error) {
        throw new Error(`Gagal membuat akun rumah sakit di database Supabase: ${error.message}`);
      }
    } catch (e: any) {
      console.error("Supabase insert hospital_accounts exception:", e);
      throw new Error(e.message || "Gagal membuat akun rumah sakit di database Supabase.");
    }
  }

  throw new Error("Koneksi Supabase belum terkonfigurasi.");
}

// Keep existing SurveySubmission helpers for backward compatibility with deleted/unused components
export async function getSubmissions(): Promise<SurveySubmission[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('survey_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as SurveySubmission[];
      }
      if (error) {
        console.error("Gagal mengambil submissions dari Supabase:", error);
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export async function saveSubmission(submission: Omit<SurveySubmission, 'id' | 'created_at' | 'skor_a' | 'skor_b' | 'skor_c' | 'skor_d' | 'skor_f' | 'skor_keseluruhan'>): Promise<SurveySubmission> {
  const score_a = calculateGroupPositiveScore('bagian_a', submission.bagian_a);
  const score_b = calculateGroupPositiveScore('bagian_b', submission.bagian_b);
  const score_c = calculateGroupPositiveScore('bagian_c', submission.bagian_c);
  const score_d = calculateGroupPositiveScore('bagian_d', submission.bagian_d);
  const score_f = calculateGroupPositiveScore('bagian_f', submission.bagian_f);
  
  const tempSub: Partial<SurveySubmission> = {
    bagian_a: submission.bagian_a,
    bagian_b: submission.bagian_b,
    bagian_c: submission.bagian_c,
    bagian_d: submission.bagian_d,
    bagian_f: submission.bagian_f
  };
  const score_keseluruhan = calculateOverallScore(tempSub);

  const newSubmission: SurveySubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    created_at: new Date().toISOString(),
    skor_a: score_a,
    skor_b: score_b,
    skor_c: score_c,
    skor_d: score_d,
    skor_f: score_f,
    skor_keseluruhan: score_keseluruhan
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('survey_submissions')
        .insert([newSubmission])
        .select();
      if (!error && data && data.length > 0) {
        return data[0] as SurveySubmission;
      }
      if (error) {
        throw new Error(`Gagal menyimpan pengisian survei ke Supabase: ${error.message}`);
      }
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || "Gagal menyimpan pengisian survei.");
    }
  }
  throw new Error("Koneksi database Supabase tidak aktif.");
}

export async function syncAllLocalDataToSupabase(): Promise<{
  success: boolean;
  surveysSynced: number;
  accountsSynced: number;
  wallpaperSynced: boolean;
  message: string;
}> {
  return {
    success: true,
    surveysSynced: 0,
    accountsSynced: 0,
    wallpaperSynced: true,
    message: "Aplikasi sekarang menggunakan penyimpanan Cloud Supabase secara langsung dan tidak lagi menyimpan data di Local Storage."
  };
}

