/* ═══════════════════════════════════════════════════════════════
   ResumeAI – download.js
   PDF export via Browser Print API
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumeDownload = (() => {

  function download() {
    // Basic check — name is required
    const name = document.getElementById('f-name')?.value.trim();
    if (!name) {
      if (window.ResumeUI) {
        window.ResumeUI.showToast('❌ Please enter your name before downloading.', 'error');
      }
      document.getElementById('f-name')?.focus();
      return;
    }

    if (window.ResumeUI) {
      window.ResumeUI.showToast('🖨️ Opening print dialog…', 'info');
    }

    // Store original title, set descriptive one
    const originalTitle = document.title;
    document.title = `${name}_Resume`;

    // Add print mode class — CSS hides everything except preview
    document.body.classList.add('print-mode');

    setTimeout(() => {
      window.print();
      // Restore after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('print-mode');
        document.title = originalTitle;
      }, 1000);
    }, 150);
  }

  function bindButton() {
    const btn = document.getElementById('download-btn');
    if (btn) {
      btn.addEventListener('click', download);
    }
  }

  function init() {
    bindButton();
  }

  return { init, download };
})();

window.ResumeDownload = ResumeDownload;
