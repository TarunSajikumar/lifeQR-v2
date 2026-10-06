const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const PatientProfile = require('./models/PatientProfile');
const EmergencyCredential = require('./models/EmergencyCredential');
const { getFrontendUrl, getLocalIpAddress } = require('./utils/frontendUrl');

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing from backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  });
  console.log('MongoDB connected successfully.');

  const localIp = getLocalIpAddress();
  const frontendUrl = getFrontendUrl();
  console.log(`Target LAN IP: ${localIp}`);
  console.log(`Target Frontend URL: ${frontendUrl}`);

  // Fetch all patients from raw MongoDB users collection
  const rawUsers = await mongoose.connection.collection('users').find({ role: 'patient' }).toArray();
  console.log(`Found ${rawUsers.length} patient users in database.`);

  let createdProfiles = 0;
  let updatedProfiles = 0;

  for (const rawUser of rawUsers) {
    console.log(`\nProcessing patient: ${rawUser.name} (${rawUser.email})...`);

    let profile = await PatientProfile.findOne({ userId: rawUser._id });
    const qrCodeId = profile?.qrCodeId || rawUser.qrCodeId || `PAT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (!profile) {
      console.log(`  -> Missing PatientProfile! Creating from legacy User fields...`);
      const contacts = [];
      if (rawUser.emergencyContact && rawUser.emergencyContact.phone) {
        contacts.push({
          name: rawUser.emergencyContact.name || 'Emergency Contact',
          phone: rawUser.emergencyContact.phone,
          relationship: rawUser.emergencyContact.relationship || 'Next of Kin',
          priority: 1
        });
      }

      profile = new PatientProfile({
        userId: rawUser._id,
        qrCodeId: qrCodeId,
        age: rawUser.age || null,
        bloodGroup: rawUser.bloodGroup || '',
        healthIssues: rawUser.healthIssues || '',
        allergies: rawUser.allergies || '',
        medications: rawUser.medications || '',
        emergencyContacts: contacts,
        publicProfile: true
      });
      createdProfiles++;
    } else {
      // If profile exists but vitals are empty while legacy user had them, backfill
      if (!profile.bloodGroup && rawUser.bloodGroup) profile.bloodGroup = rawUser.bloodGroup;
      if (!profile.allergies && rawUser.allergies) profile.allergies = rawUser.allergies;
      if (!profile.medications && rawUser.medications) profile.medications = rawUser.medications;
      if (!profile.healthIssues && rawUser.healthIssues) profile.healthIssues = rawUser.healthIssues;
      if (!profile.age && rawUser.age) profile.age = rawUser.age;
      if ((!profile.emergencyContacts || profile.emergencyContacts.length === 0) && rawUser.emergencyContact?.phone) {
        profile.emergencyContacts = [{
          name: rawUser.emergencyContact.name || 'Emergency Contact',
          phone: rawUser.emergencyContact.phone,
          relationship: rawUser.emergencyContact.relationship || 'Next of Kin',
          priority: 1
        }];
      }
    }

    // Ensure EmergencyCredential
    let credential = await EmergencyCredential.findOne({ patientId: profile._id, status: 'ACTIVE' });
    if (!credential) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const credentialHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      credential = await EmergencyCredential.create({
        patientId: profile._id,
        credentialType: 'QR',
        tokenHash: credentialHash,
        tokenPrefix: 'EMG',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        metadata: { createdBy: rawUser._id, label: 'Primary Emergency Credential' }
      });
    }

    // Generate fresh QR code pointing to active frontend URL
    const qrUrl = `${frontendUrl}/emergency_access.html?id=${qrCodeId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    profile.qrCode = qrCodeDataURL;
    profile.qrCodeId = qrCodeId;
    await profile.save();

    // Synchronize to User collection
    await mongoose.connection.collection('users').updateOne(
      { _id: rawUser._id },
      {
        $set: {
          qrCode: qrCodeDataURL,
          qrCodeId: qrCodeId,
          bloodGroup: profile.bloodGroup || rawUser.bloodGroup || '',
          allergies: profile.allergies || rawUser.allergies || '',
          medications: profile.medications || rawUser.medications || '',
          healthIssues: profile.healthIssues || rawUser.healthIssues || ''
        }
      }
    );

    updatedProfiles++;
    console.log(`  ✓ Updated QR code URL: ${qrUrl}`);
    console.log(`  ✓ Blood: ${profile.bloodGroup || 'N/A'}, Allergies: ${profile.allergies || 'None'}, Contacts: ${profile.emergencyContacts.length}`);
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Total patients processed: ${updatedProfiles}`);
  console.log(`New PatientProfiles created: ${createdProfiles}`);

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
