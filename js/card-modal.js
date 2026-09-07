(function (app) {
  "use strict";

  function init() {
    const modal = document.querySelector("#card-modal");
    const dialog = modal.querySelector(".card-modal__dialog");
    const closeButton = document.querySelector("#card-modal-close");
    const backdrop = document.querySelector("#card-modal-backdrop");
    const image = document.querySelector("#card-modal-image");
    const number = document.querySelector("#card-modal-number");
    const title = document.querySelector("#card-modal-title");
    const deity = document.querySelector("#card-modal-deity");
    const shrineInfo = document.querySelector("#card-modal-shrine-info");
    const shrineList = document.querySelector("#card-modal-shrine-list");
    const shrineNotes = document.querySelector("#card-modal-shrine-notes");
    let previousFocus;
    let currentCard = null;
    let showShrineInfo = false;

    function render(card) {
      const displayCard = app.i18n.translateCard(card);
      image.src = card.image;
      image.alt = app.i18n.getLanguage() === "en" ? `${displayCard.name} card image` : `${displayCard.name}のカード画像`;
      number.textContent = card.number ? `No.${card.number}` : "";
      title.textContent = displayCard.name;
      deity.textContent = displayCard.deity || "";
      app.renderShrineInfo(shrineInfo, shrineList, shrineNotes, showShrineInfo ? card : null);
    }

    function open(card, options = {}) {
      if (!card) return;

      previousFocus = document.activeElement;
      currentCard = card;
      showShrineInfo = Boolean(options.showShrineInfo);
      render(card);
      modal.hidden = false;
      document.body.classList.add("is-modal-open");
      window.requestAnimationFrame(() => modal.classList.add("is-open"));
      closeButton.focus();
    }

    function close() {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("is-modal-open");
      window.setTimeout(() => {
        modal.hidden = true;
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      }, 220);
    }

    closeButton.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    dialog.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) close();
    });
    window.addEventListener("kunimamori:languagechange", () => {
      if (currentCard && !modal.hidden) render(currentCard);
    });

    app.cardModal = { open, close };
  }

  app.cardModalModule = { init };
})(window.Kunimamori);
