/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Heart, Wind, ChevronRight, Activity, Smile, AlertTriangle, HelpCircle, Shield, Sparkles } from 'lucide-react';
import BreathingModal from './BreathingModal';
import { ReflectionLog, AppScreen } from '../types';
import { auth } from '../firebase';

interface DashboardScreenProps {
  onStartCheckin: () => void;
  triggerAlertScreen: () => void;
  onScreenChange: (screen: AppScreen) => void;
}

export default function DashboardScreen({
  onStartCheckin,
  triggerAlertScreen,
  onScreenChange
}: DashboardScreenProps) {
  const [selectedMood, setSelectedMood] = useState<'Calm' | 'Neutral' | 'Anxious' | null>(null);
  const [selectedTightness, setSelectedTightness] = useState<string[]>([]);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathingConfig, setBreathingConfig] = useState<{name: string, type: '4-7-8' | 'box'}>({ name: 'Respiración 4-7-8', type: '4-7-8' });

  const userName = auth.currentUser?.displayName 
    ? auth.currentUser.displayName.split(' ')[0] 
    : 'Visitante';

  const handleStartBreathing = (type: '4-7-8' | 'box') => {
    setBreathingConfig({
      name: type === 'box' ? 'Respiración Caja (4-4-4-4)' : 'Respiración 4-7-8',
      type
    });
    setShowBreathingModal(true);
  };

  const toggleTightness = (option: string) => {
    if (option === 'Ninguna') {
      setSelectedTightness(['Ninguna']);
      return;
    }

    let next = selectedTightness.filter(x => x !== 'Ninguna');
    if (next.includes(option)) {
      next = next.filter(x => x !== option);
    } else {
      next.push(option);
    }
    setSelectedTightness(next);
  };

  const currentHr = 72;
  const currentSpo2 = 98;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pb-24 space-y-6"
    >
      {/* Start Checkout Hero Actions */}
      <section className="text-center py-4 space-y-4">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-extrabold text-[#071e27] dark:text-white tracking-tight">
            Hola, {userName}
          </h1>
          <p className="text-xs text-[#00796b] dark:text-[#a4f0e9] font-bold">
            Tu ecosistema de respiración está activo
          </p>
        </div>

        <div className="relative inline-block">
          {/* Pulsing ring layers */}
          <span className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping duration-1500" />
          <button
            onClick={onStartCheckin}
            className="relative bg-[#005e53] hover:bg-[#00796b] text-white font-bold px-8 py-5 rounded-full shadow-lg active:scale-95 transition flex items-center gap-2.5 mx-auto cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Chequeo</span>
          </button>
        </div>

        <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
          Toma un momento para verificar tu ritmo cardíaco, oxigenación y estado mental actual.
        </p>
      </section>

      {/* Baseline Indicators summary */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#071e27] px-1">Línea Base Actual</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* BPM Baseline indicator */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-1 px-1.5 bg-rose-50 rounded-lg text-rose-600">
                <Heart className="w-4.5 h-4.5 fill-current" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BPM</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-800 tracking-tight">{currentHr}</div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#00796b] w-3/4 rounded-full" />
            </div>
          </div>

          {/* SpO2 Baseline indicator */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-1 px-1.5 bg-teal-50 rounded-lg text-teal-600">
                <Wind className="w-4.5 h-4.5" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SpO2</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-800 tracking-tight">{currentSpo2}%</div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#00796b] w-[98%] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Reflection assessment quiz */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-[#133240] space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#071e27] dark:text-white">Reflexión Diaria</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">¿Cómo te sientes en este preciso momento?</p>
        </div>

        {/* Mood select options */}
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {[
            { id: 'Calm' as const, label: 'Calmado', icon: Smile, color: 'text-emerald-600' },
            { id: 'Neutral' as const, label: 'Neutral', icon: Smile, color: 'text-amber-500' },
            { id: 'Anxious' as const, label: 'Ansioso', icon: Smile, color: 'text-rose-600' }
          ].map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#a4f0e9] dark:bg-[#005e53] border-[#00796b] shadow-sm'
                    : 'bg-teal-50/10 dark:bg-[#0c2a38] border-gray-100 dark:border-[#133240] hover:bg-gray-50 dark:hover:bg-[#11384a]'
                }`}
              >
                <m.icon className={`w-8 h-8 ${m.color}`} />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Physical tight selection options */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">¿Sientes alguna opresión o tensión corporal?</p>
          <div className="flex flex-wrap gap-2">
            {['Pecho', 'Garganta', 'Hombros', 'Ninguna'].map((option) => {
              const checked = selectedTightness.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleTightness(option)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                    checked
                      ? 'bg-[#00796b] text-white border-[#005e53]'
                      : 'bg-white dark:bg-[#0c2a38] border-gray-200 dark:border-[#133240] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#11384a]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proactive assistance card for anxiety or distress indicators */}
        {(selectedMood === 'Anxious' || selectedTightness.some(t => t !== 'Ninguna' && t.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-teal-950 to-[#03201d] border border-teal-500/30 text-white space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 bg-teal-500/20 text-[#a4f0e9] rounded-lg mt-0.5 animate-pulse">
                <Wind className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#a4f0e9]">Recomendación de Alivio</h4>
                <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                  Has reportado {selectedMood === 'Anxious' ? 'ansiedad' : 'opresión corporal'}. Te aconsejamos pausar por 2 minutos y usar la técnica respiratoria guiada para regular tu pulso cardíaco y calmar la contracción del diafragma.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleStartBreathing('4-7-8')}
              className="w-full bg-[#00796b] hover:bg-[#005e53] text-white font-extrabold py-2.5 rounded-xl text-xs transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Iniciar Respiración Reguladora
            </button>
          </motion.div>
        )}
      </section>

      {/* Guided Exercises lists */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-[#071e27] dark:text-white">Alivio Guiado</h2>
          <button
            onClick={() => onScreenChange('history')}
            className="text-xs font-bold text-[#00796b] dark:text-[#a4f0e9] hover:underline"
          >
            Ver Historial
          </button>
        </div>

        {/* Item 1: 4-7-8 Breathing (play trigger modal) */}
        <div
          onClick={() => handleStartBreathing('4-7-8')}
          className="relative overflow-hidden rounded-2xl bg-[#00796b] text-white p-5 cursor-pointer transition transform active:scale-98 shadow-md group"
        >
          {/* Serene Dawn Misty Lake background vector fallback styling overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/80 to-teal-800/40 z-10" />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuClHw7U2rteRAm5P6SahS_J0d3K9fVGz7XHIOriHuQOHmRfmX2PWE_aHk8mlvs5dTdafaYKElEBbu75_VWsMn8X8q4RoMyVV0-4o13Xb-kidkyJTQiRfihzNWOE9mrXywaO6WAZrDkSGx6-vDTkqgVAks49C23CTPnfbs4PTD6z_F9sd8KgJeG9J_krwaH1nvYu4wVY5fypVdffLbzcCobGGu2kPrZu8h0BbaXvwCzTxfENNayZfP1RXlcuFuDWhY01FCyB7hBk3agz"
            alt="Lago sereno"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-700"
          />

          <div className="relative z-20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded text-teal-200">Recomendado</span>
              <h3 className="font-extrabold text-lg text-white mt-1">Respiración 4-7-8</h3>
              <p className="text-xs text-teal-100 opacity-90">5 Minutos • Relajación Profunda</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center animate-pulse">
              <Wind className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Item 2: Mindfulness scan (quick trigger) */}
        <div
          onClick={() => handleStartBreathing('box')}
          className="bg-[#d4e6e5] dark:bg-[#0a232f] p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-[#cfe6f2] dark:hover:bg-[#133240] transition duration-200 border border-transparent dark:border-[#133240]"
        >
          <div className="bg-white dark:bg-[#133240] p-3 rounded-xl text-teal-800 dark:text-[#a4f0e9] shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-[#0e1e1e] dark:text-white">Respiración en Caja</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Técnica Táctica 4-4-4-4</p>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-800 dark:text-[#a4f0e9]" />
        </div>

        {/* Item 3: Crisis simulation practice */}
        <div
          onClick={triggerAlertScreen}
          className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition duration-200 border border-transparent dark:border-red-900/30"
        >
          <div className="bg-white dark:bg-red-900/40 p-3 rounded-xl text-red-700 dark:text-red-400 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-900 dark:text-red-100">Práctica de Crisis SOS</h4>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">Familiarízate con el Entorno Seguro</p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-700 dark:text-red-400" />
        </div>
      </section>

      {/* Stress map trends & current triggers */}
      <section className="grid grid-cols-2 gap-4">
        {/* Weekly stress trend simple stats */}
        <div className="bg-[#d5ecf8] dark:bg-[#0a232f] p-4 rounded-xl space-y-2 border border-transparent dark:border-[#133240]">
          <p className="text-xs font-semibold text-[#3e4946] dark:text-gray-300">Estrés Semanal</p>
          {/* Miniature simple bars representation */}
          <div className="flex items-end gap-1.5 h-12 pt-2">
            <div className="w-full bg-[#005e53]/30 dark:bg-[#00796b]/30 h-[40%] rounded-t-sm" />
            <div className="w-full bg-[#005e53]/30 dark:bg-[#00796b]/30 h-[60%] rounded-t-sm" />
            <div className="w-full bg-[#005e53] dark:bg-[#00796b] h-[90%] rounded-t-sm" />
            <div className="w-full bg-[#005e53]/30 dark:bg-[#00796b]/30 h-[30%] rounded-t-sm" />
            <div className="w-full bg-[#005e53]/40 dark:bg-[#00796b]/40 h-[45%] rounded-t-sm" />
          </div>
          <p className="text-xs font-extrabold text-[#005e53] dark:text-[#a4f0e9]">Reducción del 12%</p>
        </div>

        {/* AQI warnings */}
        <div className="bg-[#ffdad6] dark:bg-[#3b0a0a] border border-[#ffdad6]/50 dark:border-red-900/30 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <span className="p-1 px-1.5 bg-red-100 dark:bg-red-900/50 rounded text-red-600 dark:text-red-400 mb-2 inline-block">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Disparador de Alerta</p>
            <p className="text-sm font-extrabold text-[#93000a] dark:text-red-100 mt-0.5">Calidad del Aire Baja</p>
          </div>
          <p className="text-[10px] text-red-650 dark:text-red-400 opacity-80 mt-1 font-semibold">Usa purificador de aire hoy</p>
        </div>
      </section>

      {/* Persistent floating action emergency triggers (bottom-right) */}
      <div className="fixed bottom-20 right-5 z-40">
        <button
          onClick={triggerAlertScreen}
          className="w-16 h-16 bg-[#ba1a1a] hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce border-4 border-white active:scale-95 transition cursor-pointer"
          title="SOS Alerta Rápida"
        >
          <Shield className="w-7 h-7 fill-white text-[#ba1a1a]" />
        </button>
      </div>

      {/* Render Playable modal */}
      <BreathingModal 
        isOpen={showBreathingModal} 
        onClose={() => setShowBreathingModal(false)} 
        technique={breathingConfig.type}
        exerciseName={breathingConfig.name}
      />
    </motion.div>
  );
}
