import { Router } from 'express';
import admin from 'firebase-admin';
import { latamSmsService } from '../services/latamSmsService';

const router = Router();

router.post('/sos', async (req, res) => {
  try {
    const { contacts, message } = req.body;
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
       return res.status(400).json({ error: "No se proporcionaron contactos válidos" });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Trigger parallel low-latency SMS dispatch for each contact via the specialized LatAm trunks
    for (const contact of contacts) {
      if (!contact.phone || contact.phone === '911') continue;

      try {
        const smsResult = await latamSmsService.dispatchLatAmSms(
          contact.name,
          contact.phone,
          message,
          contact.countryCode || '+56'
        );
        results.push(smsResult);
      } catch (err: any) {
        console.error(`Failed to dispatch LatAm Native SMS to ${contact.name}:`, err.message);
        errors.push({ name: contact.name, error: err.message });
      }
    }

    try {
      const firestore = admin.firestore();
      await firestore.collection('global_alerts').add({
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        contacts: contacts.map((c: any) => c.name),
        smsProviderResults: results
      });
    } catch (e: any) {
       console.warn("Could not save to firestore, credentials may not be fully initialized:", e.message);
    }

    res.json({ 
      success: true, 
      delivered: results, 
      failures: errors 
    });
  } catch (error: any) {
    console.error("Error in Firebase SOS route:", error);
    res.status(500).json({ error: "Fallo al inicializar el servicio de alertas FCM/SMS." });
  }
});

router.post('/log-alert', async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection('alert_logs').add({
      ...req.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (e: any) {
    console.warn("Could not log alert to Firestore:", e.message);
    res.status(500).json({ error: "Failed to log survey" });
  }
});

router.post('/register-device', async (req, res) => {
  try {
    const { deviceId, fcmToken, os, model } = req.body;
    
    if (!deviceId || !fcmToken) {
      return res.status(400).json({ error: "Faltan datos requeridos (deviceId, fcmToken)" });
    }

    const db = admin.firestore();
    await db.collection("registered_devices").doc(deviceId).set({
      fcmToken,
      os: os || "unknown",
      model: model || "unknown",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: "FCM Token registrado correctamente" });
  } catch (e: any) {
    console.warn("Error al registrar FCM token:", e.message);
    res.status(500).json({ error: "Fallo al registrar dispositivo. Verifica inicialización de Firestore." });
  }
});

router.post('/send-critical-alert', async (req, res) => {
  try {
    const { targetTokens, patientName, alertMessage, location } = req.body;

    if (!targetTokens || !Array.isArray(targetTokens) || targetTokens.length === 0) {
      return res.status(400).json({ error: "Falta un array válido de targetTokens" });
    }

    const messaging = admin.messaging();
    const results: any[] = [];
    const errors: any[] = [];

    for (const token of targetTokens) {
      try {
        const messagePayload: admin.messaging.Message = {
          token: token,
          notification: {
            title: "🚨 SOS CRÍTICO: " + (patientName || "Paciente Emergencia"),
            body: alertMessage || "Se ha iniciado un protocolo de emergencia extrema.",
          },
          data: {
            type: "critical_alert",
            patientName: patientName || "Desconocido",
            lat: location?.lat?.toString() || "",
            lng: location?.lng?.toString() || ""
          },
          android: {
            priority: "high",
            notification: {
              sound: "emergency_alarm",
              channelId: "sos_critical_alerts",
              defaultVibrateTimings: false,
              vibrateTimingsMillis: [500, 1000, 500, 1000, 500]
            }
          },
          apns: {
            payload: {
              aps: {
                sound: {
                  name: "emergency_alarm.wav",
                  critical: true,
                  volume: 1.0
                },
                "interruption-level": "critical"
              }
            }
          }
        };

        const responseId = await messaging.send(messagePayload);
        results.push({ token, messageId: responseId });
      } catch (error: any) {
        console.error("Error enviando alerta FCM al token:", token, error.message);
        errors.push({ token, error: error.message });
      }
    }

    res.json({ success: true, delivered: results, failures: errors });
  } catch (e: any) {
    console.warn("Fallo general enviando alerta crítica:", e.message);
    res.status(500).json({ error: "Fallo al despachar alertas FCM" });
  }
});

// Clean and serialize objects including Firestore Timestamps
function formatDataForExport(data: any): any {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => formatDataForExport(item));
  }
  
  if (typeof data === 'object') {
    // Check if it's a Firestore Timestamp reference
    if (data.toDate && typeof data.toDate === 'function') {
      return data.toDate().toISOString();
    }
    // Check if it's a nested Timestamp/Date object like {_seconds, _nanoseconds}
    if (data && typeof data._seconds === 'number' && typeof data._nanoseconds === 'number') {
      return new Date(data._seconds * 1000).toISOString();
    }
    
    const obj: any = {};
    for (const key of Object.keys(data)) {
      obj[key] = formatDataForExport(data[key]);
    }
    return obj;
  }
  
  return data;
}

// Recursively fetch a collection and all of its subcollections
async function exportCollectionForExport(db: admin.firestore.Firestore, collectionPath: string): Promise<any> {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const collectionData: any = {};
  
  for (const doc of snapshot.docs) {
    const docData = formatDataForExport(doc.data());
    
    // Attempt to discover subcollections dynamically
    try {
      const subcollections = await doc.ref.listCollections();
      if (subcollections && subcollections.length > 0) {
        for (const subcolRef of subcollections) {
          const subcolData = await exportCollectionForExport(db, `${collectionPath}/${doc.id}/${subcolRef.id}`);
          if (subcolData) {
            docData[subcolRef.id] = subcolData;
          }
        }
      }
    } catch (e) {
      // Fallback for known subcollections like telemetry
      if (collectionPath.endsWith('users')) {
        const subcolData = await exportCollectionForExport(db, `${collectionPath}/${doc.id}/telemetry`);
        if (subcolData) {
          docData['telemetry'] = subcolData;
        }
      }
    }
    
    collectionData[doc.id] = docData;
  }
  
  return collectionData;
}

router.get('/export-rtdb', async (req, res) => {
  try {
    const db = admin.firestore();
    const resultDatabase: any = {};
    
    // Try to list collections dynamically
    let rootCollectionIds: string[] = [];
    try {
      const rootCollections = await db.listCollections();
      rootCollectionIds = rootCollections.map(col => col.id);
    } catch (e: any) {
      console.warn("Failed to dynamically list collections:", e.message);
    }
    
    // Merge with known collections in this system to be absolutely sure we get everything
    const knownCollections = ['users', 'global_alerts', 'alert_logs', 'registered_devices'];
    const collectionsToProcess = Array.from(new Set([...rootCollectionIds, ...knownCollections]));
    
    for (const colId of collectionsToProcess) {
      try {
        const exportData = await exportCollectionForExport(db, colId);
        if (exportData && Object.keys(exportData).length > 0) {
          resultDatabase[colId] = exportData;
        }
      } catch (err: any) {
        console.warn(`Could not export collection ${colId}:`, err.message);
      }
    }
    
    // Send as file attachment
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=firestore-to-realtime-db-import.json');
    return res.status(200).send(JSON.stringify(resultDatabase, null, 2));
    
  } catch (error: any) {
    console.error("Critical error export-rtdb:", error);
    return res.status(500).json({ error: "Fallo al exportar base de datos: " + error.message });
  }
});

export default router;
