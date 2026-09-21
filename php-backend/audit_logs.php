<?php
/**
 * ==============================================================================
 * API AUDIT LOGS (account_audit_logs & benchmark_audit_logs)
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
    default:
        sendResponse(['error' => 'Metode HTTP tidak didukung'], 405);
}

function handleGet($pdo) {
    $type = $_GET['type'] ?? 'account';
    $hospitalId = $_GET['hospital_id'] ?? ($_GET['hospitalId'] ?? '');

    if ($type === 'benchmark') {
        $sql = "SELECT * FROM benchmark_audit_logs WHERE 1=1";
        $params = [];
        if (!empty($hospitalId) && $hospitalId !== 'admin') {
            $sql .= " AND (requester_id = ? OR target_id = ? OR LOWER(requester_name) = LOWER(?) OR LOWER(target_name) = LOWER(?))";
            $params = [$hospitalId, $hospitalId, $hospitalId, $hospitalId];
        }
        $sql .= " ORDER BY timestamp DESC LIMIT 200";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        sendResponse(['success' => true, 'data' => $rows]);
    }

    // Default: account audit logs
    $sql = "SELECT * FROM account_audit_logs WHERE 1=1";
    $params = [];
    if (!empty($hospitalId) && $hospitalId !== 'admin') {
        $sql .= " AND hospital_id = ?";
        $params[] = $hospitalId;
    }
    $sql .= " ORDER BY timestamp DESC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    sendResponse(['success' => true, 'data' => $rows]);
}

function handlePost($pdo) {
    $input = getJsonInput();
    $type = $_GET['type'] ?? ($input['type'] ?? 'account');

    if ($type === 'benchmark') {
        $id = $input['id'] ?? ('bmlog-' . uniqid());
        $stmt = $pdo->prepare("
            INSERT INTO benchmark_audit_logs (
                id, requester_id, requester_name, target_id, target_name,
                action, action_label, performed_by, notes, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $id,
            $input['requester_id'] ?? ($input['requesterId'] ?? ''),
            $input['requester_name'] ?? ($input['requesterName'] ?? ''),
            $input['target_id'] ?? ($input['targetId'] ?? ''),
            $input['target_name'] ?? ($input['targetName'] ?? ''),
            $input['action'] ?? 'info',
            $input['action_label'] ?? ($input['actionLabel'] ?? 'Aktivitas'),
            $input['performed_by'] ?? ($input['performedBy'] ?? 'Sistem'),
            $input['notes'] ?? null
        ]);
        sendResponse(['success' => true, 'id' => $id]);
    }

    // Account audit log
    $id = $input['id'] ?? ('acclog-' . uniqid());
    $stmt = $pdo->prepare("
        INSERT INTO account_audit_logs (
            id, hospital_id, hospital_name, action, action_label,
            performed_by, reason, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        $input['hospital_id'] ?? ($input['hospitalId'] ?? ''),
        $input['hospital_name'] ?? ($input['hospitalName'] ?? ''),
        $input['action'] ?? 'info',
        $input['action_label'] ?? ($input['actionLabel'] ?? 'Aktivitas'),
        $input['performed_by'] ?? ($input['performedBy'] ?? 'Sistem'),
        $input['reason'] ?? null
    ]);
    sendResponse(['success' => true, 'id' => $id]);
}
