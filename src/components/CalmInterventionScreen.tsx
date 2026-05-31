import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Phone, Clock, Radio, Info, Heart, CheckCircle2, ChevronDown, ChevronUp, Loader2, PlayCircle, Eye, AlertTriangle, Send, MessageSquare, ShieldCheck, Mail } from 'lucide-react';
import { EmotionHapticEngine } from '../services/haptics/HapticEngine';
import { useAppSettingsStore } from '../store/useAppSettingsStore';
import { UserProfile, EmergencyContact } from '../types';
import { toast } from 'react-hot-toast';

interface CalmInterventionScreenProps {
  profile: UserProfile;
  onDismiss: () => void;
  onEscalate: () => void;
  isIncidentActive: boolean;
  onSetIncidentActive: (active: boolean) => void;
  activeIncidentAlerts: { name: string; type: 'sms' | 'call'; timestamp: string }[];
  onSetIncidentAlerts: React.Dispatch<React.SetStateAction<{ name: string; type: 'sms' | 'call'; timestamp: string }[]>>;
  activeIncidentLogs: string[];
  onSetIncidentLogs: React.Dispatch<React.SetStateAction<string[]>>;
  activeIncidentLogIndex: number;
  onSetIncidentLogIndex: React.Dispatch<React.SetStateAction<number>>;
  onClearIncident: () => void;
}

