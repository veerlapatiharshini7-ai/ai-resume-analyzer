import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';

const __dirname = typeof import.meta !== 'undefined' && import.meta?.url
  ? path.dirname(fileURLToPath(import.meta.url))
  : process.cwd();

// Load .env reliably from current working directory and module directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (path.resolve(__dirname, '.env') !== path.resolve(process.cwd(), '.env')) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}
dotenv.config();
// Also load .env.local if present
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import {
  computeSectionScores,
  calculateFinalATS,
  getRoleProfile,
  extractCandidateSkillsCategorized,
  analyzeGrammarAndPhrasing,
  ROLE_TAXONOMY,
} from './scoringEngine';
import {
  parseResumeEntities,
  generateFallbackInterviewQuestions,
  validateAndSanitizeQuestions,
} from './questionEngine';
import {
  evaluateInterviewAnswersWithGemini,
  generateFallbackInterviewAnswerEvaluation,
  sanitizeEvaluation,
} from './evaluationEngine';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for all local development origins (localhost:5173, localhost:3000, 127.0.0.1, IDE webviews)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory cache for deterministic, idempotent analysis results
interface CacheEntry {
  data: any;
  timestamp: number;
}
const analysisCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 200;

// Safe error sanitizer: redacts the actual GEMINI_API_KEY from messages, error objects, and stacks
function sanitizeError(err: unknown): Record<string, unknown> | string {
  const rawKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '') || '';
  const redact = (str: string): string => {
    if (!str) return str;
    if (rawKey && rawKey.length > 5) {
      return str.split(rawKey).join('[REDACTED_GEMINI_KEY]');
    }
    return str;
  };

  if (!err) return 'Unknown error';

  if (typeof err === 'object' && err !== null) {
    const anyErr = err as any;
    const sanitizedObj: Record<string, unknown> = {
      name: redact(String(anyErr.name || 'Error')),
      message: redact(String(anyErr.message || '')),
      status: anyErr.status || anyErr.statusCode || anyErr.code || undefined,
    };
    if (anyErr.errorDetails) {
      try {
        sanitizedObj.errorDetails = JSON.parse(redact(JSON.stringify(anyErr.errorDetails)));
      } catch {
        sanitizedObj.errorDetails = redact(String(anyErr.errorDetails));
      }
    }
    return sanitizedObj;
  }

  return redact(String(err));
}

// Model resolver ensuring valid, active model is used
function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim().replace(/^["']|["']$/g, '');
  // Disallow retired models (e.g. gemini-2.5-flash / gemini-1.5-flash) that return 404 NOT_FOUND
  if (!model || model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash') {
    return 'gemini-3.6-flash';
  }
  return model;
}

// Initialize Google Gen AI client with required User-Agent
function getGeminiClient(): GoogleGenAI | null {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) {
    return null;
  }
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_actual_api_key_here') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', sanitizeError(err));
    return null;
  }
}

// Helper to clamp any numeric-ish value to an integer in [0,100]
function clampToInt100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : '';
  const hasValidApiKey = !!apiKey && apiKey.length > 0 && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'your_actual_api_key_here';
  res.json({
    status: 'ok',
    hasApiKey: hasValidApiKey,
    model: getGeminiModel(),
    timestamp: new Date().toISOString(),
  });
});

