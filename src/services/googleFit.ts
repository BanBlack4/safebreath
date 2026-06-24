import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../firebase';

// Google Fit API base
const FITNESS_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

// Scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.activity.read'
];

let cachedAccessToken: string | null = null;
let googleAuthPromise: Promise<{ user: User; accessToken: string }> | null = null;

/**
 * Initiates the Google Fit OAuth flow using Firebase Auth.
 */
export const authorizeGoogleFit = async (): Promise<{ user: User; accessToken: string }> => {
  if (googleAuthPromise) return googleAuthPromise;
  
  const provider = new GoogleAuthProvider();
  SCOPES.forEach(scope => provider.addScope(scope));
  
  googleAuthPromise = signInWithPopup(auth, provider)
    .then(result => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('No se pudo obtener el token de acceso de Google Fit.');
      }
      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    })
    .finally(() => {
      googleAuthPromise = null;
    });
    
  return googleAuthPromise;
};

/**
 * Gets the current access token.
 */
export const getAccessToken = () => cachedAccessToken;

/**
 * Fetches recent heart rate daily aggregate or raw data from Google Fit.
 * Note: Google Fit API uses nanosecond timestamps.
 */
export const fetchRecentHeartRate = async (accessToken: string) => {
  const endTime = new Date().getTime();
  const startTime = endTime - (24 * 60 * 60 * 1000); // last 24h
  
  // Try to read raw datasets from derived heartrate stream
  const response = await fetch(`${FITNESS_API_BASE}/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startTime * 1000000}-${endTime * 1000000}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener datos de Google Fit');
  }
  
  const data = await response.json();
  
  // parse the last point
  if (data && data.point && data.point.length > 0) {
    const lastPoint = data.point[data.point.length - 1];
    if (lastPoint.value && lastPoint.value.length > 0) {
      return Math.round(lastPoint.value[0].fpVal);
    }
  }
  
  return null; // No data found
};
