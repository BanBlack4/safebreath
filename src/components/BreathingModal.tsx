/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, Wind, Sparkles } from 'lucide-react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
  durationMinutes?: number;
}

type BreathPhase = 'Inhale' | 'Hold' | 'Exhale' | 'HoldEmpty' | 'Ready';

export default function BreathingModal({
  isOpen,
  onClose,
  exerciseName = "4-7-8 Breathing",
  durationMinutes = 5,
  technique = '4-7-8'
}: BreathingModalProps & { technique?: '4-7-8' | 'box' }) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('Ready');
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [phaseTime, setPhaseTime] = useState(4); 

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context for soothing clicks
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playTick = (type: 'inhale' | 'hold' | 'exhale' | 'transition') => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'transition') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(type === 'inhale' ? 330 : type === 'hold' ? 440 : 280, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      // Ignored if browser blocks audio autoplay
    }
  };

  useEffect(() => {
    if (isActive) {
      // General Exercise Timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setPhase('Ready');
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Phase control logic
      if (phase === 'Ready') {
        setPhase('Inhale');
        setPhaseTime(4);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    phaseTimerRef.current = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          playTick('transition');
          
          if (technique === 'box') {
            if (phase === 'Inhale') { setPhase('Hold'); return 4; }
            else if (phase === 'Hold') { setPhase('Exhale'); return 4; }
            else if (phase === 'Exhale') { setPhase('HoldEmpty'); return 4; }
            else { setPhase('Inhale'); return 4; }
          } else {
            if (phase === 'Inhale') {
              setPhase('Hold');
              return 7; // Hold for 7s
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              return 8; // Exhale for 8s
            } else {
              setPhase('Inhale');
              return 4; // Inhale for 4s
            }
          }
        }
        
        // Play gentle tick on each beat
        if (phase === 'Inhale') playTick('inhale');
        else if (phase === 'Hold' || phase === 'HoldEmpty') playTick('hold');
        else playTick('exhale');

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [isActive, phase]);

  const handleStartStop = () => {
    initAudio();
    setIsActive(!isActive);
    if (!isActive && phase === 'Ready') {
      setPhase('Inhale');
      setPhaseTime(4);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('Ready');
    setTimeLeft(durationMinutes * 60);
    setPhaseTime(4);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Visual text and color for transitions
  const getPhaseStyles = () => {
    switch (phase) {
      case 'Inhale':
        return {
          text: 'Inhala',
          subtext: 'Expande el pecho con aire fresco',
          bgColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          scale: 1.15,
          duration: 4
        };
      case 'Hold':
        return {
          text: 'Mantén',
          subtext: 'Retén el flujo para absorber oxígeno',
          bgColor: 'bg-[#a4f0e9]/40',
          textColor: 'text-[#1d706a]',
          scale: 1.15,
          duration: technique === 'box' ? 4 : 7
        };
      case 'HoldEmpty':
        return {
          text: 'Pulmones Vacíos',
          subtext: 'Mantén el vacío antes de inhalar',
          bgColor: 'bg-teal-900/10 dark:bg-[#cfe6f2]/10',
          textColor: 'text-[#071e27] dark:text-[#a4f0e9]',
          scale: 1.0,
          duration: 4
        };
      case 'Exhale':
        return {
          text: 'Exhala',
          subtext: 'Libera toda la tensión lentamente',
          bgColor: 'bg-teal-600/20',
          textColor: 'text-teal-700',
          scale: 1.0,
          duration: technique === 'box' ? 4 : 8
        };
      default:
        return {
          text: 'Listos',
          subtext: 'Presiona Iniciar para comenzar',
          bgColor: 'bg-[#cfe6f2]/40',
          textColor: 'text-[#071e27]',
          scale: 1.0,
          duration: 4
        };
    }
  };

  const currentStyles = getPhaseStyles();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#f3faff] dark:bg-[#05141a] p-6 shadow-2xl border border-[#cfe6f2] dark:border-[#133240]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#a4f0e9] dark:bg-[#005e53] rounded-lg text-teal-800 dark:text-[#a4f0e9]">
                <Wind className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-lg text-[#071e27] dark:text-white">{exerciseName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Técnica Terapéutica para Ansiedad</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#11384a] text-[#071e27] dark:text-gray-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central breathing circle */}
          <div className="my-8 flex flex-col items-center justify-center min-h-[220px]">
            <div className="relative flex items-center justify-center">
              {/* Animated outer waves */}
              {isActive && (
                <motion.div
                  key={phase}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: currentStyles.scale * 1.3,
                    opacity: [0.4, 0.1, 0],
                  }}
                  transition={{
                    duration: currentStyles.duration,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute w-36 h-36 rounded-full ${currentStyles.bgColor}`}
                />
              )}

              {/* Central base sphere */}
              <motion.div
                animate={{
                  scale: isActive ? currentStyles.scale : 1.0,
                }}
                transition={{
                  duration: isActive ? currentStyles.duration : 0.5,
                  ease: "easeInOut"
                }}
                className={`w-36 h-36 rounded-full ${currentStyles.bgColor} flex flex-col items-center justify-center shadow-lg border border-teal-500/10`}
              >
                <span className={`text-2xl font-bold ${currentStyles.textColor}`}>
                  {phase === 'Ready' ? '' : phaseTime}
                </span>
                <span className="text-xs font-semibold opacity-80 uppercase tracking-wider text-teal-900 mt-1">
                  {phase === 'Ready' ? 'Listo' : phase}
                </span>
              </motion.div>
            </div>

            {/* Instruction descriptions */}
            <div className="text-center mt-6 min-h-[64px] px-4">
              <h4 className="text-xl font-bold text-[#005e53] dark:text-[#a4f0e9]">
                {currentStyles.text}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {currentStyles.subtext}
              </p>
            </div>
          </div>

          {/* Timers metadata */}
          <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-xl bg-white dark:bg-[#0a232f] border border-[#cfe6f2] dark:border-[#133240] shadow-sm text-center">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo Restante</p>
              <p className="text-lg font-bold text-[#071e27] dark:text-white mt-0.5">{formatTime(timeLeft)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ciclo Actual</p>
              <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-0.5">{phase === 'Ready' ? '--' : phase}</p>
            </div>
          </div>

          {/* Control Actions bar */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleReset}
              className="p-3 rounded-full bg-white dark:bg-[#0a232f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#133240] hover:bg-gray-50 dark:hover:bg-[#11384a] active:scale-95 transition"
              title="Reiniciar ejercicio"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleStartStop}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md active:scale-95 transition ${
                isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#00796b] hover:bg-[#005e53]'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Comenzar</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex justify-center text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#1d706a] dark:text-[#a4f0e9] bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full border border-teal-100/50 dark:border-[#133240]">
              <Sparkles className="w-3.5 h-3.5" />
              {technique === 'box' 
                ? 'La respiración en caja (4-4-4-4) reduce el estrés agudo en minutos.' 
                : 'La técnica 4-7-8 ayuda a regular el sistema nervioso inmediatamente.'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
