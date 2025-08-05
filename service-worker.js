// Service Worker 版本
const CACHE_VERSION = 'bloom-diary-v1';

// 需要缓存的静态资源列表
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/dark-mode.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/timer.js',
    '/js/tasks.js',
    '/js/statistics.js',
    '/js/notifications.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
    '/img/icons/icon-192x192.png'
];

// 安装Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker 安装中...');
    
    // 预缓存静态资源
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('缓存静态资源中...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                // 强制激活，无需等待旧的Service Worker终止
                return self.skipWaiting();
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker 已激活');
    
    // 清理旧的缓存
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_VERSION) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 立即接管所有客户端
            return self.clients.claim();
        })
    );
});

// 处理网络请求
self.addEventListener('fetch', event => {
    // 网络优先策略
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 请求成功，将响应复制一份并存入缓存
                const clonedResponse = response.clone();
                
                caches.open(CACHE_VERSION).then(cache => {
                    // 只缓存成功的请求
                    if (response.status === 200) {
                        cache.put(event.request, clonedResponse);
                    }
                });
                
                return response;
            })
            .catch(() => {
                // 网络请求失败，尝试从缓存中获取
                console.log('网络请求失败，从缓存获取:', event.request.url);
                return caches.match(event.request);
            })
    );
});

// 处理推送通知
self.addEventListener('push', event => {
    if (!event.data) return;
    
    // 解析推送消息
    const data = event.data.json();
    
    // 显示通知
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/img/icons/icon-192x192.png',
            badge: '/img/icons/icon-72x72.png',
            data: data.url ? { url: data.url } : null
        })
    );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    // 如果通知包含URL数据，则打开该URL
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
        return;
    }
    
    // 默认行为：聚焦已打开的窗口或打开新窗口
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                if (clientList.length > 0) {
                    let client = clientList[0];
                    
                    // 尝试查找已打开的窗口
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].focused) {
                            client = clientList[i];
                            break;
                        }
                    }
                    
                    return client.focus();
                }
                
                // 如果没有打开的窗口，则打开新窗口
                return clients.openWindow('/');
            })
    );
});