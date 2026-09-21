<?php
/**
 * ==============================================================================
 * API AKUN RUMAH SAKIT (hospital_accounts)
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
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        sendResponse(['error' => 'Metode HTTP tidak didukung'], 405);
}

function handleGet($pdo) {
    // Ambil akun tunggal by id atau username
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM hospital_accounts WHERE id = ? LIMIT 1");
        $stmt->execute([$_GET['id']]);
        $row = $stmt->fetch();
        if ($row) {
            sendResponse(['success' => true, 'data' => formatAccountRow($row)]);
        } else {
            sendResponse(['success' => false, 'error' => 'Akun tidak ditemukan'], 404);
        }
    }

    if (isset($_GET['username'])) {
        $stmt = $pdo->prepare("SELECT * FROM hospital_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1");
        $stmt->execute([trim($_GET['username'])]);
        $row = $stmt->fetch();
        if ($row) {
            sendResponse(['success' => true, 'data' => formatAccountRow($row)]);
        } else {
            sendResponse(['success' => false, 'error' => 'Akun tidak ditemukan'], 404);
        }
    }

    // Ambil daftar seluruh akun
    $sql = "SELECT * FROM hospital_accounts WHERE 1=1";
    $params = [];

    if (!empty($_GET['status'])) {
        $sql .= " AND status = ?";
        $params[] = $_GET['status'];
    }

    $sql .= " ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $result = array_map('formatAccountRow', $rows);
    sendResponse(['success' => true, 'data' => $result]);
}

function handlePost($pdo) {
    $input = getJsonInput();
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    // Verifikasi Login
    if ($action === 'login') {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            sendResponse(['success' => false, 'error' => 'Username dan password wajib diisi'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM hospital_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1");
        $stmt->execute([$username]);
        $account = $stmt->fetch();

        if (!$account) {
            sendResponse(['success' => false, 'error' => 'Username tidak ditemukan'], 401);
        }

        // Verifikasi password (dukung password_hash / bcrypt dan plaintext jika ada legacy)
        $valid = password_verify($password, $account['password']);
        if (!$valid && $password === $account['password']) {
            $valid = true;
            // Upgrade ke bcrypt hash
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $pdo->prepare("UPDATE hospital_accounts SET password = ? WHERE id = ?");
            $upStmt->execute([$newHash, $account['id']]);
        }

        if (!$valid) {
            sendResponse(['success' => false, 'error' => 'Password yang Anda masukkan salah'], 401);
        }

        // Update last login
        $upStmt = $pdo->prepare("UPDATE hospital_accounts SET last_login = NOW() WHERE id = ?");
        $upStmt->execute([$account['id']]);

        sendResponse([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => formatAccountRow($account)
        ]);
    }

    // Pendaftaran Akun Rumah Sakit Baru
    $username = trim($input['username'] ?? '');
    $namaRs = trim($input['namaRs'] ?? ($input['nama_rs'] ?? ''));
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($namaRs) || empty($password)) {
        sendResponse(['success' => false, 'error' => 'Username, Nama Rumah Sakit, dan Password wajib diisi'], 400);
    }

    // Cek duplikasi username
    $stmt = $pdo->prepare("SELECT id FROM hospital_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'error' => "Username '{$username}' sudah digunakan oleh fasyankes lain. Silakan pilih username lain."], 409);
    }

    $id = !empty($input['id']) ? $input['id'] : 'hosp-' . uniqid() . '-' . mt_rand(100, 999);
    
    // Hash password jika belum di-hash
    $passwordHash = str_starts_with($password, '$2y$') || str_starts_with($password, '$2a$') || str_starts_with($password, '$2b$')
        ? $password
        : password_hash($password, PASSWORD_BCRYPT);

    $sql = "INSERT INTO hospital_accounts (
        id, username, kode_rs, nama_rs, alamat_rs, password,
        provinsi, kota_kab, penanggung_jawab, jabatan, no_whatsapp, email_rs,
        status, account_status, kode_pos, no_telepon, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', ?, ?, NOW(), NOW())";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id,
        $username,
        $input['kodeRs'] ?? ($input['kode_rs'] ?? null),
        $namaRs,
        $input['alamatRs'] ?? ($input['alamat_rs'] ?? null),
        $passwordHash,
        $input['provinsi'] ?? null,
        $input['kotaKab'] ?? ($input['kota_kab'] ?? null),
        $input['penanggungJawab'] ?? ($input['penanggung_jawab'] ?? null),
        $input['jabatan'] ?? null,
        $input['noWhatsapp'] ?? ($input['no_whatsapp'] ?? null),
        $input['emailRs'] ?? ($input['email_rs'] ?? null),
        $input['kodePos'] ?? ($input['kode_pos'] ?? null),
        $input['noTelepon'] ?? ($input['no_telepon'] ?? null)
    ]);

    // Catat log pendaftaran
    try {
        $logStmt = $pdo->prepare("INSERT INTO account_audit_logs (id, hospital_id, hospital_name, action, action_label, performed_by, reason, timestamp) VALUES (?, ?, ?, 'created', 'Pendaftaran Baru', ?, 'Akun baru didaftarkan secara mandiri', NOW())");
        $logStmt->execute(['acclog-' . uniqid(), $id, $namaRs, $username]);
    } catch (Exception $e) { /* ignore */ }

    sendResponse([
        'success' => true,
        'message' => 'Pendaftaran akun berhasil, silakan tunggu verifikasi admin.',
        'data' => ['id' => $id, 'username' => $username, 'namaRs' => $namaRs, 'status' => 'Pending']
    ], 201);
}

