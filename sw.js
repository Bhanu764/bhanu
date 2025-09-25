const CACHE_NAME = 'smai-cache-v1';
const CORE = [
	'./',
	'index.html',
	'awareness.html',
	'report.html',
	'admin.html',
	'dashboard.html',
	'assets/css/styles.css',
	'assets/js/app.js',
	'assets/js/storage.js',
	'assets/js/ai.js',
	'assets/js/report.js',
	'assets/js/dashboard.js',
	'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if(req.method !== 'GET'){ return; }
	event.respondWith(
		caches.match(req).then((cached) => {
			if(cached){ return cached; }
			return fetch(req).then((res) => {
				const resToCache = res.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(req, resToCache));
				return res;
			}).catch(() => caches.match('index.html'));
		})
	);
});

