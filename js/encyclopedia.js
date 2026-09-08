(function (app) {
  "use strict";

  const STORAGE_KEY = "kunimamori.encyclopediaUnlocked.v1";
  const TOTAL_CARDS = 48;
  let currentDetailId = null;
  let elements = null;

  function isEnglish() {
    return app.i18n && app.i18n.getLanguage() === "en";
  }

  function labels() {
    return isEnglish() ? {
      title: "Divine Encyclopedia",
      count: "Connections with the Divine",
      locked: "Draw this card in Today’s Card to unlock it.",
      open: "Open encyclopedia entry for card No.",
      home: "Back to Home",
      back: "Back to Divine Encyclopedia",
      deity: "Deity",
      sacredObject: "Sacred Object",
      featured: "Deities Featured",
      meaning: "Card Meaning",
      myth: "Myth Story",
      origin: "Myth / Origin Story",
      scene: "What Happens in This Scene",
      lesson: "What This Story Can Teach Us",
      sites: "Related Shrines & Temples",
    } : {
      title: "神仏図鑑",
      count: "神仏とのご縁",
      locked: "今日の一枚で出会うと開放されます",
      open: "神仏図鑑のカードを開く No.",
      home: "ホームへ戻る",
      back: "神仏図鑑へ戻る",
      deity: "神仏名",
      sacredObject: "神仏名／聖なる御神宝名",
      featured: "登場する神々",
      meaning: "カードの意味",
      myth: "神話エピソード",
      origin: "神話／由来エピソード",
      scene: "この場面で何が起きたのか",
      lesson: "物語から受け取れること",
      sites: "関連する神社仏閣",
    };
  }

  function normalizeNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= TOTAL_CARDS ? number : null;
  }

  function readUnlocked() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return Array.from(new Set(stored.map(normalizeNumber).filter(Boolean))).sort((a, b) => a - b);
    } catch (error) {
      return [];
    }
  }

  function writeUnlocked(numbers) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
    } catch (error) {
      // 保存できない環境でも、その場の表示と既存機能は継続します。
    }
  }

  function unlock(cardNumber) {
    const normalized = normalizeNumber(cardNumber);
    if (!normalized) return false;
    const unlocked = readUnlocked();
    if (unlocked.includes(normalized)) return false;
    unlocked.push(normalized);
    unlocked.sort((a, b) => a - b);
    writeUnlocked(unlocked);
    renderList();
    return true;
  }

  function getEntry(cardNumber) {
    const normalized = normalizeNumber(cardNumber);
    if (!normalized || !app.encyclopediaCards) return null;
    return app.encyclopediaCards[String(normalized).padStart(2, "0")] || null;
  }

  function getCard(cardNumber) {
    return app.cards.find((card) => Number(card.number) === Number(cardNumber)) || null;
  }

  function localized(entry) {
    return isEnglish() ? entry.en : entry;
  }

  function makeText(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text || "";
    return node;
  }

  function addSection(parent, heading, content) {
    if (!content) return;
    const section = document.createElement("section");
    section.className = "encyclopedia-detail__section";
    section.append(makeText("h3", "", heading));
    String(content).split(/\n\n+/).forEach((paragraph) => {
      if (paragraph.trim()) section.append(makeText("p", "", paragraph.trim()));
    });
    parent.append(section);
  }

  function addSites(parent, data, heading) {
    if (!Array.isArray(data.sacredSites) || data.sacredSites.length === 0) return;
    const section = document.createElement("section");
    section.className = "encyclopedia-detail__section encyclopedia-detail__sites";
    section.append(makeText("h3", "", heading));
    const list = document.createElement("ul");
    data.sacredSites.forEach((site) => {
      list.append(makeText("li", "", `${site.mark || ""} ${site.name}${site.location ? `｜${site.location}` : ""}`.trim()));
    });
    section.append(list);
    if (data.sacredSitesNote) {
      String(data.sacredSitesNote).split(/\n\n+/).forEach((paragraph) => section.append(makeText("p", "encyclopedia-detail__note", paragraph)));
    }
    parent.append(section);
  }

  function renderList() {
    if (!elements) return;
    const copy = labels();
    const unlocked = new Set(readUnlocked());
    elements.title.textContent = copy.title;
    elements.count.textContent = `${copy.count}　${unlocked.size} / ${TOTAL_CARDS}`;
    elements.home.textContent = copy.home;
    elements.grid.replaceChildren();

    for (let number = 1; number <= TOTAL_CARDS; number += 1) {
      const open = unlocked.has(number);
      const item = document.createElement(open ? "button" : "div");
      item.className = `encyclopedia-card${open ? " is-unlocked" : " is-locked"}`;
      if (open) {
        item.type = "button";
        item.setAttribute("aria-label", `${copy.open}${number}`);
        item.addEventListener("click", () => showDetail(number));
      } else {
        item.setAttribute("aria-label", `No.${number}. ${copy.locked}`);
      }
      const image = document.createElement("img");
      const card = getCard(number);
      image.src = open && card ? card.image : "images/web/card-back.jpg";
      image.alt = "";
      item.append(image, makeText("span", "encyclopedia-card__number", `No.${number}`));
      if (!open) item.append(makeText("span", "encyclopedia-card__locked-hint", copy.locked));
      elements.grid.append(item);
    }
  }

  function renderCharacters(parent, entry, data, copy) {
    const section = document.createElement("section");
    section.className = "encyclopedia-detail__section encyclopedia-detail__characters";
    section.append(makeText("h3", "", copy.featured));
    (data.characters || []).forEach((character, index) => {
      const row = document.createElement("div");
      row.append(makeText("strong", "", character.name));
      if (!isEnglish() && entry.characters[index] && entry.characters[index].reading) {
        row.append(makeText("span", "encyclopedia-detail__reading", entry.characters[index].reading));
      }
      if (character.note) row.append(makeText("p", "encyclopedia-detail__note", character.note));
      section.append(row);
    });
    if (data.charactersNote) section.append(makeText("p", "encyclopedia-detail__note", data.charactersNote));
    parent.append(section);
  }

  function renderDetail() {
    if (!elements || !currentDetailId) return;
    const entry = getEntry(currentDetailId);
    if (!entry || !readUnlocked().includes(Number(currentDetailId))) return;
    const data = localized(entry);
    const copy = labels();
    const card = getCard(currentDetailId);
    const root = elements.detailContent;
    root.replaceChildren();

    const header = document.createElement("header");
    header.className = "encyclopedia-detail__header";
    header.append(makeText("p", "encyclopedia-detail__number", `No.${Number(entry.number)}`));
    const image = document.createElement("img");
    image.className = "encyclopedia-detail__image";
    image.src = card ? card.image : `images/web/kuni-${entry.id}.jpg`;
    image.alt = isEnglish() ? `${data.title} card image` : `${data.title}のカード画像`;
    const title = makeText("h2", "", data.title);
    title.id = "encyclopedia-detail-title";
    header.append(image, title);
    if (entry.special && data.episodeName) header.append(makeText("p", "encyclopedia-detail__episode", data.episodeName));
    root.append(header);

    if (entry.special) {
      renderCharacters(root, entry, data, copy);
    } else {
      const identity = document.createElement("section");
      identity.className = "encyclopedia-detail__section encyclopedia-detail__identity";
      identity.append(makeText("h3", "", data.deityName && /勾玉|鏡|剣/.test(entry.deityName) ? copy.sacredObject : copy.deity));
      identity.append(makeText("strong", "", data.deityName));
      if (!isEnglish() && entry.reading) identity.append(makeText("span", "encyclopedia-detail__reading", entry.reading));
      if (data.deityNote) identity.append(makeText("p", "encyclopedia-detail__note", data.deityNote));
      root.append(identity);
    }

    addSection(root, copy.meaning, data.meaning);
    addSection(root, entry.special ? copy.myth : copy.origin, data.myth);
    if (entry.special) addSection(root, copy.scene, data.sceneExplanation);
    addSection(root, data.connectionHeading, data.connection);
    if (entry.special) addSection(root, copy.lesson, data.storyMessage);
    addSites(root, data, copy.sites);
    elements.back.textContent = copy.back;
  }

  function showDetail(cardNumber) {
    const normalized = normalizeNumber(cardNumber);
    if (!normalized || !readUnlocked().includes(normalized)) return false;
    currentDetailId = String(normalized).padStart(2, "0");
    renderDetail();
    app.navigation.showView(app.navigation.views.encyclopediaDetail);
    return true;
  }

  function init() {
    elements = {
      title: document.querySelector("#encyclopedia-title"),
      count: document.querySelector("#encyclopedia-count"),
      grid: document.querySelector("#encyclopedia-grid"),
      home: document.querySelector("#encyclopedia-return"),
      detailContent: document.querySelector("#encyclopedia-detail-content"),
      back: document.querySelector("#encyclopedia-detail-return"),
      menu: document.querySelector("#choose-encyclopedia"),
    };
    renderList();
    window.addEventListener("kunimamori:languagechange", () => {
      if (elements.menu) elements.menu.textContent = isEnglish() ? "Divine Encyclopedia" : "神仏図鑑";
      renderList();
      renderDetail();
    });
    if (elements.menu) elements.menu.textContent = isEnglish() ? "Divine Encyclopedia" : "神仏図鑑";
  }

  app.encyclopedia = { init, unlock, readUnlocked, renderList, showDetail, storageKey: STORAGE_KEY };
})(window.Kunimamori);
