// public/sw.js
const CACHE_NAME = 'socialverse-v1.0.0'
const STATIC_CACHE = 'socialverse-static-v1.0.0'
const DYNAMIC_CACHE = 'socialverse-dynamic-v1.0.0'
const IMAGE_CACHE = 'socialverse-images-v1.0.0'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS and JS files
]

// Runtime caching strategies
const CACHE_STRATEGIES = {
  images: {
    cacheName: IMAGE_CACHE,
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  api: {
    cacheName: DYNAMIC_CACHE,
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  streams: {
    cacheName: 'socialverse-streams-v1.0.0',
    maxEntries: 10,
    maxAgeSeconds: 60, // 1 minute for live content
  }
}

let deviceInfo = null
let optimizationSettings = null

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE &&
                !cacheName.includes('socialverse-streams')) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStreamRequest(request)) {
    event.respondWith(handleStreamRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else {
    event.respondWith(handleNavigationRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for critical API calls
    if (request.url.includes('/api/streams/') || request.url.includes('/api/user/')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline',
        message: 'This feature requires an internet connection'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache the image with size optimization for mobile
      const responseClone = networkResponse.clone()
      
      if (deviceInfo?.isMobile || deviceInfo?.isLowEnd) {
        // For mobile devices, we might want to compress images
        // This is a simplified example - in practice, you'd use a more sophisticated approach
        await cache.put(request, responseClone)
      } else {
        await cache.put(request, responseClone)
      }
      
      // Clean up old cache entries
      await cleanupCache(IMAGE_CACHE, CACHE_STRATEGIES.images.maxEntries)
    }
    
    return networkResponse
  } catch (error) {
    // Return placeholder image for offline
    return new Response(
      '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

// Handle stream requests with special caching strategy
async function handleStreamRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.streams.cacheName)
  
  // For live streams, always try network first
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache stream metadata but not the actual video content
      if (request.url.includes('playlist.m3u8') || request.url.includes('metadata')) {
        const responseClone = networkResponse.clone()
        await cache.put(request, responseClone)
        
        // Short-lived cache for live content
        setTimeout(() => {
          cache.delete(request)
        }, CACHE_STRATEGIES.streams.maxAgeSeconds * 1000)
      }
    }
    
    return networkResponse
  } catch (error) {
    // For offline, return cached metadata if available
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline stream message
    if (request.url.includes('playlist.m3u8')) {
      return new Response('', {
        status: 503,
        statusText: 'Stream unavailable offline'
      })
    }
    
    throw error
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    // Return offline page
    const cache = await caches.open(STATIC_CACHE)
    const offlinePage = await cache.match('/offline.html')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Utility functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname)
}

function isStreamRequest(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/streams/') || 
         url.pathname.includes('.m3u8') ||
         url.pathname.includes('.ts') ||
         url.pathname.includes('/hls/')
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.startsWith('/_nuxt/') ||
         url.pathname.startsWith('/icons/')
}

// Cache cleanup
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle queued actions when back online
  const cache = await caches.open(DYNAMIC_CACHE)
  const queuedActions = await getQueuedActions()
  
  for (const action of queuedActions) {
    try {
      await fetch(action.url, action.options)
      await removeQueuedAction(action.id)
    } catch (error) {
      console.log('Background sync failed for action:', action.id)
    }
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'DEVICE_INFO':
      deviceInfo = data.deviceInfo
      optimizationSettings = data.optimizationSettings
      console.log('Device info updated in SW:', deviceInfo)
      break
      
    case 'CACHE_STREAM':
      cacheStreamData(data.streamId, data.streamData)
      break
      
    case 'CLEAR_CACHE':
      clearSpecificCache(data.cacheType)
      break
      
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

// Cache stream data for offline viewing
async function cacheStreamData(streamId, streamData) {
  const cache = await caches.open(CACHE_STRATEGIES.streams.cacheName)
  
  const streamInfo = {
    id: streamId,
    title: streamData.title,
    streamerName: streamData.streamerName,
    thumbnail: streamData.thumbnail,
    cachedAt: Date.now()
  }
  
  const response = new Response(JSON.stringify(streamInfo), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  await cache.put(`/offline-stream/${streamId}`, response)
}

// Clear specific cache type
async function clearSpecificCache(cacheType) {
  switch (cacheType) {
    case 'images':
      await caches.delete(IMAGE_CACHE)
      break
    case 'streams':
      await caches.delete(CACHE_STRATEGIES.streams.cacheName)
      break
    case 'all':
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      break
  }
}

// Placeholder functions for queued actions (implement based on your needs)
async function getQueuedActions() {
  // Retrieve queued actions from IndexedDB or localStorage
  return []
}

async function removeQueuedAction(actionId) {
  // Remove completed action from queue
}

console.log('Service Worker loaded')
