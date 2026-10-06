const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const u = await mongoose.connection.db.collection('users').findOne({ email: 'sujit22@gmail.com' });
  console.log('User qrCode length:', u.qrCode?.length);
  // Let's see if we can decode QR or check other users
  const p = await mongoose.connection.db.collection('patientprofiles').findOne({ qrCodeId: 'RAH-D3200470' });
  console.log('Rahul QR length:', p?.qrCode?.length);
  await mongoose.disconnect();
}
run().catch(console.error);
