import { IHealthProfileRepository } from '../interfaces/health-profile.repository.interface';
import * as admin from 'firebase-admin';

export class FirestoreHealthProfileRepository implements IHealthProfileRepository {
  async getProfile(userId: string): Promise<any> {
    try {
      const db = admin.firestore();
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        return { userId, ...doc.data() };
      }
      return null;
    } catch (error) {
      // Fallback for demo when firebase is not initialized properly
      console.warn('Using fallback data for getProfile', error);
      return {
        userId,
        name: 'Usuario Demo',
        edad: 30,
        peso: 70,
        altura: 175,
        genero: 'Femenino',
        bpmReposo: 70,
        ansiedad: false,
        condiciones: [],
      };
    }
  }

  async updateProfile(userId: string, data: any): Promise<any> {
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userId).set(data, { merge: true });
      return { userId, ...data };
    } catch (error) {
      console.warn('Using fallback data for updateProfile', error);
      return { userId, ...data };
    }
  }
}
