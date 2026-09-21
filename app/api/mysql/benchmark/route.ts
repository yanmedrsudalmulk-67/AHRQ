import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');
  const hospitalId = searchParams.get('hospital_id');

  if (!pool) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    if (action === 'master') {
      const [rows]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'MASTER_BENCHMARK' LIMIT 1");
      if (rows.length > 0) {
        return NextResponse.json({ success: true, data: JSON.parse(rows[0].setting_value) });
      }
      return NextResponse.json({ success: true, data: null });
    }

    if (action === 'interaksi') {
      const [rows]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'MASTER_BENCHMARK_INTERAKSI' LIMIT 1");
      if (rows.length > 0) {
        const val = JSON.parse(rows[0].setting_value);
        return NextResponse.json({ success: true, data: val.benchmarks || val });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    if (!hospitalId || hospitalId === 'admin') {
      return NextResponse.json({ success: true, data: [] });
    }

    const [rows]: any = await pool.query(
      `SELECT * FROM benchmark_requests 
       WHERE requester_id = ? OR target_id = ? OR LOWER(requester_name) = LOWER(?) OR LOWER(target_name) = LOWER(?)
       ORDER BY created_at DESC`,
      [hospitalId, hospitalId, hospitalId, hospitalId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();
  const action = req.nextUrl.searchParams.get('action');

  if (!pool) {
    return NextResponse.json({ success: true, message: 'Tersimpan lokal' });
  }

  try {
    if (action === 'master') {
      const json = JSON.stringify(body.benchmarks || body);
      await pool.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES ('MASTER_BENCHMARK', ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [json]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'interaksi') {
      const json = JSON.stringify({ benchmarks: body.benchmarks || body });
      await pool.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES ('MASTER_BENCHMARK_INTERAKSI', ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [json]
      );
      return NextResponse.json({ success: true });
    }

    const id = body.id || `bm-req-${Date.now()}`;
    await pool.query(
      `INSERT INTO benchmark_requests (
        id, requester_id, requester_name, requester_email,
        target_id, target_name, target_email, status,
        requested_year, notes, data_type, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW(), NOW())`,
      [
        id, body.requester_id || body.requesterId, body.requester_name || body.requesterName, body.requester_email || null,
        body.target_id || body.targetId, body.target_name || body.targetName, body.target_email || null,
        body.requested_year || new Date().getFullYear().toString(), body.notes || null,
        body.data_type || 'Kuesioner Budaya Keselamatan Pasien AHRQ SOPS® v2.0 (10 Dimensi)',
        body.expires_at || '1 Tahun (365 Hari)'
      ]
    );

    return NextResponse.json({ success: true, data: { id, status: 'pending' } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();
  const id = body.id || req.nextUrl.searchParams.get('id');

  if (!pool) {
    return NextResponse.json({ success: true });
  }

  try {
    await pool.query(
      `UPDATE benchmark_requests SET status = ?, notes = COALESCE(?, notes), decided_at = NOW(), decided_by = ?, updated_at = NOW() WHERE id = ?`,
      [body.status, body.notes || null, body.decidedBy || body.decided_by || 'RS Target', id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pool = getMysqlNodePool();
  const id = req.nextUrl.searchParams.get('id');

  if (!pool) {
    return NextResponse.json({ success: true });
  }

  try {
    await pool.query("DELETE FROM benchmark_requests WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
