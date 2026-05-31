import { Router } from 'express';
import twilio from 'twilio';

const router = Router();

router.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Twilio credentials are not configured on the server.' });
  }

  try {
    const client = twilio(accountSid, authToken);
    
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
    
    return res.status(200).json({ success: true, sid: response.sid });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
});

export default router;
