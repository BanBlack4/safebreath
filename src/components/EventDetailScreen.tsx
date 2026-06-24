/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, CheckCircle2, TrendingUp, Calendar, Heart, FileText, Check, Plus, Edit3 } from 'lucide-react';

interface EventDetailScreenProps {
  onBack: () => void;
  eventTime?: string;
  peakBpm?: number;
}

export default function EventDetailScreen({
  onBack,
  eventTime = "Oct 24 • 10:42 AM",
  peakBpm = 142
}: EventDetailScreenProps) {
  const [personalNote, setPersonalNote] = useState<string>("");
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const handleSaveNote = () => {
    setIsNoteSaved(true);
    setShowNoteForm(false);
    setTimeout(() => setIsNoteSaved(false), 3000);
  };

  const handleExport = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 space-y-6"
    >
      {/* Top sticky local secondary bar options */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#00796b] font-bold hover:underline active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-gray-500 hover:text-[#00796b] cursor-pointer" />
        </div>
      </div>

      {/* Localized Event Subtitle metadata */}
      <section className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Detalle del Incidente</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hoy, {eventTime}</p>
      </section>

      {/* Heart Rate primary dark teal highlight highlight card */}
      <div className="relative bg-[#00796b] text-white rounded-2xl p-5 shadow-md overflow-hidden">
        {/* Abstract glowing bubble */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full filter blur-xl animate-pulse" />

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">Ritmo Cardíaco Pico</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-white tracking-tight">{peakBpm}</span>
              <span className="text-xs text-teal-100">BPM</span>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 fill-current" />
            <span className="text-xs font-bold text-teal-50">Resuelto</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-emerald-200" />
          <span className="text-xs font-semibold text-teal-100">+58% por encima de tu frecuencia en reposo</span>
        </div>
      </div>

      {/* Chart line plot graph section */}
      <section className="bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#133240] space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-800 dark:text-white">Recuperación — 15 Minutos</h3>
          <span className="text-[9px] font-bold text-[#00796b] dark:text-[#a4f0e9] bg-[#a4f0e9]/20 px-2 py-0.5 rounded uppercase tracking-wider">Flujo Continuo</span>
        </div>

        {/* Handcrafted precise visual line chart with gradient and peak flag indicators */}
        <div className="relative h-44 w-full bg-linear-to-b from-gray-50/20 to-transparent rounded-lg p-2 border border-gray-100">
          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00796b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00796b" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid baseline dividers */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="#cfe6f2" strokeDasharray="4" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="#cfe6f2" strokeDasharray="4" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#cfe6f2" strokeDasharray="4" />

            {/* Main area fill path */}
            <path
              d="M0,130 L20,125 L40,128 L60,120 L80,90 L100,30 L120,45 L140,65 L180,85 L220,105 L260,115 L300,122 L350,125 L400,125 V150 H0 Z"
              fill="url(#chartGradient)"
            />
            {/* Main stroke path */}
            <path
              d="M0,130 L20,125 L40,128 L60,120 L80,90 L100,30 L120,45 L140,65 L180,85 L220,105 L260,115 L300,122 L350,125 L400,125"
              fill="none"
              stroke="#00796b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Pulsing peak marker point circle block */}
            <circle cx="100" cy="30" r="4.5" fill="#00796b" />
            <circle cx="100" cy="30" r="10" fill="#00796b" fillOpacity="0.15" className="animate-ping" />
          </svg>

          {/* Floated custom tag box display */}
          <div className="absolute top-[20px] left-[110px] bg-[#00796b] text-white text-[9px] px-2 py-0.5 rounded-md font-bold shadow-sm">
            142 BPM Peak
          </div>
        </div>

        <div className="flex justify-between text-[10px] text-gray-400 font-bold">
          <span>10:35 AM</span>
          <span>10:42 AM (Pico)</span>
          <span>10:50 AM</span>
        </div>
      </section>

      {/* Action Taken summary info card */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#071e27] dark:text-white uppercase tracking-wider">Acción Correctiva Ejecutada</h3>
        <div className="bg-[#a4f0e9]/20 dark:bg-teal-900/20 rounded-2xl p-4.5 flex items-center justify-between border border-[#00796b]/10 dark:border-[#133240]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#a4f0e9] dark:bg-[#00796b] rounded-xl flex items-center justify-center text-teal-800 dark:text-[#a4f0e9] shadow-sm">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white text-sm">Respiración 4-7-8 Guiada</p>
              <p className="text-xs text-[#1d706a] dark:text-teal-300 font-semibold">Completado • Sesión de 5:00 min</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-[#00796b] text-white px-2 py-0.5 rounded">Éxito</span>
        </div>
      </section>

      {/* Interactive options actions list */}
      <section className="grid grid-cols-2 gap-4">
        {/* Export document to clinician */}
        <button
          onClick={handleExport}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-[#0a232f] hover:bg-gray-50 dark:hover:bg-[#11384a] border border-gray-150 dark:border-[#133240] rounded-2xl active:scale-95 transition text-teal-700 dark:text-[#a4f0e9] cursor-pointer text-center"
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs font-bold leading-tight">
            {downloaded ? 'Descargado (PDF)' : 'Exportar a Médico'}
          </span>
        </button>

        {/* Add Personal diaries logs notes */}
        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-[#0a232f] hover:bg-gray-50 dark:hover:bg-[#11384a] border border-gray-150 dark:border-[#133240] rounded-2xl active:scale-95 transition text-teal-700 dark:text-[#a4f0e9] cursor-pointer text-center"
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-xs font-bold leading-tight">Anotación Personal</span>
        </button>
      </section>

      {/* Note Form Modal Slider */}
      {showNoteForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#e6f6ff] p-4 rounded-xl space-y-3 border border-[#cfe6f2]"
        >
          <label className="text-xs font-bold text-gray-700 block">Agrega observaciones físicas o notas:</label>
          <textarea
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            className="w-full bg-white p-3 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-[#00796b] focus:outline-none focus:border-transparent text-gray-800"
            placeholder="Ej; Sentí dolor intermitente antes de iniciar el ciclo respiratorio."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteForm(false)}
              className="text-xs font-bold text-gray-400 px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveNote}
              className="bg-[#00796b] text-white text-xs font-bold px-4 py-1.5 rounded-lg active:scale-95 transition"
            >
              Guardar observaciones
            </button>
          </div>
        </motion.div>
      )}

      {isNoteSaved && (
        <p className="text-xs font-bold text-emerald-700 text-center animate-pulse">
          Observaciones guardadas con éxito en tu bitácora de salud.
        </p>
      )}

      {/* Proactive medical recommendations diagnostic alerts */}
      <section className="bg-[#d4e6e5] rounded-3xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5 text-teal-900 font-bold">
          <Heart className="w-5 h-5 fill-[#00796b] text-[#00796b]" />
          <h3 className="font-bold text-base">Recomendación Proactiva</h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
          Tu velocidad de recuperación de ritmo cardíaco fue <strong>20% más veloz</strong> que tu promedio de la semana. Esto certifica que la <strong>Técnica de Respiración Guiada 4-7-8</strong> es altamente efectiva para normalizar tu oxigenación y regular tu sistema simpático.
        </p>

        <button
          onClick={() => {
            setCalendarAdded(true);
            setTimeout(() => setCalendarAdded(false), 3000);
          }}
          className="bg-[#00796b] hover:bg-[#005e53] text-white font-bold text-xs px-5 py-2.5 rounded-full active:scale-95 transition cursor-pointer"
        >
          {calendarAdded ? 'Programado en Calendario ✔' : 'Programar Recordatorio de Pausa Diaria'}
        </button>
      </section>
    </motion.div>
  );
}
