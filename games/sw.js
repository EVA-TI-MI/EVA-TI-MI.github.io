// Service Worker - 霓虹贪吃蛇 PWA
const CACHE_NAME = 'neon-snake-v2';
const ASSETS = [
  './',
  './index.html',
  './snake.html',
  './biquge.html',
  './novels_data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装：缓存核心资源
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 请求策略：缓存优先，网络回退
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // 缓存同源新资源
        if (response.ok && new URL(e.request.url).origin === location.origin) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
    })
  );
});
