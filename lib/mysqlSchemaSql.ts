/**
 * MySQL Database Schema SQL untuk Hostinger cPanel / hPanel phpMyAdmin
 * Digunakan untuk export / preview langsung di tab Pengaturan
 */
export const MYSQL_SCHEMA_SQL = `-- ==============================================================================
-- DATABASE SCHEMA UNTUK SISTEM SURVEI BUDAYA KESELAMATAN PASIEN AHRQ SOPS® 2.0
-- Target Engine: MySQL / MariaDB (Hostinger cPanel / hPanel phpMyAdmin)
-- Karakter Set : utf8mb4 / utf8mb4_unicode_ci
-- ==============================================================================
-- PANDUAN IMPORT KE PHPMYADMIN HOSTINGER:
-- 1. Masuk ke Dashboard / hPanel Hostinger Anda.
-- 2. Buka menu "Databases" -> "MySQL Databases", buat Database & User baru.
-- 3. Klik tombol "Enter phpMyAdmin" pada database yang baru dibuat.
-- 4. Pilih nama database Anda di sisi kiri.
-- 5. Klik tab menu "Import" di bagian atas (atau tab "SQL").
-- 6. Tempelkan script ini dan klik tombol "Go" / "Kirim".
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- ------------------------------------------------------------------------------
-- 1. TABEL: hospital_accounts
-- Menyimpan akun pendaftaran Rumah Sakit / Fasyankes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`hospital_accounts\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(100) NOT NULL,
  \`kode_rs\` VARCHAR(50) DEFAULT NULL,
  \`nama_rs\` VARCHAR(255) NOT NULL,
  \`alamat_rs\` TEXT DEFAULT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`provinsi\` VARCHAR(100) DEFAULT NULL,
  \`kota_kab\` VARCHAR(100) DEFAULT NULL,
  \`penanggung_jawab\` VARCHAR(150) DEFAULT NULL,
  \`jabatan\` VARCHAR(100) DEFAULT NULL,
  \`no_whatsapp\` VARCHAR(50) DEFAULT NULL,
  \`email_rs\` VARCHAR(150) DEFAULT NULL,
  \`status\` ENUM('Pending', 'Active', 'Rejected', 'Disabled', 'Archived') NOT NULL DEFAULT 'Pending',
  \`account_status\` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  \`last_login\` DATETIME DEFAULT NULL,
  \`approval_date\` DATETIME DEFAULT NULL,
  \`approved_by\` VARCHAR(100) DEFAULT NULL,
  \`rejection_reason\` TEXT DEFAULT NULL,
  \`kode_pos\` VARCHAR(20) DEFAULT NULL,
  \`no_telepon\` VARCHAR(50) DEFAULT NULL,
  \`pengesahan_config\` LONGTEXT DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_acc_username\` (\`username\`),
  KEY \`idx_acc_status\` (\`status\`),
  KEY \`idx_acc_nama_rs\` (\`nama_rs\`),
  KEY \`idx_acc_email\` (\`email_rs\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABEL: ahrq_surveys
-- Menyimpan data survei AHRQ SOPS 2.0 (per unit / per responden / master config)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`ahrq_surveys\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`nama_rs\` VARCHAR(255) NOT NULL,
  \`unit_kerja\` VARCHAR(255) NOT NULL,
  \`jumlah_responden\` INT NOT NULL DEFAULT 1,
  \`tanggal_input\` VARCHAR(50) NOT NULL,
  \`dimensi_scores\` LONGTEXT NOT NULL,
  \`hospital_id\` VARCHAR(64) DEFAULT NULL,
  \`user_id\` VARCHAR(100) DEFAULT NULL,
  \`created_by\` VARCHAR(100) DEFAULT NULL,
  \`hospital_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_surveys_rs\` (\`nama_rs\`),
  KEY \`idx_surveys_unit\` (\`unit_kerja\`),
  KEY \`idx_surveys_hospital_id\` (\`hospital_id\`),
  KEY \`idx_surveys_created_at\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABEL: survey_submissions
-- Menyimpan rincian jawaban instrumen survei per responden
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`survey_submissions\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`rs_id\` VARCHAR(100) NOT NULL,
  \`nama_rs\` VARCHAR(255) NOT NULL,
  \`posisi_staf\` VARCHAR(150) DEFAULT NULL,
  \`unit_kerja\` VARCHAR(255) DEFAULT NULL,
  \`bagian_a\` LONGTEXT DEFAULT NULL,
  \`bagian_b\` LONGTEXT DEFAULT NULL,
  \`bagian_c\` LONGTEXT DEFAULT NULL,
  \`bagian_d\` LONGTEXT DEFAULT NULL,
  \`bagian_e\` VARCHAR(20) DEFAULT NULL,
  \`bagian_f\` LONGTEXT DEFAULT NULL,
  \`bagian_g\` LONGTEXT DEFAULT NULL,
  \`bagian_h\` TEXT DEFAULT NULL,
  \`skor_a\` DECIMAL(5,2) DEFAULT 0.00,
  \`skor_b\` DECIMAL(5,2) DEFAULT 0.00,
  \`skor_c\` DECIMAL(5,2) DEFAULT 0.00,
  \`skor_d\` DECIMAL(5,2) DEFAULT 0.00,
  \`skor_f\` DECIMAL(5,2) DEFAULT 0.00,
  \`skor_keseluruhan\` DECIMAL(5,2) DEFAULT 0.00,
  \`hospital_id\` VARCHAR(64) DEFAULT NULL,
  \`user_id\` VARCHAR(100) DEFAULT NULL,
  \`created_by\` VARCHAR(100) DEFAULT NULL,
  \`hospital_name\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_sub_rs_id\` (\`rs_id\`),
  KEY \`idx_sub_hospital_id\` (\`hospital_id\`),
  KEY \`idx_sub_created_at\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABEL: benchmark_requests
-- Menyimpan pengajuan permintaan benchmark antar-fasyankes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`benchmark_requests\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`requester_id\` VARCHAR(64) NOT NULL,
  \`requester_name\` VARCHAR(255) NOT NULL,
  \`requester_email\` VARCHAR(150) DEFAULT NULL,
  \`target_id\` VARCHAR(64) NOT NULL,
  \`target_name\` VARCHAR(255) NOT NULL,
  \`target_email\` VARCHAR(150) DEFAULT NULL,
  \`status\` ENUM('pending', 'approved', 'rejected', 'revoked') NOT NULL DEFAULT 'pending',
  \`requested_year\` VARCHAR(20) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`data_type\` VARCHAR(255) DEFAULT 'Kuesioner Budaya Keselamatan Pasien AHRQ SOPS® v2.0 (10 Dimensi)',
  \`expires_at\` VARCHAR(100) DEFAULT '1 Tahun (365 Hari)',
  \`decided_at\` DATETIME DEFAULT NULL,
  \`decided_by\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_bm_requester\` (\`requester_id\`),
  KEY \`idx_bm_target\` (\`target_id\`),
  KEY \`idx_bm_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABEL: benchmark_audit_logs
-- Rekam jejak aktivitas persetujuan dan permintaan benchmark
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`benchmark_audit_logs\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`requester_id\` VARCHAR(64) NOT NULL,
  \`requester_name\` VARCHAR(255) NOT NULL,
  \`target_id\` VARCHAR(64) NOT NULL,
  \`target_name\` VARCHAR(255) NOT NULL,
  \`action\` VARCHAR(50) NOT NULL,
  \`action_label\` VARCHAR(100) NOT NULL,
  \`performed_by\` VARCHAR(100) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_bmlog_req\` (\`requester_id\`),
  KEY \`idx_bmlog_tgt\` (\`target_id\`),
  KEY \`idx_bmlog_time\` (\`timestamp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABEL: account_audit_logs
-- Rekam jejak perubahan status akun fasyankes (Approval, Reject, Reset Password)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`account_audit_logs\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`hospital_id\` VARCHAR(64) NOT NULL,
  \`hospital_name\` VARCHAR(255) NOT NULL,
  \`action\` VARCHAR(50) NOT NULL,
  \`action_label\` VARCHAR(100) NOT NULL,
  \`performed_by\` VARCHAR(100) NOT NULL,
  \`reason\` TEXT DEFAULT NULL,
  \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_acclog_rs\` (\`hospital_id\`),
  KEY \`idx_acclog_time\` (\`timestamp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABEL: email_notifications
-- Log pengiriman email notifikasi sistem dan kode OTP
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`email_notifications\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`to_email\` VARCHAR(150) NOT NULL,
  \`subject\` VARCHAR(255) NOT NULL,
  \`body\` LONGTEXT NOT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_email_to\` (\`to_email\`),
  KEY \`idx_email_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABEL: app_settings
-- Konfigurasi aplikasi: wallpaper, logo, banner, master data posisi & unit
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`app_settings\` (
  \`setting_key\` VARCHAR(100) NOT NULL,
  \`setting_value\` LONGTEXT NOT NULL,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL
-- ------------------------------------------------------------------------------
INSERT INTO \`app_settings\` (\`setting_key\`, \`setting_value\`, \`updated_at\`) VALUES
('MASTER_BENCHMARK', '{"dimensi_1":{"min":60,"max":80},"dimensi_2":{"min":65,"max":85},"dimensi_3":{"min":55,"max":75},"dimensi_4":{"min":60,"max":82},"dimensi_5":{"min":58,"max":78},"dimensi_6":{"min":62,"max":84},"dimensi_7":{"min":50,"max":70},"dimensi_8":{"min":60,"max":80},"dimensi_9":{"min":55,"max":75},"dimensi_10":{"min":65,"max":85}}', NOW())
ON DUPLICATE KEY UPDATE \`updated_at\` = NOW();

SET FOREIGN_KEY_CHECKS = 1;
`;
