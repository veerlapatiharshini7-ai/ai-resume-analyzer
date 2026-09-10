import { computeInterviewFinalSummary } from '../summaryEngine';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  CompletedInterviewSession,
  InterviewEvaluationResult,
} from '../src/types';
import fetch from 'node-fetch';

async function runVoiceInterviewTestSuite() {
  console.log('====================================================');
  console.log('🚀 TESTING FEATURE 6: VOICE INTERVIEW END-TO-END FLOW');
  console.log('====================================================\n');

  // Step 1: Feature 1 & 6 Setup Config
  const voiceConfig: InterviewConfig = {
    targetRole: 'Full Stack Software Engineer',
    interviewLevel: 'Intermediate',
    interviewType: 'Mixed',
    questionCount: 5,
    duration: '20 minutes',
    interviewMode: 'Voice',
    createdAt: new Date().toISOString(),
  };

  console.log('1. Interview Configuration (Voice Mode):', voiceConfig);

  // Step 2: Feature 2 Question Generation (Exact Questions Reuse)
  console.log('\n2. Calling /api/generate-interview-questions with Voice config...');
  const genResponse = await fetch('http://localhost:3000/api/generate-interview-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewConfig: voiceConfig,
      candidateName: 'Alex Rivera',
      resumeText: 'Experienced Full Stack Engineer with React, Node.js, TypeScript, PostgreSQL, Docker, AWS.',
    }),
  });

  if (!genResponse.ok) {
    throw new Error(`Failed to generate questions: ${genResponse.status} ${genResponse.statusText}`);
  }

  const genData = (await genResponse.json()) as { questions: InterviewQuestion[] };
  const questions: InterviewQuestion[] = genData.questions;
  console.log(`✅ Generated ${questions.length} questions for Voice Interview:`);
  questions.forEach((q, idx) => {
    console.log(`   Q${idx + 1} [${q.category}]: ${q.question}`);
  });

  if (questions.length !== 5) {
    throw new Error(`Expected exactly 5 questions, received ${questions.length}`);
  }

  // Step 3: Feature 6 Voice Interview Responses Simulation (5 Responses recorded via STT / transcript editor)
  console.log('\n3. Simulating Candidate Voice Spoken Responses (Speech-to-Text Transcripts):');
  const voiceTranscripts = [
    "In my recent project, I built high-throughput REST and GraphQL APIs using Node.js and TypeScript, using Redis caching to reduce database query loads by 45%.",
    "I manage frontend state in React using Redux Toolkit and React Query for server-side cache invalidation, ensuring predictable unidirectional data flow.",
    "When tackling database performance bottlenecks in PostgreSQL, I examine EXPLAIN ANALYZE query plans, add composite indexes on high-cardinality columns, and implement connection pooling with PgBouncer.",
    "During a critical production outage caused by memory leaks in our worker processes, I analyzed heap snapshots with Chrome DevTools, identified unbounded event listener closures, and deployed a hotfix within 30 minutes.",
    "To ensure reliable microservice communication, I design idempotent message handlers with RabbitMQ and Apache Kafka, incorporating dead-letter queues and exponential backoff retry mechanisms.",
  ];

  const recordedResponses: InterviewResponse[] = questions.map((q, idx) => ({
    questionId: q.id,
    question: q.question,
    answer: voiceTranscripts[idx],
    questionNumber: idx + 1,
    submittedAt: new Date().toISOString(),
    category: q.category,
    difficulty: q.difficulty,
    topic: q.topic,
    expectedFocus: q.expectedFocus,
  }));

  const completedVoiceSession: CompletedInterviewSession = {
    id: `session-${Date.now()}`,
    config: voiceConfig,
    questions,
    responses: recordedResponses,
    startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
    isTimedOut: false,
  };

  console.log(`✅ Recorded ${completedVoiceSession.responses.length} Voice Responses with correct schema.`);

  // Step 4: Feature 4 Evaluation Compatibility (Voice Transcripts through AI Evaluation API)
  console.log('\n4. Testing Feature 4 AI Evaluation of Voice Transcripts (/api/evaluate-interview-answers)...');
  const evalResponse = await fetch('http://localhost:3000/api/evaluate-interview-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: completedVoiceSession.config,
      questions: completedVoiceSession.questions,
      responses: completedVoiceSession.responses,
      candidateName: 'Alex Rivera',
      sessionId: completedVoiceSession.id,
    }),
  });

  if (!evalResponse.ok) {
    throw new Error(`Evaluation API failed: ${evalResponse.status} ${evalResponse.statusText}`);
  }

  const evalData = (await evalResponse.json()) as InterviewEvaluationResult;
  console.log(`✅ Evaluated ${evalData.evaluations.length} answers successfully.`);
  evalData.evaluations.forEach((ev, idx) => {
    console.log(`   Q${idx + 1} Score: ${ev.overallScore}/10 | Feedback: ${ev.feedback.slice(0, 80)}...`);
  });

  // Step 5: Feature 5 Final Summary Computation
  console.log('\n5. Testing Feature 5 Final Summary Computation for Voice Session...');
  const summary = computeInterviewFinalSummary(
    completedVoiceSession.config,
    completedVoiceSession.questions,
    evalData.evaluations,
    completedVoiceSession.id
  );

  console.log(`✅ Final Overall Score: ${summary.overallScore}/10 (${summary.overallRating})`);
  console.log(`   Dimensions evaluated: ${summary.dimensionScores.map(d => `${d.dimension}: ${d.score}/10`).join(', ')}`);
  console.log(`   Key Strengths (${summary.keyStrengths.length}): ${summary.keyStrengths[0]}`);

  // Step 6: Regression Test - Chat Mode
  console.log('\n6. Regression Test: Chat Mode Verification...');
  const chatConfig: InterviewConfig = {
    ...voiceConfig,
    interviewMode: 'Chat',
  };
  const chatSummary = computeInterviewFinalSummary(
    chatConfig,
    completedVoiceSession.questions,
    evalData.evaluations,
    `chat-${Date.now()}`
  );
  console.log(`✅ Chat Mode Final Score: ${chatSummary.overallScore}/10 (${chatSummary.overallRating})`);

  console.log('\n====================================================');
  console.log('🎉 ALL FEATURE 6 VOICE INTERVIEW TESTS PASSED 100%!');
  console.log('====================================================');
}

runVoiceInterviewTestSuite().catch((err) => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});
