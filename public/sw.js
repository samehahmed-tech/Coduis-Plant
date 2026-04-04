/// <reference lib="webworker" />

// RestoFlow ERP — Service Worker
// Provides offline caching, background sync, and push notification support

const CACHE_VERSION = 'restoflow-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/manifest.json',
    '/logo.png',
];

// API routes that should use cache-first strategy (rarely changing data)
const CACHE_FIRST_API = [
    '/api/menu/full',
    '/api/menu/categories',
    '/api/settings',
    '/api/branches',
];

// API routes that should NEVER be cached
const NEVER_CACHE_API = [
    '/api/auth',
    '/api/orders',
    '/api/shifts',
    '/api/health',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith('restoflow-') && key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip WebSocket / socket.io
    if (url.pathname.startsWith('/socket.io')) return;

    // API requests
    if (url.pathname.startsWith('/api/')) {
        // Never cache sensitive/realtime endpoints
        if (NEVER_CACHE_API.some((p) => url.pathname.startsWith(p))) return;

        // Stale-while-revalidate for cacheable API routes
        if (CACHE_FIRST_API.some((p) => url.pathname.startsWith(p))) {
            event.respondWith(
                caches.open(API_CACHE).then(async (cache) => {
                    const cachedResponse = await cache.match(event.request);
                    const networkPromise = fetch(event.request)
                        .then((response) => {
                            if (response.ok) {
                                cache.put(event.request, response.clone());
                            }
                            return response;
                        })
                        .catch(() => cachedResponse);

                    return cachedResponse || networkPromise;
                })
            );
            return;
        }

        // All other API: network-first, fallback to cache
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncPendingOrders());
    }
});

async function syncPendingOrders() {
    // This will be called when connectivity returns.
    // The actual sync logic is in the frontend's offlineSyncService.
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_ORDERS' });
    });
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'RestoFlow';
    const options = {
        body: data.body || 'New notification',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: data.tag || 'restoflow-notification',
        data: data.url || '/',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            const url = event.notification.data || '/';
            for (const client of clients) {
                if (client.url === url && 'focus' in client) return client.focus();
            }
            return self.clients.openWindow(url);
        })
    );
});
