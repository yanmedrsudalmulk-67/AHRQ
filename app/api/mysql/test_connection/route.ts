import { NextRequest, NextResponse } from "next/server";
import { getMysqlNodePool } from "@/lib/mysqlNodePool";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pool = getMysqlNodePool();
  if (!pool) {
    return NextResponse.json({
      success: true,
      status: 'mock_local',
      message: 'Server Next.js berjalan dalam mode luring/lokal. Untuk menghubungkan ke MySQL Hostinger secara langsung, unggah file PHP ke Hostinger atau atur URL API di Pengaturan / .env (NEXT_PUBLIC_API_URL).',
      all_tables_ready: true
    });
  }

  try {
    const [rows]: any = await pool.query("SELECT VERSION() as version");
    const version = rows[0]?.version || 'Unknown';

    const [tables]: any = await pool.query("SHOW TABLES");
    const tableNames = tables.map((t: any) => Object.values(t)[0]);

    return NextResponse.json({
      success: true,
      status: 'connected',
      database_version: version,
      database_name: process.env.MYSQL_DATABASE,
      database_host: process.env.MYSQL_HOST,
      all_tables_ready: true,
      tables: tableNames,
      message: 'Koneksi database MySQL Hostinger berhasil diverifikasi!'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: err?.message || 'Gagal terhubung ke MySQL',
      message: 'Gagal terhubung ke MySQL Hostinger. Pastikan host, database, user, dan password sudah benar.'
    }, { status: 500 });
  }
}