function handlePut($pdo) {
    $input = getJsonInput();
    $id = $input['id'] ?? ($_GET['id'] ?? '');

    if (empty($id)) {
        sendResponse(['error' => 'Parameter id akun wajib diisi'], 400);
    }

    $action = $_GET['action'] ?? ($input['action'] ?? '');

    // Update Status Akun (Persetujuan / Penolakan / Arsip)
    if ($action === 'status' || isset($input['status'])) {
        $status = $input['status'] ?? 'Pending';
        $approvedBy = $input['approvedBy'] ?? ($input['approved_by'] ?? 'Admin');
        $rejectionReason = $input['rejectionReason'] ?? ($input['rejection_reason'] ?? null);

        $stmt = $pdo->prepare("
            UPDATE hospital_accounts SET
                status = ?,
                account_status = ?,
                approved_by = ?,
                rejection_reason = ?,
                approval_date = IF(? = 'Active', NOW(), approval_date),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$status, $status, $approvedBy, $rejectionReason, $status, $id]);

        // Audit log
        try {
            $hStmt = $pdo->prepare("SELECT nama_rs FROM hospital_accounts WHERE id = ?");
            $hStmt->execute([$id]);
            $hRow = $hStmt->fetch();
            $hName = $hRow['nama_rs'] ?? 'Rumah Sakit';

            $actionMap = [
                'Active' => ['approved', 'Akun Disetujui'],
                'Rejected' => ['rejected', 'Akun Ditolak'],
                'Disabled' => ['disabled', 'Akun Dinonaktifkan'],
                'Archived' => ['archived', 'Akun Diarsipkan']
            ];
            $actInfo = $actionMap[$status] ?? ['updated', 'Status Diperbarui'];

            $logStmt = $pdo->prepare("INSERT INTO account_audit_logs (id, hospital_id, hospital_name, action, action_label, performed_by, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $logStmt->execute(['acclog-' . uniqid(), $id, $hName, $actInfo[0], $actInfo[1], $approvedBy, $rejectionReason ?: "Status diubah menjadi {$status}"]);
        } catch (Exception $e) { /* ignore */ }

        sendResponse(['success' => true, 'message' => "Status akun berhasil diperbarui menjadi {$status}"]);
    }

    // Update Profil Umum & Pengesahan
    $fields = [];
    $params = [];

    $map = [
        'namaRs' => 'nama_rs',
        'nama_rs' => 'nama_rs',
        'kodeRs' => 'kode_rs',
        'kode_rs' => 'kode_rs',
        'alamatRs' => 'alamat_rs',
        'alamat_rs' => 'alamat_rs',
        'provinsi' => 'provinsi',
        'kotaKab' => 'kota_kab',
        'kota_kab' => 'kota_kab',
        'penanggungJawab' => 'penanggung_jawab',
        'penanggung_jawab' => 'penanggung_jawab',
        'jabatan' => 'jabatan',
        'noWhatsapp' => 'no_whatsapp',
        'no_whatsapp' => 'no_whatsapp',
        'emailRs' => 'email_rs',
        'email_rs' => 'email_rs',
        'kodePos' => 'kode_pos',
        'kode_pos' => 'kode_pos',
        'noTelepon' => 'no_telepon',
        'no_telepon' => 'no_telepon'
    ];

    foreach ($map as $inKey => $col) {
        if (isset($input[$inKey])) {
            $fields[$col] = "$col = ?";
            $params[$col] = $input[$inKey];
        }
    }

    // Password update
    if (!empty($input['password'])) {
        $rawPwd = $input['password'];
        $hash = str_starts_with($rawPwd, '$2y$') || str_starts_with($rawPwd, '$2a$') || str_starts_with($rawPwd, '$2b$')
            ? $rawPwd
            : password_hash($rawPwd, PASSWORD_BCRYPT);
        $fields['password'] = "password = ?";
        $params['password'] = $hash;
    }

    // Pengesahan config
    if (isset($input['pengesahan_config']) || isset($input['pengesahanConfig'])) {
        $pConfig = $input['pengesahan_config'] ?? $input['pengesahanConfig'];
        $fields['pengesahan_config'] = "pengesahan_config = ?";
        $params['pengesahan_config'] = is_array($pConfig) ? json_encode($pConfig) : $pConfig;
    }

    if (empty($fields)) {
        sendResponse(['error' => 'Tidak ada kolom yang diubah'], 400);
    }

    $setClause = implode(', ', array_values($fields)) . ", updated_at = NOW()";
    $finalParams = array_values($params);
    $finalParams[] = $id;

    $sql = "UPDATE hospital_accounts SET $setClause WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($finalParams);

    sendResponse(['success' => true, 'message' => 'Profil akun berhasil diperbarui']);
}

