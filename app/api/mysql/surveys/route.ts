import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  const searchParams = req.nextUrl.searchParams;
  const hospitalId = searchParams.get('hospital_id');
  const namaRs = searchParams.get('nama_rs');
  const action = searchParams.get('action');

  if (!pool) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    if (action === 'submissions') {
      const rsId = searchParams.get('rs_id');
      let query = "SELECT * FROM survey_submissions WHERE 1=1";
      const params: any[] = [];
      if (rsId) {
        query += " AND (rs_id = ? OR hospital_id = ?)";
        params.push(rsId, rsId);
      }
      query += " ORDER BY created_at DESC";
      const [rows]: any = await pool.query(query, params);
      return NextResponse.json({ success: true, data: rows });
    }

    let query = "SELECT * FROM ahrq_surveys WHERE nama_rs NOT LIKE '_MASTER_%' AND nama_rs NOT LIKE '_LINK_CONFIG_%' AND id NOT LIKE 'MASTER_%' AND id NOT LIKE 'PENGESAHAN_%' AND id NOT LIKE 'PWDRESET_%'";
    const params: any[] = [];

    if (hospitalId && hospitalId !== 'admin') {
      query += " AND (hospital_id = ? OR user_id = ? OR unit_kerja = ?)";
      params.push(hospitalId, hospitalId, hospitalId);
    }
    if (namaRs && namaRs !== 'Semua Rumah Sakit') {
      query += " AND nama_rs = ?";
      params.push(namaRs);
    }
    query += " ORDER BY created_at DESC";

    const [rows]: any = await pool.query(query, params);
    const mapped = rows.map((r: any) => ({
      ...r,
      dimensi_scores: typeof r.dimensi_scores === 'string' ? JSON.parse(r.dimensi_scores) : r.dimensi_scores
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pool = getMysqlNodePool();
  const body = await req.json();

  if (!pool) {
    return NextResponse.json({ success: true, id: body.id || 'local-id', message: 'Disimpan di mode luring' });
  }

  try {
    const action = req.nextUrl.searchParams.get('action');
    if (action === 'save_submission') {
      const sub = body.submission || body;
      const id = sub.id || `sub-${Date.now()}`;
      await pool.query(
        `INSERT INTO survey_submissions (
          id, rs_id, nama_rs, posisi_staf, unit_kerja,
          bagian_a, bagian_b, bagian_c, bagian_d, bagian_e, bagian_f, bagian_g, bagian_h,
          skor_a, skor_b, skor_c, skor_d, skor_f, skor_keseluruhan,
          hospital_id, user_id, created_by, hospital_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE posisi_staf = VALUES(posisi_staf), unit_kerja = VALUES(unit_kerja)`,
        [
          id, sub.rs_id || '', sub.nama_rs || '', sub.posisi_staf || '', sub.unit_kerja || '',
          JSON.stringify(sub.bagian_a || {}), JSON.stringify(sub.bagian_b || {}),
          JSON.stringify(sub.bagian_c || {}), JSON.stringify(sub.bagian_d || {}),
          sub.bagian_e || '', JSON.stringify(sub.bagian_f || {}),
          JSON.stringify(sub.bagian_g || {}), sub.bagian_h || '',
          sub.skor_a || 0, sub.skor_b || 0, sub.skor_c || 0, sub.skor_d || 0, sub.skor_f || 0, sub.skor_keseluruhan || 0,
          sub.hospital_id || null, sub.user_id || null, sub.created_by || null, sub.hospital_name || null
        ]
      );
      return NextResponse.json({ success: true, id });
    }

    if (action === 'batch') {
      const surveys = body.surveys || [];
      for (const s of surveys) {
        await pool.query(
          `INSERT INTO ahrq_surveys (id, nama_rs, unit_kerja, jumlah_responden, tanggal_input, dimensi_scores, hospital_id, user_id, created_by, hospital_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE unit_kerja = VALUES(unit_kerja), jumlah_responden = VALUES(jumlah_responden), dimensi_scores = VALUES(dimensi_scores), updated_at = NOW()`,
          [
            s.id, s.namaRs || s.nama_rs, s.unitKerja || s.unit_kerja, s.jumlahResponden || s.jumlah_responden || 1,
            s.tanggalInput || s.tanggal_input, JSON.stringify(s.dimensiScores || s.dimensi_scores || {}),
            s.hospital_id || null, s.user_id || null, s.created_by || null, s.hospital_name || null
          ]
        );
      }
      return NextResponse.json({ success: true, count: surveys.length });
    }

    const id = body.id || `survey-${Date.now()}`;
    await pool.query(
      `INSERT INTO ahrq_surveys (id, nama_rs, unit_kerja, jumlah_responden, tanggal_input, dimensi_scores, hospital_id, user_id, created_by, hospital_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE unit_kerja = VALUES(unit_kerja), jumlah_responden = VALUES(jumlah_responden), dimensi_scores = VALUES(dimensi_scores), updated_at = NOW()`,
      [
        id, body.nama_rs || body.namaRs, body.unit_kerja || body.unitKerja,
        body.jumlah_responden || body.jumlahResponden || 1, body.tanggal_input || body.tanggalInput,
        JSON.stringify(body.dimensi_scores || body.dimensiScores || {}),
        body.hospital_id || null, body.user_id || null, body.created_by || null, body.hospital_name || null
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pool = getMysqlNodePool();
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (!pool) {
    return NextResponse.json({ success: true, deleted: 1 });
  }

  try {
    if (action === 'delete_by_unit') {
      const unit = searchParams.get('unit_kerja');
      const hosp = searchParams.get('hospital_id');
      let q = "DELETE FROM ahrq_surveys WHERE unit_kerja = ?";
      const p: any[] = [unit];
      if (hosp) {
        q += " AND (hospital_id = ? OR user_id = ?)";
        p.push(hosp, hosp);
      }
      await pool.query(q, p);
      return NextResponse.json({ success: true });
    }

    if (id) {
      await pool.query("DELETE FROM ahrq_surveys WHERE id = ?", [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Parameter id wajib diisi' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
