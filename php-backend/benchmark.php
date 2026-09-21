<?php
/**
 * ==============================================================================
 * API BENCHMARK AHRQ SOPS 2.0 (benchmark_requests & master settings)
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
    $action = $_GET['action'] ?? '';

    // Ambil Nilai Master Benchmark Standar Nasional
    if ($action === 'master') {
        $stmt = $pdo->prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'MASTER_BENCHMARK' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && !empty($row['setting_value'])) {
            $data = json_decode($row['setting_value'], true);
            sendResponse(['success' => true, 'data' => $data]);
        }
        sendResponse(['success' => true, 'data' => null]);
    }

    // Ambil Nilai Master Benchmark Interaksi
    if ($action === 'interaksi') {
        $stmt = $pdo->prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'MASTER_BENCHMARK_INTERAKSI' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && !empty($row['setting_value'])) {
            $data = json_decode($row['setting_value'], true);
            $benchmarks = isset($data['benchmarks']) ? $data['benchmarks'] : $data;
            sendResponse(['success' => true, 'data' => $benchmarks]);
        }
        sendResponse(['success' => true, 'data' => []]);
    }

    // Ambil Daftar Pengajuan Benchmark Antar-Rumah Sakit
    $hospitalId = $_GET['hospital_id'] ?? ($_GET['hospitalId'] ?? '');
    
    // Privacy mandate: Admin atau unauthenticated tidak boleh melihat data antar-RS
    if (empty($hospitalId) || $hospitalId === 'admin') {
        sendResponse(['success' => true, 'data' => []]);
    }

    $stmt = $pdo->prepare("
        SELECT * FROM benchmark_requests 
        WHERE requester_id = ? 
           OR target_id = ? 
           OR LOWER(requester_name) = LOWER(?) 
           OR LOWER(target_name) = LOWER(?)
        ORDER BY created_at DESC
    ");
    $stmt->execute([$hospitalId, $hospitalId, $hospitalId, $hospitalId]);
    $rows = $stmt->fetchAll();

    sendResponse(['success' => true, 'data' => $rows]);
}

function handlePost($pdo) {
    $input = getJsonInput();
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    // Simpan Master Benchmark
    if ($action === 'master') {
        $benchmarks = $input['benchmarks'] ?? ($input['dimensi_scores'] ?? $input);
        $json = json_encode($benchmarks);

        $stmt = $pdo->prepare("
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('MASTER_BENCHMARK', ?, NOW())
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");
        $stmt->execute([$json]);

        sendResponse(['success' => true, 'message' => 'Master benchmark berhasil disimpan']);
    }

    // Simpan Master Benchmark Interaksi
    if ($action === 'interaksi') {
        $benchmarks = $input['benchmarks'] ?? $input;
        $json = json_encode(['benchmarks' => $benchmarks]);

        $stmt = $pdo->prepare("
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('MASTER_BENCHMARK_INTERAKSI', ?, NOW())
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");
        $stmt->execute([$json]);

        sendResponse(['success' => true, 'message' => 'Master benchmark interaksi berhasil disimpan']);
    }

    // Buat Permintaan Benchmark Baru
    $id = !empty($input['id']) ? $input['id'] : 'bm-req-' . uniqid() . '-' . mt_rand(100, 999);
    $requesterId = $input['requester_id'] ?? ($input['requesterId'] ?? '');
    $requesterName = $input['requester_name'] ?? ($input['requesterName'] ?? '');
    $requesterEmail = $input['requester_email'] ?? ($input['requesterEmail'] ?? null);
    $targetId = $input['target_id'] ?? ($input['targetId'] ?? '');
    $targetName = $input['target_name'] ?? ($input['targetName'] ?? '');
    $targetEmail = $input['target_email'] ?? ($input['targetEmail'] ?? null);
    $requestedYear = $input['requested_year'] ?? ($input['requestedYear'] ?? date('Y'));
    $notes = $input['notes'] ?? null;
    $dataType = $input['data_type'] ?? ($input['dataType'] ?? 'Kuesioner Budaya Keselamatan Pasien AHRQ SOPS® v2.0 (10 Dimensi)');
    $expiresAt = $input['expires_at'] ?? ($input['expiresAt'] ?? '1 Tahun (365 Hari)');

    $stmt = $pdo->prepare("
        INSERT INTO benchmark_requests (
            id, requester_id, requester_name, requester_email,
            target_id, target_name, target_email, status,
            requested_year, notes, data_type, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $id, $requesterId, $requesterName, $requesterEmail,
        $targetId, $targetName, $targetEmail,
        $requestedYear, $notes, $dataType, $expiresAt
    ]);

    // Tambah Audit Log
    try {
        $logStmt = $pdo->prepare("INSERT INTO benchmark_audit_logs (id, requester_id, requester_name, target_id, target_name, action, action_label, performed_by, notes, timestamp) VALUES (?, ?, ?, ?, ?, 'created', 'Permintaan Benchmark dibuat', ?, ?, NOW())");
        $logStmt->execute(['bmlog-' . uniqid(), $requesterId, $requesterName, $targetId, $targetName, $requesterName, $notes ?: 'Permintaan akses benchmark data baru dikirim']);
    } catch (Exception $e) { /* ignore */ }

    // Log Notifikasi Email
    if (!empty($targetEmail)) {
        logEmailNotification(
            $pdo,
            $targetEmail,
            "Permintaan Benchmark Data dari Rumah Sakit {$requesterName}",
            "Rumah Sakit {$requesterName} telah mengirimkan permintaan benchmark data untuk tahun {$requestedYear}.",
            'benchmark_request'
        );
    }

    sendResponse([
        'success' => true,
        'message' => 'Permintaan benchmark berhasil dikirim',
        'data' => [
            'id' => $id,
            'requester_id' => $requesterId,
            'target_id' => $targetId,
            'status' => 'pending'
        ]
    ], 201);
}

