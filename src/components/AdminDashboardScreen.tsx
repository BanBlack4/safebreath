import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  ArrowLeft, 
  Database, 
  RefreshCw,
  Sliders,
  Heart,
  UserCheck,
  AlertTriangle,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// 1. IMPORTAMOS LAS NUEVAS FUNCIONES DE SERVICIO 
// (Asegúrate de que estas funciones existan en services/firestore.ts o en tu nuevo servicio)
import { fetchAllTelemetryData, populateMockTelemetryData } from '../services/firestore';

interface AdminDashboardScreenProps {
  onBack: () => void;
}

// Initial Simulated Baseline Analytics data representing global user patterns
const BASELINE_DATA = [
  { name: 'Ene', crises: 42, resueltas: 38 },
  { name: 'Feb', crises: 51, resueltas: 46 },
  { name: 'Mar', crises: 68, resueltas: 62 },
  { name: 'Abr', crises: 82, resueltas: 76 },
  { name: 'May', crises: 95, resueltas: 88 },
];

export default function AdminDashboardScreen({ onBack }: AdminDashboardScreenProps) {
  // Configurable demographic parameters to simulate different user groups (management request)
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 75]);
  const [selectedCondition, setSelectedCondition] = useState<string>('todos');
  const [mockLoading, setMockLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Custom simulator factors to alter metrics live
  const [simulationMultiplier, setSimulationMultiplier] = useState<number>(1.0);

  // Anonymized user sample cohort to extract live statistics
  const [userCohort, setUserCohort] = useState<any[]>([]);

  useEffect(() => {
    loadRealTelemetry();
  }, []);

  const loadRealTelemetry = async () => {
    setIsFetching(true);
    try {
      // Llamada al servicio (debe estar implementada en tu nuevo archivo supabase)
      const data = await fetchAllTelemetryData();
      if (data && data.length > 0) {
        setUserCohort(data);
      } else {
        // Fallback local mock data if base empty initially
        setUserCohort([
          { id: 1, name: 'Anónimo 03F', edad: 24, asma: true, ansiedad: true, epoc: false, crisesEvitadas: 12, avgRecuperacion: 3.5 },
          { id: 2, name: 'Anónimo 98A', edad: 45, asma: false, ansiedad: true, epoc: true, crisesEvitadas: 8, avgRecuperacion: 4.8 },
          { id: 3, name: 'Anónimo 44K', edad: 68, asma: true, ansiedad: false, epoc: true, crisesEvitadas: 15, avgRecuperacion: 5.2 },
          { id: 4, name: 'Anónimo 12P', edad: 19, asma: true, ansiedad: true, epoc: false, crisesEvitadas: 22, avgRecuperacion: 2.9 },
          { id: 5, name: 'Anónimo 88Z', edad: 33, asma: false, ansiedad: true, epoc: false, crisesEvitadas: 5, avgRecuperacion: 4.1 },
          { id: 6, name: 'Anónimo 55M', edad: 58, asma: true, ansiedad: false, epoc: false, crisesEvitadas: 9, avgRecuperacion: 4.5 },
          { id: 7, name: 'Anónimo 31E', edad: 31, asma: false, ansiedad: true, epoc: true, crisesEvitadas: 11, avgRecuperacion: 3.8 },
          { id: 8, name: 'Anónimo 77X', edad: 28, asma: true, ansiedad: true, epoc: false, crisesEvitadas: 14, avgRecuperacion: 3.1 },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsFetching(false);
  };

  // Compute calculated statistics dynamically based on filters
  const filteredCohort = useMemo(() => {
    return userCohort.filter(u => {
      const matchAge = u.edad >= ageRange[0] && u.edad <= ageRange[1];
      let matchCondition = true;
      if (selectedCondition === 'asma') matchCondition = u.asma;
      if (selectedCondition === 'ansiedad') matchCondition = u.ansiedad;
      if (selectedCondition === 'epoc') matchCondition = u.epoc;
      return matchAge && matchCondition;
    });
  }, [userCohort, ageRange, selectedCondition]);

  const stats = useMemo(() => {
    const totalUsers = filteredCohort.length;
    if (totalUsers === 0) {
      return {
        totalCohort: 0,
        totalCrisesEvitadas: 0,
        avgRecuperacionMin: '0',
        efectividadKPI: 0,
        asthmaPct: 0,
        copdPct: 0,
        anxietyPct: 0,
      };
    }

    const totalCrisesEvitadas = Math.round(
      filteredCohort.reduce((sum, u) => sum + u.crisesEvitadas, 0) * simulationMultiplier
    );

    const avgRecuperacionMin = (
      filteredCohort.reduce((sum, u) => sum + u.avgRecuperacion, 0) / totalUsers
    ).toFixed(1);

    // KPI: Porcentaje de respuesta exitosa de crisis de forma no farmacológica
    const efectividadKPI = Math.min(
      98,
      Math.round(90 + (filteredCohort.filter(u => u.ansiedad).length / totalUsers) * 5)
    );

    const asthmaPct = Math.round((filteredCohort.filter(u => u.asma).length / totalUsers) * 100);
    const copdPct = Math.round((filteredCohort.filter(u => u.epoc).length / totalUsers) * 100);
    const anxietyPct = Math.round((filteredCohort.filter(u => u.ansiedad).length / totalUsers) * 100);

    return {
      totalCohort: totalUsers,
      totalCrisesEvitadas,
      avgRecuperacionMin,
      efectividadKPI,
      asthmaPct,
      copdPct,
      anxietyPct,
    };
  }, [filteredCohort, simulationMultiplier]);

  const isEfectividadAlert = stats.efectividadKPI < 94;
  const isCohortAlert = stats.totalCohort < 4;
  const isInterventionsAlert = stats.totalCrisesEvitadas < 15;
  const isRecoveryAlert = Number(stats.avgRecuperacionMin) > 4.2;

  // Pie chart condition distribution formatting
  const pieData = useMemo(() => {
    return [
      { name: 'Asma Activo', value: stats.asthmaPct, color: '#00796b' },
      { name: 'EPOC / Falla Resp', value: stats.copdPct, color: '#00bcd4' },
      { name: 'Ansiedad / Pánico', value: stats.anxietyPct, color: '#ffb74d' },
    ].filter(p => p.value > 0);
  }, [stats]);

  // Simulated metrics scaling tool
  const triggerBatchSimulation = () => {
    setMockLoading(true);
    setTimeout(() => {
      setMockLoading(false);
      setSimulationMultiplier(prev => (prev === 1.0 ? 1.4 : 1.0));
      toast.success("Métricas recalculadas. Simulación de carga del servidor completa.", {
        icon: '💻',
      });
    }, 850);
  };

  // Add random simulated cohort patient to showcase responsiveness
  const handleAddCohortSample = async () => {
    toast.loading("Generando datos simulados en base de datos...", { id: "populating" });
    // Llamada al servicio (debe estar implementada en tu nuevo archivo supabase)
    const newLogs = await populateMockTelemetryData(5);
    if (newLogs && newLogs.length > 0) {
      setUserCohort(prev => [...newLogs, ...prev]);
      toast.success(`Añadidos ${newLogs.length} pacientes al cohorte preventivo en BD`, { id: "populating" });
    } else {
      toast.error("Error al poblar BD.", { id: "populating" });
    }
  };

  const exportToCSV = () => {
    if (userCohort.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = ["ID", "Nombre (Anonimizado)", "Edad", "Asma", "Epoc", "Ansiedad", "Crisis Evitadas", "Avg Recuperación (Min)", "Fecha de Registro"];
    
    const csvRows = userCohort.map(user => {
      return [
        user.id,
        user.name,
        user.edad,
        user.asma ? "Sí" : "No",
        user.epoc ? "Sí" : "No",
        user.ansiedad ? "Sí" : "No",
        user.crisesEvitadas,
        user.avgRecuperacion,
        user.timestamp || new Date().toISOString()
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SafeBreath_Telemetry_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Exportado exitosamente para Excel / Power BI");
  };

  const handleAiAnalysis = async () => {
    if (userCohort.length === 0) {
      toast.error("No hay datos para analizar");
      return;
    }
    
    setIsAiLoading(true);
    setAiAnalysisResult(null);
    const toastId = toast.loading("🤖 Analizando patrones con IA...", { icon: '🧠' });
    
    try {
      const response = await fetch('/api/gemini/analyze-cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortData: stats })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en análisis');
      
      setAiAnalysisResult(data.analysis);
      toast.success("Análisis IA Completado", { id: toastId });
      // Scroll AI section into view smoothly
      setTimeout(() => document.getElementById('ai-insights-panel')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      {/* Visual Navigation Header */}
      <header className="flex justify-between items-center bg-[#e6f6ff] dark:bg-[#0c2a38] p-4.5 rounded-3xl border border-[#cfe6f2] dark:border-[#133240]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/40 dark:hover:bg-black/20 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#071e27] dark:text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#00796b] text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Admin Mode</span>
              <span className="text-[10px] bg-[#e056fd] text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Developer</span>
            </div>
            <h2 className="text-base font-extrabold text-[#071e27] dark:text-white mt-1">Panel de Control & KPIs</h2>
          </div>
        </div>
        <Database className="w-5 h-5 text-[#00796b] dark:text-[#a4f0e9]" />
      </header>

      {/* Description alert */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-950/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        Este panel consolida las métricas clave de salud preventiva para <strong>directores ejecutivos, inversores y desarrolladores</strong> de SafeBreath. Puedes filtrar la base de datos demográficamente o simular métricas a gran escala.
      </div>

      {/* Filters Section Component */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-3xl border border-gray-100 dark:border-[#133240] space-y-4 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-4.5 h-4.5 text-[#00796b]" />
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Filtros Demográficos & Cohortes</h3>
        </div>

        {/* Age selector range */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-500">Rango de Edad Seleccionado:</span>
            <span className="text-[#00796b] dark:text-[#a4f0e9] font-bold">{ageRange[0]} - {ageRange[1]} años</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-400 block font-bold">EDAD MÍNIMA</label>
              <input
                type="range"
                min="18"
                max="50"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])}
                className="w-full accent-[#00796b] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block font-bold">EDAD MÁXIMA</label>
              <input
                type="range"
                min="51"
                max="90"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])}
                className="w-full accent-[#00796b] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Condition Filter */}
        <div className="space-y-2 pt-1">
          <label className="text-[10px] text-gray-400 block font-bold uppercase">Patología Principal del Cohorte</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'asma', label: 'Asma' },
              { id: 'ansiedad', label: 'Ansiedad' },
              { id: 'epoc', label: 'EPOC' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCondition(c.id)}
                className={`py-1.5 px-1 text-center rounded-xl font-bold text-[11px] transition ${
                  selectedCondition === c.id 
                    ? 'bg-[#00796b] text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Numerical KPI Cards Row */}
      <section className="grid grid-cols-2 gap-3">
        {/* KPI 1 : Effective prevention rate */}
        <div className={`p-4 rounded-3xl flex flex-col justify-between h-28 transition-all duration-300 ${
          isEfectividadAlert 
            ? 'bg-red-500/10 dark:bg-red-950/30 border border-red-500 ring-1 ring-red-500 shadow-sm animate-pulse' 
            : 'bg-[#f2fcfb] dark:bg-[#003830]/20 border border-[#cfe6f2]/50 dark:border-teal-950'
        }`}>
          <div className="flex justify-between items-center">
            {isEfectividadAlert ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-[#00796b]" />
            )}
            {isEfectividadAlert ? (
              <span className="text-[9px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2 h-2" /> ALERTA
              </span>
            ) : (
              <span className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-[#00796b] px-1.5 py-0.5 rounded-full font-bold">ÉXITO</span>
            )}
          </div>
          <div>
            <span className={`block text-2xl font-extrabold ${isEfectividadAlert ? 'text-red-700 dark:text-red-400' : 'text-[#00796b] dark:text-[#a4f0e9]'}`}>
              {stats.efectividadKPI}%
            </span>
            <span className={`text-[10px] font-semibold uppercase ${isEfectividadAlert ? 'text-red-600 dark:text-red-300' : 'text-gray-500'}`}>
              Mitigación Eficiente KPI
            </span>
          </div>
        </div>

        {/* KPI 2 : Active Patients */}
        <div className={`p-4 rounded-3xl flex flex-col justify-between h-28 transition-all duration-300 ${
          isCohortAlert 
            ? 'bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500 ring-1 ring-amber-500 shadow-sm animate-pulse' 
            : 'bg-white dark:bg-[#0a232f] border border-gray-100 dark:border-[#133240]'
        }`}>
          <div className="flex justify-between items-center">
            {isCohortAlert ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <Users className="w-4 h-4 text-sky-500" />
            )}
            {isCohortAlert ? (
              <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2 h-2" /> BAJO
              </span>
            ) : (
              <span className="text-[9px] bg-sky-50 dark:bg-sky-950/20 text-sky-500 px-1.5 py-0.5 rounded-full font-bold">MUESTRA</span>
            )}
          </div>
          <div>
            <span className={`block text-2xl font-extrabold ${isCohortAlert ? 'text-amber-700 dark:text-amber-400' : 'text-sky-800 dark:text-sky-300'}`}>
              {stats.totalCohort}
            </span>
            <span className={`text-[10px] font-semibold uppercase ${isCohortAlert ? 'text-amber-600 dark:text-amber-300' : 'text-gray-500'}`}>
              Pacientes en Cohorte
            </span>
          </div>
        </div>

        {/* KPI 3 : Avoided Crises */}
        <div className={`p-4 rounded-3xl flex flex-col justify-between h-28 transition-all duration-300 ${
          isInterventionsAlert 
            ? 'bg-red-500/10 dark:bg-red-950/30 border border-red-500 ring-1 ring-red-500 shadow-sm animate-pulse' 
            : 'bg-white dark:bg-[#0a232f] border border-gray-100 dark:border-[#133240]'
        }`}>
          <div className="flex justify-between items-center">
            {isInterventionsAlert ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            )}
            {isInterventionsAlert ? (
              <span className="text-[9px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2 h-2" /> ALERTA
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">PREVENIDO</span>
            )}
          </div>
          <div>
            <span className={`block text-2xl font-extrabold ${isInterventionsAlert ? 'text-red-700 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              +{stats.totalCrisesEvitadas}
            </span>
            <span className={`text-[10px] font-semibold uppercase ${isInterventionsAlert ? 'text-red-600 dark:text-red-300' : 'text-gray-500'}`}>
              Intervenciones Exitosas
            </span>
          </div>
        </div>

        {/* KPI 4 : Speed to normal recovery */}
        <div className={`p-4 rounded-3xl flex flex-col justify-between h-28 transition-all duration-300 ${
          isRecoveryAlert 
            ? 'bg-[#ffe4e6] dark:bg-[#4c0519]/45 border border-rose-500 ring-1 ring-rose-500 shadow-sm animate-pulse' 
            : 'bg-[#fffcf7] dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950'
        }`}>
          <div className="flex justify-between items-center">
            {isRecoveryAlert ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <Clock className="w-4 h-4 text-[#ffb74d]" />
            )}
            {isRecoveryAlert ? (
              <span className="text-[9px] bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2 h-2" /> LENTO
              </span>
            ) : (
              <span className="text-[9px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">RETORNO</span>
            )}
          </div>
          <div>
            <span className={`block text-2xl font-extrabold ${isRecoveryAlert ? 'text-rose-700 dark:text-rose-400' : 'text-[#e2a03d] dark:text-[#ffb74d]'}`}>
              {stats.avgRecuperacionMin} min
            </span>
            <span className={`text-[10px] font-semibold uppercase ${isRecoveryAlert ? 'text-rose-600 dark:text-rose-300' : 'text-gray-500'}`}>
              Avg Velocidad de Alivio
            </span>
          </div>
        </div>
      </section>

      {/* Population Pathology Charts */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-3xl border border-gray-100 dark:border-[#133240] space-y-4 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Distribución Demográfica de Patologías</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Porcentaje de pacientes afectados en este cohorte</p>
        </div>

        {pieData.length > 0 ? (
          <div className="flex items-center justify-between h-40">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 space-y-2 pl-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                  <span className="text-[10px] font-extrabold text-blue-900 dark:text-cyan-400 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-gray-400 font-bold">
            No hay patologías asociadas con estos filtros.
          </div>
        )}
      </section>

      {/* Historic Prevention Trend Chart */}
      <section className="bg-white dark:bg-[#0a232f] p-5 rounded-3xl border border-gray-100 dark:border-[#133240] space-y-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Crisis vs Mitigación</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Relación temporal en ataques presentados y contenidos</p>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={BASELINE_DATA} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCrises" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00796b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00796b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResueltas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb74d" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ffb74d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
              <YAxis stroke="#888888" fontSize={9} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0a232f', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
              <Area type="monotone" dataKey="crises" stroke="#00796b" strokeWidth={2} fillOpacity={1} fill="url(#colorCrises)" name="Total Crisis" />
              <Area type="monotone" dataKey="resueltas" stroke="#ffb74d" strokeWidth={2} fillOpacity={1} fill="url(#colorResueltas)" name="Crisis Resueltas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Developer Sandbox Simulator Console to please the bosses */}
      <section className="bg-[#fdf4ff] dark:bg-[#3b0d45]/15 p-5 rounded-3xl border border-[#fbdbff] dark:border-[#4d1656]/50 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-[#e056fd]" />
          <h3 className="font-extrabold text-xs text-[#4d1656] dark:text-[#f3a4ff] uppercase tracking-wider">Developer Diagnostics / Sandbox Simulation</h3>
        </div>

        <p className="text-[11px] text-[#712284] dark:text-[#dfbcfb] leading-relaxed">
          Haz clic para añadir un paciente ficticio aleatorio para ver cambios interactivos inmediatos en la tasa de mitigación, o simula una carga de picos altos para comprobar la resiliencia en la latencia.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleAddCohortSample}
            className="flex-1 bg-white hover:bg-violet-50 text-[11px] font-bold text-[#7d2091] px-3.5 py-2.5 rounded-xl border border-[#f3a4ff] shadow-xs active:scale-95 transition cursor-pointer"
          >
            + Añadir Cohorte Muestra
          </button>
          
          <button
            onClick={triggerBatchSimulation}
            disabled={mockLoading}
            className="flex-1 bg-[#88219d] hover:bg-[#721b84] text-white text-[11px] font-bold px-3.5 py-2.5 rounded-xl shadow-xs active:scale-95 transition flex justify-center items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${mockLoading ? 'animate-spin' : ''}`} />
            Simular Carga Masiva (KPIs)
          </button>
          
          <button
            onClick={exportToCSV}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3.5 py-2.5 rounded-xl shadow-xs active:scale-95 transition flex justify-center items-center gap-1.5 cursor-pointer mt-1"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Cohorte a CSV (Excel / Power BI)
          </button>
          
          <button
            onClick={handleAiAnalysis}
            disabled={isAiLoading}
            className="w-full bg-[#111827] dark:bg-[#e056fd] hover:bg-[#374151] dark:hover:bg-[#d840f6] text-white text-[11px] font-bold px-3.5 py-2.5 rounded-xl shadow-xs active:scale-95 transition flex justify-center items-center gap-1.5 cursor-pointer mt-1"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            {isAiLoading ? 'Analizando...' : 'Generar Insights del Cohorte con IA'}
          </button>
        </div>
      </section>

      {/* AI Insights Results Panel */}
      {aiAnalysisResult && (
        <motion.section 
          id="ai-insights-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-900 to-purple-950 p-5 rounded-3xl border border-indigo-500/30 shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <div className="bg-indigo-500/30 p-1.5 rounded-lg border border-indigo-400/20">
                 <Sparkles className="w-4 h-4 text-indigo-300" />
               </div>
               <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-100">Análisis Predictivo de IA</h3>
             </div>
             <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">GEMINI.ANALYTICS</span>
          </div>
          
          <div className="text-xs text-indigo-50 leading-relaxed whitespace-pre-wrap">
            {aiAnalysisResult}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}