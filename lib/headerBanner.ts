import { getMysqlSetting, saveMysqlSetting, deleteMysqlSetting, fetchApi } from './mysqlClient';

export interface HeaderImageData {
  url: string;
  position?: 'top-right' | 'center-right' | 'bottom-right' | 'cover';
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function compressHeaderImage(base64Str: string, maxWidth = 1200, maxHeight = 600): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(base64Str);
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(base64Str);
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      } catch (e) {
        console.warn("Gagal mengompresi gambar banner, gunakan aslinya:", e);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export async function getHeaderImage(): Promise<HeaderImageData | null> {
  try {
    const data = await getMysqlSetting<HeaderImageData>('dashboard_header_image');
    if (data && data.url) {
      return data;
    }
  } catch (e) {
    console.warn("Gagal mengambil banner dari database MySQL:", e);
  }

  // Fallback to Local Storage
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('active_header_image_url');
    const pos = localStorage.getItem('active_header_image_pos') as any;
    if (url) {
      return { url, position: pos || 'center-right' };
    }
  }

  return null;
}

export async function saveHeaderImage(
  fileDataUrl: string,
  fileName: string,
  position: 'top-right' | 'center-right' | 'bottom-right' | 'cover' = 'center-right'
): Promise<HeaderImageData> {
  let finalUrl = fileDataUrl;
  const isDataUrl = fileDataUrl.startsWith('data:');

  if (isDataUrl) {
    try {
      finalUrl = await compressHeaderImage(fileDataUrl, 1200, 600);
    } catch {
      finalUrl = fileDataUrl;
    }

    try {
      const res = await fetchApi('upload', {
        method: 'POST',
        body: JSON.stringify({
          base64: finalUrl,
          type: 'banner',
          save_to_settings: true,
          setting_key: 'dashboard_header_image'
        })
      });

      if (res && res.success && res.url) {
        finalUrl = res.url;
      }
    } catch (uploadErr) {
      console.warn("Gagal upload berkas banner ke server, menyimpan data URL:", uploadErr);
    }
  }

  const headerData: HeaderImageData = { url: finalUrl, position };

  try {
    await saveMysqlSetting('dashboard_header_image', headerData);
  } catch (dbErr) {
    console.warn("Gagal menyimpan banner ke MySQL:", dbErr);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('active_header_image_url', finalUrl);
      localStorage.setItem('active_header_image_pos', position);
    } catch { /* ignore */ }
  }

  return headerData;
}

export async function clearHeaderImage(): Promise<void> {
  try {
    await deleteMysqlSetting('dashboard_header_image');
  } catch (e) {
    console.warn("Gagal menghapus banner dari MySQL:", e);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('active_header_image_url');
    localStorage.removeItem('active_header_image_pos');
  }
}
