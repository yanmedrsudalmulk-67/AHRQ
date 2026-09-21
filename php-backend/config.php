<?php
/**
 * ==============================================================================
 * KONFIGURASI DATABASE & API BACKEND PHP - HOSTINGER
 * Sistem Survei Budaya Keselamatan Pasien AHRQ SOPS® 2.0
 * ==============================================================================
 */

// Aktifkan pelaporan error untuk debugging (Ubah ke 0 di mode produksi jika diperlukan)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set header CORS agar dapat diakses dari domain frontend manapun
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Tangani Preflight OPTIONS Request dari browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ------------------------------------------------------------------------------
// PARAMETER KONEKSI DATABASE MYSQL HOSTINGER
// Sesuaikan informasi di bawah ini dengan database yang Anda buat di Hostinger
// ------------------------------------------------------------------------------
define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'u123456789_ahrq_sops'); // Ganti dengan nama database Hostinger Anda
define('DB_USER', getenv('MYSQL_USER') ?: 'u123456789_admin');        // Ganti dengan username database Hostinger Anda
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: 'PasswordDatabaseAnda123!'); // Ganti dengan password database Anda

/**
 * Mendapatkan instance koneksi PDO MySQL
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Koneksi database MySQL gagal: ' . $e->getMessage(),
                'hint' => 'Periksa pengaturan DB_HOST, DB_NAME, DB_USER, dan DB_PASS di file config.php'
            ]);
            exit();
        }
    }
    return $pdo;
}

/**
 * Helper untuk membaca body JSON dari request POST / PUT
 * @return array
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Helper untuk mengirim response JSON
 * @param mixed $data
 * @param int $statusCode
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Helper untuk log email ke tabel email_notifications
 */
function logEmailNotification($pdo, $toEmail, $subject, $body, $type = 'general') {
    try {
        $stmt = $pdo->prepare("INSERT INTO email_notifications (id, to_email, subject, body, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            'email-' . uniqid() . '-' . mt_rand(1000, 9999),
            $toEmail,
            $subject,
            $body,
            $type
        ]);
    } catch (Exception $e) {
        // Silent log error
    }
}
