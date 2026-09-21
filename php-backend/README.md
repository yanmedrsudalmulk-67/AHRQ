# Panduan Migrasi Backend dari Supabase ke Database MySQL Hostinger

Dokumen ini memandu Anda memindahkan backend aplikasi **Sistem Survei Budaya Keselamatan Pasien AHRQ SOPS® 2.0** dari Supabase ke **Hosting Hostinger (cPanel / hPanel)** menggunakan database MySQL dan API PHP.

---

## Langkah 1: Buat Database MySQL di Hostinger

1. Masuk ke **hPanel Hostinger** (atau cPanel).
2. Di menu navigasi, cari dan pilih **Databases** -> **MySQL Databases**.
3. Buat database baru:
   - **MySQL Database Name**: contoh `u123456789_ahrq_sops`
   - **MySQL Username**: contoh `u123456789_admin`
   - **Password**: Buat password yang kuat dan catat.
4. Klik **Create** (Buat).

---

## Langkah 2: Import `schema.sql` ke phpMyAdmin

1. Pada daftar database di hPanel Hostinger, klik tombol **Enter phpMyAdmin** di sebelah database yang baru dibuat.
2. Di phpMyAdmin, pastikan nama database Anda terpilih di panel sebelah kiri.
3. Klik tab **Import** pada menu horizontal bagian atas.
4. Pada bagian *File to import*, klik tombol **Choose File** / **Browse...** lalu pilih file `schema.sql` dari folder proyek aplikasi ini.
5. Biarkan pengaturan format tetap **SQL**.
6. Gulir ke bawah dan klik tombol **Go** (atau **Kirim**).
7. Tunggu beberapa detik hingga muncul pesan sukses berwarna hijau: *"Import has been successfully finished"*.
8. Anda akan melihat 8 tabel baru:
   - `hospital_accounts` (Akun Rumah Sakit)
   - `ahrq_surveys` (Survei dan Rekap)
   - `survey_submissions` (Jawaban Kuesioner per Responden)
   - `benchmark_requests` (Pengajuan Benchmark Antar-RS)
   - `benchmark_audit_logs` (Audit Log Benchmark)
   - `account_audit_logs` (Audit Log Akun)
   - `email_notifications` (Riwayat Notifikasi Email / OTP)
   - `app_settings` (Konfigurasi Tema, Logo, Wallpaper, Master Nilai)

---

## Langkah 3: Unggah File PHP ke Hostinger

1. Buka **File Manager** di hPanel Hostinger (atau gunakan FTP seperti FileZilla).
2. Masuk ke folder `public_html/`.
3. Buat folder baru bernama `api` (sehingga path-nya menjadi `public_html/api/`).
4. Unggah seluruh file dari folder `php-backend/` aplikasi ini ke dalam folder `public_html/api/`:
   - `config.php`
   - `surveys.php`
   - `accounts.php`
   - `benchmark.php`
   - `settings.php`
   - `audit_logs.php`
   - `auth.php`
   - `upload.php`
   - `test_connection.php`
   - `.htaccess`
5. Edit file `config.php` di File Manager Hostinger dan isi kredensial database Anda:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_PORT', '3306');
   define('DB_NAME', 'u123456789_ahrq_sops'); // Nama database Anda di Hostinger
   define('DB_USER', 'u123456789_admin');     // Username database Anda di Hostinger
   define('DB_PASS', 'PasswordDatabaseAnda'); // Password database Anda
   ```

---

## Langkah 4: Uji Koneksi API

Buka browser Anda dan akses URL:
```
https://namadomainanda.com/api/test_connection.php
```
Jika berhasil, akan muncul response JSON:
```json
{
  "success": true,
  "status": "connected",
  "all_tables_ready": true,
  "message": "Koneksi database MySQL Hostinger berhasil dan seluruh tabel telah siap digunakan!"
}
```

---

## Langkah 5: Hubungkan Aplikasi Frontend

Di file `.env` atau pada konfigurasi Environment Variable aplikasi Anda:
```env
NEXT_PUBLIC_API_URL="https://namadomainanda.com/api"
```
Atau Anda juga dapat mengaturnya langsung dari menu **Pengaturan** -> **Integrasi Database MySQL Hostinger** di dalam aplikasi!

Semua query Supabase kini telah digantikan dengan API PHP MySQL Hostinger yang aman, cepat, dan mandiri!
