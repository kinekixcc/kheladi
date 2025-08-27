const CACHE_NAME = 'kheleko-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/image.png',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
        // Continue with installation even if caching fails
        // Try to cache individual files instead of all at once
        return caches.open(CACHE_NAME).then(cache => {
          const cachePromises = urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ Failed to cache ${url}:`, err);
              return null;
            })
          );
          return Promise.allSettled(cachePromises);
        });
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  try {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests and non-http(s) requests
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
      return;
    }

    // Skip certain file types that shouldn't be cached
    if (url.pathname.includes('.') && !url.pathname.endsWith('.html')) {
      return;
    }

    // Skip API calls and external resources
    if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            console.log('✅ Serving from cache:', url.pathname);
            return response;
          }
          
          // Try to fetch from network
          return fetch(event.request)
            .then(networkResponse => {
              // Cache successful network responses
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(fetchError => {
              console.warn('⚠️ Network fetch failed for:', url.pathname, fetchError);
              
              // Check if this is a critical resource
              if (event.request.destination === 'document' || event.request.mode === 'navigate') {
                // For navigation requests, try to serve offline page
                return caches.match('/offline.html')
                  .then(offlinePage => {
                    if (offlinePage) {
                      console.log('✅ Serving offline page for:', url.pathname);
                      return offlinePage;
                    }
                    // Fallback to index.html if offline.html is not available
                    return caches.match('/index.html');
                  })
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
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
                            h1 { color: #1e293b; margin-bottom: 20px; }
                            p { color: #64748b; line-height: 1.6; }
                            .container { max-width: 500px; margin: 0 auto; }
                            .icon { font-size: 48px; margin-bottom: 20px; }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="icon">🏟️</div>
                            <h1>You're offline</h1>
                            <p>Please check your internet connection and try again.</p>
                            <p>Some features may not be available offline.</p>
                            <p><strong>Kheleko</strong> - Sports Tournament Management</p>
                          </div>
                        </body>
                      </html>
                    `, {
                      headers: { 'Content-Type': 'text/html' }
                    });
                  });
              }
              
              // For non-critical resources, return a basic error response
              return new Response('Resource not available offline', {
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
          console.error('❌ Fetch failed for:', url.pathname, error);
          
          // Return offline page if both cache and network fail
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html')
              .then(offlinePage => {
                if (offlinePage) {
                  console.log('✅ Serving offline page for error fallback');
                  return offlinePage;
                }
                // Fallback to index.html if offline.html is not available
                return caches.match('/index.html');
              })
              .catch(() => {
                // If even the offline page fails, return a basic HTML response
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Error - Kheleko</title>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
                        h1 { color: #dc2626; margin-bottom: 20px; }
                        p { color: #7f1d1d; line-height: 1.6; }
                        .container { max-width: 500px; margin: 0 auto; }
                        .icon { font-size: 48px; margin-bottom: 20px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="icon">⚠️</div>
                        <h1>Something went wrong</h1>
                        <p>We're having trouble loading this page.</p>
                        <p>Please try refreshing or check your connection.</p>
                        <p><strong>Kheleko</strong> - Sports Tournament Management</p>
                      </div>
                    </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
          }
          
          // For non-navigation requests, return a proper error response
          return new Response('Service temporarily unavailable', {
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
    console.error('❌ Service Worker fetch event error:', error);
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
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => {
          console.log('🗑️ Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      if (deletePromises.length > 0) {
        return Promise.allSettled(deletePromises);
      }
      return Promise.resolve();
    })
    .then(() => {
      console.log('✅ Service Worker activated successfully');
      // Take control of all clients immediately
      return self.clients.claim();
    })
    .catch((error) => {
      console.error('❌ Cache cleanup failed:', error);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    console.log('✅ Background sync started');
    
    // You can implement specific sync logic here
    // For example, sync offline tournament registrations
    
    // Check if we have any offline data to sync
    const offlineData = await getOfflineData();
    if (offlineData && offlineData.length > 0) {
      console.log(`📊 Found ${offlineData.length} offline items to sync`);
      // Implement your sync logic here
    }
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
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
    console.error('❌ Failed to get offline data:', error);
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
    console.warn('⚠️ Failed to parse push data:', error);
  }

  const options = {
    body: notificationData.body || 'New notification from Kheleko',
    icon: '/icon.svg',
    badge: '/icon.svg',
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
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kheleko', options)
      .then(() => {
        console.log('✅ Push notification shown successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to show notification:', error);
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
    console.error('❌ Message handling failed:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
        .then(() => {
          console.log('✅ Window opened successfully');
        })
        .catch((error) => {
          console.error('❌ Failed to open window:', error);
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