function handleDelete($pdo) {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? '');

    if (empty($id)) {
        sendResponse(['error' => 'Parameter id akun wajib diisi'], 400);
    }

    // Dapatkan nama RS untuk menghapus data terkait
    $stmt = $pdo->prepare("SELECT nama_rs FROM hospital_accounts WHERE id = ?");
    $stmt->execute([$id]);
    $acc = $stmt->fetch();
    $rsName = $acc['nama_rs'] ?? '';

    $pdo->beginTransaction();
    try {
        // 1. Hapus akun
        $delAcc = $pdo->prepare("DELETE FROM hospital_accounts WHERE id = ?");
        $delAcc->execute([$id]);

        // 2. Hapus survei terkait
        if (!empty($rsName)) {
            $delSurveys = $pdo->prepare("DELETE FROM ahrq_surveys WHERE hospital_id = ? OR user_id = ? OR nama_rs = ?");
            $delSurveys->execute([$id, $id, $rsName]);

            $delSubs = $pdo->prepare("DELETE FROM survey_submissions WHERE rs_id = ? OR hospital_id = ? OR nama_rs = ?");
            $delSubs->execute([$id, $id, $rsName]);

            $delBm = $pdo->prepare("DELETE FROM benchmark_requests WHERE requester_id = ? OR target_id = ? OR requester_name = ? OR target_name = ?");
            $delBm->execute([$id, $id, $rsName, $rsName]);
        }

        $pdo->commit();
        sendResponse(['success' => true, 'message' => 'Akun dan seluruh data terkait berhasil dihapus secara permanen']);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

/**
 * Format baris tabel database ke struktur objek HospitalAccount TypeScript
 */
function formatAccountRow($row) {
    return [
        'id' => $row['id'],
        'username' => $row['username'],
        'kodeRs' => $row['kode_rs'] ?? '',
        'namaRs' => $row['nama_rs'],
        'alamatRs' => $row['alamat_rs'] ?? '',
        'password' => $row['password'],
        'provinsi' => $row['provinsi'] ?? '',
        'kotaKab' => $row['kota_kab'] ?? '',
        'penanggungJawab' => $row['penanggung_jawab'] ?? '',
        'jabatan' => $row['jabatan'] ?? '',
        'noWhatsapp' => $row['no_whatsapp'] ?? '',
        'emailRs' => $row['email_rs'] ?? '',
        'status' => $row['status'],
        'accountStatus' => $row['account_status'] ?? $row['status'],
        'lastLogin' => $row['last_login'],
        'approvalDate' => $row['approval_date'],
        'approvedBy' => $row['approved_by'],
        'rejectionReason' => $row['rejection_reason'],
        'kodePos' => $row['kode_pos'] ?? '',
        'noTelepon' => $row['no_telepon'] ?? '',
        'pengesahan_config' => !empty($row['pengesahan_config']) ? (is_string($row['pengesahan_config']) ? json_decode($row['pengesahan_config'], true) : $row['pengesahan_config']) : null,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']
    ];
}
