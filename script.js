// ───────────── TRANSLATIONS (simplified) ─────────────
const translations = {
    en: { reset: 'Reset', exportPdf: 'PDF', print: 'Print', moreExports: 'More', import: 'Import', tabResume: 'Resume', tabCover: 'Cover Letter', tabOther: 'Other Letter', tabAts: 'ATS Score', template: 'Template', personalInfo: 'Personal Info', profSummary: 'Professional Summary', education: 'Education', experience: 'Experience', skills: 'Skills', skillsLabel: 'Skills (comma separated)', letterDetails: 'Letter Details', otherLetter: 'Other Letter', styleCustom: 'Style Customization', fullName: 'Full Name', jobTitle: 'Job Title', email: 'Email', phone: 'Phone', location: 'Location', linkedin: 'LinkedIn', companyName: 'Company Name', hiringManager: 'Hiring Manager', letterBody: 'Letter Body', recipient: 'Recipient', customBody: 'Custom Body', accentColor: 'Accent Color', fontFamily: 'Font Family', additionalSections: 'Additional Sections', certifications: 'Certifications', projects: 'Projects', languages: 'Languages', awards: 'Awards & Achievements', addEdu: 'Add Education', addExp: 'Add Experience', livePreview: 'Live Preview', copy: 'Copy', pdf: 'PDF', png: 'PNG', browseTemplates: 'Browse More Templates', attn: 'Attn:', sincerely: 'Sincerely,', to: 'To:', optRecommendation: 'Recommendation', optInquiry: 'Inquiry', optFollowup: 'Follow-up', optResignation: 'Resignation', optReference: 'Reference', atsScore: 'ATS Score', promptSchool: 'School / University:', promptDegree: 'Degree:', promptYear: 'Year (e.g. 2018–2022):', promptCompany: 'Company:', promptRole: 'Role:', promptYearExp: 'Year (e.g. 2020–Present):', promptDesc: 'Description (optional):', toastAdded: 'added', toastReset: 'Reset to defaults (cleared)', toastCopied: 'Copied to clipboard!', toastPDF: 'PDF downloaded!', toastError: 'Error generating PDF. Try Print instead.', toastGenerating: 'Generating PDF...', toastQR: 'QR Code generated!', toastLink: 'Shareable link copied to clipboard!', toastDocx: 'DOCX downloaded!', toastHTML: 'HTML downloaded!', toastMarkdown: 'Markdown downloaded!', toastJSON: 'JSON downloaded!', toastTXT: 'TXT downloaded!', toastPNG: 'PNG downloaded!', toastImport: 'Imported successfully!', toastDark: 'Dark mode toggled!' },
    fil: { reset: 'I-reset', exportPdf: 'PDF', print: 'I-print', moreExports: 'Higit pa', import: 'Mag-import', tabResume: 'Resume', tabCover: 'Liham ng Pag-apply', tabOther: 'Iba pang Liham', tabAts: 'ATS Score', template: 'Template', personalInfo: 'Impormasyon ng Personal', profSummary: 'Buod ng Propesyonal', education: 'Edukasyon', experience: 'Karanasan', skills: 'Kakayahan', skillsLabel: 'Kakayahan (pinaghihiwalay ng kuwit)', letterDetails: 'Detalye ng Liham', otherLetter: 'Iba pang Liham', styleCustom: 'Pag-customize ng Estilo', fullName: 'Buong Pangalan', jobTitle: 'Titulo ng Trabaho', email: 'Email', phone: 'Telepono', location: 'Lokasyon', linkedin: 'LinkedIn', companyName: 'Pangalan ng Kumpanya', hiringManager: 'Tagapamahala ng Hiring', letterBody: 'Katawan ng Liham', recipient: 'Tatanggap', customBody: 'Pasadyang Katawan', accentColor: 'Kulay ng Accent', fontFamily: 'Pamilya ng Font', additionalSections: 'Karagdagang Seksyon', certifications: 'Mga Sertipikasyon', projects: 'Mga Proyekto', languages: 'Mga Wika', awards: 'Mga Parangal', addEdu: 'Idagdag ang Edukasyon', addExp: 'Idagdag ang Karanasan', livePreview: 'Live na Preview', copy: 'Kopyahin', pdf: 'PDF', png: 'PNG', browseTemplates: 'Tumingin ng Iba pang Template', attn: 'Para kay:', sincerely: 'Lubos na gumagalang,', to: 'Para sa:', optRecommendation: 'Rekomendasyon', optInquiry: 'Pagtatanong', optFollowup: 'Pag-follow up', optResignation: 'Pagbitiw', optReference: 'Sanggunian', atsScore: 'ATS Score', promptSchool: 'Paaralan / Unibersidad:', promptDegree: 'Degree:', promptYear: 'Taon (hal. 2018–2022):', promptCompany: 'Kumpanya:', promptRole: 'Tungkulin:', promptYearExp: 'Taon (hal. 2020–Kasalukuyan):', promptDesc: 'Paglalarawan (opsyonal):', toastAdded: 'naidagdag', toastReset: 'Na-reset sa default (nabura)', toastCopied: 'Nakopya sa clipboard!', toastPDF: 'Na-download ang PDF!', toastError: 'Error sa pag-generate ng PDF. Subukan ang Print.', toastGenerating: 'Gumagawa ng PDF...', toastQR: 'Na-generate ang QR Code!', toastLink: 'Na-copy ang shareable link!', toastDocx: 'Na-download ang DOCX!', toastHTML: 'Na-download ang HTML!', toastMarkdown: 'Na-download ang Markdown!', toastJSON: 'Na-download ang JSON!', toastTXT: 'Na-download ang TXT!', toastPNG: 'Na-download ang PNG!', toastImport: 'Na-import nang matagumpay!', toastDark: 'Nagpalit ng dark mode!' }
};

