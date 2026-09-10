import {
  generateFallbackInterviewAnswerEvaluation,
  sanitizeEvaluation,
  clampScore,
} from '../evaluationEngine';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewAnswerEvaluation,
} from '../src/types';

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, msg: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedAssertions++;
  console.log(`  ✅ [PASS] ${msg}`);
}

async function runMasterVerification() {
  console.log('================================================================');
  console.log('MASTER VERIFICATION SUITE — FEATURE 4 & SYSTEM REGRESSION SAFETY');
  console.log('================================================================\n');

  const config: InterviewConfig = {
    targetRole: 'Full Stack Software Engineer',
    interviewLevel: 'Intermediate',
    interviewType: 'Mixed',
    questionCount: 5,
    duration: '20 minutes',
    interviewMode: 'Chat',
    createdAt: new Date().toISOString(),
  };

  const sampleQuestions: InterviewQuestion[] = [
    {
      id: 'q-1',
      question: 'How do you design scalable REST APIs and handle async errors in Node.js?',
      category: 'Technical',
      difficulty: 'Intermediate',
      topic: 'REST API & Node.js Async',
    },
    {
      id: 'q-2',
      question: 'What is database indexing and when would you avoid adding an index?',
      category: 'Technical',
      difficulty: 'Intermediate',
      topic: 'Database Indexing Trade-offs',
    },
    {
      id: 'q-3',
      question: 'Describe a situation where you resolved a major bug under tight deadlines.',
      category: 'Behavioral',
      difficulty: 'Intermediate',
      topic: 'Crisis Management',
    },
    {
      id: 'q-4',
      question: 'Explain React state management and why immutable state is required.',
      category: 'Technical',
      difficulty: 'Intermediate',
      topic: 'React State Management',
    },
    {
      id: 'q-5',
      question: 'Tell me about a time you handled disagreement on a technical architecture decision.',
      category: 'Behavioral',
      difficulty: 'Intermediate',
      topic: 'Team Collaboration',
    },
  ];

  // ==========================================
  // TEST 1: Technical answer with a correct explanation
  // ==========================================
  console.log('TEST 1: Technical answer with a correct explanation');
  const t1Resp: InterviewResponse = {
    questionId: 'q-1',
    questionNumber: 1,
    question: sampleQuestions[0].question,
    answer:
      'In Node.js and Express, I design REST APIs following standard HTTP verbs and status codes (200, 201, 400, 404, 500). For async error handling, I utilize async/await with custom async wrapper middleware that catches any rejected promises and forwards them to a centralized error middleware. This ensures no unhandled rejections crash the process and errors are sanitized before returning JSON payloads to clients.',
    submittedAt: new Date().toISOString(),
  };
  const e1 = generateFallbackInterviewAnswerEvaluation(sampleQuestions[0], t1Resp, config, 0);
  assert(e1.overallScore >= 7 && e1.overallScore <= 10, `Overall score is 7-10 (got ${e1.overallScore})`);
  assert(e1.criteria.technicalAccuracy >= 7, `Technical accuracy is >= 7 (got ${e1.criteria.technicalAccuracy})`);
  assert(e1.criteria.relevance >= 7, `Relevance is >= 7 (got ${e1.criteria.relevance})`);
  assert(e1.strengths.length >= 1, `Contains strengths (count: ${e1.strengths.length})`);
  assert(e1.improvements.length >= 1, `Contains improvements (count: ${e1.improvements.length})`);
  assert(e1.behavioralEvaluation === null, 'Technical question behavioralEvaluation is null');

  // ==========================================
  // TEST 2: Technical answer with incorrect/incomplete explanation
  // ==========================================
  console.log('\nTEST 2: Technical answer with incomplete/weak explanation');
  const t2Resp: InterviewResponse = {
    questionId: 'q-2',
    questionNumber: 2,
    question: sampleQuestions[1].question,
    answer: 'Index is when database searches faster. You put it on every column.',
    submittedAt: new Date().toISOString(),
  };
  const e2 = generateFallbackInterviewAnswerEvaluation(sampleQuestions[1], t2Resp, config, 1);
  assert(e2.overallScore <= 5, `Weak technical answer overallScore is <= 5 (got ${e2.overallScore})`);
  assert(e2.criteria.completeness <= 4, `Completeness is <= 4 (got ${e2.criteria.completeness})`);
  assert(e2.improvements.length >= 1, 'Provides concrete improvement areas for technical gaps');

  // ==========================================
  // TEST 3: Behavioral answer containing a clear STAR-style example
  // ==========================================
  console.log('\nTEST 3: Behavioral answer with STAR-style structure');
  const t3Resp: InterviewResponse = {
    questionId: 'q-3',
    questionNumber: 3,
    question: sampleQuestions[2].question,
    answer:
      'During a critical sprint release at my previous startup, our team discovered that the payment gateway was timing out under high concurrent loads (Situation). My task was to diagnose the bottleneck and prevent release delay (Task). I analyzed application logs, reproduced the deadlock in a staging environment, and refactored the connection pool configuration while implementing retry backoff logic (Action). As a result, checkout latency dropped by 45%, zero customer transactions failed, and the feature was successfully deployed on schedule (Result).',
    submittedAt: new Date().toISOString(),
  };
  const e3 = generateFallbackInterviewAnswerEvaluation(sampleQuestions[2], t3Resp, config, 2);
  assert(e3.overallScore >= 7, `STAR answer overallScore is >= 7 (got ${e3.overallScore})`);
  assert(e3.behavioralEvaluation !== null, 'Behavioral question produces behavioralEvaluation');
  assert(Boolean(e3.behavioralEvaluation?.situation), 'Situation extracted');
  assert(Boolean(e3.behavioralEvaluation?.task), 'Task extracted');
  assert(Boolean(e3.behavioralEvaluation?.action), 'Action extracted');
  assert(Boolean(e3.behavioralEvaluation?.result), 'Result extracted');

  // ==========================================
  // TEST 4: Very short answer
  // ==========================================
  console.log('\nTEST 4: Very short answer (<8 words)');
  const t4Resp: InterviewResponse = {
    questionId: 'q-4',
    questionNumber: 4,
    question: sampleQuestions[3].question,
    answer: 'State is variables.',
    submittedAt: new Date().toISOString(),
  };
  const e4 = generateFallbackInterviewAnswerEvaluation(sampleQuestions[3], t4Resp, config, 3);
  assert(e4.overallScore <= 3, `Very short answer scores <= 3 (got ${e4.overallScore})`);
  assert(e4.criteria.completeness === 1, 'Completeness is 1');
  assert(e4.feedback.toLowerCase().includes('short') || e4.feedback.toLowerCase().includes('expand'), 'Feedback explicitly addresses brevity');

  // ==========================================
  // TEST 5: Empty answer handling
  // ==========================================
  console.log('\nTEST 5: Empty answer handling');
  const t5Resp: InterviewResponse = {
    questionId: 'q-5',
    questionNumber: 5,
    question: sampleQuestions[4].question,
    answer: '',
    submittedAt: new Date().toISOString(),
  };
  const e5 = generateFallbackInterviewAnswerEvaluation(sampleQuestions[4], t5Resp, config, 4);
  assert(e5.overallScore === 0, `Empty answer score is 0 (got ${e5.overallScore})`);
  assert(e5.criteria.relevance === 0 && e5.criteria.technicalAccuracy === 0, 'Criteria all 0');
  assert(e5.feedback.toLowerCase().includes('no answer'), 'Feedback indicates no answer was provided');

  // ==========================================
  // TEST 6: API Endpoint & Fallback Reliability
  // ==========================================
  console.log('\nTEST 6: API Endpoint & Fallback Reliability');
  const apiRes = await fetch('http://127.0.0.1:3000/api/evaluate-interview-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config,
      questions: sampleQuestions,
      responses: [t1Resp, t2Resp, t3Resp, t4Resp, t5Resp],
      resumeText: 'Full Stack Engineer with React, Node.js, and SQL expertise.',
      candidateName: 'Jane Developer',
    }),
  });
  assert(apiRes.ok, `API responded with HTTP 200 (status: ${apiRes.status})`);
  const apiData = await apiRes.json();
  assert(Array.isArray(apiData.evaluations) && apiData.evaluations.length === 5, 'Returned 5 evaluated responses');

  // ==========================================
  // TEST 7: Malformed AI response handling & sanitization
  // ==========================================
  console.log('\nTEST 7: Malformed AI response sanitization');
  const malformedInput = {
    overallScore: 42, // out of range
    criteria: {
      relevance: -10,
      technicalAccuracy: 25,
      clarity: undefined,
      completeness: 'abc' as any,
      communication: 7,
    },
    strengths: [],
    improvements: [],
    feedback: '',
  };
  const sanitized = sanitizeEvaluation(malformedInput as any, sampleQuestions[0], t1Resp, 0);
  assert(sanitized.overallScore === 10, 'Overall score clamped to max 10');
  assert(sanitized.criteria.relevance === 0, 'Relevance clamped to min 0');
  assert(sanitized.criteria.technicalAccuracy === 10, 'Technical accuracy clamped to max 10');
  assert(sanitized.criteria.clarity === 5, 'Undefined clarity defaulted safely');
  assert(sanitized.criteria.completeness === 5, 'Invalid completeness defaulted safely');
  assert(sanitized.strengths.length > 0, 'Strengths populated with fallback');
  assert(sanitized.improvements.length > 0, 'Improvements populated with fallback');
  assert(sanitized.feedback.length > 0, 'Feedback populated with fallback');

  // ==========================================
  // TEST 8: Retry evaluation & caching consistency
  // ==========================================
  console.log('\nTEST 8: Caching & evaluation idempotency');
  const retryRes = await fetch('http://127.0.0.1:3000/api/evaluate-interview-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config,
      questions: sampleQuestions,
      responses: [t1Resp, t2Resp, t3Resp, t4Resp, t5Resp],
      resumeText: 'Full Stack Engineer with React, Node.js, and SQL expertise.',
      candidateName: 'Jane Developer',
    }),
  });
  assert(retryRes.ok, 'Retry request succeeds');
  const retryData = await retryRes.json();
  assert(retryData.evaluations.length === 5, 'Cached retry evaluations match length');
  assert(retryData.evaluations[0].overallScore === apiData.evaluations[0].overallScore, 'Deterministic cached score equality');

  // ==========================================
  // TEST 9: Invariance of original questions
  // ==========================================
  console.log('\nTEST 9: Invariance of original questions');
  for (let i = 0; i < sampleQuestions.length; i++) {
    assert(
      apiData.evaluations[i].question === sampleQuestions[i].question,
      `Evaluation ${i + 1} question is identical to original question`
    );
    assert(
      apiData.evaluations[i].questionId === sampleQuestions[i].id,
      `Evaluation ${i + 1} questionId matches original (${sampleQuestions[i].id})`
    );
  }

  // ==========================================
  // TEST 10: Invariance of original answers
  // ==========================================
  console.log('\nTEST 10: Invariance of original answers');
  const originalResponses = [t1Resp, t2Resp, t3Resp, t4Resp, t5Resp];
  for (let i = 0; i < originalResponses.length; i++) {
    assert(
      apiData.evaluations[i].answer === originalResponses[i].answer,
      `Evaluation ${i + 1} answer is identical to candidate original answer`
    );
  }

  // ==========================================
  // TEST 11: Regression safety — Existing Resume Analyzer
  // ==========================================
  console.log('\nTEST 11: Regression safety — Resume Analyzer');
  const analyzerRes = await fetch('http://127.0.0.1:3000/api/analyze-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: 'Sarah Jenkins\nFull Stack Developer with React, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Docker.',
      targetRole: 'Full Stack Software Engineer',
    }),
  });
  assert(analyzerRes.ok, 'Resume Analyzer returns HTTP 200');
  const analyzerData = await analyzerRes.json();
  assert(typeof analyzerData.atsScore === 'number', 'ATS score computed');
  assert(typeof analyzerData.summary === 'string' && analyzerData.summary.length > 0, 'Resume summary populated');
  assert(Array.isArray(analyzerData.improvementTips) && analyzerData.improvementTips.length > 0, 'Improvement tips populated');
  assert(Array.isArray(analyzerData.grammarSuggestions) && analyzerData.grammarSuggestions.length > 0, 'Grammar suggestions populated');
  assert(Array.isArray(analyzerData.suitableJobRoles) && analyzerData.suitableJobRoles.length > 0, 'Suitable job roles populated');

  // ==========================================
  // TEST 12: Regression safety — Question Generation
  // ==========================================
  console.log('\nTEST 12: Regression safety — Feature 2 Question Generation');
  const qGenRes = await fetch('http://127.0.0.1:3000/api/generate-interview-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewConfig: config,
      resumeText: 'Full Stack Developer with React, Node.js, and SQL experience.',
      candidateName: 'Jane Developer',
    }),
  });
  assert(qGenRes.ok, 'Question Generation returns HTTP 200');
  const qGenData = await qGenRes.json();
  assert(Array.isArray(qGenData.questions) && qGenData.questions.length === 5, 'Generates requested question count');
  assert(qGenData.questions[0].category === 'Technical' || qGenData.questions[0].category === 'Background', 'Correct category assignment');

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED! (${passedAssertions}/${totalAssertions} assertions verified)`);
  console.log('================================================================');
}

runMasterVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
