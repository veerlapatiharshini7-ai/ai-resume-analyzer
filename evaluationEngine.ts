import { GoogleGenAI, Type } from '@google/genai';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewAnswerEvaluation,
  AnswerCriteriaScores,
  BehavioralSTARBreakdown,
} from './src/types';

// Helper to clamp a score to [0, 10]
export function clampScore(val: unknown, defaultVal = 5): number {
  const n = Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return defaultVal;
  return Math.min(10, Math.max(0, Math.round(n)));
}

// Clean and validate an individual evaluation
export function sanitizeEvaluation(
  evalData: Partial<InterviewAnswerEvaluation>,
  question: InterviewQuestion,
  response: InterviewResponse,
  index: number
): InterviewAnswerEvaluation {
  const isBehavioral =
    question.category === 'Behavioral' || question.category === 'Situational';
  const isBackground = question.category === 'Background';

  const criteria: AnswerCriteriaScores = {
    relevance: clampScore(evalData.criteria?.relevance, 5),
    technicalAccuracy: clampScore(evalData.criteria?.technicalAccuracy, 5),
    clarity: clampScore(evalData.criteria?.clarity, 5),
    completeness: clampScore(evalData.criteria?.completeness, 5),
    communication: clampScore(evalData.criteria?.communication, 5),
  };

  // If overallScore is not provided or invalid, compute average of criteria
  let overallScore = evalData.overallScore !== undefined ? clampScore(evalData.overallScore, 5) : 5;
  if (evalData.overallScore === undefined) {
    const avg =
      (criteria.relevance +
        criteria.technicalAccuracy +
        criteria.clarity +
        criteria.completeness +
        criteria.communication) /
      5;
    overallScore = clampScore(avg);
  }

  // Ensure strengths is a non-empty array of strings
  let strengths: string[] = Array.isArray(evalData.strengths)
    ? evalData.strengths.filter((s) => typeof s === 'string' && s.trim().length > 0)
    : [];
  if (strengths.length === 0) {
    if (isBackground) {
      strengths = ['Addressed your career journey and background clearly.'];
    } else if (isBehavioral) {
      strengths = ['Provided relevant context on your experience.'];
    } else {
      strengths = ['Addressed the core technical subject directly.'];
    }
  }

  // Ensure improvements is a non-empty array of strings
  let improvements: string[] = Array.isArray(evalData.improvements)
    ? evalData.improvements.filter((s) => typeof s === 'string' && s.trim().length > 0)
    : [];
  if (improvements.length === 0) {
    if (isBackground) {
      improvements = ['Directly connect your past experience to your future role aspirations.'];
    } else if (isBehavioral) {
      improvements = ['Highlight measurable outcomes and specific actions you personally took.'];
    } else {
      improvements = ['Elaborate with deeper implementation mechanisms or practical trade-offs.'];
    }
  }

  // Ensure feedback is a helpful string
  let feedback =
    typeof evalData.feedback === 'string' && evalData.feedback.trim().length > 0
      ? evalData.feedback.trim()
      : isBackground
      ? 'Good walkthrough of your background. Strengthen it further by explicitly tying your journey to the target role requirements.'
      : isBehavioral
      ? 'Good scenario overview. Use the STAR approach to highlight specific personal actions and quantifiable outcomes.'
      : 'Solid baseline response. Consider incorporating specific implementation trade-offs and practical examples.';

  // Format behavioral STAR breakdown (STRICT: only for Behavioral / Situational questions!)
  let behavioralEvaluation: BehavioralSTARBreakdown | null = null;
  if (isBehavioral && evalData.behavioralEvaluation) {
    behavioralEvaluation = {
      situation: evalData.behavioralEvaluation.situation || undefined,
      task: evalData.behavioralEvaluation.task || undefined,
      action: evalData.behavioralEvaluation.action || undefined,
      result: evalData.behavioralEvaluation.result || undefined,
    };
  }

  return {
    questionId: question.id || `q-${index + 1}`,
    questionNumber: response.questionNumber || index + 1,
    question: question.question,
    answer: response.answer || '',
    overallScore,
    criteria,
    strengths,
    improvements,
    feedback,
    behavioralEvaluation: isBehavioral ? behavioralEvaluation : null,
    evaluatedAt: new Date().toISOString(),
  };
}

