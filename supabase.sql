-- Run this SQL in your Supabase SQL Editor to set up the necessary tables

CREATE TABLE IF NOT EXISTS public.ahrq_surveys (
    id TEXT PRIMARY KEY,
    nama_rs TEXT NOT NULL,
    unit_kerja TEXT NOT NULL,
    jumlah_responden INTEGER NOT NULL DEFAULT 1,
    tanggal_input DATE NOT NULL,
    dimensi_scores JSONB,
    hospital_id TEXT,
    user_id TEXT,
    created_by TEXT,
    hospital_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hospital_accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nama_rs TEXT NOT NULL,
    kelas_rs TEXT,
    jenis_rs TEXT,
    provinsi TEXT,
    kabupaten_kota TEXT,
    direktur_nama TEXT,
    kontak_person TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    approved_by TEXT,
    rejection_reason TEXT,
    pengesahan_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.benchmark_requests (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    requester_name TEXT,
    target_rs_id TEXT NOT NULL,
    target_rs_name TEXT,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.benchmark_audit_logs (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    requester_name TEXT,
    target_rs_id TEXT NOT NULL,
    target_rs_name TEXT,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
