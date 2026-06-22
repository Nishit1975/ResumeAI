/* ═══════════════════════════════════════════════════════════════
   ResumeAI – templates.js
   Template selection UI — buttons + cards + active states
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumeTemplates = (() => {

  function switchTemplate(id) {
    const templateId = parseInt(id, 10);

    // Update preview switcher buttons (in builder panel)
    document.querySelectorAll('.tmpl-btn').forEach(btn => {
      const active = parseInt(btn.dataset.template, 10) === templateId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Update template section cards (in templates-section)
    document.querySelectorAll('.template-card').forEach(card => {
      const active = parseInt(card.dataset.template, 10) === templateId;
      card.classList.toggle('active-template', active);
    });

    // Tell preview to re-render
    if (window.ResumePreview) {
      window.ResumePreview.setTemplate(templateId);
    }

    // Scroll to builder if on template section
    const builderSection = document.getElementById('builder');
    if (builderSection && !isInViewport(builderSection)) {
      // Don't force scroll — user might just be switching
    }
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  function bindButtons() {
    // Preview panel template buttons (P, M, C)
    document.querySelectorAll('.tmpl-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTemplate(btn.dataset.template));
    });

    // Template card "Use Template" buttons
    document.querySelectorAll('.tmpl-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchTemplate(btn.dataset.template);
        // Scroll to builder
        const builder = document.getElementById('builder');
        if (builder) {
          builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (window.ResumeUI) {
          window.ResumeUI.showToast(`✅ Template switched!`, 'success');
        }
      });
    });

    // Clicking anywhere on a template card also selects it
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't double-trigger if button was clicked
        if (e.target.closest('.tmpl-select-btn')) return;
        switchTemplate(card.dataset.template);
      });
      // Keyboard: Enter/Space activates card
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchTemplate(card.dataset.template);
        }
      });
    });

    // Footer template buttons
    document.querySelectorAll('.footer-tmpl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTemplate(btn.dataset.template);
        const builder = document.getElementById('builder');
        if (builder) builder.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function init() {
    bindButtons();
    // Set initial active state from storage
    const saved = window.ResumeStorage?.loadTemplate() || 1;
    switchTemplate(saved);
  }

  return { init, switchTemplate };
})();

window.ResumeTemplates = ResumeTemplates;