let currentLang = 'en';
let educations = [];
let experiences = [];
let darkMode = false;

const STORAGE_KEYS = {
    educations: 'proresume_educations',
    experiences: 'proresume_experiences',
    formData: 'proresume_formData',
    style: 'proresume_style',
    darkMode: 'proresume_darkMode'
};

// ───────────── SAVE / LOAD ─────────────
function saveToLocalStorage() {
    const formData = {
        fullName: document.getElementById('fullName').value,
        jobTitle: document.getElementById('jobTitle').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        linkedin: document.getElementById('linkedin').value,
        summary: document.getElementById('summary').value,
        skillsInput: document.getElementById('skillsInput').value,
        companyName: document.getElementById('companyName').value,
        hiringManager: document.getElementById('hiringManager').value,
        letterBody: document.getElementById('letterBody').value,
        otherRecipient: document.getElementById('otherRecipient').value,
        otherLetterBody: document.getElementById('otherLetterBody').value,
        otherLetterType: document.getElementById('otherLetterType').value,
        template: document.getElementById('templateSelect').value,
        showCertifications: document.getElementById('showCertifications').checked,
        certifications: document.getElementById('certifications').value,
        showProjects: document.getElementById('showProjects').checked,
        projects: document.getElementById('projects').value,
        showLanguages: document.getElementById('showLanguages').checked,
        languages: document.getElementById('languages').value,
        showAwards: document.getElementById('showAwards').checked,
        awards: document.getElementById('awards').value
    };
    localStorage.setItem(STORAGE_KEYS.formData, JSON.stringify(formData));
    localStorage.setItem(STORAGE_KEYS.educations, JSON.stringify(educations));
    localStorage.setItem(STORAGE_KEYS.experiences, JSON.stringify(experiences));
    const style = {
        accentColor: document.getElementById('accentColor').value,
        fontFamily: document.getElementById('fontFamily').value
    };
    localStorage.setItem(STORAGE_KEYS.style, JSON.stringify(style));
    localStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(darkMode));
}

function loadFromLocalStorage() {
    const formDataStr = localStorage.getItem(STORAGE_KEYS.formData);
    if (formDataStr) {
        const formData = JSON.parse(formDataStr);
        for (const [key, value] of Object.entries(formData)) {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'checkbox') el.checked = value;
                else el.value = value;
            }
        }
    } else {
        setDefaults();
    }

    const eduStr = localStorage.getItem(STORAGE_KEYS.educations);
    if (eduStr) educations = JSON.parse(eduStr);
    else educations = [];

    const expStr = localStorage.getItem(STORAGE_KEYS.experiences);
    if (expStr) experiences = JSON.parse(expStr);
    else experiences = [];

    const styleStr = localStorage.getItem(STORAGE_KEYS.style);
    if (styleStr) {
        const style = JSON.parse(styleStr);
        document.getElementById('accentColor').value = style.accentColor || '#2563eb';
        document.getElementById('fontFamily').value = style.fontFamily || "'Inter', sans-serif";
    }

    const darkStr = localStorage.getItem(STORAGE_KEYS.darkMode);
    if (darkStr !== null) {
        darkMode = JSON.parse(darkStr);
        if (darkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        updateDarkIcon();
    }
}

function setDefaults() {
    document.getElementById('fullName').value = '';
    document.getElementById('jobTitle').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('location').value = '';
    document.getElementById('linkedin').value = '';
    document.getElementById('summary').value = '';
    document.getElementById('skillsInput').value = '';
    document.getElementById('companyName').value = '';
    document.getElementById('hiringManager').value = '';
    document.getElementById('letterBody').value = '';
    document.getElementById('otherRecipient').value = '';
    document.getElementById('otherLetterBody').value = '';
    document.getElementById('otherLetterType').value = 'recommendation';
    document.getElementById('templateSelect').value = 'classic';
    document.getElementById('showCertifications').checked = false;
    document.getElementById('certifications').value = '';
    document.getElementById('showProjects').checked = false;
    document.getElementById('projects').value = '';
    document.getElementById('showLanguages').checked = false;
    document.getElementById('languages').value = '';
    document.getElementById('showAwards').checked = false;
    document.getElementById('awards').value = '';
    document.getElementById('accentColor').value = '#2563eb';
    document.getElementById('fontFamily').value = "'Inter', sans-serif";
}

