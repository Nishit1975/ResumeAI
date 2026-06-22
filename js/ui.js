/* ═══════════════════════════════════════════════════════════════
   ResumeAI – ui.js
   Dark mode · Progress bar · Char counter · Scroll reveal
   Back to top · Mobile menu · FAQ accordion · Toasts · Ripple
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumeUI = (() => {

  /* ══════════════════════════════════════
     1. DARK / LIGHT MODE
  ══════════════════════════════════════ */
  function initTheme() {
    const saved = window.ResumeStorage?.loadTheme() || 'dark';
    applyTheme(saved);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        window.ResumeStorage?.saveTheme(next);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /* ══════════════════════════════════════
     2. CHARACTER COUNTER (Objective)
  ══════════════════════════════════════ */
  function initCharCounter() {
    const textarea  = document.getElementById('f-objective');
    const counter   = document.getElementById('objective-counter');
    if (!textarea || !counter) return;

    const max = parseInt(textarea.getAttribute('maxlength') || 400, 10);

    function updateCounter() {
      const len = textarea.value.length;
      counter.textContent = `${len} / ${max}`;
      counter.className = 'char-counter';
      if (len > max * 0.85) counter.classList.add('warning');
      if (len > max * 0.95) counter.classList.add('danger');
    }

    textarea.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* ══════════════════════════════════════
     3. FORM SECTION ACCORDION
  ══════════════════════════════════════ */
  function initAccordion() {
    document.querySelectorAll('.section-legend').forEach(legend => {
      legend.addEventListener('click', () => toggleSection(legend));
      legend.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSection(legend);
        }
      });
    });
  }

  function toggleSection(legend) {
    const bodyId = legend.getAttribute('aria-controls');
    const body = document.getElementById(bodyId);
    if (!body) return;

    const isExpanded = legend.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      legend.setAttribute('aria-expanded', 'false');
      body.classList.add('collapsed');
    } else {
      legend.setAttribute('aria-expanded', 'true');
      body.classList.remove('collapsed');
    }
  }

  /* ══════════════════════════════════════
     4. FAQ ACCORDION
  ══════════════════════════════════════ */
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const answerId = btn.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);
        if (!answer) return;

        // Close all others
        document.querySelectorAll('.faq-question').forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const otherId = other.getAttribute('aria-controls');
            const otherAnswer = document.getElementById(otherId);
            if (otherAnswer) otherAnswer.classList.remove('open');
          }
        });

        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          answer.classList.remove('open');
        } else {
          btn.setAttribute('aria-expanded', 'true');
          answer.classList.add('open');
        }
      });
    });
  }

  /* ══════════════════════════════════════
     5. MOBILE MENU
  ══════════════════════════════════════ */
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu      = document.getElementById('mobile-menu');
    const closeBtn  = document.getElementById('mobile-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-cta');

    if (!hamburger || !menu) return;

    function openMenu() {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      closeBtn?.focus();
    }

    function closeMenu() {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      hamburger.focus();
    }

    hamburger.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);

    // Close on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Focus trap inside mobile menu
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = menu.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ══════════════════════════════════════
     6. NAVBAR SCROLL EFFECT
  ══════════════════════════════════════ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    function onScroll() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════
     7. BACK TO TOP
  ══════════════════════════════════════ */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════
     8. SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════ */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-fade');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show all
      targets.forEach(el => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    });

    targets.forEach(el => observer.observe(el));
  }

  /* ══════════════════════════════════════
     9. BUTTON RIPPLE EFFECT
  ══════════════════════════════════════ */
  function initRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      const rect = btn.getBoundingClientRect();
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top  = `${e.clientY - rect.top}px`;
      btn.appendChild(ripple);

      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  /* ══════════════════════════════════════
     10. SMOOTH SCROLL for nav links
  ══════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const navH = document.getElementById('navbar')?.offsetHeight || 72;
          const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ══════════════════════════════════════
     11. ACTIVE NAV LINK (scroll spy)
  ══════════════════════════════════════ */
  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${entry.target.id}`);
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => observer.observe(s));
  }

  /* ══════════════════════════════════════
     12. TOAST NOTIFICATIONS
  ══════════════════════════════════════ */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  /* ══════════════════════════════════════
     13. LOADING SPLASH
  ══════════════════════════════════════ */
  function hideSplash() {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('hidden');
        // Remove from DOM after transition
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
      }, 1000);
    }
  }

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  function init() {
    initTheme();
    initCharCounter();
    initAccordion();
    initFAQ();
    initMobileMenu();
    initNavbar();
    initBackToTop();
    initScrollReveal();
    initRipple();
    initSmoothScroll();
    initScrollSpy();
    hideSplash();
  }

  return {
    init,
    showToast,
    applyTheme,
    toggleSection,
  };
})();

window.ResumeUI = ResumeUI;
