<?php
/**
 * ==============================================================================
 * API AUTENTIKASI & RESET PASSWORD (hospital_accounts)
 * ==============================================================================
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(['error' => 'Metode HTTP harus POST'], 405);
}

$input = getJsonInput();
$action = $input['action'] ?? ($_GET['action'] ?? 'login');

switch ($action) {
    case 'login':
        handleLogin($pdo, $input);
        break;
    case 'request_otp':
        handleRequestOtp($pdo, $input);
        break;
    case 'verify_and_reset':
        handleVerifyAndReset($pdo, $input);
        break;
    default:
        sendResponse(['error' => "Action '{$action}' tidak valid"], 400);
}

function handleLogin($pdo, $input) {
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendResponse(['success' => false, 'error' => 'Username dan password wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM hospital_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1");
    $stmt->execute([$username]);
    $acc = $stmt->fetch();

    if (!$acc) {
        sendResponse(['success' => false, 'error' => 'Akun tidak ditemukan'], 401);
    }

    $valid = password_verify($password, $acc['password']);
    if (!$valid && $password === $acc['password']) {
        $valid = true;
        // Upgrade password hash
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $up = $pdo->prepare("UPDATE hospital_accounts SET password = ? WHERE id = ?");
        $up->execute([$hash, $acc['id']]);
    }

    if (!$valid) {
        sendResponse(['success' => false, 'error' => 'Password salah'], 401);
    }

    $up = $pdo->prepare("UPDATE hospital_accounts SET last_login = NOW() WHERE id = ?");
    $up->execute([$acc['id']]);

    sendResponse([
        'success' => true,
        'message' => 'Login berhasil',
        'account' => [
            'id' => $acc['id'],
            'username' => $acc['username'],
            'namaRs' => $acc['nama_rs'],
            'status' => $acc['status']
        ]
    ]);
}

function handleRequestOtp($pdo, $input) {
    $identifier = trim($input['identifier'] ?? '');
    if (empty($identifier)) {
        sendResponse(['success' => false, 'error' => 'Username atau Email wajib diisi'], 400);
    }

    // Cari akun
    $stmt = $pdo->prepare("
        SELECT * FROM hospital_accounts 
        WHERE LOWER(username) = LOWER(?) 
           OR LOWER(email_rs) = LOWER(?) 
           OR LOWER(kode_rs) = LOWER(?)
           OR LOWER(nama_rs) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$identifier, $identifier, $identifier, $identifier]);
    $account = $stmt->fetch();

    if (!$account) {
        sendResponse(['success' => false, 'error' => 'Akun dengan username atau email tersebut tidak ditemukan'], 404);
    }

    $email = trim($account['email_rs'] ?? '');
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['success' => false, 'error' => 'Akun belum memiliki alamat email yang valid. Hubungi administrator.'], 400);
    }

    // Buat kode OTP 6 digit
    $token = (string)mt_rand(100000, 999999);
    $expiresAt = time() + (15 * 60); // 15 menit

    $tokenPayload = json_encode([
        'token' => $token,
        'expiresAt' => $expiresAt * 1000,
        'accountId' => $account['id'],
        'username' => $account['username'],
        'email' => $email,
        'createdAt' => date('c')
    ]);

    // Simpan ke app_settings
    $upStmt = $pdo->prepare("
        INSERT INTO app_settings (setting_key, setting_value, updated_at) 
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
    ");
    $upStmt->execute(['PWDRESET_' . $account['id'], $tokenPayload]);

    // Kirim email notifikasi / log
    $subject = "[KODE OTP] Reset Password - " . $account['nama_rs'];
    $body = "Halo {$account['nama_rs']},\n\nPermintaan reset password telah diterima untuk username: {$account['username']}.\nKode Verifikasi (OTP) Anda: {$token}\n\nKode ini berlaku selama 15 menit. Jika tidak meminta, abaikan email ini.";
    
    // Simpan log ke tabel email_notifications
    logEmailNotification($pdo, $email, $subject, $body, 'password_reset');

    // Coba kirim via PHP mail() standar server jika diaktifkan
    @mail($email, $subject, $body, "From: no-reply@" . ($_SERVER['HTTP_HOST'] ?? 'localhost'));

    // Masked email hint
    $parts = explode('@', $email);
    $name = $parts[0];
    $domain = $parts[1] ?? '';
    $visibleCount = min(3, max(1, (int)(strlen($name) / 2)));
    $maskedEmail = substr($name, 0, $visibleCount) . '***@' . $domain;

    sendResponse([
        'success' => true,
        'message' => "Kode verifikasi OTP 6 digit telah diproses untuk alamat email terdaftar ({$maskedEmail}). Periksa Kotak Masuk atau folder Spam.",
        'emailHint' => $maskedEmail
    ]);
}

function handleVerifyAndReset($pdo, $input) {
    $identifier = trim($input['identifier'] ?? '');
    $token = trim($input['token'] ?? '');
    $newPassword = trim($input['newPassword'] ?? ($input['password'] ?? ''));

    if (empty($identifier) || empty($token) || empty($newPassword)) {
        sendResponse(['success' => false, 'error' => 'Semua kolom (identitas akun, kode OTP, password baru) wajib diisi'], 400);
    }

    if (strlen($newPassword) < 8) {
        sendResponse(['success' => false, 'error' => 'Password baru minimal 8 karakter'], 400);
    }

    $stmt = $pdo->prepare("
        SELECT * FROM hospital_accounts 
        WHERE LOWER(username) = LOWER(?) 
           OR LOWER(email_rs) = LOWER(?) 
           OR LOWER(kode_rs) = LOWER(?)
           OR LOWER(nama_rs) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$identifier, $identifier, $identifier, $identifier]);
    $account = $stmt->fetch();

    if (!$account) {
        sendResponse(['success' => false, 'error' => 'Akun tidak ditemukan'], 404);
    }

    // Ambil token dari app_settings
    $keyStmt = $pdo->prepare("SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1");
    $keyStmt->execute(['PWDRESET_' . $account['id']]);
    $settingRow = $keyStmt->fetch();

    if (!$settingRow || empty($settingRow['setting_value'])) {
        sendResponse(['success' => false, 'error' => 'Kode OTP belum pernah diminta atau sudah digunakan'], 400);
    }

    $tokenData = json_decode($settingRow['setting_value'], true);
    if (!isset($tokenData['token']) || (string)$tokenData['token'] !== $token) {
        sendResponse(['success' => false, 'error' => 'Kode verifikasi OTP salah. Periksa kembali email Anda.'], 400);
    }

    $expiresAtMs = $tokenData['expiresAt'] ?? 0;
    if ((time() * 1000) > $expiresAtMs) {
        sendResponse(['success' => false, 'error' => 'Kode verifikasi OTP sudah kedaluwarsa (lebih dari 15 menit). Minta kode baru.'], 400);
    }

    // Update password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upStmt = $pdo->prepare("UPDATE hospital_accounts SET password = ?, updated_at = NOW() WHERE id = ?");
    $upStmt->execute([$hash, $account['id']]);

    // Hapus token
    $delStmt = $pdo->prepare("DELETE FROM app_settings WHERE setting_key = ?");
    $delStmt->execute(['PWDRESET_' . $account['id']]);

    // Log audit
    try {
        $logStmt = $pdo->prepare("INSERT INTO account_audit_logs (id, hospital_id, hospital_name, action, action_label, performed_by, reason, timestamp) VALUES (?, ?, ?, 'password_reset', 'Reset Password Berhasil', ?, 'Password direset menggunakan kode OTP email', NOW())");
        $logStmt->execute(['acclog-' . uniqid(), $account['id'], $account['nama_rs'], $account['username']]);
    } catch (Exception $e) { /* ignore */ }

    sendResponse([
        'success' => true,
        'message' => 'Password berhasil diperbarui. Silakan masuk menggunakan password baru.'
    ]);
}
