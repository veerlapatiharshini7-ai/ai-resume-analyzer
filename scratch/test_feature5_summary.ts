import { computeInterviewFinalSummary } from '../summaryEngine';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewAnswerEvaluation,
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

const mockQuestions: InterviewQuestion[] = [
  {
    id: 'q-1',
    question: 'Tell me about your background and what motivated you to pursue full-stack engineering.',
    category: 'Background',
    difficulty: 'Intermediate',
    topic: 'Career Journey & Motivation',
  },
  {
    id: 'q-2',
    question: 'How do you handle asynchronous operations and error boundaries in Node.js and Express?',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'Node.js & Express Async',
  },
  {
    id: 'q-3',
    question: 'Explain the difference between B-Tree and Hash indexes in database design.',
    category: 'Technical',
    difficulty: 'Intermediate',
    topic: 'Database Indexing Trade-offs',
  },
  {
    id: 'q-4',
    question: 'Describe a situation where a critical production bug occurred right before a major release. How did you handle it and what was the outcome?',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    topic: 'Crisis Management',
  },
  {
    id: 'q-5',
    question: 'Tell me about a time you had a technical disagreement with a teammate regarding system architecture.',
    category: 'Behavioral',
    difficulty: 'Intermediate',
    topic: 'Conflict Resolution',
  },
];

const mockEvaluations: InterviewAnswerEvaluation[] = [
  {
    questionId: 'q-1',
    questionNumber: 1,
    question: mockQuestions[0].question,
    answer: 'I started my programming journey learning C, Python, and Java, then discovered web development with React and Node.js...',
    overallScore: 8,
    criteria: { relevance: 8, technicalAccuracy: 9, clarity: 8, completeness: 7, communication: 7 },
    strengths: ['Clearly articulated engineering journey', 'Highlighted foundational languages learned'],
    improvements: ['Explicitly connect past coursework to future role expectations'],
    feedback: 'Clear walkthrough of your career background and progression into software development.',
    behavioralEvaluation: null,
    evaluatedAt: new Date().toISOString(),
  },
  {
    questionId: 'q-2',
    questionNumber: 2,
    question: mockQuestions[1].question,
    answer: 'In Node.js, I use async/await with try/catch blocks and centralized error middleware...',
    overallScore: 8,
    criteria: { relevance: 8, technicalAccuracy: 8, clarity: 8, completeness: 7, communication: 7 },
    strengths: ['Accurate conceptual understanding of async/await in Node.js', 'Well-explained error propagation mechanism'],
    improvements: ['Discuss production monitoring or debugging tools for unhandled rejections'],
    feedback: 'Excellent technical explanation of asynchronous error handling.',
    behavioralEvaluation: null,
    evaluatedAt: new Date().toISOString(),
  },
  {
    questionId: 'q-3',
    questionNumber: 3,
    question: mockQuestions[2].question,
    answer: 'B-Tree indexes support range queries, whereas Hash indexes provide O(1) exact lookups...',
    overallScore: 7,
    criteria: { relevance: 7, technicalAccuracy: 8, clarity: 7, completeness: 7, communication: 6 },
    strengths: ['Correct distinction between B-Tree range queries and Hash exact lookups', 'Identified write overhead trade-offs'],
    improvements: ['Consider highlighting composite index column ordering rules'],
    feedback: 'Good baseline explanation of database indexing strategies and trade-offs.',
    behavioralEvaluation: null,
    evaluatedAt: new Date().toISOString(),
  },
  {
    questionId: 'q-4',
    questionNumber: 4,
    question: mockQuestions[3].question,
    answer: 'Two hours before release, a memory leak was found. I isolated unclosed connection pools and refactored the timeouts...',
    overallScore: 8,
    criteria: { relevance: 8, technicalAccuracy: 9, clarity: 8, completeness: 8, communication: 7 },
    strengths: ['Clear personal ownership and decisive actions during production crisis', 'Measurable latency reduction outcome'],
    improvements: ['Mention post-mortem documentation or automated regression tests introduced'],
    feedback: 'Strong behavioral answer with good situational clarity and ownership.',
    behavioralEvaluation: {
      situation: 'Memory leak detected in staging before release',
      task: 'Isolate root cause to avoid launch delay',
      action: 'Analyzed heap dumps and fixed connection pool timeouts',
      result: 'Memory stabilized and release shipped with zero downtime',
    },
    evaluatedAt: new Date().toISOString(),
  },
  {
    questionId: 'q-5',
    questionNumber: 5,
    question: mockQuestions[4].question,
    answer: 'My teammate wanted WebSockets for everything, while I advocated for HTTP polling based on data latency requirements...',
    overallScore: 7,
    criteria: { relevance: 7, technicalAccuracy: 8, clarity: 8, completeness: 7, communication: 7 },
    strengths: ['Data-driven conflict resolution approach', 'Maintained team collaboration without friction'],
    improvements: ['Include how you followed up after deployment to validate the decision'],
    feedback: 'Decent narrative explaining constructive architectural debate and resolution.',
    behavioralEvaluation: {
      situation: 'Disagreement on WebSockets vs HTTP polling',
      task: 'Align team on optimal architecture',
      action: 'Benchmarked connection overhead and presented trade-offs',
      result: 'Delivered project two weeks early with consensus',
    },
    evaluatedAt: new Date().toISOString(),
  },
];

