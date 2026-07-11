import { getSupabaseClient } from './supabase';
import bcrypt from 'bcryptjs';

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

