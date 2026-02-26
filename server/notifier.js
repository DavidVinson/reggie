const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  USER_PHONE_NUMBER,
} = process.env;

function isConfigured() {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && USER_PHONE_NUMBER);
}

// Send an SMS. Returns { success, messageId, error }.
async function sendSms(title, body, sourceUrl) {
  if (!isConfigured()) {
    console.log('Reggie: Twilio not configured — skipping SMS');
    return { success: false, error: 'Twilio not configured' };
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
      to: USER_PHONE_NUMBER,
    });
    return { success: true, messageId: message.sid };
  } catch (err) {
    console.error('Reggie: SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSms, isConfigured };
