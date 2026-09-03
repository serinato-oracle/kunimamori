(function (app) {
  "use strict";

  const BACK_IMAGE = "images/web/card-back.jpg";
  const SWIPE_DISTANCE = 70;
  const DOUBLE_TAP_DELAY = 360;
  const SCATTER_SAFE_MARGIN = 14;

  function shuffledCards(cards) {
    const deck = [...cards];
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
    }
    return deck;
  }

  function makeBack(className) {
    const card = document.createElement("div");
    card.className = className;
    const image = document.createElement("img");
    image.src = BACK_IMAGE;
    image.alt = "";
    image.draggable = false;
    card.appendChild(image);
    return card;
  }

  function init() {
    const table = document.querySelector("#shuffle-table");
    const leftDeck = document.querySelector("#riffle-left");
    const rightDeck = document.querySelector("#riffle-right");
    const scatterDeck = document.querySelector("#scatter-deck");
    const instruction = document.querySelector("#shuffle-instruction");
    const title = document.querySelector("#shuffle-title");
    const progress = document.querySelector("#selection-progress");
    const finishButton = document.querySelector("#finish-riffle");
    const restartButton = document.querySelector("#restart-shuffle");
    const swipeGuide = document.querySelector("#swipe-guide");
    let phase = "idle";
    let selectedCards = [];
    let swipeStartY = null;
    let topLayer = 100;
    let runId = 0;
    let riffleAnimations = [];
    let targetMode = "three";
    let targetCount = 3;

    function isEnglish() {
      return app.i18n.getLanguage() === "en";
    }

    function selectionLabel(order) {
      if (!isEnglish()) return `${order}枚目`;
      const suffix = order === 1 ? "st" : order === 2 ? "nd" : order === 3 ? "rd" : "th";
      return `${order}${suffix}`;
    }

    function unselectedAriaLabel() {
      return isEnglish()
        ? "Face-down card. Double-tap to select."
        : "裏向きのカード。ダブルタップして選択してください。";
    }

    function selectedAriaLabel(order) {
      if (!isEnglish()) return `${order}枚目として選択済み`;
      const ordinal = order === 1 ? "first" : order === 2 ? "second" : order === 3 ? "third" : String(order);
      return `Selected as the ${ordinal} card.`;
    }

    function updateScatterAriaLabels() {
      Array.from(scatterDeck.children).forEach((element) => {
        const selected = element.classList.contains("is-selected");
        const order = Number(element.dataset.selectionOrder || 0);
        element.setAttribute("aria-label", selected ? selectedAriaLabel(order) : unselectedAriaLabel());
        element.setAttribute("aria-pressed", String(selected));
        const badge = element.querySelector(".scatter-card__badge");
        if (selected && badge) badge.textContent = selectionLabel(order);
      });
    }

    function stopRiffleAnimations() {
      riffleAnimations.forEach((animation) => animation.cancel());
      riffleAnimations = [];
    }

    function animateRiffleCard(card, side, index) {
      if (typeof card.animate !== "function") return;
      const direction = side === "left" ? 1 : -1;
      const baseRotation = side === "left" ? -7 : 7;
      const stackOffset = index * -1.2;
      const lift = -10 - index * 1.7;
      const travel = Math.max(92, card.getBoundingClientRect().width * 1.08);
      const animation = card.animate(
        [
          { transform: `translate3d(0, ${stackOffset}px, 0) rotate(${baseRotation}deg)`, offset: 0 },
          { transform: `translate3d(0, ${stackOffset}px, 0) rotate(${baseRotation}deg)`, offset: 0.12 },
          { transform: `translate3d(${direction * travel * 0.48}px, ${lift}px, 0) rotate(${-baseRotation * 1.35}deg)`, offset: 0.34 },
          { transform: `translate3d(${direction * travel * 0.82}px, ${lift + 13}px, 0) rotate(${direction * 4}deg)`, offset: 0.52 },
          { transform: `translate3d(${direction * travel}px, ${stackOffset + (side === "left" ? 3 : 7)}px, 0) rotate(${direction}deg)`, offset: 0.68 },
          { transform: `translate3d(${direction * travel * 0.5}px, ${stackOffset}px, 0) rotate(${-direction * 2}deg)`, offset: 0.82 },
          { transform: `translate3d(0, ${stackOffset}px, 0) rotate(${baseRotation}deg)`, offset: 1 },
        ],
        {
          duration: 1700,
          delay: index * 45 + (side === "right" ? 25 : 0),
          iterations: Infinity,
          easing: "cubic-bezier(.38,.02,.2,1)",
        },
      );
      riffleAnimations.push(animation);
    }

    function buildRiffleDecks() {
      stopRiffleAnimations();
      leftDeck.replaceChildren();
      rightDeck.replaceChildren();
      for (let index = 0; index < 10; index += 1) {
        const leftCard = makeBack("riffle-card");
        const rightCard = makeBack("riffle-card");
        leftCard.style.setProperty("--layer", index);
        leftCard.style.setProperty("--stack-offset", `${index * -1.2}px`);
        leftCard.style.setProperty("--riffle-lift", `${-10 - index * 1.7}px`);
        leftCard.style.setProperty("--delay", `${index * 0.045}s`);
        rightCard.style.setProperty("--layer", index);
        rightCard.style.setProperty("--stack-offset", `${index * -1.2}px`);
        rightCard.style.setProperty("--riffle-lift", `${-7 - index * 1.7}px`);
        rightCard.style.setProperty("--delay", `${index * 0.045 + 0.025}s`);
        leftDeck.appendChild(leftCard);
        rightDeck.appendChild(rightCard);
      }
      window.requestAnimationFrame(() => {
        Array.from(leftDeck.children).forEach((card, index) => animateRiffleCard(card, "left", index));
        Array.from(rightDeck.children).forEach((card, index) => animateRiffleCard(card, "right", index));
      });
    }

    function updateProgress() {
      progress.textContent = `${isEnglish() ? "Selected" : "選択"} ${selectedCards.length} / ${targetCount}`;
    }

    function placeScatteredCard(element, index, total) {
      const tableRect = table.getBoundingClientRect();
      const cardWidth = element.offsetWidth || 62;
      const cardHeight = element.offsetHeight || 102;
      const padding = SCATTER_SAFE_MARGIN;
      const maxX = Math.max(padding, tableRect.width - cardWidth - padding);
      const maxY = Math.max(padding, tableRect.height - cardHeight - padding);
      const columnCount = Math.max(6, Math.floor(tableRect.width / (cardWidth * 0.72)));
      const rowCount = Math.ceil(total / columnCount);
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const baseX = columnCount === 1 ? maxX / 2 : padding + (column / (columnCount - 1)) * (maxX - padding);
      const baseY = rowCount === 1 ? maxY / 2 : padding + (row / (rowCount - 1)) * (maxY - padding);
      const jitterX = (Math.random() - 0.5) * Math.min(34, cardWidth * 0.55);
      const jitterY = (Math.random() - 0.5) * Math.min(28, cardHeight * 0.28);
      const x = Math.min(maxX, Math.max(padding, baseX + jitterX));
      const y = Math.min(maxY, Math.max(padding, baseY + jitterY));
      element.dataset.x = String(x);
      element.dataset.y = String(y);
      element.dataset.rotation = String((Math.random() - 0.5) * 34);
      applyPosition(element);
    }

    function applyPosition(element) {
      const x = Number(element.dataset.x || 0);
      const y = Number(element.dataset.y || 0);
      const rotation = Number(element.dataset.rotation || 0);
      element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    }

    function stirNearbyCards(activeCard, movementX, movementY) {
      const activeX = Number(activeCard.dataset.x || 0) + activeCard.offsetWidth / 2;
      const activeY = Number(activeCard.dataset.y || 0) + activeCard.offsetHeight / 2;
      const candidates = Array.from(scatterDeck.children)
        .filter((card) => card !== activeCard && !card.classList.contains("is-selected"))
        .map((card) => {
          const x = Number(card.dataset.x || 0) + card.offsetWidth / 2;
          const y = Number(card.dataset.y || 0) + card.offsetHeight / 2;
          return { card, distance: Math.hypot(x - activeX, y - activeY) };
        })
        .filter(({ distance }) => distance < Math.max(145, table.clientWidth * 0.24))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 9);

      candidates.forEach(({ card, distance }, index) => {
        if (Math.random() < 0.18 && index > 3) return;
        const influence = Math.max(0.12, 1 - distance / 190);
        const randomX = (Math.random() - 0.5) * 24;
        const randomY = (Math.random() - 0.5) * 20;
        const maxX = Math.max(SCATTER_SAFE_MARGIN, table.clientWidth - card.offsetWidth - SCATTER_SAFE_MARGIN);
        const maxY = Math.max(SCATTER_SAFE_MARGIN, table.clientHeight - card.offsetHeight - SCATTER_SAFE_MARGIN);
        const nextX = Number(card.dataset.x || 0) + movementX * influence * 0.38 + randomX * influence;
        const nextY = Number(card.dataset.y || 0) + movementY * influence * 0.3 + randomY * influence;
        card.dataset.x = String(Math.min(maxX, Math.max(SCATTER_SAFE_MARGIN, nextX)));
        card.dataset.y = String(Math.min(maxY, Math.max(SCATTER_SAFE_MARGIN, nextY)));
        card.dataset.rotation = String(Number(card.dataset.rotation || 0) + (Math.random() - 0.5) * 13 * influence);
        card.style.zIndex = String(++topLayer);
        card.classList.add("is-mixing");
        applyPosition(card);
        window.clearTimeout(card._mixTimer);
        card._mixTimer = window.setTimeout(() => card.classList.remove("is-mixing"), 220);
      });
    }

    function selectCard(element, card) {
      if (phase !== "scatter" || element.classList.contains("is-selected") || selectedCards.length >= targetCount) return;
      selectedCards.push(card);
      const order = selectedCards.length;
      element.classList.add("is-selected");
      element.dataset.selectionOrder = String(order);
      element.setAttribute("aria-label", selectedAriaLabel(order));
      element.setAttribute("aria-pressed", "true");
      const badge = document.createElement("span");
      badge.className = "scatter-card__badge";
      badge.textContent = selectionLabel(order);
      element.appendChild(badge);
      updateProgress();

      if (selectedCards.length === targetCount) {
        phase = "complete";
        if (targetMode === "one") app.analytics.track("single_draw_complete");
        if (targetMode === "three") app.analytics.track("three_draw_complete");
        instruction.textContent = isEnglish()
          ? targetCount === 3 ? "Revealing the three oracles" : "Revealing your oracle"
          : targetCount === 3 ? "三枚の神託を開きます" : "選んだ神託を開きます";
        const selectedForReading = [...selectedCards];
        const completedMode = targetMode;
        const activeRun = runId;
        window.setTimeout(() => {
          if (activeRun !== runId) return;
          if (completedMode === "one") {
            app.navigation.showView(app.navigation.views.oneCard);
            app.oneCard.revealSelectedCard(selectedForReading[0]);
          } else if (completedMode === "daily") {
            app.navigation.showView(app.navigation.views.daily);
            app.dailyOracle.revealSelectedCard(selectedForReading[0]);
          } else {
            app.navigation.showView(app.navigation.views.threeCard);
            app.threeCard.revealSelectedCards(selectedForReading);
          }
        }, 650);
      }
    }

    function bindCardInteraction(element, card) {
      let drag = null;
      let lastTapAt = 0;
      let lastStirAt = 0;

      ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((eventName) => {
        element.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
      });

      element.addEventListener("pointerdown", (event) => {
        if (phase !== "scatter" || element.classList.contains("is-selected")) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        element.style.zIndex = String(++topLayer);
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: Number(element.dataset.x || 0),
          originY: Number(element.dataset.y || 0),
          moved: false,
        };
        element.classList.add("is-dragging");
      });

      element.addEventListener("pointermove", (event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (Math.hypot(dx, dy) > 7) drag.moved = true;
        const maxX = Math.max(SCATTER_SAFE_MARGIN, table.clientWidth - element.offsetWidth - SCATTER_SAFE_MARGIN);
        const maxY = Math.max(SCATTER_SAFE_MARGIN, table.clientHeight - element.offsetHeight - SCATTER_SAFE_MARGIN);
        element.dataset.x = String(Math.min(maxX, Math.max(SCATTER_SAFE_MARGIN, drag.originX + dx)));
        element.dataset.y = String(Math.min(maxY, Math.max(SCATTER_SAFE_MARGIN, drag.originY + dy)));
        applyPosition(element);
        const now = performance.now();
        if (now - lastStirAt > 55) {
          stirNearbyCards(element, event.movementX || dx * 0.08, event.movementY || dy * 0.08);
          lastStirAt = now;
        }
      });

      function finishPointer(event) {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const wasMoved = drag.moved;
        drag = null;
        element.classList.remove("is-dragging");
        if (wasMoved) {
          lastTapAt = 0;
          return;
        }
        const now = Date.now();
        if (now - lastTapAt <= DOUBLE_TAP_DELAY) {
          lastTapAt = 0;
          selectCard(element, card);
        } else {
          lastTapAt = now;
        }
      }

      element.addEventListener("pointerup", finishPointer);
      element.addEventListener("pointercancel", () => {
        drag = null;
        element.classList.remove("is-dragging");
      });
      element.addEventListener("dblclick", (event) => {
        event.preventDefault();
        selectCard(element, card);
      });
    }

    function scatterCards() {
      if (phase !== "riffle") return;
      app.analytics.track("riffle_complete");
      app.analytics.track("spread_start");
      stopRiffleAnimations();
      phase = "scatter";
      table.classList.remove("is-riffling");
      table.classList.add("is-scattered");
      leftDeck.hidden = true;
      rightDeck.hidden = true;
      swipeGuide.hidden = true;
      finishButton.hidden = true;
      scatterDeck.hidden = false;
      instruction.textContent = isEnglish()
        ? `Mix the cards freely, then double-tap to choose ${targetCount}.`
        : `カードを自由に混ぜて、ダブルタップで${targetCount}枚選んでください`;
      scatterDeck.replaceChildren();

      const deck = shuffledCards(app.cards);
      deck.forEach((card, index) => {
        const element = makeBack("scatter-card");
        element.dataset.cardNumber = card.number;
        element.setAttribute("data-i18n-dynamic-attributes", "true");
        element.style.zIndex = String(index + 1);
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", unselectedAriaLabel());
        element.setAttribute("aria-pressed", "false");
        scatterDeck.appendChild(element);
        bindCardInteraction(element, card);
      });

      window.requestAnimationFrame(() => {
        Array.from(scatterDeck.children).forEach((element, index) => {
          placeScatteredCard(element, index, deck.length);
          element.classList.add("is-dealt");
        });
      });
    }

    function start(options = {}) {
      app.analytics.track("shuffle_start");
      runId += 1;
      stopRiffleAnimations();
      phase = "riffle";
      selectedCards = [];
      topLayer = 100;
      swipeStartY = null;
      targetMode = options.mode || targetMode || "three";
      if (Number(options.count) === 1) targetCount = 1;
      if (Number(options.count) === 3) targetCount = 3;
      title.textContent = isEnglish()
        ? targetCount === 3 ? "Choose Three Oracles" : targetMode === "daily" ? "Choose Today's Oracle" : "Choose One Oracle"
        : targetCount === 3 ? "三枚の神託を選ぶ" : targetMode === "daily" ? "今日の神託を選ぶ" : "一枚の神託を選ぶ";
      buildRiffleDecks();
      scatterDeck.replaceChildren();
      scatterDeck.hidden = true;
      leftDeck.hidden = false;
      rightDeck.hidden = false;
      swipeGuide.hidden = false;
      finishButton.hidden = false;
      table.classList.remove("is-scattered");
      table.classList.add("is-riffling");
      instruction.textContent = isEnglish() ? "Shuffling the cards" : "カードをシャッフルしています";
      updateProgress();
    }

    table.addEventListener("pointerdown", (event) => {
      if (phase === "riffle") swipeStartY = event.clientY;
    });
    table.addEventListener("pointerup", (event) => {
      if (phase !== "riffle" || swipeStartY === null) return;
      const distance = swipeStartY - event.clientY;
      swipeStartY = null;
      if (distance >= SWIPE_DISTANCE) scatterCards();
    });
    ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
      table.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
    });
    ["touchmove", "touchend"].forEach((eventName) => {
      table.addEventListener(eventName, (event) => {
        if (phase === "riffle" || phase === "scatter") event.preventDefault();
      }, { passive: false });
    });
    finishButton.addEventListener("click", scatterCards);
    restartButton.addEventListener("click", start);
    window.addEventListener("kunimamori:languagechange", () => {
      updateProgress();
      updateScatterAriaLabels();
      if (phase === "riffle") {
        title.textContent = isEnglish()
          ? targetCount === 3 ? "Choose Three Oracles" : targetMode === "daily" ? "Choose Today's Oracle" : "Choose One Oracle"
          : targetCount === 3 ? "三枚の神託を選ぶ" : targetMode === "daily" ? "今日の神託を選ぶ" : "一枚の神託を選ぶ";
        instruction.textContent = isEnglish() ? "Shuffling the cards" : "カードをシャッフルしています";
      }
      if (phase === "scatter") {
        instruction.textContent = isEnglish()
          ? `Mix the cards freely, then double-tap to choose ${targetCount}.`
          : `カードを自由に混ぜて、ダブルタップで${targetCount}枚選んでください`;
      }
    });

    app.threeCardShuffle = { start, finishRiffle: scatterCards };
  }

  app.threeCardShuffleModule = { init };
})(window.Kunimamori);
