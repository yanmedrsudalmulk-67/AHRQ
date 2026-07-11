-- SQL Schema for AHRQ SOPS 2.0 Survey System
-- Run this in your Supabase SQL Editor

-- 1. Table: ahrq_surveys
CREATE TABLE IF NOT EXISTS public.ahrq_surveys (
    id TEXT PRIMARY KEY,
    nama_rs TEXT NOT NULL,
    unit_kerja TEXT NOT NULL,
    jumlah_responden INTEGER NOT NULL DEFAULT 0,
    tanggal_input DATE NOT NULL,
    dimensi_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow reading and writing for authenticated/anon users (Configure RLS appropriately for production)
ALTER TABLE public.ahrq_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ahrq_surveys;
CREATE POLICY "Enable read access for all users" ON public.ahrq_surveys FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.ahrq_surveys;
CREATE POLICY "Enable insert access for all users" ON public.ahrq_surveys FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.ahrq_surveys;
CREATE POLICY "Enable update access for all users" ON public.ahrq_surveys FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.ahrq_surveys;
CREATE POLICY "Enable delete access for all users" ON public.ahrq_surveys FOR DELETE USING (true);

-- 2. Table: hospital_accounts
CREATE TABLE IF NOT EXISTS public.hospital_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    kode_rs TEXT NOT NULL,
    nama_rs TEXT NOT NULL,
    alamat_rs TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hospital_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hospital_accounts;
CREATE POLICY "Enable read access for all users" ON public.hospital_accounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.hospital_accounts;
CREATE POLICY "Enable insert access for all users" ON public.hospital_accounts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.hospital_accounts;
CREATE POLICY "Enable update access for all users" ON public.hospital_accounts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.hospital_accounts;
CREATE POLICY "Enable delete access for all users" ON public.hospital_accounts FOR DELETE USING (true);

-- 3. Table: survey_submissions
CREATE TABLE IF NOT EXISTS public.survey_submissions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rs_id TEXT NOT NULL,
    nama_rs TEXT NOT NULL,
    posisi_staf TEXT NOT NULL,
    unit_kerja TEXT NOT NULL,
    bagian_a JSONB DEFAULT '{}'::jsonb,
    bagian_b JSONB DEFAULT '{}'::jsonb,
    bagian_c JSONB DEFAULT '{}'::jsonb,
    bagian_d JSONB DEFAULT '{}'::jsonb,
    bagian_e TEXT,
    bagian_f JSONB DEFAULT '{}'::jsonb,
    bagian_g JSONB DEFAULT '{}'::jsonb,
    bagian_h TEXT,
    skor_a NUMERIC,
    skor_b NUMERIC,
    skor_c NUMERIC,
    skor_d NUMERIC,
    skor_f NUMERIC,
    skor_keseluruhan NUMERIC
);

ALTER TABLE public.survey_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.survey_submissions;
CREATE POLICY "Enable read access for all users" ON public.survey_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.survey_submissions;
CREATE POLICY "Enable insert access for all users" ON public.survey_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.survey_submissions;
CREATE POLICY "Enable update access for all users" ON public.survey_submissions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.survey_submissions;
CREATE POLICY "Enable delete access for all users" ON public.survey_submissions FOR DELETE USING (true);

-- 4. Table: app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_settings;
CREATE POLICY "Enable read access for all users" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.app_settings;
CREATE POLICY "Enable insert access for all users" ON public.app_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON public.app_settings;
CREATE POLICY "Enable update access for all users" ON public.app_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.app_settings;
CREATE POLICY "Enable delete access for all users" ON public.app_settings FOR DELETE USING (true);
