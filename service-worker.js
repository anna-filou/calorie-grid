const CACHE_NAME = 'calorie-grid-v1.52'; // Change to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-32x32.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png',
  '/favicon.svg'
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

// Show notification requested by the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: '/icons/icon-256x256.png',
      badge: '/icons/icon-32x32.png',
      tag: 'meal-reminder',
      renotify: true,
      data: { url: '/' }
    });
  }
});

// Focus or open the app when a notification is tapped
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Background check for reminders (Chrome Android, installed PWA only)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkRemindersBackground());
  }
});

function formatTimeSW(timeStr) {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min} ${ampm}`;
}

async function checkRemindersBackground() {
  let reminders = [];
  try {
    const cache = await caches.open('reminders-v1');
    const response = await cache.match('/reminders-data');
    if (response) reminders = await response.json();
  } catch (e) {
    return;
  }
  if (!reminders.length) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  for (const reminder of reminders) {
    if (reminder.time === currentTime) {
      await self.registration.showNotification('Time to track your meal!', {
        body: `It's ${formatTimeSW(reminder.time)} — log what you ate in Calorie Grid.`,
        icon: '/icons/icon-256x256.png',
        badge: '/icons/icon-32x32.png',
        tag: `meal-reminder-${reminder.id}`,
        renotify: true,
        data: { url: '/' }
      });
    }
  }
}