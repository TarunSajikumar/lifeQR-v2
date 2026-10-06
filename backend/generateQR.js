const dns = require("dns");
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require("mongoose");
const QRCode = require('qrcode');
const User = require("./models/User");
const { getFrontendUrl } = require('./utils/frontendUrl');
require("dotenv").config({ path: require('path').join(__dirname, '.env') });

async function generateQRForAccount(email) {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeqr';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ MongoDB Connected");

    const targetEmail = email || process.argv[2];
    if (!targetEmail) {
      console.error('❌ Provide a user email as an argument, for example: node generateQR.js user@example.com');
      await mongoose.connection.close();
      process.exit(1);
    }

    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.log(`❌ User not found for ${targetEmail}`);
      await mongoose.connection.close();
      return;
    }

    const PatientProfile = require("./models/PatientProfile");
    let profile = await PatientProfile.findOne({ userId: user._id });
    const qrCodeId = profile?.qrCodeId || user.qrCodeId;
    if (!qrCodeId) {
      console.error(`❌ No qrCodeId found for ${targetEmail}`);
      await mongoose.connection.close();
      return;
    }

    const frontendUrl = getFrontendUrl();
    const qrUrl = `${frontendUrl}/emergency_access.html?id=${qrCodeId}`;

    console.log("📝 Generating QR code...");
    console.log("QR Code URL:", qrUrl);
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    user.qrCode = qrCodeDataUrl;
    await user.save();

    if (profile) {
      profile.qrCode = qrCodeDataUrl;
      await profile.save();
      console.log("✅ Updated PatientProfile qrCode as well!");
    }

    console.log("✅ QR Code generated and saved successfully!");
    console.log("\n📊 User Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("QR Code ID:", qrCodeId);
    console.log("Blood Group:", profile?.bloodGroup || 'N/A');
    console.log("QR Code Length:", qrCodeDataUrl.length, "bytes");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await mongoose.connection.close();
    console.log("\n✅ Done! The QR code is ready for the selected account.");
  } catch (error) {
    console.error("❌ Error generating QR code:", error.message);
    process.exit(1);
  }
}

generateQRForAccount();
