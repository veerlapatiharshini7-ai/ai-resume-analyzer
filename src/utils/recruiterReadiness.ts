/**
 * recruiterReadiness.ts
 *
 * PURPOSE:
 * Deterministic, explainable, safe calculation of the Overall Recruiter Readiness Score (0-100)
 * based on real student/resume data across 7 centralized categories:
 * - Profile / Resume (20%)
 * - Skills (20%)
 * - Projects (20%)
 * - Education (10%)
 * - Certifications (10%)
 * - Experience / Internships (15%)
 * - Achievements (5%)
 *
 * Guarantees:
 * - Deterministic: identical inputs produce identical outputs every time
 * - Safe: guards against null, undefined, empty arrays, NaN, Infinity
 * - Clamped: 0 <= score <= 100, rounded to whole numbers
 * - No fake or random data
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
 * Easily modifiable in one place.
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

/**
 * 1. Profile / Resume Scorer (20%)
 * Evaluates candidate name, contact email, phone, professional links,
 * career summary/objective, and general completeness.
 */
export function scoreProfileResume(resumeText: string = '', candidateName: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  let score = 0;

  // Name check (non-empty, reasonable length, not placeholder)
  const trimmedName = (candidateName || '').trim();
  const isPlaceholder = !trimmedName || /^(candidate|professional candidate|valued candidate|john doe)$/i.test(trimmedName);
  if (!isPlaceholder && trimmedName.length >= 3 && trimmedName.length <= 60) {
    score += 25;
    detected.push(`Candidate Name: ${trimmedName}`);
  }

  // Email check
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (hasEmail) {
    score += 20;
    detected.push('Valid Email Address');
  }

  // Phone check
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  if (hasPhone) {
    score += 15;
    detected.push('Contact Phone Number');
  }

  // Professional Links (LinkedIn / GitHub / Portfolio)
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);
  const hasPortfolio = /(portfolio|website|https?:\/\/)/i.test(text);
  if (hasLinkedIn || hasGitHub || hasPortfolio) {
    score += 15;
    const links = [hasLinkedIn && 'LinkedIn', hasGitHub && 'GitHub', hasPortfolio && 'Portfolio'].filter(Boolean);
    detected.push(`Professional Links (${links.join(', ')})`);
  }

  // Career Summary / Objective presence
  const hasSummary = /(summary|professional summary|executive summary|career objective|about me|profile overview)/i.test(text);
  if (hasSummary) {
    score += 15;
    detected.push('Professional Summary / Objective Section');
  }

  // Length & document substance
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 150) {
    score += 10;
    detected.push(`Comprehensive Document Substance (${words} words)`);
  } else if (words >= 50) {
    score += 5;
    detected.push(`Basic Document Substance (${words} words)`);
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
        ? 'Profile information is well-rounded with clear contact, summary, and layout details.'
        : clampedScore >= 50
        ? 'Core profile details are present, but contact links or executive summary can be enhanced.'
        : 'Incomplete profile. Important contact info, professional links, or summary are missing.',
    itemsDetected: detected,
  };
}

function RECRUTER_WEIGHTS_SAFE(weight: number): number {
  return typeof weight === 'number' && !isNaN(weight) ? weight : 0;
}

/**
 * 2. Skills Scorer (20%)
 * Evaluates skill count, technical diversity, categorization, and missing gaps.
 */
