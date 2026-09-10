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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${msg}`);
}

const mockConfig: InterviewConfig = {
  targetRole: 'Full Stack Software Engineer',
  interviewLevel: 'Intermediate',
  interviewType: 'Mixed',
  questionCount: 5,
  duration: '20 minutes',
  interviewMode: 'Chat',
  createdAt: new Date().toISOString(),
};

const mockQuestions: InterviewQuestion[] = [
  {
    id: 'q-1',
    question: 'How do you handle asynchronous operations and error boundaries in Node.js and Express?',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'Node.js & Express Async',
    expectedFocus: 'Async/await, try/catch middleware, unhandled rejections',
  },
  {
    id: 'q-2',
    question: 'Explain the difference between SQL indexing strategies such as B-Tree and Hash indexes.',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'Database Indexing',
    expectedFocus: 'B-Tree range queries, Hash exact match, performance tradeoffs',
  },
  {
    id: 'q-3',
    question: 'Describe a situation where a critical production bug occurred right before a major release. How did you handle it and what was the outcome?',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    topic: 'Crisis Management',
    expectedFocus: 'STAR framework, troubleshooting, team communication, post-mortem',
  },
  {
    id: 'q-4',
    question: 'What is the Virtual DOM in React and why does React use reconciliation?',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'React Virtual DOM',
    expectedFocus: 'Diffing algorithm, minimal DOM updates, performance benefits',
  },
  {
    id: 'q-5',
    question: 'Tell me about a time you had a disagreement with a team member over technical architecture.',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    topic: 'Conflict Resolution',
    expectedFocus: 'STAR methodology, constructive debate, trade-off evaluation',
  },
];

async function runTests() {
  console.log('====================================================');
  console.log('FEATURE 4: AI ANSWER EVALUATION TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Technical answer with a thorough, correct explanation
  console.log('--- TEST 1: Technical answer with correct explanation ---');
  const techGoodResp: InterviewResponse = {
    questionId: 'q-1',
    questionNumber: 1,
    question: mockQuestions[0].question,
    answer:
      'In Node.js and Express, I handle asynchronous operations using async/await paired with structured try/catch blocks. For Express route handlers, I use an async handler wrapper or Express 5 native promise handling to ensure unhandled promise rejections are piped to the centralized error-handling middleware. In that middleware, we log structured error traces, sanitize error messages to avoid leaking stack traces in production, and return consistent HTTP 500 responses.',
    submittedAt: new Date().toISOString(),
    category: 'Technical',
  };

  const eval1 = generateFallbackInterviewAnswerEvaluation(
    mockQuestions[0],
    techGoodResp,
    mockConfig,
    0
  );

  assert(eval1.overallScore >= 7 && eval1.overallScore <= 10, `Good technical answer scores 7-10 (got ${eval1.overallScore})`);
  assert(eval1.criteria.technicalAccuracy >= 7, `Technical accuracy is high (got ${eval1.criteria.technicalAccuracy})`);
  assert(eval1.criteria.relevance >= 7, `Relevance is high (got ${eval1.criteria.relevance})`);
  assert(eval1.strengths.length > 0, 'Generates non-empty strengths');
  assert(eval1.improvements.length > 0, 'Generates non-empty improvements');
  assert(eval1.feedback.length > 20, 'Generates actionable feedback');
  assert(eval1.behavioralEvaluation === null, 'Technical question has null behavioralEvaluation');

  // TEST 2: Technical answer with an incorrect / very brief explanation
  console.log('\n--- TEST 2: Technical answer with weak/incomplete explanation ---');
  const techWeakResp: InterviewResponse = {
    questionId: 'q-2',
    questionNumber: 2,
    question: mockQuestions[1].question,
    answer: 'Index makes it fast. SQL uses tables and you put index on column.',
    submittedAt: new Date().toISOString(),
    category: 'Technical',
  };

  const eval2 = generateFallbackInterviewAnswerEvaluation(
    mockQuestions[1],
    techWeakResp,
    mockConfig,
    1
  );

  assert(eval2.overallScore <= 5, `Weak technical answer scores <= 5 (got ${eval2.overallScore})`);
  assert(eval2.criteria.completeness <= 4, `Completeness reflects brevity/incompleteness (got ${eval2.criteria.completeness})`);
  assert(eval2.improvements.some((i) => i.toLowerCase().includes('technical') || i.toLowerCase().includes('depth') || i.toLowerCase().includes('expand') || i.toLowerCase().includes('concrete')), 'Improvements identify technical gaps');

  // TEST 3: Behavioral answer containing a clear STAR-style example
  console.log('\n--- TEST 3: Behavioral answer with STAR structure ---');
  const behavioralGoodResp: InterviewResponse = {
    questionId: 'q-3',
    questionNumber: 3,
    question: mockQuestions[2].question,
    answer:
      'At my previous company, two hours before our scheduled black Friday release, a memory leak was detected in our checkout service under staging load tests. My task was to isolate the root cause and ensure we did not ship broken code to customers. I immediately initiated an incident bridge, reviewed recent commits, and identified an unclosed database connection pool in a new payment webhook handler. I implemented a fix, added a connection timeout safeguard, and re-ran our load test suite with 10,000 simulated users. As a result, the memory leak was completely resolved, the deployment proceeded with zero customer-facing downtime, and we saved over 30% latency on checkout transactions.',
    submittedAt: new Date().toISOString(),
    category: 'Behavioral',
  };

  const eval3 = generateFallbackInterviewAnswerEvaluation(
    mockQuestions[2],
    behavioralGoodResp,
    mockConfig,
    2
  );

  assert(eval3.overallScore >= 7, `STAR behavioral answer scores >= 7 (got ${eval3.overallScore})`);
  assert(eval3.behavioralEvaluation !== null, 'Behavioral question produces behavioralEvaluation object');
  assert(Boolean(eval3.behavioralEvaluation?.situation), 'Identifies Situation');
  assert(Boolean(eval3.behavioralEvaluation?.task), 'Identifies Task');
  assert(Boolean(eval3.behavioralEvaluation?.action), 'Identifies Action');
  assert(Boolean(eval3.behavioralEvaluation?.result), 'Identifies Result');

  // TEST 4: Very short answer (< 8 words)
  console.log('\n--- TEST 4: Very short answer ---');
  const shortResp: InterviewResponse = {
    questionId: 'q-4',
    questionNumber: 4,
    question: mockQuestions[3].question,
    answer: 'React is fast.',
    submittedAt: new Date().toISOString(),
    category: 'Technical',
  };

  const eval4 = generateFallbackInterviewAnswerEvaluation(
    mockQuestions[3],
    shortResp,
    mockConfig,
    3
  );

  assert(eval4.overallScore <= 3, `Very short answer scores <= 3 (got ${eval4.overallScore})`);
  assert(eval4.criteria.completeness === 1, 'Completeness is 1 for very short answer');
  assert(eval4.feedback.toLowerCase().includes('too short') || eval4.feedback.toLowerCase().includes('expand'), 'Feedback explicitly calls out brevity');

  // TEST 5: Empty answer
  console.log('\n--- TEST 5: Empty answer ---');
  const emptyResp: InterviewResponse = {
    questionId: 'q-5',
    questionNumber: 5,
    question: mockQuestions[4].question,
    answer: '',
    submittedAt: new Date().toISOString(),
    category: 'Behavioral',
  };

  const eval5 = generateFallbackInterviewAnswerEvaluation(
    mockQuestions[4],
    emptyResp,
    mockConfig,
    4
  );

  assert(eval5.overallScore === 0, `Empty answer scores 0 (got ${eval5.overallScore})`);
  assert(eval5.criteria.relevance === 0 && eval5.criteria.technicalAccuracy === 0, 'All criteria are 0');
  assert(eval5.feedback.toLowerCase().includes('no answer'), 'Feedback indicates no answer was recorded');

  // TEST 6: Sanitization & clamping utility
  console.log('\n--- TEST 6: Sanitization and clamping ---');
  const rawMalformed: Partial<InterviewAnswerEvaluation> = {
    overallScore: 99 as any, // out of bounds
    criteria: {
      relevance: -5,
      technicalAccuracy: 15,
      clarity: NaN as any,
      completeness: 8,
      communication: 7,
    },
    strengths: [] as any,
    improvements: [] as any,
    feedback: '',
  };

  const sanitized = sanitizeEvaluation(rawMalformed, mockQuestions[0], techGoodResp, 0);
  assert(sanitized.overallScore === 10, 'Clamps overallScore > 10 to 10');
  assert(sanitized.criteria.relevance === 0, 'Clamps relevance < 0 to 0');
  assert(sanitized.criteria.technicalAccuracy === 10, 'Clamps technicalAccuracy > 10 to 10');
  assert(sanitized.criteria.clarity === 5, 'Defaults NaN score to 5');
  assert(sanitized.strengths.length > 0, 'Fills fallback strength if empty');
  assert(sanitized.improvements.length > 0, 'Fills fallback improvement if empty');
  assert(sanitized.feedback.length > 0, 'Fills fallback feedback if empty');

  // TEST 7: Invariance of original questions & candidate answers
  console.log('\n--- TEST 7: Invariance of original questions and candidate answers ---');
  const originalQText = mockQuestions[0].question;
  const originalAText = techGoodResp.answer;

  const evalSanitized = sanitizeEvaluation({}, mockQuestions[0], techGoodResp, 0);
  assert(evalSanitized.question === originalQText, 'Original question remains 100% untouched');
  assert(evalSanitized.answer === originalAText, 'Original candidate answer remains 100% untouched');
  assert(evalSanitized.questionId === 'q-1', 'Question ID preserved');
  assert(evalSanitized.questionNumber === 1, 'Question number preserved');

  // TEST 8: Full API endpoint simulation via fetch to local server
  console.log('\n--- TEST 8: Live API endpoint test (/api/evaluate-interview-answers) ---');
  try {
    const apiRes = await fetch('http://127.0.0.1:3000/api/evaluate-interview-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: mockConfig,
        questions: mockQuestions,
        responses: [techGoodResp, techWeakResp, behavioralGoodResp, shortResp, emptyResp],
        resumeText: 'Full Stack Engineer with React, Node.js, Express, SQL experience.',
        candidateName: 'John Doe',
      }),
    });

    assert(apiRes.ok, `API endpoint returns 200 OK (status ${apiRes.status})`);
    const apiData = await apiRes.json();
    assert(Array.isArray(apiData.evaluations), 'API response contains evaluations array');
    assert(apiData.evaluations.length === 5, `Evaluations array has 5 items (got ${apiData.evaluations.length})`);
    
    // Check that all 5 questions have valid evaluations
    apiData.evaluations.forEach((e: InterviewAnswerEvaluation, i: number) => {
      assert(typeof e.overallScore === 'number' && e.overallScore >= 0 && e.overallScore <= 10, `Item ${i+1} has valid overallScore in [0,10] (got ${e.overallScore})`);
      assert(Boolean(e.criteria) && typeof e.criteria.relevance === 'number', `Item ${i+1} has valid criteria scores`);
      assert(Array.isArray(e.strengths) && e.strengths.length > 0, `Item ${i+1} has strengths array`);
      assert(Array.isArray(e.improvements) && e.improvements.length > 0, `Item ${i+1} has improvements array`);
      assert(typeof e.feedback === 'string' && e.feedback.length > 0, `Item ${i+1} has feedback string`);
    });
  } catch (err) {
    console.error('API endpoint test error:', err);
    throw err;
  }

  console.log('\n====================================================');
  console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions passed)`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
