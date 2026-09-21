/**
 * ==============================================================================
 * CLIENT API LAYER UNTUK MYSQL & PHP BACKEND HOSTINGER
 * Menggantikan panggilan Supabase dengan REST API PHP MySQL Hostinger
 * ==============================================================================
 */

import { SurveyData, HospitalAccount, BenchmarkRequest, BenchmarkInteraksi, PengesahanConfig } from './db';

// Kunci penyimpanan konfigurasi custom Hostinger API URL di LocalStorage
export const LOCAL_MYSQL_API_URL_KEY = 'ahrq_hostinger_mysql_api_url';

/**
 * Mendapatkan Base URL API PHP Hostinger
 * Prioritas:
 * 1. LocalStorage (jika disetel pengguna via Pengaturan UI)
 * 2. process.env.NEXT_PUBLIC_API_URL
 * 3. Fallback ke internal Next.js `/api/mysql`
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const customUrl = localStorage.getItem(LOCAL_MYSQL_API_URL_KEY);
      if (customUrl && customUrl.trim().startsWith('http')) {
        return customUrl.trim().replace(/\/+$/, '');
      }
    } catch { /* ignore */ }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HOSTINGER_API_URL;
  if (envUrl && envUrl.trim().startsWith('http')) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '/api/mysql';
}

/**
 * Menyimpan Custom API URL Hostinger di browser
 */
export function setCustomApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem(LOCAL_MYSQL_API_URL_KEY);
    } else {
      localStorage.setItem(LOCAL_MYSQL_API_URL_KEY, url.trim().replace(/\/+$/, ''));
    }
  }
}

/**
 * Cek apakah API Hostinger sudah dikonfigurasi
 */
export function isMysqlConfigured(): boolean {
  const url = getApiBaseUrl();
  return url.startsWith('http') || url.startsWith('/api/mysql');
}

/**
 * Helper pemanggilan HTTP fetch generik ke PHP backend
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string; [key: string]: any }> {
  const baseUrl = getApiBaseUrl();
  
  // Jika baseUrl mengarah ke Hostinger PHP (e.g. https://domain.com/api),
  // pastikan penamaan file .php sesuai
  let finalUrl = `${baseUrl}/${endpoint}`;
  if (baseUrl.startsWith('http') && !endpoint.includes('.php') && !endpoint.includes('?')) {
    // Tambahkan ekstensi .php jika backend adalah PHP native di Hostinger
    const [path, query] = endpoint.split('?');
    finalUrl = `${baseUrl}/${path}.php${query ? '?' + query : ''}`;
  } else if (baseUrl.startsWith('http') && !endpoint.includes('.php') && endpoint.includes('?')) {
    const [path, query] = endpoint.split('?');
    finalUrl = `${baseUrl}/${path}.php?${query}`;
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(finalUrl, {
      ...options,
      headers
    });

    const text = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: res.ok, message: text };
    }

    if (!res.ok && !json.error) {
      json.error = `HTTP ${res.status}: ${res.statusText}`;
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal menghubungi server API Hostinger'
    };
  }
}

/**
 * Menguji koneksi ke server API MySQL Hostinger
 */
export async function testMysqlConnection(testUrl?: string): Promise<{
  success: boolean;
  status: string;
  message: string;
  database_name?: string;
  database_version?: string;
  all_tables_ready?: boolean;
  missing_tables?: string[];
  table_row_counts?: Record<string, any>;
  error?: string;
}> {
  const targetBase = testUrl ? testUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  let testEndpoint = `${targetBase}/test_connection`;
  if (targetBase.startsWith('http')) {
    testEndpoint = `${targetBase}/test_connection.php`;
  }

  try {
    const res = await fetch(testEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: text };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      message: 'Gagal terhubung ke URL API Hostinger: ' + (err?.message || 'Network error'),
      error: err?.message
    };
  }
}

// ------------------------------------------------------------------------------
// SURVEI AHRQ SOPS 2.0 (ahrq_surveys & submissions)
// ------------------------------------------------------------------------------

