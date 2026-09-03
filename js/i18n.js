(function () {
  "use strict";

  const STORAGE_KEY = "kunimamori-language";
  const SUPPORTED_LANGUAGES = ["ja", "en"];
  const translations = window.KunimamoriTranslations || {};
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const translatedAttributes = ["aria-label", "title", "placeholder", "alt"];
  let observer = null;
  let currentLanguage = readInitialLanguage();
  const originalTitle = document.title;

  function readInitialLanguage() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    } catch (_) {
      // 保存領域が利用できない場合はブラウザ設定を使用します。
    }
    return "ja";
  }

  function translate(source) {
    if (currentLanguage === "ja") return source;
    const dictionary = translations.en && translations.en.text;
    if (!dictionary) return source;
    if (dictionary[source]) return dictionary[source];
    const trimmed = String(source).trim();
    if (!dictionary[trimmed]) return source;
    const leading = String(source).match(/^\s*/)[0];
    const trailing = String(source).match(/\s*$/)[0];
    return `${leading}${dictionary[trimmed]}${trailing}`;
  }

  function translateTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    let source = originalText.get(node);
    if (!source) {
      source = node.nodeValue;
      originalText.set(node, source);
    }
    node.nodeValue = translate(source);
  }

  function translateElementAttributes(element) {
    if (element.hasAttribute("data-i18n-dynamic-attributes")) return;
    let sources = originalAttributes.get(element);
    if (!sources) {
      sources = {};
      originalAttributes.set(element, sources);
    }
    translatedAttributes.forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      const value = element.getAttribute(name);
      if (!sources[name]) sources[name] = value;
      element.setAttribute(name, translate(sources[name]));
    });
  }

  function translateTree(root) {
    if (!root || (root.closest && root.closest("[data-i18n-ignore]"))) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches("[data-i18n-ignore]")) {
        continue;
      }
      if (node.parentElement && node.parentElement.closest("[data-i18n-ignore]")) continue;
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateElementAttributes(node);
    }
  }

  function updateSwitcher() {
    document.querySelectorAll("[data-language]").forEach(function (button) {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyLanguage() {
    if (observer) observer.disconnect();
    document.documentElement.lang = currentLanguage;
    document.body.classList.toggle("is-language-en", currentLanguage === "en");
    document.title = translate(originalTitle);
    document.querySelectorAll('meta[name="description"], meta[name="apple-mobile-web-app-title"]').forEach(function (meta) {
      if (!meta.dataset.i18nSource) meta.dataset.i18nSource = meta.content;
      meta.content = translate(meta.dataset.i18nSource);
    });
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) {
      if (!manifest.dataset.jaHref) manifest.dataset.jaHref = manifest.getAttribute("href");
      manifest.setAttribute("href", currentLanguage === "en"
        ? manifest.dataset.jaHref.replace("manifest.webmanifest", "manifest-en.webmanifest")
        : manifest.dataset.jaHref);
    }
    translateTree(document.body);
    updateSwitcher();
    if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
    window.dispatchEvent(new CustomEvent("kunimamori:languagechange", { detail: { language: currentLanguage } }));
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) return;
    currentLanguage = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (_) {
      // 保存できない場合も現在のページでは切替を継続します。
    }
    applyLanguage();
  }

  function createSwitcher() {
    if (document.querySelector(".language-switcher")) return;
    const nav = document.createElement("nav");
    nav.className = "language-switcher";
    nav.dataset.i18nIgnore = "true";
    nav.setAttribute("aria-label", "Language");
    nav.innerHTML = '<button type="button" data-language="ja">日本語</button><span aria-hidden="true">/</span><button type="button" data-language="en">English</button>';
    nav.addEventListener("click", function (event) {
      const button = event.target.closest("[data-language]");
      if (button) setLanguage(button.dataset.language);
    });
    document.body.appendChild(nav);
  }

  function translateCard(card) {
    if (!card || currentLanguage === "ja") return card;
    const translated = translations.en && translations.en.cards && translations.en.cards[String(card.number)];
    return translated ? Object.assign({}, card, translated) : card;
  }

  function init() {
    createSwitcher();
    observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData") translateTextNode(mutation.target);
        else if (mutation.type === "attributes") translateElementAttributes(mutation.target);
        else mutation.addedNodes.forEach(translateTree);
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
    });
    applyLanguage();
  }

  window.Kunimamori = window.Kunimamori || {};
  window.Kunimamori.i18n = { init, setLanguage, getLanguage: function () { return currentLanguage; }, t: translate, translateCard };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
