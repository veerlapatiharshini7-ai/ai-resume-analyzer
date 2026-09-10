import React from 'react';
import {
  InterviewFinalSummary,
  InterviewQuestion,
  InterviewAnswerEvaluation,
} from '../../types';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  ArrowLeft,
  BarChart3,
  Flame,
  Brain,
  MessageSquare,
  Compass,
  FileText,
  ListChecks,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface InterviewFinalSummaryViewProps {
  summary: InterviewFinalSummary;
  questions: InterviewQuestion[];
  evaluations: InterviewAnswerEvaluation[];
  candidateName?: string;
  onReviewDetailedEvaluation: (initialQuestionIndex?: number) => void;
  onRestartInterview: () => void;
  onBackToDashboard: () => void;
  onViewHistory?: () => void;
}

export const InterviewFinalSummaryView: React.FC<InterviewFinalSummaryViewProps> = ({
  summary,
  questions,
  evaluations,
  candidateName = 'Candidate',
  onReviewDetailedEvaluation,
  onRestartInterview,
  onBackToDashboard,
  onViewHistory,
}) => {
  const { config, overallScore, overallRating, performanceSummary, keyStrengths, areasForImprovement, dimensionScores, questionSummaries } = summary;

  // Rating badge styling
  const getRatingStyle = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
          glow: 'from-emerald-500/20 to-teal-500/20',
          scoreColor: 'text-emerald-600 dark:text-emerald-400',
          icon: Flame,
        };
      case 'Strong':
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800',
          glow: 'from-blue-500/20 to-indigo-500/20',
          scoreColor: 'text-blue-600 dark:text-blue-400',
          icon: Award,
        };
      case 'Good':
        return {
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800',
          glow: 'from-indigo-500/20 to-purple-500/20',
          scoreColor: 'text-indigo-600 dark:text-indigo-400',
          icon: TrendingUp,
        };
      case 'Partially Satisfactory':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800',
          glow: 'from-amber-500/20 to-orange-500/20',
          scoreColor: 'text-amber-600 dark:text-amber-400',
          icon: BarChart3,
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800',
          glow: 'from-rose-500/20 to-red-500/20',
          scoreColor: 'text-rose-600 dark:text-rose-400',
          icon: AlertTriangle,
        };
    }
  };

  const ratingStyle = getRatingStyle(overallRating);
  const RatingIcon = ratingStyle.icon;

  const getScorePill = (score: number) => {
    if (score >= 8.5) return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (score >= 7.0) return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (score >= 5.0) return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    return 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HERO SCORE & SUMMARY BANNER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${ratingStyle.glow} rounded-full blur-3xl pointer-events-none`} />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          {/* Left info */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Feature 5 • Final Interview Results
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                {questions.length} Questions Evaluated
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Mock Interview Scorecard
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Performance report for <span className="font-bold text-slate-900 dark:text-white">{candidateName}</span> applying as a{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{config.targetRole}</span> ({config.interviewLevel} Level • {config.interviewType} Round).
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                id="summary-review-detailed-btn"
                onClick={() => onReviewDetailedEvaluation()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Review Question Evaluations (Feature 4)</span>
              </button>

              <button
                type="button"
                id="summary-practice-again-btn"
                onClick={onRestartInterview}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>

              <button
                type="button"
                id="summary-back-to-dashboard-btn"
                onClick={onBackToDashboard}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Right Large Score Box */}
          <div className="w-full lg:w-auto flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 shadow-sm shrink-0 text-center min-w-[220px]">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Overall Interview Score
            </span>

            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-5xl sm:text-6xl font-black ${ratingStyle.scoreColor}`}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-slate-400 dark:text-slate-500">
                /10
              </span>
            </div>

            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${ratingStyle.bg}`}>
              <RatingIcon className="w-3.5 h-3.5" />
              <span>{overallRating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OVERALL PERFORMANCE SUMMARY CARDS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Performance Summary & Key Observations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Overall Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Overall Assessment
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {performanceSummary.overall}
            </p>
          </div>

          {/* Card 2: Technical Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Technical Mastery & Accuracy
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {performanceSummary.technical}
            </p>
          </div>

          {/* Card 3: Behavioral & Situational */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Problem Solving & STAR Alignment
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {performanceSummary.behavioral}
            </p>
          </div>

          {/* Card 4: Communication Quality */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Communication Quality
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {performanceSummary.communication}
            </p>
          </div>
        </div>
      </div>

      {/* 3. KEY STRENGTHS & AREAS FOR IMPROVEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl p-6 border border-emerald-200/80 dark:border-emerald-900/50 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
              Key Candidate Strengths ({keyStrengths.length})
            </h3>
          </div>

          <ul className="space-y-3">
            {keyStrengths.map((str, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300/95 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200/80 dark:border-amber-900/50 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Priority Areas for Improvement ({areasForImprovement.length})
            </h3>
          </div>

          <ul className="space-y-3">
            {areasForImprovement.map((imp, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-amber-900 dark:text-amber-300/95 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. INTERVIEW DIMENSION INSIGHTS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Interview Dimension Breakdown (0-10 Scale)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Derived from Feature 4 criterion metrics
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {dimensionScores.map((dim, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {dim.dimension}
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getScorePill(dim.score)}`}>
                  {dim.score.toFixed(1)} / 10
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, dim.score * 10))}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {dim.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. QUESTION-BY-QUESTION SCORE BREAKDOWN */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Question Score Breakdown
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Click any question to view detailed evaluation
          </span>
        </div>

        <div className="space-y-3">
          {questionSummaries.map((qSum, idx) => (
            <button
              key={qSum.questionId || idx}
              type="button"
              id={`summary-question-row-${idx + 1}`}
              onClick={() => onReviewDetailedEvaluation(idx)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-left transition-all flex items-center justify-between gap-4 group cursor-pointer"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    Q{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {qSum.category}
                  </span>
                  {qSum.topic && (
                    <span className="text-[10px] text-slate-400 truncate">
                      • {qSum.topic}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {qSum.question}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${getScorePill(qSum.score)}`}>
                  {qSum.score}/10
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. BOTTOM NAVIGATION ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {onViewHistory && (
            <button
              type="button"
              id="summary-view-history-btn"
              onClick={onViewHistory}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>All History</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRestartInterview}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Another</span>
          </button>

          <button
            type="button"
            onClick={() => onReviewDetailedEvaluation()}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Review Evaluations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
