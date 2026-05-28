import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

router.post('/calm', async (req, res) => {
  try {
    const { prompt, userProfile, currentVitals } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        text: "⚠️ El servidor de SafeBreath está configurado en modo educativo local temporalmente. Para experimentar la calma inteligente en vivo en este botón, por favor adjunta tu API Key de Gemini en el menú Ajustes > Secretos del entorno.\n\nSugerencias de acción inmediatas:\n1. Siéntate en postura erguida sobre una silla cómoda con la espalda recta.\n2. Inhala lentamente por la nariz (4 segundos), sintiendo la expansión del diafragma.\n3. Exhala de forma prolongada con los labios fruncidos (4 segundos). Sincronízate con el círculo de respiración aquí en pantalla."
      });
    }

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

router.post('/analyze-cohort', async (req, res) => {
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

export default router;
