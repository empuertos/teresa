// Database ng Smart Suggestions
const jobDatabase = {
  // Resume Titles
  "software engineer": {
    summary: "Detail-oriented Software Engineer with a strong foundation in full-stack development, clean code practices, and scalable system design.",
    skills: "JavaScript, Python, React, Node.js, SQL, Git, REST APIs, Problem Solving"
  },
  "marketing manager": {
    summary: "Results-driven Marketing Manager experienced in multi-channel campaign strategy, brand growth, customer acquisition, and data analytics.",
    skills: "Digital Marketing, SEO, Content Strategy, Brand Management, Google Analytics, Social Media Strategy"
  },
  "data analyst": {
    summary: "Analytical Data Analyst skilled at converting complex datasets into actionable business insights and interactive dashboards.",
    skills: "SQL, Python, Excel, Tableau, Power BI, Data Visualization, Statistical Analysis"
  },
  "graphic designer": {
    summary: "Creative Graphic Designer passionate about visual storytelling, brand identity creation, and producing compelling digital assets.",
    skills: "Adobe Photoshop, Illustrator, Figma, UI/UX Design, Branding, Typography"
  },

  // Academic / CV Titles
  "assistant professor": {
    summary: "Dedicated Assistant Professor with extensive experience in university-level instruction, curriculum design, and publishing peer-reviewed research.",
    skills: "Higher Education Instruction, Curriculum Development, Qualitative & Quantitative Research, Academic Advising, Grant Writing"
  },
  "research fellow": {
    summary: "Accomplished Research Fellow specializing in data collection, scientific methodology, cross-institutional collaboration, and academic publications.",
    skills: "Experimental Design, Data Analysis, Literature Review, Technical Writing, Statistical Software (R/SPSS)"
  }
};

// Tab Switching Handler
function switchTab(tabName, event) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-btn');

  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));

  if (tabName === 'resume') {
    document.getElementById('resume-tab').classList.add('active');
  } else {
    document.getElementById('cv-tab').classList.add('active');
  }
  
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
}

// Auto-Fill Logic Function
function autoFillFromJobTitle(type) {
  const isResume = type === 'resume';
  const titleInputId = isResume ? 'job-title' : 'academic-title';
  const summaryInputId = isResume ? 'prof-summary' : 'academic-summary';
  const skillsInputId = isResume ? 'skills' : 'academic-skills';

  const rawTitle = document.getElementById(titleInputId).value.trim();
  const normalizedTitle = rawTitle.toLowerCase();

  if (!rawTitle) {
    alert('Mangyaring maglagay muna ng Job Title / Academic Title!');
    return;
  }

  let match = jobDatabase[normalizedTitle];

  if (!match) {
    const keys = Object.keys(jobDatabase);
    const matchedKey = keys.find(key => normalizedTitle.includes(key) || key.includes(normalizedTitle));
    if (matchedKey) {
      match = jobDatabase[matchedKey];
    }
  }

  if (match) {
    document.getElementById(summaryInputId).value = match.summary;
    document.getElementById(skillsInputId).value = match.skills;
  } else {
    document.getElementById(summaryInputId).value = `Experienced ${rawTitle} dedicated to driving results, achieving operational efficiency, and delivering high-quality outcomes.`;
    document.getElementById(skillsInputId).value = `${rawTitle} Skills, Team Collaboration, Problem Solving, Time Management, Communication`;
  }
}