// ───────────── RENDER FUNCTIONS ─────────────
function renderEducation() {
    const container = document.getElementById('eduList');
    container.innerHTML = '';
    educations.forEach((edu, idx) => {
        const div = document.createElement('div');
        div.className = 'entry-item';
        div.draggable = true;
        div.dataset.index = idx;
        div.innerHTML = `
            <span class="drag-handle"><i class="fas fa-grip-lines"></i></span>
            <div class="info">
                ${edu.school}
                <small>${edu.degree} &middot; ${edu.year}</small>
            </div>
            <button class="del" onclick="removeEducation(${idx})"><i class="fas fa-times"></i></button>
        `;
        div.addEventListener('dragstart', onDragStart);
        div.addEventListener('dragover', onDragOver);
        div.addEventListener('drop', onDrop);
        div.addEventListener('dragend', onDragEnd);
        container.appendChild(div);
    });
    saveToLocalStorage();
    updatePreview();
}

function renderExperience() {
    const container = document.getElementById('expList');
    container.innerHTML = '';
    experiences.forEach((exp, idx) => {
        const div = document.createElement('div');
        div.className = 'entry-item';
        div.draggable = true;
        div.dataset.index = idx;
        div.innerHTML = `
            <span class="drag-handle"><i class="fas fa-grip-lines"></i></span>
            <div class="info">
                ${exp.company}
                <small>${exp.role} &middot; ${exp.year}</small>
            </div>
            <button class="del" onclick="removeExperience(${idx})"><i class="fas fa-times"></i></button>
        `;
        div.addEventListener('dragstart', onDragStart);
        div.addEventListener('dragover', onDragOver);
        div.addEventListener('drop', onDrop);
        div.addEventListener('dragend', onDragEnd);
        container.appendChild(div);
    });
    saveToLocalStorage();
    updatePreview();
}

let draggedItem = null;
function onDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}
function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}
function onDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (!draggedItem || draggedItem === this) return;
    const parent = this.parentNode;
    const fromIndex = parseInt(draggedItem.dataset.index);
    const toIndex = parseInt(this.dataset.index);
    const listName = parent.id === 'eduList' ? 'educations' : 'experiences';
    if (listName === 'educations') {
        const [removed] = educations.splice(fromIndex, 1);
        educations.splice(toIndex, 0, removed);
        renderEducation();
    } else {
        const [removed] = experiences.splice(fromIndex, 1);
        experiences.splice(toIndex, 0, removed);
        renderExperience();
    }
}
function onDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.entry-item').forEach(el => el.classList.remove('drag-over'));
}

function addEducation() {
    const t = translations[currentLang];
    const school = prompt(t.promptSchool);
    if (!school) return;
    const degree = prompt(t.promptDegree) || '';
    const year = prompt(t.promptYear) || '';
    educations.push({ school, degree, year });
    renderEducation();
    showToast('Education ' + (t.toastAdded || 'added'));
}

function removeEducation(idx) {
    educations.splice(idx, 1);
    renderEducation();
}

function addExperience() {
    const t = translations[currentLang];
    const company = prompt(t.promptCompany);
    if (!company) return;
    const role = prompt(t.promptRole) || '';
    const year = prompt(t.promptYearExp) || '';
    const desc = prompt(t.promptDesc) || '';
    experiences.push({ company, role, year, desc });
    renderExperience();
    showToast('Experience ' + (t.toastAdded || 'added'));
}

function removeExperience(idx) {
    experiences.splice(idx, 1);
    renderExperience();
}

// ───────────── STYLE ─────────────
function applyStyle() {
    const accent = document.getElementById('accentColor').value;
    const font = document.getElementById('fontFamily').value;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--font-family', font);
    document.querySelector('.app-header h1 span').style.color = accent;
    saveToLocalStorage();
    updatePreview();
}

// ───────────── DARK MODE ─────────────
function toggleDarkMode() {
    darkMode = !darkMode;
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    updateDarkIcon();
    localStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(darkMode));
    showToast(translations[currentLang].toastDark || 'Dark mode toggled!');
}
function updateDarkIcon() {
    const btn = document.getElementById('darkModeToggle');
    if (darkMode) btn.innerHTML = '<i class="fas fa-sun"></i>';
    else btn.innerHTML = '<i class="fas fa-moon"></i>';
}

