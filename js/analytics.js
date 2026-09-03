(function (app) {
  "use strict";

  const MEASUREMENT_ID = "G-N23QK036WR";
  const ALLOWED_EVENTS = new Set([
    "single_draw_start",
    "single_draw_complete",
    "three_draw_start",
    "three_draw_complete",
    "daily_draw",
    "shuffle_start",
    "riffle_complete",
    "spread_start",
    "history_view",
  ]);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(script);

  function track(eventName) {
    if (!ALLOWED_EVENTS.has(eventName)) return;
    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName);
    } catch (_) {
      // 計測できない環境でも、アプリ本体の操作はそのまま継続します。
    }
  }

  app.analytics = { track };
})(window.Kunimamori = window.Kunimamori || {});
