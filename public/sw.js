// Service Worker for SocialVerse PWA
// Handles caching, offline support, and background sync

const CACHE_NAME = 'socialverse-v1';
const RUNTIME_CACHE = 'socialverse-runtime-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[Service Worker] Activation failed:', error);
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests (network first, fallback to cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets (cache first, fallback to network)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle HTML pages (network first, fallback to offline page)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, '/offline.html'));
    return;
  }

  // Default: network first
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 * Best for: static assets, images, fonts
 */
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        console.log('[Service Worker] Cache hit:', request.url);
        return response;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response
          caches.open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            })
            .catch((error) => {
              console.error('[Service Worker] Cache put failed:', error);
            });

          return response;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          // Return offline page for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
          throw error;
        });
    });
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 * Best for: API calls, dynamic content
 */
function networkFirstStrategy(request, fallbackUrl = null) {
  return fetch(request)
    .then((response) => {
      // Don't cache non-successful responses
      if (!response || response.status !== 200) {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();

      // Cache the response
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          cache.put(request, responseToCache);
        })
        .catch((error) => {
          console.error('[Service Worker] Cache put failed:', error);
        });

      return response;
    })
    .catch((error) => {
      console.error('[Service Worker] Network request failed:', error);

      // Try to return cached response
      return caches.match(request)
        .then((response) => {
          if (response) {
            console.log('[Service Worker] Returning cached response:', request.url);
            return response;
          }

          // Return fallback page if provided
          if (fallbackUrl) {
            return caches.match(fallbackUrl);
          }

          throw error;
        });
    });
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.ico'
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE)
      .then(() => {
        console.log('[Service Worker] Runtime cache cleared');
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('[Service Worker] Cache clear failed:', error);
        event.ports[0].postMessage({ success: false, error });
      });
  }
});

/**
 * Background Sync for offline actions
 * (Optional: implement if you need offline form submissions)
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

/**
 * Sync pending posts
 */
async function syncPosts() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    const postRequests = requests.filter((req) =>
      req.url.includes('/api/posts') && req.method === 'POST'
    );

    for (const request of postRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[Service Worker] Post sync failed:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync posts error:', error);
  }
}

/**
 * Sync pending messages
 */
async function syncMessages() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    const messageRequests = requests.filter((req) =>
      req.url.includes('/api/messages') && req.method === 'POST'
    );

    for (const request of messageRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[Service Worker] Message sync failed:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync messages error:', error);
  }
}

/**
 * Push notification handler
 * (Optional: implement if you need push notifications)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'notification',
    requireInteraction: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SocialVerse', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab with the target URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[Service Worker] Loaded and ready');
