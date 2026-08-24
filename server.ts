import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

import {
  computeSectionScores,
  calculateFinalATS,
  getRoleProfile,
  extractCandidateSkillsCategorized,
  analyzeGrammarAndPhrasing,
  ROLE_TAXONOMY,
} from './scoringEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Initialize Google Gen AI client with required User-Agent
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to clamp any numeric-ish value to an integer in [0,100]
function clampToInt100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
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
      model: 'gemini-3.6-flash',
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
    result.sectionScores = deterministicScores;
    result.atsScore = calculatedATS;
    result.atsCategory = atsCategory;
    result.candidateName = extractedCandidateName || result.candidateName || 'Professional Candidate';
    result.skillsFound = detSkillsFound;
    result.missingSkills = detMissingSkills;
    result.grammarSuggestions = detGrammarSuggestions;
    result.usedFallback = false;

    // Deterministic deduplication and priority sorting for improvement tips
    if (Array.isArray(result.improvementTips)) {
      const seenTips = new Set<string>();
      result.improvementTips = result.improvementTips.filter((t: any) => {
        if (!t || !t.tip) return false;
        const k = (t.section || '') + '::' + t.tip.trim().toLowerCase();
        if (seenTips.has(k)) return false;
        seenTips.add(k);
        return true;
      });
      const impactOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
      result.improvementTips.sort((a: any, b: any) => (impactOrder[a.impact] || 4) - (impactOrder[b.impact] || 4));
    }

    // Deterministic deduplication for strengths & weaknesses
    if (Array.isArray(result.strengths)) {
      result.strengths = Array.from(new Set(result.strengths));
    }
    if (Array.isArray(result.weaknesses)) {
      result.weaknesses = Array.from(new Set(result.weaknesses));
    }

    // Ensure certifications & projects are populated
    const profile = getRoleProfile(targetRole);
    if (!Array.isArray(result.recommendedCertifications) || result.recommendedCertifications.length === 0) {
      result.recommendedCertifications = profile.certifications;
    }
    if (!Array.isArray(result.recommendedProjects) || result.recommendedProjects.length === 0) {
      result.recommendedProjects = profile.projects;
    }

    // Deterministic sorting for suitable job roles
    if (Array.isArray(result.suitableJobRoles)) {
      result.suitableJobRoles.sort((a: any, b: any) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
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
        tip: 'Structure every bullet point using the XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
