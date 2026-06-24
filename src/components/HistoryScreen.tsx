/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Calendar, Plus, ChevronRight, Activity, Smile, Settings, AlertTriangle, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { UserProfile, HealthEvent } from '../types';
import { fetchHealthHistory, fetchUserInsight, insertManualLog } from '../services/supabaseData';
import { toast } from 'react-hot-toast';
import { auth } from '../firebase';

interface HistoryScreenProps {
  profile: UserProfile;
  onEventSelect: (time: string, bpm: number) => void;
  onScreenChange: (screen: 'dashboard' | 'vitals' | 'profile' | 'history' | 'event-detail') => void;
}

export default function HistoryScreen({ profile, onEventSelect, onScreenChange }: HistoryScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Alertas' | 'Vitals' | 'Manual Check-ins' | 'Intervenciones'>('Todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('Todos');
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  const [manualBpm, setManualBpm] = useState(70);
  const [manualSpo2, setManualSpo2] = useState(98);
  const [manualMood, setManualMood] = useState<'Calm' | 'Neutral' | 'Anxious'>('Calm');
  const [manualActivity, setManualActivity] = useState('');

  const [selectedEvent, setSelectedEvent] = useState<HealthEvent | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [insightText, setInsightText] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const history = await fetchHealthHistory(user.uid);
      if (history.length > 0) {
        setEvents(history);
      }
      
      const insight = await fetchUserInsight(user.uid);
      if (insight) {
        setInsightText(insight.insight_text);
      } else {
        setInsightText('Análisis en proceso. Continúa registrando tus signos vitales.');
      }
    };
    loadData();
  }, []);

  const availableDates = ['Todos', ...Array.from(new Set(events.map(e => e.dateStr)))];

  const stats = {
    eventsCount: events.length,
    alertsCount: events.filter(e => e.type === 'critical' || e.type === 'anxiety').length,
    checkinsCount: events.filter(e => e.type === 'checkin' || e.type === 'vital_peak' || e.type === 'manual_log').length
  };

  const chartData = [
    { time: '08:00', bpm: 72 },
    { time: '10:00', bpm: 78 },
    { time: '11:05', bpm: 142 },
    { time: '12:00', bpm: 85 },
    { time: '14:20', bpm: 120 },
    { time: '16:00', bpm: 90 },
    { time: '18:00', bpm: 75 },
    { time: '20:00', bpm: 70 }
  ];

  const handleAddLog = async () => {
    const bpm = Number(manualBpm);
    const spo2 = Number(manualSpo2);

    if (isNaN(bpm) || bpm < 30 || bpm > 220) {
      toast.error('Por favor, ingresa un ritmo cardíaco válido (30 - 220 BPM)');
      return;
    }

    if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
      toast.error('Por favor, ingresa una saturación de oxígeno válida (50% - 100% SpO2)');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error('Debe iniciar sesión para registrar datos.');
      return;
    }

    try {
      toast.loading('Registrando...', { id: 'manual-log' });
      const newLog = await insertManualLog(user.uid, bpm, spo2, manualMood, manualActivity);
      
      const newEvent: HealthEvent = {
        id: newLog.id,
        title: newLog.title,
        type: newLog.type as any,
        time: newLog.time_str,
        dateStr: newLog.date_str,
        description: newLog.description,
        badge: newLog.badge,
        details: newLog.details
      };
      
      setEvents([newEvent, ...events]);
      setShowAddLogModal(false);
      toast.success('Check-in manual registrado exitosamente', { id: 'manual-log' });
    } catch (e) {
      toast.error('Error al guardar el check-in (Verificar conexión a Supabase)', { id: 'manual-log' });
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesFilter = activeFilter === 'Todos' ||
      (activeFilter === 'Alertas' && (e.type === 'critical' || e.type === 'anxiety')) ||
      (activeFilter === 'Vitals' && e.type === 'vital_peak') ||
      (activeFilter === 'Intervenciones' && (e.type === 'calm_intervention' || e.type === 'sos_dispatch')) ||
      (activeFilter === 'Manual Check-ins' && e.type === 'checkin');
    
    const matchesDate = selectedDateFilter === 'Todos' || e.dateStr === selectedDateFilter;

    return matchesFilter && matchesDate;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 space-y-6"
    >
      {/* Overview Analytics Dashboard */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#071e27] dark:text-white">Historial de Eventos</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-[#00796b] dark:bg-[#005e53] text-white p-5 rounded-2xl flex justify-between items-end shadow-md">
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Eventos de Mayo</p>
              <p className="text-5xl font-black mt-1 leading-none">{stats.eventsCount}</p>
            </div>
            <Calendar className="w-12 h-12 text-teal-100 opacity-80" />
          </div>

          <div className="bg-white dark:bg-[#0a232f] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#133240]">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alertas Críticas</p>
            <p className="text-2xl font-black text-red-650 dark:text-red-400 mt-1">0{stats.alertsCount}</p>
          </div>

          <div className="bg-white dark:bg-[#0a232f] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#133240]">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-ins</p>
            <p className="text-2xl font-black text-[#00796b] dark:text-[#a4f0e9] mt-1">{stats.checkinsCount}</p>
          </div>
        </div>

        {/* AI Insight Widget (Humanized Backend Analytics Simulation) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-900/20 p-5 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 text-indigo-500/10 dark:text-indigo-400/5">
             <Smile className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-3">
             <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <h3 className="text-xs font-bold tracking-widest text-indigo-800 dark:text-indigo-300 uppercase">Insights del Asistente</h3>
             </div>
             <p className="text-[13px] text-indigo-950/80 dark:text-indigo-100/80 leading-relaxed font-medium pr-6">
                "{insightText}"
             </p>
          </div>
        </motion.div>

        {/* Heart Rate Chart */}
        <div className="bg-white dark:bg-[#0a232f] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#133240] h-64 mt-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300 mb-4">Tendencia de Ritmo Cardíaco Hoy</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                itemStyle={{ color: '#00796b', fontWeight: 'bold' }}
              />
              <ReferenceArea y1={50} y2={profile.bpmReposo ? profile.bpmReposo + 30 : 100} />
              <ReferenceArea y1={profile.bpmReposo ? profile.bpmReposo + 30 : 100} />
              <ReferenceLine y={profile.bpmReposo || 70} stroke="#00796b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Baseline Personal', fill: '#00796b', fontSize: 10, fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="bpm" stroke="#00796b" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#00796b' }} activeDot={{ r: 6, fill: '#00796b', stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Filter Toggles Slider bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {availableDates.map((date) => (
            <button
              key={`date-${date}`}
              onClick={() => setSelectedDateFilter(date)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition cursor-pointer flex items-center gap-1.5 ${
                selectedDateFilter === date
                  ? 'bg-[#071e27] text-white border border-[#071e27]'
                  : 'bg-white dark:bg-[#0a232f] text-gray-500 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              {date}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {(['Todos', 'Alertas', 'Vitals', 'Manual Check-ins', 'Intervenciones'] as const).map((filter) => (
            <button
              key={`type-${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap active:scale-95 transition cursor-pointer ${
                activeFilter === filter
                  ? 'bg-[#a4f0e9] text-[#1d706a] border border-[#00796b]/30'
                  : 'bg-[#cfe6f2]/30 text-[#3e4946] border border-transparent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped feed matching timeline layouts */}
      <section className="space-y-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/40 rounded-2xl border border-gray-100 text-gray-400">
            Ningún registro coincide con el filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt, index) => (
              <div key={evt.id || `evt-${index}`} className="space-y-2">
                {/* Date label header section */}
                {(index === 0 || filteredEvents[index - 1]?.dateStr !== evt.dateStr) && (
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mt-4">
                    {evt.dateStr}
                  </h3>
                )}

                {/* Event Card Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white dark:bg-[#0a232f] rounded-2xl p-4.5 border-l-4 shadow-sm relative overflow-hidden ${
                    evt.type === 'critical' || evt.type === 'sos_dispatch'
                      ? 'border-red-600'
                      : evt.type === 'vital_peak'
                      ? 'border-[#a4f0e9]'
                      : evt.type === 'anxiety'
                      ? 'border-amber-500'
                      : evt.type === 'calm_intervention'
                      ? 'border-blue-500'
                      : 'border-[#00796b]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {evt.type === 'critical' || evt.type === 'sos_dispatch' ? (
                        <AlertTriangle className="w-5 h-5 text-red-650" />
                      ) : evt.type === 'calm_intervention' ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                        </div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-teal-800 dark:text-[#a4f0e9]" />
                      )}
                      <h4 className="font-extrabold text-[#071e27] dark:text-white text-sm">{evt.title}</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{evt.time}</span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{evt.description}</p>

                  {/* Vitals peak details row visualizer */}
                  {evt.type === 'vital_peak' && evt.details && (
                    <div className="flex gap-4 mb-4">
                      <div className="bg-[#a4f0e9]/20 dark:bg-teal-900/30 p-2.5 rounded-xl flex-1 text-center">
                        <span className="text-[10px] font-semibold text-[#1d706a] dark:text-[#a4f0e9] uppercase">Pico</span>
                        <p className="text-base font-black text-gray-800 dark:text-white">{evt.details.peakBpm} BPM</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl flex-1 text-center">
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase">Estado</span>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{evt.details.status}</p>
                      </div>
                    </div>
                  )}

                  {/* Anxiety details block showing a mini bar trend graph */}
                  {evt.type === 'anxiety' && evt.details && (
                    <div className="space-y-3 mb-4">
                      <div className="h-28 bg-[#a4f0e9]/10 rounded-xl relative p-3 flex flex-col justify-end">
                        {/* Fake graphical representations bars */}
                        <div className="absolute inset-x-3 bottom-3 top-3 flex items-end gap-1 px-1.5 pt-4">
                          <div className="bg-[#00796b] h-8 flex-1 rounded-t-sm" />
                          <div className="bg-[#00796b] h-14 flex-1 rounded-t-sm" />
                          <div className="bg-red-500 h-24 flex-1 rounded-t-sm animate-pulse" />
                          <div className="bg-red-500 h-20 flex-1 rounded-t-sm" />
                          <div className="bg-[#00796b] h-10 flex-1 rounded-t-sm" />
                        </div>
                        <div className="absolute top-2 left-3 bg-white/80 px-2 py-0.5 rounded-full border border-gray-100 text-[9px] font-semibold text-gray-550 shadow-xs z-10">
                          Tendencia de HRV: {evt.details.hrvTrend}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Duración: {evt.details.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#1d706a] font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          <span>Protocolo de calma</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges and action detail hooks */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {evt.badge}
                    </span>

                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="text-xs font-bold text-[#00796b] hover:text-[#005e53] flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Ver Detalles</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Manual Check-In Add Button FAB */}
      <div className="fixed bottom-20 right-5 z-30">
        <button
          onClick={() => setShowAddLogModal(true)}
          className="w-14 h-14 bg-[#00796b] hover:bg-[#005e53] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
          title="Loguear Datos Manuales"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </div>

      {/* Modal slider for manual logging */}
      <AnimatePresence>
        {showAddLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0a232f] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 border border-gray-100 dark:border-gray-800"
            >
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Log Chequeo Manual</h3>

              <div className="space-y-4">
                {/* Manual BPM Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span>Ritmo Cardíaco</span>
                    <span className="text-[#00796b] font-bold">{manualBpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="110"
                    value={manualBpm}
                    onChange={(e) => setManualBpm(Number(e.target.value))}
                    className="w-full accent-[#00796b]"
                  />
                </div>

                {/* Manual SpO2 Text/Number */}
                <div className="space-y-1.5">
                  <label className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Saturación de O2 (% SpO2)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={manualSpo2}
                    onChange={(e) => setManualSpo2(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0f3443] border border-gray-200 dark:border-[#133240] rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00796b]/50"
                    placeholder="Ej. 98"
                  />
                </div>

                {/* Activity note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                    Actividad física al registro (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualActivity}
                    onChange={(e) => setManualActivity(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0f3443] border border-gray-200 dark:border-[#133240] rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00796b]/50"
                    placeholder="Ej. Caminando, En reposo, Ejercicio leve"
                  />
                </div>

                {/* Mood buttons selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Tu estado de ánimo:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Calm', 'Neutral', 'Anxious'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setManualMood(m)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          manualMood === m
                            ? 'bg-[#a4f0e9] border-[#00796b] text-[#1d706a]'
                            : 'bg-white dark:bg-[#0a232f] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {m === 'Calm' ? 'Calmado' : m === 'Neutral' ? 'Neutral' : 'Ansioso'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3.5 pt-2">
                <button
                  onClick={() => setShowAddLogModal(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddLog}
                  className="flex-1 py-3 bg-[#00796b] hover:bg-[#005e53] text-white rounded-xl text-xs font-bold shadow"
                >
                  Loguear Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0a232f] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white pr-4">
                  {selectedEvent.title}
                </h3>
                <span className="text-xs font-bold bg-[#00796b] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedEvent.badge}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedEvent.dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{selectedEvent.time}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0f3443] p-4 rounded-xl border border-gray-100 dark:border-teal-900/30">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.details && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Información Adicional</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedEvent.details).map(([key, value]) => (
                      <div key={key} className="bg-[#a4f0e9]/20 dark:bg-teal-900/20 p-3 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-[#00796b] dark:text-[#a4f0e9] uppercase">{key}</span>
                        <span className="block text-sm font-black text-gray-800 dark:text-white mt-1">{value as any}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                Cerrar Detalles
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
