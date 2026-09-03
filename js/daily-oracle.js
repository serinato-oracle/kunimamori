(function (app) {
  "use strict";

  const STORAGE_KEY = "kunimamori.dailyOracle.v1";

  function init() {
    const cardShell = document.querySelector("#daily-card");
    const drawButton = document.querySelector("#draw-daily-button");
    const drawLabel = document.querySelector("#draw-daily-label");
    const dateLabel = document.querySelector("#daily-date");
    const prompt = document.querySelector("#daily-prompt");
    const message = document.querySelector("#daily-card-message");
    const image = document.querySelector("#daily-card-image");
    const number = document.querySelector("#daily-card-number");
    const name = document.querySelector("#daily-card-name");
    const deity = document.querySelector("#daily-card-deity");
    let currentCard = null;
    let isDrawing = false;

    function getLocalDateKey() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function formatDate(date) {
      const [year, month, day] = date.split("-").map(Number);
      return `${year}年${month}月${day}日`;
    }

    function readToday() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        return null;
      }
    }

    function writeToday(date, card) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, cardNumber: card.number }));
      } catch (error) {
        // 保存領域が利用できない場合も、その場での表示は継続します。
      }
    }

    function findCard(cardNumber) {
      return app.cards.find((card) => String(card.number) === String(cardNumber));
    }

    function updateCard(card) {
      currentCard = card;
      image.src = card.image;
      image.alt = `${card.name}のカード画像`;
      number.textContent = card.number;
      name.textContent = card.name;
      deity.textContent = card.deity || "";
      message.textContent = card.message;
    }

    async function prepareCardImage() {
      if (!image.decode) return;
      try {
        await image.decode();
      } catch (error) {
        // 画像がキャッシュ済みで decode が失敗しても表示は継続します。
      }
    }

    async function showDrawnCard(card, animate) {
      updateCard(card);
      if (animate) await prepareCardImage();
      prompt.textContent = "今日のあなたへ届いた神託";
      drawButton.hidden = true;

      if (animate) {
        app.specialEffects.beforeReveal(card, cardShell);
        window.requestAnimationFrame(() => {
          cardShell.classList.add("is-revealed");
          app.specialEffects.afterReveal(card, cardShell);
        });
      } else {
        cardShell.classList.add("is-revealed");
      }
    }

    function refresh() {
      const today = getLocalDateKey();
      const saved = readToday();
      dateLabel.textContent = formatDate(today);

      if (saved && saved.date === today) {
        const savedCard = findCard(saved.cardNumber);
        if (savedCard) {
          showDrawnCard(savedCard, false);
          return;
        }
      }

      currentCard = null;
      cardShell.classList.remove("is-revealed", "is-special-reveal");
      prompt.textContent = "今日の神託は、まだ静かにあなたを待っています。";
      message.textContent = "";
      drawButton.hidden = false;
      drawButton.disabled = app.cards.length === 0;
      drawLabel.textContent = app.cards.length === 0 ? "カードを登録してください" : "今日の神託を受け取る";
    }

    function hasToday() {
      const saved = readToday();
      return Boolean(saved && saved.date === getLocalDateKey() && findCard(saved.cardNumber));
    }

    async function revealSelectedCard(card) {
      if (!card || isDrawing) return;
      const today = getLocalDateKey();
      isDrawing = true;
      writeToday(today, card);
      app.history.addEntry(today, card);
      await showDrawnCard(card, true);
      isDrawing = false;
    }

    async function drawToday() {
      if (isDrawing || app.cards.length === 0) return;

      const today = getLocalDateKey();
      const saved = readToday();
      if (saved && saved.date === today) {
        refresh();
        return;
      }

      isDrawing = true;
      drawButton.disabled = true;
      drawLabel.textContent = "カードを清めています…";
      await app.shuffleEffects.play(cardShell);
      const card = app.cards[Math.floor(Math.random() * app.cards.length)];
      writeToday(today, card);
      app.history.addEntry(today, card);
      await showDrawnCard(card, true);
      isDrawing = false;
    }

    drawButton.addEventListener("click", () => {
      app.navigation.showView(app.navigation.views.threeCardShuffle);
      app.threeCardShuffle.start({ mode: "daily", count: 1 });
    });
    cardShell.addEventListener("click", () => {
      if (currentCard) app.cardModal.open(currentCard);
    });
    cardShell.addEventListener("keydown", (event) => {
      if (currentCard && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        app.cardModal.open(currentCard);
      }
    });

    refresh();
    app.dailyOracle = { refresh, hasToday, revealSelectedCard, storageKey: STORAGE_KEY, getLocalDateKey };
  }

  app.dailyOracleModule = { init };
})(window.Kunimamori);
