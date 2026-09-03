"use strict";

const CACHE_NAME = "kunimamori-pwa-20260903-2";

const CARD_IMAGES = Array.from({ length: 48 }, function (_, index) {
  return "./images/web/kuni-" + String(index + 1).padStart(2, "0") + ".jpg";
});

const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./style.css?v=20260903-2",
  "./terms/",
  "./privacy/",
  "./disclaimer/",
  "./copyright/",
  "./fonts/NotoSerifJP-Variable.ttf",
  "./fonts/ShipporiMincho-Medium.ttf",
  "./fonts/ShipporiMincho-SemiBold.ttf",
  "./images/icons/app-icon-32.png",
  "./images/icons/app-icon-120.png",
  "./images/icons/app-icon-152.png",
  "./images/icons/app-icon-167.png",
  "./images/icons/app-icon-180.png",
  "./images/icons/app-icon-192.png",
  "./images/icons/app-icon-512.png",
  "./images/icons/app-icon-1024.png",
  "./images/web/card-back.jpg",
  "./js/card-data.js",
  "./js/special-effects.js",
  "./js/shuffle-effects.js",
  "./js/card-modal.js",
  "./js/three-card-shuffle.js?v=20260831-11",
  "./js/navigation.js?v=20260831-15",
  "./js/one-card.js?v=20260831-17",
  "./js/three-card-reading-engine.js",
  "./js/three-card.js?v=20260831-17",
  "./js/daily-oracle.js?v=20260831-17",
  "./js/history.js",
  "./js/image-protection.js",
  "./js/app.js?v=20260831-10",
  "./js/launch-screen.js?v=20260831-16",
  "./js/pwa.js?v=20260903-1",
  ...CARD_IMAGES,
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) {
          return name.startsWith("kunimamori-pwa-") && name !== CACHE_NAME;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(new URL("./index.html", self.registration.scope).href);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(function (networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseCopy);
        });
        return networkResponse;
      });
    })
  );
});