export function scoreSkills(
  skillsFound: Array<{ category: string; skills: string[] }> = [],
  missingSkills: Array<{ skill: string; priority: string }> = [],
  resumeText: string = ''
): ReadinessCategoryScore {
  const flatSkills = Array.isArray(skillsFound) ? skillsFound.flatMap((c) => c.skills || []) : [];
  const text = (resumeText || '').toLowerCase();
  const detected: string[] = [];
  let score = 0;

  // Skills Count Points (up to 50 pts)
  const count = flatSkills.length;
  if (count >= 14) {
    score += 50;
    detected.push(`${count} technical & domain skills identified`);
  } else if (count >= 10) {
    score += 42;
    detected.push(`${count} technical & domain skills identified`);
  } else if (count >= 6) {
    score += 32;
    detected.push(`${count} technical skills identified`);
  } else if (count >= 3) {
    score += 22;
    detected.push(`${count} skills identified`);
  } else if (count >= 1) {
    score += 12;
    detected.push(`${count} skill identified`);
  }

  // Categorization Presence (up to 20 pts)
  const categoryCount = Array.isArray(skillsFound) ? skillsFound.length : 0;
  if (categoryCount >= 2) {
    score += 20;
    detected.push(`Categorized across ${categoryCount} distinct domains`);
  } else if (categoryCount === 1) {
    score += 10;
    detected.push('Single categorized skill group');
  }

  // Gaps evaluation (up to 20 pts)
  const highPriorityMissing = Array.isArray(missingSkills)
    ? missingSkills.filter((m) => m && m.priority === 'High').length
    : 0;
  if (highPriorityMissing === 0 && count >= 5) {
    score += 20;
    detected.push('Zero critical missing skill gaps for target role');
  } else if (highPriorityMissing <= 2) {
    score += 12;
    detected.push('Minor missing skill gaps');
  } else {
    score += 5;
  }

  // Developer Ecosystem & Tooling (up to 10 pts)
  const ecosystemKeywords = ['git', 'github', 'docker', 'ci/cd', 'linux', 'rest', 'api', 'sql', 'unit test', 'cloud'];
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
    weight: RECRUITER_READINESS_WEIGHTS.skills,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.skills * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Robust technical and professional skill footprint aligning with recruiter criteria.'
        : clampedScore >= 50
        ? 'Decent skill coverage, but key tools or role-specific libraries should be expanded.'
        : 'Limited skills detected. Add core programming languages, frameworks, and tools.',
    itemsDetected: detected,
  };
}

/**
 * 3. Projects Scorer (20%)
 * Evaluates project portfolio, project descriptions, technologies used, and outcomes.
 */
export function scoreProjects(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  let score = 0;

  // Projects section presence (30 pts)
  const hasProjectsSection = /(projects|academic projects|personal projects|key projects|capstone projects)/i.test(text);
  if (hasProjectsSection) {
    score += 30;
    detected.push('Dedicated Projects Section');
  }

  // Estimate project entries count (up to 30 pts)
  const projectSectionMatch = text.match(/(?:projects|academic projects|personal projects)[\s\S]*?(?:education|experience|skills|certifications|$)/i);
  const projectSnippet = projectSectionMatch ? projectSectionMatch[0] : text;

  const projectBulletMatches = projectSnippet.match(/(?:^|\n)\s*[•\-*]\s+([^\n]+)/g) || [];
  const projectTitleMatches = projectSnippet.match(/(?:^|\n)([A-Z][A-Za-z0-9\s-]{3,35}(?:App|Dashboard|System|Platform|API|Tool|Bot|Engine|Website|Tracker|Manager|Portal|Hub))/g) || [];

  const estimatedProjects = Math.max(
    projectTitleMatches.length,
    Math.min(4, Math.floor(projectBulletMatches.length / 2))
  );

  if (hasProjectsSection && estimatedProjects >= 3) {
    score += 30;
    detected.push(`Multi-project portfolio (${estimatedProjects}+ projects detected)`);
  } else if (hasProjectsSection && estimatedProjects >= 2) {
    score += 25;
    detected.push(`Multiple projects detected (${estimatedProjects} projects)`);
  } else if (hasProjectsSection || estimatedProjects >= 1) {
    score += 15;
    detected.push('At least 1 project demonstrated');
  }

  // Tech stack explicitly linked with projects (up to 20 pts)
  const techInProjects = /(tech stack|technologies|built with|developed with|using\s+[A-Za-z]+|react|node|python|sql|mongo|docker|flutter|express|django|flask)/i.test(projectSnippet);
  if (techInProjects) {
    score += 20;
    detected.push('Technologies & stack clearly detailed per project');
  }

  // Measurable outcomes / GitHub links / Demos in projects (up to 20 pts)
  const hasOutcomeOrLink = /(github\.com\/|demo|live|deployed|active users|reduced|improved|increased|\d+%)/i.test(projectSnippet);
  if (hasOutcomeOrLink) {
    score += 20;
    detected.push('Includes project outcomes, metrics, or repository links');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'projects',
    name: 'Projects',
    score: clampedScore,
    weight: RECRUITER_READINESS_WEIGHTS.projects,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.projects * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Impressive project portfolio demonstrating practical implementation and modern stack.'
        : clampedScore >= 50
        ? 'Projects are listed, but could benefit from clearer stack callouts, metrics, or GitHub links.'
        : 'Weak or missing projects. Recruiters prioritize candidates with tangible code projects.',
    itemsDetected: detected,
  };
}

