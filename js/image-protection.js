(function () {
  "use strict";

  const protectedAreaSelector = [
    ".selection-card",
    ".card-stage",
    ".three-card-shell",
    ".daily-card-shell",
    ".card-modal__dialog",
    ".protected-image-area",
  ].join(",");

  const protectedImageSelector = [
    ".selection-card img",
    ".card-stage img",
    ".three-card-shell img",
    ".daily-card-shell img",
    ".card-modal__dialog img",
    ".protected-image-area img",
  ].join(",");

  document.querySelectorAll(protectedImageSelector).forEach((image) => {
    image.draggable = false;
    image.classList.add("is-protected-image");
  });

  document.addEventListener("contextmenu", (event) => {
    if (event.target.closest(protectedAreaSelector)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target.closest(protectedAreaSelector)) {
      event.preventDefault();
    }
  });

  document.addEventListener("selectstart", (event) => {
    if (event.target.closest(protectedAreaSelector)) {
      event.preventDefault();
    }
  });
})();
