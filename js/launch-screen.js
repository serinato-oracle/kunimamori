(function () {
  "use strict";

  const screen = document.querySelector("#launch-screen");
  if (!screen) return;

  function dismiss() {
    screen.classList.add("is-leaving");
    window.setTimeout(() => screen.remove(), 520);
  }

  if (document.readyState === "complete") {
    window.setTimeout(dismiss, 720);
  } else {
    window.addEventListener("load", () => window.setTimeout(dismiss, 720), { once: true });
  }
})();
