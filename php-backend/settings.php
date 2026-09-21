<?php
/**
 * ==============================================================================
 * API PENGATURAN & KONFIGURASI APLIKASI (app_settings)
 * Wallpaper, Logo, Header Banner, Master Posisi, Master Unit, Pengesahan
 * ==============================================================================
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        sendResponse(['error' => 'Metode HTTP tidak didukung'], 405);
}

function handleGet($pdo) {
    $key = $_GET['key'] ?? '';
    if (empty($key)) {
        // Ambil seluruh setting
        $stmt = $pdo->query("SELECT setting_key, setting_value, updated_at FROM app_settings");
        $rows = $stmt->fetchAll();
        $map = [];
        foreach ($rows as $r) {
            $val = json_decode($r['setting_value'], true);
            $map[$r['setting_key']] = ($val !== null) ? $val : $r['setting_value'];
        }
        sendResponse(['success' => true, 'data' => $map]);
    }

    $stmt = $pdo->prepare("SELECT setting_key, setting_value, updated_at FROM app_settings WHERE setting_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();

    if ($row) {
        $val = json_decode($row['setting_value'], true);
        sendResponse([
            'success' => true,
            'data' => ($val !== null) ? $val : $row['setting_value'],
            'updated_at' => $row['updated_at']
        ]);
    } else {
        sendResponse(['success' => true, 'data' => null]);
    }
}

function handlePost($pdo) {
    $input = getJsonInput();
    $key = $input['key'] ?? ($_GET['key'] ?? '');
    $value = $input['value'] ?? (isset($input['data']) ? $input['data'] : null);

    if (empty($key)) {
        sendResponse(['error' => 'Parameter key wajib diisi'], 400);
    }

    $strValue = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string)$value;

    $stmt = $pdo->prepare("
        INSERT INTO app_settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_at = NOW()
    ");
    $stmt->execute([$key, $strValue]);

    sendResponse(['success' => true, 'message' => 'Pengaturan berhasil disimpan']);
}

function handleDelete($pdo) {
    $key = $_GET['key'] ?? '';
    if (empty($key)) {
        sendResponse(['error' => 'Parameter key wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM app_settings WHERE setting_key = ?");
    $stmt->execute([$key]);

    sendResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
}