async function runFeature5Tests() {
  console.log('================================================================');
  console.log('TESTING FEATURE 5: FINAL SCORE + FEEDBACK SUMMARY ENGINE');
  console.log('================================================================\n');

  const summary = computeInterviewFinalSummary(mockConfig, mockQuestions, mockEvaluations, 'session-test-123');

  // TEST 1: Overall Score Calculation (8 + 8 + 7 + 8 + 7) / 5 = 38 / 5 = 7.6
  console.log('TEST 1: Overall Score Calculation');
  assert(summary.overallScore === 7.6, `Overall score is 7.6 (got ${summary.overallScore})`);
  assert(summary.overallRating === 'Strong', `Overall rating is 'Strong' for score 7.6 (got '${summary.overallRating}')`);

  // TEST 2: Performance Summary Structure
  console.log('\nTEST 2: Performance Summary Structure');
  assert(typeof summary.performanceSummary.overall === 'string' && summary.performanceSummary.overall.length > 20, 'Overall performance summary populated');
  assert(typeof summary.performanceSummary.technical === 'string' && summary.performanceSummary.technical.length > 20, 'Technical performance summary populated');
  assert(typeof summary.performanceSummary.behavioral === 'string' && summary.performanceSummary.behavioral.length > 20, 'Behavioral performance summary populated');
  assert(typeof summary.performanceSummary.communication === 'string' && summary.performanceSummary.communication.length > 20, 'Communication performance summary populated');

  // TEST 3: Key Strengths (3–5 items, non-empty, grounded)
  console.log('\nTEST 3: Key Strengths Aggregation');
  assert(Array.isArray(summary.keyStrengths) && summary.keyStrengths.length >= 3 && summary.keyStrengths.length <= 5, `Key strengths count is between 3 and 5 (got ${summary.keyStrengths.length})`);
  assert(summary.keyStrengths.some((s) => s.includes('async/await') || s.includes('engineering journey') || s.includes('personal ownership')), 'Strengths are grounded in candidate evaluations');

  // TEST 4: Areas for Improvement (3–5 items, actionable)
  console.log('\nTEST 4: Areas for Improvement Aggregation');
  assert(Array.isArray(summary.areasForImprovement) && summary.areasForImprovement.length >= 3 && summary.areasForImprovement.length <= 5, `Areas for improvement count is between 3 and 5 (got ${summary.areasForImprovement.length})`);
  assert(summary.areasForImprovement.some((i) => i.includes('production') || i.includes('coursework') || i.includes('composite')), 'Improvements are grounded in candidate evaluations');

  // TEST 5: Dimension Insights (5 dimensions)
  console.log('\nTEST 5: Dimension Breakdown');
  assert(summary.dimensionScores.length === 5, `Has 5 dimension scores (got ${summary.dimensionScores.length})`);
  
  const dimNames = summary.dimensionScores.map((d) => d.dimension);
  assert(dimNames.includes('Technical Knowledge & Depth'), 'Includes Technical Knowledge');
  assert(dimNames.includes('Problem Solving & Situational Reasoning'), 'Includes Problem Solving');
  assert(dimNames.includes('Communication & Delivery'), 'Includes Communication');
  assert(dimNames.includes('Relevance to Target Role'), 'Includes Relevance to Target Role');
  assert(dimNames.includes('Response Completeness'), 'Includes Response Completeness');

  summary.dimensionScores.forEach((dim) => {
    assert(dim.score >= 0 && dim.score <= 10, `Dimension ${dim.dimension} score in [0,10] (got ${dim.score})`);
    assert(dim.description.length > 10, `Dimension ${dim.dimension} has descriptive insight`);
  });

  // TEST 6: Question Summaries (Q1..Q5 with scores)
  console.log('\nTEST 6: Question Score Breakdown');
  assert(summary.questionSummaries.length === 5, `Question summaries length is 5 (got ${summary.questionSummaries.length})`);
  assert(summary.questionSummaries[0].score === 8, 'Q1 score is 8');
  assert(summary.questionSummaries[1].score === 8, 'Q2 score is 8');
  assert(summary.questionSummaries[2].score === 7, 'Q3 score is 7');
  assert(summary.questionSummaries[3].score === 8, 'Q4 score is 8');
  assert(summary.questionSummaries[4].score === 7, 'Q5 score is 7');

  // TEST 7: Rating Tier Thresholds
  console.log('\nTEST 7: Rating Tier Threshold Verification');
  const makeEvalWithScore = (score: number) => ({
    ...mockEvaluations[0],
    overallScore: score,
  });

  const sExcellent = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(9.5)]);
  assert(sExcellent.overallRating === 'Excellent', `Score 9.5 -> Excellent (got ${sExcellent.overallRating})`);

  const sStrong = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(8.0)]);
  assert(sStrong.overallRating === 'Strong', `Score 8.0 -> Strong (got ${sStrong.overallRating})`);

  const sGood = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(6.5)]);
  assert(sGood.overallRating === 'Good', `Score 6.5 -> Good (got ${sGood.overallRating})`);

  const sPartial = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(5.2)]);
  assert(sPartial.overallRating === 'Partially Satisfactory', `Score 5.2 -> Partially Satisfactory (got ${sPartial.overallRating})`);

  const sNeedsImp = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(4.0)]);
  assert(sNeedsImp.overallRating === 'Needs Improvement', `Score 4.0 -> Needs Improvement (got ${sNeedsImp.overallRating})`);

  const sWeak = computeInterviewFinalSummary(mockConfig, [mockQuestions[0]], [makeEvalWithScore(2.0)]);
  assert(sWeak.overallRating === 'Very Weak', `Score 2.0 -> Very Weak (got ${sWeak.overallRating})`);

  // TEST 8: Empty / Edge Case Handling
  console.log('\nTEST 8: Empty Session / Missing Data Safety');
  const emptySummary = computeInterviewFinalSummary(mockConfig, [], []);
  assert(emptySummary.overallScore === 0, 'Empty evaluation gives score 0');
  assert(emptySummary.overallRating === 'Needs Improvement', 'Empty evaluation handles rating safely');
  assert(emptySummary.keyStrengths.length > 0, 'Provides fallback strength for empty session');
  assert(emptySummary.areasForImprovement.length > 0, 'Provides fallback improvement for empty session');

  console.log('\n================================================================');
  console.log(`ALL FEATURE 5 TESTS PASSED! (${passedTests}/${totalTests} assertions verified)`);
  console.log('================================================================');
}

runFeature5Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
