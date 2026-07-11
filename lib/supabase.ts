import { createClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client to prevent application crashes when keys are missing.
const globalForSupabase = globalThis as unknown as {
  supabaseInstance: any;
};

export function getSupabaseClient() {
  if (globalForSupabase.supabaseInstance) return globalForSupabase.supabaseInstance;

  // Read strictly from environment variables configured in code/deployment.
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && anonKey) {
    // Robustly sanitize URL to extract only the origin (protocol + host + port),
    // discarding any appended paths (like '/rest/v1/' or trailing slashes) that users might configure.
    try {
      const parsed = new URL(url);
      url = parsed.origin;
    } catch (e) {
      // Fallback to removing trailing slashes if URL parsing fails
      while (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
    }
    try {
      globalForSupabase.supabaseInstance = createClient(url, anonKey);
      return globalForSupabase.supabaseInstance;
    } catch (e) {
      console.error("Gagal menginisialisasi client Supabase:", e);
      return null;
    }
  }

  return null;
}

export function resetSupabaseClient() {
  globalForSupabase.supabaseInstance = null;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tableMissing: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Klien Supabase belum dikonfigurasi (URL/Anon Key kosong).", tableMissing: false };
  }
  try {
    const { error } = await supabase.from('app_settings').select('key').limit(1);
    if (error) {
      // 42P01 is Postgres error code for 'relation "app_settings" does not exist'
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, message: "Koneksi Supabase berhasil! Namun, tabel 'app_settings' belum dibuat di database Anda.", tableMissing: true };
      }
      return { success: false, message: `Kesalahan API Supabase: ${error.message} (Kode: ${error.code})`, tableMissing: false };
    }
    return { success: true, message: "Koneksi Supabase Sukses! Database terhubung dengan benar dan tabel siap digunakan.", tableMissing: false };
  } catch (e: any) {
    return { success: false, message: `Kesalahan Jaringan / CORS: ${e.message || e}`, tableMissing: false };
  }
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

