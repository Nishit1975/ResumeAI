/* ═══════════════════════════════════════════════════════════════
   ResumeAI – validation.js
   Real-time per-field + full-form validation engine
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumeValidation = (() => {

  /* ─── Regex Patterns ─── */
  const PATTERNS = {
    email:    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phone:    /^(\+91[\s-]?)?[6-9]\d{9}$|^\+?[\d\s\-().]{7,15}$/,
    url:      /^https?:\/\/.+\..+/,
    linkedin: /linkedin\.com/i,
    github:   /github\.com/i,
  };

  /* ─── Field Rules ─── */
  const RULES = {
    'f-name': {
      required: true,
      min: 2,
      label: 'Full Name',
    },
    'f-email': {
      required: true,
      pattern: PATTERNS.email,
      label: 'Email',
      patternMsg: 'Please enter a valid email address',
    },
    'f-phone': {
      required: true,
      pattern: PATTERNS.phone,
      label: 'Phone',
      patternMsg: 'Please enter a valid phone number',
    },
    'f-linkedin': {
      required: false,
      pattern: PATTERNS.linkedin,
      label: 'LinkedIn URL',
      patternMsg: 'URL must contain linkedin.com',
    },
    'f-github': {
      required: false,
      pattern: PATTERNS.github,
      label: 'GitHub URL',
      patternMsg: 'URL must contain github.com',
    },
    'f-objective': {
      required: true,
      min: 20,
      max: 400,
      label: 'Professional Summary',
    },
    'f-degree': {
      required: true,
      min: 2,
      label: 'Degree',
    },
    'f-college': {
      required: true,
      min: 3,
      label: 'College / University',
    },
  };

  /* ─── Show / Clear error ─── */
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-err`);
    if (!field) return;
    field.classList.add('error');
    field.classList.remove('valid');
    if (errEl) errEl.textContent = message;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-err`);
    if (!field) return;
    field.classList.remove('error');
    field.classList.add('valid');
    if (errEl) errEl.textContent = '';
  }

  function clearAllErrors() {
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(el => {
      el.classList.remove('error', 'valid');
    });
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
    });
  }

  /* ─── Validate a single field ─── */
  function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;

    const rule = RULES[fieldId];
    if (!rule) return true;

    const value = field.value.trim();

    // Required check
    if (rule.required && value === '') {
      showError(fieldId, `${rule.label} is required.`);
      return false;
    }

    // Min length
    if (value && rule.min && value.length < rule.min) {
      showError(fieldId, `${rule.label} must be at least ${rule.min} characters.`);
      return false;
    }

    // Max length
    if (value && rule.max && value.length > rule.max) {
      showError(fieldId, `${rule.label} must not exceed ${rule.max} characters.`);
      return false;
    }

    // Pattern
    if (value && rule.pattern && !rule.pattern.test(value)) {
      showError(fieldId, rule.patternMsg || `Invalid ${rule.label}.`);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  /* ─── Validate the entire form ─── */
  function validateAll() {
    let isValid = true;
    const ruleIds = Object.keys(RULES);

    ruleIds.forEach(id => {
      if (!validateField(id)) isValid = false;
    });

    // At least one skill selected
    const tags = document.querySelectorAll('#skills-tags-container .skill-tag');
    if (tags.length === 0) {
      // Soft warning — not a hard failure
      if (window.ResumeUI) {
        window.ResumeUI.showToast('💡 Tip: Add at least one skill to your resume.', 'info');
      }
    }

    // At least name filled for download
    const name = document.getElementById('f-name')?.value.trim();
    if (!name) {
      if (window.ResumeUI) {
        window.ResumeUI.showToast('Please enter your name before downloading.', 'error');
      }
      return false;
    }

    return isValid;
  }

  /* ─── Bind real-time blur validation ─── */
  function bindValidation() {
    Object.keys(RULES).forEach(id => {
      const field = document.getElementById(id);
      if (!field) return;

      // Validate on blur
      field.addEventListener('blur', () => validateField(id));

      // Clear error on input (after first blur)
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          validateField(id);
        }
      });
    });
  }

  return {
    validateField,
    validateAll,
    bindValidation,
    showError,
    clearError,
    clearAllErrors,
  };
})();

window.ResumeValidation = ResumeValidation;
