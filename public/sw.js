// This is the service worker with Workbox manifest injection
const CACHE_NAME = "brocomp-v1";

// Workbox will inject the manifest here
const manifest = self.__WB_MANIFEST || [];

// Install event - cache assets from manifest
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app assets from manifest");
      // Cache URLs from the injected manifest
      const urlsToCache = manifest.map(entry => entry.url);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip requests to Supabase
  if (event.request.url.includes("supabase")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page if available
          return caches.match("/");
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-complaints") {
    event.waitUntil(syncComplaints());
  }
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

async function syncComplaints() {
  console.log("Syncing offline complaint drafts");
  // The actual sync logic is handled in the React app
  // This is just to trigger the sync event
}

async function syncMessages() {
  console.log("Syncing offline messages");
  // The actual sync logic is handled in the React app
}
