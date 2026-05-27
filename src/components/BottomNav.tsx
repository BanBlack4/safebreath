/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Heart, Activity, ShieldAlert, History, Users, Settings } from 'lucide-react';
import { AppScreen } from '../types';
import { useTranslation } from '../i18n';

interface BottomNavProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
  triggerAlertScreen: () => void;
}

export default function BottomNav({ currentScreen, onScreenChange, triggerAlertScreen }: BottomNavProps) {
  const { t } = useTranslation();
  
  const tabs = [
    {
      id: 'dashboard' as AppScreen,
      label: t('nav.dashboard'),
      icon: Heart,
    },
    {
      id: 'vitals' as AppScreen,
      label: t('nav.vitals'),
      icon: Activity,
    },
    {
      id: 'history' as AppScreen,
      label: t('nav.history'),
      icon: History,
    },
    {
      id: 'profile' as AppScreen,
      label: t('nav.profile'),
      icon: Settings,
    }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 flex justify-around items-center px-2 py-2 bg-white dark:bg-[#0a232f] border-t border-gray-100 dark:border-[#133240] shadow-lg rounded-t-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onScreenChange(tab.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition duration-200 active:scale-90 ${
              isActive
                ? 'bg-[#a4f0e9] dark:bg-[#005e53] text-[#1d706a] dark:text-[#a1feec] px-5 py-1.5 font-bold shadow-sm'
                : 'text-gray-500 hover:text-teal-800 dark:text-gray-400 dark:hover:text-teal-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            <span className="text-[11px] font-semibold mt-0.5 tracking-tight uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Persistent Rapid Action SOS Button */}
      <button
        onClick={triggerAlertScreen}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-red-600 hover:text-red-800 active:scale-90 transition"
      >
        <span className="relative flex h-3 w-3 mb-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
        <ShieldAlert className="w-5 h-5 text-red-600" />
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
          SOS
        </span>
      </button>
    </nav>
  );
}
