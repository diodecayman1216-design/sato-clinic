// 変更: 全6ページの表示ブロックを共通監視する。既存の絶対配置や
// display: contentsを保つため、セクションを包む要素は追加しない。
(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const blocks = document.querySelectorAll(
    '.page-main .block, .page-main > .title-rule, .page-main > .copy, ' +
    '.page-main > .service-card, .page-main > .notice-card'
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      // 変更: 一度表示した要素は監視を解除し、再スクロール時も繰り返さない。
      observer.unobserve(entry.target);
    });
  }, { threshold: 0 });

  blocks.forEach((block) => block.classList.add('scroll-reveal'));
  // 変更: 初期状態を確定し、最初から画面内にある要素もtransitionさせる。
  document.querySelector('.page-main')?.getBoundingClientRect();
  blocks.forEach((block) => observer.observe(block));

  // 変更: 閲覧途中で動きを減らす設定になった場合も、全要素を表示して監視を終了する。
  motionPreference.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    blocks.forEach((block) => block.classList.add('is-visible'));
  });
})();
