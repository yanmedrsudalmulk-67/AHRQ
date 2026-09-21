import { getMysqlSetting, saveMysqlSetting, deleteMysqlSetting, fetchApi } from './mysqlClient';

export interface WallpaperData {
  url: string;
  type: 'image' | 'video';
}

export async function getWallpaper(): Promise<WallpaperData | null> {
  try {
    const data = await getMysqlSetting<WallpaperData>('wallpaper');
    if (data && data.url) {
      return data;
    }
  } catch (e) {
    console.warn("Gagal mengambil wallpaper dari MySQL:", e);
  }

  // Fallback to Local Storage
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
  fileDataUrl: string,
  fileType: 'image' | 'video',
  fileName: string
): Promise<WallpaperData> {
  let finalUrl = fileDataUrl;
  const isDataUrl = fileDataUrl.startsWith('data:');

  if (isDataUrl) {
    try {
      // Coba upload ke PHP backend upload.php
      const res = await fetchApi('upload', {
        method: 'POST',
        body: JSON.stringify({
          base64: fileDataUrl,
          type: 'wallpaper',
          save_to_settings: true,
          setting_key: 'wallpaper'
        })
      });

      if (res && res.success && res.url) {
        finalUrl = res.url;
      }
    } catch (uploadErr) {
      console.warn("Gagal upload berkas fisik ke server, menyimpan data URL:", uploadErr);
    }
  }

  const wallpaperData: WallpaperData = { url: finalUrl, type: fileType };

  try {
    await saveMysqlSetting('wallpaper', wallpaperData);
  } catch (dbErr) {
    console.warn("Gagal menyimpan wallpaper ke MySQL:", dbErr);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('active_wallpaper_url', finalUrl);
      localStorage.setItem('active_wallpaper_type', fileType);
    } catch { /* ignore quota */ }
  }

  return wallpaperData;
}

export async function clearWallpaper(): Promise<void> {
  try {
    await deleteMysqlSetting('wallpaper');
  } catch (e) {
    console.warn("Gagal menghapus wallpaper dari MySQL:", e);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('active_wallpaper_url');
    localStorage.removeItem('active_wallpaper_type');
  }
}
