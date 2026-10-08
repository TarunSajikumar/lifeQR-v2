const mongoose = require('./node_modules/mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const bcrypt = require('./node_modules/bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const PatientProfile = require('./models/PatientProfile');
const Doctor = require('./models/Doctor');
const AmbulanceCrew = require('./models/AmbulanceCrew');
const Hospital = require('./models/Hospital');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for master account seed/verification.');

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 1. Admin Account
  let admin = await User.findOne({ email: 'admin@lifeqr.com' });
  if (!admin) {
    admin = await User.create({
      name: 'LifeQR Security Ops Lead',
      email: 'admin@lifeqr.com',
      password: hashedPassword,
      gender: 'other',
      role: 'admin',
      active: true,
      verified: true,
      verificationStatus: 'VERIFIED'
    });
    console.log('✅ Created admin@lifeqr.com');
  } else {
    admin.role = 'admin';
    admin.active = true;
    admin.verified = true;
    admin.verificationStatus = 'VERIFIED';
    admin.password = hashedPassword;
    if (!admin.gender) admin.gender = 'other';
    await admin.save();
    console.log('✅ Updated admin@lifeqr.com to VERIFIED with Password@123');
  }

  // 2. ER Trauma Center Account
  let er = await User.findOne({ email: 'er@lifeqr.com' });
  if (!er) {
    er = await User.create({
      name: 'Metro City Central ER Reception',
      email: 'er@lifeqr.com',
      password: hashedPassword,
      gender: 'other',
      role: 'doctor',
      active: true,
      verified: true,
      verificationStatus: 'VERIFIED'
    });
    console.log('✅ Created er@lifeqr.com');
  } else {
    er.role = 'doctor';
    er.active = true;
    er.verified = true;
    er.verificationStatus = 'VERIFIED';
    er.password = hashedPassword;
    if (!er.gender) er.gender = 'other';
    await er.save();
    console.log('✅ Updated er@lifeqr.com to VERIFIED with Password@123');
  }

  // 3. Doctor Account
  let doc = await User.findOne({ email: 'doctor@lifeqr.com' });
  if (doc) {
    doc.verificationStatus = 'VERIFIED';
    doc.verified = true;
    doc.password = hashedPassword;
    await doc.save();
    console.log('✅ Verified doctor@lifeqr.com');
  }

  // 4. Crew Account
  let crew = await User.findOne({ email: 'crew@lifeqr.com' });
  if (crew) {
    crew.verificationStatus = 'VERIFIED';
    crew.verified = true;
    crew.password = hashedPassword;
    await crew.save();
    console.log('✅ Verified crew@lifeqr.com');
  }

  // 5. Patient Account check
  let patient = await User.findOne({ email: 'patient@lifeqr.com' });
  if (patient) {
    patient.password = hashedPassword;
    patient.verified = true;
    patient.verificationStatus = 'VERIFIED';
    patient.address = patient.address || '42 Marine Drive, Mumbai, MH';
    await patient.save();
    console.log('✅ Verified patient@lifeqr.com');

    let profile = await PatientProfile.findOne({ userId: patient._id });
    if (profile) {
      profile.lastLocation = {
        lat: 18.9438,
        lng: 72.8234,
        updatedAt: new Date()
      };
      await profile.save();
      console.log('✅ Set live emergency location for Rahul Sharma (18.9438, 72.8234)');
    }
  }

  await mongoose.connection.close();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
