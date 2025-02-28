// Name of the cache with versioning for easy updates
const CACHE_NAME = 'calorie-grid-v1-2025-02-28';

// List of files to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event: Cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('Caching app shell and assets');
        return cache.addAll(ASSETS_TO_CACHE);
      }),
      self.skipWaiting(), // Forces the waiting service worker to become the active service worker
    ])
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      ),
      // Force clients to use the latest version
      self.clients.claim()
    ])
  );
});

// Fetch event: Serve cached content when offline with improved asset handling
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Identify common asset types that benefit from the cache-first strategy
  const isImage = requestUrl.pathname.endsWith('.png') || 
                  requestUrl.pathname.endsWith('.jpg') || 
                  requestUrl.pathname.endsWith('.svg');
  const isStyle = requestUrl.pathname.endsWith('.css');
  const isScript = requestUrl.pathname.endsWith('.js');
  const isFont = requestUrl.pathname.endsWith('.ttf') || 
                 requestUrl.pathname.endsWith('.woff') || 
                 requestUrl.pathname.endsWith('.woff2');
  
  // For assets, use cache-first strategy with network fallback and update
  if (isImage || isStyle || isScript || isFont) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Cache-first: Return from cache if available
          if (cachedResponse) {
            // Fetch in the background to update cache for next time
            fetch(event.request).then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(error => {
              console.log('Background fetch failed:', error);
            });
            
            return cachedResponse;
          }
          
          // Not in cache, fetch from network and cache it
          return fetch(event.request).then(networkResponse => {
            // If valid response, clone it and store in cache
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For other requests (API calls, etc.), try network first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If this is a navigation request (HTML document),
          // add it to the cache for offline access
          if (event.request.mode === 'navigate') {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If the request is for the main page and it's not in cache, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            // Otherwise return a 404 or some error indication
            return new Response('Network error happened', {
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
  }
});

// Optional: Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Calorie Grid', options)
    );
  }
});

// Optional: Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});