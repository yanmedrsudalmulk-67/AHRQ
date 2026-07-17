'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Save, 
  Sparkles, 
  ClipboardCheck, 
  Users, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  CheckCircle2, 
  User, 
  MapPin, 
  MessageSquare, 
  Check, 
  TrendingUp, 
  FileText,
  AlertCircle,
  Clock,
  Database,
  CloudLightning,
  ShieldAlert,
  ArrowRight,
  X,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSupabaseConnected } from '../lib/supabase';

interface RippleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'style'> {
  isSelected?: boolean;
  shakeOnHover?: boolean;
}

const RippleButton: React.FC<RippleButtonProps> = ({ 
  onClick, 
  className, 
  isSelected, 
  shakeOnHover,
  children, 
  ...props 
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2.5;
      const newRipple = { x, y, size, id: Date.now() + Math.random() };
      setRipples((prev) => [...prev, newRipple]);
    }
    if (onClick) {
      onClick(e);
    }
  };

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.filter((r) => Date.now() - r.id < 600));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <motion.button
      ref={buttonRef as any}
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
      whileHover={shakeOnHover ? {
        y: -4,
        rotate: [0, -0.6, 0.6, -0.6, 0],
        transition: { duration: 0.3, ease: "easeInOut" }
      } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className={`relative overflow-hidden ${className || ''}`}
      {...props}
    >
      <span className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        {children}
      </span>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.1, 0.8, 0.3, 1] }}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.45)' : 'rgba(16, 185, 129, 0.3)',
            width: ripple.size,
            height: ripple.size,
            top: ripple.y - ripple.size / 2,
            left: ripple.x - ripple.size / 2,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}
    </motion.button>
  );
};

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: number }; // Scores 1-5
}

interface InputDataTabProps {
  currentRsName: string;
  onSaveSurvey: (survey: SurveyData) => Promise<any> | void;
}

const DIMENSI_AHRQ = [
  { id: 'd7', nama: 'Komunikasi tentang Kesalahan', desc: 'Sejauh mana staf diberi tahu tentang kesalahan yang terjadi di unit, dan mendiskusikan cara mencegahnya.' },
  { id: 'd6', nama: 'Keterbukaan Komunikasi', desc: 'Staf bebas berbicara jika melihat sesuatu yang dapat berdampak buruk pada pasien dan berani bertanya kepada atasan.' },
  { id: 'd10', nama: 'Serah Terima Pasien & Pertukaran Informasi', desc: 'Pemberian informasi penting tentang perawatan pasien yang hilang atau terdistorsi saat pergantian shift atau transfer unit.' },
  { id: 'd9', nama: 'Dukungan Manajemen RS terhadap Keselamatan Pasien', desc: 'Manajemen rumah sakit menciptakan iklim kerja yang memprioritaskan keselamatan pasien di atas target lainnya.' },
  { id: 'd3', nama: 'Pembelajaran Organisasi & Peningkatan Berkelanjutan', desc: 'Sejauh mana kesalahan mengarah pada perubahan positif dan efektivitas perubahan dievaluasi.' },
  { id: 'd8', nama: 'Frekuensi Pelaporan Kejadian Keselamatan Pasien', desc: 'Sejauh mana jenis kesalahan tertentu dilaporkan, baik sebelum berdampak pada pasien maupun sesudahnya.' },
  { id: 'd4', nama: 'Respon terhadap Kesalahan secara Non-Punitif', desc: 'Staf merasa bahwa kesalahan tidak digunakan untuk menyalahkan atau menghukum mereka secara pribadi.' },
  { id: 'd2', nama: 'Ketenagaan dan Beban Kerja', desc: 'Kecukupan jumlah staf untuk menangani beban kerja dan apakah jam kerja sesuai untuk keselamatan pasien.' },
  { id: 'd5', nama: 'Dukungan Supervisor/Manajer untuk Keselamatan', desc: 'Sejauh mana supervisor mengapresiasi staf karena mengikuti prosedur keselamatan dan tidak mendesak penyelesaian tugas dengan mengabaikan keselamatan.' },
  { id: 'd1', nama: 'Kerjasama Tim', desc: 'Sejauh mana staf bekerja sama, saling mendukung, dan memperlakukan satu sama lain dengan hormat.' },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Sangat Tidak Setuju' },
  { value: 2, label: 'Tidak Setuju' },
  { value: 3, label: 'Netral' },
  { value: 4, label: 'Setuju' },
  { value: 5, label: 'Sangat Setuju' },
  { value: 9, label: 'Tidak Berlaku / Tidak Tahu' },
];

const FREQUENCY_OPTIONS = [
  { value: 1, label: 'Tidak Pernah' },
  { value: 2, label: 'Jarang' },
  { value: 3, label: 'Kadang-kadang' },
  { value: 4, label: 'Hampir Selalu' },
  { value: 5, label: 'Selalu' },
  { value: 9, label: 'Tidak Berlaku / Tidak Tahu' },
];

const STAFF_POSITIONS = {
  'Keperawatan': [
    { value: '1', label: 'Perawat Praktik Lanjutan (NP, CRNA, CNS, CNM)' },
    { value: '2', label: 'Perawat Kejuruan Berlisensi (LVN), Perawat Praktik Berlisensi (LPN)' },
    { value: '3', label: 'Pembantu Perawatan Pasien, Pembantu Rumah Sakit, Asisten Perawat' },
    { value: '4', label: 'Perawat Terdaftar (RN)' }
  ],
  'Medis': [
    { value: '5', label: 'Asisten Dokter' },
    { value: '6', label: 'Residen, Peserta Magang' },
    { value: '7', label: 'Dokter, Perawat, Perawat Rumah Sakit' }
  ],
  'Posisi Klinis Lainnya': [
    { value: '8', label: 'Ahli Gizi' },
    { value: '9', label: 'Apoteker, Teknisi Farmasi' },
    { value: '10', label: 'Terapis Fisik, Okupasi, atau Wicara' },
    { value: '11', label: 'Psikolog' },
    { value: '12', label: 'Terapis Pernapasan' },
    { value: '13', label: 'Pekerja Sosial' },
    { value: '14', label: 'Ahli Teknologi, Teknisi (mis. EKG, Laboratorium, Radiologi)' }
  ],
  'Supervisor & Manajemen': [
    { value: '15', label: 'Supervisor, Manajer, Manajer Departemen, Pemimpin Klinis, Administrator, Direktur' },
    { value: '16', label: 'Pemimpin Senior, Executive, C-Suite' }
  ],
  'Dukungan': [
    { value: '17', label: 'Fasilitas' },
    { value: '18', label: 'Layanan Makanan' },
    { value: '19', label: 'Rumah Tangga, Layanan Lingkungan' },
    { value: '20', label: 'Teknologi Informasi, Layanan Informasi Kesehatan, Informatika Klinis' },
    { value: '21', label: 'Keamanan' },
    { value: '22', label: 'Pengangkut' },
    { value: '23', label: 'Petugas Unit, Sekretaris, Resepsionis, Staf Kantor' }
  ],
  'Lainnya': [
    { value: '24', label: 'Lainnya' }
  ]
};