// Resume analysis API route (supporting aliases for robust communication)
app.post(['/api/analyze-resume', '/api/analyze', '/analyze'], async (req, res) => {
  const { resumeText, targetRole = 'General Tech & Professional Role', jobDescription = '' } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 30) {
    return res.status(400).json({
      error: 'Please provide a valid resume with sufficient text content (at least 30 characters).',
    });
  }

  // Generate deterministic cache key based on inputs
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${resumeText.trim()}:::${targetRole.trim()}:::${(jobDescription || '').trim()}`)
    .digest('hex');

  // Return cached result if exact same resume and target role were analyzed
  if (analysisCache.has(cacheKey)) {
    const cached = analysisCache.get(cacheKey)!.data;
    console.log('Returning CACHED deterministic analysis for hash:', cacheKey);
    return res.json({
      ...cached,
      analyzedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  try {
    // Deterministic candidate name extraction from resume header
    const headerLines = resumeText
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    const extractedCandidateName = headerLines[0] && headerLines[0].length < 60 && !headerLines[0].toLowerCase().includes('resume')
      ? headerLines[0]
      : 'Professional Candidate';

    // Deterministically extract categorized candidate skills and missing skills
    const { skillsFound: detSkillsFound, missingSkills: detMissingSkills } =
      extractCandidateSkillsCategorized(resumeText, targetRole, jobDescription);
    const flatSkillsFound = detSkillsFound.flatMap((cat) => cat.skills);

    // Deterministic grammar and phrasing optimizations from candidate's actual text
    const detGrammarSuggestions = analyzeGrammarAndPhrasing(resumeText, targetRole);

    // Compute all section scores deterministically
    const deterministicScores = computeSectionScores({
      resumeText,
      targetRole,
      jobDescription,
      skillsFound: flatSkillsFound,
    });
    const calculatedATS = calculateFinalATS(deterministicScores);
    const atsCategory =
      calculatedATS >= 85
        ? 'Excellent'
        : calculatedATS >= 70
        ? 'Good'
        : calculatedATS >= 50
        ? 'Needs Improvement'
        : 'Critical Updates Needed';

    const ai = getGeminiClient();

    if (!ai) {
      console.warn('GEMINI_API_KEY is missing. Generating fallback intelligent analysis structure.');
      const fallback = generateFallbackAnalysis(resumeText, targetRole, jobDescription);
      // Mark the response as fallback for visibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fallback as any).usedFallback = true;
      (fallback as any).fallbackReason = 'GEMINI_API_KEY missing';
      fallback.candidateName = extractedCandidateName;

      // Cache fallback result
      if (analysisCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = analysisCache.keys().next().value;
        if (oldestKey) analysisCache.delete(oldestKey);
      }
      analysisCache.set(cacheKey, { data: fallback, timestamp: Date.now() });

      return res.json(fallback);
    }

    const systemInstruction = `You are a Senior Technical Recruiter and Applicant Tracking System (ATS) Auditor. Your goal is to analyze the provided resume text and the provided job description against the target job role "${targetRole}" and return a strictly deterministic, evidence-based JSON audit report.

  Scoring and evidence rules (use these checklists verbatim and compute integer scores 0-100):

  1) Keywords (0-100):
    - Build a list of explicit keywords from the target role text (skills, tools, technologies, certifications, methodologies, specific nouns).
    - Count a keyword as present only when the resume contains an exact match or a clear variant (e.g., "Node.js" and "Node" count; avoid fuzzy, unrelated synonyms).
    - Score = round(100 * (matched_keywords_count / total_target_keywords_count)).
    - If the target role lists zero explicit keywords, set Keywords = 0.

  2) Formatting (0-100):
    - Check for these ATS-friendly elements and award points per item present:
      a) Top header with name/contact (10 points)
      b) Distinct section headings (Experience, Education, Skills) (20 points)
      c) Dates present and consistently formatted for each role (20 points)
      d) Bullet lists for responsibilities/accomplishments (15 points)
      e) No tables or images that would break plain-text parsing (15 points)
      f) Reasonable whitespace and consistent punctuation (20 points)
    - Formatting score = sum of points (max 100). Each item is either present (full points) or absent (0 points).

  3) ExperienceImpact (0-100):
    - Identify relevant experience items (work entries that match target role keywords).
    - For each relevant entry, award up to 20 points if it includes a measurable outcome (number, %, metric), up to 10 points if it contains an explicit ownership/action verb, and up to 10 points if it shows scope/scale (team size, budget, user base).
    - Sum points across up to 5 most relevant entries, cap at 100, then normalize to 0-100 and round to integer.
    - If no relevant experience is shown, score 0.

  4) SkillsMatch (0-100):
    - From target role, create a prioritized skills list (High/Med/Low importance based on language like "required", "must", "preferred").
    - Match skills only when explicitly demonstrated in the resume (project, work bullet, or skills section).
    - Compute weighted match: High=1.0, Medium=0.6, Low=0.3. Score = round(100 * (sum(weighted_matched) / sum(weighted_all))).
    - If no skills are listed in target, set SkillsMatch = 0.

  5) Readability (0-100):
    - Check for grammar/spelling errors, sentence length, and clarity. Apply a simple deterministic rubric:
      a) 2 or fewer grammatical issues: 40 points
      b) Use of concise bullets over long paragraphs: 30 points
      c) Consistent tense and person in role bullets: 15 points
      d) Clear, specific language (no vague phrases like "worked on" without detail): 15 points
    - Readability score = sum of present items (max 100). Assign items only when deterministic checks pass.

  Missing skills rules:
    - Only list a skill in 'missingSkills' if the target role/job description explicitly requires or strongly recommends it AND it is absent or not demonstrated in the resume by any exact-match keyword, project description, or quantified accomplishment.
    - For borderline cases, require at least one clear indicator in the resume to consider the skill present; if absent, mark missing with priority determined by the language in the job description (e.g., "required" -> High).
    - Do not invent skills or mark implied skills as missing without explicit job-description relevance.

  Determinism and output format:
    - Use temperature-like creativity = 0: be literal, conservative, and evidence-only.
    - Always produce integer scores 0-100 for 'sectionScores'.
    - Base every decision only on the provided 'resumeText' and 'targetRole' sections of the prompt; do not assume external context or knowledge about the candidate.
    - Prioritize reproducibility: given identical inputs, produce identical outputs.

  Return ONLY a strictly valid JSON object adhering to the existing schema.
`;

    const prompt = `Target Role: "${targetRole}"

  JOB DESCRIPTION:
  ---
  ${jobDescription.slice(0, 12000)}
  ---

  RESUME CONTENT:
  ---
  ${resumeText.slice(0, 12000)}
  ---

  Perform a complete ATS evaluation and return JSON with:
- atsScore (0-100)
- atsCategory ("Excellent" for 85+, "Good" for 70-84, "Needs Improvement" for 50-69, "Critical Updates Needed" for <50)
- candidateName (Extract candidate full name or "Valued Candidate")
- targetRole (e.g. "${targetRole}")
- summary (2-3 sentences executive summary of the resume strength and alignment)
- skillsFound (array of objects with category: string, skills: string[])
- missingSkills (array of objects with skill: string, priority: "High"|"Medium"|"Low", reason: string)
- strengths (array of 3-5 specific bullet points praising strong points in experience or skills)
- weaknesses (array of 3-5 specific constructive weaknesses or missing elements)
- grammarSuggestions (array of objects with originalText: string, suggestion: string, reason: string)
- improvementTips (array of objects with section: string, tip: string, impact: "High"|"Medium"|"Low")
- recommendedCertifications (array of objects with name: string, provider: string, relevance: string)
- recommendedProjects (array of objects with title: string, description: string, techStack: string[], difficulty: string)
- suitableJobRoles (array of 3-4 job roles with title: string, matchPercentage: number 0-100, keyRequirements: string)
- sectionScores (object with formatting: number, keywords: number, experienceImpact: number, skillsMatch: number, readability: number - each 0-100)`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0,
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER },
            atsCategory: { type: Type.STRING },
            candidateName: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            summary: { type: Type.STRING },
            skillsFound: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            missingSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
              },
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            grammarSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalText: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
              },
            },
            improvementTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  tip: { type: Type.STRING },
                  impact: { type: Type.STRING },
                },
              },
            },
            recommendedCertifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  relevance: { type: Type.STRING },
                },
              },
            },
            recommendedProjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                  difficulty: { type: Type.STRING },
                },
              },
            },
            suitableJobRoles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  matchPercentage: { type: Type.INTEGER },
                  keyRequirements: { type: Type.STRING },
                },
              },
            },
            sectionScores: {
              type: Type.OBJECT,
              properties: {
                formatting: { type: Type.INTEGER },
                keywords: { type: Type.INTEGER },
                experienceImpact: { type: Type.INTEGER },
                skillsMatch: { type: Type.INTEGER },
                readability: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text || '';
    const result = JSON.parse(jsonText);

    // Apply authoritative deterministic rule-based outputs
    const profile = getRoleProfile(targetRole);
    result.sectionScores = deterministicScores;
    result.atsScore = calculatedATS;
    result.atsCategory = atsCategory;
    result.candidateName = extractedCandidateName || result.candidateName || 'Professional Candidate';
    result.skillsFound = detSkillsFound;
    result.missingSkills = detMissingSkills;
    result.usedFallback = false;

    // 1. Guarantee valid candidate executive summary
    const defaultExecutiveSummary = `The resume demonstrates a ${atsCategory === 'Excellent' ? 'highly aligned' : atsCategory === 'Good' ? 'solid' : 'developing'} profile for ${profile.title}. Key demonstrated proficiencies include ${flatSkillsFound.slice(0, 4).join(', ') || 'essential technical capabilities'}, with strategic opportunities to further elevate keyword density and quantifiable achievements.`;
    if (!result.summary || typeof result.summary !== 'string' || result.summary.trim().length < 15) {
      result.summary = defaultExecutiveSummary;
    } else {
      result.summary = result.summary.trim();
    }

    // 2. Guarantee valid grammar suggestions
    const validGeminiGrammar = Array.isArray(result.grammarSuggestions)
      ? result.grammarSuggestions.filter((g: any) => g && typeof g.originalText === 'string' && typeof g.suggestion === 'string' && g.originalText.trim().length > 0)
      : [];
    if (validGeminiGrammar.length >= 2) {
      result.grammarSuggestions = validGeminiGrammar.slice(0, 3).map((g: any) => ({
        originalText: g.originalText.trim(),
        suggestion: g.suggestion.trim(),
        reason: g.reason || 'Enhance readability and quantifiable impact.',
      }));
    } else {
      result.grammarSuggestions = detGrammarSuggestions;
    }

    // 3. Guarantee valid improvement tips
    if (!Array.isArray(result.improvementTips) || result.improvementTips.length === 0) {
      result.improvementTips = [
        {
          section: 'Work Experience',
          tip: 'Structure every bullet point using Google’s XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]" to clearly emphasize measurable business impact.',
          impact: 'High',
        },
        {
          section: 'Skills Section',
          tip: `Group technical skills into distinct categories and ensure core keywords like ${detMissingSkills[0]?.skill || profile.requiredSkills[0]} are prominently highlighted.`,
          impact: 'Medium',
        },
        {
          section: 'Header & Contact',
          tip: 'Ensure your LinkedIn and GitHub portfolio links are active, clickable, and formatted cleanly without extraneous URL parameters.',
          impact: 'Low',
        },
      ];
    } else {
      const seenTips = new Set<string>();
      result.improvementTips = result.improvementTips
        .filter((t: any) => t && typeof t.tip === 'string' && t.tip.trim().length > 0)
        .map((t: any) => ({
          section: t.section || 'Work Experience',
          tip: t.tip.trim(),
          impact: (['High', 'Medium', 'Low'].includes(t.impact) ? t.impact : 'Medium') as 'High' | 'Medium' | 'Low',
        }))
        .filter((t: any) => {
          const k = t.section + '::' + t.tip.toLowerCase();
          if (seenTips.has(k)) return false;
          seenTips.add(k);
          return true;
        });

      if (result.improvementTips.length === 0) {
        result.improvementTips = [
          {
            section: 'Work Experience',
            tip: 'Structure every bullet point using Google’s XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
            impact: 'High',
          },
          {
            section: 'Skills Section',
            tip: `Group skills into distinct categories and ensure target keywords like ${detMissingSkills[0]?.skill || profile.requiredSkills[0]} are prominently highlighted.`,
            impact: 'Medium',
          },
          {
            section: 'Header & Contact',
            tip: 'Ensure your LinkedIn and GitHub URLs are hyperlinked and formatted cleanly without unnecessary parameters.',
            impact: 'Low',
          },
        ];
      }
      const impactOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
      result.improvementTips.sort((a: any, b: any) => (impactOrder[a.impact] || 4) - (impactOrder[b.impact] || 4));
    }

    // 4. Guarantee valid suitable job roles
    if (!Array.isArray(result.suitableJobRoles) || result.suitableJobRoles.length === 0) {
      result.suitableJobRoles = [
        {
          title: profile.title,
          matchPercentage: calculatedATS,
          keyRequirements: `Core technical mastery in ${profile.requiredSkills.slice(0, 3).join(', ')}, end-to-end workflow execution.`,
        },
        ...Object.values(ROLE_TAXONOMY)
          .filter((r) => r.id !== profile.id)
          .slice(0, 2)
          .map((r) => {
            const otherScores = computeSectionScores({
              resumeText,
              targetRole: r.title,
              jobDescription: '',
              skillsFound: flatSkillsFound,
            });
            const otherAts = calculateFinalATS(otherScores);
            return {
              title: r.title,
              matchPercentage: otherAts,
              keyRequirements: `Competency in ${r.requiredSkills.slice(0, 3).join(', ')} and domain workflows.`,
            };
          }),
      ];
    } else {
      result.suitableJobRoles = result.suitableJobRoles.map((r: any) => ({
        title: r.title || profile.title,
        matchPercentage: typeof r.matchPercentage === 'number' ? r.matchPercentage : calculatedATS,
        keyRequirements: r.keyRequirements || `Proficiency in ${profile.requiredSkills.slice(0, 3).join(', ')}.`,
      }));
    }
    result.suitableJobRoles.sort((a: any, b: any) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

    // Deterministic deduplication for strengths & weaknesses
    if (Array.isArray(result.strengths)) {
      result.strengths = Array.from(new Set(result.strengths));
    }
    if (Array.isArray(result.weaknesses)) {
      result.weaknesses = Array.from(new Set(result.weaknesses));
    }

    // Ensure certifications & projects are populated
    if (!Array.isArray(result.recommendedCertifications) || result.recommendedCertifications.length === 0) {
      result.recommendedCertifications = profile.certifications;
    }
    if (!Array.isArray(result.recommendedProjects) || result.recommendedProjects.length === 0) {
      result.recommendedProjects = profile.projects;
    }

    result.analyzedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Store in cache
    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) analysisCache.delete(oldestKey);
    }
    analysisCache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log('ANALYSIS LOG (gemini deterministic):', {
      resumeLength: resumeText.length,
      targetRole,
      sectionScores: result.sectionScores,
      calculatedATS,
      missingSkillsCount: result.missingSkills.length,
      grammarSuggestionsCount: result.grammarSuggestions.length,
      usedFallback: false,
    });

    return res.json(result);
  } catch (err) {
    console.error('[GEMINI FAILURE] Falling back. Reason:', err);
    const fallback = generateFallbackAnalysis(resumeText, targetRole, jobDescription);
    // mark fallback for client visibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fallback as any).isFallback = true;
    (fallback as any).usedFallback = true;
    (fallback as any).fallbackReason = err instanceof Error ? err.message : 'API Error';

    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) analysisCache.delete(oldestKey);
    }
    analysisCache.set(cacheKey, { data: fallback, timestamp: Date.now() });

    return res.json(fallback);
  }
});

// AI Cover Letter Generator API route
app.post(['/api/generate-cover-letter', '/api/cover-letter'], async (req, res) => {
  const {
    resumeText,
    targetRole = 'General Professional Role',
    companyName = '',
    jobDescription = '',
    tone = 'Professional',
  } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 30) {
    return res.status(400).json({
      error: 'Please provide valid resume text with sufficient content (at least 30 characters).',
    });
  }

  if (!targetRole || typeof targetRole !== 'string' || targetRole.trim().length < 2) {
    return res.status(400).json({
      error: 'Please provide a valid target job role.',
    });
  }

  const validTones = ['Professional', 'Confident', 'Friendly', 'Formal'];
  const sanitizedTone = validTones.includes(tone) ? tone : 'Professional';

  // Extract candidate name heuristic from resume header
  const headerLines = resumeText
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);
  const candidateName =
    headerLines[0] && headerLines[0].length < 60 && !headerLines[0].toLowerCase().includes('resume')
      ? headerLines[0]
      : 'Valued Candidate';

  // Generate deterministic cache key
  const cacheKey = crypto
    .createHash('sha256')
    .update(`coverletter:::${resumeText.trim()}:::${targetRole.trim()}:::${(companyName || '').trim()}:::${(jobDescription || '').trim()}:::${sanitizedTone}`)
    .digest('hex');

  // Return cached result if exact same inputs were provided (only return cached fallback if AI client is unavailable)
  if (analysisCache.has(cacheKey)) {
    const cached = analysisCache.get(cacheKey)!.data;
    const hasAI = !!getGeminiClient();
    if (!cached?.usedFallback || !hasAI) {
      console.log('Returning CACHED cover letter for hash:', cacheKey);
      return res.json({
        ...cached,
        generatedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.warn('GEMINI_API_KEY is missing. Generating fallback cover letter.');
    const fallback = generateFallbackCoverLetter({
      resumeText,
      targetRole,
      companyName,
      jobDescription,
      tone: sanitizedTone,
      candidateName,
    });

    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) analysisCache.delete(oldestKey);
    }
    analysisCache.set(cacheKey, { data: fallback, timestamp: Date.now() });

    return res.json(fallback);
  }

  try {
    const toneInstructions: Record<string, string> = {
      Professional: 'Maintain a balanced, articulate, highly competent, and industry-standard tone that emphasizes qualifications and alignment.',
      Confident: 'Maintain an assertive, bold, high-impact tone that decisively highlights measurable accomplishments, initiative, and conviction.',
      Friendly: 'Maintain a warm, enthusiastic, engaging, and collaborative tone that conveys genuine passion, cultural fit, and personal excitement.',
      Formal: 'Maintain an executive, traditional, highly respectful, and polished corporate tone suitable for enterprise or conservative organizations.',
    };

    const systemInstruction = `You are a Senior Executive Career Strategist and Professional Cover Letter Specialist.
