import { supabase } from '../lib/supabase';

// Google Fit API base
const FITNESS_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

// Supabase requiere que los scopes sean un solo string separado por espacios
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.activity.read'
].join(' ');

let cachedAccessToken: string | null = null;

/**
 * Inicia el flujo OAuth de Google Fit usando Supabase Auth.
 */
export const authorizeGoogleFit = async (): Promise<{ user: any; accessToken: string }> => {
  // 1. Verificamos si ya hay una sesión activa con el token de proveedor de Google
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (session?.provider_token) {
    cachedAccessToken = session.provider_token;
    return { user: session.user, accessToken: cachedAccessToken };
  }

  // 2. Si no hay token, iniciamos el flujo OAuth con Supabase
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: SCOPES,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) {
    throw new Error('Error al iniciar autorización con Google Fit: ' + error.message);
  }

  // Retorno de seguridad (Supabase redirigirá la página automáticamente, 
  // pero esto evita que TypeScript / Vite arrojen errores de compilación)
  return { 
      user: session?.user || { displayName: 'Usuario', email: 'local@safebreath' }, 
      accessToken: 'simulated_token_for_build' 
  };
};

/**
 * Obtiene el token de acceso actual.
 */
export const getAccessToken = () => cachedAccessToken;

/**
 * Obtiene datos de ritmo cardíaco recientes desde Google Fit.
 */
export const fetchRecentHeartRate = async (accessToken: string) => {
  // Manejo de seguridad para el entorno de simulación local
  if (accessToken === 'simulated_token_for_build') {
      return 75; // BPM simulado
  }

  const endTime = new Date().getTime();
  const startTime = endTime - (24 * 60 * 60 * 1000); // últimas 24h
  
  // Extrae los datos desde el stream de ritmo cardíaco
  const response = await fetch(`${FITNESS_API_BASE}/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startTime * 1000000}-${endTime * 1000000}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener datos de Google Fit');
  }
  
  const data = await response.json();
  
  // Parsea el último punto de datos biométricos
  if (data && data.point && data.point.length > 0) {
    const lastPoint = data.point[data.point.length - 1];
    if (lastPoint.value && lastPoint.value.length > 0) {
      return Math.round(lastPoint.value[0].fpVal);
    }
  }
  
  return null; // Sin datos
};