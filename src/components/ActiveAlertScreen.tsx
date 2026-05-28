/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  HeartPulse, 
  ShieldCheck, 
  HelpCircle, 
  Wind, 
  Sparkles, 
  Send, 
  Smile, 
  UserPlus, 
  Activity, 
  ThumbsUp, 
  AlertTriangle,
  Flame,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import PostAlertSurveyModal from './PostAlertSurveyModal';
import { EmergencyContact, UserProfile } from '../types';
import { useShakeDetection } from '../hooks/useShakeDetection';

interface ActiveAlertScreenProps {
  onCancel: () => void;
  onBreatheTrigger: () => void;
  sosContacts?: EmergencyContact[];
  userProfile?: UserProfile;
}

type ActiveTab = 'ai-support' | 'clinical-guide' | 'cbt-grounding';
type RescuePhase = 'Inhale' | 'Exhale' | 'Ready';

export default function ActiveAlertScreen({ 
  onCancel, 
  onBreatheTrigger, 
  sosContacts,
  userProfile
}: ActiveAlertScreenProps) {
  const finalContacts: EmergencyContact[] = (sosContacts && sosContacts.length > 0) 
    ? sosContacts 
    : [{ id: '911', name: '911 Emergencia', phone: '911', relation: 'Emergencia' }];
  const [timeLeft, setTimeLeft] = useState(9);
  const [triggered, setTriggered] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  
  // Shake-to-Cancel dialog state
  const [showShakeDialog, setShowShakeDialog] = useState(true);

  // Use the Shake hook
  useShakeDetection(() => {
    if (showShakeDialog && !triggered && !showSurvey) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      onCancel();
    }
  }, 20); // 20 magnitude implies a strong jog/shake

  // Navigation tabs for options
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-support');

  // Crisis Breathing parameters
  const [breathePhase, setBreathePhase] = useState<RescuePhase>('Ready');
  const [breatheSeconds, setBreatheSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(true);

  // Heart Rate simulator down-regulation state
  const [currentBpm, setCurrentBpm] = useState(142);
  const [breathingCyclesCompleted, setBreathingCyclesCompleted] = useState(0);

  // Gemini AI Calming Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'sofia'; text: string }>>([
    { 
      sender: 'sofia', 
      text: 'Hola, soy Sofía, tu asistente de calma. Respira hondo conmigo. Sé que esto asusta, pero estás seguro aquí. ¿Te enfocas en tu respiración o tienes opresión de pecho?' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Text-To-Speech function for Sofia
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Hablar el mensaje inicial al montar el componente
  useEffect(() => {
    speakText('Hola, soy Sofía, tu asistente de calma. Respira hondo conmigo. Sé que esto asusta, pero estás seguro aquí.');
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stroke math for circle logic: 2 * Math.PI * radius(44) ~ 276.46
  const strokeDasharray = 276.46;
  const strokeDashoffset = strokeDasharray * (1 - timeLeft / 9);

  // Countdown timer for emergency alert dispatch
  useEffect(() => {
    if (triggered || showSurvey) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTriggered(true);
          setShowShakeDialog(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [triggered, showSurvey]);

  // Escalation Workflow: Detection -> Confirmation (passed) -> Escalation
  useEffect(() => {
    if (triggered) {
      // 1. Attemp GPS Location Selection
      let locationObj: { lat: number, lng: number } | null = null;
      
      const dispatchAlerts = (loc: { lat: number, lng: number } | null) => {
        const mapsLink = loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : 'Ubicación no disponible';
        const messageText = `🚑 *ALERTA MÉDICA AUTOMÁTICA* 🚑\n\nEl paciente está reportando parámetros vitales críticos (Pulso actual simulado: ${currentBpm} BPM).\nUbicación GPS: ${mapsLink}\nPor favor, intenta contactarlo inmediatamente o despacha ayuda médica a esta ubicación.`;
        
        // 2. Dispatch SMS / Global Alerts (SOS)
        fetch('/api/firebase/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contacts: finalContacts,
            message: messageText
          })
        }).catch(err => console.error("Firebase SOS dispatch failed:", err));

        // 3. Dispatch Push / Critical Alerts (Android/iOS)
        // Attempting to dispatch to registered contacts if they have registered FCM tokens.
        // We'll simulate by passing generic / mocked targetTokens since we don't have real devices linked in this demo.
        fetch('/api/firebase/send-critical-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             targetTokens: ["SIMULATED_TARGET_DEVICE_TOKEN_123"],
             patientName: userProfile?.name || "Paciente de SafeBreath",
             alertMessage: messageText,
             location: loc
          })
        }).catch(err => console.error("Critical FCM alert dispatch failed:", err));
        
        console.log("Escalation Sequence Complete - Alerts Fired.");
      };

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationObj = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            dispatchAlerts(locationObj);
          },
          (err) => {
            console.warn("GPS failed or denied during escalation:", err);
            dispatchAlerts(null);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        dispatchAlerts(null);
      }
    }
  }, [triggered]);

  // Integrated Rescue Breath Pacing Loop (4s Inhale, 4s Exhale)
  useEffect(() => {
    if (!isBreathingActive || showShakeDialog) return;

    const interval = setInterval(() => {
      setBreatheSeconds(prev => {
        if (prev <= 1) {
          setBreathePhase(current => {
            if (current === 'Inhale') {
              if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
              setBreathingCyclesCompleted(cycles => {
                const nextCycles = cycles + 1;
                setCurrentBpm(bpm => {
                  const targetBpm = userProfile?.bpmReposo || 72;
                  if (bpm <= targetBpm) return targetBpm;
                  const nextBpm = bpm - (Math.floor(Math.random() * 3) + 4);
                  return nextBpm < targetBpm ? targetBpm : nextBpm;
                });
                return nextCycles;
              });
              return 'Exhale';
            } else {
              if ('vibrate' in navigator) navigator.vibrate(300);
              return 'Inhale';
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive, breathePhase, userProfile, showShakeDialog]);

  const handleHelpNow = () => {
    setTriggered(true);
    setTimeLeft(0);
    setShowShakeDialog(false);
  };

  const handleResolve = () => {
    setShowShakeDialog(false);
    setShowSurvey(true);
  };

  // Chat query triggers
  const handleQuickTapQuery = async (query: string) => {
    if (isAiLoading) return;
    
    const userMsg = { sender: 'user' as const, text: query };
    setChatMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini/calm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          userProfile: userProfile,
          currentVitals: { bpm: currentBpm, spo2: 95 }
        })
      });

      const data = await response.json();
      const reply = data.text || 'Mantén la calma y sigue respirando despacio.';
      setChatMessages(prev => [...prev, { sender: 'sofia', text: reply }]);
      speakText(reply);
    } catch (e) {
      console.error(e);
      const fallbackReply = 'Estoy contigo. Concéntrate primero en el círculo respiratorio superior. El dolor físico de la opresión disminuirá en minutos si alargamos la exhalación.';
      setChatMessages(prev => [...prev, { 
        sender: 'sofia', 
        text: fallbackReply 
      }]);
      speakText(fallbackReply);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!inputText.trim() || isAiLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    await handleQuickTapQuery(textToSend);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#ffdad6] to-[#fff1f0] dark:from-[#2e0003] dark:to-[#0f0001] min-h-screen flex flex-col justify-between p-4 pb-8">
        
        {/* SHAKE TO CANCEL OVERLAY */}
        <AnimatePresence>
          {showShakeDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-x-4 top-1/4 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-red-900/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center pb-8"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <Smartphone className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-[#071e27] dark:text-white mb-2 leading-tight">
                ¿Activaste SOS <br/>por accidente?
              </h2>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-6">
                Agita el teléfono fuertemente de lado a lado para cancelar la cuenta regresiva antes de {timeLeft} segundos.
              </p>

              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-6 relative">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 9, ease: "linear" }}
                  className="absolute inset-y-0 left-0 bg-red-500"
                />
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => onCancel()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition"
                >
                  Cancelar Tap
                </button>
                <button
                  onClick={() => setShowShakeDialog(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md shadow-red-500/20"
                >
                  Confirmar SOS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft background warning flash */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-red-400/20 dark:bg-red-800/10 filter blur-3xl rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 dark:bg-red-900/5 filter blur-3xl rounded-full animate-pulse" />
        </div>

        {/* Core Frame of Crisis Support */}
        <main className="relative z-10 w-full max-w-md mx-auto flex-grow flex flex-col items-center justify-between py-2 space-y-4">
          
          {/* Section A: Emergency Header with Pulse Status */}
          <header className="text-center w-full">
            <div className="flex flex-col items-center">
              <div className="relative">
                <span className="absolute inset-x-0 h-14 bg-red-500/20 rounded-full animate-ping scale-110" />
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${triggered ? 'bg-[#ba1a1a] text-white animate-pulse' : 'bg-[#ba1a1a] text-white'}`}>
                  <ShieldAlert className="w-7 h-7" />
                </div>
              </div>

              <h1 className="text-xl font-black tracking-tight mt-3 text-red-950 dark:text-red-100 uppercase sm:text-2xl">
                {triggered ? 'Alerta SOS Despachada' : 'Peligro Respiratorio'}
              </h1>
              
              <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-red-50/80 dark:bg-red-950/40 border border-red-200/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[11px] font-black text-red-800 dark:text-red-300 uppercase tracking-widest leading-none">
                  {triggered ? 'Geolocalización Activa y Compartida' : `Llamando a Emergencias en ${timeLeft}s`}
                </span>
              </div>
            </div>
          </header>

          {/* Section B: Dual Indicators - Heart Rate Simulator & Breathing Circle */}
          <section className="w-full bg-white dark:bg-[#1f0204] p-4 rounded-3xl shadow-md border border-red-100 dark:border-red-950/40 grid grid-cols-2 gap-4">
            
            {/* 1. Dynamic HR Simulator and Stabilization metrics */}
            <div className="flex flex-col justify-between p-1 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider block">Tu Pulso (Simulado)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black tracking-tighter text-red-650 dark:text-red-200 animate-pulse">
                    {currentBpm}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">BPM</span>
                </div>
              </div>

              {/* Progress bar representing recovery state */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 dark:text-red-400">
                  <span>Estabilización</span>
                  <span>{currentBpm > 100 ? 'Esfuerzo' : currentBpm > 85 ? 'Controlado' : 'Estable'}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-red-950/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, ((142 - currentBpm) / (142 - 72)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Recovery Status */}
              <div className="bg-gradient-to-r from-emerald-50 to-[#ebfaf3] dark:from-emerald-950/20 dark:to-teal-950/10 p-1.5 rounded-lg border border-emerald-500/10">
                <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block leading-snug">Ciclos de Calma</span>
                <span className="text-xs font-black text-[#136964] dark:text-emerald-300 block">
                  {breathingCyclesCompleted} completados
                </span>
              </div>
            </div>

            {/* 2. Cozy Rescue Breath Pacer circle */}
            <div className="bg-red-50/30 dark:bg-red-950/10 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center border border-red-500/5">
              <div className="relative w-24 h-24 flex items-center justify-center">
                
                {/* Wave expansion pulses on Inhale */}
                {breathePhase === 'Inhale' && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1.5], opacity: [0.6, 0.2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-teal-500/30 rounded-full ring-2 ring-teal-500/20"
                  />
                )}

                {/* Pulsating breathing circle itself */}
                <motion.div 
                  animate={{ scale: breathePhase === 'Inhale' ? 1.25 : 1.0 }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-md select-none border-2 border-white transition-colors duration-500 ${
                    breathePhase === 'Inhale' 
                      ? 'bg-gradient-to-b from-[#a4f0e9] to-[#00796b] text-white' 
                      : 'bg-gradient-to-b from-teal-50 to-teal-100 text-teal-800 border-teal-200'
                  }`}
                >
                  <Wind className="w-5 h-5 opacity-90 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-tight uppercase mt-0.5">
                    {breatheSeconds}s
                  </span>
                </motion.div>
              </div>

              <div className="mt-1">
                <span className="text-xs font-black text-[#136964] dark:text-emerald-300 block tracking-tight">
                  {breathePhase === 'Inhale' ? 'INHALA' : breathePhase === 'Exhale' ? 'EXHALA' : 'CONCENTRATE'}
                </span>
                <span className="text-[9px] text-gray-500 dark:text-red-400 block tracking-tight font-semibold mt-0.5 leading-none">
                  {breathePhase === 'Inhale' ? 'Llena tus pulmones' : 'Vota despacio con labios finos'}
                </span>
              </div>
            </div>

          </section>

          {/* Section C: Adaptive Options & Tools Workspace */}
          <div className="w-full flex-grow flex flex-col bg-white dark:bg-[#0f0001] rounded-3xl border border-red-100 dark:border-red-950/30 overflow-hidden shadow-sm min-h-[260px]">
            
            {/* Segmented Tab Headers */}
            <div className="flex border-b border-gray-100 dark:border-red-950/20 bg-gray-50/50 dark:bg-[#1a0305]">
              <button
                onClick={() => setActiveTab('ai-support')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai-support' 
                    ? 'border-[#00796b] text-[#00796b] dark:text-[#a4f0e9] dark:border-[#a4f0e9]' 
                    : 'border-transparent text-gray-500 dark:text-red-400 hover:text-[#005e53]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sofia IA de Calma</span>
              </button>
              <button
                onClick={() => setActiveTab('clinical-guide')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'clinical-guide' 
                    ? 'border-[#00796b] text-[#00796b] dark:text-[#a4f0e9] dark:border-[#a4f0e9]' 
                    : 'border-transparent text-gray-500 dark:text-red-400 hover:text-[#005e53]'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Soporte Clínico</span>
              </button>
              <button
                onClick={() => setActiveTab('cbt-grounding')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'cbt-grounding' 
                    ? 'border-[#00796b] text-[#00796b] dark:text-[#a4f0e9] dark:border-[#a4f0e9]' 
                    : 'border-transparent text-gray-500 dark:text-red-400 hover:text-[#005e53]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enraizamiento C.</span>
              </button>
            </div>

            {/* Tab Panel contents */}
            <div className="flex-grow p-4 min-h-[220px] max-h-[300px] overflow-y-auto flex flex-col justify-between">
              
              {/* Tab 1: AI Prompted calms panel */}
              {activeTab === 'ai-support' && (
                <div className="flex-grow flex flex-col justify-between h-full space-y-4">
                  {/* Messages Bubble wrapper */}
                  <div className="space-y-3 flex-grow overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-[#00796b] text-white font-bold rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-red-950/30 text-gray-800 dark:text-red-100 rounded-tl-none border border-gray-200/40 dark:border-red-950/30'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 dark:bg-red-950/20 rounded-2xl p-3 text-xs border border-gray-100 dark:border-red-950/10 flex items-center gap-2">
                          <Wind className="w-3.5 h-3.5 text-[#00796b] animate-spin" />
                          <span className="text-gray-400 font-semibold italic">Sofía está formulando aire de calma...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions / Inputs row */}
                  <div className="space-y-2">
                    {/* Quick assistance relief tags */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {[
                        { text: 'Ataque de pánico', tag: 'Tengo un ataque de pánico muy fuerte.' },
                        { text: 'Tengo asma activa', tag: 'Siento mucha opresión de asma.' },
                        { text: 'Siento opresión', tag: 'Tengo opresión constante en el pecho.' }
                      ].map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickTapQuery(t.tag)}
                          disabled={isAiLoading}
                          className="bg-red-50/60 dark:bg-red-950/30 text-[10px] font-extrabold text-red-900 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-200/20 active:scale-95 transition hover:bg-red-100/50 disabled:opacity-50 cursor-pointer"
                        >
                          {t.text}
                        </button>
                      ))}
                    </div>

                    {/* Custom chat inputs */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-red-955/20 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-red-950/20">
                      <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendCustomMessage();
                        }}
                        disabled={isAiLoading}
                        placeholder="Consúltale a tu coach de calma..."
                        className="flex-1 bg-transparent border-none text-xs outline-none text-gray-800 dark:text-white placeholder-gray-400 pr-2"
                      />
                      <button
                        onClick={handleSendCustomMessage}
                        disabled={!inputText.trim() || isAiLoading}
                        className="p-1.5 bg-[#00796b] text-white rounded-lg active:scale-90 transition disabled:opacity-30 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Clinical tactical safety rules advice */}
              {activeTab === 'clinical-guide' && (
                <div className="space-y-3.5 flex-grow overflow-y-auto">
                  <div className="space-y-3 text-xs leading-relaxed">
                    
                    {/* Action 1 */}
                    <div className="p-3 bg-red-50/20 dark:bg-red-950/10 rounded-xl border-l-[3.5px] border-amber-500 space-y-1">
                      <h4 className="font-extrabold text-[#93000a] dark:text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        <span>1. Postura de Alivio Inmediato</span>
                      </h4>
                      <p className="text-gray-650 dark:text-red-250 font-semibold">
                        Siéntate erguido en una silla firme. Inclina el tronco levemente hacia adelante con los codos en las rodillas. Esto reduce el esfuerzo respiratorio.
                      </p>
                    </div>

                    {/* Action 2 */}
                    <div className="p-3 bg-red-50/20 dark:bg-red-950/10 rounded-xl border-l-[3.5px] border-[#00796b] space-y-1">
                      <h4 className="font-extrabold text-[#1d706a] dark:text-[#a4f0e9] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-teal-600" />
                        <span>2. Afloja Cualquier Opresión</span>
                      </h4>
                      <p className="text-gray-650 dark:text-red-250 font-semibold">
                        Afloja corbatas, cuellos apretados, sujetadores o correas para maximizar la entrada de oxígeno. Expande el pecho tranquilamente.
                      </p>
                    </div>

                    {/* Action 3 */}
                    <div className="p-3 bg-red-50/20 dark:bg-red-950/10 rounded-xl border-l-[3.5px] border-emerald-600 space-y-1">
                      <h4 className="font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>3. Ventila el Entorno Directamente</span>
                      </h4>
                      <p className="text-gray-650 dark:text-red-250 font-semibold">
                        Pide abrir ventanas o busca una fuente de aire fresco directamente. Aléjate de polvo, humo de cigarrillo o alérgenos irritantes de asma.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 3: CBT Grounding Technique (5-4-3-2-1) */}
              {activeTab === 'cbt-grounding' && (
                <div className="space-y-4 flex-grow overflow-y-auto pr-1 text-xs">
                  <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-xl border border-teal-100 dark:border-teal-900/30 text-teal-800 dark:text-teal-300">
                    <p className="font-semibold mb-2">Desvía tu mente de la opresión conectando con tus sentidos. Busca a tu alrededor:</p>
                    
                    <div className="space-y-2 mt-3 font-medium">
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0c1a1e] p-2 rounded-lg">
                        <span className="bg-teal-500 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]">5</span>
                        <span>Cosas que puedas <span className="font-extrabold text-teal-700 dark:text-teal-400">VER</span> (ej: un reloj, el piso)</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0c1a1e] p-2 rounded-lg">
                        <span className="bg-teal-500 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]">4</span>
                        <span>Cosas que puedas <span className="font-extrabold text-teal-700 dark:text-teal-400">TOCAR</span> (ej: tu ropa, la silla)</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0c1a1e] p-2 rounded-lg">
                        <span className="bg-teal-500 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]">3</span>
                        <span>Cosas que puedas <span className="font-extrabold text-teal-700 dark:text-teal-400">OÍR</span> (ej: un auto, el viento)</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0c1a1e] p-2 rounded-lg">
                        <span className="bg-teal-500 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]">2</span>
                        <span>Cosas que puedas <span className="font-extrabold text-teal-700 dark:text-teal-400">OLER</span> (ej: perfume, comida)</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0c1a1e] p-2 rounded-lg">
                        <span className="bg-teal-500 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]">1</span>
                        <span>Cosa que puedas <span className="font-extrabold text-teal-700 dark:text-teal-400">SABOREAR</span> o pensar en algo bueno</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section D: Core actions control layout */}
          <div className="w-full flex flex-col gap-3 pt-2">
            {!triggered ? (
              <>
                <button
                  onClick={handleHelpNow}
                  className="w-full h-15 bg-[#ba1a1a] hover:bg-red-700 text-white rounded-2xl font-black text-base shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-5.5 h-5.5" />
                  <span>Despachar SOS Ahora</span>
                </button>

                <button
                  onClick={handleResolve}
                  className="w-full h-14 bg-white dark:bg-[#0c2a38]/10 hover:bg-gray-50 text-[#071e27] dark:text-white rounded-2xl font-black text-sm shadow-sm border border-gray-200 dark:border-red-950/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#136964] dark:text-emerald-400" />
                  <span>Estoy Bien / Calmar Alerta</span>
                </button>
              </>
            ) : (
              <div className="space-y-3 w-full">
                {/* Visual rescue summary box */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                  <p className="text-xs text-white drop-shadow-sm font-extrabold uppercase tracking-widest text-center">Contactos Notificados</p>
                  <div className="mt-2 space-y-1.5 text-xs text-gray-800">
                    {finalContacts.map((c, i) => (
                      <div key={c.id || i} className="flex justify-between items-center bg-white/90 px-3 py-2 rounded-lg shadow-sm font-bold">
                        <div>
                          <span className="text-xs">{c.name}</span>
                          {c.phone !== '911' && (
                            <span className="block text-[10px] text-gray-500 font-normal mt-0.5">{c.phone}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           {c.phone !== '911' && (
                             <a 
                               href={`https://wa.me/${(c.countryCode || '56').replace(/[^0-9]/g, '')}${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('SOS ALERTA: Tengo una emergencia médica. Por favor llamame o ayúdame, esta es una alerta automática desde mi dispositivo cardíaco.')}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-[10px] font-black tracking-wide text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-md hover:bg-emerald-200 transition"
                             >
                               WhatsApp
                             </a>
                           )}
                           <span className="text-red-600 animate-pulse text-[10px] uppercase font-black tracking-wider px-2">Alerta</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleResolve}
                  className="w-full h-15 bg-white text-[#93000a] text-center rounded-2xl font-extrabold text-sm shadow-md hover:bg-red-50 active:scale-95 transition cursor-pointer"
                >
                  Cancelar Alerta SOS / Volver
                </button>
              </div>
            )}
          </div>
        </main>

        <PostAlertSurveyModal
          isOpen={showSurvey}
          onSkip={onCancel}
          onSubmit={async (data) => {
            console.log('Survey submitted:', data);
            try {
              await fetch('/api/firebase/log-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  completedCycles: breathingCyclesCompleted,
                  finalBpm: currentBpm
                })
              });
            } catch (err) {
              console.error("Failed to log alert data: ", err);
            }
            onCancel();
          }}
        />
      </div>
    </AnimatePresence>
  );
}