Your goal is to write a personalized, compelling, and truthful cover letter tailored for the target role "${targetRole}" and target company "${companyName || 'the hiring organization'}".

CRITICAL INSTRUCTIONS & ACCURACY CONSTRAINTS:
1. TRUTHFULNESS & ZERO FABRICATION (STRICT RULE):
   - Draw all experiences, achievements, technical skills, projects, and work history EXCLUSIVELY from the provided RESUME CONTENT.
   - NEVER invent or hallucinate metrics, companies, titles, degrees, or certifications not found in the resume.
   - If the candidate does not have a skill asked in the job description, do not claim they have it; instead highlight their related strengths and demonstrated learning agility.

2. STRUCTURE:
   - Salutation: "Dear Hiring Team," or "Dear Hiring Manager at ${companyName || 'the company'},"
   - Opening Paragraph: State enthusiastic interest in the "${targetRole}" position at ${companyName ? `"${companyName}"` : 'your company'}. Briefly articulate the candidate's core background and value proposition.
   - Body Paragraphs (2-3 paragraphs):
     - Highlight 2-3 specific accomplishments, metrics, or technical competencies directly from the resume that directly solve needs mentioned in the Job Description.
     - Connect past track record to future value for the employer.
   - Closing Paragraph: Propose a discussion or interview, express gratitude for their consideration, and sign off cleanly.
   - Sign-off: "Sincerely,\\n${candidateName}"

3. TONE & STYLE:
   - Apply the selected "${sanitizedTone}" tone: ${toneInstructions[sanitizedTone]}
   - Keep prose natural, authentic, and human—avoid robotic or clichéd tropes.

4. LENGTH & FORMAT:
   - Target word count: 300 to 450 words (never exceed 500 words).
   - Use clean paragraph spacing separated by double newlines (\\n\\n).

5. OUTPUT:
   - Return ONLY a valid JSON object adhering to the schema.
`;

    const prompt = `TARGET JOB ROLE: "${targetRole}"
COMPANY NAME: "${companyName || 'Not specified'}"
DESIRED TONE: "${sanitizedTone}"
CANDIDATE NAME: "${candidateName}"

JOB DESCRIPTION:
---
${(jobDescription || 'Standard industry requirements for ' + targetRole).slice(0, 12000)}
---

RESUME CONTENT:
---
${resumeText.slice(0, 12000)}
---