/**
 * 4. Education Scorer (10%)
 * Evaluates degree, institution, academic details, and graduation timeline.
 */
export function scoreEducation(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
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
  }

  // University / College / Institution (20 pts)
  const instituteMatch = text.match(/(university|college|institute|school|academy|campus|iit|nit|bits|iiit)/i);
  if (instituteMatch) {
    score += 20;
    detected.push(`Academic Institution Specified (${instituteMatch[0]})`);
  }

  // Academic Details: Graduation Year or GPA (15 pts)
  const hasYearOrGPA = /(20\d\d|19\d\d|gpa|cgpa|\d\.\d\d?\/|percentage|\b\d{2}%\b)/i.test(text);
  if (hasYearOrGPA) {
    score += 15;
    detected.push('Graduation Timeline / Academic Score Specified');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'education',
    name: 'Education',
    score: clampedScore,
    weight: RECRUITER_READINESS_WEIGHTS.education,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.education * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Complete educational credentials including degree, institution, and graduation timeline.'
        : clampedScore >= 50
        ? 'Education section present, but missing institution name, graduation year, or major details.'
        : 'Incomplete education details. Ensure degree, college name, and dates are clearly stated.',
    itemsDetected: detected,
  };
}

/**
 * 5. Certifications Scorer (10%)
 * Evaluates industry certifications, recognized providers, and credentials.
 */
export function scoreCertifications(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  let score = 0;

  // Section or mention presence (30 pts)
  const hasCertSection = /(certificat|licensed|credentials?|accreditations?|courses? completed)/i.test(text);
  if (hasCertSection) {
    score += 30;
    detected.push('Certifications / Credentials Mentioned');
  }

  // Industry-recognized providers (up to 40 pts)
  const providers = ['aws', 'meta', 'google', 'microsoft', 'azure', 'oracle', 'coursera', 'udemy', 'nptel', 'edx', 'cisco', 'comptia', 'hackerrank', 'leetcode', 'freecodecamp'];
  const matchedProviders = providers.filter((p) => new RegExp(`\\b${p}\\b`, 'i').test(text));

  if (matchedProviders.length >= 2) {
    score += 40;
    detected.push(`Recognized Providers: ${matchedProviders.map((p) => p.toUpperCase()).join(', ')}`);
  } else if (matchedProviders.length === 1) {
    score += 25;
    detected.push(`Recognized Provider: ${matchedProviders[0].toUpperCase()}`);
  }

  // Multiple or explicit certification titles (up to 30 pts)
  const certKeywords = ['certified', 'certification', 'specialization', 'associate', 'professional certificate', 'fellow'];
  const certHits = certKeywords.filter((k) => new RegExp(`\\b${k}\\b`, 'i').test(text)).length;
  if (certHits >= 2 || matchedProviders.length >= 2) {
    score += 30;
    detected.push('Multiple verified credentials / specializations');
  } else if (certHits >= 1 || matchedProviders.length >= 1) {
    score += 15;
    detected.push('Specialized coursework credential');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'certifications',
    name: 'Certifications',
    score: clampedScore,
    weight: RECRUITER_READINESS_WEIGHTS.certifications,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.certifications * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Verified industry credentials and certifications demonstrating proactive learning.'
        : clampedScore >= 40
        ? 'Some coursework or certification mentioned, but recognized vendor credentials add weight.'
        : 'No certifications detected. Adding industry certifications significantly boosts recruiter appeal.',
    itemsDetected: detected,
  };
}

