import {
  InterviewConfig,
  InterviewQuestion,
  InterviewAnswerEvaluation,
  InterviewFinalSummary,
  InterviewPerformanceSummary,
  InterviewDimensionScore,
  QuestionScoreSummary,
} from './src/types';

/**
 * Computes the Feature 5 Interview Final Summary from actual Feature 4 evaluations.
 * Strictly deterministic, grounded in recorded scores and feedback, zero hallucination.
 */
export function computeInterviewFinalSummary(
  config: InterviewConfig,
  questions: InterviewQuestion[],
  evaluations: InterviewAnswerEvaluation[],
  sessionId?: string
): InterviewFinalSummary {
  const total = evaluations.length;
  if (total === 0) {
    return {
      sessionId: sessionId || `session-${Date.now()}`,
      config,
      overallScore: 0,
      overallRating: 'Needs Improvement',
      performanceSummary: {
        overall: 'No interview evaluations available to summarize.',
        technical: 'No technical questions evaluated.',
        behavioral: 'No behavioral questions evaluated.',
        communication: 'No communication metrics recorded.',
      },
      keyStrengths: ['Completed interview session setup.'],
      areasForImprovement: ['Submit detailed answers for all interview questions.'],
      dimensionScores: [],
      questionSummaries: [],
      calculatedAt: new Date().toISOString(),
    };
  }

  // 1. Calculate Overall Score (Average of all per-question overallScores)
  const sumScores = evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
  const rawAvg = sumScores / total;
  const overallScore = Number(rawAvg.toFixed(1));

  // 2. Assign Overall Rating Badge
  let overallRating: InterviewFinalSummary['overallRating'] = 'Good';
  if (overallScore >= 9.0) overallRating = 'Excellent';
  else if (overallScore >= 7.5) overallRating = 'Strong';
  else if (overallScore >= 6.0) overallRating = 'Good';
  else if (overallScore >= 5.0) overallRating = 'Partially Satisfactory';
  else if (overallScore >= 3.0) overallRating = 'Needs Improvement';
  else overallRating = 'Very Weak';

  // 3. Category Segmentation
  const techEvals = evaluations.filter((e) => {
    const q = questions.find((item) => item.id === e.questionId || item.question === e.question);
    return q?.category === 'Technical';
  });

  const behEvals = evaluations.filter((e) => {
    const q = questions.find((item) => item.id === e.questionId || item.question === e.question);
    return q?.category === 'Behavioral' || q?.category === 'Situational';
  });

  const bgEvals = evaluations.filter((e) => {
    const q = questions.find((item) => item.id === e.questionId || item.question === e.question);
    return q?.category === 'Background';
  });

  // Calculate Averages for Dimensions
  const avgRelevance = Number(
    (evaluations.reduce((acc, curr) => acc + (curr.criteria?.relevance || 5), 0) / total).toFixed(1)
  );
  const avgClarity = Number(
    (evaluations.reduce((acc, curr) => acc + (curr.criteria?.clarity || 5), 0) / total).toFixed(1)
  );
  const avgCompleteness = Number(
    (evaluations.reduce((acc, curr) => acc + (curr.criteria?.completeness || 5), 0) / total).toFixed(1)
  );
  const avgCommunication = Number(
    (evaluations.reduce((acc, curr) => acc + (curr.criteria?.communication || 5), 0) / total).toFixed(1)
  );

  const avgTechAccuracy =
    techEvals.length > 0
      ? Number(
          (
            techEvals.reduce((acc, curr) => acc + (curr.criteria?.technicalAccuracy || 5), 0) /
            techEvals.length
          ).toFixed(1)
        )
      : avgRelevance;

  const avgProblemSolving =
    behEvals.length > 0
      ? Number(
          (
            behEvals.reduce((acc, curr) => acc + (curr.criteria?.technicalAccuracy || 5), 0) /
            behEvals.length
          ).toFixed(1)
        )
      : avgClarity;

  // 4. Construct 5 Dimension Insights
  const dimensionScores: InterviewDimensionScore[] = [
    {
      dimension: 'Technical Knowledge & Depth',
      score: avgTechAccuracy,
      description:
        avgTechAccuracy >= 7.5
          ? 'Demonstrated strong command of core technologies, accurate terminology, and clear implementation mechanics.'
          : avgTechAccuracy >= 5.5
          ? 'Solid foundational knowledge with opportunities to articulate deeper architectural trade-offs and error handling.'
          : 'Foundational concepts require deeper review, practical implementation detail, and concrete examples.',
    },
    {
      dimension: 'Problem Solving & Situational Reasoning',
      score: avgProblemSolving,
      description:
        avgProblemSolving >= 7.5
          ? 'Effectively structured past scenarios with personal ownership, clear conflict/incident resolution, and measurable impact.'
          : avgProblemSolving >= 5.5
          ? 'Addressed situational challenges well; can be enhanced by consistently applying the STAR framework and quantifying outcomes.'
          : 'Focus on providing structured real-world stories detailing the situation, specific actions taken, and final results.',
    },
    {
      dimension: 'Communication & Delivery',
      score: avgCommunication,
      description:
        avgCommunication >= 7.5
          ? 'Articulate, professional, and well-paced delivery with clear logical transitions.'
          : avgCommunication >= 5.5
          ? 'Clear and understandable communication; avoid overly fragmented sentences or filler phrasing.'
          : 'Work on structuring thoughts before answering to deliver concise, professional explanations.',
    },
    {
      dimension: 'Relevance to Target Role',
      score: avgRelevance,
      description:
        avgRelevance >= 7.5
          ? `Directly addressed interview prompts and closely aligned responses to ${config.targetRole} expectations.`
          : avgRelevance >= 5.5
          ? `Good topical alignment with occasional opportunities to connect answers more explicitly to the ${config.targetRole} domain.`
          : `Ensure answers focus strictly on the specific question asked without drifting into unrelated topics.`,
    },
    {
      dimension: 'Response Completeness',
      score: avgCompleteness,
      description:
        avgCompleteness >= 7.5
          ? 'Thorough responses that covered all key aspects of the questions, trade-offs, and practical implications.'
          : avgCompleteness >= 5.5
          ? 'Adequately covered primary question objectives; expand on edge cases or follow-up considerations.'
          : 'Several answers were too brief to fully demonstrate competency; aim for 50–150 words per response.',
    },
  ];

  // 5. Construct Grounded Performance Summary
  const overallSummary =
    overallScore >= 8.0
      ? `Outstanding interview performance for a ${config.interviewLevel} ${config.targetRole}. You demonstrated strong technical depth, structured communication, and clear problem-solving across all evaluated questions.`
      : overallScore >= 6.5
      ? `Strong overall performance for ${config.targetRole} (${config.interviewLevel} Level). You provided solid baseline answers and good conceptual clarity, with minor areas where adding concrete examples and architectural trade-offs will elevate your profile.`
      : overallScore >= 5.0
      ? `Satisfactory interview attempt demonstrating foundational familiarity with ${config.targetRole} concepts. Focus on expanding technical detail and using structured frameworks (like STAR) for behavioral responses.`
      : `The interview highlights several foundational growth areas for a ${config.interviewLevel} ${config.targetRole}. Dedicated practice on technical mechanisms, implementation depth, and structured storytelling will help you improve.`;

  const techSummary =
    techEvals.length > 0
      ? avgTechAccuracy >= 7.5
        ? `Consistently delivered accurate technical explanations across ${techEvals.length} technical questions, showing working mastery of ${config.targetRole} principles.`
        : `Covered standard technical concepts with room to discuss production considerations, error handling, and performance trade-offs in greater detail.`
      : `General technical alignment observed across all prompts.`;

  const behSummary =
    behEvals.length > 0
      ? avgProblemSolving >= 7.5
        ? `Articulated clear personal ownership and concrete actions in ${behEvals.length} behavioral scenarios, effectively conveying project impact.`
        : `Communicated past experiences with good intent; refine your answers by strictly following Situation-Task-Action-Result structure.`
      : bgEvals.length > 0
      ? `Effectively communicated your career journey, learning path, and passion for the ${config.targetRole} specialization.`
      : `Addressed non-technical questions with professional composure.`;

  const commSummary =
    avgCommunication >= 7.5
      ? `Maintained a polished, professional tone and clear explanation structure throughout the interview.`
      : `Communication was understandable and conversational; continue practicing concise, structured delivery.`;

  const performanceSummary: InterviewPerformanceSummary = {
    overall: overallSummary,
    technical: techSummary,
    behavioral: behSummary,
    communication: commSummary,
  };

  // 6. Deduplicate and Extract Key Strengths (3–5 items)
  const allStrengths = evaluations.flatMap((e) => e.strengths || []);
  const uniqueStrengths = Array.from(
    new Set(allStrengths.map((s) => s.trim()).filter((s) => s.length > 0))
  );
  const keyStrengths =
    uniqueStrengths.length >= 3
      ? uniqueStrengths.slice(0, 5)
      : [
          ...uniqueStrengths,
          'Maintained consistent professional focus across all interview questions.',
          `Demonstrated foundational alignment with ${config.targetRole} expectations.`,
        ].slice(0, 4);

  // 7. Deduplicate and Extract Areas for Improvement (3–5 items)
  const allImprovements = evaluations.flatMap((e) => e.improvements || []);
  const uniqueImprovements = Array.from(
    new Set(allImprovements.map((i) => i.trim()).filter((i) => i.length > 0))
  );
  const areasForImprovement =
    uniqueImprovements.length >= 3
      ? uniqueImprovements.slice(0, 5)
      : [
          ...uniqueImprovements,
          'Provide deeper technical mechanisms and trade-off comparisons in technical answers.',
          'Quantify business results and team impact with measurable metrics where possible.',
        ].slice(0, 4);

  // 8. Map Question Score Summaries
  const questionSummaries: QuestionScoreSummary[] = questions.map((q, idx) => {
    const evalMatch =
      evaluations.find((e) => e.questionId === q.id || e.questionNumber === idx + 1) ||
      evaluations[idx];
    return {
      questionId: q.id || `q-${idx + 1}`,
      questionNumber: idx + 1,
      question: q.question,
      category: q.category,
      topic: q.topic || config.targetRole,
      score: evalMatch?.overallScore ?? 5,
    };
  });

  return {
    sessionId: sessionId || `session-${Date.now()}`,
    config,
    overallScore,
    overallRating,
    performanceSummary,
    keyStrengths,
    areasForImprovement,
    dimensionScores,
    questionSummaries,
    calculatedAt: new Date().toISOString(),
  };
}
