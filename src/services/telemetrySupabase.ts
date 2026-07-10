import { supabase } from '../services/supabaseClient'; // Asegúrate de que la ruta sea correcta
import { ITelemetryRepository } from '../interfaces/telemetry.repository.interface';

export const syncTelemetryBatch = async (points: Array<{ bpm: number; hrv: number; timestamp: number; confidence: number }>) => {
  if (!points.length) return;

  const rows = points.map((point) => ({
    timestamp: new Date(point.timestamp).toISOString(),
    bpm: point.bpm,
    hrv: point.hrv,
    confidence: point.confidence,
    source: 'client'
  }));

  const { error } = await supabase.from('telemetry').insert(rows);

  if (error) {
    console.warn('No se pudo sincronizar telemetría con Supabase:', error.message);
  }
};

export class SupabaseTelemetryRepository implements ITelemetryRepository {
  
  async saveTelemetry(userId: string, data: any): Promise<void> {
    const { error } = await supabase
      .from('telemetry')
      .insert({
        user_id: userId,
        ...data,
        timestamp: new Date().toISOString() // Postgres usa strings ISO para fechas
      });

    if (error) {
      console.error('Error saving telemetry to Supabase:', error);
      throw error;
    }
  }

  async getTelemetryHistory(userId: string, startTime: number, endTime: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(startTime).toISOString())
      .lte('timestamp', new Date(endTime).toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching telemetry from Supabase:', error);
      return [];
    }

    return data || [];
  }
}