function handlePut($pdo) {
    $input = getJsonInput();
    $id = $input['id'] ?? ($_GET['id'] ?? '');
    $status = $input['status'] ?? '';
    $decidedBy = $input['decided_by'] ?? ($input['decidedBy'] ?? 'RS Target');
    $notes = $input['notes'] ?? null;

    if (empty($id) || empty($status)) {
        sendResponse(['error' => 'id dan status (approved / rejected / revoked) wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("
        UPDATE benchmark_requests SET
            status = ?,
            notes = COALESCE(?, notes),
            decided_at = NOW(),
            decided_by = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$status, $notes, $decidedBy, $id]);

    // Ambil info request untuk audit log
    $rStmt = $pdo->prepare("SELECT * FROM benchmark_requests WHERE id = ?");
    $rStmt->execute([$id]);
    $req = $rStmt->fetch();

    if ($req) {
        $actionMap = [
            'approved' => 'Benchmark disetujui',
            'rejected' => 'Benchmark ditolak',
            'revoked'  => 'Benchmark dicabut'
        ];
        $label = $actionMap[$status] ?? "Status diubah menjadi {$status}";

        try {
            $logStmt = $pdo->prepare("INSERT INTO benchmark_audit_logs (id, requester_id, requester_name, target_id, target_name, action, action_label, performed_by, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            $logStmt->execute(['bmlog-' . uniqid(), $req['requester_id'], $req['requester_name'], $req['target_id'], $req['target_name'], $status, $label, $decidedBy, $notes ?: "Keputusan status benchmark: {$status}"]);
        } catch (Exception $e) { /* ignore */ }

        if (!empty($req['requester_email'])) {
            logEmailNotification(
                $pdo,
                $req['requester_email'],
                "Keputusan Permintaan Benchmark Data dari {$req['target_name']}",
                "Permintaan benchmark data Anda kepada Rumah Sakit {$req['target_name']} telah status: {$status} oleh {$decidedBy}.",
                'benchmark_decision'
            );
        }
    }

    sendResponse(['success' => true, 'message' => "Status benchmark berhasil diubah menjadi {$status}"]);
}

function handleDelete($pdo) {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        sendResponse(['error' => 'Parameter id wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM benchmark_requests WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
}
