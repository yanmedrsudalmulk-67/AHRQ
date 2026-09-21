import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'account';
  const hospitalId = searchParams.get('hospital_id');

  if (!pool) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    if (type === 'benchmark') {
      let q = "SELECT * FROM benchmark_audit_logs WHERE 1=1";
      const p: any[] = [];
      if (hospitalId && hospitalId !== 'admin') {
        q += " AND (requester_id = ? OR target_id = ? OR LOWER(requester_name) = LOWER(?) OR LOWER(target_name) = LOWER(?))";
        p.push(hospitalId, hospitalId, hospitalId, hospitalId);
      }
      q += " ORDER BY timestamp DESC LIMIT 200";
      const [rows]: any = await pool.query(q, p);
      return NextResponse.json({ success: true, data: rows });
    }

    let q = "SELECT * FROM account_audit_logs WHERE 1=1";
    const p: any[] = [];
    if (hospitalId && hospitalId !== 'admin') {
      q += " AND hospital_id = ?";
      p.push(hospitalId);
    }
    q += " ORDER BY timestamp DESC LIMIT 200";
    const [rows]: any = await pool.query(q, p);
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();
  const type = req.nextUrl.searchParams.get('type') || body.type || 'account';

  if (!pool) {
    return NextResponse.json({ success: true, id: 'local-log' });
  }

  try {
    if (type === 'benchmark') {
      const id = body.id || `bmlog-${Date.now()}`;
      await pool.query(
        `INSERT INTO benchmark_audit_logs (id, requester_id, requester_name, target_id, target_name, action, action_label, performed_by, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id, body.requester_id || body.requesterId || '', body.requester_name || body.requesterName || '',
          body.target_id || body.targetId || '', body.target_name || body.targetName || '',
          body.action || 'info', body.action_label || body.actionLabel || 'Aktivitas',
          body.performed_by || body.performedBy || 'Sistem', body.notes || null
        ]
      );
      return NextResponse.json({ success: true, id });
    }

    const id = body.id || `acclog-${Date.now()}`;
    await pool.query(
      `INSERT INTO account_audit_logs (id, hospital_id, hospital_name, action, action_label, performed_by, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, body.hospital_id || body.hospitalId || '', body.hospital_name || body.hospitalName || '',
        body.action || 'info', body.action_label || body.actionLabel || 'Aktivitas',
        body.performed_by || body.performedBy || 'Sistem', body.reason || null
      ]
    );
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
