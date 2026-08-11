import { getSupabaseClient } from './supabase';

export interface HeaderImageData {
  url: string;
  position?: 'center' | 'center-right' | 'top-right' | 'bottom-right';
  updated_at?: string;
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

// Compress Base64 image to maximum 1200px width/height to reduce size while maintaining quality for banners
export function compressHeaderImageBase64(base64Str: string, maxDimension: number = 1200): Promise<string> {
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
        const compressed = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG for banners to save space
        resolve(compressed);
      } catch (e) {
        console.warn("Gagal mengompresi gambar header, gunakan aslinya:", e);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export async function getHeaderImage(): Promise<HeaderImageData | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'dashboard_header_image')
        .single();

      if (!error && data && data.value) {
        let val = data.value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {
            val = { url: val, position: 'center-right' };
          }
        }
        return val as HeaderImageData;
      }
    } catch (e) {
      console.warn("Gagal mengambil gambar header dari database Supabase:", e);
    }
    return null;
  }

  // Fallback to Local Storage ONLY when running purely offline (without Supabase URL/Key)
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('dashboard_header_image_url');
    const position = (localStorage.getItem('dashboard_header_image_pos') || 'center-right') as HeaderImageData['position'];
    if (url) {
      return { url, position };
    }
  }

  return null;
}

export async function saveHeaderImage(
  fileDataUrl: string, // Base64 Data URL or direct HTTP/HTTPS URL
  position: 'center' | 'center-right' | 'top-right' | 'bottom-right' = 'center-right',
  fileName?: string
): Promise<HeaderImageData> {
  let finalUrl = fileDataUrl;

  // Step 0: Compress image if it is a Base64 string to prevent payload size issues
  if (fileDataUrl.startsWith('data:image/')) {
    try {
      finalUrl = await compressHeaderImageBase64(fileDataUrl);
    } catch (e) {
      console.warn("Gagal mengompresi gambar header:", e);
    }
  }

  const supabase = getSupabaseClient();
  const isDataUrl = finalUrl.startsWith('data:');

  if (supabase) {
    if (isDataUrl) {
      try {
        const mimeType = finalUrl.substring(finalUrl.indexOf(":") + 1, finalUrl.indexOf(";"));
        const blob = base64ToBlob(finalUrl, mimeType);
        const rawExt = fileName?.split('.').pop() || 'png';
        const fileExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
        const storagePath = `custom_header_${Date.now()}.${fileExt}`;

        try {
          await supabase.storage.createBucket('dashboard', { public: true });
        } catch (bucketErr) {
          console.warn("Bucket dashboard check:", bucketErr);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dashboard')
          .upload(storagePath, blob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn("Upload storage warning, using fallback url:", uploadError.message);
          // Don't throw here, if upload fails we can still store the base64 in the DB (though not ideal)
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('dashboard')
            .getPublicUrl(storagePath);
          
          if (urlData && urlData.publicUrl) {
            finalUrl = urlData.publicUrl;
          }
        }
      } catch (storageErr: any) {
        console.error("Error uploading header image to Supabase Storage:", storageErr);
      }
    }

    try {
      const payload = {
        key: 'dashboard_header_image',
        value: {
          url: finalUrl,
          position,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'key' });

      if (dbError) {
        console.error("Gagal melakukan upsert header image ke tabel app_settings:", dbError);
        throw new Error(`Gagal menyimpan konfigurasi gambar header ke database: ${dbError.message}`);
      }
    } catch (dbErr: any) {
      console.error("Gagal menyimpan header image ke database Supabase:", dbErr);
      throw dbErr;
    }
  } else {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dashboard_header_image_url', finalUrl);
        localStorage.setItem('dashboard_header_image_pos', position);
      } catch (e) {
        console.warn("Gagal menyimpan gambar header ke localStorage:", e);
        throw new Error("Penyimpanan lokal penuh.");
      }
    }
  }

  return { url: finalUrl, position, updated_at: new Date().toISOString() };
}

export async function clearHeaderImage(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'dashboard_header_image');
    } catch (e) {
      console.warn("Gagal menghapus header image di database:", e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('dashboard_header_image_url');
    localStorage.removeItem('dashboard_header_image_pos');
  }
}
