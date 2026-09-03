(function (app) {
  "use strict";

  const DEFAULT_DURATION = 950;

  function play(target, duration = DEFAULT_DURATION) {
    target.classList.remove("is-shuffling");
    void target.offsetWidth;
    target.classList.add("is-shuffling");

    return new Promise((resolve) => {
      window.setTimeout(() => {
        target.classList.remove("is-shuffling");
        resolve();
      }, duration);
    });
  }

  app.shuffleEffects = { play };
})(window.Kunimamori);
