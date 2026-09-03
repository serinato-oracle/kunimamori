(function (app) {
  "use strict";

  function init() {
    const TRANSITION_DURATION = 1450;
    const views = {
      selection: document.querySelector("#draw-selection"),
      oneCard: document.querySelector("#one-card-reading"),
      threeCardShuffle: document.querySelector("#three-card-shuffle"),
      threeCard: document.querySelector("#three-card-reading"),
      daily: document.querySelector("#daily-oracle"),
      history: document.querySelector("#oracle-history"),
    };
    let transitionTimer = 0;

    function playViewTransition(view) {
      window.clearTimeout(transitionTimer);
      document.querySelectorAll(".view.is-scene-entering").forEach((section) => section.classList.remove("is-scene-entering"));
      view.classList.remove("is-scene-entering");
      void view.offsetWidth;
      view.classList.add("is-scene-entering");
      transitionTimer = window.setTimeout(() => view.classList.remove("is-scene-entering"), TRANSITION_DURATION);
    }

    function showView(view) {
      Object.values(views).forEach((section) => {
        section.hidden = section !== view;
      });
      document.body.classList.toggle("is-three-card-view", view === views.threeCard || view === views.threeCardShuffle);
      document.body.classList.toggle("is-long-view", view === views.daily || view === views.history);
      document.body.classList.toggle("is-home-view", view === views.selection);
      document.querySelector("#global-home").hidden = view === views.selection;
      playViewTransition(view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelector("#choose-one").addEventListener("click", () => {
      app.analytics.track("single_draw_start");
      showView(views.threeCardShuffle);
      app.threeCardShuffle.start({ mode: "one", count: 1 });
    });
    document.querySelector("#choose-three").addEventListener("click", () => {
      app.analytics.track("three_draw_start");
      showView(views.threeCardShuffle);
      app.threeCardShuffle.start({ mode: "three", count: 3 });
    });
    document.querySelector("#choose-daily").addEventListener("click", () => {
      app.analytics.track("daily_draw");
      if (app.dailyOracle) app.dailyOracle.refresh();
      if (app.dailyOracle && app.dailyOracle.hasToday()) {
        showView(views.daily);
      } else {
        showView(views.threeCardShuffle);
        app.threeCardShuffle.start({ mode: "daily", count: 1 });
      }
    });
    document.querySelector("#choose-history").addEventListener("click", () => {
      app.analytics.track("history_view");
      if (app.history) app.history.render();
      showView(views.history);
    });
    document.querySelector("#one-card-return").addEventListener("click", () => showView(views.selection));
    document.querySelector("#return-to-selection").addEventListener("click", () => showView(views.selection));
    document.querySelector("#shuffle-return").addEventListener("click", () => showView(views.selection));
    document.querySelector("#daily-return").addEventListener("click", () => showView(views.selection));
    document.querySelector("#history-return").addEventListener("click", () => showView(views.selection));
    document.querySelector("#global-home").addEventListener("click", () => showView(views.selection));

    app.navigation = { showView, views };
    document.body.classList.add("is-home-view");
  }

  app.navigationModule = { init };
})(window.Kunimamori);
