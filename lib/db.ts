import { getSupabaseClient } from './supabase';
import bcrypt from 'bcryptjs';

export interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: any };
}

export interface HospitalAccount {
  id: string;
  username: string;
  kodeRs?: string;
  namaRs: string;
  alamatRs: string;
  password?: string;
  created_at?: string;
  provinsi?: string;
  kotaKab?: string;
  penanggungJawab?: string;
  jabatan?: string;
  noWhatsapp?: string;
  emailRs?: string;
  status: 'Pending' | 'Active' | 'Rejected';
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  updated_at?: string;
  kodePos?: string;
  noTelepon?: string;
}

export interface EmailNotification {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  type: 'admin_notification' | 'approval' | 'rejection';
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

export const mapToHospitalAccount = (item: any): HospitalAccount => {
  let alamat = item.alamat_rs || item.alamatRs || '';
  let kodePos = item.kode_pos || '';
  let noTelepon = item.no_telepon || '';

  if (alamat && alamat.includes('||KP:')) {
    const parts = alamat.split('||KP:');
    alamat = parts[0].trim();
    if (parts[1]) {
      const kpAndTel = parts[1].split('||TEL:');
      kodePos = kpAndTel[0].trim();
      if (kpAndTel[1]) {
        noTelepon = kpAndTel[1].trim();
      }
    }
  }

  return {
    id: item.id,
    username: item.username || '',
    kodeRs: item.kode_rs || item.kodeRs || '',
    namaRs: item.nama_rs || item.namaRs || '',
    alamatRs: alamat,
    password: item.password || '',
    created_at: item.created_at,
    provinsi: item.provinsi || '',
    kotaKab: item.kota_kab || '',
    penanggungJawab: item.penanggung_jawab || '',
    jabatan: item.jabatan || '',
    noWhatsapp: item.no_whatsapp || '',
    emailRs: item.email_rs || '',
    status: (item.status as any) || 'Active', // Fallback for legacy accounts
    approvalDate: item.approval_date,
    approvedBy: item.approved_by,
    rejectionReason: item.rejection_reason,
    updated_at: item.updated_at,
    kodePos: kodePos || item.kode_pos || '',
    noTelepon: noTelepon || item.no_telepon || ''
  };
};

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
export async function getSurveys(hospitalId?: string): Promise<SurveyData[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (hospitalId && hospitalId !== 'admin') {
        // Resolve both UUID and username
        let uuid = hospitalId;
        let username = hospitalId;

        try {
          const { data: accounts, error: accErr } = await supabase
            .from('hospital_accounts')
            .select('id, username')
            .or(`id.eq.${hospitalId},username.eq.${hospitalId}`)
            .limit(1);

          if (accErr && (accErr.message?.includes('Failed to fetch') || accErr.details?.includes('Failed to fetch'))) {
            console.warn("Koneksi Supabase tidak dapat dijangkau (Failed to fetch). Mengembalikan data kosong.");
            return [];
          }

          if (accounts && accounts.length > 0) {
            uuid = accounts[0].id;
            username = accounts[0].username;
          }
        } catch (err: any) {
          if (err?.message?.includes('Failed to fetch') || err?.details?.includes('Failed to fetch')) {
            console.warn("Koneksi Supabase tidak dapat dijangkau (Failed to fetch).");
            return [];
          }
          console.warn("Gagal lookup hospital_accounts in getSurveys:", err);
        }

        try {
          const { data, error } = await supabase
            .from('ahrq_surveys')
            .select('*')
            .or(`hospital_id.eq.${uuid},hospital_id.eq.${username},user_id.eq.${uuid},user_id.eq.${username},created_by.eq.${uuid},created_by.eq.${username},dimensi_scores->>username.eq.${uuid},dimensi_scores->>username.eq.${username},dimensi_scores->>hospital_id.eq.${uuid},dimensi_scores->>hospital_id.eq.${username},dimensi_scores->>user_id.eq.${uuid},dimensi_scores->>user_id.eq.${username}`)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map(mapToSurveyData);
          }
          if (error) {
            if (error.message?.includes('Failed to fetch') || error.details?.includes('Failed to fetch')) {
              console.warn("Supabase ahrq_surveys query failed (Failed to fetch): Jaringan atau URL Supabase tidak dapat dijangkau.");
              return [];
            }
            const isColError = error.code === '42703' || 
                               error.code === 'PGRST204' ||
                               error.message?.includes('column') || 
                               error.message?.includes('does not exist') ||
                               error.message?.includes('schema cache');
            if (isColError) {
              throw error;
            }
            if (error.code !== 'PGRST125' && error.code !== 'PGRST116') {
              console.warn("Supabase ahrq_surveys query failed:", error.message || error);
            }
          }
        } catch (innerErr: any) {
          if (innerErr?.message?.includes('Failed to fetch') || innerErr?.details?.includes('Failed to fetch')) {
            console.warn("Supabase ahrq_surveys query failed (Failed to fetch).");
            return [];
          }
          // Fallback query using only JSONB dimensi_scores keys (always safe, won't cause 42703 / PGRST204)
          try {
            const { data, error } = await supabase
              .from('ahrq_surveys')
              .select('*')
              .or(`dimensi_scores->>username.eq.${uuid},dimensi_scores->>username.eq.${username},dimensi_scores->>hospital_id.eq.${uuid},dimensi_scores->>hospital_id.eq.${username},dimensi_scores->>user_id.eq.${uuid},dimensi_scores->>user_id.eq.${username},unit_kerja.eq.${uuid},unit_kerja.eq.${username}`)
              .order('created_at', { ascending: false });

            if (!error && data) {
              return data.map(mapToSurveyData);
            }
            if (error && !error.message?.includes('Failed to fetch') && !error.details?.includes('Failed to fetch')) {
              console.error("Fallback query failed:", error.message || error);
            }
          } catch (fbErr: any) {
            if (!fbErr?.message?.includes('Failed to fetch')) {
              console.warn("Fallback query error:", fbErr?.message || fbErr);
            }
          }
        }
      } else {
        const { data, error } = await supabase
          .from('ahrq_surveys')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(mapToSurveyData);
        }
        if (error) {
          if (error.message?.includes('Failed to fetch') || error.details?.includes('Failed to fetch')) {
            console.warn("Supabase ahrq_surveys query failed (Failed to fetch): Jaringan atau URL Supabase tidak dapat dijangkau.");
            return [];
          }
          if (error.code !== 'PGRST125' && error.code !== 'PGRST116') {
            console.warn("Supabase ahrq_surveys query failed:", error.message || error);
          }
        }
      }
    } catch (e: any) {
      if (!e?.message?.includes('Failed to fetch') && !e?.details?.includes('Failed to fetch')) {
        console.error("Supabase ahrq_surveys exception:", e);
      }
    }
  }

  return [];
}

export function convertIndoDateToISO(indoDate: string): string {
  if (!indoDate) return new Date().toISOString().split('T')[0];
  if (indoDate.includes('-')) return indoDate; // already YYYY-MM-DD
  
  const monthsIndo: Record<string, string> = {
    'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
    'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
  };
  
  const parts = indoDate.trim().toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const year = parts[2];
    const month = monthsIndo[monthName] || '01';
    return `${year}-${month}-${day}`;
  }
  return indoDate;
}

