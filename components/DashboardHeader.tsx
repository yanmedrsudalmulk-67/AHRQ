'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Building2, 
  UserCheck,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';

interface SurveyData {
  id: string;
  namaRs: string;
  unitKerja: string;
  jumlahResponden: number;
  tanggalInput: string;
  dimensiScores: { [key: string]: number };
}

interface DashboardHeaderProps {
  role: 'rs' | 'admin';
  namaRs: string;
  surveys: SurveyData[];
}

export default function DashboardHeader({ role, namaRs, surveys }: DashboardHeaderProps) {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  const availableYears = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString(),
    (currentYear - 3).toString(),
    (currentYear - 4).toString(),
    'Semua Tahun'
  ];

  // Update dynamic clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set initial Indonesian date
  useEffect(() => {
    setDateString(
      new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    );
  }, []);

  // Determine time-based personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 11) {
      return { 
        type: 'morning',
        text: 'Selamat Pagi', 
        iconType: 'sunrise',
        badgeClass: 'border-emerald-500/20 shadow-md',
        gradId: 'sunrise-grad'
      };
    } else if (hour >= 11 && hour < 15) {
      return { 
        type: 'noon',
        text: 'Selamat Siang', 
        iconType: 'sun',
        badgeClass: 'border-white/[0.08] shadow-md',
        gradId: 'sun-grad'
      };
    } else if (hour >= 15 && hour < 18) {
      return { 
        type: 'afternoon',
        text: 'Selamat Sore', 
        iconType: 'sunset',
        badgeClass: 'border-white/[0.08] shadow-md',
        gradId: 'sunset-grad'
      };
    } else {
      return { 
        type: 'night',
        text: 'Selamat Malam', 
        iconType: 'moon',
        badgeClass: 'border-white/[0.08] shadow-md',
        gradId: 'moon-grad'
      };
    }
  };

  const renderGreetingIcon = (iconType: string, gradId: string) => {
    const props = {
      className: "w-[22px] h-[22px]",
      stroke: `url(#${gradId})`,
      strokeWidth: 2,
    };
    switch (iconType) {
      case 'sunrise':
        return <Sunrise {...props} />;
      case 'sun':
        return <Sun {...props} />;
      case 'sunset':
        return <Sunset {...props} />;
      case 'moon':
        return <Moon {...props} />;
      default:
        return <Sun {...props} />;
    }
  };

  const greeting = getGreeting();
  const displayHospital = role === 'admin' ? 'Admin AHRQ' : namaRs;

  // Framer Motion variants
  const containerVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      }
    }
  };

  const sapaanVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const namaRsVariants: any = {
    hidden: { opacity: 0, x: -25 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const subjudulVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const deskripsiVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const staggerContainerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      id="dashboard-header-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden w-full p-6 md:p-8 rounded-[32px] bg-[#121826]/90 backdrop-blur-sm border border-white/[0.08] shadow-md flex flex-col lg:flex-row justify-between items-start gap-8"
    >
      {/* Decorative premium radial glow & gradient elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none -z-10" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-cyan-500/5 rounded-full filter blur-[60px] pointer-events-none -z-10" />

      {/* Left Column: Greeting, Welcome Messages (100% on Desktop) */}
      <div className="flex-1 w-full min-w-0 flex items-stretch gap-4 md:gap-5">
        {/* Blue-Indigo-Purple Vertical Accent Bar with vertical moving color animation */}
        <motion.div 
          animate={{ 
            backgroundPosition: ["0% 0%", "0% 100%", "0% 0%"]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            backgroundSize: "100% 200%",
            backgroundImage: "linear-gradient(to bottom, #22d3ee, #6366f1, #a855f7, #6366f1, #22d3ee)"
          }}
          className="w-1 md:w-1.5 rounded-full shadow-md shrink-0" 
        />
        
        <div className="space-y-4 min-w-0 w-full">
          <div className="space-y-1.5 min-w-0 w-full">
            {/* Row 1: Greeting with Premium Badge */}
            <div className="flex items-center gap-3">
              <motion.div 
                variants={sapaanVariants}
                className="text-[22px] md:text-[36px] font-bold text-white/90 leading-tight md:leading-none tracking-tight whitespace-normal break-words"
              >
                {greeting.text},
              </motion.div>
              
              <div className="relative w-[44px] h-[44px] shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={greeting.type}
                    initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotate: 10 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`absolute inset-0 flex items-center justify-center rounded-[14px] bg-white/[0.05] backdrop-blur-[20px] border ${greeting.badgeClass}`}
                  >
                    {renderGreetingIcon(greeting.iconType, greeting.gradId)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            {/* Row 2: Hospital Title with Gradient Accent & Glow */}
            <motion.h2 
              variants={namaRsVariants}
              className="text-[28px] md:text-[48px] font-extrabold text-white tracking-tight leading-tight md:leading-none break-words whitespace-normal"
            >
              Hai, Sobat <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-md font-extrabold">{displayHospital}</span>
            </motion.h2>
          </div>

          {/* Row 3: Subtitle & Description */}
          <div className="space-y-2">
            <motion.p 
              variants={subjudulVariants}
              className="text-[18px] md:text-[22px] font-semibold text-slate-100 leading-tight"
            >
              Selamat Datang di Aplikasi <span className="font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Sistem Survei Budaya Keselamatan Pasien</span>
            </motion.p>
            <motion.p 
              variants={deskripsiVariants}
              className="text-[14px] md:text-[14px] text-slate-300/90 font-normal leading-[1.7]"
            >
              {"\"Kelola survei, analisis hasil, dan tingkatkan budaya keselamatan pasien melalui dashboard analitik berbasis AHRQ SOPS Version 2.0.\""}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Premium SVG Gradient Defs for Personalized Greeting Icons */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="sunrise-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" /> {/* Emerald */}
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" /> {/* Cyan */}
          </linearGradient>
          <linearGradient id="sun-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" /> {/* Cyan */}
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" /> {/* Sky Blue */}
          </linearGradient>
          <linearGradient id="sunset-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" /> {/* Premium Rose-gold/Coral */}
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" /> {/* Emerald */}
          </linearGradient>
          <linearGradient id="moon-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" /> {/* Indigo */}
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" /> {/* Emerald */}
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
