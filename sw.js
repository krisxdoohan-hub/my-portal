const CACHE_NAME = 'portal-cache-v1.3.0';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. 安裝階段：將核心檔案存入快取保險箱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('已成功開啟快取空間');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
    // 強制立即接管控制權，不等待舊版關閉
    self.skipWaiting();
});

// 2. 啟動階段：清理舊版本快取，確保系統為最新狀態
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('清除舊版快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. 攔截請求階段：採用「網路優先，快取備用」策略
self.addEventListener('fetch', (event) => {
    // 略過非 GET 請求與外部擴充套件請求
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .catch(() => {
                // 如果網路斷線或 GitHub 伺服器無回應，則提供本地快取版本
                console.log('網路無回應，已啟用離線快取模式提供服務');
                return caches.match(event.request);
            })
    );
});