// ───────────── UPDATE PREVIEW ─────────────
function updatePreview() {
    const name = document.getElementById('fullName').value || 'Your Name';
    const title = document.getElementById('jobTitle').value || 'Job Title';
    const email = document.getElementById('email').value || '';
    const phone = document.getElementById('phone').value || '';
    const location = document.getElementById('location').value || '';
    const linkedin = document.getElementById('linkedin').value || '';
    const summary = document.getElementById('summary').value || 'Professional summary goes here.';
    const skillsRaw = document.getElementById('skillsInput').value || '';
    const template = document.getElementById('templateSelect').value;
    const showCert = document.getElementById('showCertifications').checked;
    const certs = document.getElementById('certifications').value || '';
    const showProj = document.getElementById('showProjects').checked;
    const projects = document.getElementById('projects').value || '';
    const showLang = document.getElementById('showLanguages').checked;
    const languages = document.getElementById('languages').value || '';
    const showAward = document.getElementById('showAwards').checked;
    const awards = document.getElementById('awards').value || '';

    const preview = document.getElementById('resume-preview');
    preview.setAttribute('data-template', template);

    // Simplified template rendering (just classic for brevity, but you can expand)
    // For full template support, use the previous extensive logic. Here we'll output a clean version.
    // To save space, I'll include a basic but functional template.
    let html = `
        <div class="resume-name">${name}</div>
        <div class="resume-title">${title}</div>
        <div class="resume-contact">
            ${email ? `<span><i class="fas fa-envelope"></i> ${email}</span>` : ''}
            ${phone ? `<span><i class="fas fa-phone"></i> ${phone}</span>` : ''}
            ${location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : ''}
            ${linkedin ? `<span><i class="fab fa-linkedin"></i> ${linkedin}</span>` : ''}
        </div>
        <div class="resume-summary">${summary}</div>
        <div class="resume-section"><h4><i class="fas fa-graduation-cap"></i> Education</h4>
            ${educations.map(e => `<div class="resume-edu-item"><div class="head"><span class="org">${e.school}</span><span class="date">${e.year}</span></div><div class="sub">${e.degree}</div></div>`).join('')}
        </div>
        <div class="resume-section"><h4><i class="fas fa-briefcase"></i> Experience</h4>
            ${experiences.map(e => `
                <div class="resume-exp-item">
                    <div class="head"><span class="org">${e.company}</span><span class="date">${e.year}</span></div>
                    <div class="sub">${e.role}</div>
                    ${e.desc ? `<div class="desc">${e.desc}</div>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="resume-section"><h4><i class="fas fa-tools"></i> Skills</h4>
            <div class="resume-skills">${skillsRaw.split(',').map(s => s.trim()).filter(s => s).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
        </div>
        ${showCert && certs ? `<div class="resume-section"><h4><i class="fas fa-certificate"></i> Certifications</h4><div style="font-size:12px;">${certs.split(',').map(c => c.trim()).filter(c=>c).map(c => `<span style="background:var(--bg-secondary);padding:2px 10px;border-radius:20px;font-size:11px;display:inline-block;margin:2px 4px 2px 0;">${c}</span>`).join('')}</div></div>` : ''}
        ${showProj && projects ? `<div class="resume-section"><h4><i class="fas fa-project-diagram"></i> Projects</h4><div style="font-size:12px;">${projects.split(',').map(p => p.trim()).filter(p=>p).map(p => `<span style="background:var(--bg-secondary);padding:2px 10px;border-radius:20px;font-size:11px;display:inline-block;margin:2px 4px 2px 0;">${p}</span>`).join('')}</div></div>` : ''}
        ${showLang && languages ? `<div class="resume-section"><h4><i class="fas fa-language"></i> Languages</h4><div style="font-size:12px;">${languages.split(',').map(l => l.trim()).filter(l=>l).map(l => `<span style="background:var(--bg-secondary);padding:2px 10px;border-radius:20px;font-size:11px;display:inline-block;margin:2px 4px 2px 0;">${l}</span>`).join('')}</div></div>` : ''}
        ${showAward && awards ? `<div class="resume-section"><h4><i class="fas fa-trophy"></i> Awards</h4><div style="font-size:12px;">${awards.split(',').map(a => a.trim()).filter(a=>a).map(a => `<span style="background:var(--bg-secondary);padding:2px 10px;border-radius:20px;font-size:11px;display:inline-block;margin:2px 4px 2px 0;">${a}</span>`).join('')}</div></div>` : ''}
    `;
    preview.innerHTML = html;
    updateCoverLetter();
    updateOtherLetter();
    saveToLocalStorage();
    checkATS();
}

// ───────────── COVER LETTER ─────────────
function updateCoverLetter() {
    const name = document.getElementById('fullName').value || 'Your Name';
    const title = document.getElementById('jobTitle').value || 'Job Title';
    const email = document.getElementById('email').value || '';
    const phone = document.getElementById('phone').value || '';
    const company = document.getElementById('companyName').value || 'Company Name';
    const manager = document.getElementById('hiringManager').value || '';
    const body = document.getElementById('letterBody').value || 'Your cover letter content goes here.';
    const t = translations[currentLang];

    document.getElementById('clName').textContent = name;
    document.getElementById('clTitle').textContent = title;
    document.getElementById('clEmail').textContent = email || 'your@email.com';
    document.getElementById('clPhone').textContent = phone || '+63 912 345 6789';
    document.getElementById('clCompany').textContent = company;
    const attnEl = document.getElementById('clManager');
    attnEl.textContent = manager ? `${t.attn || 'Attn:'} ${manager}` : '';
    document.getElementById('clBody').textContent = body;
    document.getElementById('clFooterName').textContent = name;
}

// ───────────── OTHER LETTER ─────────────
function updateOtherLetter() {
    const name = document.getElementById('fullName').value || 'Your Name';
    const typeSelect = document.getElementById('otherLetterType');
    const type = typeSelect.options[typeSelect.selectedIndex].text;
    const recipient = document.getElementById('otherRecipient').value || 'Recipient Name';
    const body = document.getElementById('otherLetterBody').value || 'Your letter content goes here.';

    document.getElementById('olType').textContent = type + ' Letter';
    document.getElementById('olRecipient').textContent = recipient;
    document.getElementById('olBody').textContent = body;
    document.getElementById('olFooterName').textContent = name;
}

// ───────────── ATS CHECKER ─────────────
function checkATS() {
    const name = document.getElementById('fullName').value || '';
    const email = document.getElementById('email').value || '';
    const phone = document.getElementById('phone').value || '';
    const summary = document.getElementById('summary').value || '';
    const skills = document.getElementById('skillsInput').value || '';
    const expText = experiences.map(e => e.desc || '').join(' ');
    const fullText = name + ' ' + summary + ' ' + expText + ' ' + skills;

    let score = 0;
    const tips = [];

    if (email && phone) { score += 15; } else { tips.push('Add both email and phone number for recruiters to contact you.'); }
    if (summary.length > 50) { score += 15; } else { tips.push('Write a detailed professional summary (at least 50 characters).'); }
    const skillList = skills.split(',').filter(s => s.trim());
    if (skillList.length >= 5) { score += 15; } else { tips.push('Add at least 5 skills relevant to your field.'); }
    const actionVerbs = ['led', 'managed', 'developed', 'created', 'improved', 'implemented', 'designed', 'built', 'spearheaded', 'achieved', 'increased', 'reduced', 'delivered', 'coordinated', 'launched'];
    let verbCount = 0;
    actionVerbs.forEach(v => { if (fullText.toLowerCase().includes(v)) verbCount++; });
    if (verbCount >= 3) { score += 15; } else { tips.push('Use more action verbs (e.g., Led, Developed, Implemented) in your experience descriptions.'); }
    if (experiences.some(e => e.desc && e.desc.length > 20)) { score += 15; } else { tips.push('Add detailed descriptions to your experience (at least 20 characters each).'); }
    if (educations.length > 0) { score += 10; } else { tips.push('Add your educational background.'); }
    const wordCount = fullText.split(/\s+/).length;
    if (wordCount > 150) { score += 15; } else { tips.push('Make your resume more substantial (aim for 200+ words total).'); }
    score = Math.min(100, score);

    const container = document.getElementById('atsScoreContainer');
    const detailed = document.getElementById('atsDetailedResult');
    const tipsList = document.getElementById('atsTips');

    if (document.querySelector('.tab-btn.active')?.dataset.tab === 'ats') {
        const color = score >= 70 ? 'ats-good' : (score >= 40 ? 'ats-ok' : 'ats-bad');
        const label = score >= 70 ? 'Excellent!' : (score >= 40 ? 'Good' : 'Needs Improvement');
        detailed.innerHTML = `
            <div style="text-align:center;padding:14px;">
                <div class="ats-score-circle ${color}">${score}%</div>
                <div style="font-size:17px;font-weight:600;margin-top:4px;">${label}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${score >= 70 ? 'Your resume is well-optimized for ATS systems.' : (score >= 40 ? 'Your resume has good potential but can be improved.' : 'Your resume needs significant improvement for ATS.')}</div>
            </div>
        `;
        tipsList.innerHTML = tips.map(t => `<li class="ats-tip"><i class="fas fa-lightbulb"></i> ${t}</li>`).join('');
        if (tips.length === 0) tipsList.innerHTML = '<li class="ats-tip"><i class="fas fa-check-circle" style="color:#059669;"></i> All criteria met! Great job!</li>';
    }
    window._atsData = { score, tips };
}

// ───────────── TAB SWITCH (FIXED) ─────────────
function switchTab(tab) {
    // Update active button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');

    // Hide all previews
    document.getElementById('resume-preview').style.display = 'none';
    document.getElementById('cover-letter-preview').style.display = 'none';
    document.getElementById('other-letter-preview').style.display = 'none';
    document.getElementById('ats-preview').style.display = 'none';

    // Show selected
    if (tab === 'resume') {
        document.getElementById('resume-preview').style.display = 'block';
        document.querySelector('.preview-header h2').innerHTML = '<i class="fas fa-eye" style="color:var(--accent);"></i> Resume Preview';
        updatePreview();
    } else if (tab === 'cover') {
        document.getElementById('cover-letter-preview').style.display = 'block';
        document.querySelector('.preview-header h2').innerHTML = '<i class="fas fa-eye" style="color:var(--accent);"></i> Cover Letter';
        updateCoverLetter();
    } else if (tab === 'other') {
        document.getElementById('other-letter-preview').style.display = 'block';
        document.querySelector('.preview-header h2').innerHTML = '<i class="fas fa-eye" style="color:var(--accent);"></i> Other Letter';
        updateOtherLetter();
    } else if (tab === 'ats') {
        document.getElementById('ats-preview').style.display = 'block';
        document.querySelector('.preview-header h2').innerHTML = '<i class="fas fa-eye" style="color:var(--accent);"></i> ATS Score';
        checkATS();
        // Show the score inside the ats-preview
        const container = document.getElementById('atsScoreContainer');
        if (container) container.style.display = 'block';
        // But we use atsDetailedResult and atsTips directly
        // We'll also display the score in the dedicated ats-preview
        // Since we already have atsDetailedResult, it's fine.
    }
}

// ───────────── AI WRITING ASSISTANT ─────────────
function showAIPrompt(fieldId) {
    const phrases = [
        'Led a team of [number] [role] to achieve [result].',
        'Developed and implemented [solution] that improved [metric] by [percentage]%.',
        'Spearheaded the creation of [product/service], resulting in [outcome].',
        'Managed [budget/project] of [amount] and delivered ahead of schedule.',
        'Designed and executed [strategy] that increased [metric] by [percentage]%.',
        'Built [system/app] using [technologies] for [purpose].',
        'Collaborated with cross-functional teams to [achieve goal].',
        'Improved efficiency by streamlining [process], saving [time/money].',
        'Mentored [number] junior developers, improving team productivity.',
        'Created [documentation/training] materials that reduced onboarding time by [percentage]%.'
    ];

    const modal = document.getElementById('aiModal');
    const container = document.getElementById('aiPhrases');
    container.innerHTML = '';
    phrases.forEach(p => {
        const btn = document.createElement('button');
        btn.textContent = p;
        btn.onclick = () => {
            const field = document.getElementById(fieldId);
            field.value += (field.value ? '\n' : '') + p;
            field.dispatchEvent(new Event('input'));
            modal.style.display = 'none';
            saveAndUpdate();
        };
        container.appendChild(btn);
    });
    modal.style.display = 'flex';
}

document.getElementById('aiModal')?.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});

