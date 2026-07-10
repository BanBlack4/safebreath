import { Router } from 'express';
import { supabase } from '../../src/services/supabaseClient';
import { latamSmsService } from '../services/latamSmsService';

const router = Router();

router.post('/sos', async (req, res) => {
  const { contacts = [], message = 'Alerta SafeBreath' } = req.body ?? {};

  const results = [] as Array<{ recipientName: string; status: string; provider?: string }>;

  for (const contact of contacts) {
    if (!contact?.phone) continue;

    const result = await latamSmsService.dispatchLatAmSms(
      contact.name || 'Contacto',
      contact.phone,
      message
    );

    results.push({
      recipientName: result.recipientName,
      status: result.status,
      provider: result.provider
    });
  }

  try {
    await supabase.from('global_alerts').insert({
      message,
      contacts: contacts.map((contact: any) => contact.name || 'Contacto'),
      sms_results: results,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn('Unable to persist SOS alert log:', error?.message || error);
  }

  res.json({ success: true, delivered: results });
});

export default router;