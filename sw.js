// 離線快取：裝成 App 之後沒網路也能玩。
// 程式與頁面先問網路（一更新就拿到新版），網路不通或太慢才用快取；
// 圖片、音樂、字型先拿快取（開得快），背景順便更新，下次開就是新的。
const CACHE = 'undead-frenzy-v1';
// 手機訊號差時網路請求可能卡很久；有快取可用時最多等這麼久就先用快取
const NET_TIMEOUT_MS = 3000;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const CODE_EXT = /\.(js|css|html|webmanifest)$/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

// 第一次開的時候 Service Worker 還沒接手，頁面載過的檔案由頁面把清單傳過來補進快取
self.addEventListener('message', e => {
    if (e.data && e.data.type === 'precache') e.waitUntil(precache(e.data.urls));
});
async function precache(urls) {
    const cache = await caches.open(CACHE);
    for (const url of urls) {
        if (!cacheable(new URL(url)) || await cache.match(url)) continue;
        try {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res);
        } catch (e) { }
    }
}

function cacheable(url) {
    return url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname);
}

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (!cacheable(url)) return;
    if (req.headers.has('range')) { e.respondWith(rangeFromCache(req)); return; }
    const isCode = req.mode === 'navigate' || url.origin === self.location.origin && (url.pathname.endsWith('/') || CODE_EXT.test(url.pathname));
    e.respondWith(isCode ? networkFirst(req) : staleWhileRevalidate(req));
});

async function networkFirst(req) {
    const cache = await caches.open(CACHE);
    const net = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
    });
    const cached = await cache.match(req, { ignoreSearch: true });
    if (!cached) return net;
    const slow = new Promise(resolve => setTimeout(() => resolve(cached), NET_TIMEOUT_MS));
    return Promise.race([net.catch(() => cached), slow]);
}

async function staleWhileRevalidate(req) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
    });
    if (cached) { net.catch(() => { }); return cached; }
    return net;
}

// 背景音樂用 <audio> 播，瀏覽器會分段要（Range）；快取裡有整首時從裡面切出那一段
async function rangeFromCache(req) {
    const cached = await caches.match(req.url);
    if (!cached) return fetch(req);
    const blob = await cached.blob();
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range'));
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? Math.min(parseInt(m[2], 10), blob.size - 1) : blob.size - 1;
    if (start >= blob.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
    return new Response(blob.slice(start, end + 1), {
        status: 206,
        headers: {
            'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
            'Content-Range': `bytes ${start}-${end}/${blob.size}`,
            'Content-Length': String(end - start + 1),
        },
    });
}