// 2. Save a survey to Supabase directly (no localStorage)
export async function saveSurvey(
  survey: SurveyData,
  hospitalId?: string,
  userId?: string,
  createdBy?: string,
  hospitalName?: string
): Promise<SurveyData> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRow: any = {
        id: survey.id,
        nama_rs: survey.namaRs,
        unit_kerja: survey.unitKerja,
        jumlah_responden: survey.jumlahResponden,
        tanggal_input: convertIndoDateToISO(survey.tanggalInput),
        dimensi_scores: {
          ...survey.dimensiScores,
          hospital_id: hospitalId || survey.dimensiScores?.hospital_id,
          user_id: userId || survey.dimensiScores?.user_id || survey.dimensiScores?.username,
          created_by: createdBy || survey.dimensiScores?.created_by || survey.dimensiScores?.username,
          hospital_name: hospitalName || survey.dimensiScores?.hospital_name || survey.namaRs
        },
        hospital_id: hospitalId || survey.dimensiScores?.hospital_id,
        user_id: userId || survey.dimensiScores?.user_id || survey.dimensiScores?.username,
        created_by: createdBy || survey.dimensiScores?.created_by || survey.dimensiScores?.username,
        hospital_name: hospitalName || survey.dimensiScores?.hospital_name || survey.namaRs
      };

      let attempts = 0;
      const maxAttempts = 3;
      const insertRow = { ...dbRow };

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const { data, error } = await supabase
            .from('ahrq_surveys')
            .insert([insertRow])
            .select();

          if (!error && data && data.length > 0) {
            return mapToSurveyData(data[0]);
          }
          if (error) {
            throw error;
          }
        } catch (error: any) {
          const isColError = error.code === '42703' || 
                             error.code === 'PGRST204' ||
                             error.message?.includes('column') || 
                             error.message?.includes('does not exist') ||
                             error.message?.includes('schema cache');
          
          if (isColError && attempts < maxAttempts) {
            // Attempt to remove any top-level keys that might cause schema issues if added dynamically later
            delete insertRow.hospital_id;
            delete insertRow.user_id;
            delete insertRow.created_by;
            delete insertRow.hospital_name;
            continue;
          }
          console.warn(`saveSurvey attempt ${attempts} failed:`, error);
          throw new Error(`Gagal menyimpan survei ke database Supabase: ${error.message}`);
        }
      }
    } catch (e: any) {
      console.error("Supabase insert ahrq_surveys exception:", e);
      throw new Error(e.message || "Gagal menyimpan survei ke database Supabase.");
    }
  }

  throw new Error("Koneksi Supabase belum terkonfigurasi.");
}

export async function deleteSurvey(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // 1. Delete from ahrq_surveys
      const { error } = await supabase
        .from('ahrq_surveys')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Gagal menghapus survei dari database Supabase: ${error.message}`);
      }

      // 2. Safely attempt to clean up any related survey_submissions (prevent orphan data)
      try {
        await supabase
          .from('survey_submissions')
          .delete()
          .eq('id', id);
        
        const cleanId = id.replace('srv_', '');
        await supabase
          .from('survey_submissions')
          .delete()
          .eq('id', cleanId);
          
        await supabase
          .from('survey_submissions')
          .delete()
          .eq('id', `sub-${cleanId}`);
      } catch (subErr) {
        console.warn("Latar belakang cleanup survey_submissions diabaikan atau berhasil:", subErr);
      }
    } catch (e: any) {
      console.error("Supabase delete ahrq_surveys exception:", e);
      throw new Error(e.message || "Gagal menghapus survei dari database Supabase.");
    }
  } else {
    throw new Error("Koneksi Supabase belum terkonfigurasi.");
  }
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
export async function sendSystemEmail(to: string, subject: string, body: string, type: 'admin_notification' | 'approval' | 'rejection'): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const emailRow = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        to_email: to,
        subject,
        body,
        type,
        created_at: new Date().toISOString()
      };
      await supabase.from('email_notifications').insert([emailRow]);
      
      // Also, attempt to call standard API route
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body })
        });
      } catch (e) {
        console.warn("Real-email API request skipped or not configured:", e);
      }
    } catch (e) {
      console.error("Gagal mencatat email notifikasi di database:", e);
    }
  }
}

export async function getEmailNotifications(): Promise<EmailNotification[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as EmailNotification[];
      }
    } catch (e) {
      console.error("Gagal mengambil email logs:", e);
    }
  }
  return [];
}

export async function updateHospitalAccountStatus(
  id: string, 
  status: 'Active' | 'Rejected', 
  approvedBy: string, 
  rejectionReason?: string
): Promise<HospitalAccount> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Koneksi Supabase belum terkonfigurasi.");

  try {
    // 1. Fetch account first to get details for the notification email
    const { data: accounts, error: fetchErr } = await supabase
      .from('hospital_accounts')
      .select('*')
      .eq('id', id);

    if (fetchErr || !accounts || accounts.length === 0) {
      throw new Error("Akun Rumah Sakit tidak ditemukan.");
    }

    const originalAccount = mapToHospitalAccount(accounts[0]);

    const updateData: any = {
      status,
      approved_by: approvedBy,
      approval_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (status === 'Rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('hospital_accounts')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Gagal memperbarui status akun di Supabase: ${error.message}`);
    }

    const updatedAccount = data && data.length > 0 
      ? mapToHospitalAccount(data[0])
      : { ...originalAccount, ...updateData };

    // 2. Send Email Notification automatically to the hospital
    if (status === 'Active') {
      const hospitalEmailSubject = `✅ Selamat! Akun Budaya Keselamatan Pasien Anda Telah Disetujui`;
      const hospitalEmailBody = `
Yth. Pimpinan / Penanggung Jawab ${originalAccount.namaRs},

Selamat, akun sistem budaya keselamatan pasien (AHRQ SOPS 2.0) Anda telah disetujui oleh Administrator Pusat.

Detail Akun Anda:
- Nama Rumah Sakit: ${originalAccount.namaRs}
- Username: ${originalAccount.username}

Silakan masuk ke Portal Rumah Sakit menggunakan tautan aplikasi dan login dengan username dan password yang telah Anda daftarkan sebelumnya.

Terima kasih atas partisipasi aktif Anda dalam mengukur dan meningkatkan budaya keselamatan pasien.

Salam Hangat,
Sistem Manajemen AHRQ SOPS 2.0
      `;
      await sendSystemEmail(originalAccount.emailRs || 'rs-user@example.com', hospitalEmailSubject, hospitalEmailBody.trim(), 'approval');
    } else {
      const hospitalEmailSubject = `❌ Permohonan Akun Budaya Keselamatan Pasien Belum Disetujui`;
      const hospitalEmailBody = `
Yth. Pimpinan / Penanggung Jawab ${originalAccount.namaRs},

Mohon maaf, permohonan pendaftaran akun sistem budaya keselamatan pasien (AHRQ SOPS 2.0) Anda belum dapat disetujui oleh Administrator Pusat.

Alasan Penolakan:
"${rejectionReason || 'Data kurang lengkap atau tidak valid.'}"

Silakan lakukan pendaftaran ulang dengan menyertakan data yang benar dan lengkap, atau hubungi Administrator Utama melalui email yanmedrsudalmulk@gmail.com.

Terima kasih atas pengertian Anda.

Salam Hangat,
Sistem Manajemen AHRQ SOPS 2.0
      `;
      await sendSystemEmail(originalAccount.emailRs || 'rs-user@example.com', hospitalEmailSubject, hospitalEmailBody.trim(), 'rejection');
    }

    return updatedAccount;
  } catch (e: any) {
    console.error("Supabase update status exception:", e);
    throw new Error(e.message || "Gagal memperbarui status akun.");
  }
}

