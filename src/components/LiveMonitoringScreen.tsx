import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import DeveloperConsole from './DeveloperConsole';

export default function LiveMonitoringScreen({ onStartIntervention }: { onStartIntervention: () => void }) {
  const { liveBpm, isConnected, sensorQuality, addTelemetryPoint } = useTelemetryStore();
  const [offline, setOffline] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [insight, setInsight] = useState('');
  
  // Time based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Buenos días');
    } else if (hour < 19) {
      setGreeting('Buenas tardes');
    } else {
      setGreeting('Buenas noches');
    }
  }, []);

  // Contextual Insights (Ai Simulation)
  useEffect(() => {
    if (!isConnected) {
      setInsight('Conecta tu dispositivo para comenzar a cuidarte juntos.');
      return;
    }

    if (liveBpm === 0) {
      setInsight('Analizando cómo te sientes hoy...');
    } else if (liveBpm > 100) {
      setInsight('Tu ritmo está algo acelerado. ¿Qué te parece si hacemos una pequeña pausa para respirar?');
    } else if (liveBpm > 85) {
      setInsight('Noto un poco de actividad. Recuerda mantenerte hidratado y escuchar a tu cuerpo.');
    } else if (liveBpm >= 60) {
      setInsight('Tu ritmo es estable y tranquilo. Perfecto para enfocarte en tu día.');
    } else {
      setInsight('Tus signos vitales están en profunda calma.');
    }
  }, [liveBpm, isConnected]);

  // Background Simulator Engine (Mocking BLE)
  useEffect(() => {
    let tickId: any;
    let sequenceBpm = 65;
    
    if (isConnected) {
      tickId = setInterval(() => {
        sequenceBpm = sequenceBpm + (Math.random() * 4 - 2);
        if (sequenceBpm < 55) sequenceBpm = 55;
        if (sequenceBpm > 120) sequenceBpm = 120;
        
        addTelemetryPoint({
          bpm: Math.round(sequenceBpm),
          hrv: Math.random() * 20 + 40,
          timestamp: Date.now(),
          confidence: 0.95
        });
      }, 1000); // 1Hz rate
    }

    return () => clearInterval(tickId);
  }, [isConnected]);

  // Simulate network drops
  useEffect(() => {
    const offlineInterval = setInterval(() => setOffline(prev => !prev), 15000);
    return () => clearInterval(offlineInterval);
  }, []);

  return (
    <div className="flex flex-col min-h-full pt-6 relative px-4">
      
      {/* Realtime Status Pill */}
      <AnimatePresence>
        {offline && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 mx-auto w-max px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 flex items-center gap-2 shadow-sm z-50"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Monitoreo Local (Sin conexión)</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex justify-between items-start mb-10">
        <div>
          <h1 
             className="text-2xl font-bold text-gray-800 dark:text-white select-none active:text-[#14b8a6] transition-colors tracking-tight"
             onDoubleClick={() => setDevMode(!devMode)}
          >
             {greeting}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Estamos cuidando de ti.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00796b]/10 dark:bg-teal-900/30 flex items-center justify-center">
            {isConnected ? <Wifi className="w-5 h-5 text-[#00796b] dark:text-teal-400" /> : <Activity className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center -mt-8">
        
        {/* Enfatizar la frase de soporte, no solo el número */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={insight}
          className="text-center px-4 mb-8 min-h-[60px] flex items-center justify-center"
        >
          <p className="text-[#042f2e] dark:text-gray-200 text-lg sm:text-xl font-medium tracking-tight leading-relaxed max-w-sm">
            "{insight}"
          </p>
        </motion.div>

        {/* Core Heart Rate View (Menos intimidante, más suave) */}
        <div className="relative w-72 h-72 rounded-full flex flex-col items-center justify-center">
            <motion.div 
               className="absolute w-full h-full rounded-full"
               style={{
                 background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, rgba(20,184,166,0) 70%)'
               }}
               animate={{ scale: isConnected ? [1, 1.12, 1] : 1 }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {isConnected ? (
              <div className="flex flex-col items-center z-10 transition-all duration-700">
                 <Heart className="w-6 h-6 text-[#14b8a6] dark:text-teal-400/80 mb-3 opacity-80" />
                 <motion.span 
                   key={liveBpm}
                   initial={{ opacity: 0.8, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.5 }}
                   className="text-7xl font-display font-light tracking-tighter text-gray-800 dark:text-white"
                 >
                   {liveBpm > 0 ? liveBpm : '--'}
                 </motion.span>
                 <span className="text-gray-400 dark:text-teal-500/60 font-medium tracking-wider text-xs uppercase mt-2">LPM</span>
              </div>
            ) : (
               <div className="flex flex-col items-center text-gray-400">
                  <Activity className="w-8 h-8 mb-3 opacity-40" />
                  <span className="font-medium tracking-wide text-sm opacity-80">Sin lectura</span>
               </div>
            )}
        </div>

        {/* Action Button if slightly anxious */}
        <AnimatePresence>
          {isConnected && liveBpm > 90 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              onClick={onStartIntervention}
              className="mt-6 px-6 py-3.5 bg-[#f0fdfa] dark:bg-teal-900/40 text-[#0f766e] dark:text-teal-300 font-semibold rounded-2xl shadow-sm border border-teal-100 dark:border-teal-800/50 hover:bg-teal-50 transition-colors flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Haz un ejercicio de respiración
            </motion.button>
          )}
        </AnimatePresence>

        {/* Temporary simulate panic trigger */}
        <button 
           onClick={onStartIntervention}
           className="mt-10 text-xs text-gray-400 opacity-40 underline decoration-gray-300 dark:decoration-gray-700"
        >
            [Simular Crisis y probar Asistente]
        </button>

      </div>
      
      <AnimatePresence>
        {devMode && <DeveloperConsole onClose={() => setDevMode(false)} />}
      </AnimatePresence>
    </div>
  );
}
