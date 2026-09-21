import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  const key = req.nextUrl.searchParams.get('key');

  if (!pool) {
    return NextResponse.json({ success: true, data: null });
  }

  try {
    if (key) {
      const [rows]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1", [key]);
      if (rows.length > 0) {
        let val = rows[0].setting_value;
        try { val = JSON.parse(val); } catch {}
        return NextResponse.json({ success: true, data: val });
      }
      return NextResponse.json({ success: true, data: null });
    }

    const [rows]: any = await pool.query("SELECT setting_key, setting_value FROM app_settings");
    const map: Record<string, any> = {};
    for (const r of rows) {
      try { map[r.setting_key] = JSON.parse(r.setting_value); } catch { map[r.setting_key] = r.setting_value; }
    }
    return NextResponse.json({ success: true, data: map });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();
  const key = body.key || req.nextUrl.searchParams.get('key');
  const value = body.value !== undefined ? body.value : body.data;

  if (!pool) {
    return NextResponse.json({ success: true });
  }

  if (!key) {
    return NextResponse.json({ success: false, error: 'key wajib diisi' }, { status: 400 });
  }

  try {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    await pool.query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [key, valStr]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pool = getMysqlNodePool();
  const key = req.nextUrl.searchParams.get('key');

  if (!pool) {
    return NextResponse.json({ success: true });
  }

  try {
    await pool.query("DELETE FROM app_settings WHERE setting_key = ?", [key]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
