(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(function (error) {
      console.warn("Service Worker registration failed:", error);
    });
  });
})();
