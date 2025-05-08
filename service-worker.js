const CACHE_NAME = 'ml-transport-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/finance.html',
  // ... autres pages HTML
  '/css/style.css',
  '/js/app.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/phosphor-icons'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Stratégie avancée
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 1. Ne pas mettre en cache les requêtes API
  if (requestUrl.pathname.startsWith('/api/')) {
    return fetch(event.request)
      .then(response => {
        // Stocker les données pour sync hors ligne
        if (response.ok) storeForSync(event.request.clone(), response.clone());
        return response;
      })
      .catch(() => {
        // Retourner les données stockées si hors ligne
        return getStoredData(event.request);
      });
  }

  // 2. Gestion des CDN
  if (CDN_ASSETS.some(url => event.request.url.includes(url))) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetchAndCache(event.request))
    );
    return;
  }

  // 3. Stratégie par défaut: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Si en ligne, mettre à jour le cache
        if (navigator.onLine && !cached) {
          return fetchAndCache(event.request);
        }
        return cached || fetch(event.request);
      })
  );
});

// Helper functions
async function fetchAndCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || Promise.reject('No cache available');
  }
}

// Pour la synchronisation hors ligne
function storeForSync(request, response) {
  // Implémentez IndexedDB pour stocker les données
}

function getStoredData(request) {
  // Récupérer depuis IndexedDB
}
