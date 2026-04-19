const CACHE = 'p99-v5';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS).catch(function(){}); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // NEVER intercept external/API calls - only cache local app files
  if (
    e.request.method !== 'GET' ||
    url.includes('supabase.co') ||
    url.includes('supabase.io') ||
    url.includes('jsdelivr') ||
    url.includes('cloudflare') ||
    url.includes('fonts.goog') ||
    url.includes('fonts.gstatic') ||
    url.includes('xataka.com') ||
    url.includes('youtube.com') ||
    !url.includes(self.location.origin)
  ) { return; }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (res && res.ok) {
          caches.open(CACHE).then(function(c){ c.put(e.request, res.clone()); });
        }
        return res;
      });
    })
  );
});

self.addEventListener('push', function(e) {
  var data = {title:'Project99', body:'Nueva notificación'};
  try { if(e.data) data = e.data.json(); } catch(err){}
  e.waitUntil(self.registration.showNotification(data.title, {body:data.body, icon:'./icon-192.png', vibrate:[200,100,200], data:{url:'./'}}));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data||{}).url||'./'));
});
