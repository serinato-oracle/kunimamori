(function (app) {
  "use strict";

  const STORAGE_KEY = "kunimamori.dailyHistory.v1";
  const MAX_ENTRIES = 100;

  function init() {
    const list = document.querySelector("#history-list");
    const empty = document.querySelector("#history-empty");

    function readEntries() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function writeEntries(entries) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
      } catch (error) {
        // 保存領域が利用できない場合も、通常のカード機能は継続させます。
      }
    }

    function addEntry(date, card) {
      const entries = readEntries().filter((entry) => entry.date !== date);
      entries.unshift({ date, cardNumber: card.number });
      entries.sort((left, right) => right.date.localeCompare(left.date));
      writeEntries(entries);
      render();
    }

    function formatDate(date) {
      const [year, month, day] = date.split("-").map(Number);
      if (app.i18n.getLanguage() === "en") {
        return new Date(year, month - 1, day).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      }
      return `${year}年${month}月${day}日`;
    }

    function findCard(cardNumber) {
      return app.cards.find((card) => String(card.number) === String(cardNumber));
    }

    function createItem(entry) {
      const card = findCard(entry.cardNumber);
      if (!card) return null;
      const displayCard = app.i18n.translateCard(card);

      const item = document.createElement("article");
      item.className = "history-item";

      const thumbnail = document.createElement("button");
      thumbnail.className = "history-thumbnail protected-image-area";
      thumbnail.type = "button";
      thumbnail.setAttribute("aria-label", app.i18n.getLanguage() === "en" ? `Enlarge ${displayCard.name}` : `${displayCard.name}を拡大表示`);
      thumbnail.innerHTML = `<img class="is-protected-image" src="${card.image}" alt="${app.i18n.getLanguage() === "en" ? `${displayCard.name} card image` : `${displayCard.name}のカード画像`}" draggable="false" />`;
      thumbnail.addEventListener("click", () => app.cardModal.open(card));

      const details = document.createElement("div");
      details.className = "history-item__details";
      details.innerHTML = `<time datetime="${entry.date}">${formatDate(entry.date)}</time><p><span>No.${card.number}</span>${displayCard.name}</p><small>${displayCard.deity || ""}</small>`;

      item.append(thumbnail, details);
      return item;
    }

    function render() {
      list.replaceChildren();
      const items = readEntries()
        .sort((left, right) => right.date.localeCompare(left.date))
        .map(createItem)
        .filter(Boolean);

      items.forEach((item) => list.append(item));
      empty.hidden = items.length > 0;
    }

    render();
    window.addEventListener("kunimamori:languagechange", render);
    app.history = { addEntry, render, readEntries, storageKey: STORAGE_KEY, maxEntries: MAX_ENTRIES };
  }

  app.historyModule = { init };
})(window.Kunimamori);
