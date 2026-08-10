const https = require('https');

/**
 * Startup Notification Service
 * Channels: Telegram (Free), OneSignal (Free Push), SMS (Optional)
 */
const sendNotification = async ({ type, payload }) => {
  const { name, message, location, contacts, patientId } = payload;
  const mapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;

  // --- 1. CHANNEL: TELEGRAM (100% FREE & INSTANT) ---
  // To use: Create a bot via @BotFather and get TELEGRAM_BOT_TOKEN
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const text = `🚨 *LifeQR SOS ALERT*\n\n*Patient:* ${name}\n*Message:* ${message}\n*Location:* [Open in Maps](${mapsLink})`;
    const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;

    https.get(tgUrl, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        console.log(`Telegram Response [${res.statusCode}]: ${responseBody}`);
      });
    }).on('error', (err) => console.error('Telegram Alert Failed:', err.message));
  }

  // --- 2. CHANNEL: ONESIGNAL (UNLIMITED FREE WEB PUSH) ---
  // To use: Sign up at OneSignal.com and get APP_ID and API_KEY
  if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) {
    const data = JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      included_segments: ["All"], // Or target specific responder IDs
      headings: { en: `🚨 EMERGENCY: SOS from ${name}` },
      contents: { en: `${message}. Tap for live coordinates.` },
      url: mapsLink
    });

    const options = {
      hostname: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        console.log(`OneSignal Response [${res.statusCode}]: ${responseBody}`);
      });
    });
    req.on('error', (err) => console.error('OneSignal Push Failed:', err));
    req.write(data);
    req.end();
  }

  // --- 3. CHANNEL: EMAIL (FREE via Gmail/SendGrid) ---
  // This is already handled in your existing emailService.js

  console.log(`📡 Multi-channel SOS broadcast initiated for ${name}`);
};

module.exports = { sendNotification };
