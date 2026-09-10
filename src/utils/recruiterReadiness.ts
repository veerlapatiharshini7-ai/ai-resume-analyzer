/**
 * recruiterReadiness.ts
 *
 * MASTER PROMPT COMPLIANT RECRUITER READINESS ANALYZER
 *
 * PURPOSE:
 * Deterministic, explainable, evidence-based calculation of the Overall Recruiter Readiness Score (0-100)
 * based strictly on real student/resume data across 7 centralized categories:
 * - Profile / Resume (20%)
 * - Skills (20%)
 * - Projects (20%)
 * - Education (10%)
 * - Certifications (10%)
 * - Experience / Internships (15%)
 * - Achievements (5%)
 *
 * GUARANTEES:
 * - Accuracy > Assumption: Resume is the ONLY source of truth.
 * - Never claim missing when item is present (e.g. LinkedIn, Objective).
 * - Never group present and missing links together.
 * - Comprehensive 12-category skill extraction.
 * - Objective vs Summary distinction (Objective = Present & Improvable).
 * - Exactly 6 specific, actionable, gap-based recommendations.
 * - Clamped: 0 <= score <= 100, rounded to nearest whole integer.
 */

export interface ReadinessCategoryScore {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // decimal (e.g. 0.20)
  weightedScore: number; // score * weight
  status: 'Strong' | 'Moderate' | 'Needs Improvement';
  summary: string;
  itemsDetected: string[];
  missing?: string[];
  improvements?: string[];
}

export type RecruiterReadinessLevel =
  | 'Highly Recruiter Ready'
  | 'Recruiter Ready'
  | 'Needs Improvement'
  | 'Early Preparation';

export interface RecruiterReadinessResult {
  overallScore: number; // 0-100
  readinessLevel: RecruiterReadinessLevel;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  categories: ReadinessCategoryScore[];
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  explanation: {
    formula: string;
    categoryWeights: Array<{ name: string; weightPercentage: number; score: number }>;
    description: string;
  };
}

export interface StudentInputData {
  resumeText: string;
  candidateName?: string;
  skillsFound?: Array<{ category: string; skills: string[] }>;
  missingSkills?: Array<{ skill: string; priority: string; reason?: string }>;
  targetRole?: string;
}

/**
 * Centralized Category Weights (Total = 1.00 / 100%)
 */
export const RECRUITER_READINESS_WEIGHTS = {
  profileResume: 0.20,
  skills: 0.20,
  projects: 0.20,
  education: 0.10,
  certifications: 0.10,
  experience: 0.15,
  achievements: 0.05,
} as const;

function RECRUTER_WEIGHTS_SAFE(weight: number): number {
  return typeof weight === 'number' && !isNaN(weight) && isFinite(weight) ? weight : 0;
}

/**
 * Comprehensive 12-Category Technical Skill Taxonomy
 */
