const CACHE_NAME = 'kheleko-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/image.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
        // Continue with installation even if caching fails
        // Try to cache individual files instead of all at once
        return caches.open(CACHE_NAME).then(cache => {
          const cachePromises = urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          );
          return Promise.allSettled(cachePromises);
        });
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  try {
    // Skip non-GET requests and non-http(s) requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
      return;
    }

    // Skip certain file types that shouldn't be cached
    const url = new URL(event.request.url);
    if (url.pathname.includes('.') && !url.pathname.endsWith('.html')) {
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          
          // Try to fetch from network
          return fetch(event.request).catch(fetchError => {
            console.error('Network fetch failed:', fetchError);
            
            // Check if this is a critical resource
            if (event.request.destination === 'document' || event.request.mode === 'navigate') {
              throw fetchError; // Re-throw to be caught by outer catch
            }
            
            // For non-critical resources, return a basic error response
            return new Response('Resource not available', {
              status: 404,
              statusText: 'Not Found',
              headers: { 
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache'
              }
            });
          });
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
          
          // Return offline page if both cache and network fail
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
              .catch(() => {
                // If even the offline page fails, return a basic HTML response
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Offline - Kheleko</title>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #333; }
                        p { color: #666; }
                      </style>
                    </head>
                    <body>
                      <h1>You're offline</h1>
                      <p>Please check your internet connection and try again.</p>
                      <p>Some features may not be available offline.</p>
                    </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
          }
          
          // For non-navigation requests, return a proper error response
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-cache'
            }
          });
        })
    );
  } catch (error) {
    console.error('Service Worker fetch event error:', error);
    // Return a basic error response if everything fails
    event.respondWith(
      new Response('Service Worker Error', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/plain' }
      })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      if (deletePromises.length > 0) {
        return Promise.allSettled(deletePromises);
      }
      return Promise.resolve();
    })
    .catch((error) => {
      console.error('Cache cleanup failed:', error);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    console.log('Background sync triggered');
    
    // You can implement specific sync logic here
    // For example, sync offline tournament registrations
    
    // Check if we have any offline data to sync
    const offlineData = await getOfflineData();
    if (offlineData && offlineData.length > 0) {
      console.log(`Found ${offlineData.length} offline items to sync`);
      // Implement your sync logic here
    }
    
  } catch (error) {
    console.error('Background sync failed:', error);
    // Re-throw to ensure the sync event is properly handled
    throw error;
  }
}

// Helper function to get offline data
async function getOfflineData() {
  try {
    // This is a placeholder - implement based on your app's needs
    // For example, check IndexedDB for offline tournament registrations
    return [];
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.warn('Failed to parse push data:', error);
  }

  const options = {
    body: notificationData.body || 'New notification from Kheleko',
    icon: '/image.png',
    badge: '/image.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...notificationData
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/image.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/image.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kheleko', options)
      .catch((error) => {
        console.error('Failed to show notification:', error);
      })
  );
});

// Message event handling for debugging
self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_NAME });
      }
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      });
    }
  } catch (error) {
    console.error('Message handling failed:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
        .catch((error) => {
          console.error('Failed to open window:', error);
          // Fallback: try to focus existing window
          return clients.matchAll().then(clients => {
            if (clients.length > 0) {
              return clients[0].focus();
            }
          });
        })
    );
  }
});
