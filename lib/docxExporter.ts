import { 
  Document, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  WidthType, 
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  Packer
} from 'docx';
import { saveAs } from 'file-saver';

export interface ReportData {
  namaRs: string;
  logoUrl?: string;
  tahun: string;
  periodeSurvei: string;
  totalTarget: number;
  totalActual: number;
  responseRate: string;
  demographics: {
    profesi: { category: string; count: number; percentage: string }[];
    masaKerja: { category: string; count: number; percentage: string }[];
    jamKerja: { category: string; count: number; percentage: string }[];
    unitKerja: { category: string; count: number; percentage: string }[];
  };
  dimensionScores: {
    id: string;
    kode: string;
    nama: string;
    percentage: number;
    status: 'SANGAT_BAIK' | 'PERLU_PENINGKATAN' | 'PERLU_PRIORITAS';
    interpretasi: string;
  }[];
  overallAverage: number;
  safetyRating: { name: string; count: number; percentage: string }[];
  safetyRatingPositivePct: number;
  reportedEvents: { name: string; count: number; percentage: string }[];
  reportedEventsAnyPct: number;
  strengths: { kode: string; nama: string; percentage: number; interpretasi: string }[];
  improvements: { kode: string; nama: string; percentage: number; interpretasi: string }[];
  moderates: { kode: string; nama: string; percentage: number; interpretasi: string }[];
  recommendations: {
    jangkaPendek: string[];
    jangkaMenengah: string[];
    jangkaPanjang: string[];
  };
  hasBenchmark: boolean;
  benchmarkName?: string;
  benchmarkComparison?: { kode: string; nama: string; rsPct: number; benchPct: number; diff: number }[];
  hasYearComparison: boolean;
  yearComparison?: { year: string; average: number }[];
  pengesahan: {
    kota: string;
    tanggal: string;
    penanggungJawabNama: string;
    penanggungJawabJabatan: string;
    penanggungJawabNip?: string;
    direkturNama: string;
    direkturJabatan: string;
    direkturNip?: string;
  };
}