export async function getHospitalAccountByUsername(username: string): Promise<HospitalAccount | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hospital_accounts')
        .select('*')
        .ilike('username', username)
        .single();
      
      if (!error && data) {
        return mapToHospitalAccount(data);
      }
    } catch (e) {
      console.error("Supabase getHospitalAccountByUsername exception:", e);
    }
  }
  return null;
}

export async function updateHospitalProfile(id: string, updates: Partial<HospitalAccount>): Promise<HospitalAccount> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Koneksi Supabase belum terkonfigurasi.");
  }
  
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (updates.namaRs !== undefined) updateData.nama_rs = updates.namaRs;
  
  // Serialize kode_pos and no_telepon into alamat_rs as metadata fallback
  if (updates.alamatRs !== undefined || updates.kodePos !== undefined || updates.noTelepon !== undefined) {
    const baseAddr = updates.alamatRs !== undefined ? updates.alamatRs : '';
    const kp = updates.kodePos !== undefined ? updates.kodePos : '';
    const tel = updates.noTelepon !== undefined ? updates.noTelepon : '';
    updateData.alamat_rs = `${baseAddr} ||KP:${kp}||TEL:${tel}`;
  }
  
  if (updates.emailRs !== undefined) updateData.email_rs = updates.emailRs;
  if (updates.noWhatsapp !== undefined) updateData.no_whatsapp = updates.noWhatsapp;
  if (updates.provinsi !== undefined) updateData.provinsi = updates.provinsi;
  if (updates.kotaKab !== undefined) updateData.kota_kab = updates.kotaKab;
  if (updates.username !== undefined) updateData.username = updates.username.toLowerCase().trim();
  if (updates.password) {
    updateData.password = await bcrypt.hash(updates.password, 10);
  }
  
  // Attempt to add optional columns which might not be in the database yet
  if (updates.kodePos !== undefined) updateData.kode_pos = updates.kodePos;
  if (updates.noTelepon !== undefined) updateData.no_telepon = updates.noTelepon;

  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const { data, error } = await supabase
        .from('hospital_accounts')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (!error) {
        if (data && data.length > 0) {
          return mapToHospitalAccount(data[0]);
        }
        throw new Error("Data tidak ditemukan setelah diperbarui.");
      }
      
      console.warn(`Update attempt ${attempts} failed with error:`, error);
      
      const isColumnError = error.code === '42703' || 
                            error.message?.includes('column') || 
                            error.message?.includes('does not exist') ||
                            error.message?.includes('not found in the schema cache');
                            
      if (isColumnError) {
        // Find the column name from the error message
        const match = error.message.match(/column "([^"]+)"/) || error.message.match(/column ([a-zA-Z0-9_]+) does/);
        let colName = match ? match[1] : null;
        
        if (!colName) {
          if (error.message?.includes('kode_pos')) colName = 'kode_pos';
          else if (error.message?.includes('no_telepon')) colName = 'no_telepon';
          else if (error.message?.includes('updated_at')) colName = 'updated_at';
          else if (error.message?.includes('provinsi')) colName = 'provinsi';
          else if (error.message?.includes('kota_kab')) colName = 'kota_kab';
          else if (error.message?.includes('email_rs')) colName = 'email_rs';
          else if (error.message?.includes('no_whatsapp')) colName = 'no_whatsapp';
        }
        
        if (colName && updateData[colName] !== undefined) {
          console.warn(`Removing missing column "${colName}" from update payload and retrying...`);
          delete updateData[colName];
          continue;
        }
        
        // Fallback removals
        if (updateData.kode_pos !== undefined) {
          delete updateData.kode_pos;
          continue;
        }
        if (updateData.no_telepon !== undefined) {
          delete updateData.no_telepon;
          continue;
        }
        if (updateData.updated_at !== undefined) {
          delete updateData.updated_at;
          continue;
        }
      }
      
      throw new Error(error.message);
    } catch (e: any) {
      if (attempts >= maxAttempts) {
        throw new Error(e.message || "Gagal memperbarui profil setelah beberapa percobaan.");
      }
      throw e;
    }
  }
  
  throw new Error("Gagal memperbarui profil: Melebihi batas percobaan penyesuaian skema.");
}

export async function createHospitalAccount(account: Omit<HospitalAccount, 'id'>): Promise<HospitalAccount> {
  const newAccount: HospitalAccount = {
    ...account,
    id: `rs-${Date.now()}`,
    created_at: new Date().toISOString(),
    status: account.status || 'Pending'
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Securely hash password using bcryptjs before inserting
      let hashedPassword = newAccount.password || '';
      if (hashedPassword) {
        hashedPassword = await bcrypt.hash(hashedPassword, 10);
      }

      const dbRow = {
        id: newAccount.id,
        username: newAccount.username.toLowerCase().trim(),
        kode_rs: newAccount.kodeRs || null,
        nama_rs: newAccount.namaRs,
        alamat_rs: newAccount.alamatRs,
        password: hashedPassword,
        provinsi: newAccount.provinsi || null,
        kota_kab: newAccount.kotaKab || null,
        penanggung_jawab: newAccount.penanggungJawab || null,
        jabatan: newAccount.jabatan || null,
        no_whatsapp: newAccount.noWhatsapp || null,
        email_rs: newAccount.emailRs || null,
        status: newAccount.status || 'Pending',
        approval_date: null,
        approved_by: null,
        rejection_reason: null,
        created_at: newAccount.created_at,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('hospital_accounts')
        .insert([dbRow])
        .select();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
          throw new Error("Username sudah terdaftar. Silakan pilih username lain.");
        }
        if (error.message?.includes('approval_date') || error.message?.includes('column') || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          throw new Error(`Could not find the 'approval_date' column of 'hospital_accounts' in the schema cache. Silakan update skema database Supabase Anda.`);
        }
        throw new Error(`Gagal membuat akun rumah sakit di database Supabase: ${error.message}`);
      }

      const mapped = data && data.length > 0 
        ? mapToHospitalAccount(data[0])
        : mapToHospitalAccount(dbRow);

      // Send Email Notification automatically to the Administrator
      const adminEmailSubject = `🔔 Pendaftaran Akun RS Baru Menunggu Persetujuan: ${newAccount.namaRs}`;
      const adminEmailBody = `
Halo Administrator Utama,

Terdapat permohonan pendaftaran akun Rumah Sakit baru yang membutuhkan persetujuan Anda:

- Nama Rumah Sakit: ${newAccount.namaRs}
- Kode Rumah Sakit: ${newAccount.kodeRs || 'Tidak diisi'}
- Alamat Rumah Sakit: ${newAccount.alamatRs}
- Provinsi: ${newAccount.provinsi || '-'}
- Kota/Kabupaten: ${newAccount.kotaKab || '-'}
- Nama Penanggung Jawab: ${newAccount.penanggungJawab || '-'}
- Jabatan: ${newAccount.jabatan || '-'}
- Nomor WhatsApp: ${newAccount.noWhatsapp || '-'}
- Email Rumah Sakit: ${newAccount.emailRs || '-'}
- Username Terdaftar: ${newAccount.username}
- Tanggal Registrasi: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}

Silakan masuk ke Dashboard Admin Utama untuk menyetujui atau menolak permohonan ini secara aman.
      `;
      await sendSystemEmail('yanmedrsudalmulk@gmail.com', adminEmailSubject, adminEmailBody.trim(), 'admin_notification');

      return mapped;
    } catch (e: any) {
      console.error("Supabase insert hospital_accounts exception:", e);
      if (e.message?.includes('approval_date') || e.message?.includes('column') || e.message?.includes('schema cache') || e.message?.includes('does not exist')) {
        throw new Error(`Could not find the 'approval_date' column of 'hospital_accounts' in the schema cache. Silakan update skema database Supabase Anda.`);
      }
      throw new Error(e.message || "Gagal membuat akun rumah sakit di database Supabase.");
    }
  }

  throw new Error("Koneksi Supabase belum terkonfigurasi.");
}

