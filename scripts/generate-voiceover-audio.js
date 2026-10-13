/**
 * LifeQR Cinematic Motion Engine — Multi-Language Voiceover Audio Generator
 * Generates crystal-clear native speech narration MP3 files for all 9 scenes across:
 * - Indian English (en-IN)
 * - Simple Kannada (kn)
 * - Simple Hindi (hi)
 *
 * Saves into:
 *   website/cinematic-motion/audio/<lang>/plate_<1-9>.mp3
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../website/cinematic-motion/audio');

// The exact narrative scripts matching timeline.js MULTILINGUAL_PLATES
const SCRIPTS = {
  en_in: [
    { plate: 1, text: "In an emergency, every second counts. When a patient cannot speak, doctors lose up to 10 critical minutes searching for blood group and emergency contacts." },
    { plate: 2, text: "LifeQR is the simple solution. One smart emergency card. Just tap it to any smartphone, and your medical details open instantly without any app or password." },
    { plate: 3, text: "It looks just like a normal debit card, with an embedded smart chip. It needs zero battery, zero charging, and lasts for over 50 years in your wallet." },
    { plate: 4, text: "Super simple to use. Just touch the card to the back of any phone. No app download needed, no password. Opens in less than one second." },
    { plate: 5, text: "Works everywhere. Even in rural areas with zero internet or phone signal, the chip holds your offline blood group, allergies, and emergency numbers." },
    { plate: 6, text: "Setup takes just two minutes. Visit the website, enter your emergency contacts, download the app, and you are fully protected." },
    { plate: 7, text: "Live emergency dispatch. When tapped, nearest ambulance crews are alerted with GPS radar navigation and live arrival countdown." },
    { plate: 8, text: "Hospital emergency room safety. Doctors receive your medical records before arrival, automatically locking out dangerous drug allergies." },
    { plate: 9, text: "LifeQR. One card, instant help, lives saved. Protect yourself and your family today at LifeQR dot com." }
  ],
  kn: [
    { plate: 1, text: "ರೋಡ್‌ನಲ್ಲಿ ಅಪಘಾತವಾದಾಗ ಪ್ರತಿಯೊಂದು ಸೆಕೆಂಡ್ ಬಹಳ ಮುಖ್ಯ. ವ್ಯಕ್ತಿ ಪ್ರಜ್ಞೆ ತಪ್ಪಿದ್ದಾಗ, ಅವರ ಬ್ಲಡ್ ಗ್ರೂಪ್ ಮತ್ತು ಮನೆಯವರ ನಂಬರ್ ಹುಡುಕಲು ಹತ್ತಾರು ನಿಮಿಷ ವ್ಯರ್ಥವಾಗುತ್ತದೆ." },
    { plate: 2, text: "ಇದಕ್ಕೆ ಪರಿಹಾರ ಲೈಫ್ ಕ್ಯೂಆರ್. ಒಂದು ಪುಟ್ಟ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್. ಯಾವುದೇ ಫೋನ್‌ಗೆ ಮುಟ್ಟಿಸಿದರೆ ಸಾಕು, ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಮೆಡಿಕಲ್ ಮಾಹಿತಿ ತಕ್ಷಣ ಓಪನ್ ಆಗುತ್ತೆ." },
    { plate: 3, text: "ಇದು ಎಟಿಎಂ ಕಾರ್ಡ್ ಥರಾನೇ ಇರುತ್ತೆ. ಒಳಗಡೆ ಒಂದು ಚಿಪ್ ಇರುತ್ತೆ. ಇದಕ್ಕೆ ಬ್ಯಾಟರಿ ಬೇಡ, ಚಾರ್ಜಿಂಗ್ ಬೇಕಿಲ್ಲ, 50 ವರ್ಷ ಸುಲಭವಾಗಿ ಬಾಳಿಕೆ ಬರುತ್ತೆ." },
    { plate: 4, text: "ಬಳಸೋದು ತುಂಬಾ ಈಸಿ. ಕಾರ್ಡ್ ಅನ್ನು ಫೋನ್ ಹಿಂದ್ಗಡೆ ಮುಟ್ಟಿಸಿ. ಯಾವುದೇ ಆಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕಿಲ್ಲ, ಪಾಸ್‌ವರ್ಡ್ ಬೇಕಿಲ್ಲ, ಕೇವಲ ಒಂದು ಸೆಕೆಂಡ್‌ನಲ್ಲಿ ವಿವರ ಲಭ್ಯ." },
    { plate: 5, text: "ಇಂಟರ್ನೆಟ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಿಗ್ನಲ್ ಇಲ್ಲದ ಹಳ್ಳಿಗಳಲ್ಲೂ ಇದು ಕೆಲಸ ಮಾಡುತ್ತೆ. ರಕ್ತದ ಗ್ರೂಪ್ ಮತ್ತು ತುರ್ತು ನಂಬರ್ ಕಾರ್ಡ್ ಚಿಪ್‌ನಲ್ಲೇ ಸೇವ್ ಆಗಿರುತ್ತೆ." },
    { plate: 6, text: "ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಮೊಬೈಲ್ ಆಪ್‌ನಲ್ಲಿ ಕೇವಲ ಎರಡು ನಿಮಿಷದಲ್ಲಿ ಪ್ರೊಫೈಲ್ ಕ್ರಿಯೇಟ್ ಮಾಡಿ. ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮಾಹಿತಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಬಹುದು." },
    { plate: 7, text: "ಕಾರ್ಡ್ ಮುಟ್ಟಿಸಿದ ತಕ್ಷಣ ಸಮೀಪದ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿಗೆ ಲೈವ್ ಜಿಪಿಎಸ್ ಅಲರ್ಟ್ ಹೋಗುತ್ತೆ. ವೇಗವಾಗಿ ಅಪಘಾತ ಸ್ಥಳಕ್ಕೆ ತಲುಪಲು ದಾರಿ ತೋರಿಸುತ್ತೆ." },
    { plate: 8, text: "ಆಸ್ಪತ್ರೆ ತಲುಪುವ ಮೊದಲೇ ತುರ್ತು ನಿಗಾ ಘಟಕದ ವೈದ್ಯರಿಗೆ ಮಾಹಿತಿ ತಲುಪುತ್ತೆ. ಅಲರ್ಜಿ ಇರುವ ಔಷಧಿಗಳನ್ನು ಸಿಸ್ಟಮ್ ತಕ್ಷಣ ಬ್ಲಾಕ್ ಮಾಡುತ್ತೆ." },
    { plate: 9, text: "ಲೈಫ್ ಕ್ಯೂಆರ್. ಒಂದೇ ಸ್ಪರ್ಶ, ಅಮೂಲ್ಯ ಜೀವ ರಕ್ಷಣೆ. ಇಂದು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಲೈಫ್ ಕ್ಯೂಆರ್ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಪಡೆದುಕೊಳ್ಳಿ." }
  ],
  hi: [
    { plate: 1, text: "सड़क पर हादसे के वक्त हर एक सेकंड कीमती होता है। जब मरीज बोल नहीं पाता, तो उसका ब्लड ग्रुप और परिवार का फोन नंबर ढूँढने में 10 मिनट बर्बाद हो जाते हैं।" },
    { plate: 2, text: "इसका आसान समाधान है LifeQR. एक स्मार्ट मेडिकल कार्ड. किसी भी फोन पर बस कार्ड छुवाएं, बिना किसी ऐप या पासवर्ड के आपकी मेडिकल जानकारी खुल जाती है।" },
    { plate: 3, text: "यह साधारण एटीएम कार्ड जैसा दिखता है, लेकिन अंदर स्मार्ट चिप है। ना कोई बैटरी चाहिए, ना कोई चार्जिंग, 50 साल से भी ज्यादा चलता है।" },
    { plate: 4, text: "इस्तेमाल करना बेहद आसान है। बस फोन के पीछे कार्ड टच करें। ना ऐप डाउनलोड करना है, ना पासवर्ड डालना है। एक सेकंड में डेटा सामने।" },
    { plate: 5, text: "इंटरनेट या मोबाइल नेटवर्क ना होने पर भी यह काम करता है। ब्लड ग्रुप और इमरजेंसी नंबर सीधे कार्ड की चिप में ऑफलाइन सुरक्षित रहते हैं।" },
    { plate: 6, text: "वेबसाइट या मोबाइल ऐप पर सिर्फ दो मिनट में अपनी प्रोफाइल बनाएं। घर बैठे कभी भी अपनी मेडिकल जानकारी अपडेट करें।" },
    { plate: 7, text: "टच होते ही नजदीकी एम्बुलेंस को लाइव जीपीएस राडार पर लोकेशन मिलती है और आपातकालीन सायरन बज उठता है।" },
    { plate: 8, text: "अस्पताल पहुँचने से पहले डॉक्टरों को मेडिकल हिस्ट्री मिल जाती है। खतरनाक दवाओं की एलर्जी को सिस्टम तुरंत ब्लॉक कर देता है।" },
    { plate: 9, text: "LifeQR. सिर्फ एक टच, पूरी सुरक्षा, सुरक्षित परिवार। आज ही अपनी सुरक्षा के लिए LifeQR स्मार्ट कार्ड अपनाएं।" }
  ]
};

function downloadChunk(text, langCode) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=' + langCode + '&client=tw-ob';
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, opts, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download audio: HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Split text into chunks if it exceeds 180 chars (Google TTS limit)
async function downloadFullText(text, langCode) {
  // Simple sentence/clause split
  const sentences = text.match(/[^.!?।]+[.!?।]+/g) || [text];
  const audioBuffers = [];

  for (const s of sentences) {
    const clean = s.trim();
    if (!clean) continue;
    if (clean.length > 170) {
      // Split on comma
      const parts = clean.split(/[,،]+/).map(p => p.trim()).filter(Boolean);
      for (const p of parts) {
        const buf = await downloadChunk(p, langCode);
        audioBuffers.push(buf);
        await new Promise(r => setTimeout(r, 200));
      }
    } else {
      const buf = await downloadChunk(clean, langCode);
      audioBuffers.push(buf);
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return Buffer.concat(audioBuffers);
}

async function main() {
  console.log('🎙️ GENERATING HIGH-QUALITY MULTI-LANGUAGE VOICEOVER AUDIO CLIPS...');
  console.log('Target Destination:', AUDIO_DIR);

  const langMap = {
    en_in: 'en-IN',
    kn: 'kn',
    hi: 'hi'
  };

  for (const [langKey, plates] of Object.entries(SCRIPTS)) {
    const tLang = langMap[langKey];
    const targetFolder = path.join(AUDIO_DIR, langKey);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    console.log(`\n--- Generating [${langKey.toUpperCase()}] (${tLang}) Audio Clips ---`);

    for (const item of plates) {
      const outFile = path.join(targetFolder, `plate_${item.plate}.mp3`);
      try {
        console.log(`Downloading Plate ${item.plate}: "${item.text.slice(0, 45)}..."`);
        const audioBuf = await downloadFullText(item.text, tLang);
        fs.writeFileSync(outFile, audioBuf);
        console.log(`  ✓ Saved ${outFile} (${audioBuf.length} bytes)`);
      } catch (err) {
        console.error(`  ✗ Error generating Plate ${item.plate} for ${langKey}:`, err.message);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n🎉 ALL MULTI-LANGUAGE VOICEOVER AUDIO FILES GENERATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Fatal generation error:', err);
  process.exit(1);
});
