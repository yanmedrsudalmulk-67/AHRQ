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
    const { to, subject, body, html } = await req.json();

    if (!to) {
      return NextResponse.json({ success: false, error: "Email penerima (to) wajib diisi." }, { status: 400 });
    }

    const host = cleanEnvValue(process.env.SMTP_HOST);
    const smtpPortRaw = cleanEnvValue(process.env.SMTP_PORT);
    const port = parseInt(smtpPortRaw || "587", 10);
    const user = cleanEnvValue(process.env.SMTP_USER);
    const pass = cleanEnvValue(process.env.SMTP_PASS);
    const fromName = cleanEnvValue(process.env.SMTP_FROM_NAME) || "Sistem Survei AHRQ SOPS 2.0";

    if (!host || !user || !pass) {
      console.log(`[Email Log - SMTP Not Configured]\nKe: ${to}\nSubjek: ${subject}\nIsi:\n${body}\n--------------------`);
      return NextResponse.json({ 
        success: true, 
        message: "Email dicatat dalam database (SMTP belum dikonfigurasi di variabel lingkungan).",
        smtpConfigured: false
      });
    }

    const isSecure = port === 465 || host.includes('gmail.com');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions: any = {
      from: `"${fromName}" <${user}>`,
      to,
      subject: subject || "Notifikasi Sistem AHRQ SOPS 2.0",
      text: body || "",
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);

    return NextResponse.json({ 
      success: true, 
      message: "Email berhasil dikirim melalui SMTP.", 
      messageId: info.messageId,
      smtpConfigured: true 
    });
  } catch (error: any) {
    console.error("Error pada rute send-email:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal mengirim email." }, { status: 500 });
  }
}

