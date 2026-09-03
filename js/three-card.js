(function (app) {
  "use strict";

  const REVEAL_INTERVAL = 650;
  const RESET_DELAY = 620;

  function init() {
    const cards = app.cards;
    const screen = document.querySelector("#three-card-reading");
    const slots = Array.from(screen.querySelectorAll(".three-card-slot"));
    const drawButton = document.querySelector("#draw-three-button");
    const drawLabel = document.querySelector("#draw-three-label");
    const insight = document.querySelector("#three-card-insight");
    const integratedMessage = document.querySelector("#integrated-oracle-message");
    const actionList = document.querySelector("#today-action-list");
    const readingEngine = app.threeCardReadingEngine;
    let hasDrawn = false;
    let revealTimers = [];
    let revealedCards = [];
    let drawRun = 0;
    let isDrawing = false;

    function updateSlotAriaLabels() {
      slots.forEach((slot) => {
        const label = slot.querySelector("h3").textContent;
        slot.querySelector(".three-card-shell").setAttribute(
          "aria-label",
          app.i18n.getLanguage() === "en" ? `Enlarge the ${label} card` : `${label}のカードを拡大表示`,
        );
      });
    }

    function chooseThreeUniqueCards() {
      const shuffled = [...cards];

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
      }

      return shuffled.slice(0, 3);
    }

    function updateSlot(slot, card, index, roleReadings) {
      const displayCard = app.i18n.translateCard(card);
      const image = slot.querySelector(".three-card-image");
      image.src = card.image;
      image.alt = app.i18n.getLanguage() === "en" ? `${displayCard.name} card image` : `${displayCard.name}のカード画像`;
      slot.querySelector(".three-card-number").textContent = card.number;
      slot.querySelector(".three-card-name").textContent = displayCard.name;
      slot.querySelector(".three-card-deity").textContent = displayCard.deity || "";
      slot.querySelector(".three-card-message").textContent = displayCard.message;
      slot.querySelector(".three-card-interpretation").textContent = roleReadings[index];
    }

    async function prepareCardImages(selectedCards) {
      await Promise.all(selectedCards.map(async (card) => {
        const image = new Image();
        image.src = card.image;
        if (!image.decode) return;
        try {
          await image.decode();
        } catch (error) {
          // 読み込み済み画像などで decode が失敗しても表示は継続します。
        }
      }));
    }

    function updateInsight(selectedCards) {
      integratedMessage.textContent = readingEngine.generateIntegratedOracle(selectedCards);
      actionList.replaceChildren();
      readingEngine.generateTodayActions(selectedCards).forEach((action) => {
        const item = document.createElement("li");
        item.textContent = action;
        actionList.appendChild(item);
      });
      insight.hidden = false;
      window.requestAnimationFrame(() => insight.classList.add("is-visible"));
    }

    function resetSlots(cancelPending = true) {
      if (cancelPending) drawRun += 1;
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      revealTimers = [];
      app.specialEffects.resetAll(slots.map((slot) => slot.querySelector(".three-card-shell")));
      insight.classList.remove("is-visible");
      insight.hidden = true;
      slots.forEach((slot) => {
        slot.classList.remove("is-revealed");
        slot.querySelector(".three-card-shell").classList.remove("is-revealed", "is-special-reveal");
      });
    }

    async function revealThreeCards(preselectedCards) {
      if (cards.length < 3 || isDrawing) return;

      isDrawing = true;
      const activeRun = ++drawRun;
      drawButton.disabled = true;
      drawLabel.textContent = "カードを清めています…";
      resetSlots(false);
      const waitForBack = hasDrawn ? RESET_DELAY : 120;
      await new Promise((resolve) => window.setTimeout(resolve, waitForBack));
      if (activeRun !== drawRun) return;
      if (!Array.isArray(preselectedCards)) {
        await app.shuffleEffects.play(document.querySelector("#three-card-spread"));
        if (activeRun !== drawRun) return;
      }
      const selectedCards = Array.isArray(preselectedCards) ? preselectedCards.slice(0, 3) : chooseThreeUniqueCards();
      await prepareCardImages(selectedCards);
      if (activeRun !== drawRun) return;
      const displayCards = selectedCards.map((card) => app.i18n.translateCard(card));
      const roleReadings = readingEngine.generateRoleReadings(displayCards);
      revealedCards = selectedCards;

      selectedCards.forEach((card, index) => {
        const timer = window.setTimeout(() => {
          if (activeRun !== drawRun) return;
          const slot = slots[index];
          const shell = slot.querySelector(".three-card-shell");
          updateSlot(slot, card, index, roleReadings);
          app.specialEffects.beforeReveal(card, shell, { preserveOverlay: true });

          window.requestAnimationFrame(() => {
            slot.classList.add("is-revealed");
            shell.classList.add("is-revealed");
            app.specialEffects.afterReveal(card, shell);

            if (index === slots.length - 1) {
              hasDrawn = true;
              drawLabel.textContent = "もう一度3枚引く";
              drawButton.disabled = false;
              isDrawing = false;
              const insightTimer = window.setTimeout(() => {
                if (activeRun === drawRun) updateInsight(displayCards);
              }, 650);
              revealTimers.push(insightTimer);
            }
          });
        }, waitForBack + index * REVEAL_INTERVAL);

        revealTimers.push(timer);
      });
    }

    drawButton.addEventListener("click", () => {
      app.navigation.showView(app.navigation.views.threeCardShuffle);
      app.threeCardShuffle.start({ mode: "three", count: 3 });
    });
    document.querySelector("#return-to-selection").addEventListener("click", () => {
      isDrawing = false;
      resetSlots(true);
      drawButton.disabled = cards.length < 3;
      drawLabel.textContent = hasDrawn ? "もう一度3枚引く" : "3枚のカードを引く";
    });
    slots.forEach((slot, index) => {
      const shell = slot.querySelector(".three-card-shell");
      shell.setAttribute("role", "button");
      shell.setAttribute("tabindex", "0");
      shell.setAttribute("aria-label", `${slot.querySelector("h3").textContent}のカードを拡大表示`);
      const openCard = () => {
        if (slot.classList.contains("is-revealed") && revealedCards[index]) {
          app.cardModal.open(revealedCards[index]);
        }
      };
      shell.addEventListener("click", openCard);
      shell.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCard();
        }
      });
    });
    updateSlotAriaLabels();

    if (cards.length < 3) {
      drawButton.disabled = true;
      drawLabel.textContent = "カードを3枚以上登録してください";
    }

    window.addEventListener("kunimamori:languagechange", () => {
      updateSlotAriaLabels();
      if (!revealedCards.length) return;
      const displayCards = revealedCards.map((card) => app.i18n.translateCard(card));
      const roleReadings = readingEngine.generateRoleReadings(displayCards);
      revealedCards.forEach((card, index) => updateSlot(slots[index], card, index, roleReadings));
      if (!insight.hidden) updateInsight(displayCards);
    });

    app.threeCard = {
      screen,
      revealThreeCards,
      revealSelectedCards(selectedCards) {
        return revealThreeCards(selectedCards);
      },
    };
  }

  app.threeCardModule = { init };
})(window.Kunimamori);
