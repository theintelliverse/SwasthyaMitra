const twilio = require('twilio');

const sendWhatsApp = async (phone, message) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        throw new Error('WhatsApp service is not configured. Set TWILIO_ACCOUNT_SID/TWILIO_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM (or TWILIO_PHONE).');
    }

    const client = twilio(accountSid, authToken);
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

    const response = await client.messages.create({
        from: formattedFrom,
        body: message,
        to: `whatsapp:${formattedPhone}`
    });

    console.log(`✅ WhatsApp Sent! SID: ${response.sid}`);
    return response;
};

module.exports = sendWhatsApp;