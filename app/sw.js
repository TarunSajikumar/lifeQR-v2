const CACHE_NAME = 'lifeqr-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app/patient_dashboard.html',
  '/app/CrewAmbulance_dashboard.html',
  '/app/emergency_access.html',
  '/app/er_dashboard.html',
  '/app/lifeqr_login.html',
  '/app/lifeqr_signup.html',
  '/styles.css',
  '/LifeQR.png',
  '/lifeqr_transparent.png',
  '/app/api-utils.js',
  '/app/js/toast.js',
  '/app/js/auth-guard.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap'
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Background Sync for SOS alerts
  if (requestUrl.pathname === '/api/v1/sos/sos' && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request.clone()).catch((error) => {
        // If offline, save to IndexedDB and register sync
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

  // Special handling for Patient Profile API to enable offline Medical ID viewing
  if (requestUrl.pathname === '/api/v1/patient-app/profile') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open('lifeqr-data-cache').then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Exclude other API requests from general asset caching to preserve security integrity
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