Draft the personalized cover letter adhering strictly to all requirements.`;

    const activeModel = getGeminiModel();
    console.log(`[COVER LETTER] Requesting generation via Gemini API with model: "${activeModel}"...`);

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        temperature: 0.2,
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coverLetter: { type: Type.STRING },
          },
          required: ['coverLetter'],
        },
      },
    });

    let jsonText = (response.text || '').trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    const parsed = JSON.parse(jsonText);
    const coverLetterText = (parsed.coverLetter || '').trim();
    const wordCount = coverLetterText.split(/\s+/).filter(Boolean).length;

    const result = {
      coverLetter: coverLetterText,
      candidateName,
      targetRole,
      companyName: companyName || undefined,
      tone: sanitizedTone,
      wordCount,
      usedFallback: false,
      generatedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Store in cache
    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) analysisCache.delete(oldestKey);
    }
    analysisCache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log('COVER LETTER GENERATED (gemini):', {
      candidateName,
      targetRole,
      tone: sanitizedTone,
      wordCount,
      usedFallback: false,
      model: activeModel,
    });

    return res.json(result);
  } catch (err) {
    console.error('[GEMINI FAILURE - COVER LETTER] Actual API Error (Sanitized):', JSON.stringify(sanitizeError(err), null, 2));
    try {
      const fallback = generateFallbackCoverLetter({
        resumeText,
        targetRole,
        companyName,
        jobDescription,
        tone: sanitizedTone,
        candidateName,
      });

      // Do not cache temporary API failure fallbacks so subsequent attempts can succeed with Gemini
      analysisCache.delete(cacheKey);

      return res.json(fallback);
    } catch (fallbackErr) {
      console.error('[COVER LETTER FALLBACK FAILURE]:', sanitizeError(fallbackErr));
      return res.status(500).json({
        error: 'Failed to generate cover letter. Please verify your resume input.',
      });
    }
  }
});

// Fallback generator for Cover Letters
function generateFallbackCoverLetter(params: {
  resumeText: string;
  targetRole: string;
  companyName?: string;
  jobDescription?: string;
  tone?: string;
  candidateName: string;
}) {
  const { resumeText, targetRole, companyName, jobDescription, tone = 'Professional', candidateName } = params;
  const profile = getRoleProfile(targetRole);
  const { skillsFound } = extractCandidateSkillsCategorized(resumeText, targetRole, jobDescription);
  const flatSkills = skillsFound.flatMap((c) => c.skills);
  const topSkills = flatSkills.length > 0 ? flatSkills.slice(0, 4).join(', ') : profile.requiredSkills.slice(0, 4).join(', ');

  // Extract real experience lines from resume with action verbs
  const rawLines = resumeText
    .split('\n')
    .map((l) => l.trim().replace(/^[-*•\s]+/, ''))
    .filter((l) => l.length > 30 && l.length < 220);

  const experienceBullets = rawLines.filter((l) =>
    /^(Led|Built|Developed|Engineered|Created|Managed|Designed|Optimized|Architected|Delivered|Implemented|Spearheaded)\b/i.test(l)
  );

  const highlight1 =
    experienceBullets[0] ||
    `Engineered end-to-end solutions utilizing ${topSkills}, improving system throughput and delivery speed.`;
  const highlight2 =
    experienceBullets[1] ||
    `Collaborated cross-functionally to design scalable architecture and maintain high code quality standards.`;

  const company = companyName ? companyName : 'your organization';
  const greeting = companyName ? `Dear Hiring Team at ${companyName},` : 'Dear Hiring Manager,';

  let opening = '';
  if (tone === 'Confident') {
    opening = `I am writing to express my enthusiastic interest in the ${targetRole} position at ${company}. With a proven track record of engineering impact and strong technical proficiency in ${topSkills}, I am prepared to deliver immediate, measurable value to your team's key initiatives.`;
  } else if (tone === 'Friendly') {
    opening = `I was delighted to discover the ${targetRole} opportunity at ${company}. Having spent my career working with technologies like ${topSkills}, I would love the chance to bring my enthusiasm, collaborative spirit, and technical skills to your team.`;
  } else if (tone === 'Formal') {
    opening = `Please accept this letter and accompanying credentials as my formal application for the position of ${targetRole} at ${company}. My background in software engineering and extensive experience with ${topSkills} align closely with the qualifications you are seeking.`;
  } else {
    // Professional
    opening = `I am writing to submit my application for the ${targetRole} role at ${company}. With a solid technical foundation in ${topSkills} and hands-on experience solving complex operational challenges, I am excited about the opportunity to contribute to your engineering goals.`;
  }

  const body1 = `Throughout my professional journey, I have prioritized architecting reliable systems that align closely with stakeholder needs. Specifically, ${highlight1.replace(/[.]+$/, '')}. This work strengthened my focus on technical rigor, system scalability, and test-driven development.`;

  const body2 = `In addition, ${highlight2.replace(/[.]+$/, '')}. By combining strong technical fundamentals with proactive communication, I consistently help teams ship features on schedule while maintaining production stability.`;

  let closing = '';
  if (tone === 'Confident') {
    closing = `I look forward to discussing how my experience and drive will directly accelerate ${company}'s milestones. Thank you for your time and consideration, and I welcome the opportunity for an interview.`;
  } else if (tone === 'Friendly') {
    closing = `I would welcome the opportunity to connect and discuss how my skills and background can support the impactful work happening at ${company}. Thank you so much for your time and review!`;
  } else if (tone === 'Formal') {
    closing = `I would welcome the opportunity to discuss my qualifications with you in greater detail. Thank you for your time, consideration, and evaluation of my application.`;
  } else {
    closing = `I would welcome the opportunity to speak with you further regarding how my background and skill set align with the needs of ${company}. Thank you for your time and consideration, and I look forward to hearing from you.`;
  }

  const letter = `${greeting}\n\n${opening}\n\n${body1}\n\n${body2}\n\n${closing}\n\nSincerely,\n${candidateName}`;
  const wordCount = letter.split(/\s+/).filter(Boolean).length;

  return {
    coverLetter: letter,
    candidateName,
    targetRole,
    companyName: companyName || undefined,
    tone,
    wordCount,
    usedFallback: true,
    fallbackReason: 'GEMINI_API_KEY unconfigured or request fallback',
    generatedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

// Fallback generator if API key is unconfigured or rate limited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackAnalysis(text: string, targetRole: string, jobDescription: string = ''): any {
  const profile = getRoleProfile(targetRole);

  // Extract candidate name heuristic
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const candidateName = lines[0] && lines[0].length < 40 && !lines[0].toLowerCase().includes('resume') 
    ? lines[0] 
    : 'Professional Candidate';

  // Extract categorized candidate skills & missing skills matching target role
  const { skillsFound, missingSkills } = extractCandidateSkillsCategorized(text, targetRole, jobDescription);
  const flatSkills = skillsFound.flatMap((cat) => cat.skills);

  // Deterministic grammar and phrasing suggestions
  const grammarSuggestions = analyzeGrammarAndPhrasing(text, targetRole);

  // Compute deterministic section scores with the exact same scoring engine
  const sectionScores = computeSectionScores({
    resumeText: text,
    targetRole,
    jobDescription,
    skillsFound: flatSkills,
  });

  const atsScore = calculateFinalATS(sectionScores);
  const atsCategory =
    atsScore >= 85
      ? 'Excellent'
      : atsScore >= 70
      ? 'Good'
      : atsScore >= 50
      ? 'Needs Improvement'
      : 'Critical Updates Needed';

  // Build strengths based on actual resume detection
  const strengths: string[] = [];
  if (flatSkills.length > 0) {
    strengths.push(`Demonstrated proficiency in key ${profile.title} technologies including ${flatSkills.slice(0, 4).join(', ')}.`);
  }
  if (sectionScores.formatting >= 80) {
    strengths.push('Clean, well-structured section hierarchy ensuring seamless ATS parser ingestion.');
  }
  if (sectionScores.experienceImpact >= 70) {
    strengths.push('Includes quantified metrics and action-oriented accomplishments throughout work experience.');
  } else {
    strengths.push('Clear presentation of roles, educational history, and practical project contributions.');
  }
  if (strengths.length < 3) {
    strengths.push(`Clear professional domain alignment tailored for ${profile.title} requirements.`);
  }

  // Build constructive weaknesses
  const weaknesses: string[] = [];
  if (missingSkills.length > 0) {
    weaknesses.push(`Missing high-priority keywords commonly expected for ${profile.title} roles (e.g. ${missingSkills.slice(0, 2).map((m) => m.skill).join(', ')}).`);
  }
  if (sectionScores.experienceImpact < 75) {
    weaknesses.push('Could incorporate more quantifiable metrics (e.g. % improvements, latency drops, user numbers) in bullet points.');
  }
  if (sectionScores.keywords < 75) {
    weaknesses.push(`Enhance keyword density for specialized ${profile.title} tools and industry standards.`);
  }
  if (weaknesses.length < 2) {
    weaknesses.push('Consider expanding on system architecture scale and cross-functional team leadership.');
  }

  // Suitable roles around candidate match
  const suitableJobRoles = [
    {
      title: profile.title,
      matchPercentage: atsScore,
      keyRequirements: `Core technical mastery in ${profile.requiredSkills.slice(0, 3).join(', ')}, end-to-end workflow execution.`,
    },
    ...Object.values(ROLE_TAXONOMY)
      .filter((r) => r.id !== profile.id)
      .slice(0, 2)
      .map((r) => {
        const otherScores = computeSectionScores({
          resumeText: text,
          targetRole: r.title,
          jobDescription: '',
          skillsFound: flatSkills,
        });
        const otherAts = calculateFinalATS(otherScores);
        return {
          title: r.title,
          matchPercentage: otherAts,
          keyRequirements: `Competency in ${r.requiredSkills.slice(0, 3).join(', ')} and domain workflows.`,
        };
      }),
  ];

  return {
    atsScore,
    atsCategory,
    candidateName,
    targetRole,
    summary: `The resume demonstrates a ${atsCategory === 'Excellent' ? 'highly aligned' : atsCategory === 'Good' ? 'solid' : 'developing'} profile for ${profile.title}. Key strengths include ${flatSkills.slice(0, 3).join(', ') || 'foundational technical skills'}, with opportunities to improve role-specific keyword alignment.`,
    skillsFound,
    missingSkills,
    strengths,
    weaknesses,
    grammarSuggestions,
    improvementTips: [
      {
        section: 'Work Experience',
        tip: 'Structure every bullet point using Google’s XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]" to emphasize measurable impact.',
        impact: 'High',
      },
      {
        section: 'Skills Section',
        tip: `Group skills into distinct categories and ensure target keywords like ${missingSkills[0]?.skill || profile.requiredSkills[0]} are prominently highlighted.`,
        impact: 'Medium',
      },
      {
        section: 'Header & Contact',
        tip: 'Ensure your LinkedIn and GitHub URLs are hyperlinked and formatted cleanly without unnecessary parameters.',
        impact: 'Low',
      },
    ],
    recommendedCertifications: profile.certifications,
    recommendedProjects: profile.projects,
    suitableJobRoles,
    sectionScores,
    analyzedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}


// ==========================================
// FEATURE 2: AI INTERVIEW QUESTION GENERATION
// ==========================================

// In-memory cache for interview questions
const questionCache = new Map<string, { data: any; timestamp: number }>();

app.post(['/api/generate-interview-questions', '/api/generate-questions'], async (req, res) => {
  const { interviewConfig, resumeText = '', candidateName = '' } = req.body;

  if (!interviewConfig || !interviewConfig.targetRole) {
    return res.status(400).json({
      error: 'Invalid interview configuration. Please provide a valid targetRole, level, type, and questionCount.',
    });
  }

  const {
    targetRole,
    interviewLevel = 'Beginner',
    interviewType = 'Mixed',
    questionCount = 10,
  } = interviewConfig;

  const count = Number(questionCount) || 10;

  // Extract structured resume entities
  const entities = parseResumeEntities(resumeText, targetRole);
  if (candidateName && candidateName.trim()) {
    entities.candidateName = candidateName.trim();
  }

  // Generate deterministic cache key based on configuration and resume
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${targetRole}:::${interviewLevel}:::${interviewType}:::${count}:::${resumeText.slice(0, 4000)}`)
    .digest('hex');

  if (questionCache.has(cacheKey)) {
    const cached = questionCache.get(cacheKey)!.data;
    console.log('Returning CACHED interview questions for hash:', cacheKey);
    return res.json({
      questions: cached,
      config: interviewConfig,
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const ai = getGeminiClient();
    let finalQuestions = [];

    if (ai) {
      try {
        console.log(`Generating ${count} ${interviewLevel} ${interviewType} questions for ${targetRole} with Gemini AI...`);
        const geminiQuestions = await generateQuestionsWithGemini(
          { targetRole, interviewLevel, interviewType, questionCount: count },
          resumeText,
          entities,
          ai
        );
        finalQuestions = validateAndSanitizeQuestions(geminiQuestions, entities, interviewConfig);
      } catch (geminiError) {
        console.warn('Gemini question generation error, using intelligent resume-tailored question generator:', geminiError);
        finalQuestions = generateFallbackInterviewQuestions(interviewConfig, resumeText, entities.candidateName);
      }
    } else {
      console.log('Gemini API key not configured. Using intelligent resume-tailored question generator.');
      finalQuestions = generateFallbackInterviewQuestions(interviewConfig, resumeText, entities.candidateName);
    }

    // Ensure final array is exactly count
    finalQuestions = finalQuestions.slice(0, count);
    questionCache.set(cacheKey, { data: finalQuestions, timestamp: Date.now() });

    return res.json({
      questions: finalQuestions,
      config: interviewConfig,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error generating interview questions:', err);
    const fallback = generateFallbackInterviewQuestions(interviewConfig, resumeText, candidateName);
    return res.json({
      questions: fallback.slice(0, count),
      config: interviewConfig,
      generatedAt: new Date().toISOString(),
    });
  }
});

// Gemini question generator helper
async function generateQuestionsWithGemini(
  config: { targetRole: string; interviewLevel: string; interviewType: string; questionCount: number },
  resumeText: string,
  entities: ReturnType<typeof parseResumeEntities>,
  ai: GoogleGenAI
) {
  const count = config.questionCount || 10;
  const role = config.targetRole;
  const level = config.interviewLevel;
  const type = config.interviewType;

  const projectSummary = entities.projects.length > 0
    ? entities.projects.map((p) => `- Project Name: "${p.name}" (Technologies: ${p.technologies.join(', ') || 'General'}). Description: ${p.description || 'N/A'}`).join('\n')
    : 'No explicit projects listed. Ask about work experience or general technical concepts.';

  const experienceSummary = entities.experiences.length > 0
    ? entities.experiences.map((e) => `- Role: "${e.role}" at "${e.company}". Highlights: ${e.achievements.slice(0, 2).join('; ')}`).join('\n')
    : 'No explicit employment history listed.';

  const detectedSkillsSummary = entities.skills.length > 0
    ? entities.skills.map((s) => `${s.skill} (${s.domain})`).join(', ')
    : 'General technical tools';

  const systemInstruction = `You are a Principal Technical Interviewer and Senior Engineering Hiring Manager conducting a high-fidelity mock interview.
Your mission is to generate EXACTLY ${count} questions for a ${level}-level candidate applying for "${role}".
The interview type is "${type}".

CRITICAL RESUME-GROUNDING & TECHNICAL ACCURACY RULES:
1. NEVER assume a technology is related to an engineering concept unless the technology actually supports that concept:
   - HTML5 RULE: When generating HTML5 questions, do NOT mention CSS-only concepts such as Flexbox, CSS Grid, CSS properties, CSS selectors, or responsive CSS. HTML5 questions must focus strictly on HTML concepts such as semantic elements (<main>, <article>, <nav>, <header>, <section>), forms & native validation attributes (required, pattern), web accessibility (ARIA roles, WCAG, alt text), multimedia (<picture>, <video>, <audio>), and HTML5 Web APIs (Web Storage, Web Workers, Canvas, History API, preload/prefetch).
   - CSS3 / TAILWIND RULE: Questions about styling, responsive design (Flexbox, CSS Grid, breakpoints), CSS architecture/maintainability, specificity, and rendering reflow/repaint must name CSS3, Tailwind CSS, or Sass.
   - REACT / COMPONENT FRAMEWORKS RULE: If asking about state management, component lifecycle, hooks, or virtual DOM, React (or Vue/Angular) MUST actually appear in the resume.
   - BACKEND FRAMEWORKS RULE: If asking about REST APIs, middleware, or backend routing, a backend framework/runtime (like Node.js, Express, Python, Django, etc.) MUST actually appear in the resume.
   - DATABASES RULE: If asking about database queries, indexing, or ACID transactions, SQL/PostgreSQL/MySQL/MongoDB MUST appear in the resume.
   - DEVOPS RULE: If asking about containerization, Docker must appear in the resume.
2. NO HALLUCINATIONS:
   - NEVER invent projects, technologies, job experience, or responsibilities that do not exist in the candidate's resume facts.
   - When personalizing a question around a project, use the ACTUAL project name from the resume facts (e.g., "In your [ACTUAL PROJECT NAME] project, how did you...").
   - NEVER use vague filler phrases like "when building experience", "the system", "your project", or "in your experience project".
   - If no project is listed in the resume, ask about their experience at [Company Name] or fundamental questions for the target role.
3. INTERVIEW TYPE REQUIREMENTS:
   - "Technical": EXACTLY 100% technical questions. Coding fundamentals, architecture, debugging, database queries, framework internals, APIs, system design. ZERO generic HR questions.
   - "HR / Behavioral": EXACTLY 100% STAR-method behavioral and situational questions (teamwork, leadership, conflict resolution, learning agility, motivation, handling deadlines).
   - "Mixed": A balanced blend starting with an introduction/background question, followed by ~60% technical questions grounded in resume projects/skills, and ~35% behavioral/situational questions.
4. DIFFICULTY LEVEL REQUIREMENTS:
   - "Beginner": Core concepts, syntax, standard problem solving, simple project overviews, foundational technical principles.
   - "Intermediate": Real-world implementation, debugging, design decisions, trade-offs, state/data handling, project-level reasoning.
   - "Advanced": Distributed architecture, scalability, concurrency, fault tolerance, performance optimization, staff-level trade-offs.
5. QUESTION COUNT & DIVERSITY:
   - Return an array with EXACTLY ${count} items.
   - Every question must be distinct, avoiding repetitive phrasing or testing the exact same topic twice.

Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "id": "q-1",
    "question": "Question text here",
    "category": "Technical" | "Behavioral" | "Situational" | "Background",
    "difficulty": "${level}",
    "topic": "Concise 2-4 word topic",
    "expectedFocus": "What the interviewer evaluates in the answer"
  }
]`;

  const prompt = `CANDIDATE INFORMATION & VERIFIED RESUME FACTS:
- Candidate Name: ${entities.candidateName}
- Target Job Role: ${role}
- Interview Level: ${level}
- Interview Type: ${type}
- Required Question Count: ${count}

DETECTED RESUME PROJECTS:
${projectSummary}

DETECTED RESUME WORK EXPERIENCE:
${experienceSummary}

VERIFIED SKILLS IN RESUME:
${detectedSkillsSummary}

RAW RESUME TEXT:
---
${resumeText.slice(0, 8000) || 'General candidate profile.'}
---

Generate exactly ${count} highly grounded, technically coherent interview questions for this candidate.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Technical', 'Behavioral', 'Situational', 'Background'] },
            difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
            topic: { type: Type.STRING },
            expectedFocus: { type: Type.STRING },
          },
          required: ['id', 'question', 'category', 'difficulty', 'topic', 'expectedFocus'],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text || '[]');
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((q: any, idx: number) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      category: q.category || (type === 'HR / Behavioral' ? 'Behavioral' : 'Technical'),
      difficulty: q.difficulty || level,
      topic: q.topic || role,
      expectedFocus: q.expectedFocus || 'Demonstrating depth of knowledge and clear communication.',
    }));
  }

  throw new Error('Gemini returned an empty array of questions.');
}