// Deterministic rule-based fallback answer evaluator
export function generateFallbackInterviewAnswerEvaluation(
  question: InterviewQuestion,
  response: InterviewResponse,
  config: InterviewConfig,
  index: number,
  resumeText = ''
): InterviewAnswerEvaluation {
  const answer = (response.answer || '').trim();
  const words = answer ? answer.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const isBackground = question.category === 'Background';
  const isBehavioral =
    question.category === 'Behavioral' || question.category === 'Situational';
  const isTechnical = !isBackground && !isBehavioral;

  // 1. Check for Empty / No Answer
  if (wordCount === 0) {
    return {
      questionId: question.id || `q-${index + 1}`,
      questionNumber: response.questionNumber || index + 1,
      question: question.question,
      answer: '',
      overallScore: 0,
      criteria: {
        relevance: 0,
        technicalAccuracy: 0,
        clarity: 0,
        completeness: 0,
        communication: 0,
      },
      strengths: ['No answer was submitted for this question.'],
      improvements: [
        isBackground
          ? 'Provide a concise overview of your career background, education, and interest in this role.'
          : isBehavioral
          ? 'Share a concrete real-world scenario outlining the situation, your actions, and the outcome.'
          : 'Provide a substantive response explaining the core technical concepts and implementation details.',
      ],
      feedback:
        'No answer was recorded for this question. In an actual interview, even if unsure of the full answer, walk the interviewer through your foundational thinking or problem-solving approach.',
      behavioralEvaluation: isBehavioral
        ? {
            situation: 'Not provided',
            task: 'Not provided',
            action: 'Not provided',
            result: 'Not provided',
          }
        : null,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 2. Check for Extremely Short Answer (< 8 words)
  if (wordCount < 8) {
    return {
      questionId: question.id || `q-${index + 1}`,
      questionNumber: response.questionNumber || index + 1,
      question: question.question,
      answer: response.answer,
      overallScore: 2,
      criteria: {
        relevance: 3,
        technicalAccuracy: 2,
        clarity: 4,
        completeness: 1,
        communication: 2,
      },
      strengths: ['Briefly touched on the topic.'],
      improvements: [
        'The answer is too brief to demonstrate proficiency or provide sufficient context.',
        isBackground
          ? 'Expand on your career trajectory, key skills gained, and motivation for the role.'
          : isBehavioral
          ? 'Provide a complete story detailing the challenge, your specific actions, and the final results.'
          : 'Explain the technical rationale, underlying mechanisms, and practical implementation.',
      ],
      feedback: `Your answer ("${answer}") is too short for a ${config.interviewLevel} ${config.targetRole} interview. Expand your response with concrete details, context, and clear explanations.`,
      behavioralEvaluation: isBehavioral
        ? {
            situation: 'Briefly mentioned',
            task: 'Unspecified',
            action: 'Unspecified',
            result: 'Unspecified',
          }
        : null,
      evaluatedAt: new Date().toISOString(),
    };
  }

  const lowerAnswer = answer.toLowerCase();
  const lowerQuestion = question.question.toLowerCase();

  // Relevance Calculation
  const questionWords = lowerQuestion
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          'what',
          'when',
          'where',
          'which',
          'explain',
          'describe',
          'difference',
          'between',
          'your',
          'with',
          'from',
          'this',
          'that',
          'have',
          'tell',
          'about',
        ].includes(w)
    );

  const matchedQuestionWords = questionWords.filter((w) => lowerAnswer.includes(w));
  const relevanceRatio =
    questionWords.length > 0 ? matchedQuestionWords.length / questionWords.length : 0.6;
  let relevanceScore = Math.min(10, Math.max(3, Math.round(5 + relevanceRatio * 5)));

  // Completeness Calculation
  let completenessScore = 5;
  if (wordCount < 18) completenessScore = 2;
  else if (wordCount < 30) completenessScore = 3;
  else if (wordCount < 50) completenessScore = 5;
  else if (wordCount < 120) completenessScore = 7;
  else if (wordCount <= 300) completenessScore = 9;
  else completenessScore = 8; // verbose

  // Clarity & Communication
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = wordCount / Math.max(1, sentences.length);
  let clarityScore = 6;
  if (wordCount < 18) clarityScore = 4;
  else if (avgSentenceLength > 35) clarityScore = 5; // run-on sentences
  else if (avgSentenceLength < 5) clarityScore = 5; // fragmented
  else if (wordCount >= 30 && wordCount <= 250) clarityScore = 8;
  clarityScore = Math.min(10, Math.max(3, clarityScore));

  let commScore = 6;
  if (wordCount < 18) commScore = 4;
  if (/\b(um|uh|like|idk|kinda|sorta)\b/i.test(answer)) commScore -= 2;
  if (
    /\b(first|second|moreover|furthermore|additionally|specifically|in conclusion|ultimately|as a result)\b/i.test(
      answer
    )
  ) {
    commScore += 1;
  }
  commScore = Math.min(10, Math.max(3, commScore));

  // ==========================================
  // BRANCH 1: BACKGROUND QUESTIONS
  // ==========================================
  if (isBackground) {
    let motivationScore = 5;
    const hasJourney =
      /\b(started|learned|journey|began|transitioned|pursued|studied|education|degree|background|passion|interest|curious)\b/i.test(
        answer
      );
    const hasTechMention =
      /\b(c\b|c\+\+|python|java|javascript|typescript|react|node|html|css|sql|web|frontend|backend|fullstack|software)\b/i.test(
        answer
      );
    const hasTargetRoleConnection =
      lowerAnswer.includes(config.targetRole.toLowerCase()) ||
      /\b(full stack|developer|engineer|software engineer|analyst|product manager)\b/i.test(answer);
    const hasFutureGoal =
      /\b(goal|aspire|future|look forward|excited|aim|growth|career)\b/i.test(answer);

    if (wordCount < 18) {
      motivationScore = 4;
    } else if (wordCount < 35) {
      motivationScore = 5;
      if (hasJourney) motivationScore += 1;
    } else {
      motivationScore = 6;
      if (hasJourney) motivationScore += 1;
      if (hasTechMention) motivationScore += 1;
      if (hasTargetRoleConnection) motivationScore += 1;
      if (hasFutureGoal) motivationScore += 1;
    }
    motivationScore = Math.min(10, Math.max(2, motivationScore));

    const overallScore = Math.min(
      10,
      Math.max(
        1,
        Math.round(
          relevanceScore * 0.25 +
            motivationScore * 0.3 +
            clarityScore * 0.2 +
            completenessScore * 0.15 +
            commScore * 0.1
        )
      )
    );

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasJourney) {
      strengths.push('Clearly outlined your learning path and progression into software engineering.');
    } else {
      strengths.push('Provided a direct overview of your background.');
    }

    if (hasTechMention) {
      strengths.push('Mentioned the specific programming languages and foundational tools you learned.');
    }

    if (hasTargetRoleConnection) {
      strengths.push(`Expressed enthusiasm and motivation for the ${config.targetRole} role.`);
    }

    if (!hasTargetRoleConnection) {
      improvements.push(
        `Explicitly connect how your foundational skills prepare you directly for the ${config.targetRole} role.`
      );
    }
    if (!hasFutureGoal) {
      improvements.push(
        'Mention your future career goals or what you are looking forward to building next.'
      );
    }
    if (wordCount < 50) {
      improvements.push(
        'Consider mentioning a pivotal project or achievement that catalyzed your passion for development.'
      );
    }

    if (strengths.length === 0) {
      strengths.push('Articulated your background with approachable communication.');
    }
    if (improvements.length === 0) {
      improvements.push('Include a quick mention of a signature project to make your story even more memorable.');
    }

    let feedback = '';
    if (overallScore >= 8) {
      feedback = `Engaging walkthrough of your journey into engineering. You clearly articulated your learning path and enthusiasm for ${config.targetRole}. To elevate it further, briefly highlight a favorite project milestone that inspired your transition.`;
    } else if (overallScore >= 6) {
      feedback = `Good overview of your background and how you started learning programming. To strengthen your answer, explicitly connect your past experience to why you are pursuing this ${config.targetRole} role and mention your future career goals.`;
    } else {
      feedback = `Your background summary is a start, but needs more depth. Describe your learning journey, the technologies you've worked with, and why you are excited to pursue a ${config.targetRole} position.`;
    }

    return {
      questionId: question.id || `q-${index + 1}`,
      questionNumber: response.questionNumber || index + 1,
      question: question.question,
      answer: response.answer,
      overallScore,
      criteria: {
        relevance: relevanceScore,
        technicalAccuracy: motivationScore,
        clarity: clarityScore,
        completeness: completenessScore,
        communication: commScore,
      },
      strengths,
      improvements,
      feedback,
      behavioralEvaluation: null, // Strictly null for background questions!
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // BRANCH 2: BEHAVIORAL QUESTIONS
  // ==========================================
  if (isBehavioral) {
    const hasActionWords =
      /\b(led|developed|created|resolved|designed|implemented|coordinated|facilitated|negotiated|improved|refactored|mentored|delivered|shipped|fixed|refactored|diagnosed)\b/i.test(
        answer
      );
    const hasOutcomes =
      /\b(result|outcome|improved|reduced|increased|percent|%|boosted|saved|success|achieved|deadline|launched|resolved|prevented)\b/i.test(
        answer
      );
    const hasPersonalOwnership = lowerAnswer.includes('i ') || lowerAnswer.includes('my role');

    let problemSolvingScore = 5;
    if (wordCount < 18) {
      problemSolvingScore = 3;
    } else if (wordCount < 35) {
      problemSolvingScore = 4;
      if (hasActionWords) problemSolvingScore += 1;
    } else {
      problemSolvingScore = 5;
      if (hasActionWords) problemSolvingScore += 2;
      if (hasOutcomes) problemSolvingScore += 1;
      if (hasPersonalOwnership) problemSolvingScore += 1;
    }
    problemSolvingScore = Math.min(10, Math.max(3, problemSolvingScore));

    const overallScore = Math.min(
      10,
      Math.max(
        1,
        Math.round(
          relevanceScore * 0.25 +
            problemSolvingScore * 0.25 +
            clarityScore * 0.2 +
            completenessScore * 0.2 +
            commScore * 0.1
        )
      )
    );

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasPersonalOwnership) {
      strengths.push('Articulated clear personal ownership and individual actions.');
    } else {
      improvements.push('Emphasize your individual role and decisions rather than only speaking collectively as "we".');
    }

    if (hasOutcomes) {
      strengths.push('Highlighted the outcome and positive impact of your actions.');
    } else {
      improvements.push('Conclude with measurable outcomes or key lessons learned (the Result in STAR).');
    }

    if (hasActionWords && strengths.length < 3) {
      strengths.push('Described concrete steps taken to resolve the challenge.');
    }

    if (strengths.length === 0) {
      strengths.push('Addressed the situational challenge directly.');
    }
    if (improvements.length === 0) {
      improvements.push('Consider quantifying the business or team impact with metrics.');
    }

    let feedback = '';
    if (overallScore >= 8) {
      feedback = `Strong behavioral answer with good situational clarity and ownership. You effectively highlighted your problem-solving process and final results. To elevate further, quantify your impact where possible.`;
    } else if (overallScore >= 6) {
      feedback = `Decent narrative explaining the scenario. To improve, follow a structured STAR approach: briefly set the Situation/Task, spend most time detailing your specific Actions, and conclude with the tangible Result or takeaway.`;
    } else {
      feedback = `The response gives a general overview but would be much more impactful with a structured STAR format. Be specific about a real project scenario, what actions YOU personally took, and what positive outcome was achieved.`;
    }

    const hasSituation =
      /\b(when|while|at|during|project|situation|time|company|sprint|release)\b/i.test(lowerAnswer);
    const hasTask =
      /\b(needed to|had to|goal|task|responsible|objective|challenge|required)\b/i.test(lowerAnswer);
    const hasAction =
      /\b(i |my role|implemented|developed|created|resolved|led|decided|diagnosed|refactored)\b/i.test(
        lowerAnswer
      );
    const hasResult =
      /\b(result|outcome|impact|success|achieved|improved|learned|saved|reduced|prevented)\b/i.test(
        lowerAnswer
      );

    const behavioralEvaluation: BehavioralSTARBreakdown = {
      situation: hasSituation
        ? 'Outlined context and initial project setting.'
        : 'Context could be clarified with specific timeline/company setting.',
      task: hasTask
        ? 'Identified the core objective or problem to solve.'
        : 'Specify the exact challenge or goal you needed to achieve.',
      action: hasAction
        ? 'Detailed the specific actions and techniques applied.'
        : 'Highlight the concrete steps YOU took to drive resolution.',
      result: hasResult
        ? 'Highlighted the outcome and impact achieved.'
        : 'Conclude with quantifiable impact, metrics, or lessons learned.',
    };

    return {
      questionId: question.id || `q-${index + 1}`,
      questionNumber: response.questionNumber || index + 1,
      question: question.question,
      answer: response.answer,
      overallScore,
      criteria: {
        relevance: relevanceScore,
        technicalAccuracy: problemSolvingScore,
        clarity: clarityScore,
        completeness: completenessScore,
        communication: commScore,
      },
      strengths,
      improvements,
      feedback,
      behavioralEvaluation,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // BRANCH 3: TECHNICAL QUESTIONS
  // ==========================================
  const hasCodeOrTechTerms =
    /(\b(function|const|let|async|await|return|import|class|interface|component|state|props|hook|api|http|rest|sql|query|index|cache|promise|try|catch|schema|thread|concurrency|docker|container|microservice|btree|hash|middleware|dom|reconciliation|props)\b)/i.test(
      answer
    );
  const hasStructuredExplanation =
    answer.includes('\n') ||
    answer.includes(';') ||
    answer.includes(':') ||
    answer.includes('- ') ||
    answer.includes('1.') ||
    answer.includes('for example') ||
    answer.includes('whereas') ||
    answer.includes('in contrast');

  let techScore = 5;
  if (wordCount < 18) {
    techScore = 3;
    if (hasCodeOrTechTerms) techScore = 4;
  } else if (wordCount < 35) {
    techScore = 4;
    if (hasCodeOrTechTerms) techScore += 1;
  } else {
    techScore = 5;
    if (hasCodeOrTechTerms) techScore += 2;
    if (hasStructuredExplanation) techScore += 1;
    if (wordCount > 60) techScore += 1;
    if (wordCount > 100) techScore += 1;
  }
  techScore = Math.min(10, Math.max(2, techScore));

  const overallScore = Math.min(
    10,
    Math.max(
      1,
      Math.round(
        relevanceScore * 0.25 +
          techScore * 0.35 +
          clarityScore * 0.15 +
          completenessScore * 0.15 +
          commScore * 0.1
      )
    )
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (relevanceScore >= 7) {
    strengths.push(`Directly addressed the key focus of the question (${question.topic || 'the topic'}).`);
  } else {
    improvements.push(`Ensure your answer focuses directly on the core question prompt without drifting.`);
  }

  if (techScore >= 7) {
    strengths.push('Demonstrated solid foundational technical vocabulary and accurate conceptual understanding.');
  } else {
    improvements.push('Incorporate deeper technical mechanisms, error handling, or performance trade-offs.');
  }

  if (wordCount >= 60) {
    strengths.push('Provided a well-explained answer with meaningful technical depth.');
  } else {
    improvements.push('Expand on real-world use cases or architectural trade-offs to show hands-on mastery.');
  }

  if (clarityScore >= 7 && strengths.length < 3) {
    strengths.push('Well-structured explanation with smooth logical flow.');
  }
  if (strengths.length === 0) {
    strengths.push(`Addressed the primary topic (${question.topic || 'the topic'}) directly.`);
  }
  if (improvements.length === 0) {
    improvements.push('Consider highlighting edge cases or scalability implications for an even stronger response.');
  }

  let feedback = '';
  if (overallScore >= 8) {
    feedback = `Excellent technical explanation. You clearly articulated the core concepts of ${question.topic || 'the subject'} with appropriate depth and terminology. To make it even stronger, consider briefly discussing how you would monitor, debug, or scale this in production.`;
  } else if (overallScore >= 6) {
    feedback = `Good baseline explanation of ${question.topic || 'the concept'}. You covered the primary concepts, but the answer would stand out more by detailing concrete implementation patterns, error handling scenarios, or performance trade-offs.`;
  } else {
    feedback = `Your answer touches on ${question.topic || 'the topic'}, but lacks the technical depth expected for a ${config.interviewLevel} ${config.targetRole} role. Focus on explaining the internal mechanics, practical implementation steps, and why certain architectural decisions are preferred.`;
  }

  return {
    questionId: question.id || `q-${index + 1}`,
    questionNumber: response.questionNumber || index + 1,
    question: question.question,
    answer: response.answer,
    overallScore,
    criteria: {
      relevance: relevanceScore,
      technicalAccuracy: techScore,
      clarity: clarityScore,
      completeness: completenessScore,
      communication: commScore,
    },
    strengths,
    improvements,
    feedback,
    behavioralEvaluation: null, // Strictly null for technical questions!
    evaluatedAt: new Date().toISOString(),
  };
}

// AI-powered batch evaluator using Google Gen AI
export async function evaluateInterviewAnswersWithGemini(
  config: InterviewConfig,
  questions: InterviewQuestion[],
  responses: InterviewResponse[],
  resumeText: string,
  candidateName: string,
  ai: GoogleGenAI
): Promise<InterviewAnswerEvaluation[]> {
  const qaPairs = questions.map((q, idx) => {
    const resp = responses.find((r) => r.questionId === q.id || r.questionNumber === idx + 1) || {
      questionId: q.id,
      questionNumber: idx + 1,
      question: q.question,
      answer: '',
      submittedAt: new Date().toISOString(),
    };
    return {
      index: idx + 1,
      questionId: q.id,
      questionNumber: idx + 1,
      category: q.category,
      difficulty: q.difficulty,
      topic: q.topic || config.targetRole,
      expectedFocus: q.expectedFocus || '',
      question: q.question,
      answer: resp.answer || '',
    };
  });

  const systemInstruction = `You are a Principal Technical Interviewer and Senior Engineering Hiring Manager at a top-tier technology company.
Your role is to evaluate a candidate's recorded interview responses objectively, fairly, and accurately against professional hiring benchmarks.

INTERVIEW SPECIFICATIONS:
- Target Job Role: "${config.targetRole}"
- Candidate Experience Level: "${config.interviewLevel}"
- Interview Type: "${config.interviewType}"

QUESTION-TYPE-SPECIFIC EVALUATION RULES:

1. BACKGROUND Questions (category === "Background"):
   - Evaluate: career journey, motivation, learning progression, clear narrative, and direct connection to the target role.
   - Strengths & Improvements: MUST be strictly grounded in the candidate's actual background/motivation statement. Discuss progression, motivation for the role, connecting skills to the target role, or future career goals.
   - STRICT RULE: Do NOT give unrelated technical advice (e.g. database scalability, microservices, edge cases, Docker) or STAR advice to background questions.
   - STRICT RULE: "behavioralEvaluation" MUST be null for Background questions.

2. TECHNICAL Questions (category === "Technical"):
   - Evaluate: technical accuracy, conceptual correctness, implementation depth, syntax, architectural reasoning.
   - Strengths & Improvements: MUST evaluate the actual technical mechanisms in the candidate's answer.
   - STRICT RULE: "behavioralEvaluation" MUST be null for Technical questions.

3. BEHAVIORAL & SITUATIONAL Questions (category === "Behavioral" | "Situational"):
   - Evaluate: relevance, clarity, communication, problem-solving, real-world examples, and STAR structure.
   - Provide "behavioralEvaluation": { "situation": "...", "task": "...", "action": "...", "result": "..." }.

SCORING & RUBRIC RULES:
1. "overallScore": Integer from 0 to 10 (consistent with weighted criteria scores):
   - 0-2 = Very weak / empty / completely missed topic
   - 3-4 = Needs significant improvement (vague, high-level, missing key concepts)
   - 5-6 = Basic / partially satisfactory (meets minimal bar, lacks depth/nuance)
   - 7-8 = Good (clear, accurate, demonstrates practical working knowledge)
   - 9 = Very strong (deep understanding, concrete examples, edge cases discussed)
   - 10 = Excellent (mastery, production considerations, flawless communication)

2. "criteria": Object with integer scores (0-10):
   - "relevance": Does the answer directly address the prompt?
   - "technicalAccuracy": Technical correctness (for Technical), Role fit & motivation (for Background), Problem solving & substance (for Behavioral).
   - "clarity": Logical flow, structure, and understandable explanation.
   - "completeness": Covers the core aspects of the question adequately.
   - "communication": Professional, articulate, and well-phrased.

3. "strengths": Array of 1 to 3 specific strengths observed in the candidate's ACTUAL answer.
4. "improvements": Array of 1 to 3 specific, actionable areas for improvement.
5. "feedback": A concise, constructive coaching paragraph (2 to 4 sentences) describing what was done well and how to improve.

GROUNDING & FACTUAL INTEGRITY:
- NEVER claim the candidate mentioned metrics, business impact, scalability, or edge cases unless those concepts are actually in their answer.
- EMPTY ANSWER: If the candidate gave an empty answer, score overallScore=0, all criteria 0, and give constructive advice.
- VERY SHORT ANSWER: If under 15 words, reflect low completeness (1-3) and note brevity.

Return a JSON array containing an evaluation object for each of the ${qaPairs.length} questions in order.`;

  const prompt = `CANDIDATE: ${candidateName || 'Candidate'}
TARGET ROLE: ${config.targetRole} (${config.interviewLevel} Level)
RESUME EXCERPT:
---
${resumeText.slice(0, 4000) || 'General candidate profile.'}
---

QUESTIONS AND CANDIDATE RECORDED ANSWERS TO EVALUATE:
${JSON.stringify(qaPairs, null, 2)}

Evaluate all ${qaPairs.length} responses according to the rubric and return the JSON array.`;

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
            questionId: { type: Type.STRING },
            questionNumber: { type: Type.INTEGER },
            overallScore: { type: Type.INTEGER },
            criteria: {
              type: Type.OBJECT,
              properties: {
                relevance: { type: Type.INTEGER },
                technicalAccuracy: { type: Type.INTEGER },
                clarity: { type: Type.INTEGER },
                completeness: { type: Type.INTEGER },
                communication: { type: Type.INTEGER },
              },
              required: ['relevance', 'technicalAccuracy', 'clarity', 'completeness', 'communication'],
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            feedback: { type: Type.STRING },
            behavioralEvaluation: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
              },
            },
          },
          required: ['questionId', 'questionNumber', 'overallScore', 'criteria', 'strengths', 'improvements', 'feedback'],
        },
      },
    },
  });

  const rawJson = response.text || '[]';
  const parsed = JSON.parse(rawJson);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI returned an empty or invalid evaluation array.');
  }

  // Validate and sanitize each evaluation item, preserving exact questions and answers
  return questions.map((q, idx) => {
    const rawEval = parsed.find((p: any) => p.questionId === q.id || p.questionNumber === idx + 1) || parsed[idx] || {};
    const resp = responses.find((r) => r.questionId === q.id || r.questionNumber === idx + 1) || {
      questionId: q.id,
      questionNumber: idx + 1,
      question: q.question,
      answer: '',
      submittedAt: new Date().toISOString(),
    };
    return sanitizeEvaluation(rawEval, q, resp, idx);
  });
}
