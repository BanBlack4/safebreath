import { Router } from 'express';
import { supabase } from '../../src/services/supabaseClient'; // Tu nuevo cliente

import { latamSmsService } from '../services/latamSmsService';

const router = Router();

// --- 1. MIGRADO A SUPABASE ---
router.post('/sos', async (req, res) => {
  const { contacts, message } = req.body;
  // ... tu lógica de latamSmsService ...

  // MIGRACIÓN A SUPABASE
  const { error } = await supabase.from('global_alerts').insert({
    message,
    contacts: contacts.map((c: any) => c.name),
    sms_results: results // resultado de latamSmsService
  });

  res.json({ success: true, delivered: results });
});

// --- 2. MANTENIDO EN FIREBASE (FCM) ---
router.post('/send-critical-alert', async (req, res) => {
  // Aquí SÍ usas admin.messaging()
  const messaging = admin.messaging();
  // ... tu lógica de notificación ...
});

export default router;