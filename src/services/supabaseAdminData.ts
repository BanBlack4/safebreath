import { supabase } from './supabaseClient';

export const fetchAllTelemetryData = async () => {
  const { data, error } = await supabase
    .from('telemetry')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('No se pudo cargar telemetry desde Supabase:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.user_name || 'Anónimo',
    edad: row.age || 30,
    asma: Boolean(row.asma),
    ansiedad: Boolean(row.ansiedad),
    epoc: Boolean(row.epoc),
    crisesEvitadas: row.crises_evited || 0,
    avgRecuperacion: row.avg_recovery_min || 0,
    timestamp: row.timestamp,
  }));
};

export const populateMockTelemetryData = async (count: number) => {
  const sampleRows = Array.from({ length: count }, (_, index) => ({
    id: `mock-${Date.now()}-${index}`,
    user_name: `Anónimo ${index + 1}`,
    age: 24 + (index % 5) * 8,
    asma: index % 2 === 0,
    ansiedad: index % 3 !== 0,
    epoc: index % 4 === 0,
    crises_evited: 5 + index,
    avg_recovery_min: 2.5 + (index % 4) * 0.6,
    timestamp: new Date().toISOString(),
  }));

  const { data, error } = await supabase.from('telemetry').insert(sampleRows);

  if (error) {
    console.warn('No se pudo insertar telemetry mock en Supabase:', error.message);
    return [];
  }

  return data || [];
};
