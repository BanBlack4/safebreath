import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Activity, Wifi, Battery, AlertTriangle, X, Settings2 } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { useAppSettingsStore } from '../store/useAppSettingsStore';

export default function DeveloperConsole({ onClose }: { onClose: () => void }) {
  const { liveBpm, history, isConnected } = useTelemetryStore();
  const { reducedMotion, lowBatteryMode, nightMode, toggleReducedMotion, toggleLowBatteryMode, toggleNightMode } = useAppSettingsStore();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [rtt, setRtt] = useState(45);

  useEffect(() => {
    const logger = setInterval(() => {
      setLogs(prev => [
        `[BLE] RX: 0x180D (HR: ${liveBpm || 0}) RSSI: -${Math.floor(Math.random() * 30 + 50)}dBm`,
        ...prev
      ].slice(0, 10));

      setRtt(prev => prev + (Math.random() * 10 - 5));
    }, 1000);
    return () => clearInterval(logger);
  }, [liveBpm]);

  return (
    <motion.div 
       initial={{ opacity: 0, y: 50 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: 50 }}
       className="absolute bottom-20 left-4 right-4 bg-black/95 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl z-50 text-emerald-400 font-mono text-[10px] overflow-hidden flex flex-col max-h-[50vh]"
    >
        <div className="flex justify-between items-center bg-gray-900 px-3 py-2 border-b border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 font-sans text-xs uppercase tracking-widest font-bold">
               <Terminal className="w-4 h-4" /> Dev Console
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded transition-colors">
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </div>

        <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-800 bg-gray-950">
            <div className="flex flex-col">
               <span className="text-gray-500 uppercase">Buffer Size</span>
               <span className="text-white text-sm">{history.length} pts</span>
            </div>
            <div className="flex flex-col">
               <span className="text-gray-500 uppercase">WSS RTT</span>
               <span className={`${rtt > 100 ? 'text-amber-500' : 'text-emerald-500'} text-sm`}>{rtt.toFixed(0)}ms</span>
            </div>
            <div className="flex flex-col">
               <span className="text-gray-500 uppercase">BLE State</span>
               <span className={isConnected ? "text-emerald-500" : "text-rose-500"}>{isConnected ? 'SYNCED' : 'DROPPED'}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-gray-500 uppercase">Mem Pressure</span>
               <span className="text-emerald-500 text-sm">Low</span>
            </div>
        </div>

        {/* Accessibility & Env Toggles */}
        <div className="p-2 border-b border-gray-800 bg-[#0f172a] grid grid-cols-3 gap-2">
            <button 
                onClick={toggleReducedMotion}
                className={`py-2 rounded text-xs font-sans font-bold transition-colors ${reducedMotion ? 'bg-indigo-600 text-white' : 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900'}`}
            >
                Red. Motion
            </button>
            <button 
                onClick={toggleLowBatteryMode}
                className={`py-2 rounded text-xs font-sans font-bold transition-colors ${lowBatteryMode ? 'bg-amber-600 text-white' : 'bg-amber-900/50 text-amber-300 hover:bg-amber-900'}`}
            >
                Low Battery
            </button>
            <button 
                onClick={toggleNightMode}
                className={`py-2 rounded text-xs font-sans font-bold transition-colors ${nightMode ? 'bg-slate-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'}`}
            >
                Night Mode
            </button>
        </div>

        <div className="flex-grow p-3 overflow-y-auto opacity-80 leading-relaxed font-mono">
            {logs.map((log, i) => (
               <div key={i}>{log}</div>
            ))}
        </div>

        <div className="p-2 border-t border-gray-800 bg-gray-900 grid grid-cols-2 gap-2 h-max">
            <button className="bg-rose-900/50 hover:bg-rose-900 text-rose-300 py-2 rounded text-xs font-sans font-bold transition-colors">Inject HR Spike</button>
            <button className="bg-amber-900/50 hover:bg-amber-900 text-amber-300 py-2 rounded text-xs font-sans font-bold transition-colors">Drop Socket</button>
        </div>
    </motion.div>
  );
}
