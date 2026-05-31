import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import DeveloperConsole from './DeveloperConsole';

export default function LiveMonitoringScreen({ onStartIntervention }: { onStartIntervention: () => void }) {
  const { liveBpm, isConnected, sensorQuality, addTelemetryPoint } = useTelemetryStore();
  const [offline, setOffline] = useState(false);
  const [devMode, setDevMode] = useState(false);

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

        // Trigger intervention automatically for demo if it goes over 90 manually
        if (sequenceBpm > 90) {
            // we will let the user trigger it via a button to be safe, rather than auto-popup loop
        }
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
    <div className="flex flex-col min-h-full pt-2 relative">
      
      {/* Realtime Status Pill */}
      <AnimatePresence>
        {offline && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-0 right-0 mx-auto w-max px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 flex items-center gap-2 shadow-sm z-50"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Offline • Monitoreo Local</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex justify-between items-center mb-6 mt-4">
        <h1 
           className="text-xl font-bold text-gray-800 dark:text-white select-none active:text-[#14b8a6] transition-colors"
           onDoubleClick={() => setDevMode(!devMode)}
        >
           Estado Actual
        </h1>
        <div className="w-10 h-10 rounded-full bg-[#00796b]/10 dark:bg-teal-900/30 flex items-center justify-center">
            {isConnected ? <Wifi className="w-5 h-5 text-[#00796b] dark:text-teal-400" /> : <Activity className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Core Heart Rate View */}
        <div className="relative w-80 h-80 rounded-full flex flex-col items-center justify-center">
            <motion.div 
               className="absolute w-full h-full rounded-full"
               style={{
                 background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, rgba(20,184,166,0) 70%)'
               }}
               animate={{ scale: isConnected ? [1, 1.15, 1] : 1 }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
               className="absolute w-full h-full border-[2px] border-[#14b8a6] dark:border-teal-500 rounded-full opacity-20"
               animate={{ scale: isConnected ? [1, 1.05, 1] : 1 }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            
            {isConnected ? (
              <div className="flex flex-col items-center z-10">
                 <Heart className="w-8 h-8 text-[#0d9488] dark:text-teal-400 fill-[#14b8a6]/20 dark:fill-teal-400/20 mb-2" />
                 <motion.span 
                   key={liveBpm}
                   initial={{ opacity: 0.5, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-8xl font-display font-light tracking-tighter text-[#042f2e] dark:text-white"
                 >
                   {liveBpm > 0 ? liveBpm : '--'}
                 </motion.span>
                 <span className="text-[#115e59] dark:text-teal-400 font-medium tracking-wide text-sm uppercase mt-1">LPM</span>
              </div>
            ) : (
               <div className="flex flex-col items-center text-gray-400">
                  <Activity className="w-12 h-12 mb-3 opacity-50" />
                  <span className="font-medium tracking-wide text-sm">Esperando Sensor</span>
               </div>
            )}
        </div>

        {/* Calm Safe State Indicator */}
        <div className="mt-16 flex items-center gap-4 bg-white/70 backdrop-blur-xl dark:bg-[#0a232f]/80 px-6 py-5 rounded-3xl shadow-sm border border-white dark:border-gray-800 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-[#f0fdfa] dark:bg-teal-900/40 flex items-center justify-center shadow-inner">
               <ShieldCheck className="w-7 h-7 text-[#0d9488] dark:text-teal-400" />
            </div>
            <div className="flex flex-col flex-grow">
               <span className="font-semibold text-lg text-[#042f2e] dark:text-gray-100">Signos Estables</span>
               <span className="text-sm text-[#0f766e] dark:text-gray-400">Monitoreo pasivo activo</span>
            </div>
        </div>

        {/* Temporary simulate panic trigger */}
        <button 
           onClick={onStartIntervention}
           className="mt-6 text-sm text-[#0f766e] opacity-50 underline decoration-gray-300 dark:decoration-gray-700"
        >
            [Dev: Simular Ataque de Pánico]
        </button>

      </div>
      
      <AnimatePresence>
        {devMode && <DeveloperConsole onClose={() => setDevMode(false)} />}
      </AnimatePresence>
    </div>
  );
}
