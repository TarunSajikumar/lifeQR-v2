const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}, 'name email role active verificationStatus plainPassword').lean();
  console.log('Database Users:');
  users.forEach(u => {
    console.log(`- ${u.role}: ${u.email} (Active: ${u.active}, Verified: ${u.verificationStatus})`);
  });
  await mongoose.connection.close();
}

checkUsers();
