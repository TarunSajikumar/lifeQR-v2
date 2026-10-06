const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Find active non-internal IPv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function normalizeUrl(url = '') {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }
  return `https://${trimmed}`;
}

function isPrivateIp(ip) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
}

function getFrontendUrl(req) {
  // If a production cloud host is specified
  if (process.env.RENDER_EXTERNAL_URL) {
    return normalizeUrl(process.env.RENDER_EXTERNAL_URL);
  }

  // If request has host header, check if it's a usable non-localhost host
  if (req && req.headers && req.headers.host) {
    const reqHost = req.headers.host;
    const hostname = reqHost.split(':')[0];
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      return `${proto}://${reqHost}`;
    }
  }

  const port = process.env.PORT || 5000;
  const localIp = getLocalIpAddress();

  const envUrl = process.env.FRONTEND_URL;
  if (envUrl) {
    const normalized = normalizeUrl(envUrl);
    try {
      const parsed = new URL(normalized);
      // If FRONTEND_URL is localhost or an outdated private IP, prefer the active LAN IP
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return `http://${localIp}:${parsed.port || port}`;
      }
      if (isPrivateIp(parsed.hostname) && parsed.hostname !== localIp && localIp !== 'localhost') {
        return `http://${localIp}:${parsed.port || port}`;
      }
      return normalized;
    } catch (e) {
      return normalized;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return `https://${localIp}:${port}`;
  }

  return `http://${localIp}:${port}`;
}

function isSecureUrl(url) {
  return /^https:\/\//i.test(url);
}

module.exports = {
  getFrontendUrl,
  getLocalIpAddress,
  isSecureUrl
};

