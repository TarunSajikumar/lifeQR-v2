const http = require('http');

http.get('http://localhost:5000/website/cinematic-video.html', (res) => {
  console.log('HTTP 5000 STATUS:', res.statusCode);
  process.exit(0);
}).on('error', (e) => {
  console.error('PORT 5000 ERROR:', e.message);
  process.exit(1);
});
