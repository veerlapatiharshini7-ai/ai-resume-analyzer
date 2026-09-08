import React from 'react';
import { RecruiterReadinessResult } from '../utils/recruiterReadiness';
import { CircularScore } from './CircularScore';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Sparkles,
  TrendingUp,
  FileText,
  Target,
  Zap,
  GraduationCap,
  Trophy,
  HelpCircle,
  Info,
  Check,
} from 'lucide-react';

interface RecruiterReadinessViewProps {
  readiness: RecruiterReadinessResult;
  candidateName?: string;
  targetRole?: string;
}

export const RecruiterReadinessView: React.FC<RecruiterReadinessViewProps> = ({
  readiness,
  candidateName = 'Student',
  targetRole = 'General Professional Role',
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'profileResume':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'skills':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'projects':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'education':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'certifications':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'experience':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'achievements':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <Target className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: 'Strong' | 'Moderate' | 'Needs Improvement') => {
    if (status === 'Strong') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          Strong
        </span>
      );
    }
    if (status === 'Moderate') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          Moderate
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
        Needs Improvement
      </span>
    );
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-blue-600';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Prominent Overall Score Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Circular Progress Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
            <CircularScore
              score={readiness.overallScore}
              category={readiness.readinessLevel}
              size={180}
              label="/ 100 Readiness"
            />
          </div>

          {/* Right Column: Score Metadata, Level & Summary */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Overall Recruiter Readiness Score</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${readiness.badgeColor.badge} border ${readiness.badgeColor.border}`}
              >
                {readiness.readinessLevel}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {readiness.overallScore}
                <span className="text-2xl sm:text-3xl font-bold text-slate-400 dark:text-slate-500 ml-1">
                  / 100
                </span>
              </h1>
              <span className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                • {readiness.readinessLevel}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              This score reflects how prepared <strong className="text-slate-900 dark:text-white">{candidateName}</strong> is for technical screening and recruiter interviews targeting <strong className="text-slate-900 dark:text-white">{targetRole}</strong>, calculated deterministically across 7 core dimensions from real resume data.
            </p>

            {/* Quick Dimension Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Categories
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {readiness.categories.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  Strengths
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {readiness.strengths.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                  Areas to Improve
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {readiness.areasToImprove.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">
                  Action Steps
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {readiness.recommendations.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Category Breakdown Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700/60 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Category Breakdown (7 Centralized Categories)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each category is evaluated 0–100 based on verified student data and weighted into your overall score.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            Total Weight: 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readiness.categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                        Weight: {Math.round(cat.weight * 100)}% • Contributes {cat.weightedScore} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {cat.score}
                      <span className="text-xs font-semibold text-slate-400">/100</span>
                    </span>
                    {getStatusBadge(cat.status)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden my-2">
                  <div
                    className={`${getProgressBarColor(cat.score)} h-2 rounded-full transition-all duration-1000`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {cat.summary}
                </p>
              </div>

              {/* Detected Items Chips */}
              {cat.itemsDetected && cat.itemsDetected.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Verified Evidence:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cat.itemsDetected.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Split: Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Strengths Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Your Strengths
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Categories where you are performing strongly (≥ 70/100)
                </p>
              </div>
            </div>

            {readiness.strengths.length > 0 ? (
              <ul className="space-y-3">
                {readiness.strengths.map((str, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                Add more resume details across categories to build your verified strengths profile.
              </p>
            )}
          </div>
        </div>

        {/* Areas to Improve Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Areas to Improve
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted categories that need strengthening (&lt; 70/100)
                </p>
              </div>
            </div>

            {readiness.areasToImprove.length > 0 ? (
              <ul className="space-y-3">
                {readiness.areasToImprove.map((area, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                Outstanding! All 7 readiness categories meet or exceed competitive recruiter thresholds.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personalized Recommendations Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Personalized Recommendations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actionable steps generated based on your current data gaps to accelerate recruiter readiness.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {readiness.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How Is My Score Calculated? Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            How is my score calculated?
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {readiness.explanation.description}
        </p>

        {/* Formula Display */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold mb-4 overflow-x-auto">
          {readiness.explanation.formula}
        </div>

        {/* Weights Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Weight</th>
                <th className="py-2 px-3">Your Score</th>
                <th className="py-2 px-3 text-right">Weighted Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {readiness.categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    {getCategoryIcon(cat.id)}
                    <span className="font-bold">{cat.name}</span>
                  </td>
                  <td className="py-2.5 px-3">{Math.round(cat.weight * 100)}%</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold">{cat.score}</span> / 100
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    +{cat.weightedScore} pts
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white">
                <td className="py-2.5 px-3">Total / Overall Score</td>
                <td className="py-2.5 px-3">100%</td>
                <td className="py-2.5 px-3">—</td>
                <td className="py-2.5 px-3 text-right font-mono text-base font-black text-blue-600 dark:text-blue-400">
                  {readiness.overallScore} / 100
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
