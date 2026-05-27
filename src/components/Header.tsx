/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserCircle, HeartPulse, Heart, Moon, Sun, Monitor, Globe, Smartphone, Activity } from 'lucide-react';
import { useTranslation } from '../i18n';
import { ConnectedDevice } from '../types';

interface HeaderProps {
  onProfileClick: () => void;
  activeScreen: string;
  themeMode: 'system' | 'light' | 'dark';
  onThemeToggle: () => void;
  devices?: ConnectedDevice[];
  onDevicesClick?: () => void;
}

export default function Header({ 
  onProfileClick, 
  activeScreen, 
  themeMode, 
  onThemeToggle,
  devices = [],
  onDevicesClick
}: HeaderProps) {
  const { lang, setLang } = useTranslation();

  const connectedCount = devices.filter(d => d.status === 'connected' || d.status === 'simulated').length;

  return (
    <header className="sticky top-0 z-50 bg-[#e6f6ff] dark:bg-[#031015] w-full shadow-sm flex items-center justify-between px-5 py-2">
      <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.location.reload()}>
        <span className="text-[#005e53] dark:text-[#a4f0e9]">
          <Heart className="w-7 h-7 fill-[#005e53] dark:fill-[#a4f0e9]" />
        </span>
        <h1 className="text-xl font-extrabold text-[#005e53] dark:text-[#a4f0e9] tracking-tight">SafeBreath</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Device Status Link Pill */}
        {onDevicesClick && (
          <button
            onClick={onDevicesClick}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition cursor-pointer text-[10px] font-black uppercase tracking-wider ${
              connectedCount > 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/50' 
                : 'bg-gray-150 dark:bg-red-950/20 text-gray-500 dark:text-red-400 border-gray-200/50 dark:border-red-900/40'
            }`}
            title="Ver mis dispositivos conectados"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{connectedCount} Disp</span>
          </button>
        )}

        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="p-1.5 text-[#3e4946] dark:text-[#8ba7ad] hover:bg-[#cfe6f2] dark:hover:bg-[#0a232f] rounded-full transition duration-250 active:scale-95 flex items-center justify-center font-bold text-xs gap-1"
          title="Cambiar Idioma"
        >
          <Globe className="w-5 h-5" />
          <span className="uppercase">{lang}</span>
        </button>

        <button
          onClick={onThemeToggle}
          className="p-1.5 text-[#3e4946] dark:text-[#8ba7ad] hover:bg-[#cfe6f2] dark:hover:bg-[#0a232f] rounded-full transition duration-250 active:scale-95 flex items-center justify-center"
          title="Cambiar Tema"
        >
          {themeMode === 'light' ? <Sun className="w-6 h-6" /> : themeMode === 'dark' ? <Moon className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>

        {activeScreen !== 'profile' && (
          <button
            onClick={onProfileClick}
            className="p-1.5 text-[#3e4946] dark:text-[#8ba7ad] hover:bg-[#cfe6f2] dark:hover:bg-[#0a232f] rounded-full transition duration-250 active:scale-95 flex items-center justify-center"
            title="Ver Perfil de Salud"
          >
            <UserCircle className="w-7 h-7 text-teal-800 dark:text-[#a4f0e9]" />
          </button>
        )}
      </div>
    </header>
  );
}
