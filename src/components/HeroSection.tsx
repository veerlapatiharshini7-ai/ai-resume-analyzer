import React from 'react';
import { Sparkles, Target, ShieldCheck, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

interface HeroSectionProps {
  targetRole: string;
  onTargetRoleChange: (role: string) => void;

  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
}


export const HeroSection: React.FC<HeroSectionProps> = ({
  targetRole,
  onTargetRoleChange,
  jobDescription,
  onJobDescriptionChange,
}) => {
  const popularRoles = [
    'Full Stack Software Engineer',
    'Data Scientist',
    'Product Manager',
    'Cybersecurity Analyst',
    'DevOps & Cloud Engineer',
    'UI/UX Designer',
  ];

  return (
    <div className="relative overflow-hidden pt-10 pb-6 text-center">
      {/* Decorative gradient blur elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-blue-400/20 via-indigo-500/20 to-sky-400/20 blur-3xl pointer-events-none rounded-full -z-10" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-5 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
        <span>Next-Gen Gemini AI Resume Screener</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
        AI Resume Analyzer
      </h1>

      {/* Short Description */}
      <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Upload your resume to get instant ATS scores, identify missing skill gaps, correct grammar mistakes, and unlock actionable improvement tips to double your interview callbacks.
      </p>

      {/* Target Job Role Input Selector */}
      <div className="mt-8 max-w-xl mx-auto bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 w-full sm:w-auto text-slate-400">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Target Role:
            </span>
          </div>
          <input
            id="target-role-input"
            type="text"
            value={targetRole}
            onChange={(e) => onTargetRoleChange(e.target.value)}
            placeholder="e.g. Senior Software Engineer, Data Analyst..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="mt-4">
  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
    Job Description
  </label>

  <textarea
  value={jobDescription}
  onChange={(e) => onJobDescriptionChange(e.target.value)}
    placeholder="Paste the job description here..."
    rows={6}
    className="w-full px-3 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
          {popularRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onTargetRoleChange(role)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                targetRole === role
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>ATS Compatibility</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Skill Gap Radar</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Grammar Fixes</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Role Matching</span>
        </div>
      </div>
    </div>
  );
};
