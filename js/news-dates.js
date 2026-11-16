// 変更: 記事ごとの更新日を一元管理。一覧・詳細のdata-news-idと対応する。
// 日付を変更するときは、対象記事の値を「2026年11月16日」の形式で編集する。
// HTMLにも仮の日付を残し、JavaScriptが無効でも更新日を表示する。
(() => {
  const updatedDates = {
    "influenza": "0000年00月00日", // インフルエンザ予防接種について
    "new-year": "0000年00月00日", // 年末年始の休診について
    "checkup": "0000年00月00日", // 健康診断のご案内
    "covid": "0000年00月00日", // 新型コロナウイルス対策について
    "online": "0000年00月00日", // オンライン診療の導入について
  };

  // 変更: 同じ記事IDの日付を両ページに反映し、既存のリンク・本文には触れない。
  document.querySelectorAll(".news-updated[data-news-id]").forEach((element) => {
    const date = updatedDates[element.dataset.newsId];
    if (date) element.textContent = `更新日：${date}`;
  });
})();
