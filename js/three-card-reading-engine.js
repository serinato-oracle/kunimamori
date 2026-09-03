(function (app) {
  "use strict";

  const roleFields = ["currentReading", "challengeReading", "futureReading"];

  function normalizeMessage(message) {
    return String(message || "").replace(/\s*\n\s*/g, "").trim();
  }

  function generateRoleReadings(cards) {
    return cards.map((card, index) => card[roleFields[index]] || normalizeMessage(card.message));
  }

  // 将来AI APIへ接続するときは、この関数だけを非同期処理へ差し替えられます。
  function generateIntegratedOracle(cards) {
    const readings = generateRoleReadings(cards);
    return `${readings[0]} その現在地を踏まえて、今必要な鍵へ意識を向けましょう。${readings[1]} そして、その気づきをこれからの選択へつなげてください。${readings[2]}`;
  }

  function generateTodayActions(cards) {
    const [present, key, future] = cards;
    return [
      `今感じていることを一分だけ静かに見つめ、「${present.name}」から思い浮かぶ言葉を一つ書き留める。`,
      `「${key.name}」を今日の合言葉にして、後回しにしていたことへ小さな一歩をつける。`,
      `「${future.name}」の流れに近づくため、今日中にできる行動を一つ選んで実行する。`,
    ];
  }

  app.threeCardReadingEngine = {
    generateRoleReadings,
    generateIntegratedOracle,
    generateTodayActions,
  };
})(window.Kunimamori);
