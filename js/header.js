// 変更: 全6ページで同じヘッダー動作を使い、リンク先・本文の構造は維持する。
(() => {
  const header = document.querySelector('.site-header');
  const menu = header?.querySelector('.header-menu');
  const nav = header?.querySelector('.site-nav');
  if (!header || !menu || !nav) return;
  const mobile = window.matchMedia('(max-width: 768px)');
  const root = document.documentElement;
  const slot = document.createElement('div');
  slot.className = 'header-slot';
  header.before(slot);
  slot.append(header);
  menu.hidden = false;

  const closeMenu = (restoreFocus = false) => {
    header.classList.remove('is-menu-open');
    menu.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menu.focus({ preventScroll: true });
  };
  const syncScroll = () => {
    const compact = mobile.matches && window.scrollY > 0;
    if (header.classList.contains('is-compact') === compact) return;
    const focused = document.activeElement;
    closeMenu();
    header.classList.toggle('is-compact', compact);
    // 隠れたリンクにキーボードフォーカスを残さない。
    if (compact && (nav.contains(focused) || header.querySelector('.header-contact').contains(focused))) {
      menu.focus({ preventScroll: true });
    } else if (!compact && focused === menu) {
      header.querySelector('.header-info > a').focus({ preventScroll: true });
    }
  };
  const measure = () => {
    // 同じ描画処理内で展開状態を測定し、向き変更・フォント読込後も高さを保持する。
    const compact = header.classList.contains('is-compact');
    header.classList.remove('is-compact');
    slot.style.setProperty('--expanded-header-height', header.getBoundingClientRect().height + 'px');
    const height = mobile.matches
      ? header.querySelector('.header-info').getBoundingClientRect().height + 16
      : header.getBoundingClientRect().height;
    root.style.setProperty('--anchor-header-height', height + 'px');
    header.classList.toggle('is-compact', compact);
    syncScroll();
  };
  menu.addEventListener('click', () => {
    const open = header.classList.toggle('is-menu-open');
    menu.setAttribute('aria-expanded', String(open));
  });
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-menu-open')) {
      closeMenu(true);
    }
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && mobile.matches && header.classList.contains('is-compact')) {
      closeMenu(true);
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  window.addEventListener('scroll', syncScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  measure();

  // 別ページからの#リンクも、画像・フォント確定後に実測した余白で合わせる。
  // 通常の同一ページリンクはブラウザ標準のscroll-paddingと履歴処理を使う。
  let userMoved = false;
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((type) => {
    window.addEventListener(type, () => { userMoved = true; }, { once: true, passive: true });
  });
  Promise.all([
    new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    }),
    document.fonts?.ready
  ]).then(() => {
    measure();
    if (!location.hash || userMoved) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    syncScroll();
  });
})();
