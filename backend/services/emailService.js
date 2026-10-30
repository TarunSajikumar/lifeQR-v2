const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[LifeQR Mailer] nodemailer not installed — using console mock');
}

let transporter = null;
let isConfigured = false;

const smtpUser = (process.env.SMTP_USER || process.env.email_id || '').trim();
// Automatically strip spaces if user pasted a 16-character Google App Password (e.g. "abcd efgh ijkl mnop")
const rawPass = (process.env.SMTP_PASS || process.env.email_password || '').trim();
const smtpPass = rawPass.replace(/\s+/g, '');

if (nodemailer && smtpUser && smtpPass) {
  // Use standard Gmail configuration
  const isGmail = smtpUser.toLowerCase().includes('@gmail.com') || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'));
  
  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Verify connection once at startup
  transporter.verify((err) => {
    if (err) {
      const isAppPasswordError = err.message && (err.message.includes('534-5.7.9') || err.message.includes('Application-specific password required') || err.message.includes('InvalidSecondFactor'));
      
      if (isAppPasswordError) {
        console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
        console.log('│ 📧  Gmail SMTP: Google App Password Required                           │');
        console.log('├────────────────────────────────────────────────────────────────────────┤');
        console.log(`│ Account: ${smtpUser.padEnd(61)} │`);
        console.log('│ Google does NOT permit normal Gmail passwords for SMTP automation.    │');
        console.log('│                                                                        │');
        console.log('│ 3 Steps to activate live Gmail delivery:                               │');
        console.log('│ 1. Turn on 2-Step Verification at: myaccount.google.com/security       │');
        console.log('│ 2. Create an App Password at: https://myaccount.google.com/apppasswords│');
        console.log('│ 3. Paste the 16-character code into backend/.env (SMTP_PASS=...)       │');
        console.log('│                                                                        │');
        console.log('│ 🛡️ Fallback Active: All OTPs are auto-filled in the app & logged here  │');
        console.log('│    so testing, signup, and login work 100% seamlessly right now!      │');
        console.log('└────────────────────────────────────────────────────────────────────────┘\n');
      } else {
        console.warn(`[LifeQR Mailer] SMTP verification: ${err.message}. Fallback to console active.`);
      }
      transporter = null;
      isConfigured = false;
    } else {
      isConfigured = true;
      console.log(`✅ [LifeQR Mailer] Gmail SMTP connected! OTP emails will be sent from: ${smtpUser}`);
    }
  });
} else {
  console.log('[LifeQR Mailer] No SMTP credentials provided — console fallback active.');
}

const sendEmail = async (options) => {
  const from = process.env.SMTP_FROM || `"LifeQR Emergency" <${smtpUser || 'noreply@lifeqr.com'}>`;

  const mailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  if (transporter && isConfigured) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ [LifeQR Mailer] OTP email successfully sent → ${options.to} (msgId: ${info.messageId})`);
      return info;
    } catch (error) {
      console.warn(`⚠️ [LifeQR Mailer] Live send failed for ${options.to}:`, error.message);
      console.log(`\n🔑 [EMAIL FALLBACK OTP LOG]\nTO: ${options.to}\nSUBJECT: ${options.subject}\nBODY: ${options.text}\n`);
      return null;
    }
  } else {
    // Fallback log
    console.log(`\n📧 [LIFEQR OTP EMAIL]\nTO: ${options.to}\nSUBJECT: ${options.subject}\nBODY:\n${options.text}\n`);
    return { mock: true, messageId: `mock_${Date.now()}` };
  }
};

module.exports = { sendEmail };
