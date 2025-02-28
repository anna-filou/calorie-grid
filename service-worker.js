const CACHE_NAME = 'calorie-grid-v1.1'; // Increment cache version to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-128x128.png',
  '/icons/icon-256x256.png',
  '/icons/icon-any-256x256.png',
  '/icons/icon-512x512.png'
  // Add any other resources your app needs to function offline
];

// Pre-cache essential assets during installation
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Force waiting service worker to become active
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and content');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] All required resources have been cached');
      })
      .catch(error => {
        console.error('[Service Worker] Install error:', error);
      })
  );
});

// Clear old caches when a new service worker activates
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Claim all clients so the service worker is in control immediately
  event.waitUntil(clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and controlling page');
    })
  );
});

// Enhanced fetch event handler for better offline support
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetch event for', event.request.url);
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    console.log('[Service Worker] Skipping cross-origin request:', event.request.url);
    return;
  }
  
  // Handle navigation requests specially (for SPA)
  if (event.request.mode === 'navigate') {
    console.log('[Service Worker] Navigation request:', event.request.url);
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Navigation fetch failed, serving cached index');
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For all other requests, try the network first, but fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          console.log('[Service Worker] Not caching non-basic response for:', event.request.url);
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched resource
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('[Service Worker] Caching new resource:', event.request.url);
            cache.put(event.request, responseToCache);
          })
          .catch(error => {
            console.error('[Service Worker] Cache write error:', error);
          });

        return response;
      })
      .catch(() => {
        console.log('[Service Worker] Fetch failed, checking cache for:', event.request.url);
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('[Service Worker] Returning cached response for:', event.request.url);
              return cachedResponse;
            }
            
            console.log('[Service Worker] No cached response found for:', event.request.url);
            // For images or non-critical resources, you could return a fallback
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/icons/icon-any-256x256.png');
            }
            
            // Otherwise return nothing which will result in a network error
            return new Response('Network error occurred', {
              status: 408,
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});