import { supabase } from './supabaseClient';
import { HealthEvent } from '../types';

export const fetchHealthHistory = async (userId: string): Promise<HealthEvent[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('health_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching health history:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type as any,
    time: row.time_str,
    dateStr: row.date_str,
    description: row.description || '',
    badge: row.badge,
    details: row.details
  }));
};

export const fetchUserInsight = async (userId: string) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows returned, which is fine
    console.error('Error fetching user insight:', error);
  }

  return data;
};

export const insertHealthEvent = async (
  userId: string,
  title: string,
  type: string,
  description: string,
  badge: string,
  details?: any
) => {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const dateStr = `Hoy, ${new Date().toLocaleDateString('es-ES', dateOptions)}`;

  const { data, error } = await supabase
      .from('health_events')
      .insert({
          user_id: userId,
          title,
          type,
          time_str: timeStr,
          date_str: dateStr,
          description,
          badge,
          details: details || {}
      })
      .select()
      .single();

  if (error) {
      console.error('Error inserting health event:', error);
      throw error;
  }
  
  return data;
};

export const insertManualLog = async (
  userId: string, 
  bpm: number, 
  spo2: number, 
  mood: string, 
  activity: string
) => {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const dateStr = `Hoy, ${new Date().toLocaleDateString('es-ES', dateOptions)}`;

  const description = `Check-in preventivo manual. Estado reportado: "${mood === 'Calm' ? 'Tranquilo' : mood === 'Neutral' ? 'Neutral' : 'Ansioso'}". Ritmo cardíaco: ${bpm} BPM. Saturación O2: ${spo2}%.${activity ? ` Actividad: ${activity}.` : ''}`;

  const { data, error } = await supabase
      .from('health_events')
      .insert({
          user_id: userId,
          title: 'Preventive Check-in',
          type: 'manual_log',
          time_str: timeStr,
          date_str: dateStr,
          description,
          badge: 'Manual',
          details: { bpm, spo2, mood, activity: activity || 'Ninguna especificada' }
      })
      .select()
      .single();

  if (error) {
      console.error('Error inserting manual log:', error);
      throw error;
  }
  
  return data;
};
