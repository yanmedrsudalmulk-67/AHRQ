<?php
/**
 * ==============================================================================
 * API UPLOAD MEDIA (Wallpaper, Logo, Header Banner) - HOSTINGER
 * ==============================================================================
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(['error' => 'Metode HTTP harus POST'], 405);
}

$targetType = $_POST['type'] ?? ($_GET['type'] ?? 'general'); // wallpaper, logo, banner
$uploadDir = __DIR__ . '/uploads/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $targetType) . '/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// 1. Cek unggahan berkas multipart/form-data
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowedMimes)) {
        sendResponse(['success' => false, 'error' => 'Tipe berkas tidak diizinkan. Hanya JPG, PNG, WEBP, GIF, SVG yang didukung.'], 400);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = uniqid('media_' . $targetType . '_') . '.' . strtolower($ext);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Tentukan URL publik
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
        $publicUrl = rtrim($protocol . $host . $scriptDir, '/') . '/uploads/' . $targetType . '/' . $fileName;

        // Simpan juga ke app_settings jika diminta
        if (!empty($_POST['save_to_settings']) && !empty($_POST['setting_key'])) {
            $key = $_POST['setting_key'];
            $payload = json_encode([
                'url' => $publicUrl,
                'fileName' => $file['name'],
                'updatedAt' => date('c')
            ]);
            $sStmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()");
            $sStmt->execute([$key, $payload]);
        }

        sendResponse([
            'success' => true,
            'url' => $publicUrl,
            'fileName' => $file['name'],
            'message' => 'Berkas berhasil diunggah'
        ]);
    } else {
        sendResponse(['success' => false, 'error' => 'Gagal memindahkan berkas yang diunggah'], 500);
    }
}

// 2. Cek unggahan Base64 JSON
$input = getJsonInput();
if (!empty($input['base64'])) {
    $base64 = $input['base64'];
    $ext = 'png';
    if (preg_match('/^data:image\/(\w+);base64,/', $base64, $typeMatch)) {
        $ext = strtolower($typeMatch[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        $base64 = substr($base64, strpos($base64, ',') + 1);
    }
    $decoded = base64_decode($base64);
    if ($decoded === false) {
        sendResponse(['success' => false, 'error' => 'Data Base64 tidak valid'], 400);
    }

    $fileName = uniqid('media_' . $targetType . '_') . '.' . $ext;
    $targetPath = $uploadDir . $fileName;

    if (file_put_contents($targetPath, $decoded)) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
        $publicUrl = rtrim($protocol . $host . $scriptDir, '/') . '/uploads/' . $targetType . '/' . $fileName;

        sendResponse([
            'success' => true,
            'url' => $publicUrl,
            'fileName' => $fileName,
            'message' => 'Berkas Base64 berhasil disimpan'
        ]);
    } else {
        sendResponse(['success' => false, 'error' => 'Gagal menyimpan berkas di server'], 500);
    }
}

sendResponse(['success' => false, 'error' => 'Tidak ada berkas yang diunggah'], 400);
