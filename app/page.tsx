'use client';

import { useState, useEffect } from 'react';
import WelcomeScreen from '../components/WelcomeScreen';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';
import Dashboard from '../components/Dashboard';
import { getWallpaper, WallpaperData } from '../lib/wallpaper';
import { getLogo, LogoData } from '../lib/logo';

export default function Home() {
  const [screen, setScreen] = useState<'welcome' | 'login' | 'register' | 'dashboard'>('welcome');
  const [role, setRole] = useState<'rs' | 'admin'>('rs');
  const [identifier, setIdentifier] = useState('');
  const [namaRs, setNamaRs] = useState('');
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [activeLogo, setActiveLogo] = useState<LogoData | null>(null);
  
  // Keep list of registered hospitals in state so they persist during active session
  const [registeredHospitals, setRegisteredHospitals] = useState<Array<{ username: string; kodeRs: string; namaRs: string }>>([]);

  // Load wallpaper and logo on mount
  useEffect(() => {
    async function loadPreferences() {
      const savedWallpaper = await getWallpaper();
      if (savedWallpaper) {
        setWallpaper(savedWallpaper);
      }
      
      const savedLogo = await getLogo();
      if (savedLogo) {
        setActiveLogo(savedLogo);
      }
    }
    loadPreferences();
  }, []);

  const handleLoginSuccess = (userRole: 'rs' | 'admin', userId: string, rsName: string) => {
    setRole(userRole);
    setIdentifier(userId);
    setNamaRs(rsName);
    setScreen('dashboard');
  };

  const handleRegisterSuccess = (newHospital: { username: string; kodeRs: string; namaRs: string }) => {
    setRegisteredHospitals(prev => [...prev, newHospital]);
    setScreen('login');
  };

  const handleUpdateRsName = (newName: string) => {
    setNamaRs(newName);
  };

  const handleLogout = () => {
    setScreen('welcome');
    setIdentifier('');
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-100 relative overflow-hidden">
      {/* Background Wallpaper Layer */}
      {wallpaper ? (
        wallpaper.type === 'video' ? (
          <div className="fixed inset-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
            <video
              src={wallpaper.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Dark overlay to ensure contrast - 50% on welcome/hero screen, 70% elsewhere */}
            <div className={`absolute inset-0 transition-all duration-500 ${screen === 'welcome' ? 'bg-slate-950/50' : 'bg-slate-950/70'}`} />
          </div>
        ) : (
          <div 
            className="fixed inset-0 w-full h-full bg-cover bg-center -z-20 pointer-events-none"
            style={{ backgroundImage: `url("${wallpaper.url}")` }}
          >
            {/* Dark overlay to ensure contrast - 50% on welcome/hero screen, 70% elsewhere */}
            <div className={`absolute inset-0 transition-all duration-500 ${screen === 'welcome' ? 'bg-slate-950/50' : 'bg-slate-950/70'}`} />
          </div>
        )
      ) : (
        // Default futuristic space gradient background
        <div className="fixed inset-0 w-full h-full bg-[#0B101E] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#0B101E] to-[#170F24] -z-20 pointer-events-none" />
      )}

      {screen === 'welcome' && (
        <WelcomeScreen onEnter={() => setScreen('login')} activeLogo={activeLogo} />
      )}

      {screen === 'login' && (
        <LoginScreen
          onBack={() => setScreen('welcome')}
          onLoginSuccess={handleLoginSuccess}
          onGoToRegister={() => setScreen('register')}
          registeredHospitals={registeredHospitals}
          activeLogo={activeLogo}
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('login')}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          role={role}
          identifier={identifier}
          namaRs={namaRs}
          onLogout={handleLogout}
          onUpdateRsName={handleUpdateRsName}
          activeWallpaper={wallpaper}
          onUpdateWallpaper={setWallpaper}
          activeLogo={activeLogo}
          onUpdateLogo={setActiveLogo}
        />
      )}
    </main>
  );
}

