import { getMysqlSetting, saveMysqlSetting, deleteMysqlSetting, fetchApi } from './mysqlClient';

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

// Resize and compress logo image if it's too large
export function compressLogoImage(base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> {
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
  try {
    const data = await getMysqlSetting<LogoData>('logo');
    if (data && data.url) {
      return data;
    }
  } catch (e) {
    console.warn("Gagal mengambil logo dari database MySQL:", e);
  }

  // Fallback to Local Storage
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('active_logo_url');
    if (url) {
      return { url };
    }
  }

  return null;
}

export async function saveLogo(
  fileDataUrl: string,
  fileName: string
): Promise<LogoData> {
  let finalUrl = fileDataUrl;
  const isDataUrl = fileDataUrl.startsWith('data:');

  // Compress first
  if (isDataUrl) {
    try {
      finalUrl = await compressLogoImage(fileDataUrl, 500, 500);
    } catch {
      finalUrl = fileDataUrl;
    }

    try {
      // Coba upload ke PHP backend upload.php
      const res = await fetchApi('upload', {
        method: 'POST',
        body: JSON.stringify({
          base64: finalUrl,
          type: 'logo',
          save_to_settings: true,
          setting_key: 'logo'
        })
      });

      if (res && res.success && res.url) {
        finalUrl = res.url;
      }
    } catch (uploadErr) {
      console.warn("Gagal upload berkas logo ke server, menyimpan data URL:", uploadErr);
    }
  }

  const logoData: LogoData = { url: finalUrl };

  try {
    await saveMysqlSetting('logo', logoData);
  } catch (dbErr) {
    console.warn("Gagal menyimpan logo ke MySQL:", dbErr);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('active_logo_url', finalUrl);
    } catch { /* ignore */ }
  }

  return logoData;
}

export async function clearLogo(): Promise<void> {
  try {
    await deleteMysqlSetting('logo');
  } catch (e) {
    console.warn("Gagal menghapus logo dari MySQL:", e);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('active_logo_url');
  }
}
