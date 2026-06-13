import { supabase } from '../lib/supabase';
import { TelemetryPoint } from '../store/useTelemetryStore';
import { auth } from '../firebase';

export const syncTelemetryBatch = async (points: TelemetryPoint[]) => {
  const user = auth.currentUser;
  if (!user || points.length === 0) return;

  // Optimistic mapping to the user_telemetry schema
  const rows = points.map(p => ({
    user_id: user.uid,
    timestamp: new Date(p.timestamp).toISOString(),
    bpm: Math.round(p.bpm),
    spo2: 98, // Mocked for now, can be extracted from point if available
    hrv: Math.round(p.hrv),
    stress_level: p.bpm > 100 ? 'elevated' : 'normal',
    movement_status: 'resting', // Mocked
    anomaly_detected: p.bpm > 120 || p.bpm < 50
  }));

  const { error } = await supabase
    .from('user_telemetry')
    .insert(rows);

  if (error) {
    console.error('Error syncing telemetry to Supabase:', error);
  }
};
