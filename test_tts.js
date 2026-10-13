const https = require('https');
const fs = require('fs');

const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent('LifeQR Smart Card') + '&tl=en-IN&client=tw-ob';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  console.log('Status:', res.statusCode);
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log('Buffer length:', buf.length);
    fs.writeFileSync('test_audio.mp3', buf);
  });
}).on('error', (e) => console.error('Error:', e));
