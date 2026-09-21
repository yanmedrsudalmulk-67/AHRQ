import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatAccountRow(row: any) {
  return {
    id: row.id,
    username: row.username,
    kodeRs: row.kode_rs || '',
    namaRs: row.nama_rs,
    alamatRs: row.alamat_rs || '',
    password: row.password,
    provinsi: row.provinsi || '',
    kotaKab: row.kota_kab || '',
    penanggungJawab: row.penanggung_jawab || '',
    jabatan: row.jabatan || '',
    noWhatsapp: row.no_whatsapp || '',
    emailRs: row.email_rs || '',
    status: row.status,
    accountStatus: row.account_status || row.status,
    lastLogin: row.last_login,
    approvalDate: row.approval_date,
    approvedBy: row.approved_by,
    rejectionReason: row.rejection_reason,
    kodePos: row.kode_pos || '',
    noTelepon: row.no_telepon || '',
    pengesahan_config: row.pengesahan_config ? (typeof row.pengesahan_config === 'string' ? JSON.parse(row.pengesahan_config) : row.pengesahan_config) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  const searchParams = req.nextUrl.searchParams;
  const username = searchParams.get('username');
  const id = searchParams.get('id');

  if (!pool) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    if (username) {
      const [rows]: any = await pool.query("SELECT * FROM hospital_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1", [username.trim()]);
      if (rows.length > 0) {
        return NextResponse.json({ success: true, data: formatAccountRow(rows[0]) });
      }
      return NextResponse.json({ success: false, error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    if (id) {
      const [rows]: any = await pool.query("SELECT * FROM hospital_accounts WHERE id = ? LIMIT 1", [id]);
      if (rows.length > 0) {
        return NextResponse.json({ success: true, data: formatAccountRow(rows[0]) });
      }
      return NextResponse.json({ success: false, error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const [rows]: any = await pool.query("SELECT * FROM hospital_accounts ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: rows.map(formatAccountRow) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();

  if (!pool) {
    return NextResponse.json({ success: true, data: body, message: 'Disimpan di mode luring' });
  }

  try {
    const id = body.id || `hosp-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(body.password || 'password123', 10);

    await pool.query(
      `INSERT INTO hospital_accounts (
        id, username, kode_rs, nama_rs, alamat_rs, password,
        provinsi, kota_kab, penanggung_jawab, jabatan, no_whatsapp, email_rs,
        status, account_status, kode_pos, no_telepon, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', ?, ?, NOW(), NOW())`,
      [
        id, body.username, body.kodeRs || null, body.namaRs, body.alamatRs || null, hashedPassword,
        body.provinsi || null, body.kotaKab || null, body.penanggungJawab || null, body.jabatan || null,
        body.noWhatsapp || null, body.emailRs || null, body.kodePos || null, body.noTelepon || null
      ]
    );

    return NextResponse.json({
      success: true,
      data: { id, username: body.username, namaRs: body.namaRs, status: 'Pending' }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();
  const id = body.id || req.nextUrl.searchParams.get('id');

  if (!pool) {
    return NextResponse.json({ success: true, message: 'Diperbarui secara lokal' });
  }

  if (!id) {
    return NextResponse.json({ success: false, error: 'id wajib diisi' }, { status: 400 });
  }

  try {
    const action = req.nextUrl.searchParams.get('action');
    if (action === 'status' || body.status) {
      await pool.query(
        `UPDATE hospital_accounts SET
          status = ?, account_status = ?, approved_by = ?, rejection_reason = ?,
          approval_date = IF(? = 'Active', NOW(), approval_date), updated_at = NOW()
        WHERE id = ?`,
        [body.status, body.status, body.approvedBy || 'Admin', body.rejectionReason || null, body.status, id]
      );
      return NextResponse.json({ success: true });
    }

    if (body.password) {
      const hashed = await bcrypt.hash(body.password, 10);
      await pool.query("UPDATE hospital_accounts SET password = ?, updated_at = NOW() WHERE id = ?", [hashed, id]);
    }

    if (body.pengesahan_config) {
      await pool.query("UPDATE hospital_accounts SET pengesahan_config = ?, updated_at = NOW() WHERE id = ?", [JSON.stringify(body.pengesahan_config), id]);
    }

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

  if (!id) {
    return NextResponse.json({ success: false, error: 'id wajib diisi' }, { status: 400 });
  }

  try {
    await pool.query("DELETE FROM hospital_accounts WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
