const CACHE = 'p99-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase') || e.request.url.includes('fonts.goog') || e.request.url.includes('cdnjs')) return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var network = fetch(e.request).then(function(res) {
        if (res.ok) {
          caches.open(CACHE).then(function(c) { c.put(e.request, res.clone()); });
        }
        return res;
      }).catch(function() { return cached; });
      return cached || network;
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : { title: 'Project99', body: 'Nueva notificación' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || './'));
});
