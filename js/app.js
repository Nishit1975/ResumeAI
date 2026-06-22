/* ═══════════════════════════════════════════════════════════════
   ResumeAI – app.js
   Main controller / bootstrapper
   Dynamic fields: Technical Skills · Soft Skills · Languages · Projects · Certifications
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════════════════
   GLOBAL APP NAMESPACE (shared with storage.js populateForm)
══════════════════════════════════════════════════════════════ */
const ResumeApp = (() => {

  /* ─── Skill tag management ─── */
  const selectedSkills = new Set();

  function addSkillTag(skill, triggerUpdate = true) {
    const normalized = skill.trim();
    if (!normalized || selectedSkills.has(normalized)) return;
    selectedSkills.add(normalized);

    const container = document.getElementById('skills-tags-container');
    if (!container) return;

    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.dataset.skill = normalized;
    tag.innerHTML = `${escapeHtml(normalized)}<button aria-label="Remove ${escapeHtml(normalized)} skill" title="Remove">✕</button>`;

    tag.querySelector('button').addEventListener('click', () => {
      removeSkillTag(normalized, tag);
    });

    container.appendChild(tag);

    if (triggerUpdate && window.ResumePreview) {
      window.ResumePreview.update();
    }
  }

  function removeSkillTag(skill, tagEl) {
    selectedSkills.delete(skill);
    tagEl?.remove();

    // Uncheck preset checkbox if present
    const checkbox = document.querySelector(
      `input[name="preset-skill"][value="${CSS.escape(skill)}"]`
    );
    if (checkbox) checkbox.checked = false;

    if (window.ResumePreview) window.ResumePreview.update();
  }

  function initSkills() {
    // Preset checkbox toggling
    document.querySelectorAll('input[name="preset-skill"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          addSkillTag(cb.value);
        } else {
          // Find and remove the tag
          const tag = document.querySelector(
            `#skills-tags-container .skill-tag[data-skill="${CSS.escape(cb.value)}"]`
          );
          removeSkillTag(cb.value, tag);
        }
      });
    });

    // Custom skill input
    const customInput = document.getElementById('f-custom-skill');
    const addBtn      = document.getElementById('add-skill-btn');

    function addCustomSkill() {
      const val = customInput?.value.trim();
      if (!val) return;
      addSkillTag(val);
      customInput.value = '';
      customInput.focus();
    }

    addBtn?.addEventListener('click', addCustomSkill);
    customInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomSkill();
      }
    });
  }

  /* ─── Soft skill tag management ─── */
  const selectedSoftSkills = new Set();

  function addSoftSkillTag(skill, triggerUpdate = true) {
    const normalized = skill.trim();
    if (!normalized || selectedSoftSkills.has(normalized)) return;
    selectedSoftSkills.add(normalized);

    const container = document.getElementById('soft-skills-tags-container');
    if (!container) return;

    const tag = document.createElement('span');
    tag.className = 'soft-skill-tag';
    tag.dataset.skill = normalized;
    tag.innerHTML = `${escapeHtml(normalized)}<button aria-label="Remove ${escapeHtml(normalized)} soft skill" title="Remove">✕</button>`;

    tag.querySelector('button').addEventListener('click', () => {
      removeSoftSkillTag(normalized, tag);
    });

    container.appendChild(tag);

    if (triggerUpdate && window.ResumePreview) {
      window.ResumePreview.update();
    }
  }

  function removeSoftSkillTag(skill, tagEl) {
    selectedSoftSkills.delete(skill);
    tagEl?.remove();

    const checkbox = document.querySelector(
      `input[name="preset-soft-skill"][value="${CSS.escape(skill)}"]`
    );
    if (checkbox) checkbox.checked = false;

    if (window.ResumePreview) window.ResumePreview.update();
  }

  function clearSoftSkillTags() {
    const container = document.getElementById('soft-skills-tags-container');
    if (container) container.innerHTML = '';
    selectedSoftSkills.clear();
  }

  /* ─── Language rows ─── */
  let languageCount = 0;

  function addLanguageRow(data = {}, isFirst = false) {
    const container = document.getElementById('languages-container');
    if (!container) return;

    const idx = languageCount++;
    const row = document.createElement('div');
    row.className = 'dynamic-row language-row';

    row.innerHTML = `
      <div class="dynamic-row-header">
        <span class="dynamic-row-title">Language ${idx + 1}</span>
        ${!isFirst ? `<button class="remove-row-btn" aria-label="Remove language ${idx + 1}" title="Remove">✕</button>` : ''}
      </div>
      <div class="form-grid-2">
        <div class="form-group form-group-full">
          <label class="form-label">Language</label>
          <input type="text" class="form-input lang-name" placeholder="e.g. English" value="${escapeAttr(data.language || '')}" />
        </div>
      </div>
    `;

    row.querySelector('.remove-row-btn')?.addEventListener('click', () => {
      row.remove();
      if (window.ResumePreview) window.ResumePreview.update();
    });

    container.appendChild(row);
  }

  function clearLanguageRows() {
    const container = document.getElementById('languages-container');
    if (container) container.innerHTML = '';
    languageCount = 0;
  }

  /* ─── Project rows ─── */
  let projectCount = 0;

  function addProjectRow(data = {}, isFirst = false) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const idx = projectCount++;
    const row = document.createElement('div');
    row.className = 'dynamic-row project-row';

    row.innerHTML = `
      <div class="dynamic-row-header">
        <span class="dynamic-row-title">Project ${idx + 1}</span>
        ${!isFirst ? `<button class="remove-row-btn" aria-label="Remove project ${idx + 1}" title="Remove">✕</button>` : ''}
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input type="text" class="form-input proj-name" placeholder="e.g. E-Commerce Platform" value="${escapeAttr(data.name || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Technologies Used</label>
          <input type="text" class="form-input proj-tech" placeholder="e.g. HTML, CSS, JavaScript" value="${escapeAttr(data.tech || '')}" />
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Description</label>
          <textarea class="form-textarea proj-desc" rows="2" placeholder="Brief description of what it does and your role...">${escapeHtml(data.desc || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Live URL (optional)</label>
          <input type="url" class="form-input proj-live" placeholder="https://myproject.com" value="${escapeAttr(data.live || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">GitHub Repo (optional)</label>
          <input type="url" class="form-input proj-repo" placeholder="https://github.com/user/repo" value="${escapeAttr(data.repo || '')}" />
        </div>
      </div>
    `;

    // Remove button
    row.querySelector('.remove-row-btn')?.addEventListener('click', () => {
      row.remove();
      if (window.ResumePreview) window.ResumePreview.update();
    });

    container.appendChild(row);
  }

  function clearProjectRows() {
    const container = document.getElementById('projects-container');
    if (container) container.innerHTML = '';
    projectCount = 0;
  }

  function initProjects() {
    addProjectRow({}, true); // Default first project row

    document.getElementById('add-project-btn')?.addEventListener('click', () => {
      addProjectRow();
    });
  }

  /* ─── Experience rows ─── */
  let experienceCount = 0;

  function addExperienceRow(data = {}, isFirst = false) {
    const container = document.getElementById('experience-container');
    if (!container) return;

    const idx = experienceCount++;
    const row = document.createElement('div');
    row.className = 'dynamic-row experience-row';

    row.innerHTML = `
      <div class="dynamic-row-header">
        <span class="dynamic-row-title">Experience ${idx + 1}</span>
        ${!isFirst ? `<button class="remove-row-btn" aria-label="Remove experience ${idx + 1}" title="Remove">✕</button>` : ''}
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Role / Title</label>
          <input type="text" class="form-input exp-role" placeholder="e.g. Frontend Developer" value="${escapeAttr(data.role || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Company</label>
          <input type="text" class="form-input exp-company" placeholder="e.g. Acme Corp" value="${escapeAttr(data.company || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Duration</label>
          <input type="text" class="form-input exp-duration" placeholder="e.g. Jan 2023 – Present" value="${escapeAttr(data.duration || '')}" />
        </div>
        <div class="form-group form-group-full">
          <label class="form-label">Description</label>
          <textarea class="form-textarea exp-desc" rows="2" placeholder="Brief description of your responsibilities and achievements...">${escapeHtml(data.desc || '')}</textarea>
        </div>
      </div>
    `;

    row.querySelector('.remove-row-btn')?.addEventListener('click', () => {
      row.remove();
      if (window.ResumePreview) window.ResumePreview.update();
    });

    container.appendChild(row);
  }

  function clearExperienceRows() {
    const container = document.getElementById('experience-container');
    if (container) container.innerHTML = '';
    experienceCount = 0;
  }

  function initExperience() {
    addExperienceRow({}, true); // Default first experience row

    document.getElementById('add-experience-btn')?.addEventListener('click', () => {
      addExperienceRow();
    });
  }

  function initLanguages() {
    addLanguageRow({}, true); // Default first language row

    document.getElementById('add-language-btn')?.addEventListener('click', () => {
      addLanguageRow();
    });
  }

  function initSoftSkills() {
    document.querySelectorAll('input[name="preset-soft-skill"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          addSoftSkillTag(cb.value);
        } else {
          const tag = document.querySelector(
            `#soft-skills-tags-container .soft-skill-tag[data-skill="${CSS.escape(cb.value)}"]`
          );
          removeSoftSkillTag(cb.value, tag);
        }
      });
    });

    const customInput = document.getElementById('f-custom-soft-skill');
    const addBtn = document.getElementById('add-soft-skill-btn');

    function addCustomSoftSkill() {
      const val = customInput?.value.trim();
      if (!val) return;
      addSoftSkillTag(val);
      customInput.value = '';
      customInput.focus();
    }

    addBtn?.addEventListener('click', addCustomSoftSkill);
    customInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomSoftSkill();
      }
    });
  }

  /* ─── Certification rows ─── */
  let certCount = 0;

  function addCertRow(data = {}, isFirst = false) {
    const container = document.getElementById('certs-container');
    if (!container) return;

    const idx = certCount++;
    const row = document.createElement('div');
    row.className = 'dynamic-row cert-row';

    row.innerHTML = `
      <div class="dynamic-row-header">
        <span class="dynamic-row-title">Certification ${idx + 1}</span>
        ${!isFirst ? `<button class="remove-row-btn" aria-label="Remove certification ${idx + 1}">✕</button>` : ''}
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Certification Name</label>
          <input type="text" class="form-input cert-name" placeholder="e.g. Responsive Web Design" value="${escapeAttr(data.name || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Issuing Organization</label>
          <input type="text" class="form-input cert-org" placeholder="e.g. freeCodeCamp" value="${escapeAttr(data.org || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Year</label>
          <input type="text" class="form-input cert-year" placeholder="e.g. 2024" value="${escapeAttr(data.year || '')}" />
        </div>
      </div>
    `;

    row.querySelector('.remove-row-btn')?.addEventListener('click', () => {
      row.remove();
      if (window.ResumePreview) window.ResumePreview.update();
    });

    container.appendChild(row);
  }

  function clearCertRows() {
    const container = document.getElementById('certs-container');
    if (container) container.innerHTML = '';
    certCount = 0;
  }

  function initCertifications() {
    addCertRow({}, true); // Default first row

    document.getElementById('add-cert-btn')?.addEventListener('click', () => {
      addCertRow();
    });
  }

  /* ─── Save / Reset / Auto-save ─── */
  function initSaveReset() {
    // Manual save
    const saveBtn = document.getElementById('save-btn');
    saveBtn?.addEventListener('click', () => {
      if (!window.ResumeStorage) return;
      const data = window.ResumeStorage.collectFormData();
      const ok = window.ResumeStorage.saveData(data);
      if (ok && window.ResumeUI) {
        window.ResumeUI.showToast('✅ Draft saved!', 'success');
      }
    });

    // Reset
    const resetBtn = document.getElementById('reset-btn');
    resetBtn?.addEventListener('click', () => {
      if (!confirm('Are you sure you want to reset all form data? This cannot be undone.')) return;

      window.ResumeStorage?.clearData();

      // Clear all inputs
      document.getElementById('resume-form')?.reset();

      // Clear skill tags
      document.getElementById('skills-tags-container').innerHTML = '';
      selectedSkills.clear();
      document.querySelectorAll('input[name="preset-skill"]').forEach(cb => cb.checked = false);

      clearSoftSkillTags();
      clearLanguageRows();

      // Clear dynamic rows
      document.getElementById('projects-container').innerHTML = '';
      document.getElementById('experience-container').innerHTML = '';
      document.getElementById('certs-container').innerHTML = '';
      projectCount = 0;
      experienceCount = 0;
      certCount = 0;

      // Re-add empty default rows
      addProjectRow({}, true);
      addExperienceRow({}, true);
      addCertRow({}, true);
      addLanguageRow({}, true);

      // Refresh preview
      if (window.ResumePreview) window.ResumePreview.update();

      if (window.ResumeUI) {
        window.ResumeUI.showToast('🗑️ Form cleared.', 'info');
      }
    });

    // Debounce utility
    function debounce(fn, wait) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    // Auto-save every 1.5s after input
    const autoSave = debounce(() => {
      if (!window.ResumeStorage) return;
      const data = window.ResumeStorage.collectFormData();
      window.ResumeStorage.saveData(data);
    }, 1500);

    document.getElementById('resume-form')?.addEventListener('input', autoSave);
    document.getElementById('resume-form')?.addEventListener('change', autoSave);

    const photoInput = document.getElementById('f-photo-upload');
    photoInput?.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      const errorEl = document.getElementById('f-photo-upload-err');
      if (!file) {
        document.getElementById('f-photo').value = '';
        if (window.ResumePreview) window.ResumePreview.update();
        if (errorEl) errorEl.textContent = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        if (errorEl) {
          errorEl.textContent = 'Please upload a JPG, JPEG, or PNG image.';
        }
        photoInput.value = '';
        document.getElementById('f-photo').value = '';
        if (window.ResumePreview) window.ResumePreview.update();
        return;
      }

      if (errorEl) errorEl.textContent = '';
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          document.getElementById('f-photo').value = String(reader.result);
          if (window.ResumePreview) window.ResumePreview.update();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /* ─── Load saved data on startup ─── */
  function loadSavedData() {
    if (!window.ResumeStorage) return;
    const saved = window.ResumeStorage.loadData();
    if (saved) {
      window.ResumeStorage.populateForm(saved);
    }
  }

  /* ─── Helpers ─── */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ═══════════════════════════════════════
     BOOTSTRAP — DOMContentLoaded
  ═══════════════════════════════════════ */
  function init() {
    // Order matters: dynamic fields first, then load data, then preview
    initSkills();
    initSoftSkills();
    initLanguages();
    initProjects();
    initExperience();
    initCertifications();
    initSaveReset();

    // UI & validation
    if (window.ResumeUI)         ResumeUI.init();
    if (window.ResumeValidation) ResumeValidation.bindValidation();
    if (window.ResumeTemplates)  ResumeTemplates.init();
    if (window.ResumeDownload)   ResumeDownload.init();

    // Load saved data (populates form)
    loadSavedData();

    // Init preview last (after data is in DOM)
    if (window.ResumePreview) ResumePreview.init();

    console.log('%c✅ ResumeAI Ready!', 'color: #6C63FF; font-weight: bold; font-size: 14px;');
  }

  // Expose for storage.js populateForm callbacks
  return {
    init,
    addSkillTag,
    addSoftSkillTag,
    clearSoftSkillTags,
    addLanguageRow,
    clearLanguageRows,
    addProjectRow,
    clearProjectRows,
    addExperienceRow,
    clearExperienceRows,
    addCertRow,
    clearCertRows,
    escapeHtml,
    escapeAttr,
  };
})();

// Expose globally
window.ResumeApp = ResumeApp;

// Bootstrap
document.addEventListener('DOMContentLoaded', ResumeApp.init);