// ==========================================
// FEATURE 4: AI ANSWER EVALUATION API
// ==========================================

const evaluationCache = new Map<string, { data: any; timestamp: number }>();

app.post(['/api/evaluate-interview-answers', '/api/evaluate-answers'], async (req, res) => {
  const {
    config,
    interviewConfig,
    questions,
    responses = [],
    resumeText = '',
    candidateName = '',
    sessionId,
  } = req.body;

  const activeConfig = config || interviewConfig;

  if (!activeConfig || !activeConfig.targetRole) {
    return res.status(400).json({
      error: 'Invalid interview configuration. targetRole is required.',
    });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      error: 'No interview questions provided for evaluation.',
    });
  }

  // Generate deterministic cache key based on questions and responses
  const answersPayload = (responses as any[])
    .map((r) => `${r.questionId || r.questionNumber}:${(r.answer || '').trim()}`)
    .join('|||');
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${activeConfig.targetRole}:::${activeConfig.interviewLevel}:::${answersPayload}`)
    .digest('hex');

  if (evaluationCache.has(cacheKey)) {
    const cached = evaluationCache.get(cacheKey)!.data;
    console.log('Returning CACHED interview answer evaluations for hash:', cacheKey);
    return res.json({
      sessionId: sessionId || `session-${Date.now()}`,
      config: activeConfig,
      evaluations: cached,
      evaluatedAt: new Date().toISOString(),
    });
  }

  try {
    const ai = getGeminiClient();
    let evaluations = [];
    let usedFallback = false;

    if (ai) {
      try {
        console.log(`Evaluating ${questions.length} interview responses with Gemini AI...`);
        evaluations = await evaluateInterviewAnswersWithGemini(
          activeConfig,
          questions,
          responses,
          resumeText,
          candidateName,
          ai
        );
      } catch (geminiError) {
        console.warn('Gemini evaluation error, using intelligent fallback evaluator:', geminiError);
        usedFallback = true;
        evaluations = questions.map((q: any, idx: number) => {
          const resp =
            responses.find((r: any) => r.questionId === q.id || r.questionNumber === idx + 1) || {
              questionId: q.id,
              questionNumber: idx + 1,
              question: q.question,
              answer: '',
              submittedAt: new Date().toISOString(),
            };
          return generateFallbackInterviewAnswerEvaluation(q, resp, activeConfig, idx, resumeText);
        });
      }
    } else {
      console.log('Gemini API key not configured. Using intelligent fallback answer evaluator.');
      usedFallback = true;
      evaluations = questions.map((q: any, idx: number) => {
        const resp =
          responses.find((r: any) => r.questionId === q.id || r.questionNumber === idx + 1) || {
            questionId: q.id,
            questionNumber: idx + 1,
            question: q.question,
            answer: '',
            submittedAt: new Date().toISOString(),
          };
        return generateFallbackInterviewAnswerEvaluation(q, resp, activeConfig, idx, resumeText);
      });
    }

    // Cache the evaluation results
    if (evaluationCache.size >= 200) {
      const oldestKey = evaluationCache.keys().next().value;
      if (oldestKey) evaluationCache.delete(oldestKey);
    }
    evaluationCache.set(cacheKey, { data: evaluations, timestamp: Date.now() });

    return res.json({
      sessionId: sessionId || `session-${Date.now()}`,
      config: activeConfig,
      evaluations,
      evaluatedAt: new Date().toISOString(),
      usedFallback,
    });
  } catch (err: unknown) {
    console.error('Error evaluating interview answers:', err);
    // Even in severe unexpected error, fallback safely without failing the request
    const fallbackEvaluations = questions.map((q: any, idx: number) => {
      const resp =
        responses.find((r: any) => r.questionId === q.id || r.questionNumber === idx + 1) || {
          questionId: q.id,
          questionNumber: idx + 1,
          question: q.question,
          answer: '',
          submittedAt: new Date().toISOString(),
        };
      return generateFallbackInterviewAnswerEvaluation(q, resp, activeConfig, idx, resumeText);
    });

    return res.json({
      sessionId: sessionId || `session-${Date.now()}`,
      config: activeConfig,
      evaluations: fallbackEvaluations,
      evaluatedAt: new Date().toISOString(),
      usedFallback: true,
    });
  }
});


// Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server ready at:`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    console.log(`  - Network: http://127.0.0.1:${PORT}`);
  });
}

startServer();
