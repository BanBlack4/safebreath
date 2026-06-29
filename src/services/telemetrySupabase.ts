import { supabase } from '../services/supabaseClient'; // Asegúrate de que la ruta sea correcta
import { ITelemetryRepository } from '../interfaces/telemetry.repository.interface';

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