// Keep existing SurveySubmission helpers for backward compatibility with deleted/unused components
export async function getSubmissions(hospitalId?: string): Promise<SurveySubmission[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (hospitalId && hospitalId !== 'admin') {
        try {
          const { data, error } = await supabase
            .from('survey_submissions')
            .select('*')
            .or(`hospital_id.eq.${hospitalId},user_id.eq.${hospitalId},created_by.eq.${hospitalId},rs_id.eq.${hospitalId}`)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data as SurveySubmission[];
          }
          if (error) {
            const isColError = error.code === '42703' || 
                               error.message?.includes('column') || 
                               error.message?.includes('does not exist') ||
                               error.message?.includes('schema cache');
            if (isColError) {
              throw error;
            }
            console.error("Gagal mengambil submissions dari Supabase:", error);
          }
        } catch (innerErr) {
          // Fallback to only rs_id (always exists)
          const { data, error } = await supabase
            .from('survey_submissions')
            .select('*')
            .eq('rs_id', hospitalId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data as SurveySubmission[];
          }
          console.error("Fallback getSubmissions query failed:", error);
        }
      } else {
        const { data, error } = await supabase
          .from('survey_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as SurveySubmission[];
        }
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

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Koneksi Supabase belum terkonfigurasi.");

  let hospital_id = submission.rs_id;
  let user_id = submission.rs_id;
  let created_by = submission.rs_id;
  let hospital_name = submission.nama_rs;

  try {
    const { data: hospital } = await supabase
      .from('hospital_accounts')
      .select('id, username, nama_rs')
      .ilike('username', submission.rs_id)
      .limit(1);
      
    if (hospital && hospital.length > 0) {
      hospital_id = hospital[0].id;
      user_id = hospital[0].id;
      created_by = hospital[0].username;
      hospital_name = hospital[0].nama_rs;
    }
  } catch (lookupErr) {
    console.warn("Gagal melakukan lookup hospital_accounts untuk multi-tenant submission:", lookupErr);
  }

  const newSubmission: any = {
    ...submission,
    id: `sub-${Date.now()}`,
    created_at: new Date().toISOString(),
    skor_a: score_a,
    skor_b: score_b,
    skor_c: score_c,
    skor_d: score_d,
    skor_f: score_f,
    skor_keseluruhan: score_keseluruhan,
    hospital_id,
    user_id,
    created_by,
    hospital_name
  };

  try {
    let attempts = 0;
    const maxAttempts = 3;
    const insertRow = { ...newSubmission };

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('survey_submissions')
          .insert([insertRow])
          .select();
        if (!error && data && data.length > 0) {
          return data[0] as SurveySubmission;
        }
        if (error) {
          throw error;
        }
      } catch (error: any) {
        const isColError = error.code === '42703' || 
                           error.code === 'PGRST204' ||
                           error.message?.includes('column') || 
                           error.message?.includes('does not exist') ||
                           error.message?.includes('schema cache');
        if (isColError && attempts < maxAttempts) {
          delete insertRow.hospital_id;
          delete insertRow.user_id;
          delete insertRow.created_by;
          delete insertRow.hospital_name;
          continue;
        }
        console.warn(`saveSubmission attempt ${attempts} failed:`, error);
        throw new Error(`Gagal menyimpan pengisian survei ke Supabase: ${error.message}`);
      }
    }
  } catch (e: any) {
    console.error(e);
    throw new Error(e.message || "Gagal menyimpan pengisian survei.");
  }

  throw new Error("Gagal menyimpan pengisian survei setelah beberapa percobaan.");
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

export async function getMasterBenchmark(): Promise<Record<string, { min: number, max: number }> | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ahrq_surveys')
        .select('dimensi_scores')
        .eq('id', 'MASTER_BENCHMARK')
        .single();
      
      if (!error && data && data.dimensi_scores) {
        return data.dimensi_scores as Record<string, { min: number, max: number }>;
      }
    } catch (e) {
      console.error("Failed to get master benchmark", e);
    }
  }
  return null;
}

export async function saveMasterBenchmark(benchmarkData: Record<string, { min: number, max: number }>): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase.from('ahrq_surveys').select('id').eq('id', 'MASTER_BENCHMARK').single();
      
      if (existing) {
        await supabase.from('ahrq_surveys').update({ dimensi_scores: benchmarkData }).eq('id', 'MASTER_BENCHMARK');
      } else {
        await supabase.from('ahrq_surveys').insert([{
          id: 'MASTER_BENCHMARK',
          nama_rs: 'SYSTEM_BENCHMARK',
          unit_kerja: 'SYSTEM',
          jumlah_responden: 0,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: benchmarkData
        }]);
      }
    } catch (e) {
      console.error("Failed to save master benchmark", e);
    }
  }
}

export interface PosisiStaff {
  id: string;
  kategori: string;
  nama_posisi: string;
  is_active: boolean;
}

