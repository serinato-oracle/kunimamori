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
    let previousFocus;

    function open(card) {
      if (!card) return;

      previousFocus = document.activeElement;
      image.src = card.image;
      image.alt = `${card.name}のカード画像`;
      number.textContent = card.number ? `No.${card.number}` : "";
      title.textContent = card.name;
      deity.textContent = card.deity || "";
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

    app.cardModal = { open, close };
  }

  app.cardModalModule = { init };
})(window.Kunimamori);
