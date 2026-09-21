<?php
/**
 * ==============================================================================
 * TEST KONEKSI DATABASE MYSQL HOSTINGER & STATUS TABEL
 * ==============================================================================
 */
require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    
    // Cek versi MySQL
    $vStmt = $pdo->query("SELECT VERSION() as version");
    $version = $vStmt->fetch()['version'] ?? 'Unknown';

    // Cek tabel yang ada
    $tablesStmt = $pdo->query("SHOW TABLES");
    $existingTables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    $requiredTables = [
        'hospital_accounts',
        'ahrq_surveys',
        'survey_submissions',
        'benchmark_requests',
        'benchmark_audit_logs',
        'account_audit_logs',
        'email_notifications',
        'app_settings'
    ];

    $missingTables = array_diff($requiredTables, $existingTables);
    $tableCounts = [];

    foreach ($requiredTables as $tbl) {
        if (in_array($tbl, $existingTables)) {
            $cntStmt = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`");
            $tableCounts[$tbl] = (int)$cntStmt->fetchColumn();
        } else {
            $tableCounts[$tbl] = 'Belum dibuat';
        }
    }

    sendResponse([
        'success' => true,
        'status' => 'connected',
        'database_version' => $version,
        'database_name' => DB_NAME,
        'database_host' => DB_HOST,
        'all_tables_ready' => empty($missingTables),
        'missing_tables' => array_values($missingTables),
        'table_row_counts' => $tableCounts,
        'message' => empty($missingTables) 
            ? 'Koneksi database MySQL Hostinger berhasil dan seluruh tabel telah siap digunakan!' 
            : 'Koneksi berhasil, namun beberapa tabel belum dibuat. Silakan import schema.sql ke phpMyAdmin.'
    ]);
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'status' => 'error',
        'error' => $e->getMessage(),
        'message' => 'Gagal terhubung ke MySQL Hostinger. Pastikan DB_HOST, DB_NAME, DB_USER, dan DB_PASS di config.php sudah benar.'
    ], 500);
}
