/*
 * Service worker minimal (FR-22, AC-22.2). Tujuannya hanya agar situs bisa dipasang dan
 * menampilkan halaman offline yang jelas. Data listing TIDAK di-cache, supaya status buku
 * (dipesan/selesai) tidak pernah basi.
 */
const OFFLINE_HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — thriftbook.</title>
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:#1b1b2f}
main{max-width:360px}h1{color:#1a0b7a;font-size:1.4rem}button{min-height:44px;border-radius:999px;border:0;background:#fdd94e;color:#1a0b7a;font-weight:600;padding:0 24px}</style>
</head><body><main><h1>Kamu lagi offline.</h1><p>Halaman ini butuh internet. Cek sinyalmu, lalu coba lagi.</p>
<button onclick="location.reload()">Coba lagi</button></main></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return; // hanya navigasi halaman
  event.respondWith(
    fetch(req).catch(
      () => new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