const WORK_UNITS = {
  'Beberapa Unit / Tidak Khusus': [
    { value: '1', label: 'Banyak unit rumah sakit yang berbeda, Tidak ada unit khusus' }
  ],
  'Unit Medis/Bedah': [
    { value: '2', label: 'Unit Medis/Bedah Gabungan' },
    { value: '3', label: 'Unit Medis (Non-Bedah)' },
    { value: '4', label: 'Unit Bedah' }
  ],
  'Unit Perawatan Pasien': [
    { value: '5', label: 'Kardiologi' },
    { value: '6', label: 'Unit Gawat Darurat, Observasi, Rawat Inap' },
    { value: '7', label: 'Gastroenterologi' },
    { value: '8', label: 'ICU (Semua Tipe Dewasa)' },
    { value: '9', label: 'Persalinan & Persalinan, Kebidanan & Kandungan' },
    { value: '10', label: 'Onkologi, Hematologi' },
    { value: '11', label: 'Pediatri (termasuk NICU, PICU)' },
    { value: '12', label: 'Psikiatri, Kesehatan Perilaku' },
    { value: '13', label: 'Pulmonologi' },
    { value: '14', label: 'Rehabilitasi, Pengobatan Fisik' },
    { value: '15', label: 'Telemetri' }
  ],
  'Layanan Bedah': [
    { value: '16', label: 'Anestesiologi' },
    { value: '17', label: 'Endoskopi, Kolonoskopi' },
    { value: '18', label: 'Pra Operasi, Ruang Operasi/Suite, PACU/Pasca Operasi, Peri Operasi' }
  ],
  'Layanan Klinis': [
    { value: '19', label: 'Patologi, Laboratorium' },
    { value: '20', label: 'Farmasi' },
    { value: '21', label: 'Radiologi, Pencitraan' },
    { value: '22', label: 'Terapi Pernapasan' },
    { value: '23', label: 'Layanan Sosial, Manajemen Kasus, Perencanaan Pemulangan' }
  ],
  'Administrasi & Manajemen': [
    { value: '24', label: 'Administrasi, Manajemen' },
    { value: '25', label: 'Layanan Keuangan, Penagihan' },
    { value: '26', label: 'Sumber Daya Manusia, Pelatihan' },
    { value: '27', label: 'Teknologi Informasi, Manajemen Informasi Kesehatan, Informatika Klinis' },
    { value: '28', label: 'Kualitas, Manajemen Risiko, Keselamatan Pasien' }
  ],
  'Layanan Dukungan': [
    { value: '29', label: 'Penerimaan/Pendaftaran' },
    { value: '30', label: 'Layanan Makanan, Diet' },
    { value: '31', label: 'Rumah Tangga, Layanan Lingkungan, Fasilitas' },
    { value: '32', label: 'Layanan Keamanan' },
    { value: '33', label: 'Transportasi' }
  ],
  'Lainnya': [
    { value: '34', label: 'Lainnya' }
  ]
};

const getFeedbackCategory = (val: number | undefined, isReversed: boolean = false) => {
  if (val === undefined || val === 9) return 'none';
  if (!isReversed) {
    if (val >= 4) return 'positive';
    if (val === 3) return 'neutral';
    return 'negative';
  } else {
    if (val <= 2) return 'positive';
    if (val === 3) return 'neutral';
    return 'negative';
  }
};