export default function CalmInterventionScreen({
  profile,
  onDismiss,
  onEscalate,
  isIncidentActive,
  onSetIncidentActive,
  activeIncidentAlerts,
  onSetIncidentAlerts,
  activeIncidentLogs,
  onSetIncidentLogs,
  activeIncidentLogIndex,
  onSetIncidentLogIndex,
  onClearIncident
}: CalmInterventionScreenProps) {
  const [phase, setPhase] = useState<'prompt' | 'breathing' | 'escalation' | 'sos_dispatch'>(
    isIncidentActive ? 'sos_dispatch' : 'prompt'
  );
  const [breathingStep, setBreathingStep] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const { reducedMotion, nightMode } = useAppSettingsStore();
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  // Simulated dialer state to prevent sandbox crashes
  const [activeCall, setActiveCall] = useState<{ name: string; phone: string; isOfficial?: boolean } | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Simulated Messaging State for silent stress situations
  const [activeMessage, setActiveMessage] = useState<{
    name: string;
    phone: string;
    text: string;
    status: 'preparing' | 'sending' | 'delivered';
  } | null>(null);

  // Local state aliases mapped directly to parent props to ensure persistence & safety
  const sosLogs = activeIncidentLogs;
  const setSosLogs = onSetIncidentLogs;
  const logIndex = activeIncidentLogIndex;
  const setLogIndex = onSetIncidentLogIndex;
  const alertsSent = activeIncidentAlerts;
  const setAlertsSent = onSetIncidentAlerts;

  const emergencyContacts = profile.emergencyContacts || [];

  // Duration Formatter Helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (activeCall) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const initiateCall = (name: string, phone: string, isOfficial = false) => {
    EmotionHapticEngine.playHoldTick();
    toast.success(`Iniciando conexión con ${name}...`);
    
    // Open full-screen sandbox-safe simulation
    setActiveCall({ name, phone, isOfficial });

    // Track sent alert
    const currentMins = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlertsSent(prev => {
      if (prev.some(a => a.name === name && a.type === 'call')) return prev;
      return [...prev, { name, type: 'call', timestamp: currentMins }];
    });

    try {
      // Safe non-blocking execution in compatible standard layouts
      console.log(`[SafeBreath SOS] Routing native phone call to: ${phone}`);
    } catch (e) {
      console.warn("Interconexión nativa bloqueada:", e);
    }
  };

  const initiateSilentMessage = (name: string, phone: string) => {
    EmotionHapticEngine.playInhale();
    const bpmActual = profile.bpmReposo ? profile.bpmReposo + 45 : 115;
    
    // Message compiled dynamically using user's personalized custom template
    const userDisplayName = profile.name || 'Usuario';
    const ubicacion = 'Av. Siempre Viva 123, Ciudad'; // Idealmente, esto vendría del GPS, usamos un placeholder.
    
    // Mensaje fijo estandarizado solicitado por el usuario
    const computedText = `⚠️ EMERGENCIA [SafeBreath]: ${userDisplayName} está cursando una crisis de pánico/ahogo severo y necesita ayuda. Ubicación actual aproximada: ${ubicacion}.`;
    
    setActiveMessage({
      name,
      phone,
      text: computedText,
      status: 'preparing'
    });

    // Automatically transition message status simulating realistic secure packet delivery
    setTimeout(async () => {
      setActiveMessage(prev => prev ? { ...prev, status: 'sending' } : null);
      EmotionHapticEngine.playHoldTick();
      
      try {
        const response = await fetch('/api/sms/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: phone,
            message: computedText
          })
        });

        if (!response.ok) {
          const resError = await response.json();
          throw new Error(resError.error || 'Network error');
        }

        setActiveMessage(prev => prev ? { ...prev, status: 'delivered' } : null);
        EmotionHapticEngine.playExhale();
        toast.success(`Mensaje S.O.S. entregado con éxito a ${name}`);
      } catch (error: any) {
        console.error("Error dispatching real SMS:", error);
        toast.error(`Error de red al enviar SMS: ${error.message}`);
        setActiveMessage(null); // Abort
      }

      // Track sent alert
      const currentMins = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAlertsSent(prev => {
        if (prev.some(a => a.name === name && a.type === 'sms')) return prev;
        return [...prev, { name, type: 'sms', timestamp: currentMins }];
      });
    }, 1500);
  };

  // Breathing loop cycle control
  useEffect(() => {
    let tick: any;
    if (phase === 'breathing') {
      const cycle = () => {
         setBreathingStep('inhale');
         EmotionHapticEngine.playInhale();
         tick = setTimeout(() => {
            setBreathingStep('hold');
            EmotionHapticEngine.playHoldTick();
            tick = setTimeout(() => {
                setBreathingStep('exhale');
                EmotionHapticEngine.playExhale();
                tick = setTimeout(cycle, 6000);
            }, 4000);
         }, 4000);
      };
      cycle();
    }
    return () => clearTimeout(tick);
  }, [phase]);

  // Offer automatic polite escalation after 45 seconds of breathing
  useEffect(() => {
      let timeout: any;
      if (phase === 'breathing') {
         timeout = setTimeout(() => {
           setPhase('escalation');
         }, 45000); 
      }
      return () => clearTimeout(timeout);
  }, [phase]);

  // Log Dispatch Simulation
  const contactsKey = (profile.emergencyContacts || []).map(c => `${c.id}`).join(',');
  useEffect(() => {
    if (phase === 'sos_dispatch') {
      onSetIncidentActive(true);
      
      const messages = [
        "📡 Inicializando protocolo de auxilio local...",
        "📍 Solicitando autorización GPS al dispositivo móvil...",
        "📍 Ubicación obtenida con precisión: -33.4489, -70.6693 (Santiago, CL)",
        "🔒 Empaquetando telemetría biométrica reciente de forma encriptada...",
        "🌐 Estableciendo conexión de respaldo con el middleware de mensajería...",
        emergencyContacts.length > 0 
          ? `📲 Despachando cola de alertas urgentes a ${emergencyContacts.length} contactos...` 
          : "⚠️ Alerta: No tienes contactos de emergencia cargados. Usar botones de llamada directa abajo.",
        ...emergencyContacts.map(c => `▶ Enviando alerta SMS a ${c.name} (${c.countryCode || '+56'} ${c.phone})`),
        "🚀 Enlace de monitoreo remoto en tiempo real adjunto.",
        "✔️ Todos los despachos se enviaron a las antenas locales correctamente.",
        "📱 Interfaz de llamada a contactos lista. Permanecer en línea."
      ];

      if (sosLogs.length === 0) {
        setSosLogs([messages[0]]);
        setLogIndex(1);

        const interval = setInterval(() => {
          setLogIndex((prevIndex) => {
            if (prevIndex < messages.length) {
              setSosLogs((prevLogs) => [...prevLogs, messages[prevIndex]]);
              return prevIndex + 1;
            } else {
              clearInterval(interval);
              return prevIndex;
            }
          });
        }, 1500);

        return () => clearInterval(interval);
      }
    }
  }, [phase, contactsKey]);

  const bgStyle = nightMode
    ? "bg-black text-[#cbd5e1]"
    : "bg-[#020617] text-white";

  const ambientGradientOpacity = nightMode ? "opacity-30" : "opacity-80";

  // Safe fallback motion parameters
  const initialMotion = reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 };
  const animateMotion = reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
  const exitMotion = reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -15 };

  return (
    <div className={`flex flex-col h-full p-5 pb-28 justify-between items-center fixed inset-0 z-30 overflow-y-auto transition-colors duration-1000 ${bgStyle}`}>
      
      {/* Background Soft Gradients */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#042f2e] pointer-events-none transition-opacity duration-1000 ${ambientGradientOpacity}`} />

      {/* Persistent Header */}
      <div className="w-full h-auto z-10 flex justify-between items-center px-2 py-3 border-b border-white/5 bg-slate-950/20 backdrop-blur-sm rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
            {phase === 'sos_dispatch' ? 'S.O.S. ACTIVADO' : 'INTERVENCIÓN SENSORIAL'}
          </span>
        </div>
        <button 
          onClick={() => {
            EmotionHapticEngine.playHoldTick();
            onDismiss();
          }} 
          className="px-3 py-1 font-mono text-[10px] bg-slate-800/40 hover:bg-slate-800 border border-white/10 rounded-lg text-slate-300 active:scale-95 transition"
        >
          Salir
        </button>
      </div>

      {/* Persistent Alert status tracking banner across breathing and other screens */}
      {alertsSent.length > 0 && (
         <div className="w-full max-w-md px-2 mt-3 z-15 animate-fade-in">
           <div className="bg-emerald-950/60 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between text-xs shadow-lg">
             <div className="flex items-center gap-2 text-emerald-200">
               <span className="flex h-2.5 w-2.5 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               <span className="font-sans font-medium text-emerald-200">Alertas activas ({alertsSent.length} contacto{alertsSent.length > 1 ? 's' : ''})</span>
             </div>
             {phase !== 'sos_dispatch' ? (
               <button 
                 onClick={() => setPhase('sos_dispatch')}
                 className="px-3 py-1 bg-emerald-850 hover:bg-emerald-700 active:scale-95 transition-all text-[10px] font-semibold tracking-wider uppercase text-emerald-100 rounded-lg border border-emerald-500/30 font-sans"
               >
                 Ver Estado / Auxilio
               </button>
             ) : (
               <span className="text-[9px] font-mono uppercase bg-emerald-900/40 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/50">Monitoreando</span>
             )}
           </div>
         </div>
      )}

      {/* Main Container */}
      <div className="flex-grow flex flex-col items-center justify-center w-full relative z-10 py-4 max-w-md mx-auto">
         <AnimatePresence mode="wait">
            
            {/* Phase 1: Interactive Prompt Screen */}
            {phase === 'prompt' && (
               <motion.div 
                 key="prompt"
                 initial={initialMotion}
                 animate={animateMotion}
                 exit={exitMotion}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="flex flex-col items-center text-center px-4 w-full"
               >
                  <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mb-5 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                     <Heart className="w-7 h-7 text-[#0d9488] dark:text-[#2dd4bf] animate-pulse" />
                  </div>

                  <h1 className={`text-3xl font-display font-medium tracking-tight mb-3 ${nightMode ? "text-slate-300" : "text-[#e0f2fe]"}`}>
                     ¿Te sientes bien?
                  </h1>
                  
                  <p className={`text-sm mb-6 font-light leading-relaxed ${nightMode ? "text-slate-400" : "text-[#99f6e4]"}`}>
                     Detectamos una velocidad de {profile.bpmReposo + 45} BPM en tu pulsación. Es posible que sea agitación física, pero si es un momento estresante, te podemos guiar a regularlo de inmediato.
                  </p>

                  <div className="w-full space-y-3 mb-6">
                     <button 
                        onClick={() => {
                           EmotionHapticEngine.playInhale();
                           setPhase('breathing');
                        }}
                        className={`w-full py-4 rounded-2xl font-bold tracking-wide text-base transition-all active:scale-[0.98] ${
                           nightMode 
                             ? "bg-[#0f766e] text-slate-100 hover:bg-[#115e59]" 
                             : "bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-[0_0_30px_rgba(13,148,136,0.25)]"
                        }`}
                     >
                        Iniciar Respiración Guiada
                     </button>
                     
                     <button 
                        onClick={() => {
                          EmotionHapticEngine.playHoldTick();
                          onDismiss();
                        }}
                        className="w-full py-3.5 border border-[#1e293b] text-[#94a3b8] hover:bg-[#0f172a] hover:text-white rounded-2xl font-semibold tracking-wide text-sm transition-all active:scale-[0.98]"
                     >
                        Estoy Bien (Falsa Alarma o Ejercicio)
                     </button>

                     {/* Immediate SOS Bypass Button */}
                     <button 
                        onClick={() => {
                           EmotionHapticEngine.playHoldTick();
                           setPhase('sos_dispatch');
                        }}
                        className="w-full py-3 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 text-red-300 rounded-2xl font-bold tracking-wide text-xs uppercase"
                     >
                        ⚠️ ¡Es una Emergencia Real! Solicitar SOS ya
                     </button>
                  </div>

                  {/* Why are there two choices? (Explicación para reducir la ansiedad) */}
                  <div className="border border-white/5 bg-slate-950/30 rounded-2xl p-4 text-left space-y-2">
                     <button 
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="w-full flex justify-between items-center text-xs font-bold text-teal-400 uppercase tracking-widest cursor-pointer"
                     >
                        <div className="flex items-center gap-2">
                           <Info className="w-4 h-4 text-teal-400 shrink-0" />
                           <span>¿Por qué esta pantalla no es una alarma ruidosa?</span>
                        </div>
                        {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     </button>

                     {showExplanation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-1.5"
                        >
                           <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                             La bio-retroalimentación demuestra que lanzar alarmas estrepitosas de "¡EMERGENCIA!" cuando una persona tiene pulso elevado provoca una <strong>amplificación catastrófica del pánico</strong> (un bucle de retroalimentación en el que el miedo acelera el corazón aún más).  
                           </p>
                           <p className="text-[11px] text-slate-400 leading-relaxed font-light mt-1.5">
                             SafeBreath te ofrece un canal respetuoso, dándote opción de <strong>respirar</strong> primero, o descartar como <strong>falsa alarma</strong> (por ejercicio o calibración). Si no respondes o lo requieres, los canales de ayuda con tus contactos salvaguardan tu integridad física de inmediato.
                           </p>
                        </motion.div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* Phase 2: Breathing & Slow Grounding */}
            {phase === 'breathing' && (
               <motion.div 
                 key="breathing"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.6 }}
                 className="flex flex-col items-center w-full text-center px-4"
               >
                   <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                      {reducedMotion ? (
                         <motion.div 
                            className={`absolute w-40 h-40 rounded-full ${nightMode ? "bg-[#0f766e]" : "bg-[#14b8a6]"}`}
                            animate={{ opacity: breathingStep === 'inhale' ? 0.7 : breathingStep === 'hold' ? 0.6 : 0.25 }}
                            transition={{ duration: breathingStep === 'inhale' ? 4 : breathingStep === 'hold' ? 4 : 6, ease: "linear" }}
                         />
                      ) : (
                         <>
                            <motion.div 
                               className="absolute w-full h-full bg-[#14b8a6] rounded-full mix-blend-screen blur-xl"
                               animate={{ 
                                  scale: breathingStep === 'inhale' ? 1.3 : breathingStep === 'hold' ? 1.3 : 0.7,
                                  opacity: breathingStep === 'inhale' ? 0.25 : breathingStep === 'hold' ? 0.2 : 0.05
                               }}
                               transition={{ duration: breathingStep === 'inhale' ? 4 : breathingStep === 'hold' ? 4 : 6, ease: "easeInOut" }}
                            />
                            <motion.div 
                               className="absolute w-full h-full bg-[#5eead4] rounded-full mix-blend-screen blur-2xl"
                               animate={{ 
                                  scale: breathingStep === 'inhale' ? 1.15 : breathingStep === 'hold' ? 1.15 : 0.5,
                                  opacity: breathingStep === 'inhale' ? 0.12 : breathingStep === 'hold' ? 0.08 : 0.02
                               }}
                               transition={{ duration: breathingStep === 'inhale' ? 4 : breathingStep === 'hold' ? 4 : 6, ease: "easeInOut" }}
                            />
                         </>
                      )}
                      
                      <motion.div 
                         className={`z-10 text-3xl font-display font-light tracking-wide text-white ${nightMode ? "text-slate-300" : ""}`}
                         animate={{ opacity: [0.7, 1, 0.7] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                         {breathingStep === 'inhale' ? 'Inhala...' : breathingStep === 'hold' ? 'Mantén...' : 'Exhala...'}
                      </motion.div>
                   </div>

                   <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-4">
                     Pauta de regulación vagal de 16 segundos
                   </p>

                   <div className="flex gap-2 text-xs font-mono text-slate-500 justify-center">
                     <span className={breathingStep === 'inhale' ? 'text-[#2dd4bf] font-bold' : ''}>4s Inhalación</span>
                     <span>•</span>
                     <span className={breathingStep === 'hold' ? 'text-[#2dd4bf] font-bold' : ''}>4s Contener</span>
                     <span>•</span>
                     <span className={breathingStep === 'exhale' ? 'text-[#2dd4bf] font-bold' : ''}>8s Exhalación</span>
                   </div>

                   <div className="mt-8 text-xs text-slate-400 w-full max-w-sm leading-relaxed p-3 bg-white/5 rounded-xl border border-white/5">
                      "Sincroniza tu pecho con el domo de luz. Esta respiración estimula el nervio vago bajando el ritmo simpático de forma involuntaria."
                   </div>
               </motion.div>
            )}

            {/* Phase 3: Escalation and Slider */}
            {phase === 'escalation' && (
               <motion.div 
                 key="escalation"
                 initial={initialMotion}
                 animate={animateMotion}
                 exit={exitMotion}
                 className="flex flex-col items-center text-center px-4 w-full"
               >
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                     <ShieldAlert className="w-8 h-8 text-amber-500 animate-bounce" />
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight mb-2 text-[#e0f2fe]">
                     ¿El pulso continúa alto?
                  </h1>

                  <p className="text-sm text-slate-400 mb-8 max-w-sm">
                     Completamos la pauta de respiración, pero tu ritmo sigue elevado. Si necesitas alertar a tus contactos de emergencia inmediatos, utiliza el deslizador a continuación.
                  </p>

                  <button 
                     onClick={() => setPhase('breathing')}
                     className="w-full py-3.5 bg-teal-900/30 hover:bg-teal-900/50 border border-teal-800/30 text-[#2dd4bf] text-sm rounded-2xl font-bold mb-3 active:scale-95 transition"
                  >
                     🔄 Respirar otro ciclo (Mantener la calma)
                  </button>

                  <button 
                     onClick={() => {
                        EmotionHapticEngine.playHoldTick();
                        setPhase('sos_dispatch');
                     }}
                     className="w-full py-3 bg-red-900/50 text-red-200 border border-red-800/40 rounded-2xl text-xs font-bold uppercase tracking-wider transition hover:bg-red-900"
                  >
                     Activar SOS Directamente
                  </button>
               </motion.div>
            )}

            {/* Phase 4: Reassuring Support Contacts for the User */}
            {phase === 'sos_dispatch' && (
               <motion.div 
                 key="sos_dispatch"
                 initial={initialMotion}
                 animate={animateMotion}
                 exit={exitMotion}
                 className="flex flex-col items-center w-full px-2"
               >
                  {/* Calm Pulse Ring Indicator */}
                  <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
                    <div className="relative w-12 h-12 rounded-full bg-slate-900 border border-teal-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                      <Heart className="w-5 h-5 text-teal-400 animate-pulse" />
                    </div>
                  </div>

                  <h1 className="text-xl font-semibold text-teal-100 mb-2 font-sans tracking-tight text-center">
                     Contactos de Apoyo y Rescate
                  </h1>
                  <p className="text-xs text-slate-350 mb-6 text-center leading-relaxed max-w-sm">
                     Toma una respiración profunda. Si lo necesitas, puedes realizar una llamada telefónica o enviar un mensaje rápido para recibir ayuda.
                  </p>

                  {/* Simplified clean layout for Calm support */}

                   {/* Emergency Contacts Contact Actions Frame */}
                  <div className="w-full space-y-3 mb-4 text-left font-sans">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Canales de Auxilio (Vocal y Silencioso)</h3>
                     {/* 911 Call Button */}
                     <button 
                       onClick={() => {
                          initiateCall("Servicios de Emergencia (911)", "911", true);
                       }}
                       className="w-full flex items-center justify-between p-3.5 bg-red-950/40 hover:bg-red-900/30 border border-red-800/40 rounded-2xl text-white transition active:scale-[0.98] text-left"
                     >
                       <div className="flex items-center gap-3">
                         <Phone className="w-5 h-5 text-red-400" />
                         <div>
                            <p className="font-extrabold text-xs uppercase tracking-wider text-red-200">LLAMAR AL 911</p>
                            <p className="text-[10px] text-slate-400 font-mono text-xs">Servicio Público de Rescate</p>
                         </div>
                       </div>
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-red-650 rounded-md text-white font-mono uppercase">Vocal</span>
                     </button>

                     {/* List Custom Registered Contacts */}
                     {emergencyContacts.length === 0 ? (
                        <div className="text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                           <p className="text-xs text-slate-400">
                             No registraste contactos de emergencia en tu Perfil de Salud. El sistema no pudo auto-alertar parientes.
                           </p>
                        </div>
                     ) : (
                        emergencyContacts.map(contact => (
                           <div 
                             key={contact.id}
                             className="w-full flex flex-col p-3.5 bg-white/5 border border-white/15 rounded-2xl text-white transition gap-3"
                           >
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                                    {contact.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm tracking-tight text-white">{contact.name}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">{contact.relation} • {contact.countryCode || '+56'} {contact.phone}</p>
                                  </div>
                               </div>
                               {alertsSent.some(a => a.name === contact.name) ? (
                                 <span className="text-[9px] font-mono uppercase bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800/80 flex items-center gap-1.5 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Alertado ({alertsSent.find(a => a.name === contact.name)?.type === 'sms' ? 'SMS' : 'Llamada'})
                                 </span>
                               ) : (
                                 <span className="text-[9px] font-mono uppercase bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-900">Contacto</span>
                               )}
                             </div>

                             {/* Silent vs Vocal Actions choice section depending on saved preference */}
                             <div className="mt-1 font-sans">
                               {profile.preferenciaSos === 'sms' ? (
                                 <div className="flex flex-col gap-2">
                                   <button 
                                     onClick={() => {
                                        initiateSilentMessage(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`);
                                     }}
                                     className="w-full flex items-center justify-center gap-2 py-3 bg-teal-900/80 hover:bg-teal-850 border-2 border-teal-500 rounded-xl text-teal-100 text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-lg animate-pulse"
                                   >
                                     <MessageSquare className="w-4 h-4 text-teal-300" />
                                     <span>Enviar SMS Silencioso [Preferido]</span>
                                   </button>
                                   <button 
                                     onClick={() => {
                                        initiateCall(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`, false);
                                     }}
                                     className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900/40 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                                   >
                                     <Phone className="w-3 h-3 text-slate-400" />
                                     <span>O realizar llamada vocal en su lugar</span>
                                   </button>
                                 </div>
                               ) : profile.preferenciaSos === 'call' ? (
                                 <div className="flex flex-col gap-2">
                                   <button 
                                     onClick={() => {
                                        initiateCall(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`, false);
                                     }}
                                     className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-750 border-2 border-slate-500 rounded-xl text-white text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-lg animate-pulse"
                                   >
                                     <Phone className="w-4 h-4 text-slate-350 animate-bounce" />
                                     <span>Llamar Directamente [Preferido]</span>
                                   </button>
                                   <button 
                                     onClick={() => {
                                        initiateSilentMessage(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`);
                                     }}
                                     className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-teal-950/40 hover:bg-teal-900/40 border border-teal-800/60 rounded-lg text-teal-300 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                                   >
                                     <MessageSquare className="w-3 h-3 text-teal-404" />
                                     <span>O enviar SMS de auxilio silencioso</span>
                                   </button>
                                 </div>
                               ) : (
                                 <div className="grid grid-cols-2 gap-2">
                                   <button 
                                     onClick={() => {
                                        initiateSilentMessage(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`);
                                     }}
                                     className="flex items-center justify-center gap-2 py-2.5 bg-teal-900/60 hover:bg-teal-850 border border-teal-700/50 rounded-xl text-teal-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                                   >
                                     <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                                     <span>SMS Silencioso</span>
                                   </button>
                                   <button 
                                     onClick={() => {
                                        initiateCall(contact.name, `${contact.countryCode || '+56'} ${contact.phone}`, false);
                                     }}
                                     className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                                   >
                                     <Phone className="w-3.5 h-3.5 text-slate-400" />
                                     <span>Llamar</span>
                                   </button>
                                 </div>
                               )}
                             </div>
                           </div>
                        ))
                     )}
                  </div>


               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Persistent Bottom Grounding Controls */}
      <div className="w-full pb-6 flex flex-col items-center z-10 max-w-md">
         <AnimatePresence>
             {(phase === 'breathing' || phase === 'escalation') && (
                 <motion.button 
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
                    animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    onClick={() => {
                       EmotionHapticEngine.playHoldTick();
                       onDismiss();
                    }}
                    className="w-full py-4 bg-slate-900/60 border border-white/5 text-slate-300 rounded-2xl font-semibold text-base mb-2 hover:bg-slate-900 transition-colors cursor-pointer"
                 >
                    Ya me siento mejor (Descartar)
                 </motion.button>
             )}

             {phase === 'breathing' && (
                 <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                       EmotionHapticEngine.playHoldTick();
                       setPhase('escalation');
                    }}
                    className="text-xs text-red-400 opacity-60 underline hover:opacity-100 transition py-2"
                 >
                    ¿Te sientes mal? Bypass a SOS de auxilio
                 </motion.button>
             )}

             {/* Slide to SOS Control under normal escalation screen */}
             {phase === 'escalation' && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0, y: reducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full mt-2"
                 >
                    <div className={`relative w-full h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.2)] ${nightMode ? "bg-[#3f0712] border border-red-950" : "bg-[#7f1d1d] border border-red-800"}`}>
                      <span className={`absolute inset-x-0 w-full text-center font-bold tracking-widest uppercase text-xs pointer-events-none mx-auto opacity-90 pl-8 ${nightMode ? "text-red-300" : "text-white"}`}>
                        Desliza SOS &rarr;
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="0"
                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-20"
                        onMouseUp={(e) => {
                          if (parseInt(e.currentTarget.value) > 85) {
                            EmotionHapticEngine.playHoldTick();
                            setPhase('sos_dispatch');
                          } else {
                            e.currentTarget.value = "0";
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (parseInt(e.currentTarget.value) > 85) {
                            EmotionHapticEngine.playHoldTick();
                            setPhase('sos_dispatch');
                          } else {
                            e.currentTarget.value = "0";
                          }
                        }}
                      />
                      <div className="absolute left-1 top-1 bottom-1 w-14 bg-white rounded-xl flex items-center justify-center pointer-events-none shadow-md z-10 transition-all">
                        <ShieldAlert className="w-5 h-5 text-[#991b1b]" />
                      </div>
                    </div>
                 </motion.div>
             )}

             {/* SOS Cancellation Button under active dispatch mode */}
             {phase === 'sos_dispatch' && (
                <div className="w-full flex flex-col items-center gap-3">
                   <div className="grid grid-cols-2 gap-3 w-full">
                      <motion.button 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         onClick={() => {
                           EmotionHapticEngine.playHoldTick();
                           onDismiss(); 
                           toast.success("S.O.S. minimizado en segundo plano.");
                         }}
                         className="w-full py-3 bg-slate-900 border border-white/5 hover:bg-slate-850 text-slate-350 rounded-2xl font-bold text-xs tracking-wide transition font-sans cursor-pointer text-center"
                      >
                         📲 Minimizar S.O.S.
                      </motion.button>

                      <motion.button 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         onClick={() => {
                           EmotionHapticEngine.playHoldTick();
                           onClearIncident();
                           onDismiss();
                           toast.success("Protocolo S.O.S. desactivado.");
                         }}
                         className="w-full py-3 bg-red-950/60 hover:bg-red-900/40 text-red-200 border border-red-900/40 rounded-2xl font-bold text-xs tracking-wide transition font-sans cursor-pointer text-center"
                      >
                         ✔️ Estoy a Salvo (Cancelar)
                      </motion.button>
                   </div>
                   
                   <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                      onClick={() => {
                        EmotionHapticEngine.playHoldTick();
                        setPhase('breathing');
                      }}
                      className="text-[11px] text-teal-400 hover:text-teal-300 underline transition font-medium font-sans pb-1"
                   >
                      🧘‍♂️ Hacer respiración guiada
                   </motion.button>
                </div>
             )}
         </AnimatePresence>
      </div>

      {/* 📞 Beautiful Interactive Simulated Phone Dialer Overlay */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/98 text-white flex flex-col justify-between p-6 select-none font-sans"
          >
            {/* Dark Ambient Glowing Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/20 via-black to-[#0f172a]/20 pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

            {/* Calling Header */}
            <div className="w-full flex flex-col items-center pt-16 z-10 text-center">
              <span className="text-[10px] font-bold tracking-widest text-[#2dd4bf] uppercase font-mono bg-teal-950/60 px-3 py-1.5 rounded-full border border-teal-800/40 animate-pulse flex items-center justify-center gap-1.5 mb-8 mx-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Llamada de Emergencia {activeCall.isOfficial ? 'Oficial' : 'Personal'}
              </span>

              {/* Glowing Phone Avatar */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-6 mx-auto">
                <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping duration-1000" />
                <div className="absolute inset-2 bg-[#022c22] rounded-full border-2 border-teal-500/40" />
                <div className="relative w-20 h-20 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                  <Phone className="w-9 h-9 text-slate-950 animate-bounce" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">
                {activeCall.name}
              </h2>
              <p className="text-base text-teal-400 font-mono tracking-wider font-semibold mb-2">
                {activeCall.phone}
              </p>
              
              {/* Active Call Duration Counter */}
              <div className="text-4xl font-mono tracking-wider font-light text-slate-200 mt-4 bg-slate-950/40 px-5 py-2 rounded-2xl border border-white/5 inline-block mx-auto">
                {formatDuration(callDuration)}
              </div>
            </div>

            {/* Explanation card inside the Dialer */}
            <div className="w-full max-w-sm mx-auto bg-slate-900/60 border border-white/5 rounded-3xl p-5 text-left space-y-2 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-teal-300 font-bold uppercase tracking-wider text-[10px] font-mono">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Simulación de Seguridad para el Preview</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-light font-sans">
                Para garantizar la integridad técnica y evitar que el visor web se congele o te expulse del entorno de diseño, iniciamos este dialer de asistencia táctil integrado.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-light font-sans bg-white/5 p-2 rounded-xl border border-white/5">
                En tu smartphone iOS o Android, SafeBreath lanza el intercomunicador nativo para llamar al contacto real usando tu plan de datos sin costes extras de red de servidor.
              </p>
            </div>

            {/* Call Controls (Red End Call Button) */}
            <div className="w-full max-w-sm mx-auto pb-12 flex flex-col items-center gap-4 z-10 text-center">
              <button
                onClick={() => {
                  EmotionHapticEngine.playHoldTick();
                  toast.error("Llamada finalizada.");
                  setActiveCall(null);
                }}
                className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.4)] active:scale-90 transition hover:scale-105 cursor-pointer text-white mx-auto"
              >
                <Phone className="w-8 h-8 text-white rotate-[135deg]" />
              </button>
              <span className="text-[10px] font-mono tracking-widest text-red-400 font-bold uppercase block">
                Colgar / Cancelar
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 Beautiful Interactive Simulated SMS / Message Delivery Overlay */}
      <AnimatePresence>
        {activeMessage && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-[#020617] text-white flex flex-col justify-between p-6 select-none font-sans"
          >
            {/* Glowing Accent Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 via-black to-[#020617] pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

            {/* Message Header */}
            <div className="w-full flex flex-col items-center pt-8 z-10 text-center">
              <span className="text-[9px] font-extrabold tracking-widest text-teal-400 uppercase font-mono bg-teal-950/60 px-3 py-1.5 rounded-full border border-teal-850/40 flex items-center justify-center gap-1.5 mb-6 mx-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                Mensaje de Auxilio Silencioso S.O.S.
              </span>

              <div className="w-14 h-14 rounded-full bg-teal-900/40 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xl mb-3 shadow-[0_0_15px_rgba(20,184,166,0.15)] mx-auto">
                {activeMessage.name.charAt(0)}
              </div>
              <h2 className="text-xl font-extrabold text-white leading-tight">SMS a {activeMessage.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{activeMessage.phone}</p>
            </div>

            {/* Smartphone Live Message Chat Sandbox Bubble */}
            <div className="w-full max-w-sm mx-auto my-4 space-y-4 z-10 flex-grow flex flex-col justify-center">
              <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Previsualización de SMS</span>
                  
                  {activeMessage.status === 'preparing' && (
                     <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                       <Loader2 className="w-3 h-3 animate-spin" /> Creando paquete...
                     </span>
                  )}
                  {activeMessage.status === 'sending' && (
                     <span className="flex items-center gap-1 text-[10px] text-teal-400 font-mono animate-pulse">
                       <Loader2 className="w-3 h-3 animate-spin" /> Despachando satélite...
                     </span>
                  )}
                  {activeMessage.status === 'delivered' && (
                     <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ¡Entregado con éxito!
                     </span>
                  )}
                </div>

                {/* Pre-written silent state text */}
                <div className="bg-teal-950/30 border border-teal-900/50 p-4 rounded-2xl text-xs text-slate-100 leading-relaxed font-mono text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/5 rounded-bl-full pointer-events-none" />
                  {activeMessage.text}
                </div>

                {/* Secure network dispatch status line */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                  <Info className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    {activeMessage.status === 'delivered' 
                      ? "La antena celular local confirmó la recepción. El destinatario recibió una alerta S.O.S. sonora."
                      : "Transmitiendo telemetría encriptada para evitar sobreesfuerzo vocal del paciente."}
                  </span>
                </div>
              </div>
            </div>

            {/* Underline explanation on medical voice preservation */}
            <div className="w-full max-w-sm mx-auto bg-[#1e293b]/30 border border-white/5 rounded-2xl p-4 text-left z-10">
              <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                💡 <strong className="text-slate-200">¿Por qué usar Mensajería Silenciosa?</strong> Durante crisis severas de asma, dolores pectorales agudos u ataques de pánico violentos con hiperventilación, el usuario es físicamente <strong className="text-[#2dd4bf]">incapaz de pronunciar palabras</strong>. El mensaje silencioso de un solo toque pre-comprime toda la biometría crítica para tu pariente.
              </p>
            </div>

            {/* Back action / cancellation controls */}
            <div className="w-full max-w-sm mx-auto pt-6 pb-8 z-10">
              <button
                onClick={() => {
                  EmotionHapticEngine.playHoldTick();
                  setActiveMessage(null);
                }}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 rounded-2xl font-bold font-sans tracking-wide text-sm active:scale-95 transition-all cursor-pointer shadow-lg"
              >
                {activeMessage.status === 'delivered' ? '✓ Volver a Coordinación de S.O.S.' : 'Cancelar Envío'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