export async function exportReportToDocx(data: ReportData) {
  // Primary Palette: Dark Slate / Navy (#1E293B, #0F172A) & Teal Header (#0D9488)
  const headerBgColor = "0D9488";
  const headerTextColor = "FFFFFF";
  const lightRowBg = "F8FAFC";
  const borderGray = "CBD5E1";

  const createCell = (text: string, bold = false, align: any = AlignmentType.LEFT, bg?: string, color?: string) => {
    return new TableCell({
      shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
      children: [
        new Paragraph({
          alignment: align,
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold,
              font: "Calibri",
              size: 20, // 10pt
              color: color || "1E293B",
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: borderGray },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: borderGray },
        left: { style: BorderStyle.SINGLE, size: 1, color: borderGray },
        right: { style: BorderStyle.SINGLE, size: 1, color: borderGray },
      },
    });
  };

  const createHeaderCell = (text: string, align: any = AlignmentType.CENTER) => {
    return createCell(text, true, align, headerBgColor, headerTextColor);
  };

  const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

  const p = (text: string, options?: { bold?: boolean; italic?: boolean; size?: number; align?: any; spaceBefore?: number; spaceAfter?: number; color?: string }) => {
    return new Paragraph({
      alignment: options?.align || AlignmentType.LEFT,
      spacing: { before: options?.spaceBefore ?? 120, after: options?.spaceAfter ?? 120, line: 276 }, // 1.15 line height
      children: [
        new TextRun({
          text,
          bold: options?.bold,
          italics: options?.italic,
          font: "Calibri",
          size: options?.size || 22, // 11pt default
          color: options?.color || "1E293B",
        }),
      ],
    });
  };

  const heading1 = (line1: string, line2?: string) => {
    const children = [
      new TextRun({
        text: line1.toUpperCase(),
        bold: true,
        font: "Calibri",
        size: 28, // 14pt
        color: "0F172A",
      }),
    ];
    if (line2) {
      children.push(
        new TextRun({
          text: line2.toUpperCase(),
          bold: true,
          font: "Calibri",
          size: 28, // 14pt
          color: "0F172A",
          break: 1,
        })
      );
    }
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 180 },
      children,
    });
  };

  const heading2 = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          font: "Calibri",
          size: 24, // 12pt
          color: "1E293B",
        }),
      ],
    });
  };

  const heading3 = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      alignment: AlignmentType.LEFT,
      spacing: { before: 180, after: 90 },
      children: [
        new TextRun({
          text,
          bold: true,
          font: "Calibri",
          size: 22, // 11pt
          color: "334155",
        }),
      ],
    });
  };

  const bullet = (text: string, level = 0) => {
    return new Paragraph({
      bullet: { level },
      spacing: { before: 60, after: 60, line: 260 },
      children: [
        new TextRun({
          text,
          font: "Calibri",
          size: 22,
          color: "1E293B",
        }),
      ],
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 Portrait width in dxa (210mm)
              height: 16838, // A4 Portrait height in dxa (297mm)
            },
            margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 }, // 2.5cm margin all around (~1417 dxa)
          },
        },
        headers: {
          default: new Header({
            children: [
              p(`Laporan Survei Budaya Keselamatan Pasien - ${data.namaRs}`, {
                italic: true,
                size: 18,
                color: "64748B",
                align: AlignmentType.RIGHT,
                spaceAfter: 120,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Halaman ", font: "Calibri", size: 18, color: "64748B" }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 18, color: "64748B" }),
                  new TextRun({ text: " dari ", font: "Calibri", size: 18, color: "64748B" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 18, color: "64748B" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // COVER PAGE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2880, after: 240 },
            children: [
              new TextRun({
                text: "LAPORAN SURVEI BUDAYA KESELAMATAN PASIEN",
                bold: true,
                font: "Calibri",
                size: 32, // 16pt
                color: "0F172A",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 240 },
            children: [
              new TextRun({
                text: data.namaRs.toUpperCase(),
                bold: true,
                font: "Calibri",
                size: 36, // 18pt
                color: "0D9488",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 2880 },
            children: [
              new TextRun({
                text: `PERIODE TAHUN ${data.tahun}`,
                bold: true,
                font: "Calibri",
                size: 28, // 14pt
                color: "334155",
              }),
            ],
          }),

          p("INSTRUMEN AHRQ HOSPITAL SURVEY ON PATIENT SAFETY CULTURE (SOPS®) V2.0", { align: AlignmentType.CENTER, bold: true, size: 20, color: "475569" }),

          pageBreak(),

          // DAFTAR ISI
          heading1("DAFTAR ISI"),
          p("HALAMAN COVER ........................................................................................................... i", { bold: true, spaceAfter: 80 }),
          p("DAFTAR ISI .................................................................................................................. ii", { bold: true, spaceAfter: 80 }),
          p("BAB I PENDAHULUAN ..................................................................................................... 1", { bold: true, spaceAfter: 80 }),
          p("    1.1 Latar Belakang .................................................................................................... 1", { spaceAfter: 60 }),
          p("    1.2 Tujuan .................................................................................................................. 1", { spaceAfter: 60 }),
          p("    1.3 Manfaat ................................................................................................................. 1", { spaceAfter: 60 }),
          p("BAB II METODOLOGI SURVEI ............................................................................................ 2", { bold: true, spaceAfter: 80 }),
          p("    2.1 Desain Penelitian / Survei ........................................................................................ 2", { spaceAfter: 60 }),
          p("    2.2 Waktu dan Lokasi .................................................................................................... 2", { spaceAfter: 60 }),
          p("    2.3 Populasi dan Sampel ................................................................................................ 2", { spaceAfter: 60 }),
          p("BAB III HASIL DAN PEMBAHASAN ..................................................................................... 3", { bold: true, spaceAfter: 80 }),
          p("    3.1 Karakteristik Demografi & Tingkat Respon ............................................................. 3", { spaceAfter: 60 }),
          p("    3.2 Hasil Pengukuran 10 Dimensi AHRQ ..................................................................... 4", { spaceAfter: 60 }),
          p("    3.3 Pembahasan Analisis Kualitatif ............................................................................... 6", { spaceAfter: 60 }),
          p("BAB IV KESIMPULAN, REKOMENDASI & LEMBAR PENGESAHAN ..................................... 7", { bold: true, spaceAfter: 80 }),
          p("    4.1 Kesimpulan ............................................................................................................ 7", { spaceAfter: 60 }),
          p("    4.2 Rekomendasi Strategic Action Plan & Pengesahan .................................................... 7", { spaceAfter: 60 }),

          pageBreak(),

          // BAB I PENDAHULUAN
          heading1("BAB I", "PENDAHULUAN"),
          
          heading2("1.1 Latar Belakang"),
          p("Keselamatan pasien merupakan prioritas utama dan prinsip mendasar dalam pelayanan kesehatan di rumah sakit. Berdasarkan pandangan global dan standar akreditasi rumah sakit, upaya peningkatan keselamatan pasien tidak hanya berfokus pada penerapan prosedur operasional standar dan penyediaan sarana prasarana, tetapi juga sangat bergantung pada budaya keselamatan pasien (patient safety culture) yang hidup di dalam organisasi."),
          p("Budaya keselamatan pasien didefinisikan sebagai nilai, keyakinan, dan norma yang dibagikan oleh staf rumah sakit mengenai apa yang penting dan bagaimana perilaku terkait keselamatan diwujudkan. Budaya yang kuat memafasilitasi komunikasi yang terbuka, pelaporan insiden tanpa rasa takut akan hukuman (non-punitive environment), pembelajaran berkelanjutan dari kesalahan, serta kerja sama tim yang solid antar unit."),
          p("Untuk mengukur dan mengevaluasi sejauh mana budaya keselamatan telah tertanam di rumah sakit, diperlukan instrumen pengukuran yang valid, handal, dan terstandar secara internasional. Agency for Healthcare Research and Quality (AHRQ) telah memperbarui instrumen pengukuran melalui AHRQ Hospital Survey on Patient Patient Safety Culture (SOPS®) Version 2.0. Versi ini menyempurnakan dimensi pengukuran terdahulu agar lebih relevan dengan dinamika pelayanan kesehatan modern, berfokus pada respons terhadap kesalahan, dukungan kepemimpinan, pembelajaran organisasi, dan komunikasi yang terbuka."),
          p(`Pelaksanaan survei budaya keselamatan pasien berbasis AHRQ Versi 2.0 ini dilakukan untuk memetakan kekuatan (strengths) serta area yang membutuhkan peningkatan (areas for improvement) di ${data.namaRs}. Hasil dari survei ini menjadi landasan berbasis data (data-driven) dalam merumuskan strategi perbaikan mutu dan keselamatan pasien secara terarah dan berkelanjutan.`),

          heading2("1.2 Tujuan"),
          heading3("1.2.1 Tujuan Umum"),
          p(`Mengetahui gambaran penerapan budaya keselamatan pasien di ${data.namaRs} menggunakan instrumen AHRQ Versi 2.0 sebagai dasar penyusunan program peningkatan mutu dan keselamatan pasien.`),
          heading3("1.2.2 Tujuan Khusus"),
          bullet("1. Mengidentifikasi karakteristik responden berdasarkan unit kerja, profesi, lama bekerja, dan jam kerja per minggu."),
          bullet("2. Menganalisis persentase respon positif (% Positive Response) pada 10 dimensi budaya keselamatan pasien AHRQ Versi 2.0."),
          bullet(`3. Mengetahui persepsi staf terhadap tingkat keselamatan pasien secara keseluruhan (Overall Patient Safety Rating) di ${data.namaRs}.`),
          bullet("4. Mengidentifikasi dimensi yang menjadi kekuatan area (strengths, ≥ 75% respon positif) dan area yang memerlukan perbaikan (areas for improvement, < 50% respon positif)."),
          bullet("5. Menyediakan data acuan (baseline data) untuk evaluasi berkala dan pembandingan (benchmarking) budaya keselamatan pasien di masa mendatang."),

          heading2("1.3 Manfaat"),
          heading3("1.3.1 Bagi Manajemen Rumah Sakit"),
          bullet("1. Menyediakan data objektif mengenai persepsi staf terhadap budaya keselamatan pasien di seluruh tingkatan unit."),
          bullet("2. Menjadi acuan pengambilan keputusan strategis dan alokasi sumber daya dalam program keselamatan pasien."),
          bullet("3. Membantu kepemimpinan rumah sakit dalam membangun lingkungan kerja yang mendukung pelaporan insiden tanpa rasa takut (just culture)."),
          heading3("1.3.2 Bagi Pengelola Mutu dan Keselamatan Pasien Rumah Sakit"),
          bullet("1. Mempermudah pemetaan fokus intervensi dan prioritas perbaikan mutu di unit-unit kerja yang membutuhkan pendampingan khusus."),
          bullet("2. Memenuhi persyaratan standar akreditasi rumah sakit terkait pengukuran berkala budaya keselamatan pasien."),
          heading3("1.3.3 Bagi Staf dan Unit Kerja"),
          bullet("1. Menjadi sarana bagi staf untuk menyuarakan persepsi, kendala, dan masukan terkait keselamatan pasien secara anonim dan terstruktur."),
          bullet("2. Mendorong kolaborasi, komunikasi interprofesi, dan kesadaran kolektif antar unit kerja untuk menciptakan lingkungan pelayanan yang aman bagi pasien."),

          pageBreak(),

          // BAB II METODOLOGI SURVEI
          heading1("BAB II", "METODOLOGI SURVEI"),
          
          heading2("2.1 Desain Penelitian / Survei"),
          p("Survei ini menggunakan desain deskriptif kuantitatif dengan pendekatan cross-sectional. Pendekatan ini digunakan untuk mengukur dan menggambarkan persepsi staf rumah sakit terhadap budaya keselamatan pasien pada satu kurun waktu tertentu tanpa memberikan intervensi langsung saat pengukuran berlangsung."),

          heading2("2.2 Waktu dan Lokasi Pelaksanaan"),
          heading3("Lokasi Pelaksanaan"),
          p(`Seluruh unit kerja/instalasi di ${data.namaRs}, meliputi:`),
          bullet("• Unit Pelayanan Medis"),
          bullet("• Unit Keperawatan"),
          bullet("• Unit Penunjang Medis"),
          bullet("• Unit Administrasi"),
          bullet("• Unit Manajemen"),
          
          heading3("Waktu Pelaksanaan"),
          p("Survei dilaksanakan selama periode:"),
          p(data.periodeSurvei, { bold: true }), // Bold

          heading2("2.3 Populasi dan Sampel"),
          heading3("2.3.1 Populasi"),
          p(`Populasi dalam survei ini adalah seluruh pegawai yang bekerja di ${data.namaRs}, baik manajemen, staf medis, keperawatan, tenaga kesehatan lainnya maupun staf administrasi/non klinis.`),
          
          heading3("2.3.2 Kriteria Inklusi dan Eksklusi"),
          heading3("Kriteria Inklusi"),
          bullet("• Pegawai tetap maupun kontrak yang telah bekerja minimal 3 bulan."),
          bullet("• Memiliki interaksi langsung maupun tidak langsung terhadap pelayanan pasien."),
          bullet("• Bersedia mengisi kuesioner secara sukarela."),
          
          heading3("Kriteria Eksklusi"),
          bullet("• Pegawai yang sedang menjalani cuti panjang."),
          bullet("• Mahasiswa praktik."),
          bullet("• Siswa praktik."),
          bullet("• Residen yang belum menjadi pegawai rumah sakit."),

          heading3("2.3.3 Teknik Sampling dan Jumlah Sampel"),
          heading3("Teknik Sampling"),
          p("Pengambilan sampel dilakukan menggunakan:"),
          bullet("• Total Sampling"),
          p("atau"),
          bullet("• Proportionate Stratified Random Sampling"),
          p("(sesuai pengaturan aplikasi)."),

          heading3("Ukuran Sampel"),
          p("Target jumlah responden mengikuti rekomendasi AHRQ."),
          bullet(`• Jumlah Target Responden: ${data.totalTarget}`),
          bullet(`• Jumlah Responden Mengisi: ${data.totalActual}`),
          bullet(`• Persentase Response Rate: ${data.responseRate}`),

          heading2("2.4 Instrumen Survei"),
          p("Instrumen yang digunakan adalah:"),
          p("AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0", { bold: true }),
          p("yang telah diterjemahkan ke Bahasa Indonesia."),
          p("Instrumen terdiri atas 10 Dimensi Budaya Keselamatan Pasien:"),
          bullet("1. Teamwork (Kerja Sama Tim) – 3 item"),
          bullet("2. Staffing and Work Pace – 4 item"),
          bullet("3. Organizational Learning—Continuous Improvement – 3 item"),
          bullet("4. Response to Error – 4 item"),
          bullet("5. Supervisor/Manager Support – 3 item"),
          bullet("6. Management Support – 3 item"),
          bullet("7. Communication Openness – 4 item"),
          bullet("8. Reporting Patient Safety Events – 2 item"),
          bullet("9. Hospital Handoffs and Information Exchange – 3 item"),
          bullet("10. Communication About Error – 3 item"),
          p("Selain itu terdapat:"),
          bullet("• Overall Patient Safety Rating"),
          bullet("• Pertanyaan Demografi Responden"),

          heading2("2.5 Metode Pengumpulan Data"),
          p("Pengumpulan data dilakukan secara elektronik (e-Survey) melalui aplikasi Survei Budaya Keselamatan Pasien."),
          p("Meliputi:"),
          
          heading3("Penyebaran Kuesioner"),
          p("Melalui koordinasi:"),
          bullet("• Kepala Unit"),
          bullet("• Kepala Ruangan"),
          bullet("• Tim Komite Mutu"),

          heading3("Prinsip Anonimitas"),
          p("Responden tidak diminta mengisi:"),
          bullet("• Nama"),
          bullet("• NIP"),
          p("untuk menjamin kerahasiaan identitas."),

          heading3("Monitoring Response Rate"),
          p("Monitoring dilakukan setiap hari terhadap tingkat partisipasi seluruh unit kerja."),

          heading2("2.6 Analisis Data"),
          p("Pengolahan data mengikuti pedoman resmi:"),
          p("AHRQ Hospital Survey on Patient Safety Culture (SOPS®) Version 2.0", { bold: true }),
          p("meliputi:"),

          heading3("Analisis Demografi"),
          p("Menghitung:"),
          bullet("• Frekuensi"),
          bullet("• Persentase"),
          p("berdasarkan:"),
          bullet("• Profesi"),
          bullet("• Unit Kerja"),
          bullet("• Masa Kerja"),
          bullet("• Jam Kerja"),

          heading3("Kalkulasi Persentase Respon Positif"),
          p("Skala Agreement:", { bold: true }),
          bullet("1. Sangat Tidak Setuju"),
          bullet("2. Tidak Setuju"),
          bullet("3. Netral"),
          bullet("4. Setuju"),
          bullet("5. Sangat Setuju"),
          p("Skala Frequency:", { bold: true }),
          bullet("1. Tidak Pernah"),
          bullet("2. Jarang"),
          bullet("3. Kadang-kadang"),
          bullet("4. Sering"),
          bullet("5. Selalu"),

          heading3("Perhitungan Item Positif"),
          p("Respon:"),
          bullet("• 4"),
          bullet("• 5"),
          p("dihitung sebagai respon positif."),

          heading3("Perhitungan Item Negatif"),
          p("Respon:"),
          bullet("• 1"),
          bullet("• 2"),
          p("dihitung sebagai respon positif (Reverse Scoring)."),

          heading3("Formula"),
          p("% Respon Positif Dimensi = (Total Jawaban Positif pada seluruh item dimensi ÷ Total Jawaban Terisi pada seluruh item dimensi) × 100%", { bold: true }),

          heading3("Kriteria Penilaian"),
          p("Area Keunggulan (Strengths)", { bold: true }),
          p("≥ 75%"),
          p("Area Sedang / Netral", { bold: true }),
          p("50%–74%"),
          p("Area Perlu Perbaikan", { bold: true }),
          p("< 50%"),

          heading3("Analisis Tingkat Keselamatan Pasien"),
          p("Menghitung distribusi persentase penilaian responden terhadap tingkat keselamatan pasien secara keseluruhan."),

          pageBreak(),

          // BAB III HASIL DAN PEMBAHASAN
          heading1("BAB III", "HASIL DAN PEMBAHASAN"),

          heading2("3.1 Gambaran Umum Respon Rate dan Karakteristik Responden"),
          heading3("3.1.1 Tingkat Partisipasi (Response Rate)"),
          p(`Survei dilaksanakan pada periode ${data.periodeSurvei}. Dari total ${data.totalTarget} kuesioner yang disebarkan ke seluruh unit kerja di ${data.namaRs}, diperoleh kuesioner kembali dan memenuhi syarat untuk dianalisis sebanyak ${data.totalActual} kuesioner (Response Rate: ${data.responseRate}).`),

          heading3("3.1.2 Demografi Responden"),
          p("Tabel 3.1 menyajikan distribusi karakteristik demografi responden survei:"),

          // Table 3.1 Demografi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Karakteristik", AlignmentType.LEFT),
                  createHeaderCell("Kategori", AlignmentType.LEFT),
                  createHeaderCell("Jumlah (n)", AlignmentType.CENTER),
                  createHeaderCell("Persentase (%)", AlignmentType.CENTER),
                ],
              }),
              ...data.demographics.profesi.map((item, idx) => 
                new TableRow({
                  children: [
                    createCell(idx === 0 ? "Profesi / Peran" : "", true),
                    createCell(item.category),
                    createCell(item.count.toString(), false, AlignmentType.CENTER),
                    createCell(item.percentage, false, AlignmentType.CENTER),
                  ],
                })
              ),
              ...data.demographics.masaKerja.map((item, idx) => 
                new TableRow({
                  children: [
                    createCell(idx === 0 ? "Masa Kerja di RS" : "", true),
                    createCell(item.category),
                    createCell(item.count.toString(), false, AlignmentType.CENTER),
                    createCell(item.percentage, false, AlignmentType.CENTER),
                  ],
                })
              ),
              ...data.demographics.jamKerja.map((item, idx) => 
                new TableRow({
                  children: [
                    createCell(idx === 0 ? "Jam Kerja / Minggu" : "", true),
                    createCell(item.category),
                    createCell(item.count.toString(), false, AlignmentType.CENTER),
                    createCell(item.percentage, false, AlignmentType.CENTER),
                  ],
                })
              ),
            ],
          }),

          heading2(`3.2 Hasil Pengukuran Budaya Keselamatan Pasien ${data.namaRs}`),
          p(`Berdasarkan hasil pengukuran budaya keselamatan pasien periode Tahun ${data.periodeSurvei.includes('20') ? data.periodeSurvei : new Date().getFullYear()} pada ${data.namaRs}, diperoleh rata-rata respons positif sebesar ${data.overallAverage.toFixed(1)}%. Data berikut merupakan hasil pengukuran terhadap 10 dimensi budaya keselamatan pasien yang diperoleh secara otomatis dari Menu Analisa Data dan tersimpan pada database Supabase berdasarkan akun rumah sakit yang sedang aktif.`),

          heading3("3.2.1 Detail Pengukuran Dimensi Budaya Keselamatan Pasien"),
          
          // Table 3.2 10 Dimensi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("No.", AlignmentType.CENTER),
                  createHeaderCell("Kode", AlignmentType.CENTER),
                  createHeaderCell("Komponen / Dimensi Budaya Keselamatan Pasien", AlignmentType.LEFT),
                  createHeaderCell("% Respon Positif", AlignmentType.CENTER),
                  createHeaderCell("Kategori Penilaian", AlignmentType.CENTER),
                ],
              }),
              ...data.dimensionScores.map((d, idx) => 
                new TableRow({
                  children: [
                    createCell(`${idx + 1}.`, false, AlignmentType.CENTER),
                    createCell(d.kode, true, AlignmentType.CENTER),
                    createCell(d.nama),
                    createCell(`${d.percentage.toFixed(1)}%`, true, AlignmentType.CENTER),
                    createCell(
                      d.percentage >= 75 ? "Area Kekuatan (≥75%)" : d.percentage < 50 ? "Area Perbaikan (<50%)" : "Moderat (50-74%)",
                      true,
                      AlignmentType.CENTER,
                      d.percentage >= 75 ? "DCFCE7" : d.percentage < 50 ? "FEE2E2" : "FEF3C7"
                    ),
                  ],
                })
              ),
              new TableRow({
                children: [
                  createCell("Rata-Rata Seluruh 10 Dimensi", true, AlignmentType.RIGHT, "CCFBF1"),
                  createCell("", false, AlignmentType.LEFT, "CCFBF1"),
                  createCell("", false, AlignmentType.LEFT, "CCFBF1"),
                  createCell(`${data.overallAverage.toFixed(1)}%`, true, AlignmentType.CENTER, "CCFBF1", "0D9488"),
                  createCell("Skor Terintegrasi Realtime", true, AlignmentType.CENTER, "CCFBF1", "0F766E"),
                ]
              })
            ],
          }),

          p(`Interpretasi Otomatis: Berdasarkan hasil survei budaya keselamatan pasien di ${data.namaRs}, diperoleh bahwa dimensi dengan capaian tertinggi adalah ${data.dimensionScores.slice().sort((a,b)=>b.percentage-a.percentage)[0]?.nama || '-'} (${data.dimensionScores.slice().sort((a,b)=>b.percentage-a.percentage)[0]?.kode}) sebesar ${data.dimensionScores.slice().sort((a,b)=>b.percentage-a.percentage)[0]?.percentage.toFixed(1)}%, sedangkan dimensi dengan nilai terendah adalah ${data.dimensionScores.slice().sort((a,b)=>a.percentage-b.percentage)[0]?.nama || '-'} (${data.dimensionScores.slice().sort((a,b)=>a.percentage-b.percentage)[0]?.kode}) sebesar ${data.dimensionScores.slice().sort((a,b)=>a.percentage-b.percentage)[0]?.percentage.toFixed(1)}%. Capaian rata-rata respon positif seluruh 10 dimensi berada pada angka ${data.overallAverage.toFixed(1)}%.`, { italic: true, bold: false, size: 20, color: "0F766E", spaceBefore: 120, spaceAfter: 180 }),

          heading3("3.2.2 Rating Keselamatan Pasien Keseluruhan (Overall Patient Safety Rating)"),
          p(`Sebanyak ${data.safetyRatingPositivePct.toFixed(1)}% responden menilai tingkat keselamatan pasien di ${data.namaRs} berada pada kategori 'Baik' hingga 'Sangat Baik'.`),

          heading3("3.2.3 Jumlah Insiden Keselamatan Pasien Yang Dilaporkan"),
          p(`Sebanyak ${data.reportedEventsAnyPct.toFixed(1)}% responden melaporkan setidaknya 1 insiden keselamatan pasien dalam 12 bulan terakhir.`),

          heading2("3.3 Analisis Naratif Otomatis Pengukuran Dimensi"),
          
          heading3(`3.3.1 Kekuatan Organisasi (Capaian Respon Positif ≥ 75%)`),
          ...(data.strengths.length > 0 
            ? data.strengths.map(s => bullet(`• ${s.kode} - ${s.nama} (${s.percentage.toFixed(1)}%): ${s.interpretasi}`))
            : [p(`Saat ini belum ada dimensi yang mencapai batas area kekuatan (≥ 75%). Diperlukan strategi penguatan terpadu di seluruh unit kerja ${data.namaRs}.`, { italic: true })]),

          heading3(`3.3.2 Area yang Masih Perlu Ditingkatkan (Capaian 50% - 74%)`),
          ...(data.moderates.length > 0
            ? data.moderates.map(m => bullet(`• ${m.kode} - ${m.nama} (${m.percentage.toFixed(1)}%): ${m.interpretasi}`))
            : [p("Tidak ada dimensi yang berada dalam kategori moderat (50% - 74%).", { italic: true })]),

          heading3(`3.3.3 Prioritas Utama Perbaikan (Capaian < 50%)`),
          ...(data.improvements.length > 0
            ? data.improvements.map(i => bullet(`• ${i.kode} - ${i.nama} (${i.percentage.toFixed(1)}%): ${i.interpretasi}`))
            : [p(`Tidak ada dimensi yang berada di bawah 50%. Ini menunjukkan budaya keselamatan di ${data.namaRs} berjalan stabil tanpa hambatan kritis.`, { italic: true })]),

          pageBreak(),

          // BAB IV KESIMPULAN DAN REKOMENDASI
          heading1("BAB IV", "KESIMPULAN DAN REKOMENDASI"),

          heading2("4.1 Kesimpulan"),
          bullet(`1. Gambaran Umum: Rata-rata pencapaian respon positif dari 10 dimensi budaya keselamatan pasien di ${data.namaRs} berada pada angka ${data.overallAverage.toFixed(1)}%. Sebanyak ${data.safetyRatingPositivePct.toFixed(1)}% staf menilai tingkat keselamatan pasien berada pada kategori 'Baik' hingga 'Sangat Baik'.`),
          bullet(`2. Area Keunggulan: Terdapat ${data.strengths.length} dimensi yang menjadi kekuatan utama budaya keselamatan (≥ 75% respon positif).`),
          bullet(`3. Area Perlu Perbaikan Kritis: Terdapat ${data.improvements.length} dimensi kritis yang memerlukan perhatian prioritas dari jajaran manajemen (< 50% respon positif).`),

          heading2("4.2 Rekomendasi Strategic Action Plan"),
          heading3("Prioritas Jangka Pendek (1 - 3 Bulan):"),
          ...data.recommendations.jangkaPendek.map(r => bullet(`• ${r}`)),

          heading3("Prioritas Jangka Menengah (3 - 6 Bulan):"),
          ...data.recommendations.jangkaMenengah.map(r => bullet(`• ${r}`)),

          heading3("Prioritas Jangka Panjang (6 - 12 Bulan):"),
          ...data.recommendations.jangkaPanjang.map(r => bullet(`• ${r}`)),

          p(`\n${data.pengesahan.kota || 'Sukabumi'}, ${data.pengesahan.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: AlignmentType.RIGHT, bold: true, spaceBefore: 240, spaceAfter: 180 }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      p("Mengetahui,", { align: AlignmentType.CENTER, bold: true }),
                      p(data.pengesahan.direkturJabatan || 'Direktur Utama Rumah Sakit', { align: AlignmentType.CENTER }),
                      p("\n\n\n\n", { align: AlignmentType.CENTER }),
                      p(data.pengesahan.direkturNama || 'dr. H. Ahmad Wijaya', { align: AlignmentType.CENTER, bold: true }),
                      p(`NIP / ID: ${data.pengesahan.direkturNip || '19780512 200501 1 002'}`, { align: AlignmentType.CENTER, size: 18, color: "64748B" }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [
                      p("Disiapkan oleh,", { align: AlignmentType.CENTER, bold: true }),
                      p(data.pengesahan.penanggungJawabJabatan || 'Ketua Komite Mutu & Keselamatan Pasien', { align: AlignmentType.CENTER }),
                      p("\n\n\n\n", { align: AlignmentType.CENTER }),
                      p(data.pengesahan.penanggungJawabNama || 'dr. Budi Santoso', { align: AlignmentType.CENTER, bold: true }),
                      p(`NIP / ID: ${data.pengesahan.penanggungJawabNip || '19820315 200804 1 005'}`, { align: AlignmentType.CENTER, size: 18, color: "64748B" }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Laporan_Survei_Budaya_Keselamatan_Pasien_${data.namaRs.replace(/\s+/g, '_')}_${data.tahun}.docx`);
}
