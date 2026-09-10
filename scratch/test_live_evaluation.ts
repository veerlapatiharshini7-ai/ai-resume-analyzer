import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewEvaluationResult,
} from '../src/types';

async function runLiveEvaluationTest() {
  console.log('================================================================');
  console.log('RUNNING LIVE FEATURE 4 EVALUATION TEST VIA API ENDPOINT');
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

  const sample5Questions: InterviewQuestion[] = [
    {
      id: 'q-1',
      question: 'Tell me about your background and what motivated you to specialize in full-stack software development.',
      category: 'Background',
      difficulty: 'Intermediate',
      topic: 'Career Journey & Motivation',
    },
    {
      id: 'q-2',
      question: 'How do you design REST APIs and handle asynchronous error propagation in Node.js and Express?',
      category: 'Technical',
      difficulty: 'Intermediate',
      topic: 'Node.js & Express REST APIs',
    },
    {
      id: 'q-3',
      question: 'Explain how database indexing works and the trade-offs between B-Tree and Hash indexes.',
      category: 'Technical',
      difficulty: 'Intermediate',
      topic: 'Database Indexing Trade-offs',
    },
    {
      id: 'q-4',
      question: 'Describe a situation where you discovered a critical bug in production right before release. How did you resolve it and what was the outcome?',
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

  const sample5Responses: InterviewResponse[] = [
    {
      questionId: 'q-1',
      questionNumber: 1,
      question: sample5Questions[0].question,
      answer:
        'I started my programming journey by learning C, Python, and Java during university. I soon discovered a strong passion for web development and began building full stack applications with TypeScript, React, and Node.js. Over the past two years, I built and maintained e-commerce dashboards and microservices. I am motivated to pursue this Full Stack Software Engineer role because I enjoy solving problems across both frontend user interfaces and scalable backend systems.',
      submittedAt: new Date().toISOString(),
    },
    {
      questionId: 'q-2',
      questionNumber: 2,
      question: sample5Questions[1].question,
      answer:
        'I design REST APIs following standard HTTP methods and status codes. In Node.js with Express, I manage asynchronous operations using async/await with an async error-handling wrapper. When errors occur, they are caught and passed to a centralized error-handling middleware via next(err), where we log structured stack traces to our observability system and return sanitized JSON error responses with appropriate 4xx or 5xx codes.',
      submittedAt: new Date().toISOString(),
    },
    {
      questionId: 'q-3',
      questionNumber: 3,
      question: sample5Questions[2].question,
      answer:
        'Database indexes create lookup data structures on indexed columns. B-Tree indexes maintain sorted tree structures that support fast range queries, prefix searches, and sorting. Hash indexes use hash tables that provide O(1) exact match lookups but cannot support range queries. The main trade-off is write overhead: every INSERT, UPDATE, or DELETE requires updating index trees, which consumes disk and memory.',
      submittedAt: new Date().toISOString(),
    },
    {
      questionId: 'q-4',
      questionNumber: 4,
      question: sample5Questions[3].question,
      answer:
        'Two hours before a major product release at my previous startup, a memory leak was detected under load testing on our checkout service (Situation). My task was to identify the root cause immediately to avoid delaying launch (Task). I analyzed heap dumps, identified an unclosed database connection pool in a new webhook listener, and refactored the connection lifecycle with explicit release timeouts (Action). As a result, memory consumption stabilized, latency dropped by 30%, and the release shipped on schedule with zero downtime (Result).',
      submittedAt: new Date().toISOString(),
    },
    {
      questionId: 'q-5',
      questionNumber: 5,
      question: sample5Questions[5]?.question || sample5Questions[4].question,
      answer:
        'In a recent project, a colleague wanted to use WebSockets for all data syncing, while I advocated for simple HTTP polling because real-time sub-second updates were not required (Situation). My task was to align the team on the optimal architecture without friction (Task). I scheduled a 30-minute design review, benchmarked server overhead and connection state costs, and demonstrated that HTTP polling with caching met all SLA requirements with significantly simpler infrastructure (Action). My colleague agreed with the data-driven trade-off, and we delivered the project two weeks early (Result).',
      submittedAt: new Date().toISOString(),
    },
  ];

  console.log('Sending live POST request to http://127.0.0.1:3000/api/evaluate-interview-answers...');
  const startTime = Date.now();

  const response = await fetch('http://127.0.0.1:3000/api/evaluate-interview-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config,
      questions: sample5Questions,
      responses: sample5Responses,
      resumeText:
        'Sarah Jenkins\nFull Stack Developer with experience in React, TypeScript, Node.js, Express, PostgreSQL, MongoDB, and REST APIs.',
      candidateName: 'Sarah Jenkins',
      sessionId: `live-session-${Date.now()}`,
    }),
  });

  const durationMs = Date.now() - startTime;
  console.log(`Response received in ${durationMs}ms with HTTP Status: ${response.status} ${response.statusText}\n`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API returned HTTP ${response.status}: ${errorText}`);
  }

  const result: InterviewEvaluationResult = await response.json();

  console.log('----------------------------------------------------------------');
  console.log('EVALUATION ENGINE EXECUTION STATUS');
  console.log('----------------------------------------------------------------');
  console.log(`Session ID: ${result.sessionId}`);
  console.log(`Evaluated At: ${result.evaluatedAt}`);
  console.log(`Used Fallback Evaluator: ${result.usedFallback ?? false}`);

  console.log('\n----------------------------------------------------------------');
  console.log('PER-QUESTION EVALUATION DETAILS');
  console.log('----------------------------------------------------------------');

  result.evaluations.forEach((evalItem, idx) => {
    const originalQ = sample5Questions[idx];
    const originalA = sample5Responses[idx];

    console.log(`\n[Question ${idx + 1}] Category: ${originalQ.category} | Topic: ${originalQ.topic}`);
    console.log(`Question: "${evalItem.question}"`);
    console.log(`Candidate Answer (${evalItem.answer.split(' ').length} words): "${evalItem.answer.slice(0, 80)}..."`);
    console.log(`Overall Score: ${evalItem.overallScore}/10`);
    console.log(`Criteria: Relevance: ${evalItem.criteria.relevance}/10 | Tech/Motivation/Substance: ${evalItem.criteria.technicalAccuracy}/10 | Clarity: ${evalItem.criteria.clarity}/10 | Completeness: ${evalItem.criteria.completeness}/10 | Comm: ${evalItem.criteria.communication}/10`);
    console.log(`Strengths: ${JSON.stringify(evalItem.strengths)}`);
    console.log(`Improvements: ${JSON.stringify(evalItem.improvements)}`);
    console.log(`AI Feedback: "${evalItem.feedback}"`);
    console.log(`STAR Behavioral Breakdown: ${evalItem.behavioralEvaluation ? JSON.stringify(evalItem.behavioralEvaluation) : 'null (Correctly omitted)'}`);

    // VERIFICATION ASSERTIONS
    // 1. Question invariant
    if (evalItem.question !== originalQ.question) {
      throw new Error(`Question ${idx + 1} was modified!`);
    }
    // 2. Answer invariant
    if (evalItem.answer !== originalA.answer) {
      throw new Error(`Answer ${idx + 1} was modified!`);
    }
    // 3. Background: STAR must be null
    if (originalQ.category === 'Background') {
      if (evalItem.behavioralEvaluation !== null) {
        throw new Error(`Background question received non-null STAR evaluation!`);
      }
    }
    // 4. Technical: STAR must be null
    if (originalQ.category === 'Technical') {
      if (evalItem.behavioralEvaluation !== null) {
        throw new Error(`Technical question received non-null STAR evaluation!`);
      }
    }
    // 5. Behavioral: STAR must be populated
    if (originalQ.category === 'Behavioral') {
      if (!evalItem.behavioralEvaluation) {
        throw new Error(`Behavioral question did not receive STAR evaluation!`);
      }
    }
  });

  // Check that no Feature 5 cumulative analytics exist in response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawObj = result as any;
  if (rawObj.finalCumulativeScore !== undefined || rawObj.dashboardAnalytics !== undefined) {
    throw new Error('Feature 5 fields detected in Feature 4 evaluation response!');
  }

  console.log('\n================================================================');
  console.log('✅ LIVE EVALUATION TEST PASSED ALL CHECKS PERFECTLY!');
  console.log('================================================================');
}

runLiveEvaluationTest().catch((err) => {
  console.error('LIVE TEST FAILED:', err);
  process.exit(1);
});
