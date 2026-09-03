(function (app) {
  "use strict";

  function init() {
    const cards = app.cards;
    const elements = {
      card: document.querySelector("#oracle-card"),
      stage: document.querySelector(".card-stage"),
      drawButton: document.querySelector("#draw-button"),
      buttonLabel: document.querySelector("#button-label"),
      prompt: document.querySelector("#prompt"),
      image: document.querySelector("#card-image"),
      name: document.querySelector("#card-name"),
      deity: document.querySelector("#card-deity"),
      message: document.querySelector("#card-message"),
      number: document.querySelector("#card-number"),
    };

    let currentIndex = -1;
    let hasDrawn = false;
    let currentCard = null;
    let isDrawing = false;

    function chooseRandomCard() {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * cards.length);
      } while (cards.length > 1 && nextIndex === currentIndex);

      currentIndex = nextIndex;
      return cards[nextIndex];
    }

    function updateCard(card) {
      const displayCard = app.i18n.translateCard(card);
      elements.image.src = card.image;
      elements.image.alt = app.i18n.getLanguage() === "en" ? `${displayCard.name} card image` : `${displayCard.name}のカード画像`;
      elements.name.textContent = displayCard.name;
      elements.deity.textContent = displayCard.deity || "";
      elements.deity.hidden = !displayCard.deity;
      elements.message.textContent = displayCard.message;
      elements.number.textContent = card.number;
    }

    async function prepareCardImage() {
      if (!elements.image.decode) return;
      try {
        await elements.image.decode();
      } catch (error) {
        // 画像がキャッシュ済みで decode が失敗しても表示は継続します。
      }
    }

    async function revealCard(preselectedCard) {
      if (cards.length === 0 || isDrawing) return;

      isDrawing = true;
      elements.drawButton.disabled = true;
      elements.buttonLabel.textContent = "カードを清めています…";

      if (hasDrawn) {
        elements.card.classList.remove("is-revealed");
      }

      const waitForBack = hasDrawn ? 720 : 120;
      await new Promise((resolve) => window.setTimeout(resolve, waitForBack));
      if (!preselectedCard) await app.shuffleEffects.play(elements.stage);

      currentCard = preselectedCard || chooseRandomCard();
      updateCard(currentCard);
      await prepareCardImage();
      app.specialEffects.beforeReveal(currentCard, elements.card);

      window.requestAnimationFrame(() => {
        elements.card.classList.add("is-revealed");
        hasDrawn = true;
        elements.buttonLabel.textContent = "もう一度引く";
        elements.prompt.textContent = "今のあなたへ届いた言葉";
        elements.drawButton.disabled = false;
        isDrawing = false;
        app.specialEffects.afterReveal(currentCard, elements.card);
      });
    }

    elements.drawButton.addEventListener("click", () => {
      app.navigation.showView(app.navigation.views.threeCardShuffle);
      app.threeCardShuffle.start({ mode: "one", count: 1 });
    });
    elements.card.setAttribute("role", "button");
    elements.card.setAttribute("tabindex", "0");
    elements.card.setAttribute("aria-label", "引いたカードを拡大表示");
    elements.card.addEventListener("click", () => {
      if (hasDrawn && currentCard && !isDrawing) app.cardModal.open(currentCard);
    });
    elements.card.addEventListener("keydown", (event) => {
      if (hasDrawn && currentCard && !isDrawing && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        app.cardModal.open(currentCard);
      }
    });

    if (cards.length === 0) {
      elements.drawButton.disabled = true;
      elements.buttonLabel.textContent = "カードを登録してください";
      elements.prompt.textContent = "新しいカードを準備しましょう";
    }

    window.addEventListener("kunimamori:languagechange", () => {
      if (currentCard) updateCard(currentCard);
      elements.card.setAttribute("aria-label", app.i18n.t("引いたカードを拡大表示"));
    });

    app.oneCard = {
      revealCard,
      revealSelectedCard(card) {
        return revealCard(card);
      },
    };
  }

  app.oneCardModule = { init };
})(window.Kunimamori);