export const DEFAULT_STAFF_POSITIONS: PosisiStaff[] = [
  // Manajemen
  { id: 'manajemen-1', kategori: 'Manajemen', nama_posisi: 'Direktur', is_active: true },
  { id: 'manajemen-2', kategori: 'Manajemen', nama_posisi: 'Wakil Direktur', is_active: true },
  { id: 'manajemen-3', kategori: 'Manajemen', nama_posisi: 'Kepala Bidang', is_active: true },
  { id: 'manajemen-4', kategori: 'Manajemen', nama_posisi: 'Kepala Bagian', is_active: true },
  { id: 'manajemen-5', kategori: 'Manajemen', nama_posisi: 'Kepala Instalasi', is_active: true },
  { id: 'manajemen-6', kategori: 'Manajemen', nama_posisi: 'Kepala Ruangan', is_active: true },
  { id: 'manajemen-7', kategori: 'Manajemen', nama_posisi: 'Kepala Seksi', is_active: true },
  { id: 'manajemen-8', kategori: 'Manajemen', nama_posisi: 'Kepala Sub Bagian', is_active: true },
  { id: 'manajemen-9', kategori: 'Manajemen', nama_posisi: 'Supervisor', is_active: true },
  { id: 'manajemen-10', kategori: 'Manajemen', nama_posisi: 'Manajer', is_active: true },
  { id: 'manajemen-11', kategori: 'Manajemen', nama_posisi: 'Koordinator', is_active: true },
  { id: 'manajemen-12', kategori: 'Manajemen', nama_posisi: 'Ketua Tim', is_active: true },
  
  // Tenaga Medis
  { id: 'medis-1', kategori: 'Tenaga Medis', nama_posisi: 'Dokter Spesialis', is_active: true },
  { id: 'medis-2', kategori: 'Tenaga Medis', nama_posisi: 'Dokter Umum', is_active: true },
  { id: 'medis-3', kategori: 'Tenaga Medis', nama_posisi: 'Dokter Gigi', is_active: true },
  { id: 'medis-4', kategori: 'Tenaga Medis', nama_posisi: 'Dokter Internship', is_active: true },
  { id: 'medis-5', kategori: 'Tenaga Medis', nama_posisi: 'Residen', is_active: true },
  
  // Tenaga Keperawatan
  { id: 'perawat-1', kategori: 'Tenaga Keperawatan', nama_posisi: 'Perawat', is_active: true },
  { id: 'perawat-2', kategori: 'Tenaga Keperawatan', nama_posisi: 'Bidan', is_active: true },
  { id: 'perawat-3', kategori: 'Tenaga Keperawatan', nama_posisi: 'Penata Anestesi', is_active: true },
  
  // Tenaga Kefarmasian
  { id: 'farmasi-1', kategori: 'Tenaga Kefarmasian', nama_posisi: 'Apoteker', is_active: true },
  { id: 'farmasi-2', kategori: 'Tenaga Kefarmasian', nama_posisi: 'Asisten Apoteker / Tenaga Teknis Kefarmasian', is_active: true },
  
  // Tenaga Penunjang Medis
  { id: 'penunjang-medis-1', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Radiografer', is_active: true },
  { id: 'penunjang-medis-2', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Analis Kesehatan / ATLM', is_active: true },
  { id: 'penunjang-medis-3', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Perekam Medis', is_active: true },
  { id: 'penunjang-medis-4', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Nutrisionis / Ahli Gizi', is_active: true },
  { id: 'penunjang-medis-5', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Fisioterapis', is_active: true },
  { id: 'penunjang-medis-6', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Okupasi Terapis', is_active: true },
  { id: 'penunjang-medis-7', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Terapis Wicara', is_active: true },
  { id: 'penunjang-medis-8', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Psikolog Klinis', is_active: true },
  { id: 'penunjang-medis-9', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Sanitarian', is_active: true },
  { id: 'penunjang-medis-10', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Elektromedis', is_active: true },
  { id: 'penunjang-medis-11', kategori: 'Tenaga Penunjang Medis', nama_posisi: 'Refraksionis Optisien', is_active: true },

  // Penunjang Rumah Sakit
  { id: 'penunjang-rs-1', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Teknisi IPSRS', is_active: true },
  { id: 'penunjang-rs-2', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Staf CSSD', is_active: true },
  { id: 'penunjang-rs-3', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Casemix', is_active: true },
  { id: 'penunjang-rs-4', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Ahli K3RS', is_active: true },
  { id: 'penunjang-rs-5', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Staf IT', is_active: true },
  { id: 'penunjang-rs-6', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Humas', is_active: true },
  { id: 'penunjang-rs-7', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Driver / Sopir Ambulans', is_active: true },
  { id: 'penunjang-rs-8', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Cleaning Service', is_active: true },
  { id: 'penunjang-rs-9', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Pramusaji', is_active: true },
  { id: 'penunjang-rs-10', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Laundry', is_active: true },
  { id: 'penunjang-rs-11', kategori: 'Penunjang Rumah Sakit', nama_posisi: 'Security', is_active: true },

  // Administrasi
  { id: 'admin-1', kategori: 'Administrasi', nama_posisi: 'Staf Administrasi Pendaftaran', is_active: true },
  { id: 'admin-2', kategori: 'Administrasi', nama_posisi: 'Kasir', is_active: true },
  { id: 'admin-3', kategori: 'Administrasi', nama_posisi: 'Staf Administrasi Pengadaan', is_active: true },
  { id: 'admin-4', kategori: 'Administrasi', nama_posisi: 'Staf Administrasi Umum', is_active: true },
  { id: 'admin-5', kategori: 'Administrasi', nama_posisi: 'Staf Kepegawaian', is_active: true },
  { id: 'admin-6', kategori: 'Administrasi', nama_posisi: 'Staf Administrasi Aset', is_active: true },
  { id: 'admin-7', kategori: 'Administrasi', nama_posisi: 'Staf Keuangan', is_active: true },
  { id: 'admin-8', kategori: 'Administrasi', nama_posisi: 'Staf Rekam Medis', is_active: true },

  // Lainnya
  { id: 'lainnya-1', kategori: 'Lainnya', nama_posisi: 'Lainnya', is_active: true }
];

export interface BenchmarkInteraksi {
  id: string;
  dimensi: string;
  dengan_pasien: number;
  tanpa_pasien: number;
}

export async function getBenchmarkInteraksi(): Promise<BenchmarkInteraksi[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('ahrq_surveys').select('dimensi_scores').eq('id', 'MASTER_BENCHMARK_INTERAKSI').single();
      if (data && data.dimensi_scores && (data.dimensi_scores as any).benchmarks) {
        return (data.dimensi_scores as any).benchmarks;
      }
    } catch (e) {
      console.warn("Failed to get benchmark interaksi from supabase", e);
    }
  }
  return [];
}

export async function saveBenchmarkInteraksi(benchmarks: BenchmarkInteraksi[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase.from('ahrq_surveys').select('id').eq('id', 'MASTER_BENCHMARK_INTERAKSI').single();
      if (existing) {
        await supabase.from('ahrq_surveys').update({ dimensi_scores: { benchmarks } }).eq('id', 'MASTER_BENCHMARK_INTERAKSI');
      } else {
        await supabase.from('ahrq_surveys').insert([{
          id: 'MASTER_BENCHMARK_INTERAKSI',
          nama_rs: 'SYSTEM_BENCHMARK_INTERAKSI',
          unit_kerja: 'SYSTEM',
          jumlah_responden: 0,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: { benchmarks }
        }]);
      }
    } catch (e) {
      console.error("Failed to save benchmark interaksi to supabase", e);
    }
  }
}

export async function getMasterPosisi(rsName: string): Promise<PosisiStaff[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ahrq_surveys')
        .select('dimensi_scores')
        .eq('id', `MASTER_POSISI_${rsName}`)
        .single();
        
      if (!error && data && data.dimensi_scores && Array.isArray((data.dimensi_scores as any).positions)) {
        return (data.dimensi_scores as any).positions as PosisiStaff[];
      }
    } catch (e) {
      console.error("Failed to get master posisi", e);
    }
  }
  return DEFAULT_STAFF_POSITIONS;
}

export async function saveMasterPosisi(rsName: string, positions: PosisiStaff[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase.from('ahrq_surveys').select('id').eq('id', `MASTER_POSISI_${rsName}`).single();
      
      if (existing) {
        await supabase.from('ahrq_surveys').update({ dimensi_scores: { positions } }).eq('id', `MASTER_POSISI_${rsName}`);
      } else {
        await supabase.from('ahrq_surveys').insert([{
          id: `MASTER_POSISI_${rsName}`,
          nama_rs: '_MASTER_CONFIG_',
          unit_kerja: rsName,
          jumlah_responden: 0,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: { positions }
        }]);
      }
    } catch (e) {
      console.error("Failed to save master posisi", e);
    }
  }
}

export async function updateSurveyUnitName(rsName: string, oldName: string, newName: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Find all surveys for this hospital with the old unit name
      const { data, error } = await supabase
        .from('ahrq_surveys')
        .select('*')
        .eq('nama_rs', rsName)
        .eq('unit_kerja', oldName);
        
      if (!error && data && data.length > 0) {
        for (const row of data) {
          // Keep raw answers intact, just update the top level unit_kerja which is used for grouping
          await supabase
            .from('ahrq_surveys')
            .update({ unit_kerja: newName })
            .eq('id', row.id);
        }
      }
    } catch (e) {
      console.error("Failed to update survey unit names", e);
    }
  }
}

export interface UnitKerja {
  id: string;
  kategori: string;
  nama_unit: string;
  is_active: boolean;
  order: number;
}

export const DEFAULT_UNIT_KERJA: UnitKerja[] = [
  // Manajemen & Direksi
  { id: 'unit-manajemen-1', kategori: 'Manajemen & Direksi', nama_unit: 'Direksi', is_active: true, order: 1 },
  { id: 'unit-manajemen-2', kategori: 'Manajemen & Direksi', nama_unit: 'Sekretariat Direksi', is_active: true, order: 2 },
  { id: 'unit-manajemen-3', kategori: 'Manajemen & Direksi', nama_unit: 'Manajemen Rumah Sakit', is_active: true, order: 3 },
  { id: 'unit-manajemen-4', kategori: 'Manajemen & Direksi', nama_unit: 'SPI (Satuan Pengawas Internal)', is_active: true, order: 4 },
  { id: 'unit-manajemen-5', kategori: 'Manajemen & Direksi', nama_unit: 'Humas & Pemasaran', is_active: true, order: 5 },
  { id: 'unit-manajemen-6', kategori: 'Manajemen & Direksi', nama_unit: 'PMKP', is_active: true, order: 6 },
  { id: 'unit-manajemen-7', kategori: 'Manajemen & Direksi', nama_unit: 'PPI', is_active: true, order: 7 },
  { id: 'unit-manajemen-8', kategori: 'Manajemen & Direksi', nama_unit: 'K3RS', is_active: true, order: 8 },
  { id: 'unit-manajemen-9', kategori: 'Manajemen & Direksi', nama_unit: 'Casemix', is_active: true, order: 9 },
  { id: 'unit-manajemen-10', kategori: 'Manajemen & Direksi', nama_unit: 'Rekam Medis', is_active: true, order: 10 },
  { id: 'unit-manajemen-11', kategori: 'Manajemen & Direksi', nama_unit: 'SIMRS / IT', is_active: true, order: 11 },

  // Rawat Jalan
  { id: 'unit-rj-1', kategori: 'Rawat Jalan', nama_unit: 'Poli Penyakit Dalam', is_active: true, order: 12 },
  { id: 'unit-rj-2', kategori: 'Rawat Jalan', nama_unit: 'Poli Bedah', is_active: true, order: 13 },
  { id: 'unit-rj-3', kategori: 'Rawat Jalan', nama_unit: 'Poli Anak', is_active: true, order: 14 },
  { id: 'unit-rj-4', kategori: 'Rawat Jalan', nama_unit: 'Poli Kebidanan & Kandungan', is_active: true, order: 15 },
  { id: 'unit-rj-5', kategori: 'Rawat Jalan', nama_unit: 'Poli Saraf', is_active: true, order: 16 },
  { id: 'unit-rj-6', kategori: 'Rawat Jalan', nama_unit: 'Poli Jantung', is_active: true, order: 17 },
  { id: 'unit-rj-7', kategori: 'Rawat Jalan', nama_unit: 'Poli Mata', is_active: true, order: 18 },
  { id: 'unit-rj-8', kategori: 'Rawat Jalan', nama_unit: 'Poli THT', is_active: true, order: 19 },
  { id: 'unit-rj-9', kategori: 'Rawat Jalan', nama_unit: 'Poli Kulit & Kelamin', is_active: true, order: 20 },
  { id: 'unit-rj-10', kategori: 'Rawat Jalan', nama_unit: 'Poli Gigi & Mulut', is_active: true, order: 21 },
  { id: 'unit-rj-11', kategori: 'Rawat Jalan', nama_unit: 'Poli Rehabilitasi Medik', is_active: true, order: 22 },
  { id: 'unit-rj-12', kategori: 'Rawat Jalan', nama_unit: 'Poli Psikiatri', is_active: true, order: 23 },
  { id: 'unit-rj-13', kategori: 'Rawat Jalan', nama_unit: 'Poli Orthopedi', is_active: true, order: 24 },
  { id: 'unit-rj-14', kategori: 'Rawat Jalan', nama_unit: 'Poli Urologi', is_active: true, order: 25 },
  { id: 'unit-rj-15', kategori: 'Rawat Jalan', nama_unit: 'Poli Paru', is_active: true, order: 26 },
  { id: 'unit-rj-16', kategori: 'Rawat Jalan', nama_unit: 'Poli Gizi', is_active: true, order: 27 },
  { id: 'unit-rj-17', kategori: 'Rawat Jalan', nama_unit: 'Poli MCU', is_active: true, order: 28 },
  { id: 'unit-rj-18', kategori: 'Rawat Jalan', nama_unit: 'Poli Lainnya', is_active: true, order: 29 },

  // Instalasi Gawat Darurat
  { id: 'unit-igd-1', kategori: 'Instalasi Gawat Darurat', nama_unit: 'IGD', is_active: true, order: 30 },

  // Rawat Inap
  { id: 'unit-ri-1', kategori: 'Rawat Inap', nama_unit: 'Ruang Rawat Inap Kelas III', is_active: true, order: 31 },
  { id: 'unit-ri-2', kategori: 'Rawat Inap', nama_unit: 'Ruang Rawat Inap Kelas II', is_active: true, order: 32 },
  { id: 'unit-ri-3', kategori: 'Rawat Inap', nama_unit: 'Ruang Rawat Inap Kelas I', is_active: true, order: 33 },
  { id: 'unit-ri-4', kategori: 'Rawat Inap', nama_unit: 'Ruang VIP/VVIP', is_active: true, order: 34 },
  { id: 'unit-ri-5', kategori: 'Rawat Inap', nama_unit: 'ICU', is_active: true, order: 35 },
  { id: 'unit-ri-6', kategori: 'Rawat Inap', nama_unit: 'ICCU', is_active: true, order: 36 },
  { id: 'unit-ri-7', kategori: 'Rawat Inap', nama_unit: 'NICU', is_active: true, order: 37 },
  { id: 'unit-ri-8', kategori: 'Rawat Inap', nama_unit: 'PICU', is_active: true, order: 38 },
  { id: 'unit-ri-9', kategori: 'Rawat Inap', nama_unit: 'HCU', is_active: true, order: 39 },
  { id: 'unit-ri-10', kategori: 'Rawat Inap', nama_unit: 'Perinatologi', is_active: true, order: 40 },
  { id: 'unit-ri-11', kategori: 'Rawat Inap', nama_unit: 'Isolasi', is_active: true, order: 41 },

  // Kamar Operasi
  { id: 'unit-ok-1', kategori: 'Kamar Operasi', nama_unit: 'IBS / OK', is_active: true, order: 42 },
  { id: 'unit-ok-2', kategori: 'Kamar Operasi', nama_unit: 'Recovery Room', is_active: true, order: 43 },
  { id: 'unit-ok-3', kategori: 'Kamar Operasi', nama_unit: 'CSSD', is_active: true, order: 44 },
  { id: 'unit-ok-4', kategori: 'Kamar Operasi', nama_unit: 'Anestesi', is_active: true, order: 45 },

  // Penunjang Medis
  { id: 'unit-pm-1', kategori: 'Penunjang Medis', nama_unit: 'Laboratorium', is_active: true, order: 46 },
  { id: 'unit-pm-2', kategori: 'Penunjang Medis', nama_unit: 'Radiologi', is_active: true, order: 47 },
  { id: 'unit-pm-3', kategori: 'Penunjang Medis', nama_unit: 'Farmasi', is_active: true, order: 48 },
  { id: 'unit-pm-4', kategori: 'Penunjang Medis', nama_unit: 'Bank Darah', is_active: true, order: 49 },
  { id: 'unit-pm-5', kategori: 'Penunjang Medis', nama_unit: 'Hemodialisa', is_active: true, order: 50 },
  { id: 'unit-pm-6', kategori: 'Penunjang Medis', nama_unit: 'Endoskopi', is_active: true, order: 51 },
  { id: 'unit-pm-7', kategori: 'Penunjang Medis', nama_unit: 'Fisioterapi', is_active: true, order: 52 },
  { id: 'unit-pm-8', kategori: 'Penunjang Medis', nama_unit: 'Rehabilitasi Medik', is_active: true, order: 53 },
  { id: 'unit-pm-9', kategori: 'Penunjang Medis', nama_unit: 'Patologi Anatomi', is_active: true, order: 54 },
  { id: 'unit-pm-10', kategori: 'Penunjang Medis', nama_unit: 'Patologi Klinik', is_active: true, order: 55 },
  { id: 'unit-pm-11', kategori: 'Penunjang Medis', nama_unit: 'Gizi', is_active: true, order: 56 },

  // Penunjang Non Medis
  { id: 'unit-pnm-1', kategori: 'Penunjang Non Medis', nama_unit: 'IPSRS', is_active: true, order: 57 },
  { id: 'unit-pnm-2', kategori: 'Penunjang Non Medis', nama_unit: 'Laundry', is_active: true, order: 58 },
  { id: 'unit-pnm-3', kategori: 'Penunjang Non Medis', nama_unit: 'Housekeeping / Cleaning Service', is_active: true, order: 59 },
  { id: 'unit-pnm-4', kategori: 'Penunjang Non Medis', nama_unit: 'Keamanan / Security', is_active: true, order: 60 },
  { id: 'unit-pnm-5', kategori: 'Penunjang Non Medis', nama_unit: 'Transportasi / Driver', is_active: true, order: 61 },
  { id: 'unit-pnm-6', kategori: 'Penunjang Non Medis', nama_unit: 'Ambulans', is_active: true, order: 62 },
  { id: 'unit-pnm-7', kategori: 'Penunjang Non Medis', nama_unit: 'Logistik', is_active: true, order: 63 },
  { id: 'unit-pnm-8', kategori: 'Penunjang Non Medis', nama_unit: 'Gudang', is_active: true, order: 64 },
  { id: 'unit-pnm-9', kategori: 'Penunjang Non Medis', nama_unit: 'Pemulasaran Jenazah', is_active: true, order: 65 },

  // Administrasi
  { id: 'unit-adm-1', kategori: 'Administrasi', nama_unit: 'Pendaftaran', is_active: true, order: 66 },
  { id: 'unit-adm-2', kategori: 'Administrasi', nama_unit: 'Kasir', is_active: true, order: 67 },
  { id: 'unit-adm-3', kategori: 'Administrasi', nama_unit: 'Keuangan', is_active: true, order: 68 },
  { id: 'unit-adm-4', kategori: 'Administrasi', nama_unit: 'Akuntansi', is_active: true, order: 69 },
  { id: 'unit-adm-5', kategori: 'Administrasi', nama_unit: 'Pengadaan Barang/Jasa', is_active: true, order: 70 },
  { id: 'unit-adm-6', kategori: 'Administrasi', nama_unit: 'SDM / Kepegawaian', is_active: true, order: 71 },
  { id: 'unit-adm-7', kategori: 'Administrasi', nama_unit: 'Umum', is_active: true, order: 72 },
  { id: 'unit-adm-8', kategori: 'Administrasi', nama_unit: 'Aset', is_active: true, order: 73 },
  { id: 'unit-adm-9', kategori: 'Administrasi', nama_unit: 'Tata Usaha', is_active: true, order: 74 },

  // Lainnya
  { id: 'unit-lainnya-1', kategori: 'Lainnya', nama_unit: 'Lainnya', is_active: true, order: 75 }
];

export async function getMasterUnit(rsName: string): Promise<UnitKerja[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ahrq_surveys')
        .select('dimensi_scores')
        .eq('id', `MASTER_UNIT_${rsName}`)
        .single();
        
      if (!error && data && data.dimensi_scores && Array.isArray((data.dimensi_scores as any).units)) {
        return (data.dimensi_scores as any).units as UnitKerja[];
      }
    } catch (e) {
      console.error("Failed to get master unit", e);
    }
  }
  return DEFAULT_UNIT_KERJA;
}

export async function saveMasterUnit(rsName: string, units: UnitKerja[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase.from('ahrq_surveys').select('id').eq('id', `MASTER_UNIT_${rsName}`).single();
      
      if (existing) {
        await supabase.from('ahrq_surveys').update({ dimensi_scores: { units } }).eq('id', `MASTER_UNIT_${rsName}`);
      } else {
        await supabase.from('ahrq_surveys').insert([{
          id: `MASTER_UNIT_${rsName}`,
          nama_rs: '_MASTER_CONFIG_',
          unit_kerja: rsName,
          jumlah_responden: 0,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: { units }
        }]);
      }
    } catch (e) {
      console.error("Failed to save master unit", e);
    }
  }
}

export interface BenchmarkRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email?: string;
  target_id: string;
  target_name: string;
  target_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requested_year: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  decided_at?: string;
  decided_by?: string;
}

// Local memory / storage cache key fallback for benchmark_requests
const LOCAL_BENCHMARK_REQUESTS_KEY = 'ahrq_benchmark_requests_v1';

export async function getBenchmarkRequests(hospitalId?: string): Promise<BenchmarkRequest[]> {
  const supabase = getSupabaseClient();
  let items: BenchmarkRequest[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('benchmark_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        items = data as BenchmarkRequest[];
      } else if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        // Table doesn't exist in Supabase yet, try fallback from ahrq_surveys config row
        const { data: configRow } = await supabase
          .from('ahrq_surveys')
          .select('dimensi_scores')
          .eq('id', 'MASTER_BENCHMARK_REQUESTS')
          .single();
        if (configRow && configRow.dimensi_scores && Array.isArray((configRow.dimensi_scores as any).requests)) {
          items = (configRow.dimensi_scores as any).requests;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch benchmark requests from Supabase:", e);
    }
  }

  // Fallback to localStorage if items empty or offline
  if (items.length === 0 && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_BENCHMARK_REQUESTS_KEY);
      if (stored) {
        items = JSON.parse(stored);
      }
    } catch (err) {
      console.warn("Failed reading benchmark_requests from localStorage:", err);
    }
  }

  if (hospitalId && hospitalId !== 'admin') {
    return items.filter(r => 
      r.requester_id === hospitalId || 
      r.target_id === hospitalId ||
      r.requester_name.toLowerCase() === hospitalId.toLowerCase() ||
      r.target_name.toLowerCase() === hospitalId.toLowerCase()
    );
  }

  return items;
}

export async function createBenchmarkRequest(
  reqData: Omit<BenchmarkRequest, 'id' | 'created_at' | 'status'>
): Promise<BenchmarkRequest> {
  const newReq: BenchmarkRequest = {
    ...reqData,
    id: `bm-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  let savedInSupabase = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('benchmark_requests')
        .insert([newReq]);

      if (!error) {
        savedInSupabase = true;
      } else if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        // Fallback store into ahrq_surveys config row
        const allCurrent = await getBenchmarkRequests();
        const updated = [newReq, ...allCurrent.filter(r => r.id !== newReq.id)];
        await supabase.from('ahrq_surveys').upsert({
          id: 'MASTER_BENCHMARK_REQUESTS',
          nama_rs: '_MASTER_CONFIG_',
          unit_kerja: 'BENCHMARK_REQUESTS',
          jumlah_responden: updated.length,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: { requests: updated }
        });
        savedInSupabase = true;
      }
    } catch (e) {
      console.warn("Error inserting benchmark_request to Supabase:", e);
    }
  }

  // Always update localStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const current = await getBenchmarkRequests();
      const updated = [newReq, ...current.filter(r => r.id !== newReq.id)];
      localStorage.setItem(LOCAL_BENCHMARK_REQUESTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("Error saving benchmark_request to localStorage:", err);
    }
  }

  // Trigger automated email notification simulation
  if (newReq.target_email) {
    await sendBenchmarkEmailNotification(
      newReq.target_email,
      `Permintaan Benchmark Data dari Rumah Sakit ${newReq.requester_name}`,
      `Rumah Sakit ${newReq.requester_name} telah mengirimkan permintaan benchmark data untuk tahun ${newReq.requested_year}. Silakan masuk ke aplikasi dan buka menu "Persetujuan Benchmark Data" untuk menyetujui atau menolak permintaan ini.`
    );
  }

  return newReq;
}

export async function updateBenchmarkRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected' | 'revoked',
  decidedBy: string,
  notes?: string
): Promise<BenchmarkRequest | null> {
  const now = new Date().toISOString();
  let updatedReq: BenchmarkRequest | null = null;

  const currentRequests = await getBenchmarkRequests();
  const targetIndex = currentRequests.findIndex(r => r.id === requestId);
  if (targetIndex !== -1) {
    updatedReq = {
      ...currentRequests[targetIndex],
      status,
      notes: notes !== undefined ? notes : currentRequests[targetIndex].notes,
      decided_at: now,
      decided_by: decidedBy,
      updated_at: now
    };
    currentRequests[targetIndex] = updatedReq;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('benchmark_requests')
        .update({
          status,
          notes,
          decided_at: now,
          decided_by: decidedBy,
          updated_at: now
        })
        .eq('id', requestId);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        await supabase.from('ahrq_surveys').upsert({
          id: 'MASTER_BENCHMARK_REQUESTS',
          nama_rs: '_MASTER_CONFIG_',
          unit_kerja: 'BENCHMARK_REQUESTS',
          jumlah_responden: currentRequests.length,
          tanggal_input: now,
          dimensi_scores: { requests: currentRequests }
        });
      }
    } catch (e) {
      console.warn("Failed updating benchmark_request status in Supabase:", e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_BENCHMARK_REQUESTS_KEY, JSON.stringify(currentRequests));
    } catch (err) {
      console.warn("Failed saving updated benchmark_requests to localStorage:", err);
    }
  }

  if (updatedReq && updatedReq.requester_email) {
    const statusLabel = status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Dicabut';
    await sendBenchmarkEmailNotification(
      updatedReq.requester_email,
      `Keputusan Permintaan Benchmark Data dari ${updatedReq.target_name}`,
      `Permintaan benchmark data Anda kepada Rumah Sakit ${updatedReq.target_name} telah ${statusLabel.toUpperCase()} oleh ${decidedBy}.${notes ? ` Catatan: ${notes}` : ''}`
    );
  }

  return updatedReq;
}

export async function deleteBenchmarkRequest(requestId: string): Promise<void> {
  const currentRequests = await getBenchmarkRequests();
  const filtered = currentRequests.filter(r => r.id !== requestId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('benchmark_requests')
        .delete()
        .eq('id', requestId);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        await supabase.from('ahrq_surveys').upsert({
          id: 'MASTER_BENCHMARK_REQUESTS',
          nama_rs: '_MASTER_CONFIG_',
          unit_kerja: 'BENCHMARK_REQUESTS',
          jumlah_responden: filtered.length,
          tanggal_input: new Date().toISOString(),
          dimensi_scores: { requests: filtered }
        });
      }
    } catch (e) {
      console.warn("Failed deleting benchmark_request in Supabase:", e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_BENCHMARK_REQUESTS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn("Failed saving deleted benchmark_requests to localStorage:", err);
    }
  }
}

export async function sendBenchmarkEmailNotification(toEmail: string, subject: string, body: string): Promise<void> {
  console.log(`[EMAIL AUTOMATION] Sending email to: ${toEmail}`);
  console.log(`[EMAIL AUTOMATION] Subject: ${subject}`);
  console.log(`[EMAIL AUTOMATION] Body: ${body}`);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('email_notifications').insert([{
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        to_email: toEmail,
        subject,
        body,
        type: 'approval',
        created_at: new Date().toISOString()
      }]);
    } catch (e) {
      // Ignore if table email_notifications doesn't exist
    }
  }
}




