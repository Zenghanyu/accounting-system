const CACHE_NAME = 'hajimi-v2.0.1';  // 更新版本号以清除旧缓存
const urlsToCache = [
  '/accounting-system/',
  '/accounting-system/index.html',
  '/accounting-system/app.js',
  '/accounting-system/style.css',
  '/accounting-system/manifest.json',
  '/accounting-system/icon-192.png',
  '/accounting-system/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存文件中...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('缓存文件失败:', err);
      })
  );
  // 强制激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有页面
  return self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 跳过非GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过API请求（DeepSeek等）
  if (event.request.url.includes('api.deepseek.com') ||
      event.request.url.includes('exchangerate-api.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，返回缓存的资源
        if (response) {
          return response;
        }

        // 缓存未命中，发起网络请求
        return fetch(event.request).then(response => {
          // 检查是否是有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          // 将响应添加到缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(err => {
          console.error('网络请求失败:', err);
          // 可以返回一个离线页面
          return new Response('网络连接失败，请检查您的网络设置', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
