// 変更: 全ページのヘッダー・フッターで、1つの電話ポップアップを共用する。
(() => {
  const triggers = document.querySelectorAll('.header-phone[href^="tel:"], .footer-tel[href^="tel:"]');
  // dialog非対応・JavaScript無効時には、HTMLにある元のtel:リンクをそのまま使う。
  if (!triggers.length || typeof HTMLDialogElement === 'undefined' ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  const mobileHeader = window.matchMedia("(max-width: 768px)");
  const phoneNumber = '00-0000-0000';
  const dialog = document.createElement('dialog');
  dialog.id = 'phone-dialog';
  dialog.className = 'phone-dialog';
  dialog.setAttribute('aria-labelledby', 'phone-dialog-title');
  dialog.innerHTML = `
    <div class="phone-dialog-content">
      <button class="phone-dialog-close" type="button" aria-label="閉じる" autofocus>×</button>
      <h2 id="phone-dialog-title">お電話でのお問い合わせ</h2>
      <p class="phone-dialog-number">${phoneNumber}</p>
      <div class="phone-dialog-actions">
        <!-- tel:リンクは端末の電話アプリを開く。実際の発信操作は端末側で行う。 -->
        <a class="phone-dialog-action phone-dialog-call" href="tel:0000000000">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"/>
          </svg>
          電話をかける
        </a>
        <button class="phone-dialog-action phone-dialog-copy" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
            <rect x="8" y="8" width="12" height="13" rx="2"/>
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>
          </svg>
          電話番号をコピー
        </button>
      </div>
      <!-- 結果を読み上げられるように、成功・失敗メッセージの領域を先に用意する。 -->
      <p class="phone-dialog-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  `;
  document.body.append(dialog);

  const closeButton = dialog.querySelector('.phone-dialog-close');
  const copyButton = dialog.querySelector('.phone-dialog-copy');
  const status = dialog.querySelector('.phone-dialog-status');
  let opener = null;
  let copyRequest = 0;
  let backdropPressed = false;

  triggers.forEach((trigger) => {
    // 変更: スマホのヘッダーは直接発信するため、読み上げも発信リンクに合わせる。
    const updateLabel = () => {
      const directCall = trigger.matches(".header-phone") && mobileHeader.matches;
      if (directCall) {
        trigger.removeAttribute("aria-haspopup");
        trigger.removeAttribute("aria-controls");
      } else {
        trigger.setAttribute("aria-haspopup", "dialog");
        trigger.setAttribute("aria-controls", dialog.id);
      }
      trigger.setAttribute("aria-label", (directCall ? "電話をかける " : "お電話でのお問い合わせ ") + phoneNumber);
    };
    updateLabel();
    mobileHeader.addEventListener("change", updateLabel);
    trigger.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // 変更: スマホのヘッダー電話アイコンは直接tel:を開く。
      if (trigger.matches(".header-phone") && mobileHeader.matches) return;
      event.preventDefault();
      if (dialog.open) return;
      opener = trigger;
      copyRequest++;
      copyButton.disabled = false;
      status.textContent = '';
      backdropPressed = false;
      // showModal()は背景を操作不可にし、Tabキーの移動先をポップアップ内に限定する。
      // スクロールバーが消える分の幅を補い、表示中も背景の横位置を保つ。
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--phone-scrollbar-width', scrollbarWidth + 'px');
      document.documentElement.classList.add('phone-dialog-open');
      dialog.showModal();
      closeButton.focus({ preventScroll: true });
    });
  });

  // 閉じたらスクロール制限を解除し、起動したボタンにフォーカスを戻す。
  const finishClose = () => {
    if (dialog.open || !opener) return;
    copyRequest++; // 閉じた後に完了したコピー処理の通知を表示しない。
    document.documentElement.classList.remove('phone-dialog-open');
    document.documentElement.style.removeProperty('--phone-scrollbar-width');
    const previousOpener = opener;
    opener = null;
    previousOpener.focus({ preventScroll: true });
  };
  const closeDialog = () => {
    dialog.close();
    // closeイベントを待たず解除し、すぐ開き直した場合も古い処理が残らないようにする。
    finishClose();
  };
  // ×・暗い背景・Escapeキーのどの操作でも、同じ終了処理を使う。
  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('close', finishClose);
  const isBackdrop = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog &&
      (event.clientX < rect.left || event.clientX > rect.right ||
       event.clientY < rect.top || event.clientY > rect.bottom);
  };
  dialog.addEventListener('pointerdown', (event) => {
    backdropPressed = isBackdrop(event);
  });
  dialog.addEventListener('click', (event) => {
    // 内側から外側へのドラッグで誤って閉じないよう、押し始めた場所も確認する。
    if (backdropPressed && isBackdrop(event)) closeDialog();
    backdropPressed = false;
  });
  // Clipboard APIがない環境や許可されない環境では、従来のコピー方法も試す。
  // 入力欄はdialog内に置く。背景は操作不可なので、body直下では選択できないため。
  const copyWithSelection = () => {
    const field = document.createElement('textarea');
    field.className = 'phone-dialog-copy-field';
    field.value = phoneNumber;
    field.readOnly = true;
    const focused = document.activeElement;
    dialog.append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, phoneNumber.length);
      return document.execCommand('copy');
    } finally {
      field.remove();
      if (dialog.open) focused?.focus({ preventScroll: true });
    }
  };

  copyButton.addEventListener('click', async () => {
    const request = ++copyRequest;
    copyButton.disabled = true;
    status.textContent = '';
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(phoneNumber);
          copied = true;
        } catch {
          // APIが拒否されたときも、下の選択によるコピーを試す。
        }
      }
      if (request !== copyRequest || !dialog.open) return;
      if (!copied) copied = copyWithSelection();
      if (!copied) throw new Error('Copy failed');
      status.textContent = 'コピーしました！';
    } catch {
      if (request === copyRequest && dialog.open) {
        status.textContent = 'コピーできませんでした。電話番号を選択してコピーしてください。';
      }
    } finally {
      if (request === copyRequest) copyButton.disabled = false;
    }
  });
})();
