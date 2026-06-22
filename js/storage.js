/* ═══════════════════════════════════════════════════════════════
   ResumeAI – storage.js
   LocalStorage CRUD, auto-save, toast integration
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumeStorage = (() => {
  const STORAGE_KEY = 'resumeai_v1_data';
  const THEME_KEY   = 'resumeai_theme';
  const TMPL_KEY    = 'resumeai_template';

  /* ─── Serialise / Deserialise ─── */
  function saveData(data) {
    try {
      data.meta = { lastSaved: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[ResumeAI] localStorage write failed:', e.message);
      return false;
    }
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[ResumeAI] localStorage read failed:', e.message);
      return null;
    }
  }

  function clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ─── Theme ─── */
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }
  function loadTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  /* ─── Template ─── */
  function saveTemplate(id) {
    localStorage.setItem(TMPL_KEY, String(id));
  }
  function loadTemplate() {
    return parseInt(localStorage.getItem(TMPL_KEY) || '1', 10);
  }

  /* ─── Collect all form data into a structured object ─── */
  function collectFormData() {
    const g = id => document.getElementById(id);
    const gv = id => { const el = g(id); return el ? el.value.trim() : ''; };

    // Personal
    const personal = {
      name:     gv('f-name'),
      role:     gv('f-role'),
      email:    gv('f-email'),
      phone:    gv('f-phone'),
      address:  gv('f-address'),
      linkedin: gv('f-linkedin'),
      github:   gv('f-github'),
      photo:    gv('f-photo'),
    };

    // Objective
    const objective = gv('f-objective');

    // Education
    const education = {
      degree:          gv('f-degree'),
      college:         gv('f-college'),
      year:            gv('f-year'),
      cgpa:            gv('f-cgpa'),
      twelfthSchool:   gv('f-school12'),
      twelfthYear:     gv('f-year12'),
      tenthSchool:     gv('f-school10'),
      tenthYear:       gv('f-year10'),
    };

    // Skills — from skill-tag elements
    const skills = Array.from(
      document.querySelectorAll('#skills-tags-container .skill-tag')
    ).map(el => el.dataset.skill || el.textContent.replace('✕', '').trim());

    // Soft skills — from soft-skill-tag elements
    const softSkills = Array.from(
      document.querySelectorAll('#soft-skills-tags-container .soft-skill-tag')
    ).map(el => el.dataset.skill || el.textContent.replace('✕', '').trim());

    // Languages — dynamic rows
    const languages = Array.from(
      document.querySelectorAll('#languages-container .lang-name')
    )
      .map(el => el.value.trim())
      .filter(Boolean);

    // Projects — dynamic rows
    const projects = [];
    document.querySelectorAll('.project-row').forEach(row => {
      projects.push({
        name:  row.querySelector('.proj-name')?.value.trim() || '',
        desc:  row.querySelector('.proj-desc')?.value.trim() || '',
        tech:  row.querySelector('.proj-tech')?.value.trim() || '',
        live:  row.querySelector('.proj-live')?.value.trim() || '',
        repo:  row.querySelector('.proj-repo')?.value.trim() || '',
      });
    });

    // Experience — dynamic rows
    const experience = [];
    document.querySelectorAll('.experience-row').forEach(row => {
      experience.push({
        role:     row.querySelector('.exp-role')?.value.trim() || '',
        company:  row.querySelector('.exp-company')?.value.trim() || '',
        duration: row.querySelector('.exp-duration')?.value.trim() || '',
        desc:     row.querySelector('.exp-desc')?.value.trim() || '',
      });
    });

    // Certifications — dynamic rows
    const certifications = [];
    document.querySelectorAll('.cert-row').forEach(row => {
      certifications.push({
        name: row.querySelector('.cert-name')?.value.trim() || '',
        org:  row.querySelector('.cert-org')?.value.trim() || '',
        year: row.querySelector('.cert-year')?.value.trim() || '',
      });
    });

    return { personal, objective, education, skills, softSkills, languages, projects, experience, certifications };
  }

  /* ─── Populate form from stored data ─── */
  function populateForm(data) {
    if (!data) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    // Personal
    if (data.personal) {
      setVal('f-name',     data.personal.name);
      setVal('f-role',     data.personal.role);
      setVal('f-email',    data.personal.email);
      setVal('f-phone',    data.personal.phone);
      setVal('f-address',  data.personal.address);
      setVal('f-linkedin', data.personal.linkedin);
      setVal('f-github',   data.personal.github);
      setVal('f-photo',    data.personal.photo);
    }

    // Objective
    if (data.objective !== undefined) {
      const el = document.getElementById('f-objective');
      if (el) {
        el.value = data.objective;
        // Trigger counter update
        el.dispatchEvent(new Event('input'));
      }
    }

    // Education
    if (data.education) {
      setVal('f-degree',  data.education.degree);
      setVal('f-college', data.education.college);
      setVal('f-year',    data.education.year);
      setVal('f-cgpa',    data.education.cgpa);
      setVal('f-school12', data.education.twelfthSchool);
      setVal('f-year12',   data.education.twelfthYear);
      setVal('f-school10', data.education.tenthSchool);
      setVal('f-year10',   data.education.tenthYear);
    }

    // Skills — rebuild tags
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      // Clear existing tags
      const container = document.getElementById('skills-tags-container');
      if (container) container.innerHTML = '';

      data.skills.forEach(skill => {
        // Check preset checkboxes
        const checkbox = document.querySelector(
          `input[name="preset-skill"][value="${CSS.escape(skill)}"]`
        );
        if (checkbox) checkbox.checked = true;
        // Add tag
        if (window.ResumeApp && window.ResumeApp.addSkillTag) {
          window.ResumeApp.addSkillTag(skill, false);
        }
      });
    }

    // Soft skills — rebuild tags
    if (window.ResumeApp && window.ResumeApp.clearSoftSkillTags) {
      window.ResumeApp.clearSoftSkillTags();
    }
    if (Array.isArray(data.softSkills) && data.softSkills.length > 0) {
      data.softSkills.forEach((skill, i) => {
        // Check preset soft-skill checkbox if present
        const checkbox = document.querySelector(
          `input[name="preset-soft-skill"][value="${CSS.escape(skill)}"]`
        );
        if (checkbox) checkbox.checked = true;
        if (window.ResumeApp && window.ResumeApp.addSoftSkillTag) {
          window.ResumeApp.addSoftSkillTag(skill, i === 0);
        }
      });
    }

    // Languages — dynamic rows
    if (Array.isArray(data.languages) && data.languages.length > 0) {
      if (window.ResumeApp && window.ResumeApp.clearLanguageRows) {
        window.ResumeApp.clearLanguageRows();
      }

      data.languages.forEach((language, i) => {
        if (window.ResumeApp && window.ResumeApp.addLanguageRow) {
          window.ResumeApp.addLanguageRow({ language }, i === 0);
        }
      });
    }

    // Projects — dynamic rows
    if (Array.isArray(data.projects) && data.projects.length > 0) {
      if (window.ResumeApp && window.ResumeApp.clearProjectRows) {
        window.ResumeApp.clearProjectRows();
      }
      data.projects.forEach((proj, i) => {
        if (window.ResumeApp && window.ResumeApp.addProjectRow) {
          window.ResumeApp.addProjectRow(proj, i === 0);
        }
      });
    }

    // Experience — dynamic rows
    if (Array.isArray(data.experience) && data.experience.length > 0) {
      if (window.ResumeApp && window.ResumeApp.clearExperienceRows) {
        window.ResumeApp.clearExperienceRows();
      }
      data.experience.forEach((exp, i) => {
        if (window.ResumeApp && window.ResumeApp.addExperienceRow) {
          window.ResumeApp.addExperienceRow(exp, i === 0);
        }
      });
    }

    // Certifications — dynamic rows
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
      if (window.ResumeApp && window.ResumeApp.clearCertRows) {
        window.ResumeApp.clearCertRows();
      }
      data.certifications.forEach((cert, i) => {
        if (window.ResumeApp && window.ResumeApp.addCertRow) {
          window.ResumeApp.addCertRow(cert, i === 0);
        }
      });
    }
  }

  return {
    saveData,
    loadData,
    clearData,
    saveTheme,
    loadTheme,
    saveTemplate,
    loadTemplate,
    collectFormData,
    populateForm,
  };
})();

// Expose globally
window.ResumeStorage = ResumeStorage;
