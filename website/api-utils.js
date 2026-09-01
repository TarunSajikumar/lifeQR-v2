// API utilities for frontend pages
(function() {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '');
  const port = typeof window !== 'undefined' ? window.location.port : '';
  // If running via Live Server (5500, 5501, 3000, etc.) or file://, redirect API requests to Express on port 5000
  if ((isLocal && port && port !== '5000') || (typeof window !== 'undefined' && window.location.protocol === 'file:')) {
    const host = window.location.hostname || 'localhost';
    window.API_URL = `http://${host}:5000/api/v1`;
  } else {
    window.API_URL = ((typeof window !== 'undefined' && window.location.origin) || '') + '/api/v1';
  }
})();

window.getApiUrl = function(endpoint) {
  let base = window.API_URL;
  if (!base) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '');
    const port = typeof window !== 'undefined' ? window.location.port : '';
    if ((isLocal && port && port !== '5000') || (typeof window !== 'undefined' && window.location.protocol === 'file:')) {
      const host = window.location.hostname || 'localhost';
      base = `http://${host}:5000/api/v1`;
    } else {
      base = ((typeof window !== 'undefined' && window.location.origin) || '') + '/api/v1';
    }
  }
  if (!endpoint) return base;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const cleanPath = endpoint.startsWith('/api/v1') ? endpoint.replace('/api/v1', '') : endpoint;
  return `${base}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

window.parseApiResponse = async function(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  const errorText = text ? text.trim() : `Server returned status ${response.status}`;
  throw new Error(errorText);
};

window.verifyToken = async function() {
  try {
    const response = await fetch(window.getApiUrl('/auth/verify'), {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const result = await window.parseApiResponse(response);
    if (result?.valid && result.user) {
      if (result.user.role) {
        localStorage.setItem('userRole', result.user.role);
      }
      if (result.user.name) {
        localStorage.setItem('userName', result.user.name);
      }
      if (result.user.id) {
        localStorage.setItem('userId', result.user.id);
      }
      return result.user;
    }
  } catch (error) {
    console.warn('Token verification failed:', error);
  }

  return null;
};

/**
 * Helper for authenticated fetch requests.
 * All requests use credentials: 'include' for httpOnly cookie auth.
 * Automatically resolves relative API URLs to the correct backend host.
 */
window.authFetch = function(url, options = {}) {
  const fullUrl = window.getApiUrl(url);
  return fetch(fullUrl, {
    ...options,
    credentials: 'include'
  });
};

// Development Live Reloading Listener
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  (function() {
    let sseSource = null;
    function connectSSE() {
      if (sseSource) return;
      try {
        const sseUrl = (window.API_URL || '/api/v1') + '/dev-live-reload';
        sseSource = new EventSource(sseUrl);
        sseSource.onmessage = function(e) {
          console.log('[Dev Live Reload] File changed:', e.data, '- Reloading page...');
          window.location.reload();
        };
        sseSource.onerror = function() {
          if (sseSource) {
            sseSource.close();
            sseSource = null;
          }
          // Retry connection after 3 seconds
          setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        // Suppress live reload init errors
      }
    }
    // Start listening on DOM loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', connectSSE);
    } else {
      connectSSE();
    }
  })();
}