/**
 * 6. Experience / Internships Scorer (15%)
 * Evaluates work experience, internships, tenure, action verbs, and business impact.
 */
export function scoreExperience(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  let score = 0;

  // Section presence (30 pts)
  const hasExpSection = /(experience|work experience|employment|internships?|work history|professional experience)/i.test(text);
  if (hasExpSection) {
    score += 30;
    detected.push('Experience / Internship Section Present');
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

  // Quantifiable business impact metrics (up to 20 pts)
  const metricsCount = (text.match(/\d+%\b|\$\d+|\d+x\b|\b\d{2,}\b|\b\d+\+\b/g) || []).length;
  if (metricsCount >= 3) {
    score += 20;
    detected.push(`Multiple quantifiable metrics & business outcomes (${metricsCount}+ metrics)`);
  } else if (metricsCount >= 1) {
    score += 10;
    detected.push('Includes quantified result');
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'experience',
    name: 'Experience / Internships',
    score: clampedScore,
    weight: RECRUITER_READINESS_WEIGHTS.experience,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.experience * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Well-documented internship or work history with decisive action verbs and quantified impact.'
        : clampedScore >= 50
        ? 'Experience is present, but could be elevated with more quantifiable metrics and results.'
        : 'Minimal or no experience listed. Add internships, freelance projects, or academic roles.',
    itemsDetected: detected,
  };
}

/**
 * 7. Achievements Scorer (5%)
 * Evaluates awards, honors, hackathons (e.g. Smart India Hackathon), competitions, and recognitions.
 */
export function scoreAchievements(resumeText: string = ''): ReadinessCategoryScore {
  const text = resumeText || '';
  const detected: string[] = [];
  let score = 0;

  // Recognition / Hackathons keywords (40 pts)
  const hasAchSection = /(achievements?|awards?|honors?|hackathons?|smart india hackathon|sih|competitions?|olympiad|scholarships?|fellowships?)/i.test(text);
  if (hasAchSection) {
    score += 40;
    detected.push('Achievements / Honors / Hackathons Documented');
  }

  // Standing / Placement details (up to 35 pts)
  const standingMatch = text.match(/(1st|2nd|3rd|first place|second place|winner|runner-?up|finalist|top \d+%|rank \d+|semifinalist|selected|gold medalist|dean's list)/i);
  if (standingMatch) {
    score += 35;
    detected.push(`Demonstrated Standing: "${standingMatch[0]}"`);
  } else if (hasAchSection) {
    score += 15;
  }

  // Event or Competitive Programming context (up to 25 pts)
  const competitiveMatch = text.match(/(hackathon|sih|smart india hackathon|codeforces|leetcode|codechef|kaggle|conference|paper|publication|patent)/i);
  if (competitiveMatch) {
    score += 25;
    detected.push(`Competitive context: ${competitiveMatch[0]}`);
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = clampedScore >= 75 ? 'Strong' : clampedScore >= 50 ? 'Moderate' : 'Needs Improvement';

  return {
    id: 'achievements',
    name: 'Achievements',
    score: clampedScore,
    weight: RECRUITER_READINESS_WEIGHTS.achievements,
    weightedScore: Math.round(clampedScore * RECRUITER_READINESS_WEIGHTS.achievements * 10) / 10,
    status,
    summary:
      clampedScore >= 75
        ? 'Excellent competitive achievements, awards, or hackathon recognitions that catch recruiter attention.'
        : clampedScore >= 40
        ? 'Some achievements or activities present; highlight competitive standings or awards if available.'
        : 'No achievements listed. Participating in hackathons (e.g., SIH) or competitions creates standout appeal.',
    itemsDetected: detected,
  };
}

/**
 * Main Deterministic Recruiter Readiness Calculator
 *
 * Formula:
 * Overall Score = Σ(Category Score × Category Weight)
 * Clamped strictly to [0, 100], rounded to whole integer.
 */
export function computeRecruiterReadiness(data: StudentInputData): RecruiterReadinessResult {
  const resumeText = data.resumeText || '';
  const candidateName = data.candidateName || '';
  const skillsFound = data.skillsFound || [];
  const missingSkills = data.missingSkills || [];

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

  // 2. Weighted Overall Score calculation
  const weightedSum = categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0);
  const overallScore = Math.max(0, Math.min(100, Math.round(weightedSum)));

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

  // 4. Strengths Generation (ONLY categories where score >= 70 AND actual items detected)
  const strengths: string[] = [];
  for (const cat of categories) {
    if (cat.score >= 70 && cat.itemsDetected.length > 0) {
      if (cat.id === 'profileResume') {
        strengths.push('Complete and professional profile with verified contact details and clear summary.');
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

  // 5. Areas to Improve Generation (categories where score < 70)
  const areasToImprove: string[] = [];
  for (const cat of categories) {
    if (cat.score < 70) {
      if (cat.id === 'profileResume') {
        areasToImprove.push('Add missing contact links (LinkedIn, GitHub) and a crisp career summary to the profile.');
      } else if (cat.id === 'skills') {
        areasToImprove.push('Expand technical skills and categorize them into Languages, Frameworks, and Tools.');
      } else if (cat.id === 'projects') {
        areasToImprove.push('Add detailed project descriptions, technologies used, and measurable outcomes or GitHub links.');
      } else if (cat.id === 'education') {
        areasToImprove.push('Specify degree major, institution/college name, and graduation timeline.');
      } else if (cat.id === 'certifications') {
        areasToImprove.push('Acquire and showcase recognized vendor or platform certifications (AWS, Meta, Coursera, etc.).');
      } else if (cat.id === 'experience') {
        areasToImprove.push('Add internship or practical experience details with quantifiable impact metrics.');
      } else if (cat.id === 'achievements') {
        areasToImprove.push('Participate in hackathons (e.g. Smart India Hackathon) or coding competitions to build achievement proof.');
      }
    }
  }

  // 6. Actionable Personalized Recommendations (targeted specifically to weak categories)
  const recommendations: string[] = [];
  if (catProjects.score < 70) {
    recommendations.push('Add project descriptions, technologies used, and outcomes (e.g., GitHub links, user adoption, performance metrics).');
  }
  if (catCertifications.score < 70) {
    recommendations.push('Add relevant industry certifications to your profile (e.g., AWS, Meta, or domain coursework credentials).');
  }
  if (catExperience.score < 70) {
    recommendations.push('Add internship or practical experience details if available, highlighting key ownership verbs and outcomes.');
  }
  if (catProfile.score < 70) {
    recommendations.push('Complete missing profile information including LinkedIn, GitHub URLs, and a focused 2-3 sentence executive summary.');
  }
  if (catSkills.score < 70) {
    recommendations.push('Highlight modern frameworks and tools matching your target role, grouping them into distinct categories.');
  }
  if (catEducation.score < 70) {
    recommendations.push('Ensure complete educational details including degree name, college/university, and graduation dates.');
  }
  if (catAchievements.score < 70) {
    recommendations.push('Participate in hackathons (such as Smart India Hackathon), technical competitions, or open-source initiatives to build achievements.');
  }

  // If candidate is already strong across all categories, give polish advice
  if (recommendations.length === 0) {
    recommendations.push('Keep your profile updated with recent project releases and ensure your GitHub repositories have clean READMEs.');
  }

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
    recommendations,
    explanation,
  };
}
