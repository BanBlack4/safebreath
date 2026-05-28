import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

router.post('/sos', async (req, res) => {
  try {
    const { contacts, message } = req.body;
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
       return res.status(400).json({ error: "No se proporcionaron contactos válidos" });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const contact of contacts) {
      if (!contact.phone || contact.phone === '911') continue;

      try {
        results.push({ name: contact.name, status: "simulated_fcm_success" });
      } catch (err: any) {
        console.error(`Failed to push FCM to ${contact.name}:`, err.message);
        errors.push({ name: contact.name, error: err.message });
      }
    }

    try {
      const firestore = admin.firestore();
      await firestore.collection('global_alerts').add({
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        contacts: contacts.map((c: any) => c.name)
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
    res.status(500).json({ error: "Fallo al inicializar el servicio de alertas FCM." });
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

export default router;
