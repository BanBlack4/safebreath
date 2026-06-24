import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  databaseId: (firebaseConfig as any).firestoreDatabaseId,
} as any);

// Mejorar la resiliencia de la app con persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Múltiples pestañas abiertas, persistencia sólo en una.');
  } else if (err.code == 'unimplemented') {
    console.warn('El navegador no soporta persistencia offline.');
  }
});

export const auth = getAuth();
