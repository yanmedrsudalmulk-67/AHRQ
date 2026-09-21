<?php
/**
 * ==============================================================================
 * API SURVEI AHRQ SOPS 2.0 (ahrq_surveys & survey_submissions)
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
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // Ambil rincian submissions per responden
    if ($action === 'submissions') {
        $rsId = isset($_GET['rs_id']) ? $_GET['rs_id'] : '';
        $hospitalId = isset($_GET['hospital_id']) ? $_GET['hospital_id'] : '';

        $sql = "SELECT * FROM survey_submissions WHERE 1=1";
        $params = [];

        if (!empty($rsId)) {
            $sql .= " AND (rs_id = ? OR hospital_id = ?)";
            $params[] = $rsId;
            $params[] = $rsId;
        } elseif (!empty($hospitalId)) {
            $sql .= " AND hospital_id = ?";
            $params[] = $hospitalId;
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Decode JSON fields
        foreach ($rows as &$row) {
            foreach (['bagian_a', 'bagian_b', 'bagian_c', 'bagian_d', 'bagian_f', 'bagian_g'] as $col) {
                if (isset($row[$col]) && is_string($row[$col])) {
                    $row[$col] = json_decode($row[$col], true) ?: $row[$col];
                }
            }
        }

        sendResponse(['success' => true, 'data' => $rows]);
    }

    // Ambil konfigurasi link kuesioner publik
    if ($action === 'link_config' || isset($_GET['link_token'])) {
        $token = isset($_GET['link_token']) ? $_GET['link_token'] : (isset($_GET['token']) ? $_GET['token'] : '');
        $identifier = isset($_GET['identifier']) ? $_GET['identifier'] : '';

        if (!empty($token)) {
            $stmt = $pdo->prepare("SELECT * FROM ahrq_surveys WHERE id = ? LIMIT 1");
            $stmt->execute(['LINK_CONFIG_' . $token]);
            $row = $stmt->fetch();
            if ($row) {
                if (is_string($row['dimensi_scores'])) {
                    $row['dimensi_scores'] = json_decode($row['dimensi_scores'], true) ?: [];
                }
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendResponse(['success' => false, 'error' => 'Tautan survei tidak ditemukan'], 404);
            }
        } elseif (!empty($identifier)) {
            $stmt = $pdo->prepare("SELECT * FROM ahrq_surveys WHERE nama_rs = '_LINK_CONFIG_' AND unit_kerja = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$identifier]);
            $row = $stmt->fetch();
            if ($row) {
                if (is_string($row['dimensi_scores'])) {
                    $row['dimensi_scores'] = json_decode($row['dimensi_scores'], true) ?: [];
                }
                sendResponse(['success' => true, 'data' => $row]);
            } else {
                sendResponse(['success' => true, 'data' => null]);
            }
        }
    }

    // Ambil data satu survei berdasarkan ID
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM ahrq_surveys WHERE id = ? LIMIT 1");
        $stmt->execute([$_GET['id']]);
        $row = $stmt->fetch();
        if ($row) {
            if (is_string($row['dimensi_scores'])) {
                $row['dimensi_scores'] = json_decode($row['dimensi_scores'], true) ?: [];
            }
            sendResponse(['success' => true, 'data' => $row]);
        } else {
            sendResponse(['success' => false, 'error' => 'Data tidak ditemukan'], 404);
        }
    }

    // Query daftar survei umum (Kecualikan baris konfigurasi khusus yang diawali MASTER_ atau LINK_CONFIG_ atau PENGESAHAN_)
    $sql = "SELECT * FROM ahrq_surveys WHERE nama_rs NOT LIKE '_MASTER_%' AND nama_rs NOT LIKE '_LINK_CONFIG_%' AND id NOT LIKE 'MASTER_%' AND id NOT LIKE 'PENGESAHAN_%' AND id NOT LIKE 'PWDRESET_%'";
    $params = [];

    if (!empty($_GET['hospital_id'])) {
        $sql .= " AND (hospital_id = ? OR user_id = ? OR unit_kerja = ?)";
        $params[] = $_GET['hospital_id'];
        $params[] = $_GET['hospital_id'];
        $params[] = $_GET['hospital_id'];
    }

    if (!empty($_GET['nama_rs'])) {
        $sql .= " AND nama_rs = ?";
        $params[] = $_GET['nama_rs'];
    }

    if (!empty($_GET['unit_kerja'])) {
        $sql .= " AND unit_kerja = ?";
        $params[] = $_GET['unit_kerja'];
    }

    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        if (is_string($row['dimensi_scores'])) {
            $row['dimensi_scores'] = json_decode($row['dimensi_scores'], true) ?: [];
        }
    }

    sendResponse(['success' => true, 'data' => $rows]);
}

function handlePost($pdo) {
    $input = getJsonInput();
    $action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');

    // Simpan submission detail instrumen per responden
    if ($action === 'save_submission') {
        $submission = isset($input['submission']) ? $input['submission'] : $input;
        $id = !empty($submission['id']) ? $submission['id'] : 'sub-' . uniqid() . '-' . mt_rand(100, 999);
        
        $stmt = $pdo->prepare("
            INSERT INTO survey_submissions (
                id, rs_id, nama_rs, posisi_staf, unit_kerja,
                bagian_a, bagian_b, bagian_c, bagian_d, bagian_e, bagian_f, bagian_g, bagian_h,
                skor_a, skor_b, skor_c, skor_d, skor_f, skor_keseluruhan,
                hospital_id, user_id, created_by, hospital_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                posisi_staf = VALUES(posisi_staf),
                unit_kerja = VALUES(unit_kerja),
                skor_keseluruhan = VALUES(skor_keseluruhan)
        ");

        $stmt->execute([
            $id,
            $submission['rs_id'] ?? ($submission['rsId'] ?? ''),
            $submission['nama_rs'] ?? ($submission['namaRs'] ?? ''),
            $submission['posisi_staf'] ?? ($submission['posisiStaf'] ?? ''),
            $submission['unit_kerja'] ?? ($submission['unitKerja'] ?? ''),
            is_array($submission['bagian_a'] ?? null) ? json_encode($submission['bagian_a']) : ($submission['bagian_a'] ?? null),
            is_array($submission['bagian_b'] ?? null) ? json_encode($submission['bagian_b']) : ($submission['bagian_b'] ?? null),
            is_array($submission['bagian_c'] ?? null) ? json_encode($submission['bagian_c']) : ($submission['bagian_c'] ?? null),
            is_array($submission['bagian_d'] ?? null) ? json_encode($submission['bagian_d']) : ($submission['bagian_d'] ?? null),
            $submission['bagian_e'] ?? null,
            is_array($submission['bagian_f'] ?? null) ? json_encode($submission['bagian_f']) : ($submission['bagian_f'] ?? null),
            is_array($submission['bagian_g'] ?? null) ? json_encode($submission['bagian_g']) : ($submission['bagian_g'] ?? null),
            $submission['bagian_h'] ?? null,
            $submission['skor_a'] ?? 0,
            $submission['skor_b'] ?? 0,
            $submission['skor_c'] ?? 0,
            $submission['skor_d'] ?? 0,
            $submission['skor_f'] ?? 0,
            $submission['skor_keseluruhan'] ?? 0,
            $submission['hospital_id'] ?? null,
            $submission['user_id'] ?? null,
            $submission['created_by'] ?? null,
            $submission['hospital_name'] ?? null
        ]);

        sendResponse(['success' => true, 'id' => $id]);
    }

    // Batch insert / sync survei
    if ($action === 'batch' || (isset($input['surveys']) && is_array($input['surveys']))) {
        $surveys = isset($input['surveys']) ? $input['surveys'] : [];
        if (empty($surveys)) {
            sendResponse(['success' => true, 'count' => 0]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO ahrq_surveys (
                id, nama_rs, unit_kerja, jumlah_responden, tanggal_input, dimensi_scores,
                hospital_id, user_id, created_by, hospital_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                nama_rs = VALUES(nama_rs),
                unit_kerja = VALUES(unit_kerja),
                jumlah_responden = VALUES(jumlah_responden),
                tanggal_input = VALUES(tanggal_input),
                dimensi_scores = VALUES(dimensi_scores),
                hospital_id = VALUES(hospital_id),
                user_id = VALUES(user_id),
                created_by = VALUES(created_by),
                hospital_name = VALUES(hospital_name),
                updated_at = NOW()
        ");

        $pdo->beginTransaction();
        try {
            foreach ($surveys as $s) {
                $id = $s['id'] ?? ('survey-' . uniqid() . '-' . mt_rand(1000, 9999));
                $namaRs = $s['nama_rs'] ?? ($s['namaRs'] ?? '');
                $unitKerja = $s['unit_kerja'] ?? ($s['unitKerja'] ?? '');
                $jumlahResponden = intval($s['jumlah_responden'] ?? ($s['jumlahResponden'] ?? 1));
                $tanggalInput = $s['tanggal_input'] ?? ($s['tanggalInput'] ?? date('Y-m-d'));
                $scores = $s['dimensi_scores'] ?? ($s['dimensiScores'] ?? []);
                $dimensiJson = is_array($scores) ? json_encode($scores) : $scores;

                $stmt->execute([
                    $id,
                    $namaRs,
                    $unitKerja,
                    $jumlahResponden,
                    $tanggalInput,
                    $dimensiJson,
                    $s['hospital_id'] ?? ($scores['hospital_id'] ?? null),
                    $s['user_id'] ?? ($scores['user_id'] ?? null),
                    $s['created_by'] ?? ($scores['created_by'] ?? null),
                    $s['hospital_name'] ?? ($scores['hospital_name'] ?? null)
                ]);
            }
            $pdo->commit();
            sendResponse(['success' => true, 'count' => count($surveys)]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // Simpan satu survei
    $id = $input['id'] ?? ('survey-' . uniqid() . '-' . mt_rand(1000, 9999));
    $namaRs = $input['nama_rs'] ?? ($input['namaRs'] ?? '');
    $unitKerja = $input['unit_kerja'] ?? ($input['unitKerja'] ?? '');
    $jumlahResponden = intval($input['jumlah_responden'] ?? ($input['jumlahResponden'] ?? 1));
    $tanggalInput = $input['tanggal_input'] ?? ($input['tanggalInput'] ?? date('Y-m-d'));
    $scores = $input['dimensi_scores'] ?? ($input['dimensiScores'] ?? []);
    $dimensiJson = is_array($scores) ? json_encode($scores) : $scores;

    $stmt = $pdo->prepare("
        INSERT INTO ahrq_surveys (
            id, nama_rs, unit_kerja, jumlah_responden, tanggal_input, dimensi_scores,
            hospital_id, user_id, created_by, hospital_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            nama_rs = VALUES(nama_rs),
            unit_kerja = VALUES(unit_kerja),
            jumlah_responden = VALUES(jumlah_responden),
            tanggal_input = VALUES(tanggal_input),
            dimensi_scores = VALUES(dimensi_scores),
            hospital_id = VALUES(hospital_id),
            user_id = VALUES(user_id),
            created_by = VALUES(created_by),
            hospital_name = VALUES(hospital_name),
            updated_at = NOW()
    ");

    $stmt->execute([
        $id,
        $namaRs,
        $unitKerja,
        $jumlahResponden,
        $tanggalInput,
        $dimensiJson,
        $input['hospital_id'] ?? (is_array($scores) ? ($scores['hospital_id'] ?? null) : null),
        $input['user_id'] ?? (is_array($scores) ? ($scores['user_id'] ?? null) : null),
        $input['created_by'] ?? (is_array($scores) ? ($scores['created_by'] ?? null) : null),
        $input['hospital_name'] ?? (is_array($scores) ? ($scores['hospital_name'] ?? null) : null)
    ]);

    // Jika ini adalah pengisian via tautan survei, tambahkan respondentCount pada LINK_CONFIG jika ada
    if (isset($_GET['token']) || isset($input['link_token'])) {
        $linkToken = $_GET['token'] ?? $input['link_token'];
        try {
            $checkStmt = $pdo->prepare("SELECT dimensi_scores FROM ahrq_surveys WHERE id = ?");
            $checkStmt->execute(['LINK_CONFIG_' . $linkToken]);
            $cfg = $checkStmt->fetch();
            if ($cfg && !empty($cfg['dimensi_scores'])) {
                $cScores = json_decode($cfg['dimensi_scores'], true) ?: [];
                $cScores['respondentCount'] = ($cScores['respondentCount'] ?? 0) + 1;
                $upStmt = $pdo->prepare("UPDATE ahrq_surveys SET dimensi_scores = ? WHERE id = ?");
                $upStmt->execute([json_encode($cScores), 'LINK_CONFIG_' . $linkToken]);
            }
        } catch (Exception $e) { /* ignore */ }
    }

    sendResponse(['success' => true, 'id' => $id, 'message' => 'Survei berhasil disimpan']);
}

