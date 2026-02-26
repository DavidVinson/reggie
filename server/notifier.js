const twilio = require('twilio');
const db = require('./db');

function isConfigured() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return false;
  const user = db.prepare('SELECT phone_number FROM users LIMIT 1').get();
  return !!(user?.phone_number);
}

// Send an SMS. Returns { success, messageId, error }.
async function sendSms(title, body, sourceUrl) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Reggie: Twilio not configured — skipping SMS');
    return { success: false, error: 'Twilio not configured' };
  }

  const user = db.prepare('SELECT phone_number FROM users LIMIT 1').get();
  if (!user?.phone_number) {
    console.log('Reggie: no user phone number — skipping SMS');
    return { success: false, error: 'No phone number on file' };
  }

  const parts = [`Reggie: ${title}`];
  if (body) parts.push(body);
  if (sourceUrl) parts.push(`Register: ${sourceUrl}`);

  // Keep under 160 chars — trim body if needed
  let text = parts.join('\n');
  if (text.length > 160) {
    text = `Reggie: ${title}${sourceUrl ? `\nRegister: ${sourceUrl}` : ''}`.slice(0, 160);
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: text,
      from: TWILIO_PHONE_NUMBER,
      to: user.phone_number,
    });
    return { success: true, messageId: message.sid };
  } catch (err) {
    console.error('Reggie: SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSms, isConfigured };