// ───────────── EXPORT FUNCTIONS ─────────────
function getActiveElement() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let element = document.getElementById('resume-preview');
    let name = 'resume';
    if (activeTab === 'cover') { element = document.getElementById('cover-letter-preview'); name = 'cover-letter'; }
    else if (activeTab === 'other') { element = document.getElementById('other-letter-preview'); name = 'other-letter'; }
    else if (activeTab === 'ats') { element = document.getElementById('ats-preview'); name = 'ats-report'; }
    return { element, name, activeTab };
}

function getFormData() {
    return {
        name: document.getElementById('fullName').value || 'Your Name',
        title: document.getElementById('jobTitle').value || 'Job Title',
        email: document.getElementById('email').value || '',
        phone: document.getElementById('phone').value || '',
        location: document.getElementById('location').value || '',
        linkedin: document.getElementById('linkedin').value || '',
        summary: document.getElementById('summary').value || '',
        skills: document.getElementById('skillsInput').value || '',
        company: document.getElementById('companyName').value || '',
        manager: document.getElementById('hiringManager').value || '',
        letterBody: document.getElementById('letterBody').value || '',
        otherRecipient: document.getElementById('otherRecipient').value || '',
        otherLetterBody: document.getElementById('otherLetterBody').value || '',
        otherLetterType: document.getElementById('otherLetterType').value,
        educations: educations,
        experiences: experiences,
        template: document.getElementById('templateSelect').value,
        certifications: document.getElementById('certifications').value || '',
        projects: document.getElementById('projects').value || '',
        languages: document.getElementById('languages').value || '',
        awards: document.getElementById('awards').value || ''
    };
}