function handlePut($pdo) {
    $input = getJsonInput();
    $action = isset($_GET['action']) ? $_GET['action'] : ($input['action'] ?? '');

    // Rename unit kerja
    if ($action === 'rename_unit') {
        $oldName = $input['oldUnitName'] ?? ($input['old_unit'] ?? '');
        $newName = $input['newUnitName'] ?? ($input['new_unit'] ?? '');
        $hospitalId = $input['hospitalId'] ?? ($input['hospital_id'] ?? '');

        if (empty($oldName) || empty($newName)) {
            sendResponse(['error' => 'Nama unit lama dan baru wajib diisi'], 400);
        }

        $sql = "UPDATE ahrq_surveys SET unit_kerja = ?, updated_at = NOW() WHERE unit_kerja = ?";
        $params = [$newName, $oldName];

        if (!empty($hospitalId)) {
            $sql .= " AND (hospital_id = ? OR user_id = ?)";
            $params[] = $hospitalId;
            $params[] = $hospitalId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(['success' => true, 'updated' => $stmt->rowCount(), 'message' => 'Unit berhasil diperbarui']);
    }

    // Default: update by id
    $id = $input['id'] ?? ($_GET['id'] ?? '');
    if (empty($id)) {
        sendResponse(['error' => 'Parameter id wajib diisi'], 400);
    }

    $fields = [];
    $params = [];

    foreach (['nama_rs', 'unit_kerja', 'jumlah_responden', 'tanggal_input'] as $f) {
        if (isset($input[$f])) {
            $fields[] = "$f = ?";
            $params[] = $input[$f];
        }
    }

    if (isset($input['dimensi_scores'])) {
        $fields[] = "dimensi_scores = ?";
        $params[] = is_array($input['dimensi_scores']) ? json_encode($input['dimensi_scores']) : $input['dimensi_scores'];
    }

    if (empty($fields)) {
        sendResponse(['error' => 'Tidak ada kolom yang diupdate'], 400);
    }

    $fields[] = "updated_at = NOW()";
    $params[] = $id;

    $sql = "UPDATE ahrq_surveys SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(['success' => true, 'message' => 'Data berhasil diupdate']);
}

function handleDelete($pdo) {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? '');
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    // Hapus seluruh data per unit kerja
    if ($action === 'delete_by_unit') {
        $unit = $_GET['unit_kerja'] ?? ($input['unit_kerja'] ?? '');
        $hospitalId = $_GET['hospital_id'] ?? ($input['hospital_id'] ?? '');
        if (empty($unit)) {
            sendResponse(['error' => 'unit_kerja wajib diisi'], 400);
        }

        $sql = "DELETE FROM ahrq_surveys WHERE unit_kerja = ?";
        $params = [$unit];
        if (!empty($hospitalId)) {
            $sql .= " AND (hospital_id = ? OR user_id = ?)";
            $params[] = $hospitalId;
            $params[] = $hospitalId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
    }

    // Hapus seluruh data satu rumah sakit
    if ($action === 'delete_by_hospital') {
        $rsName = $_GET['nama_rs'] ?? ($input['nama_rs'] ?? '');
        $hospitalId = $_GET['hospital_id'] ?? ($input['hospital_id'] ?? '');
        if (empty($rsName) && empty($hospitalId)) {
            sendResponse(['error' => 'nama_rs atau hospital_id wajib diisi'], 400);
        }

        $sql = "DELETE FROM ahrq_surveys WHERE 1=1";
        $params = [];
        if (!empty($hospitalId)) {
            $sql .= " AND (hospital_id = ? OR user_id = ?)";
            $params[] = $hospitalId;
            $params[] = $hospitalId;
        }
        if (!empty($rsName)) {
            $sql .= " AND nama_rs = ?";
            $params[] = $rsName;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
    }

    // Hapus single survey by ID
    if (empty($id)) {
        sendResponse(['error' => 'Parameter id wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM ahrq_surveys WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
}
