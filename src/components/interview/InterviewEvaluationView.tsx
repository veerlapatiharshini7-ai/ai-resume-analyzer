import React, { useState } from 'react';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewAnswerEvaluation,
} from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Bot,
  User,
  Layers,
  Award,
  BarChart3,
  Flame,
  FileText,
  Compass,
} from 'lucide-react';

interface InterviewEvaluationViewProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  evaluations: InterviewAnswerEvaluation[];
  candidateName?: string;
  initialQuestionIndex?: number;
  onBackToSummary?: () => void;
  onRestartInterview: () => void;
  onBackToDashboard: () => void;
  usedFallback?: boolean;
}

export const InterviewEvaluationView: React.FC<InterviewEvaluationViewProps> = ({
  config,
  questions,
  responses,
  evaluations,
  candidateName = 'Candidate',
  initialQuestionIndex = 0,
  onBackToSummary,
  onRestartInterview,
  onBackToDashboard,
  usedFallback = false,
}) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(initialQuestionIndex);


  const totalQuestions = questions.length;
  const currentEval = evaluations[selectedQuestionIndex] || evaluations[0];
  const currentQuestion = questions[selectedQuestionIndex] || questions[0];
  const currentResponse =
    responses.find((r) => r.questionId === currentQuestion?.id || r.questionNumber === selectedQuestionIndex + 1) ||
    responses[selectedQuestionIndex];

  // Helper for score badge styling
  const getScoreBadge = (score: number) => {
    if (score >= 9) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        bar: 'bg-emerald-500',
        label: 'Excellent',
        icon: Flame,
      };
    }
    if (score >= 7) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        bar: 'bg-blue-600',
        label: 'Good / Strong',
        icon: Award,
      };
    }
    if (score >= 5) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        bar: 'bg-amber-500',
        label: 'Partially Satisfactory',
        icon: BarChart3,
      };
    }
    if (score >= 3) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        bar: 'bg-orange-500',
        label: 'Needs Improvement',
        icon: AlertTriangle,
      };
    }
    return {
      bg: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
      bar: 'bg-red-500',
      label: 'Very Weak / Incomplete',
      icon: AlertTriangle,
    };
  };

  const scoreBadge = getScoreBadge(currentEval?.overallScore ?? 0);
  const isBackground = currentQuestion?.category === 'Background';
  const isBehavioral =
    currentQuestion?.category === 'Behavioral' || currentQuestion?.category === 'Situational';
  const isTechnical = !isBackground && !isBehavioral;

  const criterion2Label = isTechnical
    ? 'Technical Accuracy'
    : isBackground
    ? 'Career Motivation & Role Fit'
    : 'Problem Solving & Substance';


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Feature 4 • AI Answer Evaluation
              </span>
              {usedFallback && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  Intelligent Evaluator Active
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Interview Evaluation Scorecard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Evaluated responses for <span className="font-bold text-slate-800 dark:text-slate-200">{config.targetRole}</span> •{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{config.interviewLevel}</span> •{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{config.interviewType}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-start flex-wrap">
            {onBackToSummary && (
              <button
                type="button"
                id="eval-back-to-summary-header-btn"
                onClick={onBackToSummary}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Final Summary</span>
              </button>
            )}
            <button
              type="button"
              id="eval-practice-again-header-btn"
              onClick={onRestartInterview}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
            <button
              type="button"
              id="eval-back-to-dashboard-header-btn"
              onClick={onBackToDashboard}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Question Navigator Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Question To Inspect ({selectedQuestionIndex + 1} of {totalQuestions})
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Click any question below to see AI scores & feedback
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {questions.map((q, idx) => {
              const qEval = evaluations[idx];
              const score = qEval?.overallScore ?? 0;
              const isSelected = idx === selectedQuestionIndex;
              const pillBadge = getScoreBadge(score);

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  id={`eval-question-tab-${idx + 1}`}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.03]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40'
                  }`}
                >
                  <span className="font-black">Q{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : pillBadge.bg
                    }`}
                  >
                    {score}/10
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Question & Evaluation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Question & Candidate Answer (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Question Box */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Question {selectedQuestionIndex + 1} of {totalQuestions}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {currentQuestion?.category || 'Technical'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentQuestion?.difficulty || config.interviewLevel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {currentQuestion?.question}
              </h3>
              {currentQuestion?.topic && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  <span>Topic: {currentQuestion.topic}</span>
                </p>
              )}
            </div>
          </div>

          {/* Candidate Recorded Answer Box */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Candidate Recorded Answer
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {currentResponse?.answer ? currentResponse.answer.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700 max-h-80 overflow-y-auto">
              {currentResponse?.answer && currentResponse.answer.trim().length > 0 ? (
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {currentResponse.answer}
                </p>
              ) : (
                <p className="text-xs italic text-slate-400 dark:text-slate-500">
                  [No answer recorded or submitted for this question]
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Evaluation & Breakdown (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overall Answer Score Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block">
                  AI Answer Evaluation
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Score & Performance Rubric
                </h3>
              </div>

              {/* Large Score Indicator */}
              <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${scoreBadge.bg}`}>
                <div className="text-center">
                  <span className="text-2xl font-black">{currentEval?.overallScore ?? 0}</span>
                  <span className="text-xs font-bold opacity-75">/10</span>
                </div>
                <div className="border-l border-current/20 pl-3">
                  <span className="text-xs font-bold block">{scoreBadge.label}</span>
                  <span className="text-[10px] opacity-80">Overall Rating</span>
                </div>
              </div>
            </div>

            {/* Criteria Score Bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Criterion-Level Breakdown (0-10 Scale)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Relevance */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Relevance</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {currentEval?.criteria?.relevance ?? 5}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(currentEval?.criteria?.relevance ?? 5) * 10}%` }}
                    />
                  </div>
                </div>

                {/* 2. Technical Accuracy / Role Fit / Problem Solving */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {criterion2Label}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {currentEval?.criteria?.technicalAccuracy ?? 5}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${(currentEval?.criteria?.technicalAccuracy ?? 5) * 10}%` }}
                    />
                  </div>
                </div>

                {/* 3. Clarity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Clarity & Structure</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {currentEval?.criteria?.clarity ?? 5}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(currentEval?.criteria?.clarity ?? 5) * 10}%` }}
                    />
                  </div>
                </div>

                {/* 4. Completeness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Completeness</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {currentEval?.criteria?.completeness ?? 5}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(currentEval?.criteria?.completeness ?? 5) * 10}%` }}
                    />
                  </div>
                </div>

                {/* 5. Communication */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Professional Communication</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {currentEval?.criteria?.communication ?? 5}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${(currentEval?.criteria?.communication ?? 5) * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Behavioral STAR Breakdown (STRICT: only for Behavioral / Situational questions) */}
          {isBehavioral && currentEval?.behavioralEvaluation && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  STAR Method Assessment (Behavioral Analysis)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEval.behavioralEvaluation.situation && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      S • Situation
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {currentEval.behavioralEvaluation.situation}
                    </p>
                  </div>
                )}
                {currentEval.behavioralEvaluation.task && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      T • Task
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {currentEval.behavioralEvaluation.task}
                    </p>
                  </div>
                )}
                {currentEval.behavioralEvaluation.action && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      A • Action
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {currentEval.behavioralEvaluation.action}
                    </p>
                  </div>
                )}
                {currentEval.behavioralEvaluation.result && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      R • Result
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {currentEval.behavioralEvaluation.result}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strengths & Areas to Improve Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl p-5 border border-emerald-200/70 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Key Strengths
                </h4>
              </div>

              <ul className="space-y-2">
                {(currentEval?.strengths || ['Demonstrated relevant focus.']).map((str, sIdx) => (
                  <li
                    key={sIdx}
                    className="text-xs text-emerald-900 dark:text-emerald-300/90 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-5 border border-amber-200/70 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Areas for Improvement
                </h4>
              </div>

              <ul className="space-y-2">
                {(currentEval?.improvements || ['Add concrete examples or technical metrics.']).map(
                  (imp, iIdx) => (
                    <li
                      key={iIdx}
                      className="text-xs text-amber-900 dark:text-amber-300/90 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-amber-500 font-bold mt-0.5">•</span>
                      <span>{imp}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Actionable AI Coaching Feedback Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl p-6 border border-blue-200/80 dark:border-blue-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950 dark:text-blue-200">
                Actionable AI Feedback
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
              {currentEval?.feedback || 'Solid baseline response.'}
            </p>
          </div>

          {/* Navigation Controls between Questions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              id="eval-prev-question-btn"
              disabled={selectedQuestionIndex === 0}
              onClick={() => setSelectedQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Question</span>
            </button>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Q{selectedQuestionIndex + 1} of {totalQuestions}
            </span>

            <button
              type="button"
              id="eval-next-question-btn"
              disabled={selectedQuestionIndex === totalQuestions - 1}
              onClick={() => setSelectedQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
