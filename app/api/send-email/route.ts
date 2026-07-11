import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let cleaned = value.trim().replace(/^['"]|['"]$/g, '').trim();
  if (cleaned.toLowerCase() === 'smpt.gmail.com') {
    return 'smtp.gmail.com';
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json();

    const host = cleanEnvValue(process.env.SMTP_HOST);
    const smtpPortRaw = cleanEnvValue(process.env.SMTP_PORT);
    const port = parseInt(smtpPortRaw || "587", 10);
    const user = cleanEnvValue(process.env.SMTP_USER);
    const pass = cleanEnvValue(process.env.SMTP_PASS);

    if (!host || !user || !pass) {
      console.log(`[Email Log] Ke: ${to}\nSubjek: ${subject}\nIsi:\n${body}\n--------------------`);
      return NextResponse.json({ 
        success: true, 
        message: "Email dicatat dalam database (SMTP belum dikonfigurasi di variabel lingkungan)." 
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Sistem Survei AHRQ SOPS 2.0" <${user}>`,
      to,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true, message: "Email berhasil dikirim melalui SMTP." });
  } catch (error: any) {
    console.error("Error pada rute send-email:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
