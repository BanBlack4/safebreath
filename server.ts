import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin for Firebase Cloud Messaging (FCM)
// Required for sending Push Notifications
try {
  admin.initializeApp({
    projectId: "tensile-lens-l8gvj",
  });
  console.log("Firebase Admin initialized for Cloud Messaging");
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser
  app.use(express.json());

  // Initialize server-side Gemini client with recommended AI Studio Build Agent Headers
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Safe Server-Side API endpoint for Gemini Calming Coach
  app.post("/api/gemini/calm", async (req, res) => {
    try {
      const { prompt, userProfile, currentVitals } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          text: "⚠️ El servidor de SafeBreath está configurado en modo educativo local temporalmente. Para experimentar la calma inteligente en vivo en este botón, por favor adjunta tu API Key de Gemini en el menú Ajustes > Secretos del entorno.\n\nSugerencias de acción inmediatas:\n1. Siéntate en postura erguida sobre una silla cómoda con la espalda recta.\n2. Inhala lentamente por la nariz (4 segundos), sintiendo la expansión del diafragma.\n3. Exhala de forma prolongada con los labios fruncidos (4 segundos). Sincronízate con el círculo de respiración aquí en pantalla."
        });
      }

      // Contextual prompt construction based on the user's health metrics and clinical background
      const systemInstruction = `Eres Sofia, la Asistente Médica de Calma y Rescate para SafeBreath. 
Tu propósito es calmar de forma inmediata a un usuario en medio de una crisis respiratoria, ansiedad extrema o asma.
Tus directrices de comunicación:
1. Habla directamente en segunda persona (tú). Usa español cálido, empático, firme, claro y reconfortante.
2. Evita cualquier jerga técnica o médica compleja alarmante que agrave la hiperventilación.
3. Tus sugerencias deben ser súper sencillas de seguir inmediatamente en casa (máximo 3 acciones numeradas).
4. Invita al usuario a sincronizar su respiración con el círculo azul en pantalla de ritmo 4-4.

Información útil sobre el perfil del paciente:
- Edad: ${userProfile ? userProfile.edad : 'No especificada'} años
- Género: ${userProfile ? userProfile.genero : 'No especificado'}
- Diagnóstico de Asma: ${userProfile?.asma ? "Sí" : "No"}
- Diagnóstico de Ansiedad: ${userProfile?.ansiedad ? "Sí" : "No"}

Signos vitales de la crisis actual en tiempo real:
- Pulso Cardíaco: ${currentVitals?.bpm || 142} BPM (reposo/pico alto)
- Oxígeno SpO2: ${currentVitals?.spo2 || 95}%`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt || "Siento opresión y pánico. Ayúdame a respirar por favor.",
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error communicating with Gemini SDK:", error);
      res.status(500).json({ error: error.message || "Fallo interactuando con el motor de IA." });
    }
  });

  // AI endpoint for generating cohort analysis in Admin Dashboard
  app.post("/api/gemini/analyze-cohort", async (req, res) => {
    try {
      const { cohortData } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          analysis: "⚠️ Modo Sin IA Activo.\n\nSimulación de Análisis:\n- El cohorte presenta una prevalencia moderada de ansiedad y asma.\n- La tasa media de efectividad en mitigaciones es notablemente alta.\n\n[Ingresa la API Key de Gemini para activar el análisis en tiempo real]."
        });
      }

      const reportPrompt = `Actúa como Analista de Datos de Salud de SafeBreath.\nAnaliza el siguiente resumen estadístico del cohorte de pacientes actuales y proporciona 3 observaciones clave breves orientadas a mejorar intervenciones preventivas:\n\n${JSON.stringify(cohortData, null, 2)}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: reportPrompt,
        config: {
           temperature: 0.2, // Low temp for analytical consistency
        }
      });
      
      res.json({ analysis: response.text });
    } catch (error: any) {
      res.status(500).json({ error: "Fallo interpretando datos del cohorte." });
    }
  });

  // Firebase Cloud Messaging SOS Route
  app.post("/api/firebase/sos", async (req, res) => {
    try {
      const { contacts, message } = req.body;
      
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
         return res.status(400).json({ error: "No se proporcionaron contactos válidos" });
      }

      // En este ejemplo enviamos a the FCM topic "emergency" o tokens simulados.
      // Para enviar a contactos de emergencia, cada contacto necesitaría tener la app instalada
      // y su FCM Token registrado en Firebase Firestore. Simularemos el push log.
      const results: any[] = [];
      const errors: any[] = [];

      for (const contact of contacts) {
        if (!contact.phone || contact.phone === '911') continue;

        try {
          // In a real scenario we would look up the contact's FCM token from Firestore
          // using their phone number:
          // const userDoc = await admin.firestore().collection('users').where('phone', '==', contact.phone).get();
          // const fcmToken = userDoc.docs[0].data().fcmToken;
          
          /* Simulated sending for environment:
          await admin.messaging().send({
            token: "SIMULATED_TOKEN",
            notification: {
              title: "🚨 SAFEBREATH ALERTA SOS 🚨",
              body: message || "El paciente está experimentando una emergencia médica.",
            }
          });
          */
          
          results.push({ name: contact.name, status: "simulated_fcm_success" });
        } catch (err: any) {
          console.error(`Failed to push FCM to ${contact.name}:`, err.message);
          errors.push({ name: contact.name, error: err.message });
        }
      }

      // Instead of SMS, we can ALSO write this alert to Firestore to appear in other users' apps!
      try {
        const firestore = admin.firestore();
        await firestore.collection('global_alerts').add({
          message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          contacts: contacts.map(c => c.name)
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

  // Route to log Post-Alert Survey data to Firestore
  app.post("/api/firebase/log-alert", async (req, res) => {
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

  // Route to register an FCM Token from a device
  app.post("/api/firebase/register-device", async (req, res) => {
    try {
      const { deviceId, fcmToken, os, model } = req.body;
      
      if (!deviceId || !fcmToken) {
        return res.status(400).json({ error: "Faltan datos requeridos (deviceId, fcmToken)" });
      }

      const db = admin.firestore();
      // Guardar o actualizar el token del dispositivo en Firestore
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

  // Route to send Critical SOS Alert to specific FCM Tokens
  app.post("/api/firebase/send-critical-alert", async (req, res) => {
    try {
      const { targetTokens, patientName, alertMessage, location } = req.body;

      if (!targetTokens || !Array.isArray(targetTokens) || targetTokens.length === 0) {
        return res.status(400).json({ error: "Falta un array válido de targetTokens" });
      }

      const messaging = admin.messaging();
      const results: any[] = [];
      const errors: any[] = [];

      // Iterar sobre cada token para despachar los mensajes
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
            // Configuración de Prioridad Alta para notificaciones que rompan el modo Sleep / Doze en Android
            android: {
              priority: "high" as const,
              notification: {
                sound: "emergency_alarm",
                channelId: "sos_critical_alerts",
                defaultVibrateTimings: false,
                vibrateTimingsMillis: [500, 1000, 500, 1000, 500]
              }
            },
            // Alertas Críticas (Critical Alerts) para iOS (Requiere entitlement especial de Apple)
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

  // Serve static assets / development routes with Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node-Express server running on http://localhost:${PORT}`);
  });
}

startServer();
