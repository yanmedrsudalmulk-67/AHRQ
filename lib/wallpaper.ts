import { getSupabaseClient } from './supabase';

export interface WallpaperData {
  url: string;
  type: 'image' | 'video';
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

export async function getWallpaper(): Promise<WallpaperData | null> {
  // Try to fetch from Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'wallpaper')
        .single();

      if (!error && data && data.value) {
        let val = data.value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {
            // value is a direct string url
            val = { url: val, type: 'image' };
          }
        }
        return val as WallpaperData;
      }
    } catch (e) {
      console.warn("Gagal mengambil wallpaper dari database Supabase:", e);
    }
    // When Supabase is connected, do NOT fallback to localStorage! We want Supabase to be the single source of truth.
    return null;
  }

  // Fallback to Local Storage ONLY when running purely offline (without Supabase URL/Key)
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('active_wallpaper_url');
    const type = localStorage.getItem('active_wallpaper_type') as 'image' | 'video' | null;
    if (url) {
      return { url, type: type || 'image' };
    }
  }

  return null;
}

export async function saveWallpaper(
  fileDataUrl: string, // Base64 Data URL or direct HTTP/HTTPS URL
  fileType: 'image' | 'video',
  fileName: string
): Promise<WallpaperData> {
  let finalUrl = fileDataUrl;
  const supabase = getSupabaseClient();
  const isDataUrl = fileDataUrl.startsWith('data:');

  if (supabase) {
    if (isDataUrl) {
      // Step 1: Attempt to upload to Supabase Storage Bucket 'wallpapers'
      try {
        const mimeType = fileDataUrl.substring(fileDataUrl.indexOf(":") + 1, fileDataUrl.indexOf(";"));
        const blob = base64ToBlob(fileDataUrl, mimeType);
        const rawExt = fileName.split('.').pop() || (fileType === 'video' ? 'mp4' : 'jpg');
        const fileExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || (fileType === 'video' ? 'mp4' : 'jpg');
        const storagePath = `custom_wallpaper_${Date.now()}.${fileExt}`;

        // Proactively try to create bucket 'wallpapers' in case it doesn't exist yet
        try {
          await supabase.storage.createBucket('wallpapers', { public: true });
        } catch (bucketErr) {
          console.warn("Gagal membuat/memverifikasi bucket 'wallpapers' (mungkin sudah ada atau tidak ada izin):", bucketErr);
        }

        // Attempt upload with upsert: false to avoid update policy permission errors
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wallpapers')
          .upload(storagePath, blob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload storage gagal: ${uploadError.message}`);
        } else if (uploadData) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('wallpapers')
            .getPublicUrl(storagePath);
          
          if (urlData && urlData.publicUrl) {
            finalUrl = urlData.publicUrl;
            console.log("Berhasil mengunggah wallpaper ke Supabase Storage:", finalUrl);
          }
        }
      } catch (storageErr: any) {
        console.error("Error uploading wallpaper to Supabase Storage:", storageErr);
        throw new Error(`Gagal menyimpan wallpaper ke Supabase Storage. Pastikan Anda sudah membuat bucket 'wallpapers' di Supabase dengan akses publik. Detail: ${storageErr.message}`);
      }
    }

    // Step 2: Save to database table 'app_settings'
    try {
      const payload = {
        key: 'wallpaper',
        value: {
          url: finalUrl,
          type: fileType
        },
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'key' });

      if (dbError) {
        console.error("Gagal melakukan upsert wallpaper ke tabel app_settings:", dbError);
        throw new Error(`Gagal menyimpan konfigurasi wallpaper ke database Supabase: ${dbError.message}`);
      }
    } catch (dbErr: any) {
      console.error("Gagal menyimpan wallpaper ke database Supabase:", dbErr);
      throw dbErr;
    }
  } else {
    // Fallback to Local Storage ONLY when running purely offline (without Supabase URL/Key)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('active_wallpaper_url', finalUrl);
        localStorage.setItem('active_wallpaper_type', fileType);
      } catch (e) {
        console.warn("Gagal menyimpan wallpaper ke localStorage (quota exceeded):", e);
        throw new Error("Penyimpanan lokal penuh. Harap hubungkan dengan database cloud Supabase untuk penyimpanan permanen tanpa batas.");
      }
    }
  }

  return { url: finalUrl, type: fileType };
}

export async function clearWallpaper(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'wallpaper');
      if (error) {
        throw error;
      }
    } catch (e: any) {
      console.error("Gagal menghapus wallpaper dari Supabase:", e);
      throw new Error(`Gagal menghapus wallpaper dari Supabase: ${e.message}`);
    }
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_wallpaper_url');
      localStorage.removeItem('active_wallpaper_type');
    }
  }
}
