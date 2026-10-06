const mongoose = require('../backend/node_modules/mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
require('../backend/node_modules/dotenv').config({path: './backend/.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const docs = await mongoose.connection.db.collection(c.name).find({
      $or: [
        { qrCodeId: /SUJ/i },
        { name: /sujit/i },
        { email: /sujit/i }
      ]
    }).toArray();
    if (docs.length > 0) {
      console.log('Found in', c.name, docs.map(d => ({
        id: d._id,
        email: d.email,
        name: d.name,
        role: d.role,
        qrCodeId: d.qrCodeId,
        userId: d.userId
      })));
    }
  }
  process.exit(0);
});
