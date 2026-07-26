// Service worker: ให้แอปเปิดใช้งานได้แม้ไม่มีอินเทอร์เน็ต
const CACHE = 'money-tracker-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // หน้าเว็บหลัก: ลองโหลดจากเน็ตก่อน (จะได้เวอร์ชันใหม่เสมอ) ถ้าออฟไลน์ค่อยใช้แคช
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ไฟล์อื่น ๆ (ไอคอน ฟอนต์): ใช้แคชก่อน ถ้าไม่มีค่อยโหลดจากเน็ตแล้วเก็บแคชไว้
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
    )
  );
});
