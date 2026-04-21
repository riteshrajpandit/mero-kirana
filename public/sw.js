const CACHE_NAME = "mero-kirana-shell-v2";
const APP_SHELL = ["/manifest.webmanifest", "/favicon.ico"];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isRscRequest(request) {
  return request.headers.get("rsc") === "1";
}

function isPrefetchRequest(request) {
  return request.headers.get("next-router-prefetch") === "1";
}

function isNextInternalPath(pathname) {
  return pathname.startsWith("/_next/");
}

function isCacheableStaticRequest(request, requestUrl) {
  if (!isSameOrigin(requestUrl)) {
    return false;
  }

  if (request.mode === "navigate") {
    return false;
  }

  if (isNextInternalPath(requestUrl.pathname)) {
    return false;
  }

  const staticDestinations = new Set([
    "style",
    "script",
    "image",
    "font",
    "manifest",
  ]);

  if (staticDestinations.has(request.destination)) {
    return true;
  }

  return /\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|mjs|woff2?|ttf|eot|webmanifest|json)$/i.test(
    requestUrl.pathname,
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (!isSameOrigin(requestUrl)) {
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (isRscRequest(request) || isPrefetchRequest(request)) {
    return;
  }

  if (isNextInternalPath(requestUrl.pathname)) {
    return;
  }

  if (!isCacheableStaticRequest(request, requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            isSameOrigin(requestUrl)
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    }),
  );
});