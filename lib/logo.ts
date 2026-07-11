import { getSupabaseClient } from './supabase';

export interface LogoData {
  url: string;
}

// Convert Base64 string to a Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Compress Base64 image to maximum 400px width/height to drastically reduce size for safe localStorage & database storage
export function compressImageBase64(base64Str: string, maxDimension: number = 400): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/png');
        resolve(compressed);
      } catch (e) {
        console.warn("Gagal mengompresi logo, gunakan aslinya:", e);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export async function getLogo(): Promise<LogoData | null> {
  // Try to fetch from Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'logo')
        .single();

      if (!error && data && data.value) {
        let val = data.value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {
            // value is a direct string url
            val = { url: val };
          }
        }
        return val as LogoData;
      }
    } catch (e) {
      console.warn("Gagal mengambil logo dari database Supabase:", e);
    }
    // When Supabase is connected, do NOT fallback to localStorage! We want Supabase to be the single source of truth.
    return null;
  }

  // Fallback to Local Storage ONLY when running purely offline (without Supabase URL/Key)
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('active_logo_url');
    if (url) {
      return { url };
    }
  }

  return null;
}

export async function saveLogo(
  fileDataUrl: string, // Base64 Data URL or direct HTTP/HTTPS URL
  fileName: string
): Promise<LogoData> {
  let finalUrl = fileDataUrl;

  // Step 0: Compress image if it is a Base64 string to prevent payload size issues
  if (fileDataUrl.startsWith('data:image/')) {
    try {
      finalUrl = await compressImageBase64(fileDataUrl);
    } catch (e) {
      console.warn("Gagal mengompresi gambar logo:", e);
    }
  }

  const supabase = getSupabaseClient();
  const isDataUrl = finalUrl.startsWith('data:');

  if (supabase) {
    if (isDataUrl) {
      // Step 1: Attempt to upload to Supabase Storage Bucket 'logos'
      try {
        const mimeType = finalUrl.substring(finalUrl.indexOf(":") + 1, finalUrl.indexOf(";"));
        const blob = base64ToBlob(finalUrl, mimeType);
        const rawExt = fileName.split('.').pop() || 'png';
        const fileExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
        const storagePath = `custom_logo_${Date.now()}.${fileExt}`;

        // Proactively try to create bucket 'logos' in case it doesn't exist yet
        try {
          await supabase.storage.createBucket('logos', { public: true });
        } catch (bucketErr) {
          console.warn("Gagal membuat/memverifikasi bucket 'logos' (mungkin sudah ada atau tidak ada izin):", bucketErr);
        }

        // Attempt upload with upsert: false to avoid update policy permission errors
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(storagePath, blob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload storage gagal: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('logos')
          .getPublicUrl(storagePath);
        
        if (urlData && urlData.publicUrl) {
          finalUrl = urlData.publicUrl;
          console.log("Berhasil mengunggah logo ke Supabase Storage:", finalUrl);
        }
      } catch (storageErr: any) {
        console.error("Gagal melakukan unggah logo ke Storage:", storageErr);
        throw new Error(`Gagal menyimpan logo ke Supabase Storage. Pastikan Anda sudah membuat bucket 'logos' di Supabase dengan akses publik. Detail: ${storageErr.message}`);
      }
    }

    // Step 2: Save metadata to database table 'app_settings'
    try {
      const payload = {
        key: 'logo',
        value: {
          url: finalUrl
        },
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'key' });

      if (dbError) {
        console.error("Gagal melakukan upsert logo ke tabel app_settings:", dbError);
        throw new Error(`Gagal menyimpan konfigurasi logo ke database Supabase: ${dbError.message}`);
      }
    } catch (dbErr: any) {
      console.error("Gagal menyimpan logo ke database 'app_settings':", dbErr);
      throw dbErr;
    }
  } else {
    // Fallback to Local Storage ONLY when running purely offline (without Supabase URL/Key)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('active_logo_url', finalUrl);
      } catch (e) {
        console.warn("Gagal menyimpan logo ke localStorage (quota exceeded):", e);
        throw new Error("Penyimpanan lokal penuh. Harap hubungkan dengan database cloud Supabase untuk penyimpanan permanen tanpa batas.");
      }
    }
  }

  return { url: finalUrl };
}

export async function clearLogo(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'logo');
      if (error) {
        throw error;
      }
    } catch (e: any) {
      console.error("Gagal menghapus logo dari Supabase:", e);
      throw new Error(`Gagal menghapus logo dari Supabase: ${e.message}`);
    }
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_logo_url');
    }
  }
}
