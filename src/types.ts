export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface MissingSkill {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface GrammarSuggestion {
  originalText: string;
  suggestion: string;
  reason: string;
}

export interface ImprovementTip {
  section: string;
  tip: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface Certification {
  name: string;
  provider: string;
  relevance: string;
}

export interface ProjectRecommendation {
  title: string;
  description: string;
  techStack: string[];
  difficulty: string;
}

export interface JobRoleMatch {
  title: string;
  matchPercentage: number;
  keyRequirements: string;
}

export interface SectionScores {
  formatting: number;
  keywords: number;
  experienceImpact: number;
  skillsMatch: number;
  readability: number;
}

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

export interface AnalysisResult {
  atsScore: number;
  atsCategory: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical Updates Needed';
  candidateName: string;
  targetRole: string;
  summary: string;
  skillsFound: SkillCategory[];
  missingSkills: MissingSkill[];
  strengths: string[];
  weaknesses: string[];
  grammarSuggestions: GrammarSuggestion[];
  improvementTips: ImprovementTip[];
  recommendedCertifications: Certification[];
  recommendedProjects: ProjectRecommendation[];
  suitableJobRoles: JobRoleMatch[];
  sectionScores: SectionScores;
  recruiterReadiness?: RecruiterReadinessResult;
  analyzedAt: string;
}

export interface SampleResume {
  id: string;
  title: string;
  role: string;
  fileName: string;
  text: string;
}

