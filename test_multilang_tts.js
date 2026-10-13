const https = require('https');
const fs = require('fs');

function downloadAudio(tl, text, outPath) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=' + tl + '&client=tw-ob';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outPath, buf);
        console.log(`Saved [${tl}] -> ${outPath} (${buf.length} bytes)`);
        resolve(buf);
      });
    }).on('error', reject);
  });
}

async function run() {
  await downloadAudio('kn', 'ನಮಸ್ಕಾರ, ಲೈಫ್ ಕ್ಯೂಆರ್ ತುರ್ತು ಮೆಡಿಕಲ್ ಕಾರ್ಡ್. ಒಂದೇ ಸ್ಪರ್ಶ, ಜೀವ ರಕ್ಷಣೆ.', 'test_kn.mp3');
  await downloadAudio('hi', 'नमस्ते, लाइफ क्यूआर इमरजेंसी मेडिकल कार्ड. सिर्फ एक टच, पूरी सुरक्षा.', 'test_hi.mp3');
  console.log('ALL SUCCESSFUL!');
}

run().catch(console.error);
