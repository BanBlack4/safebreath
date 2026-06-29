import { supabase } from '../../../../src/services/supabaseClient'; // Asegúrate de que la ruta sea correcta
import { IHealthProfileRepository } from '../health-profile.repository.interface';

export class SupabaseHealthProfileRepository implements IHealthProfileRepository {
  
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  async updateProfile(userId: string, data: any) {
    // Upsert asegura que si existe, actualice; si no, cree uno nuevo
    const { data: updatedData, error } = await supabase
      .from('health_profiles')
      .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return updatedData;
  }
}