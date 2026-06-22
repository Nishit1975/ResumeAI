/* ═══════════════════════════════════════════════════════════════
   ResumeAI – preview.js
   Live resume preview engine — DOM updates without page reload
═══════════════════════════════════════════════════════════════ */

'use strict';

const ResumePreview = (() => {

  let activeTemplate = 1;
  const previewEl = document.getElementById('resume-preview');

  /* ─── Debounce utility ─── */
  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /* ─── Safe text (XSS-safe) ─── */
  const t = (str) => str
    ? String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    : '';

  /* ─── Normalize web URLs for preview links ─── */
  function normalizeUrl(url) {
    const trimmed = String(url || '').trim();
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  /* ─── Build contact row items ─── */
  function contactItem(icon, value, href) {
    if (!value) return '';
    const link = href
      ? `<a href="${t(href)}" target="_blank" rel="noopener">${t(value)}</a>`
      : t(value);
    return `<span class="rv-contact-item">${icon} ${link}</span>`;
  }

  /* ─── Build tag lists ─── */
  function buildTagList(items, className) {
    if (!items || items.length === 0) return '';
    return items.map(item => `<span class="${className}">${t(item)}</span>`).join('');
  }

  function buildSkills(skills) {
    return buildTagList(skills, 'rv-skill-tag');
  }

  function buildSoftSkills(softSkills) {
    return buildTagList(softSkills, 'rv-soft-skill-tag');
  }

  function buildLanguages(languages) {
    return buildTagList(languages, 'rv-language-tag');
  }

  /* ─── Build projects HTML ─── */
  function buildProjects(projects, wrapperClass, itemClass) {
    if (!projects || projects.length === 0) return '';
    return projects.filter(p => p.name).map(p => `
      <div class="${itemClass}">
        <div class="rv-proj-name">${t(p.name)}</div>
        ${p.tech ? `<div class="rv-proj-tech">🔧 ${t(p.tech)}</div>` : ''}
        ${p.desc ? `<div class="rv-proj-desc">${t(p.desc)}</div>` : ''}
      </div>
    `).join('');
  }

  /* ─── Build certifications HTML ─── */
  function buildCerts(certs, cls) {
    if (!certs || certs.length === 0) return '';
    return certs.filter(c => c.name).map(c => `
      <div class="${cls.item}">
        <div>
          <div class="rv-cert-name">${t(c.name)}</div>
          ${c.org ? `<div class="rv-cert-org">${t(c.org)}</div>` : ''}
        </div>
        ${c.year ? `<div class="rv-cert-year">${t(c.year)}</div>` : ''}
      </div>
    `).join('');
  }

  function buildExperience(experience) {
    if (!experience || experience.length === 0) return '';
    return experience.filter(e => e.role || e.company || e.duration || e.desc).map(e => `
      <div class="rv-exp-item">
        <div class="rv-exp-header">
          <div>
            ${e.role ? `<div class="rv-exp-role">${t(e.role)}</div>` : ''}
            ${e.company ? `<div class="rv-exp-company">${t(e.company)}</div>` : ''}
          </div>
          ${e.duration ? `<div class="rv-exp-duration">${t(e.duration)}</div>` : ''}
        </div>
        ${e.desc ? `<div class="rv-exp-desc">${t(e.desc)}</div>` : ''}
      </div>
    `).join('');
  }

  function buildEducationEntries(education) {
    const entries = [];

    if (education.college || education.degree || education.year || education.cgpa) {
      const parts = [];
      if (education.college) parts.push(`<div class="rv-edu-school">${t(education.college)}</div>`);
      
      // Combine degree and expected year on the same line
      if (education.degree) {
        let degreeLine = t(education.degree);
        if (education.year) {
          degreeLine += ` (Expected ${t(education.year)})`;
        }
        parts.push(`<div class="rv-edu-degree">${degreeLine}</div>`);
      }
      
      // CGPA only if provided (optional)
      if (education.cgpa) {
        parts.push(`<div class="rv-edu-meta">(CGPA: ${t(education.cgpa)})</div>`);
      }
      
      entries.push(`<div class="rv-edu-item">${parts.join('')}</div>`);
    }

    if (education.twelfthSchool || education.twelfthYear) {
      const line = [education.twelfthSchool ? t(education.twelfthSchool) : '', education.twelfthYear ? `(${t(education.twelfthYear)})` : '']
        .filter(Boolean)
        .join(' ');
      if (line) {
          const schoolName = education.twelfthSchool ? t(education.twelfthSchool) : '';
          const degreeInfo = 'Higher Secondary Education' + (education.twelfthYear ? ` (${t(education.twelfthYear)})` : '');
          if (schoolName) {
            entries.push(`<div class="rv-edu-item"><div class="rv-edu-school">${schoolName}</div><div class="rv-edu-degree">${degreeInfo}</div></div>`);
          }
      }
    }

    if (education.tenthSchool || education.tenthYear) {
      const line = [education.tenthSchool ? t(education.tenthSchool) : '', education.tenthYear ? `(${t(education.tenthYear)})` : '']
        .filter(Boolean)
        .join(' ');
      if (line) {
          const schoolName = education.tenthSchool ? t(education.tenthSchool) : '';
          const degreeInfo = 'Secondary Education' + (education.tenthYear ? ` (${t(education.tenthYear)})` : '');
          if (schoolName) {
            entries.push(`<div class="rv-edu-item"><div class="rv-edu-school">${schoolName}</div><div class="rv-edu-degree">${degreeInfo}</div></div>`);
          }
      }
    }

    return entries.join('');
  }

  /* ═══════════════════════════════════════════════════════════════
     TEMPLATE 1 — PROFESSIONAL
  ═══════════════════════════════════════════════════════════════ */
  function renderTemplate1(data) {
    const { personal, objective, education, skills, softSkills, languages, projects, certifications } = data;

    const hasContent = personal.name || personal.email;
    if (!hasContent) {
      return `<div class="preview-placeholder">
        <div class="placeholder-icon">📝</div>
        <p>Start filling the form to see your resume here</p>
      </div>`;
    }

    const skillsHtml = buildSkills(skills);
    const softSkillsHtml = buildSoftSkills(softSkills);
    const languagesHtml = buildLanguages(languages);
    const projs = buildProjects(projects, '', 'rv-proj-item');
    const certs = buildCerts(certifications, { item: 'rv-cert-item' });
    const educationHtml = buildEducationEntries(education);

    return `
      <div class="rv-header">
        <div class="rv-name">${t(personal.name) || 'Your Name'}</div>
        ${personal.role ? `<div class="rv-role">${t(personal.role)}</div>` : ''}
        <div class="rv-contact-row">
          ${contactItem('📧', personal.email, `mailto:${personal.email}`)}
          ${contactItem('📞', personal.phone)}
          ${contactItem('📍', personal.address)}
          ${personal.linkedin ? contactItem('🔗', personal.linkedin, normalizeUrl(personal.linkedin)) : ''}
          ${personal.github ? contactItem('🐙', personal.github, normalizeUrl(personal.github)) : ''}
        </div>
      </div>
      <div class="rv-body">
        ${objective ? `
        <div class="rv-section">
          <div class="rv-section-title">Professional Summary</div>
          <p class="rv-objective">${t(objective)}</p>
        </div>` : ''}

        ${skills && skills.length > 0 ? `
        <div class="rv-section">
          <div class="rv-section-title">Technical Skills</div>
          <div class="rv-skills-list">${skillsHtml}</div>
        </div>` : ''}

        ${projs ? `
        <div class="rv-section">
          <div class="rv-section-title">Projects</div>
          ${projs}
        </div>` : ''}

        ${educationHtml ? `
        <div class="rv-section">
          <div class="rv-section-title">Education</div>
          ${educationHtml}
        </div>` : ''}

        ${certs ? `
        <div class="rv-section">
          <div class="rv-section-title">Certifications</div>
          ${certs}
        </div>` : ''}

        ${softSkills && softSkills.length > 0 ? `
        <div class="rv-section">
          <div class="rv-section-title">Soft Skills</div>
          <div class="rv-skills-list">${softSkillsHtml}</div>
        </div>` : ''}

        ${languages && languages.length > 0 ? `
        <div class="rv-section">
          <div class="rv-section-title">Languages</div>
          <div class="rv-languages-list">${languagesHtml}</div>
        </div>` : ''}
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     TEMPLATE 2 — PREMIUM ELEGANT (Single-Column ATS-Friendly)
     Inspired by modern executive resume design with serif typography
     Clean white background · Elegant dividers · Professional spacing
     ─ NO sidebar · NO two-column layout · NO avatar · NO gradients ─
  ═══════════════════════════════════════════════════════════════ */
  function renderTemplate2(data) {
    const { personal, objective, education, skills, softSkills, languages, projects, certifications } = data;

    const hasContent = personal.name || personal.email;
    if (!hasContent) {
      return `<div class="preview-placeholder">
        <div class="placeholder-icon">📝</div>
        <p>Start filling the form to see your resume here</p>
      </div>`;
    }

    // Build HTML components
    const skillsHtml = buildSkills(skills);
    const softSkillsHtml = buildSoftSkills(softSkills);
    const languagesHtml = buildLanguages(languages);
    const projs = buildProjects(projects, '', 'rv-proj-item');
    const certs = buildCerts(certifications, { item: 'rv-cert-item' });
    const educationHtml = buildEducationEntries(education);

    return `
      <!-- ═════════════════════════════════════════════════════════
           ELEGANT HEADER — Name (Serif) + Contact Info (Right)
           ═════════════════════════════════════════════════════════ -->
      <div class="rv-t2-header">
        <div class="rv-t2-header-left">
          <h1 class="rv-t2-name">${t(personal.name) || 'Your Name'}</h1>
          ${personal.role ? `<p class="rv-t2-title">${t(personal.role)}</p>` : ''}
        </div>
        <div class="rv-t2-header-right">
          ${personal.phone    ? `<div class="rv-t2-contact-item">📞 ${t(personal.phone)}</div>` : ''}
          ${personal.email    ? `<div class="rv-t2-contact-item">📧 <a href="mailto:${t(personal.email)}">${t(personal.email)}</a></div>` : ''}
          ${personal.address  ? `<div class="rv-t2-contact-item">📍 ${t(personal.address)}</div>` : ''}
          ${personal.linkedin ? `<div class="rv-t2-contact-item">🔗 <a href="${t(normalizeUrl(personal.linkedin))}" target="_blank" rel="noopener">LinkedIn</a></div>` : ''}
          ${personal.github ? `<div class="rv-t2-contact-item">🐙 <a href="${t(normalizeUrl(personal.github))}" target="_blank" rel="noopener">GitHub</a></div>` : ''}
        </div>
      </div>

      <!-- ═════════════════════════════════════════════════════════
           PROFESSIONAL SUMMARY — Full Width
           ═════════════════════════════════════════════════════════ -->
      ${objective ? `
      <div class="rv-t2-summary-section">
        <p class="rv-t2-objective">${t(objective)}</p>
      </div>` : ''}

      <!-- ═════════════════════════════════════════════════════════
           MAIN CONTENT — Single Column, All Sections
           ═════════════════════════════════════════════════════════ -->
      <div class="rv-t2-body">

        ${skills && skills.length > 0 ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Technical Skills</h2>
          <div class="rv-t2-skills-container">${skillsHtml}</div>
        </section>` : ''}

        ${projs ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Projects</h2>
          <div class="rv-t2-projects-list">${projs}</div>
        </section>` : ''}

        ${educationHtml ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Education</h2>
          <div class="rv-t2-education-list">${educationHtml}</div>
        </section>` : ''}

        ${certs ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Certifications</h2>
          <div class="rv-t2-certifications-list">${certs}</div>
        </section>` : ''}

        ${softSkills && softSkills.length > 0 ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Soft Skills</h2>
          <div class="rv-t2-soft-skills-container">${softSkillsHtml}</div>
        </section>` : ''}

        ${languages && languages.length > 0 ? `
        <section class="rv-t2-section">
          <h2 class="rv-t2-section-title">Languages</h2>
          <div class="rv-t2-languages-container">${languagesHtml}</div>
        </section>` : ''}

      </div><!-- /rv-t2-body -->
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     TEMPLATE 3 — PROFESSIONAL PHOTO CV
     White background · Corporate · ATS-Friendly · Two-column body
     Left 30% sidebar: Contact, Skills, Soft Skills, Languages
     Right 70% main:   Projects, Education, Certifications, Experience
  ═══════════════════════════════════════════════════════════════ */
  function renderTemplate3(data) {
    const { personal, objective, education, skills, softSkills, languages, projects, certifications, experience } = data;

    const hasContent = personal.name || personal.email;
    if (!hasContent) {
      return `<div class="preview-placeholder">
        <div class="placeholder-icon">📝</div>
        <p>Start filling the form to see your resume here</p>
      </div>`;
    }

    const educationHtml  = buildEducationEntries(education);
    const experienceHtml = buildExperience(experience);
    const certs          = buildCerts(certifications, { item: 'rv-t3-cert-item' });

    /* ── Photo (only if uploaded) ── */
    const hasPhoto = personal.photo && String(personal.photo).trim().startsWith('data:image');
    const photoHtml = hasPhoto
      ? `<div class="rv-t3-photo"><img src="${t(personal.photo)}" alt="${t(personal.name)} profile photo" /></div>`
      : '';

    /* ── Technical Skills — clean bullet list ── */
    const skillsHtml = (skills && skills.length > 0)
      ? skills.map(s => `<div class="rv-t3-bullet-item">• ${t(s)}</div>`).join('')
      : '';

    /* ── Soft Skills — clean bullet list ── */
    const softSkillsHtml = (softSkills && softSkills.length > 0)
      ? softSkills.map(s => `<div class="rv-t3-bullet-item">• ${t(s)}</div>`).join('')
      : '';

    /* ── Languages — clean bullet list ── */
    const languagesHtml = (languages && languages.length > 0)
      ? languages.map(l => `<div class="rv-t3-bullet-item">• ${t(l)}</div>`).join('')
      : '';

    /* ── Projects — clean resume format, no cards ── */
    const projHtml = (projects && projects.filter(p => p.name).length > 0)
      ? projects.filter(p => p.name).map(p => `
          <div class="rv-t3-proj-item">
            <div class="rv-t3-proj-name">${t(p.name)}</div>
            ${p.tech ? `<div class="rv-t3-proj-tech">${t(p.tech)}</div>` : ''}
            ${p.desc ? `<div class="rv-t3-proj-desc">${t(p.desc)}</div>` : ''}
          </div>`).join('')
      : '';

    /* ── Contacts ── */
    const emailHtml    = personal.email    ? `<div class="rv-t3-contact-item"><span class="rv-t3-ci-icon">📧</span><a href="mailto:${t(personal.email)}">${t(personal.email)}</a></div>` : '';
    const phoneHtml    = personal.phone    ? `<div class="rv-t3-contact-item"><span class="rv-t3-ci-icon">📞</span>${t(personal.phone)}</div>` : '';
    const addressHtml  = personal.address  ? `<div class="rv-t3-contact-item"><span class="rv-t3-ci-icon">📍</span>${t(personal.address)}</div>` : '';
    const linkedinHtml = personal.linkedin ? `<div class="rv-t3-contact-item"><span class="rv-t3-ci-icon">🔗</span><a href="${t(normalizeUrl(personal.linkedin))}" target="_blank" rel="noopener">LinkedIn</a></div>` : '';
    const githubHtml   = personal.github   ? `<div class="rv-t3-contact-item"><span class="rv-t3-ci-icon">🐙</span><a href="${t(normalizeUrl(personal.github))}" target="_blank" rel="noopener">GitHub</a></div>` : '';
    const contactBlock = emailHtml + phoneHtml + addressHtml + linkedinHtml + githubHtml;

    return `
      <!-- ═══════════════════════ HEADER ═══════════════════════ -->
      <div class="rv-t3-header">
        ${photoHtml}
        <div class="rv-t3-header-text">
          <div class="rv-t3-name">${t(personal.name) || 'Your Name'}</div>
          ${personal.role ? `<div class="rv-t3-role">${t(personal.role)}</div>` : ''}
          ${objective ? `<div class="rv-t3-summary">${t(objective)}</div>` : ''}
        </div>
      </div>

      <!-- ═══════════════════════ BODY ════════════════════════ -->
      <div class="rv-t3-body">

        <!-- LEFT SIDEBAR (30%) -->
        <aside class="rv-t3-left">

          ${contactBlock ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Contact</div>
            ${contactBlock}
          </div>` : ''}

          ${skillsHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Technical Skills</div>
            ${skillsHtml}
          </div>` : ''}

          ${softSkillsHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Soft Skills</div>
            ${softSkillsHtml}
          </div>` : ''}

          ${languagesHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Languages</div>
            ${languagesHtml}
          </div>` : ''}

        </aside>

        <!-- RIGHT MAIN (70%) -->
        <main class="rv-t3-right">

          ${projHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Projects</div>
            ${projHtml}
          </div>` : ''}

          ${educationHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Education</div>
            ${educationHtml}
          </div>` : ''}

          ${certs ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Certifications</div>
            ${certs}
          </div>` : ''}

          ${experienceHtml ? `
          <div class="rv-t3-section">
            <div class="rv-t3-section-title">Experience</div>
            ${experienceHtml}
          </div>` : ''}

        </main>

      </div><!-- /rv-t3-body -->
    `;
  }

  /* ─── Main render dispatcher ─── */
  function render(data, tmpl) {
    if (!previewEl) return;
    const t = tmpl || activeTemplate;

    let html = '';
    if (t === 1) html = renderTemplate1(data);
    else if (t === 2) html = renderTemplate2(data);
    else if (t === 3) html = renderTemplate3(data);

    previewEl.innerHTML = html;
  }

  /* ─── Update preview (collect data → render) ─── */
  function update() {
    if (!window.ResumeStorage) return;
    const data = window.ResumeStorage.collectFormData();
    render(data, activeTemplate);
    updateProgress(data);
  }

  /* ─── Progress bar update ─── */
  function updateProgress(data) {
    const fields = [
      data.personal.name,
      data.personal.email,
      data.personal.phone,
      data.objective,
      data.education.degree,
      data.education.college,
      data.skills && data.skills.length > 0 ? 'yes' : '',
    ];
    const filled = fields.filter(f => f && String(f).trim() !== '').length;
    const pct = Math.round((filled / fields.length) * 100);

    const fill    = document.getElementById('progress-fill');
    const pctText = document.getElementById('progress-percent');
    const container = document.getElementById('progress-container');

    if (fill)    fill.style.width = `${pct}%`;
    if (pctText) pctText.textContent = `${pct}%`;
    if (container) container.setAttribute('aria-valuenow', pct);
  }

  /* ─── Set active template ─── */
  function setTemplate(id) {
    activeTemplate = parseInt(id, 10);
    if (previewEl) {
      previewEl.classList.add('switching');
      setTimeout(() => {
        previewEl.className = `resume-preview tmpl-${activeTemplate}`;
        update();
      }, 180);
    }
    if (window.ResumeStorage) {
      window.ResumeStorage.saveTemplate(activeTemplate);
    }
  }

  /* ─── Bind input listeners ─── */
  function bindListeners() {
    const debouncedUpdate = debounce(update, 120);

    // Observe all current inputs
    function attachToInputs() {
      document.querySelectorAll(
        '#resume-form input, #resume-form textarea, #resume-form select'
      ).forEach(el => {
        // Avoid double-binding
        if (el.dataset.previewBound) return;
        el.dataset.previewBound = '1';
        el.addEventListener('input',  debouncedUpdate);
        el.addEventListener('change', debouncedUpdate);
      });
    }

    // Initial bind
    attachToInputs();

    // Re-bind when dynamic rows are added (MutationObserver)
    const formEl = document.getElementById('resume-form');
    if (formEl) {
      const observer = new MutationObserver(() => {
        attachToInputs();
        debouncedUpdate();
      });
      observer.observe(formEl, { childList: true, subtree: true });
    }
  }

  /* ─── Init ─── */
  function init() {
    const savedTmpl = window.ResumeStorage?.loadTemplate() || 1;
    setTemplate(savedTmpl);
    bindListeners();
    update();
  }

  return { init, update, setTemplate, getTemplate: () => activeTemplate };
})();

window.ResumePreview = ResumePreview;
