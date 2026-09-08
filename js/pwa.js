(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    if (hadController) {
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    navigator.serviceWorker.register("./service-worker.js?v=20260908-24", { scope: "./", updateViaCache: "none" })
      .then(function (registration) {
        return registration.update();
      })
      .catch(function (error) {
        console.warn("Service Worker registration failed:", error);
      });
  });
})();