export default function InputDataTab({ currentRsName, onSaveSurvey }: InputDataTabProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [step, setStep] = useState(0); // 0: Identitas, 1-8: Bagian A-H, 9: Review, 10: Success
  const [responderName, setResponderName] = useState('');
  const [posisiStaf, setPosisiStaf] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  
  // Custom Select Modals
  const [isPosisiModalOpen, setIsPosisiModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  
  // Answers states
  const [ansA, setAnsA] = useState<{ [key: number]: number }>({});
  const [ansB, setAnsB] = useState<{ [key: number]: number }>({});
  const [ansC, setAnsC] = useState<{ [key: number]: number }>({});
  const [ansD, setAnsD] = useState<{ 1?: number; 2?: number; 3?: string }>({});
  const [ansE, setAnsE] = useState<number | undefined>(undefined);
  const [ansF, setAnsF] = useState<{ [key: number]: number }>({});
  const [ansG, setAnsG] = useState<{ 1?: string; 2?: string; 3?: string; 4?: string }>({});
  const [komentar, setKomentar] = useState('');

  // Auto-save notification state
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltipId, setShowTooltipId] = useState<string | null>(null);

  // Derived safe key for local storage namespacing
  const draftKey = `sops_survey_draft_${(currentRsName || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // References for smooth scrolling
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const STATEMENTS_A = [
    { id: 1, code: 'A1', text: 'Di unit ini, kami bekerja sama sebagai tim yang efektif', dim: 'd1' },
    { id: 2, code: 'A2', text: 'Di unit ini, kami memiliki staf yang cukup untuk menangani beban kerja', dim: 'd2' },
    { id: 3, code: 'A3', text: 'Staf di unit ini bekerja lebih lama dari waktu terbaik untuk perawatan pasien', dim: 'd2', isReversed: true },
    { id: 4, code: 'A4', text: 'Unit ini meninjau prosedur kerja secara berkala untuk menentukan apakah diperlukan perubahan untuk meningkatkan keselamatan pasien', dim: 'd3' },
    { id: 5, code: 'A5', text: 'Unit ini terlalu bergantung pada staf sementara, pengganti, atau panggilan', dim: 'd2', isReversed: true },
    { id: 6, code: 'A6', text: 'Di unit ini, staf merasa bahwa kesalahan yang terjadi dianggap sebagai kesalahan mereka sendiri', dim: 'd4', isReversed: true },
    { id: 7, code: 'A7', text: 'Ketika sebuah insiden dilaporkan di unit ini, rasanya seperti orangnya yang ditulis, bukan masalahnya', dim: 'd4', isReversed: true },
    { id: 8, code: 'A8', text: 'Selama saat sibuk, staf di unit ini saling membantu satu sama lain', dim: 'd1' },
    { id: 9, code: 'A9', text: 'Di unit ini, ada staf yang memiliki perilaku tidak menyenangkan dalam bekerja', dim: 'd1', isReversed: true },
    { id: 10, code: 'A10', text: 'Ketika staf melakukan kesalahan, unit ini berfokus pada pembelajaran daripada menyalahkan secara personal', dim: 'd4' },
    { id: 11, code: 'A11', text: 'Kecepatan kerja di unit ini sangat terburu-buru sehingga berdampak negatif pada keselamatan pasien', dim: 'd2', isReversed: true },
    { id: 12, code: 'A12', text: 'Di unit ini, setiap perubahan untuk meningkatkan keselamatan pasien dilakukan evaluasi, untuk melihat seberapa baik perubahan tersebut bekerja', dim: 'd3' },
    { id: 13, code: 'A13', text: 'Di unit ini, dukungan bagi staf yang terlibat dalam kesalahan keselamatan pasien masih kurang', dim: 'd4', isReversed: true },
    { id: 14, code: 'A14', text: 'Di unit ini, masalah keselamatan pasien yang sama memungkinkan dapat terus terjadi', dim: 'd4', isReversed: true }
  ];

  const STATEMENTS_B = [
    { id: 1, code: 'B1', text: 'Atasan, manajer, atau pemimpin klinis saya secara serius mempertimbangkan saran dari staf untuk meningkatkan keselamatan pasien', dim: 'd5' },
    { id: 2, code: 'B2', text: 'Atasan, manajer, atau pemimpin klinis saya menginginkan kita bekerja lebih cepat saat waktu sibuk, bahkan jika itu berarti mengambil jalan pintas', dim: 'd5', isReversed: true },
    { id: 3, code: 'B3', text: 'Atasan, manajer, atau pemimpin klinis saya mengambil tindakan untuk mengatasi masalah keselamatan pasien yang menjadi perhatian mereka', dim: 'd5' }
  ];

  const STATEMENTS_C = [
    { id: 1, code: 'C1', text: 'Kami diberi informasi tentang kesalahan yang terjadi pada unit ini', dim: 'd7' },
    { id: 2, code: 'C2', text: 'Ketika kesalahan terjadi pada unit ini, kami mendiskusikan cara-cara untuk mencegahnya terjadi lagi', dim: 'd7' },
    { id: 3, code: 'C3', text: 'Di unit ini, kami diberi tahu tentang perubahan yang dibuat berdasarkan laporan kejadian', dim: 'd7' },
    { id: 4, code: 'C4', text: 'Di unit ini, staf angkat bicara jika mereka melihat sesuatu yang dapat berdampak negatif terhadap perawatan pasien', dim: 'd6' },
    { id: 5, code: 'C5', text: 'Ketika staf di unit ini melihat seseorang yang memiliki wewenang lebih besar melakukan sesuatu yang tidak aman bagi pasien, mereka berani angkat bicara', dim: 'd6' },
    { id: 6, code: 'C6', text: 'Ketika staf di unit ini angkat bicara, mereka yang memiliki wewenang lebih besar akan terbuka terhadap masalah keselamatan pasien mereka', dim: 'd6' },
    { id: 7, code: 'C7', text: 'Di unit ini, staf takut untuk bertanya ketika ada sesuatu yang tidak beres', dim: 'd6', isReversed: true }
  ];

  const STATEMENTS_F = [
    { id: 1, code: 'F1', text: 'Tindakan manajemen rumah sakit menunjukkan bahwa keselamatan pasien adalah prioritas utama', dim: 'd9' },
    { id: 2, code: 'F2', text: 'Manajemen rumah sakit menyediakan sumber daya yang memadai untuk meningkatkan keselamatan pasien', dim: 'd9' },
    { id: 3, code: 'F3', text: 'Manajemen rumah sakit tampaknya hanya tertarik pada keselamatan pasien setelah kejadian tidak diharapkan terjadi', dim: 'd9', isReversed: true },
    { id: 4, code: 'F4', text: 'Ketika memindahkan pasien dari satu unit ke unit lain, informasi penting sering kali terlewatkan', dim: 'd10', isReversed: true },
    { id: 5, code: 'F5', text: 'Selama pergantian shift, informasi perawatan pasien yang penting sering terlewatkan', dim: 'd10', isReversed: true },
    { id: 6, code: 'F6', text: 'Selama pergantian shift, ada waktu yang memadai untuk bertukar semua informasi penting tentang perawatan pasien', dim: 'd10' }
  ];

  const SECTIONS = [
    { id: 0, label: 'Identitas', key: 'identitas' },
    { id: 1, label: 'Bagian A', key: 'A', title: 'Unit / Area Kerja Anda', desc: 'Seberapa jauh Anda setuju dengan pernyataan berikut tentang unit/area kerja utama Anda?' },
    { id: 2, label: 'Bagian B', key: 'B', title: 'Supervisor / Manajer Anda', desc: 'Pernyataan mengenai atasan langsung, manajer, atau pemimpin klinis Anda.' },
    { id: 3, label: 'Bagian C', key: 'C', title: 'Komunikasi', desc: 'Seberapa sering hal-hal berikut terjadi di unit atau area kerja Anda?' },
    { id: 4, label: 'Bagian D', key: 'D', title: 'Pelaporan Kejadian Keselamatan', desc: 'Kejadian dan pelaporan insiden keselamatan pasien di unit Anda.' },
    { id: 5, label: 'Bagian E', key: 'E', title: 'Peringkat Keselamatan Pasien', desc: 'Bagaimana Anda menilai unit/area kerja Anda dalam hal keselamatan pasien?' },
    { id: 6, label: 'Bagian F', key: 'F', title: 'Rumah Sakit Anda', desc: 'Seberapa jauh Anda setuju dengan kondisi fasyankes rumah sakit secara menyeluruh?' },
    { id: 7, label: 'Bagian G', key: 'G', title: 'Latar Belakang', desc: 'Informasi demografis dan lama bekerja untuk analisis orisinalitas.' },
    { id: 8, label: 'Bagian H', key: 'H', title: 'Komentar Anda', desc: 'Tuliskan masukan atau ulasan konstruktif demi kemajuan budaya keselamatan.' },
    { id: 9, label: 'Review', key: 'review' }
  ];



  // Automatically scroll to the top of the page / container when step changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const mains = document.getElementsByTagName('main');
      for (let i = 0; i < mains.length; i++) {
        mains[i].scrollTo({ top: 0, behavior: 'smooth' });
      }

      const wrapper = document.getElementById('survey-main-wrapper');
      if (wrapper) {
        wrapper.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [step]);

  // Save draft whenever answers change
  const triggerAutoSave = (data: any) => {};

  // Auto-scroll to next question helper
  const scrollToQuestion = (nextId: string) => {
    setTimeout(() => {
      const element = questionRefs.current[nextId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 450);
  };

  // Questionnaire counters
  const totalQuestions = 39;
  const getAnsweredCount = () => {
    let count = 0;
    count += Object.keys(ansA).length;
    count += Object.keys(ansB).length;
    count += Object.keys(ansC).length;
    count += (ansD[1] ? 1 : 0) + (ansD[2] ? 1 : 0) + (ansD[3] ? 1 : 0);
    count += ansE ? 1 : 0;
    count += Object.keys(ansF).length;
    count += (ansG[1] ? 1 : 0) + (ansG[2] ? 1 : 0) + (ansG[3] ? 1 : 0) + (ansG[4] ? 1 : 0);
    count += komentar.trim() ? 1 : 0;
    return count;
  };

  const answeredCount = getAnsweredCount();
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const getProgressGradient = () => {
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    
    STATEMENTS_A.forEach(st => {
      const ans = ansA[st.id];
      const cat = getFeedbackCategory(ans, st.isReversed);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    });
    
    STATEMENTS_B.forEach(st => {
      const ans = ansB[st.id];
      const cat = getFeedbackCategory(ans, st.isReversed);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    });

    STATEMENTS_C.forEach(st => {
      const ans = ansC[st.id];
      const cat = getFeedbackCategory(ans, st.isReversed);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    });

    if (ansD[1]) {
      const cat = getFeedbackCategory(ansD[1], false);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    }
    if (ansD[2]) {
      const cat = getFeedbackCategory(ansD[2], false);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    }

    if (ansE) {
      const cat = getFeedbackCategory(ansE, false);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    }

    STATEMENTS_F.forEach(st => {
      const ans = ansF[st.id];
      const cat = getFeedbackCategory(ans, st.isReversed);
      if (cat === 'positive') positiveCount++;
      else if (cat === 'neutral') neutralCount++;
      else if (cat === 'negative') negativeCount++;
    });

    const total = positiveCount + neutralCount + negativeCount;
    if (total === 0) {
      return 'from-emerald-500 to-teal-400';
    }

    if (positiveCount > neutralCount && positiveCount > negativeCount) {
      return 'from-emerald-500 via-teal-400 to-cyan-500';
    } else if (neutralCount > positiveCount && neutralCount > negativeCount) {
      return 'from-amber-500 via-yellow-400 to-orange-500';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      return 'from-rose-500 via-red-500 to-orange-500';
    }
    
    return 'from-emerald-500 via-teal-400 to-cyan-500';
  };

  // Scoring mapping helper
  const computeScores = () => {
    const getVal = (v: number | undefined, isReversed = false) => {
      if (v === undefined || v === 9) return null;
      return isReversed ? 6 - v : v;
    };

    const getAverage = (values: (number | null)[]) => {
      const valid = values.filter((v): v is number => v !== null);
      if (valid.length === 0) return 3; // neutral default
      const sum = valid.reduce((a, b) => a + b, 0);
      return Math.round((sum / valid.length) * 10) / 10;
    };

    return {
      d1: getAverage([getVal(ansA[1]), getVal(ansA[8]), getVal(ansA[9], true)]),
      d2: getAverage([getVal(ansA[2]), getVal(ansA[3], true), getVal(ansA[5], true), getVal(ansA[11], true)]),
      d3: getAverage([getVal(ansA[4]), getVal(ansA[12])]),
      d4: getAverage([getVal(ansA[6], true), getVal(ansA[7], true), getVal(ansA[10])]),
      d5: getAverage([getVal(ansB[1]), getVal(ansB[2], true), getVal(ansB[3])]),
      d6: getAverage([getVal(ansC[4]), getVal(ansC[5]), getVal(ansC[6]), getVal(ansC[7], true)]),
      d7: getAverage([getVal(ansC[1]), getVal(ansC[2]), getVal(ansC[3])]),
      d8: getAverage([getVal(ansD[1]), getVal(ansD[2])]),
      d9: getAverage([getVal(ansF[1]), getVal(ansF[2]), getVal(ansF[3], true)]),
      d10: getAverage([getVal(ansF[4], true), getVal(ansF[5], true), getVal(ansF[6])]),
    };
  };

  const handleSelectOption = (section: string, id: number, val: number) => {
    if (section === 'A') {
      const updated = { ...ansA, [id]: val };
      setAnsA(updated);
      triggerAutoSave({ ansA: updated });
      scrollToQuestion(`A-${id + 1}`);
    } else if (section === 'B') {
      const updated = { ...ansB, [id]: val };
      setAnsB(updated);
      triggerAutoSave({ ansB: updated });
      scrollToQuestion(`B-${id + 1}`);
    } else if (section === 'C') {
      const updated = { ...ansC, [id]: val };
      setAnsC(updated);
      triggerAutoSave({ ansC: updated });
      scrollToQuestion(`C-${id + 1}`);
    } else if (section === 'F') {
      const updated = { ...ansF, [id]: val };
      setAnsF(updated);
      triggerAutoSave({ ansF: updated });
      scrollToQuestion(`F-${id + 1}`);
    }
  };

  const handleSelectD = (id: number, val: number) => {
    const updated = { ...ansD, [id]: val };
    setAnsD(updated);
    triggerAutoSave({ ansD: updated });
    scrollToQuestion(`D-${id + 1}`);
  };

  const handleSelectD3 = (val: string) => {
    const updated = { ...ansD };
    if (updated[3] === val) delete updated[3]; else updated[3] = val;
    setAnsD(updated);
    triggerAutoSave({ ansD: updated });
    if (updated[3]) scrollToQuestion('E-1');
  };

  const handleSelectE = (val: number) => {
    const updatedVal = ansE === val ? undefined : val;
    setAnsE(updatedVal);
    triggerAutoSave({ ansE: updatedVal });
    if (updatedVal) scrollToQuestion('F-1');
  };

  const handleSelectG = (id: number, val: string) => {
    const updated = { ...ansG } as any;
    if (updated[id] === val) delete updated[id]; else updated[id] = val;
    setAnsG(updated);
    triggerAutoSave({ ansG: updated });
    if (updated[id]) scrollToQuestion(`G-${id + 1}`);
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleRandomize = () => {
    // Quick populator
    const randomAnsA: { [key: number]: number } = {};
    STATEMENTS_A.forEach(s => {
      randomAnsA[s.id] = Math.random() > 0.35 ? (Math.random() > 0.5 ? 5 : 4) : 3;
    });
    const randomAnsB: { [key: number]: number } = {};
    STATEMENTS_B.forEach(s => {
      randomAnsB[s.id] = Math.random() > 0.3 ? 4 : 5;
    });
    const randomAnsC: { [key: number]: number } = {};
    STATEMENTS_C.forEach(s => {
      randomAnsC[s.id] = Math.random() > 0.4 ? 4 : 5;
    });
    const randomAnsF: { [key: number]: number } = {};
    STATEMENTS_F.forEach(s => {
      randomAnsF[s.id] = Math.random() > 0.3 ? 4 : 5;
    });

    const updated = {
      responderName: 'Dr. Wahyu Pratama, Sp.PD',
      posisiStaf: 'Dokter, Perawat, Perawat Rumah Sakit',
      unitKerja: 'Unit Gawat Darurat, Observasi, Rawat Inap',
      ansA: randomAnsA,
      ansB: randomAnsB,
      ansC: randomAnsC,
      ansD: { 1: 4, 2: 5, 3: '3 sampai 5' },
      ansE: 4,
      ansF: randomAnsF,
      ansG: {
        1: '1 hingga 5 tahun',
        2: '1 hingga 5 tahun',
        3: '30 hingga 40 jam per minggu',
        4: 'YA, saya melakukan interaksi atau kontak langsung dengan pasien'
      },
      komentar: 'Sistem evaluasi keselamatan terstruktur dengan sangat baik. Perlu pengawasan berkala terkait sirkulasi informasi serah terima.',
    };

    setResponderName(updated.responderName);
    setPosisiStaf(updated.posisiStaf);
    setUnitKerja(updated.unitKerja);
    setAnsA(updated.ansA);
    setAnsB(updated.ansB);
    setAnsC(updated.ansC);
    setAnsD(updated.ansD);
    setAnsE(updated.ansE);
    setAnsF(updated.ansF);
    setAnsG(updated.ansG);
    setKomentar(updated.komentar);
    setStep(9); // Directly to review
    triggerAutoSave(updated);
  };

  const handleResetForm = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan draf survei aktif?')) {
      setResponderName('');
      setPosisiStaf('');
      setUnitKerja('');
      setAnsA({});
      setAnsB({});
      setAnsC({});
      setAnsD({});
      setAnsE(undefined);
      setAnsF({});
      setAnsG({});
      setKomentar('');
      setStep(0);
      if (typeof window !== 'undefined') {
        
      }
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    // Simulate real cloud sync with Supabase / local
    const finalScores = computeScores();
    const finalSurvey: SurveyData = {
      id: 'srv_' + Date.now(),
      namaRs: currentRsName,
      unitKerja: unitKerja || 'Instansi Umum',
      jumlahResponden: 1,
      tanggalInput: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      dimensiScores: {
        ...finalScores,
        _rawAnswers: {
          ansA,
          ansB,
          ansC,
          ansD,
          ansE,
          ansF,
          ansG,
          posisiStaf,
          unitKerja,
          namaRs: currentRsName,
          tanggalInput: new Date().toISOString()
        }
      } as any
    };

    try {
      await onSaveSurvey(finalSurvey);
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setStep(10); // Success step
      if (typeof window !== 'undefined') {
        
      }
    } catch (err) {
      console.error("Kesalahan menyimpan kuesioner:", err);
      // Fallback: make sure we still proceed but notify
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setStep(10);
      if (typeof window !== 'undefined') {
        
      }
    }
  };

  // Verification helper for highlight border
  const isQuestionUnanswered = (section: string, id: number) => {
    if (section === 'A') return !ansA[id];
    if (section === 'B') return !ansB[id];
    if (section === 'C') return !ansC[id];
    if (section === 'F') return !ansF[id];
    return false;
  };

  return (
    <div id="survey-main-wrapper" className="bg-transparent text-slate-200 min-h-screen rounded-3xl border border-[#00244d]/30 overflow-hidden shadow-xl flex flex-col font-sans">
      
      {/* 1. STICKY HEADER */}
      <header id="survey-sticky-header" className="sticky top-0 bg-[#0c1a36]/75 backdrop-blur-sm border-b border-[#00244d]/40 py-4 px-6 md:px-8 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-100 leading-tight">Formulir Survei Budaya Keselamatan Pasien</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">AHRQ Hospital Survey on Patient Safety Culture Version 2.0</p>
          </div>
        </div>

        <div>
          {/* Mini Auto save check */}
          <AnimatePresence>
            {autoSavePulse && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* 2. ELEGANT HORIZONTAL PROGRESS BAR */}
      <div id="survey-horizontal-progress" className="bg-[#0c1a36]/60 backdrop-blur-sm border-b border-[#00244d]/40 px-6 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progres Pengisian Kuesioner</span>
          <span className="text-xs font-extrabold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{progressPercent}%</span>
          <span className="text-xs font-medium text-slate-400">({answeredCount} dari {totalQuestions} Pertanyaan Terjawab)</span>
        </div>
        <div className="w-full sm:w-80 bg-[#020918]/55 h-2 rounded-full overflow-hidden relative">
          <div 
            className={`bg-gradient-to-r ${getProgressGradient()} h-full rounded-full transition-all transform-gpu duration-500`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main content layout (Centered and Elegant) */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* CENTERED COMPONENT / WIZARD SCREEN */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header card for the current section */}
              {step > 0 && step < 9 && (
                <div className="bg-[#0c1a36]/70 backdrop-blur-sm rounded-3xl border border-[#00244d]/40 p-8 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-700 text-xs font-extrabold rounded-full tracking-wide">
                    {SECTIONS[step].label}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-100">{SECTIONS[step].title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{SECTIONS[step].desc}</p>
                </div>
              )}

              {/* STEP 0: IDENTITAS */}
              {step === 0 && (
                <div className="space-y-6">
                  {/* PETUNJUK CARD (PREMIUM & MODERN) */}
                  <div className="bg-[#0c1a36]/40 backdrop-blur-sm rounded-3xl border border-[#00244d]/30 p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-cyan-500/80 animate-pulse" />
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shadow-inner">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase font-mono">INFORMASI SURVEI</span>
                        <h2 className="text-xl font-bold text-slate-100">Petunjuk Pengisian</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      Survei ini meminta pendapat Anda tentang masalah keselamatan pasien, kesalahan medis, dan pelaporan kejadian di rumah sakit Anda dan akan memakan waktu sekitar 10-15 menit untuk menyelesaikannya. Jika ada pertanyaan yang tidak berlaku untuk Anda atau rumah sakit Anda atau Anda tidak tahu jawabannya, silakan pilih <span className="text-emerald-400 font-semibold">{`"Tidak Berlaku atau Tidak Tahu."`}</span>
                    </p>

                    {/* DEFINITION BOX (OUTLINED, PREMIUM GLOW) */}
                    <div className="border border-[#00244d]/30 bg-[#020918]/60 rounded-2xl p-5 md:p-6 space-y-4 shadow-inner relative">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-md" />
                        <p className="text-xs text-slate-300 leading-relaxed font-light">
                          <span className="text-emerald-400 font-bold underline decoration-emerald-500/30 underline-offset-4">{`"Keselamatan pasien"`}</span> didefinisikan sebagai penghindaran and pencegahan cedera pasien atau kejadian yang tidak diinginkan yang diakibatkan oleh proses pemberian layanan kesehatan.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-md" />
                        <p className="text-xs text-slate-300 leading-relaxed font-light">
                          <span className="text-emerald-400 font-bold underline decoration-emerald-500/30 underline-offset-4">{`"Kejadian keselamatan pasien"`}</span> didefinisikan sebagai segala jenis kesalahan, kekeliruan, atau insiden yang berhubungan dengan perawatan kesehatan, terlepas dari apakah hal tersebut mengakibatkan cedera pada pasien atau tidak.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* IDENTIFIKASI PROFIL RESPONDEN */}
                  <div
                    className={`backdrop-blur-sm rounded-3xl border p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                      posisiStaf && unitKerja 
                        ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-400 tracking-wider font-mono">STEP 1</span>
                      <h2 className="text-2xl font-bold text-slate-100">Identifikasi Profil Responden</h2>
                      <p className="text-xs text-slate-400">Silakan masukkan identitas opsional Anda sebelum melangkah ke lembar kuesioner utama AHRQ.</p>
                    </div>

                    <hr className="border-[#00244d]/30" />

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-500" /> Posisi Staf Anda di Rumah Sakit
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsPosisiModalOpen(true)}
                            className="w-full bg-[#020918]/60 border border-[#00244d]/40 rounded-xl px-4 py-3.5 text-sm text-left transition-all transform-gpu outline-none flex items-center justify-between hover:bg-[#0c1a36]/50 backdrop-blur-sm"
                          >
                            <span className={posisiStaf ? 'text-slate-100' : 'text-slate-400'}>{posisiStaf || 'Pilih Posisi Anda'}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-500" /> Unit / Area Kerja Utama Anda
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsUnitModalOpen(true)}
                            className="w-full bg-[#020918]/60 border border-[#00244d]/40 rounded-xl px-4 py-3.5 text-sm text-left transition-all transform-gpu outline-none flex items-center justify-between hover:bg-[#0c1a36]/50 backdrop-blur-sm"
                          >
                            <span className={unitKerja ? 'text-slate-100' : 'text-slate-400'}>{unitKerja || 'Pilih Unit / Area Kerja'}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <RippleButton
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={!posisiStaf || !unitKerja}
                        className={`px-6 py-3.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all transform-gpu ${
                          posisiStaf && unitKerja 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer' 
                            : 'bg-[#020918]/40 text-slate-500 cursor-not-allowed border border-[#00244d]/20'
                        }`}
                      >
                        Mulai Pengisian Kuesioner <ArrowRight className="w-4 h-4" />
                      </RippleButton>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: BAGIAN A */}
              {step === 1 && (
                <div className="space-y-6">
                  {STATEMENTS_A.map((st) => {
                    const ans = ansA[st.id];
                    const category = getFeedbackCategory(ans, st.isReversed);
                    return (
                      <div
                        key={st.id}
                        ref={(el) => { questionRefs.current[`A-${st.id}`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>{st.code}</span>
                            
                            {/* Hover tooltip for dimension */}
                            <div className="relative group">
                              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-500/20/50 cursor-pointer">
                                {DIMENSI_AHRQ.find(d => d.id === st.dim)?.nama || 'Dimensi'}
                              </span>
                              
                              {/* Tooltip text bubble */}
                              <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 leading-relaxed">
                                <span className="font-bold block mb-1">{DIMENSI_AHRQ.find(d => d.id === st.dim)?.nama}</span>
                                {DIMENSI_AHRQ.find(d => d.id === st.dim)?.desc}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200 leading-relaxed">{st.text}</p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {LIKERT_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, st.isReversed);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectOption('A', st.id, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: BAGIAN B */}
              {step === 2 && (
                <div className="space-y-6">
                  {STATEMENTS_B.map((st) => {
                    const ans = ansB[st.id];
                    const category = getFeedbackCategory(ans, st.isReversed);
                    return (
                      <div
                        key={st.id}
                        ref={(el) => { questionRefs.current[`B-${st.id}`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>{st.code}</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-500/20/50">
                              {DIMENSI_AHRQ.find(d => d.id === st.dim)?.nama || 'Dimensi'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200 leading-relaxed">{st.text}</p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {LIKERT_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, st.isReversed);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectOption('B', st.id, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 3: BAGIAN C */}
              {step === 3 && (
                <div className="space-y-6">
                  {STATEMENTS_C.map((st) => {
                    const ans = ansC[st.id];
                    const category = getFeedbackCategory(ans, st.isReversed);
                    return (
                      <div
                        key={st.id}
                        ref={(el) => { questionRefs.current[`C-${st.id}`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>{st.code}</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-500/20/50">
                              {DIMENSI_AHRQ.find(d => d.id === st.dim)?.nama || 'Dimensi'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200 leading-relaxed">{st.text}</p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {FREQUENCY_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, st.isReversed);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectOption('C', st.id, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 4: BAGIAN D */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* D1 */}
                  {(() => {
                    const ans = ansD[1];
                    const category = getFeedbackCategory(ans, false);
                    return (
                      <div
                        ref={(el) => { questionRefs.current[`D-1`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>D1</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Pelaporan Kejadian</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200">Ketika kesalahan diketahui dan diperbaiki sebelum sampai ke pasien, seberapa sering hal ini dilaporkan?</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {FREQUENCY_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, false);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectD(1, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* D2 */}
                  {(() => {
                    const ans = ansD[2];
                    const category = getFeedbackCategory(ans, false);
                    return (
                      <div
                        ref={(el) => { questionRefs.current[`D-2`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>D2</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Pelaporan Kejadian</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200">Ketika suatu kesalahan sampai ke pasien dan dapat membahayakan pasien, tetapi tidak terjadi, seberapa sering hal ini dilaporkan?</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {FREQUENCY_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, false);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectD(2, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* D3 */}
                  {(() => {
                    const ans = ansD[3];
                    const category = ans ? (ans === 'Tidak ada' ? 'neutral' : 'positive') : 'none';
                    return (
                      <div
                        ref={(el) => { questionRefs.current[`D-3`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>D3</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Intensitas 12 Bulan Terakhir</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Berpartisipasi Melapor
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Belum Melapor
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200">Dalam 12 bulan terakhir, berapa banyak kejadian keselamatan pasien yang telah Anda laporkan?</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {['Tidak ada', '1 sampai 2', '3 sampai 5', '6 hingga 10', '11 atau lebih'].map((choice, i) => {
                            const isSelected = ans === choice;
                            const choiceCategory = choice === 'Tidak ada' ? 'neutral' : 'positive';
                            return (
                              <RippleButton
                                key={i}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectD3(choice)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? choiceCategory === 'positive'
                                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                      : 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {choice}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 5: BAGIAN E */}
              {step === 5 && (
                <div className="space-y-6">
                  {(() => {
                    const ans = ansE;
                    const category = getFeedbackCategory(ans, false);
                    return (
                      <div
                        ref={(el) => { questionRefs.current[`E-1`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>E1</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Peringkat Budaya Keselamatan</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-lg md:text-xl font-bold text-slate-200 leading-normal pt-2">Bagaimana Anda menilai unit/area kerja Anda dalam hal keselamatan pasien?</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {[
                            { val: 1, label: 'Buruk' },
                            { val: 2, label: 'Biasa' },
                            { val: 3, label: 'Baik' },
                            { val: 4, label: 'Sangat baik' },
                            { val: 5, label: 'Luar biasa' },
                          ].map((item) => {
                            const isSelected = ans === item.val;
                            const optCategory = getFeedbackCategory(item.val, false);
                            return (
                              <RippleButton
                                key={item.val}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectE(item.val)}
                                className={`p-6 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex flex-col justify-center items-center gap-3 ${
                                  isSelected 
                                    ? optCategory === 'positive'
                                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                      : optCategory === 'neutral'
                                      ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                      : optCategory === 'negative'
                                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                      : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-sm font-bold flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-4 h-4" />}
                                  {item.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 6: BAGIAN F */}
              {step === 6 && (
                <div className="space-y-6">
                  {STATEMENTS_F.map((st) => {
                    const ans = ansF[st.id];
                    const category = getFeedbackCategory(ans, st.isReversed);
                    return (
                      <div
                        key={st.id}
                        ref={(el) => { questionRefs.current[`F-${st.id}`] = el; }}
                        className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 relative overflow-hidden ${
                          category === 'positive'
                            ? 'bg-[#0c1a36]/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/10'
                            : category === 'neutral'
                            ? 'bg-[#0c1a36]/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/10'
                            : category === 'negative'
                            ? 'bg-[#0c1a36]/80 border-rose-500/60 shadow-md ring-1 ring-rose-500/10'
                            : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                        }`}
                      >
                        {category === 'positive' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />}
                        {category === 'neutral' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />}
                        {category === 'negative' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500" />}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all transform-gpu duration-300 ${
                              category === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              category === 'neutral' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              category === 'negative' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                            }`}>{st.code}</span>
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-500/20/50">
                              {DIMENSI_AHRQ.find(d => d.id === st.dim)?.nama || 'Dimensi'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {/* Response Quality Indicator */}
                            {category === 'positive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Respon Positif
                              </span>
                            )}
                            {category === 'neutral' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Respon Netral
                              </span>
                            )}
                            {category === 'negative' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Respon Negatif
                              </span>
                            )}

                            {ans ? (
                              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"><Check className="w-4 h-4" /> Selesai</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10"><AlertCircle className="w-4 h-4" /> Belum Dijawab</span>
                            )}
                          </div>
                        </div>

                        <p className="text-base md:text-lg font-bold text-slate-200 leading-relaxed">{st.text}</p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {LIKERT_OPTIONS.map((opt) => {
                            const isSelected = ans === opt.value;
                            const optCategory = getFeedbackCategory(opt.value, st.isReversed);
                            return (
                              <RippleButton
                                key={opt.value}
                                isSelected={isSelected}
                                shakeOnHover={true}
                                onClick={() => handleSelectOption('F', st.id, opt.value)}
                                className={`p-4 rounded-2xl border text-center transition-all transform-gpu duration-300 cursor-pointer flex items-center justify-center min-h-[64px] ${
                                  isSelected 
                                    ? opt.value === 9
                                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-500/30 scale-103 font-bold'
                                      : optCategory === 'positive'
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-103 font-bold'
                                        : optCategory === 'neutral'
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-103 font-bold'
                                        : optCategory === 'negative'
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30 scale-103 font-bold'
                                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-103 font-bold'
                                    : ans !== undefined
                                      ? 'border-[#00244d]/20 bg-[#020918]/30 text-slate-500 opacity-60 hover:opacity-100 hover:border-[#00244d]/60'
                                      : opt.value === 9
                                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-400 hover:bg-slate-500/10'
                                        : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                                }`}
                              >
                                <span className="text-xs leading-tight font-medium flex items-center justify-center gap-1.5">
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {opt.label}
                                </span>
                              </RippleButton>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 7: BAGIAN G */}
              {step === 7 && (
                <div className="space-y-6">
                  {/* G1 */}
                  <div
                    ref={(el) => { questionRefs.current[`G-1`] = el; }}
                    className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                      ansG[1] 
                        ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center font-bold text-xs">G1</span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Latar Belakang RS</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-slate-200">Sudah berapa lama Anda bekerja di rumah sakit ini?</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {['Kurang dari 1 tahun', '1 hingga 5 tahun', '6 hingga 10 tahun', '11 tahun atau lebih'].map((opt, i) => (
                        <RippleButton
                          key={i}
                          isSelected={ansG[1] === opt}
                          shakeOnHover={true}
                          onClick={() => handleSelectG(1, opt)}
                          className={`p-4 rounded-2xl border text-center transition-all transform-gpu cursor-pointer font-bold text-xs ${
                            ansG[1] === opt 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15 scale-102 font-semibold' 
                              : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                          }`}
                        >
                          {opt}
                        </RippleButton>
                      ))}
                    </div>
                  </div>

                  {/* G2 */}
                  <div
                    ref={(el) => { questionRefs.current[`G-2`] = el; }}
                    className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                      ansG[2] 
                        ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center font-bold text-xs">G2</span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Latar Belakang Unit</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-slate-200">Di rumah sakit ini, sudah berapa lama Anda bekerja di unit/area kerja saat ini?</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {['Kurang dari 1 tahun', '1 hingga 5 tahun', '6 hingga 10 tahun', '11 tahun atau lebih'].map((opt, i) => (
                        <RippleButton
                          key={i}
                          isSelected={ansG[2] === opt}
                          shakeOnHover={true}
                          onClick={() => handleSelectG(2, opt)}
                          className={`p-4 rounded-2xl border text-center transition-all transform-gpu cursor-pointer font-bold text-xs ${
                            ansG[2] === opt 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15 scale-102 font-semibold' 
                              : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                          }`}
                        >
                          {opt}
                        </RippleButton>
                      ))}
                    </div>
                  </div>

                  {/* G3 */}
                  <div
                    ref={(el) => { questionRefs.current[`G-3`] = el; }}
                    className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                      ansG[3] 
                        ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center font-bold text-xs">G3</span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Durasi Jam Kerja</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-slate-200">Biasanya, berapa jam per minggu Anda bekerja di rumah sakit ini?</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {['Kurang dari 30 jam per minggu', '30 hingga 40 jam per minggu', 'Lebih dari 40 jam per minggu'].map((opt, i) => (
                        <RippleButton
                          key={i}
                          isSelected={ansG[3] === opt}
                          shakeOnHover={true}
                          onClick={() => handleSelectG(3, opt)}
                          className={`p-4 rounded-2xl border text-center transition-all transform-gpu cursor-pointer font-bold text-xs ${
                            ansG[3] === opt 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15 scale-102 font-semibold' 
                              : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                          }`}
                        >
                          {opt}
                        </RippleButton>
                      ))}
                    </div>
                  </div>

                  {/* G4 */}
                  <div
                    ref={(el) => { questionRefs.current[`G-4`] = el; }}
                    className={`backdrop-blur-sm rounded-3xl border p-6 md:p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                      ansG[4] 
                        ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center font-bold text-xs">G4</span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Interaksi Pasien</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-slate-200">Dalam posisi staf Anda, apakah Anda memiliki interaksi atau kontak langsung dengan pasien?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'YA, saya melakukan interaksi atau kontak langsung dengan pasien',
                        'TIDAK, saya TIDAK melakukan interaksi atau kontak langsung dengan pasien'
                      ].map((opt, i) => (
                        <RippleButton
                          key={i}
                          isSelected={ansG[4] === opt}
                          shakeOnHover={true}
                          onClick={() => handleSelectG(4, opt)}
                          className={`p-5 rounded-2xl border text-left transition-all transform-gpu cursor-pointer font-bold text-xs ${
                            ansG[4] === opt 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15 scale-102 font-semibold' 
                              : 'border-[#00244d]/40 bg-[#020918]/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10/20'
                          }`}
                        >
                          {opt}
                        </RippleButton>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: BAGIAN H - KOMENTAR */}
              {step === 8 && (
                <div
                  ref={(el) => { questionRefs.current[`H-1`] = el; }}
                  className={`backdrop-blur-sm rounded-3xl border p-8 shadow-2xl transition-all transform-gpu duration-300 space-y-6 ${
                    komentar.trim() 
                      ? 'bg-[#0c1a36]/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                      : 'bg-[#0c1a36]/20 border-slate-500/30 hover:border-slate-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center font-bold text-xs">H1</span>
                    <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">Ulasan & Konstruksi Masukan</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-200">Bagikan Komentar atau Pengalaman Anda</h3>
                    <p className="text-xs text-slate-400">Silakan berikan komentar Anda tentang bagaimana hal-hal yang dilakukan atau dapat dilakukan di rumah sakit Anda yang dapat mempengaruhi keselamatan pasien.</p>
                  </div>

                  <textarea
                    rows={6}
                    value={komentar}
                    onChange={(e) => {
                      setKomentar(e.target.value);
                      triggerAutoSave({ komentar: e.target.value });
                    }}
                    placeholder="Tulis ulasan, hambatan, atau ide perbaikan konstruktif Anda di sini secara rinci..."
                    className="w-full bg-[#020918]/60 border border-[#00244d]/40 rounded-2xl p-4 text-sm focus:border-emerald-500 focus:bg-[#0c1a36]/50 backdrop-blur-sm focus:ring-1 focus:ring-emerald-500 transition-all transform-gpu outline-none leading-relaxed"
                  />

                  <div className="p-4 bg-emerald-500/10/50 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-800 leading-normal">
                      Ulasan masukan Anda akan diolah secara analitis kualitatif oleh tim manajemen fasyankes guna menentukan prioritas mitigasi insiden keselamatan pasien.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 9: REVIEW SECTION */}
              {step === 9 && (
                <div className="bg-[#0c1a36]/40 backdrop-blur-sm rounded-3xl border border-[#00244d]/30 p-8 shadow-2xl space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-400 tracking-wider">KOMPILASI</span>
                    <h2 className="text-2xl font-bold text-slate-100">Review Sebelum Kirim Kuesioner</h2>
                    <p className="text-xs text-slate-400">Silakan tinjau seluruh kelengkapan jawaban kuesioner Anda untuk menjamin akurasi data budaya keselamatan.</p>
                  </div>

                  <hr className="border-white/[0.08]" />

                  {unansweredCount > 0 ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-red-800">Ditemukan {unansweredCount} Isian Belum Lengkap</h5>
                        <p className="text-[10px] text-red-700 leading-normal mt-0.5">
                          Sebaiknya isi seluruh pertanyaan kuesioner SOPS untuk memastikan kalkulasi dimensi komposit Anda orisinal dan valid sesuai standar Kemenkes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold">Luar biasa! Seluruh {totalQuestions} pertanyaan kuesioner berhasil terjawab dengan lengkap.</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/15 transition-all transform-gpu flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Kirim Jawaban Survei
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 10: SUCCESS SCREEN */}
              {step === 10 && (
                <div className="bg-[#0c1a36]/40 backdrop-blur-sm rounded-3xl border border-[#00244d]/30 p-12 text-center shadow-2xl space-y-6 max-w-xl mx-auto my-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase font-mono">SINKRONISASI SELESAI</span>
                    <h2 className="text-2xl font-extrabold text-slate-100">Terima Kasih Banyak!</h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Kuesioner budaya keselamatan pasien Anda berhasil dikirim secara realtime dan diintegrasikan ke basis data cloud rumah sakit.
                    </p>
                  </div>

                  <hr className="border-white/[0.08]" />

                  <div className="p-4 bg-emerald-500/10/50 rounded-2xl text-[11px] text-emerald-800 leading-relaxed text-left space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Data Dimasukkan Ke Basis Data</span>
                    </div>
                    <p>Hasil entri kuesioner Anda akan segera dikompilasi secara dinamis pada tab <strong>Dashboard</strong>, <strong>Analisis Grafik</strong>, dan pembuatan laporan otomatis.</p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setResponderName('');
                        setPosisiStaf('');
                        setUnitKerja('');
                        setAnsA({});
                        setAnsB({});
                        setAnsC({});
                        setAnsD({});
                        setAnsE(undefined);
                        setAnsF({});
                        setAnsG({});
                        setKomentar('');
                        setStep(0);
                      }}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all transform-gpu shadow-md shadow-emerald-600/10"
                    >
                      Input Survei Baru
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* 3. STICKY FOOTER NAVIGATION */}
      {step > 0 && step < 10 && (
      <footer id="survey-sticky-footer" className="sticky bottom-0 bg-[#0c1a36]/75 backdrop-blur-sm border-t border-[#00244d]/40 py-4 px-6 md:px-8 flex justify-between items-center z-10 shadow-lg">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0 || step === 10}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all transform-gpu flex items-center gap-1.5 ${
            step === 0 || step === 10
              ? 'text-slate-300 bg-slate-950/50 border border-slate-100 cursor-not-allowed'
              : 'bg-[#0c1a36]/50 backdrop-blur-sm border border-[#00244d]/40 text-slate-300 hover:bg-[#020918]/50'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Sebelumnya
        </button>

        {step < 9 ? (
          <button
            onClick={handleNextStep}
            disabled={step === 10}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all transform-gpu flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
          >
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        ) : step === 9 ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all transform-gpu flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
          >
            Kirim Kuesioner <Check className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </footer>
      )}

      {/* FULLSCREEN MODALS FOR DROPDOWNS */}
      {mounted && createPortal(
        <AnimatePresence>
          {isPosisiModalOpen && (
            <motion.div
              key="posisi-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0B101E] backdrop-blur-md flex flex-col z-[9999]"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                <div className="flex justify-between items-center sticky top-0 bg-[#0B101E] p-4 -mx-6 -mt-6 mb-6 border-b border-slate-800/50 z-10 max-w-4xl mx-auto w-full">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400"/> Pilih Posisi Staf</h3>
                  <button type="button" onClick={() => setIsPosisiModalOpen(false)} className="p-2 bg-slate-800/50 rounded-full text-slate-300 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                  {Object.entries(STAFF_POSITIONS).map(([group, list]) => (
                    <div key={group} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {list.map(pos => (
                          <button
                            type="button"
                            key={pos.value}
                            onClick={() => {
                              setPosisiStaf(pos.label);
                              triggerAutoSave({ posisiStaf: pos.label });
                              setIsPosisiModalOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all transform-gpu cursor-pointer ${
                              posisiStaf === pos.label 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold' 
                                : 'bg-slate-900/50 text-slate-300 border border-slate-800/50 hover:bg-slate-800'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {isUnitModalOpen && (
            <motion.div
              key="unit-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0B101E] backdrop-blur-md flex flex-col z-[9999]"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                <div className="flex justify-between items-center sticky top-0 bg-[#0B101E] p-4 -mx-6 -mt-6 mb-6 border-b border-slate-800/50 z-10 max-w-4xl mx-auto w-full">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400"/> Pilih Unit / Area Kerja</h3>
                  <button type="button" onClick={() => setIsUnitModalOpen(false)} className="p-2 bg-slate-800/50 rounded-full text-slate-300 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                  {Object.entries(WORK_UNITS).map(([group, list]) => (
                    <div key={group} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {list.map(u => (
                          <button
                            type="button"
                            key={u.value}
                            onClick={() => {
                              setUnitKerja(u.label);
                              triggerAutoSave({ unitKerja: u.label });
                              setIsUnitModalOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all transform-gpu cursor-pointer ${
                              unitKerja === u.label 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold' 
                                : 'bg-slate-900/50 text-slate-300 border border-slate-800/50 hover:bg-slate-800'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 4. CONFIRMATION DIALOG MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 bg-[#0B101E]/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
              <motion.div
                key="confirm-modal-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-100">Kirim Kuesioner Anda?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Apakah Anda yakin seluruh jawaban sudah benar? Seluruh data yang Anda masukkan akan disinkronisasikan langsung demi kalkulasi komposit budaya keselamatan RS.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all transform-gpu cursor-pointer"
                  >
                    Kembali Periksa
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/15 transition-all transform-gpu flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Mengirim...</span>
                    ) : (
                      <>
                        <span>Ya, Kirim</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
