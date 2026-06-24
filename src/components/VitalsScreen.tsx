/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Activity, ShieldAlert, Cpu, Award, RefreshCw, Calendar, Settings, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import BreathingModal from './BreathingModal';
import { AppScreen, UserProfile } from '../types';
import { useTelemetry } from '../hooks/useTelemetry';

interface VitalsScreenProps {
  profile: UserProfile;
  onScreenChange: (screen: AppScreen) => void;
  triggerAlertScreen: () => void;
}

export default function VitalsScreen({ profile, onScreenChange, triggerAlertScreen }: VitalsScreenProps) {
  const { liveBpm: wsLiveBpm, isConnected } = useTelemetry();
  const [liveBpm, setLiveBpm] = useState(73);
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  // Fallback simulation if WS is not providing data, plus real WS data merge
  useEffect(() => {
    if (wsLiveBpm !== null) {
      setLiveBpm(wsLiveBpm);
      return;
    }
    
    // Simulation fallback
    const interval = setInterval(() => {
      setLiveBpm(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(62, Math.min(84, prev + delta));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [wsLiveBpm]);

  // Event details dummy list
  const heartTrends = [
    { hour: '10 AM', bpm: 68, label: 'Bajo' },
    { hour: '11 AM', bpm: 142, label: 'Pico', isPeak: true },
    { hour: '12 PM', bpm: 75, label: 'Normal' },
    { hour: '1 PM', bpm: 72, label: 'Normal' },
    { hour: '2 PM', bpm: 81, label: 'Normal' },
    { hour: '3 PM', bpm: 70, label: 'Bajo' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-24 space-y-6"
    >
      {/* Hero heart rate display panel */}
      <section className="relative overflow-hidden rounded-3xl bg-[#d5ecf8] dark:bg-[#0a232f] p-6 flex flex-col items-center justify-center min-h-[280px] shadow-sm border border-teal-500/10 dark:border-[#133240]">
        {/* Soft background glow & ripple circles */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-56 h-56 bg-teal-300 dark:bg-teal-900/20 opacity-25 rounded-full filter blur-xl animate-pulse" />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute w-72 h-72 border-2 border-[#00796b]/15 dark:border-[#00796b]/30 rounded-full"
          />
        </div>

        <div className="relative z-10 text-center space-y-4">
          <div className="flex flex-col items-center">
            {/* Pulsing heart block with digital BPM numbers */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 60 / liveBpm, repeat: Infinity, ease: 'easeOut' }}
              className="mb-1 text-rose-500"
            >
              <Heart className="w-12 h-12 fill-rose-500" />
            </motion.div>
            <span className="text-6xl font-extrabold text-[#005e53] leading-none tracking-tighter" id="vitals-live-bpm">
              {liveBpm}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">BPM</span>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${isConnected ? 'bg-[#00796b]/10 border-[#00796b]/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#00796b] animate-ping' : 'bg-red-500 animate-pulse'}`} />
            <span className={`text-xs font-bold ${isConnected ? 'text-[#00796b]' : 'text-red-500'}`}>
              {isConnected ? 'Monitoreo: En vivo (WS)' : 'Monitoreo: Offline'}
            </span>
            {isConnected ? <Wifi className="w-3 h-3 text-[#00796b]" /> : <WifiOff className="w-3 h-3 text-red-500" />}
          </div>
        </div>
      </section>

      {/* Bento actions controls */}
      <section className="grid grid-cols-2 gap-4">
        {/* Guided breathing trigger shortcut */}
        <div
          onClick={() => setShowBreathingModal(true)}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-98 transition cursor-pointer hover:border-teal-200"
        >
          <div className="w-11 h-11 rounded-xl bg-[#a4f0e9] flex items-center justify-center text-[#1d706a]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#071e27] leading-tight">Respiración Guiada</h3>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Técnica 4-7-8</p>
          </div>
        </div>

        {/* SOS rapid setup widget */}
        <div
          onClick={triggerAlertScreen}
          className="bg-[#ffdad6] p-4 rounded-xl shadow-sm border border-[#ffdad6]/60 flex items-center justify-center gap-3 active:scale-95 transition cursor-pointer hover:bg-red-100"
        >
          <ShieldAlert className="w-5 h-5 text-[#ba1a1a]" />
          <span className="text-xs font-bold text-[#93000a] uppercase tracking-wider">SOS Contacts</span>
        </div>
      </section>

      {/* Heart rate history chart block */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-[#133240] space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-[#071e27] dark:text-white">Historial de Vitals</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimas 4 horas de registro continuo</p>
          </div>
          <RefreshCw className="w-4.5 h-4.5 text-gray-400 hover:text-[#005e53] dark:hover:text-[#a4f0e9] cursor-pointer" />
        </div>

        {/* Recharts Bar chart for telemetry */}
        <div className="pt-4 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heartTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <ReferenceLine y={profile.bpmReposo || 70} stroke="#00796b" strokeDasharray="3 3" label={{ position: 'top', value: 'Reposo', fill: '#00796b', fontSize: 10, fontWeight: 'bold' }} />
              <Bar dataKey="bpm" radius={[6, 6, 0, 0]}>
                {heartTrends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPeak ? '#ef4444' : '#00796b'} fillOpacity={entry.isPeak ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-300 font-bold mt-2 bg-teal-50/50 dark:bg-[#0c2a38] py-1.5 rounded-lg border border-teal-100/30 dark:border-[#133240]">
            Promedio: 68 BPM sobre el reposo normal
          </p>
        </div>
      </section>

      {/* Health profile calibration quick entry summary */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-[#133240] flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#00796b] dark:text-[#a4f0e9]">
          <Award className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[#071e27] dark:text-white">Perfil de Salud</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
            Personaliza y calibra la velocidad de respuesta cardíaca ante asfixia del purificador para detecciones más oportunas.
          </p>
          <button
            onClick={() => onScreenChange('profile')}
            className="bg-[#00796b] dark:bg-[#005e53] hover:bg-[#005e53] dark:hover:bg-[#00796b] text-[#a1feec] font-bold px-4 py-2 rounded-full text-xs transition duration-150 active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Configurar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Galaxy Watch 6 Connected indicator card */}
      <section 
        onClick={() => onScreenChange('devices')}
        className="flex items-center justify-between bg-[#e6f6ff] dark:bg-[#0c2a38] p-4 rounded-xl border border-[#cfe6f2] dark:border-[#133240] hover:bg-[#cfe6f2] dark:hover:bg-[#11384a] transition cursor-pointer active:scale-98"
      >
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-teal-800 dark:text-[#a4f0e9]" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Gestionar Dispositivos (BLE)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-extrabold text-[#1d706a] dark:text-[#a4f0e9]">Vincular</span>
          <span className="w-3 h-3 bg-[#00796b] dark:bg-[#a4f0e9] rounded-full ring-4 ring-[#a4f0e9] dark:ring-[#a4f0e9]/20" />
        </div>
      </section>

      {/* Modal Breather */}
      <BreathingModal isOpen={showBreathingModal} onClose={() => setShowBreathingModal(false)} />
    </motion.div>
  );
}