export const SKILL_TAXONOMY_12: Record<string, string[]> = {
  'Programming Languages': ['java', 'python', 'c', 'c++', 'c#', 'javascript', 'typescript', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'r', 'matlab'],
  'Frontend/Web Technologies': ['html', 'html5', 'css', 'css3', 'tailwind css', 'bootstrap', 'sass', 'responsive design', 'websockets'],
  'Backend Technologies': ['node.js', 'node', 'express', 'spring boot', 'django', 'flask', 'fastapi', 'asp.net', 'rest apis', 'restful apis', 'graphql', 'microservices'],
  'Frameworks': ['react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'django', 'spring', 'flask', 'express'],
  'Libraries': ['redux', 'pandas', 'numpy', 'scikit-learn', 'scipy', 'pytorch', 'tensorflow', 'opencv', 'matplotlib', 'seaborn', 'axios', 'jquery'],
  'Machine Learning/AI': ['machine learning', 'deep learning', 'neural networks', 'xai', 'explainable ai', 'nlp', 'computer vision', 'transformers', 'llms', 'hugging face', 'langchain'],
  'Databases': ['mysql', 'postgresql', 'postgres', 'mongodb', 'sqlite', 'redis', 'oracle', 'sql server', 'snowflake', 'bigquery', 'cassandra', 'firebase', 'sql'],
  'Cloud/DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'github actions', 'terraform', 'linux', 'nginx', 'vercel', 'netlify', 'cloud'],
  'Developer Tools': ['git', 'github', 'gitlab', 'bitbucket', 'vs code', 'google colab', 'jupyter', 'postman', 'jira', 'figma', 'vite', 'webpack'],
  'Core CS Concepts': ['data structures', 'algorithms', 'oop', 'object oriented programming', 'system design', 'operating systems', 'computer networks', 'dbms'],
  'APIs/Platforms': ['stripe api', 'openweather api', 'rest api', 'websockets', 'socket.io', 'oauth2', 'jwt'],
  'Other Relevant Technical Skills': ['testing', 'jest', 'cypress', 'junit', 'selenium', 'agile', 'scrum']
};

/**
 * 1. Profile / Resume Scorer (20%)
 * Evaluates Candidate Name, Email, Phone, LinkedIn, GitHub, Portfolio, Objective/Summary, Document Substance.
 * NEVER confuses Objective with missing summary, and NEVER groups LinkedIn and GitHub into vague missing statements.
 */
export function scoreProfileResume(resumeText: string = '', candidateName: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Candidate Name
  const trimmedName = (candidateName || '').trim();
  const isPlaceholder = !trimmedName || /^(candidate|professional candidate|valued candidate|john doe)$/i.test(trimmedName);
  if (!isPlaceholder && trimmedName.length >= 3 && trimmedName.length <= 60) {
    score += 25;
    detected.push(`Candidate Name: ${trimmedName}`);
  } else {
    missing.push('Candidate Name in top header');
    improvements.push('Ensure candidate full name is prominently displayed at the top.');
  }

  // Email
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (hasEmail) {
    score += 20;
    detected.push('Valid Email Address present');
  } else {
    missing.push('Contact Email');
    improvements.push('Add a professional email address to top header.');
  }

  // Phone
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  if (hasPhone) {
    score += 15;
    detected.push('Contact Phone Number present');
  } else {
    missing.push('Contact Phone Number');
    improvements.push('Add contact phone number.');
  }

  // Links Verification (Separate check per link)
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);
  const hasPortfolio = /(portfolio|vercel\.app|netlify\.app|github\.io|devpost\.com|\.me\b)/i.test(text);

  if (hasLinkedIn) {
    score += 8;
    detected.push('LinkedIn Profile present');
  } else {
    missing.push('LinkedIn Profile URL');
    improvements.push('Add a hyperlinked LinkedIn profile URL.');
  }

  if (hasGitHub) {
    score += 7;
    detected.push('GitHub Profile present');
  } else if (hasPortfolio) {
    score += 7;
    detected.push('Portfolio Website present');
  } else {
    missing.push('GitHub / Portfolio link');
    improvements.push('Add a GitHub profile link to showcase code repositories.');
  }

  // Career Summary vs Objective
  const hasSummary = /(professional summary|executive summary|profile summary|about me|summary:)/i.test(text);
  const hasObjective = /(career objective|objective:)/i.test(text);

  if (hasSummary) {
    score += 15;
    detected.push('Professional Summary Section present');
  } else if (hasObjective) {
    score += 10;
    detected.push('Career Objective Section present (Objective present, summary recommended)');
    improvements.push('Replace generic career objective with a crisp 2-3 sentence role-targeted professional summary.');
  } else {
    missing.push('Professional Summary / Objective section');
    improvements.push('Add a 2-3 sentence executive summary tailored to target role.');
  }

  // Document substance
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 150) {
    score += 10;
    detected.push(`Comprehensive Document Substance (${words} words)`);
  } else if (words >= 50) {
    score += 5;
    detected.push(`Basic Document Substance (${words} words)`);
  } else {
    missing.push('Sufficient document substance');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'profileResume',
    name: 'Profile / Resume',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.profileResume),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.profileResume * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Profile information is complete with verified contact details, professional links, and clear objective/summary.'
        : clampedScore >= 50
        ? 'Core profile details are present. Upgrading to a targeted summary or adding GitHub/portfolio link will maximize impact.'
        : 'Incomplete profile section. Essential contact links, professional summary, or header details are missing.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 2. Skills Scorer (20%)
 * Extracts ALL explicit technical skills across 12 categories without arbitrary limits.
 * Evaluates skill count, domain diversity, categorization, and missing gaps.
 */
