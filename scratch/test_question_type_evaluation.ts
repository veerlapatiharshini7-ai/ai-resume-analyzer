import {
  generateFallbackInterviewAnswerEvaluation,
  sanitizeEvaluation,
} from '../evaluationEngine';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
} from '../src/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`  ✅ [PASS] ${msg}`);
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

async function testQuestionTypeAwareEvaluation() {
  console.log('================================================================');
  console.log('TESTING QUESTION-TYPE-AWARE EVALUATION & STAR ENFORCEMENT');
  console.log('================================================================\n');

  // ==========================================
  // SCENARIO 1: BACKGROUND / CAREER MOTIVATION QUESTION
  // ==========================================
  console.log('SCENARIO 1: Background & Career Motivation Question');
  const bgQuestion: InterviewQuestion = {
    id: 'q-bg',
    question: 'Tell me about your background and what motivated you to pursue full-stack software engineering.',
    category: 'Background',
    difficulty: 'Intermediate',
    topic: 'Career Journey & Motivation',
  };

  const bgResponse: InterviewResponse = {
    questionId: 'q-bg',
    questionNumber: 1,
    question: bgQuestion.question,
    answer:
      'I started my engineering journey by learning C, Python, and Java during my coursework. I quickly discovered a passion for building interactive user experiences, which led me to dive deep into JavaScript, TypeScript, React, and Node.js. Over the past two years, I have built full stack web applications and developed REST APIs. I am motivated to pursue this Full Stack Software Engineer role because I love working across the entire lifecycle from UI design to backend systems.',
    submittedAt: new Date().toISOString(),
  };

  const bgEval = generateFallbackInterviewAnswerEvaluation(bgQuestion, bgResponse, mockConfig, 0);

  // 1. STAR MUST BE NULL
  assert(bgEval.behavioralEvaluation === null, 'Background question MUST NOT have STAR evaluation (behavioralEvaluation is null)');
  
  // 2. Score must be high and consistent
  assert(bgEval.overallScore >= 7 && bgEval.overallScore <= 10, `Background answer scores 7-10 (got ${bgEval.overallScore})`);
  assert(bgEval.criteria.relevance >= 7, `Relevance is >= 7 (got ${bgEval.criteria.relevance})`);
  assert(bgEval.criteria.technicalAccuracy >= 7, `Motivation & Role Fit score is >= 7 (got ${bgEval.criteria.technicalAccuracy})`);

  // 3. Feedback must discuss progression and role fit, NOT database scalability or STAR
  const feedbackLower = bgEval.feedback.toLowerCase();
  assert(!feedbackLower.includes('star'), 'Feedback does NOT mention STAR method');
  assert(!feedbackLower.includes('scalability') && !feedbackLower.includes('database scalability'), 'Feedback does NOT contain unrelated technical scalability claims');
  assert(feedbackLower.includes('journey') || feedbackLower.includes('background') || feedbackLower.includes('full stack') || feedbackLower.includes('engineering'), 'Feedback discusses career background and progression');

  // 4. Strengths must be grounded in actual answer
  assert(bgEval.strengths.some((s) => s.toLowerCase().includes('learning') || s.toLowerCase().includes('programming') || s.toLowerCase().includes('path') || s.toLowerCase().includes('motivation') || s.toLowerCase().includes('enthusiasm')), 'Strengths highlight actual learning progression and role motivation');

  // ==========================================
  // SCENARIO 2: TECHNICAL QUESTION
  // ==========================================
  console.log('\nSCENARIO 2: Technical Question');
  const techQuestion: InterviewQuestion = {
    id: 'q-tech',
    question: 'How do you design REST APIs and handle asynchronous error propagation in Node.js?',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'Node.js REST & Async Errors',
  };

  const techResponse: InterviewResponse = {
    questionId: 'q-tech',
    questionNumber: 2,
    question: techQuestion.question,
    answer:
      'I structure RESTful APIs using standard HTTP verbs (GET, POST, PUT, DELETE) with semantic status codes. For asynchronous error propagation in Node.js and Express, I wrap route handlers with async handler wrappers or use Express 5 promise support. Any rejected promise is passed to the next(err) middleware where structured errors are logged and safe error responses are returned without exposing server internals.',
    submittedAt: new Date().toISOString(),
  };

  const techEval = generateFallbackInterviewAnswerEvaluation(techQuestion, techResponse, mockConfig, 1);

  // 1. STAR MUST BE NULL
  assert(techEval.behavioralEvaluation === null, 'Technical question MUST NOT have STAR evaluation (behavioralEvaluation is null)');
  
  // 2. Score must reflect technical accuracy
  assert(techEval.overallScore >= 7 && techEval.overallScore <= 10, `Technical answer scores 7-10 (got ${techEval.overallScore})`);
  assert(techEval.criteria.technicalAccuracy >= 7, `Technical accuracy is >= 7 (got ${techEval.criteria.technicalAccuracy})`);

  // 3. Strengths and feedback reflect technical concepts
  assert(techEval.strengths.some((s) => s.toLowerCase().includes('technical') || s.toLowerCase().includes('vocabulary') || s.toLowerCase().includes('concept')), 'Strengths reflect technical accuracy');

  // ==========================================
  // SCENARIO 3: BEHAVIORAL QUESTION
  // ==========================================
  console.log('\nSCENARIO 3: Behavioral Question (STAR Structure Expected)');
  const behQuestion: InterviewQuestion = {
    id: 'q-beh',
    question: 'Tell me about a time you encountered a severe production bug right before a launch.',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    topic: 'Crisis Management',
  };

  const behResponse: InterviewResponse = {
    questionId: 'q-beh',
    questionNumber: 3,
    question: behQuestion.question,
    answer:
      'During a critical release sprint at my previous company, a memory leak was discovered in the checkout service staging environment (Situation). My task was to isolate the bug and fix it before the scheduled launch (Task). I analyzed server logs, identified an unclosed database connection pool in a webhook handler, and refactored the connection timeout logic (Action). As a result, memory consumption stabilized, latency dropped by 30%, and the release proceeded with zero downtime (Result).',
    submittedAt: new Date().toISOString(),
  };

  const behEval = generateFallbackInterviewAnswerEvaluation(behQuestion, behResponse, mockConfig, 2);

  // 1. STAR MUST BE POPULATED
  assert(behEval.behavioralEvaluation !== null, 'Behavioral question MUST have STAR evaluation populated');
  assert(Boolean(behEval.behavioralEvaluation?.situation), 'Situation is extracted');
  assert(Boolean(behEval.behavioralEvaluation?.task), 'Task is extracted');
  assert(Boolean(behEval.behavioralEvaluation?.action), 'Action is extracted');
  assert(Boolean(behEval.behavioralEvaluation?.result), 'Result is extracted');

  // 2. Score reflects problem-solving
  assert(behEval.overallScore >= 7 && behEval.overallScore <= 10, `Behavioral answer scores 7-10 (got ${behEval.overallScore})`);

  // ==========================================
  // SCENARIO 4: SANITIZATION ENFORCEMENT FOR BACKGROUND QUESTIONS
  // ==========================================
  console.log('\nSCENARIO 4: Sanitization rejects STAR on Background/Technical questions');
  const malformedWithSTAR = {
    overallScore: 8,
    criteria: { relevance: 8, technicalAccuracy: 8, clarity: 8, completeness: 8, communication: 8 },
    strengths: ['Clear narrative'],
    improvements: ['Elaborate on future goals'],
    feedback: 'Great background story.',
    behavioralEvaluation: {
      situation: 'Invalid situation',
      task: 'Invalid task',
      action: 'Invalid action',
      result: 'Invalid result',
    },
  };

  const sanitizedBg = sanitizeEvaluation(malformedWithSTAR, bgQuestion, bgResponse, 0);
  assert(sanitizedBg.behavioralEvaluation === null, 'Sanitizer removes STAR from Background question');

  const sanitizedTech = sanitizeEvaluation(malformedWithSTAR, techQuestion, techResponse, 1);
  assert(sanitizedTech.behavioralEvaluation === null, 'Sanitizer removes STAR from Technical question');

  const sanitizedBeh = sanitizeEvaluation(malformedWithSTAR, behQuestion, behResponse, 2);
  assert(sanitizedBeh.behavioralEvaluation !== null, 'Sanitizer keeps STAR for Behavioral question');

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions verified)`);
  console.log('================================================================');
}

testQuestionTypeAwareEvaluation().catch((err) => {
  console.error(err);
  process.exit(1);
});
