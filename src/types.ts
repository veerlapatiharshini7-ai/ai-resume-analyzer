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
  usedFallback?: boolean;
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

export interface ResumeHistoryItem {
  id: string;
  fileName: string;
  date: string;
  atsScore: number;
  result: AnalysisResult;
}

export type InterviewLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewType = 'Technical' | 'HR / Behavioral' | 'Mixed';
export type InterviewQuestionCount = 5 | 10 | 15 | 20;
export type InterviewDuration = '10 minutes' | '20 minutes' | '30 minutes' | 'No time limit';
export type InterviewMode = 'Chat' | 'Voice';

export interface ResumeReference {
  id?: string;
  fileName: string;
  candidateName?: string;
  textSnippet?: string;
  fullText?: string;
  hasAnalysis?: boolean;
}

export interface InterviewConfig {
  resumeId?: string;
  resumeReference?: ResumeReference;
  targetRole: string;
  interviewLevel: InterviewLevel;
  interviewType: InterviewType;
  questionCount: InterviewQuestionCount;
  duration: InterviewDuration;
  interviewMode: InterviewMode;
  createdAt: string;
}

export type QuestionCategory = 'Technical' | 'Behavioral' | 'Situational' | 'Background';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  difficulty: InterviewLevel;
  topic?: string;
  expectedFocus?: string;
}

export interface QuestionGenerationResponse {
  questions: InterviewQuestion[];
  config: InterviewConfig;
  generatedAt: string;
}

export interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
  questionNumber: number;
  submittedAt: string;
  category?: QuestionCategory;
  difficulty?: InterviewLevel;
  topic?: string;
  expectedFocus?: string;
}

export interface CompletedInterviewSession {
  id: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  startedAt: string;
  completedAt: string;
  isTimedOut?: boolean;
}

export interface AnswerCriteriaScores {
  relevance: number; // 0-10
  technicalAccuracy: number; // 0-10
  clarity: number; // 0-10
  completeness: number; // 0-10
  communication: number; // 0-10
}

export interface BehavioralSTARBreakdown {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
}

export interface InterviewAnswerEvaluation {
  questionId: string;
  questionNumber: number;
  question: string;
  answer: string;
  overallScore: number; // 0-10
  criteria: AnswerCriteriaScores;
  strengths: string[];
  improvements: string[];
  feedback: string;
  behavioralEvaluation?: BehavioralSTARBreakdown | null;
  evaluatedAt: string;
}

export interface InterviewEvaluationResult {
  sessionId?: string;
  config: InterviewConfig;
  evaluations: InterviewAnswerEvaluation[];
  evaluatedAt: string;
  usedFallback?: boolean;
}

export interface InterviewDimensionScore {
  dimension: string;
  score: number; // 0-10
  description: string;
}

export interface InterviewPerformanceSummary {
  overall: string;
  technical: string;
  behavioral: string;
  communication: string;
}

export interface QuestionScoreSummary {
  questionId: string;
  questionNumber: number;
  question: string;
  category: QuestionCategory;
  topic?: string;
  score: number; // 0-10
}

export interface InterviewFinalSummary {
  sessionId?: string;
  config: InterviewConfig;
  overallScore: number; // 0-10 (e.g. 7.8)
  overallRating: 'Excellent' | 'Strong' | 'Good' | 'Partially Satisfactory' | 'Needs Improvement' | 'Very Weak';
  performanceSummary: InterviewPerformanceSummary;
  keyStrengths: string[];
  areasForImprovement: string[];
  dimensionScores: InterviewDimensionScore[];
  questionSummaries: QuestionScoreSummary[];
  calculatedAt: string;
}

export interface HistoricalInterviewRecord {
  id: string;
  savedAt: string;
  completedAt: string;
  startedAt: string;
  targetRole: string;
  interviewLevel: InterviewLevel;
  interviewType: InterviewType;
  interviewMode: InterviewMode;
  questionCount: number;
  duration: InterviewDuration;
  overallScore: number;
  overallRating: 'Excellent' | 'Strong' | 'Good' | 'Partially Satisfactory' | 'Needs Improvement' | 'Very Weak';
  isTimedOut?: boolean;
  candidateName?: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  perQuestionScores: QuestionScoreSummary[];
  session: CompletedInterviewSession;
  evaluations: InterviewAnswerEvaluation[];
  finalSummary: InterviewFinalSummary;
}

export interface ScoreTrendPoint {
  id: string;
  date: string;
  role: string;
  mode: InterviewMode;
  score: number;
  rating: string;
}

export interface DimensionAverage {
  dimension: string;
  averageScore: number;
  sessionCount: number;
}

export interface InterviewProgressStats {
  totalCompleted: number;
  averageScore: number;
  bestScore: number;
  latestScore: number | null;
  scoreChange: number | null;
  chatCount: number;
  voiceCount: number;
  scoreTrend: ScoreTrendPoint[];
  dimensionAverages: DimensionAverage[];
}

export type AppView =
  | 'analyzer'
  | 'cover-letter'
  | 'interview-setup'
  | 'interview-generating'
  | 'interview-preview'
  | 'interview-ready'
  | 'interview-chat'
  | 'interview-voice'
  | 'interview-chat-placeholder'
  | 'interview-evaluating'
  | 'interview-evaluation'
  | 'interview-summary'
  | 'interview-history';