export function scoreSkills(
  skillsFound: Array<{ category: string; skills: string[] }> = [],
  missingSkills: Array<{ skill: string; priority: string }> = [],
  resumeText: string = ''
): ReadinessCategoryScore {
  const text = (resumeText || '').toLowerCase();
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];

  // Extract all explicit skills across the 12 categories
  const detectedCategoriesMap: Record<string, string[]> = {};
  const allExtractedSkillsSet = new Set<string>();

  // Include pre-parsed skills
  if (Array.isArray(skillsFound)) {
    for (const catObj of skillsFound) {
      if (catObj && Array.isArray(catObj.skills)) {
        for (const s of catObj.skills) {
          if (s && typeof s === 'string') {
            allExtractedSkillsSet.add(s.trim());
          }
        }
      }
    }
  }

  // Scan text for 12-category taxonomy
  for (const [catName, skillList] of Object.entries(SKILL_TAXONOMY_12)) {
    const hits: string[] = [];
    for (const skillKw of skillList) {
      const isHit = new RegExp(`\\b${skillKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
      if (isHit) {
        const formatSkill = skillKw.length <= 4 ? skillKw.toUpperCase() : skillKw.charAt(0).toUpperCase() + skillKw.slice(1);
        if (!allExtractedSkillsSet.has(formatSkill)) {
          allExtractedSkillsSet.add(formatSkill);
        }
        if (!hits.includes(formatSkill)) {
          hits.push(formatSkill);
        }
      }
    }
    if (hits.length > 0) {
      detectedCategoriesMap[catName] = hits;
    }
  }

  const allSkillsList = Array.from(allExtractedSkillsSet);
  const totalExplicitSkillsCount = allSkillsList.length;
  const categoryCount = Object.keys(detectedCategoriesMap).length || (totalExplicitSkillsCount >= 6 ? 3 : totalExplicitSkillsCount >= 3 ? 2 : totalExplicitSkillsCount >= 1 ? 1 : 0);

  let score = 0;

  if (totalExplicitSkillsCount === 0) {
    detected.push('No technical skills identified');
    missing.push('Core technical skills');
    improvements.push('Add a dedicated Skills section covering Programming Languages, Frameworks, Databases, and Tools.');
    return {
      id: 'skills',
      name: 'Skills',
      score: 0,
      weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.skills),
      weightedScore: 0,
      status: 'Needs Improvement',
      summary: 'No explicit technical skills detected in the resume text.',
      itemsDetected: detected,
      missing,
      improvements,
    };
  }

  // Skills Count Scoring (up to 50 pts)
  if (totalExplicitSkillsCount >= 14) {
    score += 50;
    detected.push(`${totalExplicitSkillsCount} technical & domain skills identified`);
  } else if (totalExplicitSkillsCount >= 10) {
    score += 42;
    detected.push(`${totalExplicitSkillsCount} technical & domain skills identified`);
  } else if (totalExplicitSkillsCount >= 6) {
    score += 32;
    detected.push(`${totalExplicitSkillsCount} technical skills identified`);
  } else if (totalExplicitSkillsCount >= 3) {
    score += 22;
    detected.push(`${totalExplicitSkillsCount} technical skills identified`);
  } else {
    score += 12;
    detected.push(`${totalExplicitSkillsCount} skill identified`);
  }

  // Categorization & Diversity (up to 20 pts)
  if (categoryCount >= 3) {
    score += 20;
    detected.push(`Categorized across ${categoryCount} distinct technical domains`);
  } else if (categoryCount === 2) {
    score += 14;
    detected.push(`Categorized across ${categoryCount} technical domains`);
  } else {
    score += 8;
    detected.push('Single category skill group');
    improvements.push('Group skills into explicit categories (e.g. Languages, Frameworks, Databases, Tools).');
  }

  // Missing Skill Gaps Evaluation (up to 20 pts)
  const highPriorityMissing = Array.isArray(missingSkills)
    ? missingSkills.filter((m) => m && m.priority === 'High').length
    : 0;

  if (highPriorityMissing === 0 && totalExplicitSkillsCount >= 6) {
    score += 20;
    detected.push('Zero critical missing skill gaps for target role');
  } else if (highPriorityMissing <= 2) {
    score += 12;
    detected.push('Minor missing skill gaps identified');
    missing.push(missingSkills.map((m) => m.skill).slice(0, 3).join(', '));
  } else {
    score += 5;
    missing.push(missingSkills.map((m) => m.skill).slice(0, 4).join(', '));
    improvements.push(`Incorporate key target role skills: ${missingSkills.slice(0, 3).map((m) => m.skill).join(', ')}.`);
  }

  // Tooling & Ecosystem (up to 10 pts)
  const ecosystemKeywords = ['git', 'github', 'docker', 'ci/cd', 'linux', 'rest', 'api', 'sql', 'unit test', 'cloud', 'vs code', 'google colab'];
  const matchedEcosystem = ecosystemKeywords.filter((k) => text.includes(k));
  if (matchedEcosystem.length >= 3) {
    score += 10;
    detected.push(`Core ecosystem tooling (${matchedEcosystem.slice(0, 4).join(', ')})`);
  } else if (matchedEcosystem.length >= 1) {
    score += 5;
    detected.push(`Basic tooling mentioned (${matchedEcosystem[0]})`);
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'skills',
    name: 'Skills',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.skills),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.skills * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? `Comprehensive skill footprint with ${totalExplicitSkillsCount} skills identified across ${categoryCount} technical categories.`
        : clampedScore >= 50
        ? `Solid technical foundation (${totalExplicitSkillsCount} skills detected). Expanding role-specific frameworks or tools will strengthen ATS relevance.`
        : 'Limited technical skills detected. Group skills into clear categories and highlight core role requirements.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 3. Projects Scorer (20%)
 * Evaluates project portfolio, titles, tech stack, descriptions, GitHub links, and metrics.
 * Explicitly distinguishes "Project exists but GitHub link missing" from "No project evidence".
 */
export function scoreProjects(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Section presence (30 pts)
  const hasProjectsSection = /(projects|academic projects|personal projects|key projects|capstone projects)/i.test(text);
  if (hasProjectsSection) {
    score += 30;
    detected.push('Dedicated Projects Section present');
  }

  // Estimate project entries count (up to 30 pts)
  const projectSectionMatch = text.match(/(?:projects|academic projects|personal projects)[\s\S]*?(?:education|experience|skills|certifications|achievements|$)/i);
  const projectSnippet = projectSectionMatch ? projectSectionMatch[0] : text;

  const projectBulletMatches = projectSnippet.match(/(?:^|\n)\s*[•\-*]\s+([^\n]+)/g) || [];
  const projectTitleMatches = projectSnippet.match(/(?:^|\n)\s*(?:\d+[\.\)]|[A-Z][A-Za-z0-9\s-]{3,35}(?:App|Dashboard|System|Platform|API|Tool|Bot|Engine|Website|Tracker|Manager|Portal|Hub|Detection))/g) || [];

  const estimatedProjects = Math.max(
    projectTitleMatches.length,
    Math.min(4, Math.floor(projectBulletMatches.length / 2))
  );

  if (hasProjectsSection && estimatedProjects >= 3) {
    score += 30;
    detected.push(`Multi-project portfolio (${estimatedProjects} projects identified)`);
  } else if (hasProjectsSection && estimatedProjects >= 2) {
    score += 25;
    detected.push(`Multiple projects identified (${estimatedProjects} projects)`);
  } else if (hasProjectsSection || estimatedProjects >= 1) {
    score += 15;
    detected.push('At least 1 project demonstrated');
  } else {
    missing.push('Projects section / portfolio');
    improvements.push('Add 2-3 technical projects demonstrating real implementation details and tech stack.');
    return {
      id: 'projects',
      name: 'Projects',
      score: 0,
      weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.projects),
      weightedScore: 0,
      status: 'Needs Improvement',
      summary: 'No project evidence detected in the resume.',
      itemsDetected: ['No projects section found'],
      missing,
      improvements,
    };
  }

  // Tech stack explicitly detailed in projects (20 pts)
  const techInProjects = /(tech stack|technologies|built with|developed with|using\s+[A-Za-z]+|react|node|python|sql|mongo|docker|flutter|express|django|flask|deep learning|xai|machine learning|html|css|javascript|java|c\b)/i.test(projectSnippet);
  if (techInProjects) {
    score += 20;
    detected.push('Technologies & implementation details specified per project');
  } else {
    improvements.push('Specify tech stack used (e.g. React, Node.js, Python, MySQL) for each project.');
  }

  // GitHub / Demo Links in projects (10 pts)
  const hasRepoLink = /(github\.com\/[^\s]+|gitlab\.com\/[^\s]+|bitbucket\.org\/[^\s]+)/i.test(projectSnippet);
  if (hasRepoLink) {
    score += 10;
    detected.push('GitHub / repository links included');
  } else {
    missing.push('GitHub / repository project links');
    improvements.push('Add GitHub repository URLs to your listed projects to allow recruiters to inspect your source code.');
  }

  // Quantified project outcomes (10 pts)
  const hasProjectMetrics = /\b\d+%\b|\$\d+|\d+x\b|reduced\s+[\w\s]+\s+by|improved\s+[\w\s]+\s+by|achieved\s+\d+/i.test(projectSnippet);
  if (hasProjectMetrics) {
    score += 10;
    detected.push('Quantified project outcomes / metrics included');
  } else {
    improvements.push('Include measurable outcomes or performance metrics (e.g. % accuracy, latency, active users) in project descriptions.');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'projects',
    name: 'Projects',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.projects),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.projects * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Impressive project portfolio with clear technical details, implementation stack, and verified structure.'
        : clampedScore >= 50
        ? `Projects are present (${estimatedProjects} projects identified), but adding GitHub links or quantified metrics will elevate recruiter appeal.`
        : 'Projects present but lack detailed tech stack descriptions or code repository links.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 4. Education Scorer (10%)
 * Evaluates degree, field, academic institution, dates, and CGPA/GPA.
 */
export function scoreEducation(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Education section presence (35 pts)
  const hasEduSection = /(education|academic background|academics|qualifications)/i.test(text);
  if (hasEduSection) {
    score += 35;
    detected.push('Education Section Present');
  }

  // Degree / Course specification (30 pts)
  const degreeMatch = text.match(/(bachelor|master|b\.?tech|b\.?e\.?|b\.?s\.?|m\.?s\.?|m\.?tech|bca|mca|ph\.?d|diploma|associate degree|computer science|information technology|statistics|data science|engineering|business)/i);
  if (degreeMatch) {
    score += 30;
    detected.push(`Degree / Field Specified (${degreeMatch[0]})`);
  } else {
    missing.push('Degree / Field of study');
    improvements.push('Explicitly state degree title (e.g. B.Tech in Computer Science).');
  }

  // Academic Institution (20 pts)
  const instituteMatch = text.match(/(university|college|institute|school|academy|campus|iit|nit|bits|iiit)/i);
  if (instituteMatch) {
    score += 20;
    detected.push(`Academic Institution Specified (${instituteMatch[0]})`);
  } else {
    missing.push('College / University name');
    improvements.push('Add full college/university institution name.');
  }

  // Timeline & CGPA (15 pts)
  const hasYearOrGPA = /(20\d\d|19\d\d|gpa|cgpa|\d\.\d\d?\/|percentage|\b\d{2}%\b)/i.test(text);
  if (hasYearOrGPA) {
    score += 15;
    detected.push('Graduation Timeline / CGPA Specified');
  } else {
    missing.push('Graduation dates / CGPA');
  }

  if (detected.length === 0) {
    detected.push('No education section found');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'education',
    name: 'Education',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.education),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.education * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Complete educational credentials including degree, institution, and graduation timeline.'
        : clampedScore >= 50
        ? 'Education section present, but ensure degree title, college name, and dates are fully specified.'
        : 'Incomplete education details. Ensure degree, college name, and dates are clearly stated.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 5. Certifications Scorer (10%)
 * Only awards credit for certifications explicitly listed in the resume.
 * Score = 0 if none are present.
 */
export function scoreCertifications(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Check if explicit Certifications / Courses section exists
  const hasCertSection = /(^|\n)\s*(certifications?|licensed\s+&\s+certifications?|credentials?|accreditations?|courses?\s+completed)\b/i.test(text);

  // Industry-recognized certification credentials pattern (strictly exclude tools like Google Colab, VS Code)
  const specificCertPatterns = [
    { pattern: /\baws\s+(certified|certification|practitioner|architect|developer)\b/i, name: 'AWS' },
    { pattern: /\bgoogle\s+(certified|cloud\s+certified|data\s+analytics\s+certificate)\b/i, name: 'Google' },
    { pattern: /\bmeta\s+(certified|front-end\s+developer|back-end\s+developer)\b/i, name: 'Meta' },
    { pattern: /\b(microsoft|azure)\s+(certified|certification)\b/i, name: 'Microsoft' },
    { pattern: /\boracle\s+certified\b/i, name: 'Oracle' },
    { pattern: /\bcisco\s+certified\b/i, name: 'Cisco' },
    { pattern: /\bcomptia\b/i, name: 'CompTIA' },
    { pattern: /\b(coursera|udemy|nptel|edx)\s+(certificate|specialization|coursework)\b/i, name: 'Online Course Credential' },
  ];

  const matchedProviders = specificCertPatterns.filter((p) => p.pattern.test(text)).map((p) => p.name);

  let certItemCount = 0;
  if (hasCertSection) {
    const certSnippetMatch = text.match(/(?:certifications?|credentials?)[\s\S]*?(?:education|experience|skills|projects|achievements|$)/i);
    const certSnippet = certSnippetMatch ? certSnippetMatch[0] : '';
    const bullets = certSnippet.match(/(?:^|\n)\s*[•\-*]\s+([^\n]+)/g) || [];
    certItemCount = bullets.length;
  }

  const hasAnyCert = hasCertSection || matchedProviders.length > 0 || certItemCount > 0;

  if (!hasAnyCert) {
    score = 0;
    detected.push('No certifications found');
    missing.push('Industry certifications / verified coursework');
    improvements.push('Consider adding relevant industry certifications or platform credentials (e.g., AWS, Meta, or domain coursework) as an optional boost.');
  } else {
    score += 30;
    detected.push('Certifications / Credentials Mentioned');

    if (matchedProviders.length >= 2) {
      score += 40;
      detected.push(`Recognized Providers: ${Array.from(new Set(matchedProviders)).join(', ')}`);
    } else if (matchedProviders.length === 1) {
      score += 25;
      detected.push(`Recognized Provider: ${matchedProviders[0]}`);
    }

    if (certItemCount >= 2 || matchedProviders.length >= 2) {
      score += 30;
      detected.push('Multiple verified credentials');
    } else if (certItemCount >= 1 || matchedProviders.length >= 1) {
      score += 15;
      detected.push('Specialized coursework credential');
    }
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'certifications',
    name: 'Certifications',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.certifications),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.certifications * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Verified industry credentials and certifications demonstrating proactive learning.'
        : clampedScore >= 40
        ? 'Some coursework or certification mentioned, but recognized vendor credentials add weight.'
        : 'No certifications were detected in the resume. Adding industry certifications is an optional boost.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 6. Experience / Internships Scorer (15%)
 * Evaluates work experience, internships, tenure, action verbs, and business impact.
 * If experience exists but lacks metrics: states "Professional experience is present, but measurable outcomes could strengthen the section."
 */
export function scoreExperience(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Section presence (30 pts)
  const hasExpSection = /(experience|work experience|employment|internships?|work history|professional experience)/i.test(text);
  if (hasExpSection) {
    score += 30;
    detected.push('Professional Experience Section Present');
  }

  // Dates & tenure presence (25 pts)
  const hasDates = /(20\d\d|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|months|years)/i.test(text);
  if (hasDates && hasExpSection) {
    score += 25;
    detected.push('Role Duration and Employment Dates Documented');
  }

  // High-impact action verbs (up to 25 pts)
  const actionVerbs = ['led', 'built', 'developed', 'architected', 'engineered', 'implemented', 'improved', 'reduced', 'optimized', 'spearheaded', 'automated'];
  const lower = text.toLowerCase();
  const matchedVerbs = actionVerbs.filter((v) => lower.includes(v));

  if (matchedVerbs.length >= 4) {
    score += 25;
    detected.push(`Strong action verbs demonstrating leadership (${matchedVerbs.slice(0, 4).join(', ')})`);
  } else if (matchedVerbs.length >= 2) {
    score += 15;
    detected.push(`Active verbs used (${matchedVerbs.slice(0, 2).join(', ')})`);
  }

  // Quantifiable business impact metrics IN EXPERIENCE (EXCLUDING dates, years, CGPA, phone numbers)
  const expSectionMatch = text.match(/(?:experience|work experience|employment|internships?)[\s\S]*?(?:education|projects|skills|certifications|achievements|$)/i);
  const expSnippet = expSectionMatch ? expSectionMatch[0] : text;

  const realMetricMatches = expSnippet.match(/\b\d+%\b|\$\d+|\d+x\b|reduced\s+[\w\s]+\s+by\s+\d+|improved\s+[\w\s]+\s+by\s+\d+|\b\d+\+\s*(users|clients|customers|requests|transactions)/gi) || [];

  if (realMetricMatches.length >= 3) {
    score += 20;
    detected.push(`Multiple quantifiable impact metrics (${realMetricMatches.length}+ metrics)`);
  } else if (realMetricMatches.length >= 1) {
    score += 10;
    detected.push('Includes quantified result');
  } else if (hasExpSection) {
    missing.push('Quantified business impact metrics');
    improvements.push('Professional experience is present, but measurable outcomes (e.g. % improvements, efficiency gains, user adoption) could strengthen the section.');
  }

  if (detected.length === 0) {
    detected.push('No experience section found');
    missing.push('Work experience / Internship section');
    improvements.push('Add internships, freelance projects, or academic roles with ownership details.');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'experience',
    name: 'Experience / Internships',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.experience),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.experience * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Well-documented internship or work history with decisive action verbs and quantified impact.'
        : clampedScore >= 50
        ? 'Professional experience is present, but measurable outcomes could strengthen the section.'
        : 'Minimal or no experience listed. Add internships, freelance projects, or academic roles.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * 7. Achievements Scorer (5%)
 * Only awards credit for explicitly listed awards, hackathons, coding competitions, scholarships, publications.
 * Score = 0 if none present.
 */
export function scoreAchievements(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  const missing: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  // Check if explicit Achievements / Awards / Hackathons section exists
  const hasAchSection = /(^|\n)\s*(achievements?|awards?|honors?|hackathons?|smart\s+india\s+hackathon|\bsih\b|competitions?|olympiad|scholarships?|fellowships?)\b/i.test(text);

  // Check standing / placement details in explicit context (strictly excluding generic "selected")
  const standingMatch = text.match(/(1st|2nd|3rd|first place|second place|winner|runner-?up|finalist|gold medalist|top \d+%|rank \d+|dean's list)/i);

  // Competitive programming / hackathon context
  const competitiveMatch = text.match(/(hackathon|smart india hackathon|\bsih\b|codeforces|leetcode|codechef|kaggle|olympiad|paper publication|patent)/i);

  const hasAnyAchievement = hasAchSection || standingMatch || competitiveMatch;

  if (!hasAnyAchievement) {
    score = 0;
    detected.push('No achievements found');
    missing.push('Competitive achievements / Awards / Hackathons');
    improvements.push('Participate in hackathons (e.g. Smart India Hackathon), technical competitions, or open-source initiatives to build achievement proof.');
  } else {
    if (hasAchSection) {
      score += 40;
      detected.push('Achievements / Honors Documented');
    }
    if (standingMatch) {
      score += 35;
      detected.push(`Demonstrated Standing: "${standingMatch[0]}"`);
    } else if (hasAchSection) {
      score += 15;
    }
    if (competitiveMatch) {
      score += 25;
      detected.push(`Competitive context: ${competitiveMatch[0]}`);
    }
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'achievements',
    name: 'Achievements',
    score: clampedScore,
    weight: RECRUTER_WEIGHTS_SAFE(RECRUITER_READINESS_WEIGHTS.achievements),
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.achievements * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Excellent competitive achievements, awards, or hackathon recognitions that catch recruiter attention.'
        : clampedScore >= 40
        ? 'Some achievements or activities present; highlight competitive standings or awards if available.'
        : 'No achievements listed in resume. Participating in hackathons (e.g. SIH) or competitions creates standout appeal.',
    itemsDetected: detected,
    missing,
    improvements,
  };
}

/**
 * Main Master-Prompt Compliant Recruiter Readiness Calculator
 *
 * Formula:
 * Overall Score = Σ(Category Score × Category Weight)
 * Clamped strictly to [0, 100], rounded to whole integer.
 */
export function computeRecruiterReadiness(data?: StudentInputData | null): RecruiterReadinessResult {
  const safeData = data || { resumeText: '' };
  const resumeText = typeof safeData.resumeText === 'string' ? safeData.resumeText : '';
  const candidateName = typeof safeData.candidateName === 'string' ? safeData.candidateName : '';
  const skillsFound = Array.isArray(safeData.skillsFound) ? safeData.skillsFound : [];
  const missingSkills = Array.isArray(safeData.missingSkills) ? safeData.missingSkills : [];
  const targetRole = typeof safeData.targetRole === 'string' && safeData.targetRole.trim().length > 0 ? safeData.targetRole.trim() : 'Full Stack Software Engineer';

  // 1. Calculate each category deterministically
  const catProfile = scoreProfileResume(resumeText, candidateName);
  const catSkills = scoreSkills(skillsFound, missingSkills, resumeText);
  const catProjects = scoreProjects(resumeText);
  const catEducation = scoreEducation(resumeText);
  const catCertifications = scoreCertifications(resumeText);
  const catExperience = scoreExperience(resumeText);
  const catAchievements = scoreAchievements(resumeText);

  const categories: ReadinessCategoryScore[] = [
    catProfile,
    catSkills,
    catProjects,
    catEducation,
    catCertifications,
    catExperience,
    catAchievements,
  ];

  // 2. Weighted Overall Score calculation with strict safety
  const weightedSum = categories.reduce((sum, cat) => {
    const s = typeof cat.score === 'number' && !isNaN(cat.score) && isFinite(cat.score) ? cat.score : 0;
    const w = typeof cat.weight === 'number' && !isNaN(cat.weight) && isFinite(cat.weight) ? cat.weight : 0;
    return sum + s * w;
  }, 0);
  const overallScore = Math.max(0, Math.min(100, isNaN(weightedSum) || !isFinite(weightedSum) ? 0 : Math.round(weightedSum)));

  // 3. Readiness Level classification
  let readinessLevel: RecruiterReadinessLevel = 'Early Preparation';
  let badgeColor = {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800/60',
    badge: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200',
  };

  if (overallScore >= 80) {
    readinessLevel = 'Highly Recruiter Ready';
    badgeColor = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
    };
  } else if (overallScore >= 60) {
    readinessLevel = 'Recruiter Ready';
    badgeColor = {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/60',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
    };
  } else if (overallScore >= 40) {
    readinessLevel = 'Needs Improvement';
    badgeColor = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
    };
  }

  // 4. Genuine Strengths Generation (ONLY categories where score >= 70 AND actual positive items detected)
  const strengths: string[] = [];
  for (const cat of categories) {
    const hasPositiveItems = cat.itemsDetected.some((item) => !/^no\b/i.test(item));
    if (cat.score >= 70 && hasPositiveItems) {
      if (cat.id === 'profileResume') {
        strengths.push('Complete and professional profile with verified contact details and clear objective/summary.');
      } else if (cat.id === 'skills') {
        strengths.push(`Strong skill coverage with ${cat.itemsDetected[0] || 'multiple technical proficiencies'}.`);
      } else if (cat.id === 'projects') {
        strengths.push('Solid project portfolio demonstrating hands-on implementation and technology stacks.');
      } else if (cat.id === 'education') {
        strengths.push('Well-structured academic background with clear degree, institution, and timeline.');
      } else if (cat.id === 'certifications') {
        strengths.push('Verified industry certifications demonstrating continuous learning and credentials.');
      } else if (cat.id === 'experience') {
        strengths.push('Practical work or internship experience backed by action verbs and quantified impact.');
      } else if (cat.id === 'achievements') {
        strengths.push('Distinguished achievements, awards, or hackathon recognitions that catch recruiter attention.');
      }
    }
  }

  // Fallback strength if candidate has few >= 70 scores
  if (strengths.length === 0) {
    const bestCat = [...categories].sort((a, b) => b.score - a.score)[0];
    if (bestCat && bestCat.score >= 40) {
      strengths.push(`Foundational progress in ${bestCat.name} (${bestCat.score}/100) provides a starting base.`);
    }
  }

  // 5. Genuine Areas to Improve Generation (categories where score < 70)
  const areasToImprove: string[] = [];
  for (const cat of categories) {
    if (cat.score < 70) {
      if (cat.id === 'profileResume') {
        const hasLinkedIn = cat.itemsDetected.some((i) => /linkedin/i.test(i));
        if (hasLinkedIn) {
          areasToImprove.push('LinkedIn is present. Add GitHub or portfolio links to showcase repository code.');
        } else {
          areasToImprove.push('Add missing contact links (LinkedIn, GitHub) and a crisp career summary to the profile.');
        }
      } else if (cat.id === 'skills') {
        areasToImprove.push(`Expand technical skills matching ${targetRole} requirements and categorize them into Languages, Frameworks, Databases, and Tools.`);
      } else if (cat.id === 'projects') {
        const hasRepo = cat.itemsDetected.some((i) => /repository|github/i.test(i));
        if (!hasRepo) {
          areasToImprove.push('Projects exist but GitHub links are missing. Add repository URLs to demonstrate implementation.');
        } else {
          areasToImprove.push('Add detailed project descriptions, technologies used, and measurable outcomes.');
        }
      } else if (cat.id === 'education') {
        areasToImprove.push('Specify degree major, institution/college name, and graduation timeline.');
      } else if (cat.id === 'certifications') {
        areasToImprove.push('No certifications were detected. Acquire and showcase recognized vendor or platform certifications as an optional boost.');
      } else if (cat.id === 'experience') {
        const hasMetrics = cat.itemsDetected.some((i) => /quantified|metrics/i.test(i));
        if (!hasMetrics && catExperience.score > 0) {
          areasToImprove.push('Professional experience is present, but measurable outcomes (e.g. % improvements, efficiency gains) could strengthen the section.');
        } else {
          areasToImprove.push('Add internship or practical experience details with quantifiable impact metrics.');
        }
      } else if (cat.id === 'achievements') {
        areasToImprove.push('No achievements detected. Participate in hackathons (e.g. Smart India Hackathon) or coding competitions to build proof.');
      }
    }
  }

  // 6. EXACTLY 6 Tailored Actionable Recommendations (Prioritized by Impact)
  const recList: string[] = [];

  // Rec 1: Highest Impact Profile / Summary
  const hasLinkedIn = catProfile.itemsDetected.some((i) => /linkedin/i.test(i));
  const hasObjective = catProfile.itemsDetected.some((i) => /objective/i.test(i));
  if (hasObjective && !catProfile.itemsDetected.some((i) => /summary section/i.test(i))) {
    recList.push(`Replace the generic objective with a 2–3 sentence ${targetRole} professional summary highlighting your key technical skills and project experience.`);
  } else if (!hasLinkedIn) {
    recList.push('Add a hyperlinked LinkedIn profile URL to your resume top header for instant recruiter verification.');
  } else {
    recList.push(`Refine your top header and summary to highlight relevant keywords for ${targetRole} openings.`);
  }

  // Rec 2: Skills Improvement
  if (missingSkills.length > 0) {
    recList.push(`Incorporate key target role skills (${missingSkills.slice(0, 3).map((m) => m.skill).join(', ')}) into your skills and project descriptions.`);
  } else {
    recList.push('Group your technical skills into clear categories (Programming Languages, Frameworks, Databases, Tools) to optimize ATS ingestion.');
  }

  // Rec 3: Project Improvement
  const hasRepoLink = catProjects.itemsDetected.some((i) => /repository|github/i.test(i));
  if (!hasRepoLink && catProjects.score > 0) {
    recList.push('Add GitHub repository links to your listed projects to allow recruiters to inspect your source code.');
  } else if (catProjects.score === 0) {
    recList.push('Add 2-3 technical projects demonstrating practical implementation details, tech stack, and GitHub URLs.');
  } else {
    recList.push('Include quantifiable performance metrics (e.g., % accuracy gains, reduced latency) in project bullet points.');
  }

  // Rec 4: Experience / Metrics Improvement
  const hasExpMetrics = catExperience.itemsDetected.some((i) => /quantified|metrics/i.test(i));
  if (!hasExpMetrics && catExperience.score > 0) {
    recList.push('Professional experience is present; add measurable outcomes (e.g., % efficiency gains, user adoption, throughput) to your work experience bullets.');
  } else if (catExperience.score === 0) {
    recList.push('Add internship or practical experience details highlighting key ownership action verbs and technical deliverables.');
  } else {
    recList.push('Strengthen bullet points using Google’s XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".');
  }

  // Rec 5: Certification Improvement
  if (catCertifications.score === 0) {
    recList.push('No certifications were detected; consider completing relevant industry certifications or verified courses (e.g. AWS, Meta, or domain coursework) as an optional boost.');
  } else {
    recList.push('Highlight vendor-recognized certification badges (e.g., AWS, Meta, Microsoft) at the top of your resume.');
  }

  // Rec 6: Achievement / Portfolio Improvement
  if (catAchievements.score === 0) {
    recList.push('Participate in hackathons (such as Smart India Hackathon), technical competitions, or open-source initiatives to build verified achievement proof.');
  } else {
    recList.push('Quantify your competitive standings (e.g., 1st Place, Top 5% finalist) prominently in your Achievements section.');
  }

  // Ensure exactly 6 recommendations
  const finalRecommendations = recList.slice(0, 6);

  // 7. Transparent Calculation Explanation
  const explanation = {
    formula: 'Overall Score = Σ(Category Score × Category Weight)',
    categoryWeights: categories.map((cat) => ({
      name: cat.name,
      weightPercentage: Math.round(cat.weight * 100),
      score: cat.score,
    })),
    description:
      'The Overall Recruiter Readiness Score evaluates how prepared you are for recruiter screening based on your real resume data. It combines Profile completeness (20%), Skills coverage (20%), Projects portfolio (20%), Education (10%), Certifications (10%), Experience/Internships (15%), and Achievements (5%). Each category is normalized 0–100 and weighted into the final score.',
  };

  return {
    overallScore,
    readinessLevel,
    badgeColor,
    categories,
    strengths,
    areasToImprove,
    recommendations: finalRecommendations,
    explanation,
  };
}
