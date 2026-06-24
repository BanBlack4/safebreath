import { ITelemetryRepository } from '../interfaces/telemetry.repository.interface';
import admin from 'firebase-admin';

export class FirestoreTelemetryRepository implements ITelemetryRepository {
  async saveTelemetry(userId: string, data: any): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userId).collection('telemetry').add({
        ...data,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.warn('Using fallback data for saveTelemetry', error);
    }
  }

  async getTelemetryHistory(userId: string, startTime: number, endTime: number): Promise<any[]> {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('users').doc(userId).collection('telemetry')
        .where('timestamp', '>=', new Date(startTime))
        .where('timestamp', '<=', new Date(endTime))
        .orderBy('timestamp', 'asc')
        .get();
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Using fallback data for getTelemetryHistory', error);
      return [];
    }
  }
}
