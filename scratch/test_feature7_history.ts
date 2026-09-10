import { computeInterviewFinalSummary } from '../summaryEngine';
import {
  saveCompletedInterview,
  getInterviewHistory,
  getInterviewRecordById,
  deleteInterviewRecord,
  clearAllInterviewHistory,
  computeProgressStats,
} from '../src/utils/interviewHistory';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  CompletedInterviewSession,
  InterviewAnswerEvaluation,
  InterviewEvaluationResult,
} from '../src/types';

// Polyfill mock localStorage for node environment test execution
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

(global as any).window = {
  localStorage: new LocalStorageMock(),
  dispatchEvent: (_e: any) => true,
};

async function testFeature7HistoryAndProgress() {
  console.log('================================================================');
  console.log('🚀 TESTING FEATURE 7: INTERVIEW HISTORY + PROGRESS TRACKING');
  console.log('================================================================\n');

  // Reset storage
  clearAllInterviewHistory();
  let initialHistory = getInterviewHistory();
  console.log('TEST 1: Initial Empty History');
  if (initialHistory.length !== 0) throw new Error(`Expected 0 initial records, got ${initialHistory.length}`);
  let emptyStats = computeProgressStats(initialHistory);
  if (emptyStats.totalCompleted !== 0 || emptyStats.averageScore !== 0) {
    throw new Error('Expected 0 stats on empty history');
  }
  console.log('  ✅ [PASS] Empty history handled cleanly with 0 stats.');

  // ==========================================
  // INTERVIEW 1: Full Stack Developer (Chat Mode)
  // ==========================================
  console.log('\nTEST 2: Saving Interview 1 (Chat Mode)');
  const config1: InterviewConfig = {
    targetRole: 'Full Stack Developer',
    interviewLevel: 'Intermediate',
    interviewType: 'Mixed',
    questionCount: 5,
    duration: '20 minutes',
    interviewMode: 'Chat',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  };

  const questions1: InterviewQuestion[] = [
    { id: 'q1', question: 'How do you optimize React rendering?', category: 'Technical', difficulty: 'Intermediate' },
    { id: 'q2', question: 'Explain SQL indexing strategies.', category: 'Technical', difficulty: 'Intermediate' },
    { id: 'q3', question: 'How do you handle API authentication?', category: 'Technical', difficulty: 'Intermediate' },
    { id: 'q4', question: 'Describe a time you resolved a team conflict.', category: 'Behavioral', difficulty: 'Intermediate' },
    { id: 'q5', question: 'How do you prioritize competing deadlines?', category: 'Behavioral', difficulty: 'Intermediate' },
  ];

  const responses1: InterviewResponse[] = questions1.map((q, idx) => ({
    questionId: q.id,
    question: q.question,
    answer: `Detailed candidate typed response for ${q.question}`,
    questionNumber: idx + 1,
    submittedAt: new Date(Date.now() - 24 * 3600 * 1000 + idx * 60000).toISOString(),
    category: q.category,
    difficulty: q.difficulty,
  }));

  const session1: CompletedInterviewSession = {
    id: `session-chat-${Date.now()}`,
    config: config1,
    questions: questions1,
    responses: responses1,
    startedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 3600 * 1000 + 15 * 60000).toISOString(),
    isTimedOut: false,
  };

  const evaluations1: InterviewAnswerEvaluation[] = questions1.map((q, idx) => ({
    questionId: q.id,
    questionNumber: idx + 1,
    question: q.question,
    answer: responses1[idx].answer,
    overallScore: idx < 3 ? 7 : 8,
    criteria: { relevance: 8, technicalAccuracy: 7, clarity: 8, completeness: 7, communication: 8 },
    strengths: ['Clear terminology', 'Practical examples'],
    improvements: ['Could include specific performance metrics'],
    feedback: 'Solid foundational answer.',
    evaluatedAt: session1.completedAt,
  }));

  const summary1 = computeInterviewFinalSummary(session1.config, session1.questions, evaluations1, session1.id);
  const savedRecord1 = saveCompletedInterview(session1, evaluations1, summary1, 'Jordan Smith');

  console.log(`  ✅ [PASS] Saved Chat Session "${savedRecord1.targetRole}" with Overall Score ${savedRecord1.overallScore}/10 (${savedRecord1.overallRating})`);

  // ==========================================
  // INTERVIEW 2: Senior Backend Engineer (Voice Mode)
  // ==========================================
  console.log('\nTEST 3: Saving Interview 2 (Voice Mode)');
  const config2: InterviewConfig = {
    targetRole: 'Senior Backend Engineer',
    interviewLevel: 'Advanced',
    interviewType: 'Technical',
    questionCount: 5,
    duration: '30 minutes',
    interviewMode: 'Voice',
    createdAt: new Date().toISOString(),
  };

  const questions2: InterviewQuestion[] = [
    { id: 'vq1', question: 'How do you design a distributed cache with Redis?', category: 'Technical', difficulty: 'Advanced' },
    { id: 'vq2', question: 'Explain database sharding and partition keys.', category: 'Technical', difficulty: 'Advanced' },
    { id: 'vq3', question: 'How do you guarantee idempotency in message queues?', category: 'Technical', difficulty: 'Advanced' },
    { id: 'vq4', question: 'Describe memory leak debugging in Node.js runtime.', category: 'Technical', difficulty: 'Advanced' },
    { id: 'vq5', question: 'How do you architect zero-downtime database migrations?', category: 'Technical', difficulty: 'Advanced' },
  ];

  const responses2: InterviewResponse[] = questions2.map((q, idx) => ({
    questionId: q.id,
    question: q.question,
    answer: `Transcribed spoken voice response for ${q.question}`,
    questionNumber: idx + 1,
    submittedAt: new Date(Date.now() - 10 * 60000 + idx * 60000).toISOString(),
    category: q.category,
    difficulty: q.difficulty,
  }));

  const session2: CompletedInterviewSession = {
    id: `session-voice-${Date.now()}`,
    config: config2,
    questions: questions2,
    responses: responses2,
    startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    completedAt: new Date().toISOString(),
    isTimedOut: false,
  };

  const evaluations2: InterviewAnswerEvaluation[] = questions2.map((q, idx) => ({
    questionId: q.id,
    questionNumber: idx + 1,
    question: q.question,
    answer: responses2[idx].answer,
    overallScore: 9,
    criteria: { relevance: 9, technicalAccuracy: 9, clarity: 9, completeness: 9, communication: 9 },
    strengths: ['Staff-level architectural insight', 'Deep edge case consideration'],
    improvements: ['Keep answers concise for time limits'],
    feedback: 'Outstanding technical demonstration.',
    evaluatedAt: session2.completedAt,
  }));

  const summary2 = computeInterviewFinalSummary(session2.config, session2.questions, evaluations2, session2.id);
  const savedRecord2 = saveCompletedInterview(session2, evaluations2, summary2, 'Jordan Smith');

  console.log(`  ✅ [PASS] Saved Voice Session "${savedRecord2.targetRole}" with Overall Score ${savedRecord2.overallScore}/10 (${savedRecord2.overallRating})`);

  // ==========================================
  // TEST 4: History Retrieval & Progress Stats
  // ==========================================
  console.log('\nTEST 4: Verifying History Retrieval & Progress Tracking Stats');
  const allHistory = getInterviewHistory();
  console.log(`  Retrieved ${allHistory.length} total sessions from history.`);
  if (allHistory.length !== 2) {
    throw new Error(`Expected exactly 2 sessions, received ${allHistory.length}`);
  }

  // Check order (newest first: Session 2, then Session 1)
  if (allHistory[0].id !== session2.id || allHistory[1].id !== session1.id) {
    throw new Error('Expected newest session first');
  }
  console.log('  ✅ [PASS] History records are sorted chronologically (newest first).');

  const stats = computeProgressStats(allHistory);
  console.log('  Progress Stats:');
  console.log(`   - Total Completed: ${stats.totalCompleted}`);
  console.log(`   - Chat Count: ${stats.chatCount}, Voice Count: ${stats.voiceCount}`);
  console.log(`   - Average Score: ${stats.averageScore}/10`);
  console.log(`   - Best Score: ${stats.bestScore}/10`);
  console.log(`   - Score Gain / Trend: +${stats.scoreChange} pts`);

  if (stats.totalCompleted !== 2) throw new Error('totalCompleted must be 2');
  if (stats.chatCount !== 1) throw new Error('chatCount must be 1');
  if (stats.voiceCount !== 1) throw new Error('voiceCount must be 1');
  if (stats.bestScore !== savedRecord2.overallScore) throw new Error('bestScore mismatch');
  if (stats.scoreTrend.length !== 2) throw new Error('scoreTrend must contain 2 points');
  if (stats.dimensionAverages.length !== 5) throw new Error('Expected 5 dimension averages');

  console.log('  ✅ [PASS] Progress tracking KPIs, Trendline, and Dimensions computed accurately.');

  // ==========================================
  // TEST 5: Single Record Inspection & Re-opening
  // ==========================================
  console.log('\nTEST 5: Inspecting Single Record by ID');
  const fetched = getInterviewRecordById(session2.id);
  if (!fetched || fetched.id !== session2.id || fetched.evaluations.length !== 5) {
    throw new Error('Failed to retrieve full record by ID');
  }
  console.log(`  ✅ [PASS] Successfully fetched record "${fetched.targetRole}" with all 5 questions and evaluations intact.`);

  // ==========================================
  // TEST 6: Single Record Deletion
  // ==========================================
  console.log('\nTEST 6: Deleting Single Session Record');
  const deleted = deleteInterviewRecord(session1.id);
  if (!deleted) throw new Error('Failed to delete record');
  const historyAfterDelete = getInterviewHistory();
  if (historyAfterDelete.length !== 1 || historyAfterDelete[0].id !== session2.id) {
    throw new Error('History length mismatch after deletion');
  }
  console.log('  ✅ [PASS] Deleted record successfully; remaining session count is 1.');

  // ==========================================
  // TEST 7: Corrupted / Malformed Storage Resilience
  // ==========================================
  console.log('\nTEST 7: Corrupted Storage Resilience');
  window.localStorage.setItem('ai_resume_interview_history_v1', '{"invalid_json_corrupted: true}');
  const corruptedHistory = getInterviewHistory();
  if (!Array.isArray(corruptedHistory) || corruptedHistory.length !== 0) {
    throw new Error('Corrupted storage did not fallback safely to empty array');
  }
  console.log('  ✅ [PASS] Corrupted JSON handled safely without throwing errors.');

  console.log('\n================================================================');
  console.log('🎉 ALL FEATURE 7 HISTORY & PROGRESS TESTS PASSED 100%!');
  console.log('================================================================');
}

testFeature7HistoryAndProgress().catch((err) => {
  console.error('❌ Feature 7 test failed:', err);
  process.exit(1);
});
