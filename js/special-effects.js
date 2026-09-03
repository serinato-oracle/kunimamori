(function (app) {
  "use strict";

  const SPECIAL_MIN = 41;
  const SPECIAL_MAX = 48;
  const EFFECT_DURATION = 2800;

  let overlay;
  let cleanupTimer;
  const cardCleanupTimers = new WeakMap();

  function isSpecialOracle(card) {
    const number = Number.parseInt(card.number, 10);
    return number >= SPECIAL_MIN && number <= SPECIAL_MAX;
  }

  function getOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "special-oracle";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<span class="special-oracle__label">SPECIAL ORACLE</span>';
    document.body.append(overlay);
    return overlay;
  }

  function resetEffect(cardElement, preserveOverlay) {
    window.clearTimeout(cardCleanupTimers.get(cardElement));
    cardElement.classList.remove("is-special-reveal");

    if (preserveOverlay) return;

    window.clearTimeout(cleanupTimer);
    document.body.classList.remove("is-special-active");
    if (overlay) overlay.classList.remove("is-active");
  }

  function beforeReveal(card, cardElement, options = {}) {
    resetEffect(cardElement, options.preserveOverlay);
    if (!isSpecialOracle(card)) return;

    const effect = getOverlay();

    // 同じSPECIALカードを続けて引いた場合も、演出を最初から再生します。
    effect.classList.remove("is-active");
    void effect.offsetWidth;
    document.body.classList.add("is-special-active");
    cardElement.classList.add("is-special-reveal");
    effect.classList.add("is-active");
  }

  function afterReveal(card, cardElement) {
    if (!isSpecialOracle(card)) return;

    const cardTimer = window.setTimeout(() => {
      cardElement.classList.remove("is-special-reveal");
    }, EFFECT_DURATION);
    cardCleanupTimers.set(cardElement, cardTimer);

    window.clearTimeout(cleanupTimer);
    cleanupTimer = window.setTimeout(() => {
      document.body.classList.remove("is-special-active");
      overlay.classList.remove("is-active");
    }, EFFECT_DURATION);
  }

  function resetAll(cardElements = []) {
    cardElements.forEach((cardElement) => {
      window.clearTimeout(cardCleanupTimers.get(cardElement));
      cardElement.classList.remove("is-special-reveal");
    });

    window.clearTimeout(cleanupTimer);
    document.body.classList.remove("is-special-active");
    if (overlay) overlay.classList.remove("is-active");
  }

  app.specialEffects = { beforeReveal, afterReveal, isSpecialOracle, resetAll };
})(window.Kunimamori);
