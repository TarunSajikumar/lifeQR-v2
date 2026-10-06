const mongoose = require('./node_modules/mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}, 'name email role active verificationStatus').lean();
  console.log('Total users:', users.length);
  users.forEach(u => console.log(`${u.role}: ${u.email} | verified: ${u.verificationStatus} | active: ${u.active}`));
  await mongoose.connection.close();
}
check();
