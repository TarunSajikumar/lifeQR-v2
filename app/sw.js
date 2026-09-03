const CACHE_NAME = 'lifeqr-swiss-v4';
const ASSETS_TO_CACHE = [
  '/styles.css',
  '/LifeQR.png',
  '/lifeqr_transparent.png',
  '/api-utils.js',
  '/js/toast.js',
  '/js/auth-guard.js'
];

// Simple helper to store SOS requests in IndexedDB for Background Sync
async function enqueueSOSRequest(request) {
  const body = await request.json();
  const db = await openDB();
  const tx = db.transaction('sos-queue', 'readwrite');
  const store = tx.objectStore('sos-queue');
  await store.add({ body, timestamp: Date.now() });

  if ('sync' in self.registration) {
    await self.registration.sync.register('sos-sync');
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lifeqr-offline', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sos-queue')) {
        db.createObjectStore('sos-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-sync') {
    event.waitUntil(processSOSQueue());
  }
});

async function processSOSQueue() {
  const db = await openDB();
  const tx = db.transaction('sos-queue', 'readwrite');
  const store = tx.objectStore('sos-queue');
  const requests = await store.getAll();

  for (const reqData of requests) {
    try {
      const response = await fetch('/api/v1/sos/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData.body)
      });
      if (response.ok) {
        const delTx = db.transaction('sos-queue', 'readwrite');
        await delTx.objectStore('sos-queue').delete(reqData.id);
      }
    } catch (err) {
      console.error('Failed to sync SOS request:', err);
    }
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Background Sync for SOS alerts
  if (requestUrl.pathname === '/api/v1/sos/sos' && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request.clone()).catch((error) => {
        return enqueueSOSRequest(event.request.clone()).then(() => {
          return new Response(JSON.stringify({
            message: 'You are currently offline. SOS will be sent automatically once connection is restored.',
            offline: true
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // Network-First for all HTML navigation requests to prevent stale landing page / dashboard caches
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Exclude all API requests from general caching
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
