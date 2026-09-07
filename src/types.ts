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
  analyzedAt: string;
}

export interface SampleResume {
  id: string;
  title: string;
  role: string;
  fileName: string;
  text: string;
}

export type CoverLetterTone = 'Professional' | 'Confident' | 'Friendly' | 'Formal';

export interface CoverLetterRequest {
  resumeText: string;
  targetRole: string;
  companyName?: string;
  jobDescription?: string;
  tone?: CoverLetterTone;
}

export interface CoverLetterResponse {
  coverLetter: string;
  candidateName?: string;
  targetRole?: string;
  companyName?: string;
  tone?: CoverLetterTone;
  wordCount?: number;
  usedFallback?: boolean;
  generatedAt?: string;
}