export async function getMysqlSurveys(hospitalId?: string, namaRs?: string): Promise<SurveyData[]> {
  const params = new URLSearchParams();
  if (hospitalId && hospitalId !== 'admin') {
    params.set('hospital_id', hospitalId);
  }
  if (namaRs && namaRs !== 'Semua Rumah Sakit') {
    params.set('nama_rs', namaRs);
  }

  const res = await fetchApi(`surveys?${params.toString()}`, { method: 'GET' });
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((r: any) => ({
      id: r.id,
      namaRs: r.nama_rs,
      unitKerja: r.unit_kerja,
      jumlahResponden: r.jumlah_responden,
      tanggalInput: r.tanggal_input,
      dimensiScores: typeof r.dimensi_scores === 'string' ? JSON.parse(r.dimensi_scores) : r.dimensi_scores,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }
  return [];
}

export async function saveMysqlSurvey(survey: SurveyData, options?: any): Promise<void> {
  const payload = {
    id: survey.id,
    nama_rs: survey.namaRs,
    unit_kerja: survey.unitKerja,
    jumlah_responden: survey.jumlahResponden,
    tanggal_input: survey.tanggalInput,
    dimensi_scores: {
      ...survey.dimensiScores,
      hospital_id: options?.hospitalId || options?.identifier,
      user_id: options?.userId || options?.identifier,
      created_by: options?.createdBy || options?.identifier,
      hospital_name: options?.hospitalName || survey.namaRs
    },
    hospital_id: options?.hospitalId || options?.identifier,
    user_id: options?.userId || options?.identifier,
    created_by: options?.createdBy || options?.identifier,
    hospital_name: options?.hospitalName || survey.namaRs,
    link_token: options?.token
  };

  const res = await fetchApi('surveys', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.success) {
    throw new Error(res.error || res.message || 'Gagal menyimpan survei ke database MySQL');
  }
}

export async function saveMysqlSurveysBatch(surveys: SurveyData[]): Promise<number> {
  const res = await fetchApi('surveys?action=batch', {
    method: 'POST',
    body: JSON.stringify({ surveys })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menyimpan batch survei');
  }
  return res.count || surveys.length;
}

export async function deleteMysqlSurvey(id: string): Promise<void> {
  const res = await fetchApi(`surveys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.success) {
    throw new Error(res.error || 'Gagal menghapus survei');
  }
}

export async function deleteMysqlSurveysByUnit(unitKerja: string, hospitalId?: string): Promise<void> {
  const params = new URLSearchParams({ action: 'delete_by_unit', unit_kerja: unitKerja });
  if (hospitalId) params.set('hospital_id', hospitalId);
  const res = await fetchApi(`surveys?${params.toString()}`, { method: 'DELETE' });
  if (!res.success) {
    throw new Error(res.error || 'Gagal menghapus survei unit');
  }
}

export async function deleteMysqlSurveysByHospital(namaRs: string, hospitalId?: string): Promise<void> {
  const params = new URLSearchParams({ action: 'delete_by_hospital', nama_rs: namaRs });
  if (hospitalId) params.set('hospital_id', hospitalId);
  const res = await fetchApi(`surveys?${params.toString()}`, { method: 'DELETE' });
  if (!res.success) {
    throw new Error(res.error || 'Gagal menghapus survei rumah sakit');
  }
}

export async function renameMysqlUnit(oldUnit: string, newUnit: string, hospitalId?: string): Promise<void> {
  const res = await fetchApi('surveys?action=rename_unit', {
    method: 'PUT',
    body: JSON.stringify({ oldUnitName: oldUnit, newUnitName: newUnit, hospitalId })
  });
  if (!res.success) {
    throw new Error(res.error || 'Gagal memperbarui nama unit');
  }
}

export async function getMysqlSurveyLinkConfig(token?: string, identifier?: string): Promise<any> {
  const params = new URLSearchParams({ action: 'link_config' });
  if (token) params.set('link_token', token);
  if (identifier) params.set('identifier', identifier);

  const res = await fetchApi(`surveys?${params.toString()}`, { method: 'GET' });
  return res.data || null;
}

export async function saveMysqlSurveyLinkConfig(token: string, config: any, rsName: string, identifier: string): Promise<void> {
  const payload = {
    id: `LINK_CONFIG_${token}`,
    nama_rs: '_LINK_CONFIG_',
    unit_kerja: identifier,
    tanggal_input: new Date().toISOString().split('T')[0],
    jumlah_responden: config.isActive ? 1 : 0,
    dimensi_scores: {
      ...config,
      token,
      rsName,
      hospital_id: identifier,
      user_id: identifier,
      created_by: identifier,
      hospital_name: rsName
    },
    hospital_id: identifier,
    user_id: identifier,
    created_by: identifier,
    hospital_name: rsName
  };

  const res = await fetchApi('surveys', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menyimpan pengaturan link survei');
  }
}

export async function saveMysqlSurveySubmission(submission: any): Promise<string> {
  const res = await fetchApi('surveys?action=save_submission', {
    method: 'POST',
    body: JSON.stringify({ submission })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menyimpan submission instrumen survei');
  }
  return res.id;
}

// ------------------------------------------------------------------------------
// AKUN RUMAH SAKIT (hospital_accounts)
// ------------------------------------------------------------------------------

export async function getMysqlHospitalAccounts(status?: string): Promise<HospitalAccount[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetchApi(`accounts${query}`, { method: 'GET' });
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function getMysqlHospitalAccountByUsername(username: string): Promise<HospitalAccount | null> {
  const res = await fetchApi(`accounts?username=${encodeURIComponent(username)}`, { method: 'GET' });
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function createMysqlHospitalAccount(accountData: Partial<HospitalAccount>): Promise<HospitalAccount> {
  const res = await fetchApi('accounts', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal mendaftarkan akun rumah sakit');
  }
  return res.data;
}

export async function updateMysqlHospitalProfile(id: string, updates: Partial<HospitalAccount>): Promise<void> {
  const res = await fetchApi(`accounts?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal memperbarui profil rumah sakit');
  }
}

export async function updateMysqlHospitalStatus(
  id: string,
  status: 'Pending' | 'Active' | 'Rejected' | 'Disabled' | 'Archived',
  approvedBy: string,
  rejectionReason?: string
): Promise<void> {
  const res = await fetchApi(`accounts?action=status&id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ id, status, approvedBy, rejectionReason })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal memperbarui status akun');
  }
}

export async function deleteMysqlHospitalAccount(id: string): Promise<void> {
  const res = await fetchApi(`accounts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menghapus akun rumah sakit');
  }
}

// ------------------------------------------------------------------------------
// BENCHMARK (benchmark_requests & master settings)
// ------------------------------------------------------------------------------

export async function getMysqlBenchmarkRequests(hospitalId?: string): Promise<BenchmarkRequest[]> {
  if (!hospitalId || hospitalId === 'admin') return [];
  const res = await fetchApi(`benchmark?hospital_id=${encodeURIComponent(hospitalId)}`, { method: 'GET' });
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function createMysqlBenchmarkRequest(reqData: Omit<BenchmarkRequest, 'id' | 'created_at' | 'status'>): Promise<BenchmarkRequest> {
  const res = await fetchApi('benchmark', {
    method: 'POST',
    body: JSON.stringify(reqData)
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal membuat permintaan benchmark');
  }
  return res.data;
}

export async function updateMysqlBenchmarkRequestStatus(
  id: string,
  status: 'approved' | 'rejected' | 'revoked',
  decidedBy: string,
  notes?: string
): Promise<void> {
  const res = await fetchApi(`benchmark?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ id, status, decidedBy, notes })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal mengubah status permintaan benchmark');
  }
}

export async function deleteMysqlBenchmarkRequest(id: string): Promise<void> {
  const res = await fetchApi(`benchmark?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menghapus permintaan benchmark');
  }
}

export async function getMysqlMasterBenchmark(): Promise<Record<string, { min: number; max: number }> | null> {
  const res = await fetchApi('benchmark?action=master', { method: 'GET' });
  return res.data || null;
}

export async function saveMysqlMasterBenchmark(benchmarks: Record<string, { min: number; max: number }>): Promise<void> {
  const res = await fetchApi('benchmark?action=master', {
    method: 'POST',
    body: JSON.stringify({ benchmarks })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menyimpan master benchmark');
  }
}

export async function getMysqlBenchmarkInteraksi(): Promise<BenchmarkInteraksi[]> {
  const res = await fetchApi('benchmark?action=interaksi', { method: 'GET' });
  return res.data || [];
}

export async function saveMysqlBenchmarkInteraksi(benchmarks: BenchmarkInteraksi[]): Promise<void> {
  const res = await fetchApi('benchmark?action=interaksi', {
    method: 'POST',
    body: JSON.stringify({ benchmarks })
  });

  if (!res.success) {
    throw new Error(res.error || 'Gagal menyimpan benchmark interaksi');
  }
}

// ------------------------------------------------------------------------------
// PENGATURAN & ASSETS (app_settings)
// ------------------------------------------------------------------------------

export async function getMysqlSetting<T = any>(key: string): Promise<T | null> {
  const res = await fetchApi(`settings?key=${encodeURIComponent(key)}`, { method: 'GET' });
  return res.data !== undefined ? res.data : null;
}

export async function saveMysqlSetting(key: string, value: any): Promise<void> {
  const res = await fetchApi('settings', {
    method: 'POST',
    body: JSON.stringify({ key, value })
  });

  if (!res.success) {
    throw new Error(res.error || `Gagal menyimpan setting: ${key}`);
  }
}

export async function deleteMysqlSetting(key: string): Promise<void> {
  await fetchApi(`settings?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}

// ------------------------------------------------------------------------------
// MASTER POSISI & MASTER UNIT & PENGESAHAN
// ------------------------------------------------------------------------------

export async function getMysqlMasterPosisiConfig(rsName: string): Promise<any | null> {
  const res = await fetchApi(`settings?key=${encodeURIComponent(`MASTER_POSISI_${rsName}`)}`, { method: 'GET' });
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function saveMysqlMasterPosisi(rsName: string, positions: any[], customCategories?: string[]): Promise<void> {
  const payload = {
    positions,
    customCategories: customCategories || []
  };
  await saveMysqlSetting(`MASTER_POSISI_${rsName}`, payload);
}

export async function getMysqlMasterUnitConfig(rsName: string): Promise<any | null> {
  const res = await fetchApi(`settings?key=${encodeURIComponent(`MASTER_UNIT_${rsName}`)}`, { method: 'GET' });
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function saveMysqlMasterUnit(rsName: string, units: any[], customCategories?: string[]): Promise<void> {
  const payload = {
    units,
    customCategories: customCategories || []
  };
  await saveMysqlSetting(`MASTER_UNIT_${rsName}`, payload);
}

export async function getMysqlPengesahanConfig(identifier: string): Promise<PengesahanConfig | null> {
  const res = await fetchApi(`settings?key=${encodeURIComponent(`PENGESAHAN_${identifier}`)}`, { method: 'GET' });
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function saveMysqlPengesahanConfig(identifier: string, config: PengesahanConfig): Promise<void> {
  await saveMysqlSetting(`PENGESAHAN_${identifier}`, config);
}

// ------------------------------------------------------------------------------
// AUDIT LOGS (account_audit_logs & benchmark_audit_logs)
// ------------------------------------------------------------------------------

export async function getMysqlAuditLogs(type: 'account' | 'benchmark', hospitalId?: string): Promise<any[]> {
  const params = new URLSearchParams({ type });
  if (hospitalId) params.set('hospital_id', hospitalId);
  const res = await fetchApi(`audit_logs?${params.toString()}`, { method: 'GET' });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function addMysqlAuditLog(type: 'account' | 'benchmark', logData: any): Promise<void> {
  await fetchApi(`audit_logs?type=${type}`, {
    method: 'POST',
    body: JSON.stringify(logData)
  });
}