function exportPDF() {
    const { element, name } = getActiveElement();
    const t = translations[currentLang];
    if (name === 'ats-report') { showToast(t.toastError || 'ATS report cannot be exported as PDF.'); return; }
    showToast(t.toastGenerating || 'Generating PDF...');
    const opt = {
        margin: [0.6, 0.6, 0.6, 0.6],
        filename: name + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
        showToast(t.toastPDF || 'PDF downloaded!');
    }).catch(() => {
        showToast(t.toastError || 'Error generating PDF. Try Print instead.');
    });
}

function exportPNG() {
    const { element, name } = getActiveElement();
    const t = translations[currentLang];
    if (name === 'ats-report') { showToast('ATS report cannot be exported as PNG.'); return; }
    showToast('Generating PNG...');
    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = name + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast(t.toastPNG || 'PNG downloaded!');
    }).catch(() => showToast('Error generating PNG.'));
}

function exportDOCX() {
    const { element, name } = getActiveElement();
    const t = translations[currentLang];
    if (name === 'ats-report') { showToast('ATS report cannot be exported as DOCX.'); return; }
    const styles = `
        body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
        .resume-name { font-size: 26px; font-weight: 700; color: #0f172a; }
        .resume-title { font-size: 15px; color: #2563eb; font-weight: 500; }
        .resume-contact { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #475569; margin: 6px 0 14px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        .resume-summary { background: #f8fafc; padding: 12px 16px; border-left: 4px solid #2563eb; margin-bottom: 14px; }
        .resume-section { margin-bottom: 14px; }
        .resume-section h4 { font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }
        .resume-edu-item, .resume-exp-item { margin-bottom: 6px; }
        .resume-edu-item .head, .resume-exp-item .head { display: flex; justify-content: space-between; font-weight: 600; font-size: 13px; }
        .resume-skills .skill-tag { background: #f1f5f9; padding: 2px 10px; border-radius: 40px; font-size: 11px; display: inline-block; margin: 2px 4px 2px 0; }
        .cl-header, .ol-header { border-bottom: 2px solid #f1f5f9; margin-bottom: 14px; padding-bottom: 10px; }
        .cl-header h2, .ol-header h2 { font-size: 22px; font-weight: 700; }
        .cl-body, .ol-body { white-space: pre-wrap; font-size: 13px; }
        .cl-footer, .ol-footer { margin-top: 20px; padding-top: 10px; border-top: 2px solid #f1f5f9; font-size: 13px; }
    `;
    let content = element.innerHTML;
    content = content.replace(/<i class="[^"]*"><\/i>/g, '');
    content = content.replace(/<i class="[^"]*">/g, '').replace(/<\/i>/g, '');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>${content}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.doc';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastDocx || 'DOCX downloaded!');
}

