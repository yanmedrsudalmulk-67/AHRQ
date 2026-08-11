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
  const supabase = getSupabaseClient();
  const isDataUrl = fileDataUrl.startsWith('data:');

  if (supabase) {
    if (isDataUrl) {
      try {
        const mimeType = fileDataUrl.substring(fileDataUrl.indexOf(":") + 1, fileDataUrl.indexOf(";"));
        const blob = base64ToBlob(fileDataUrl, mimeType);
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
