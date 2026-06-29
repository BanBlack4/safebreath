import { supabase } from './supabaseClient'; // Tu cliente de Supabase

const FITNESS_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

// Los mismos scopes que tenías
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.activity.read'
].join(' ');

/**
 * Inicia sesión con Google a través de Supabase pidiendo permisos de Fit
 */
export const authorizeGoogleFit = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: SCOPES,
      redirectTo: window.location.origin, // Vuelve a tu app después del login
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Obtiene el token de Google Fit desde la sesión actual de Supabase
 */
export const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  // Supabase almacena el token de Google en provider_token
  return (data.session as any).provider_token;
};

/**
 * Fetches usando el token obtenido de Supabase
 */
export const fetchRecentHeartRate = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('No hay sesión activa con permisos de Google');

  const endTime = new Date().getTime();
  const startTime = endTime - (24 * 60 * 60 * 1000); 
  
  const response = await fetch(
    `${FITNESS_API_BASE}/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startTime * 1000000}-${endTime * 1000000}`, 
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) throw new Error('Error al obtener datos de Google Fit');
  
  const data = await response.json();
  if (data?.point?.length > 0) {
    const lastPoint = data.point[data.point.length - 1];
    return Math.round(lastPoint.value[0].fpVal);
  }
  return null;
};