function exportShareableLink() {
    const data = getFormData();
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = window.location.href.split('?')[0] + '?data=' + encoded;
    navigator.clipboard.writeText(url).then(() => {
        showToast(translations[currentLang].toastLink || 'Shareable link copied to clipboard!');
    }).catch(() => {
        prompt('Copy this link:', url);
        showToast(translations[currentLang].toastLink || 'Link generated!');
    });
}

function exportQRCode() {
    const data = getFormData();
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = window.location.href.split('?')[0] + '?data=' + encoded;
    const container = document.getElementById('qrCodeContainer');
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(translations[currentLang].toastQR || 'QR Code generated!');
}

function exportHTML() {
    const { element, name } = getActiveElement();
    const t = translations[currentLang];
    if (name === 'ats-report') { showToast('ATS report cannot be exported as HTML.'); return; }
    const styles = document.querySelector('style').innerHTML;
    const content = element.outerHTML;
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume</title><style>${styles}</style></head><body style="background:#fff;padding:40px;display:flex;justify-content:center;">${content}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastHTML || 'HTML downloaded!');
}

function exportMarkdown() {
    const data = getFormData();
    const t = translations[currentLang];
    let md = `# ${data.name}\n## ${data.title}\n\n`;
    md += `**Email:** ${data.email}  \n**Phone:** ${data.phone}  \n**Location:** ${data.location}  \n**LinkedIn:** ${data.linkedin}\n\n`;
    md += `## Professional Summary\n${data.summary}\n\n`;
    md += `## Education\n`;
    data.educations.forEach(e => md += `- **${e.school}** — ${e.degree} (${e.year})\n`);
    md += `\n## Experience\n`;
    data.experiences.forEach(e => {
        md += `- **${e.company}** — ${e.role} (${e.year})\n`;
        if (e.desc) md += `  ${e.desc}\n`;
    });
    md += `\n## Skills\n`;
    data.skills.split(',').filter(s => s.trim()).forEach(s => md += `- ${s.trim()}\n`);
    if (data.certifications) md += `\n## Certifications\n${data.certifications.split(',').filter(c=>c.trim()).map(c=>`- ${c.trim()}`).join('\n')}\n`;
    if (data.projects) md += `\n## Projects\n${data.projects.split(',').filter(p=>p.trim()).map(p=>`- ${p.trim()}`).join('\n')}\n`;
    if (data.languages) md += `\n## Languages\n${data.languages.split(',').filter(l=>l.trim()).map(l=>`- ${l.trim()}`).join('\n')}\n`;
    if (data.awards) md += `\n## Awards\n${data.awards.split(',').filter(a=>a.trim()).map(a=>`- ${a.trim()}`).join('\n')}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getActiveElement().name + '.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastMarkdown || 'Markdown downloaded!');
}

function exportJSON() {
    const data = getFormData();
    const t = translations[currentLang];
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getActiveElement().name + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastJSON || 'JSON downloaded!');
}

function exportTXT() {
    const data = getFormData();
    const t = translations[currentLang];
    let txt = `${data.name}\n${'='.repeat(data.name.length)}\n${data.title}\n\n`;
    txt += `Email: ${data.email}  |  Phone: ${data.phone}  |  Location: ${data.location}\n`;
    if (data.linkedin) txt += `LinkedIn: ${data.linkedin}\n`;
    txt += `\n--- PROFESSIONAL SUMMARY ---\n${data.summary}\n\n`;
    txt += `--- EDUCATION ---\n`;
    data.educations.forEach(e => txt += `• ${e.school} — ${e.degree} (${e.year})\n`);
    txt += `\n--- EXPERIENCE ---\n`;
    data.experiences.forEach(e => {
        txt += `• ${e.company} — ${e.role} (${e.year})\n`;
        if (e.desc) txt += `  ${e.desc}\n`;
    });
    txt += `\n--- SKILLS ---\n`;
    data.skills.split(',').filter(s => s.trim()).forEach(s => txt += `• ${s.trim()}\n`);
    if (data.certifications) txt += `\n--- CERTIFICATIONS ---\n${data.certifications.split(',').filter(c=>c.trim()).map(c=>`• ${c.trim()}`).join('\n')}\n`;
    if (data.projects) txt += `\n--- PROJECTS ---\n${data.projects.split(',').filter(p=>p.trim()).map(p=>`• ${p.trim()}`).join('\n')}\n`;
    if (data.languages) txt += `\n--- LANGUAGES ---\n${data.languages.split(',').filter(l=>l.trim()).map(l=>`• ${l.trim()}`).join('\n')}\n`;
    if (data.awards) txt += `\n--- AWARDS ---\n${data.awards.split(',').filter(a=>a.trim()).map(a=>`• ${a.trim()}`).join('\n')}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getActiveElement().name + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastTXT || 'TXT downloaded!');
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('fullName').value = data.name || '';
            document.getElementById('jobTitle').value = data.title || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('location').value = data.location || '';
            document.getElementById('linkedin').value = data.linkedin || '';
            document.getElementById('summary').value = data.summary || '';
            document.getElementById('skillsInput').value = data.skills || '';
            document.getElementById('companyName').value = data.company || '';
            document.getElementById('hiringManager').value = data.manager || '';
            document.getElementById('letterBody').value = data.letterBody || '';
            document.getElementById('otherRecipient').value = data.otherRecipient || '';
            document.getElementById('otherLetterBody').value = data.otherLetterBody || '';
            if (data.otherLetterType) document.getElementById('otherLetterType').value = data.otherLetterType;
            if (data.template) document.getElementById('templateSelect').value = data.template;
            if (data.educations) educations = data.educations;
            if (data.experiences) experiences = data.experiences;
            document.getElementById('certifications').value = data.certifications || '';
            document.getElementById('projects').value = data.projects || '';
            document.getElementById('languages').value = data.languages || '';
            document.getElementById('awards').value = data.awards || '';
            renderEducation();
            renderExperience();
            updatePreview();
            showToast(translations[currentLang].toastImport || 'Imported successfully!');
        } catch (err) {
            showToast('Error importing file: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function shareSocial(platform) {
    const data = getFormData();
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = window.location.href.split('?')[0] + '?data=' + encoded;
    const text = `Check out my resume: ${data.name} - ${data.title}`;
    let shareUrl = '';
    if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    else if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
}

function toggleDropdown() {
    document.getElementById('exportDropdown').classList.toggle('show');
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.getElementById('exportDropdown').classList.remove('show');
    }
});

