/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, X, CheckCircle2 } from 'lucide-react';

interface PostAlertSurveyModalProps {
  isOpen: boolean;
  onSkip: () => void;
  onSubmit: (data: any) => void;
}

export default function PostAlertSurveyModal({ isOpen, onSkip, onSubmit }: PostAlertSurveyModalProps) {
  const [context, setContext] = useState<string>('');
  const [trigger, setTrigger] = useState<string>('');
    const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState<number>(5);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ context, trigger, intensity, notes });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0a232f] p-6 shadow-2xl border border-gray-100 dark:border-[#133240]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#a4f0e9]/30 dark:bg-[#0c2a38] rounded-lg text-teal-800 dark:text-[#a4f0e9]">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base text-[#071e27] dark:text-white leading-tight">Contexto del Evento</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Ayuda a la IA a aprender</p>
              </div>
            </div>
            <button onClick={onSkip} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#11384a] text-gray-400 dark:text-gray-500 transition cursor-pointer shadow-sm active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Escala de Intensidad (SUDS) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Intensidad de la Crisis</span>
                <span className={`font-black ${intensity > 7 ? 'text-red-500' : intensity > 4 ? 'text-amber-500' : 'text-emerald-500'}`}>{intensity}/10</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-[#00796b]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-semibold px-1">
                <span>Leve</span>
                <span>Severo</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">¿Qué estabas haciendo?</label>
              <div className="flex flex-wrap gap-2">
                {['Descansando', 'Ejercicio', 'Trabajando', 'Durmiendo'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setContext(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                      context === opt ? 'bg-[#00796b] text-white border-[#005e53] shadow-sm' : 'bg-gray-50 dark:bg-[#0c2a38] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#133240] hover:bg-gray-100 dark:hover:bg-[#11384a]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">¿Qué crees que lo provocó?</label>
              <div className="flex flex-wrap gap-2">
                {['Estrés', 'Esfuerzo Físico', 'Ansiedad', 'No lo sé'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTrigger(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                      trigger === opt ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-gray-50 dark:bg-[#0c2a38] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#133240] hover:bg-gray-100 dark:hover:bg-[#11384a]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Notas adicionales (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej. Sentí una punzada antes..."
                className="w-full bg-gray-50 dark:bg-[#0c2a38] p-3 rounded-xl border border-gray-200 dark:border-[#133240] text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00796b]/50 transition"
              />
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={!context || !trigger}
                className="w-full bg-[#00796b] text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Registrar Contexto</span>
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-3 font-semibold px-2">
                Estos datos son privados y ayudan a personalizar tu umbral de diagnóstico preventivo.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
