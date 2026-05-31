import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  getDocFromCache,
  getDocsFromCache
} from 'firebase/firestore';
import { UserProfile } from '../types';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

// Offline profile queue
let offlineProfileQueue: Partial<UserProfile> | null = null;
let isReconciling = false;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (offlineProfileQueue) {
      reconcileOfflineProfileQueue();
    }
  });
}

const reconcileOfflineProfileQueue = async () => {
  if (!auth.currentUser || !offlineProfileQueue || isReconciling) return;
  
  isReconciling = true;
  try {
    const uid = auth.currentUser.uid;
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    
    const batch = writeBatch(db);
    batch.set(profileRef, offlineProfileQueue, { merge: true });
    
    await batch.commit();
    offlineProfileQueue = null; // Limpiar la cola tras sincronizar
    console.log("Perfil offline reconciliado con éxito.");
  } catch (error: any) {
    console.warn("Error reconciliando perfil en offline queue:", error.message);
  } finally {
    isReconciling = false;
  }
};

// Utilidad para reintento exponencial
const withExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = BASE_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Abort if permission denied, offline, or we run out of retries
    if (retries === 0 || error.code === 'permission-denied' || error.code === 'unavailable') {
      throw error;
    }
    console.warn(`Operación fallida. Reintentando en ${delay}ms...`, error.message);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withExponentialBackoff(operation, retries - 1, delay * 2);
  }
};

export const syncProfileToFirestore = async (profile: UserProfile) => {
  if (!auth.currentUser) return;
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Encolamos localmente si estamos offline
      offlineProfileQueue = { ...(offlineProfileQueue || {}), ...profile };
      return;
    }

    const uid = auth.currentUser.uid;
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    
    // Firestore queues writes automatically when offline, but we wrap it as requested.
    // We don't await it to avoid blocking the UI if offline.
    withExponentialBackoff(() => setDoc(profileRef, profile, { merge: true })).catch((err) => {
      if (err.code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        offlineProfileQueue = { ...(offlineProfileQueue || {}), ...profile };
      } else {
        console.warn("Fallo en sincronización en segundo plano:", err.message);
      }
    });

    // Si hay datos pendientes de cuando estuvimos offline, lanzamos la reconciliación
    if (offlineProfileQueue) {
      reconcileOfflineProfileQueue();
    }
  } catch (error: any) {
    console.warn("Error al intentar sincronizar perfil:", error.message);
  }
};

export const getProfileFromFirestore = async (): Promise<UserProfile | null> => {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const profileRef = doc(db, 'users', uid, 'profile', 'data');
  
  try {
    const snap = await withExponentialBackoff(() => getDoc(profileRef), 3, 500);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error: any) {
    if (error.code !== 'unavailable') {
      console.warn("Fallo la petición servidor. Intentando caché...", error.message);
    }
    try {
      const cachedSnap = await getDocFromCache(profileRef);
      if (cachedSnap.exists()) {
        return cachedSnap.data() as UserProfile;
      }
    } catch (cacheError: any) {
      if (cacheError.code !== 'unavailable') {
        console.warn("Documento no encontrado en caché local.", cacheError.message);
      }
    }
  }
  return null;
};

export const syncHistoryEventsToFirestore = async (events: any[]) => {
  if (!auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    const historyRef = collection(db, 'users', uid, 'history');
    
    withExponentialBackoff(async () => {
      const batch = writeBatch(db);
      events.forEach(event => {
        const docRef = doc(historyRef, event.id.toString());
        batch.set(docRef, event, { merge: true });
      });
      await batch.commit();
    }).catch(err => {
      if (err.code !== 'unavailable') {
        console.warn("Fallo sincronización historial:", err.message);
      }
    });
  } catch (error: any) {
    console.warn("Error al organizar sincronización de historial:", error.message);
  }
};

export const getHistoryEventsFromFirestore = async (): Promise<any[]> => {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  const historyRef = collection(db, 'users', uid, 'history');
  
  try {
    const snap = await withExponentialBackoff(() => getDocs(historyRef), 3, 500);
    return snap.docs.map(doc => doc.data());
  } catch (error: any) {
    if (error.code !== 'unavailable') {
      console.warn("Fallo la petición servidor. Intentando caché para historial...", error.message);
    }
    try {
      const cachedSnap = await getDocsFromCache(historyRef);
      return cachedSnap.docs.map(doc => doc.data());
    } catch (cacheError: any) {
      if (cacheError.code !== 'unavailable') {
        console.warn("No se pudo obtener el historial de la caché.", cacheError.message);
      }
      return [];
    }
  }
};

/**
 * ADMIN: Populate mock telemetry data for the dashboard.
 */
export const populateMockTelemetryData = async (amount: number = 20) => {
  try {
    const telemetryRef = collection(db, 'telemetry_logs');
    
    // Create random mock users
    const newLogs = Array.from({ length: amount }).map((_, i) => {
      const randomAge = Math.floor(Math.random() * (70 - 18 + 1)) + 18;
      const isAsthma = Math.random() > 0.4;
      const isAnxiety = Math.random() > 0.3;
      const isCOPD = !isAsthma && Math.random() > 0.5;
      const listNames = ['P4', 'T8', 'R9', 'Q1', 'X5', 'V2'];
      const fakeName = `Anónimo ${Math.floor(Math.random() * 90 + 10)}${listNames[Math.floor(Math.random() * listNames.length)]}`;
      const logId = doc(telemetryRef).id;

      return {
        id: logId,
        name: fakeName,
        edad: randomAge,
        asma: isAsthma,
        ansiedad: isAnxiety,
        epoc: isCOPD,
        crisesEvitadas: Math.floor(Math.random() * 20) + 3,
        avgRecuperacion: Number((Math.random() * (5.5 - 2.5) + 2.5).toFixed(1)),
        timestamp: new Date().toISOString()
      };
    });

    await withExponentialBackoff(async () => {
      const batch = writeBatch(db);
      newLogs.forEach(log => {
        const docRef = doc(telemetryRef, log.id);
        batch.set(docRef, log, { merge: true });
      });
      await batch.commit();
    });
    
    return newLogs;
  } catch (error: any) {
    console.warn("Error al intentar poblar telemetry:", error.message);
    return [];
  }
};

/**
 * ADMIN: Fetch all telemetry data
 */
export const fetchAllTelemetryData = async (): Promise<any[]> => {
  try {
    const telemetryRef = collection(db, 'telemetry_logs');
    const snap = await withExponentialBackoff(() => getDocs(telemetryRef), 3, 500);
    return snap.docs.map(doc => doc.data());
  } catch (error: any) {
    console.warn("Fallo obteniendo telemetry desde Firestore:", error.message);
    return [];
  }
};
