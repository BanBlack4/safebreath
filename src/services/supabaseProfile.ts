import { supabase } from './supabaseClient';
import type { UserProfile } from '../types';

export const syncProfileToSupabase = async (userId: string | undefined, profile: UserProfile) => {
  if (!userId) return false;

  const { error } = await supabase
    .from('health_profiles')
    .upsert(
      {
        user_id: userId,
        profile_data: profile,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.warn('No se pudo sincronizar el perfil con Supabase:', error.message);
    return false;
  }

  return true;
};

export const getProfileFromSupabase = async (userId: string | undefined): Promise<UserProfile | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo cargar el perfil desde Supabase:', error.message);
    return null;
  }

  return (data?.profile_data as UserProfile | null) ?? null;
};