function copyPreview() {
    const { element } = getActiveElement();
    const text = element.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
        showToast(translations[currentLang].toastCopied || 'Copied to clipboard!');
    }).catch(() => {
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        showToast(translations[currentLang].toastCopied || 'Copied!');
    });
}

function resetAll() {
    if (!confirm('Are you sure you want to reset all data? All your input will be cleared.')) return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setDefaults();
    educations = [];
    experiences = [];
    document.getElementById('accentColor').value = '#2563eb';
    document.getElementById('fontFamily').value = "'Inter', sans-serif";
    darkMode = false;
    document.body.classList.remove('dark-mode');
    updateDarkIcon();
    renderEducation();
    renderExperience();
    applyStyle();
    updatePreview();
    showToast(translations[currentLang].toastReset || 'Reset to defaults (cleared)');
}

function setLanguage(lang) {
    currentLang = lang;
    // Update UI text (simplified)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    updateCoverLetter();
    updateOtherLetter();
}

function saveAndUpdate() {
    saveToLocalStorage();
    renderEducation();
    renderExperience();
    updatePreview();
    applyStyle();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ───────────── INIT ─────────────
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    applyStyle();
    renderEducation();
    renderExperience();
    updatePreview();
    switchTab('resume');
    document.getElementById('langSelect').value = 'en';
    setLanguage('en');

    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            saveToLocalStorage();
            if (this.id === 'otherLetterType') updateOtherLetter();
            else if (this.id === 'accentColor' || this.id === 'fontFamily') {
                applyStyle();
            } else {
                updatePreview();
            }
        });
        if (input.type === 'checkbox') {
            input.addEventListener('change', function() {
                saveToLocalStorage();
                updatePreview();
            });
        }
    });

    const originalPrompt = window.prompt;
    window.prompt = function(message, defaultValue) {
        const t = translations[currentLang];
        const promptKeys = ['promptSchool', 'promptDegree', 'promptYear', 'promptCompany', 'promptRole', 'promptYearExp', 'promptDesc'];
        let translated = message;
        for (const key of promptKeys) {
            if (t[key] && message.includes(translations.en[key])) {
                translated = t[key];
                break;
            }
        }
        return originalPrompt(translated, defaultValue);
    };

    // Load shared data from URL if any
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
        try {
            const data = JSON.parse(decodeURIComponent(dataParam));
            if (data.name) {
                document.getElementById('fullName').value = data.name;
                document.getElementById('jobTitle').value = data.title || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('location').value = data.location || '';
                document.getElementById('linkedin').value = data.linkedin || '';
                document.getElementById('summary').value = data.summary || '';
                document.getElementById('skillsInput').value = data.skills || '';
                document.getElementById('companyName').value = data.company || '';
                document.getElementById('hiringManager').value = data.manager || '';
                document.getElementById('letterBody').value = data.letterBody || '';
                document.getElementById('otherRecipient').value = data.otherRecipient || '';
                document.getElementById('otherLetterBody').value = data.otherLetterBody || '';
                if (data.otherLetterType) document.getElementById('otherLetterType').value = data.otherLetterType;
                if (data.template) document.getElementById('templateSelect').value = data.template;
                document.getElementById('certifications').value = data.certifications || '';
                document.getElementById('projects').value = data.projects || '';
                document.getElementById('languages').value = data.languages || '';
                document.getElementById('awards').value = data.awards || '';
                if (data.educations) educations = data.educations;
                if (data.experiences) experiences = data.experiences;
                renderEducation();
                renderExperience();
                updatePreview();
                showToast('Shared resume loaded!');
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch (e) { console.log('Invalid shared data'); }
    }
});