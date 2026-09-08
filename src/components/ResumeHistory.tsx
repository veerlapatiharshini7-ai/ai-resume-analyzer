import React from 'react';
import { History, FileText, Calendar, ArrowRight, Award } from 'lucide-react';
import { ResumeHistoryItem } from '../types';

interface ResumeHistoryProps {
  history: ResumeHistoryItem[];
  onViewAnalysis: (item: ResumeHistoryItem) => void;
}

export const ResumeHistory: React.FC<ResumeHistoryProps> = ({
  history,
  onViewAnalysis,
}) => {
  if (!history || history.length === 0) {
    return null;
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
    }
    if (score >= 70) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60';
    }
    if (score >= 50) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
    }
    return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800/60';
  };

  return (
    <section id="resume-history-section" className="max-w-2xl mx-auto my-6 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Resume History
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Previously analyzed resumes (saved locally)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {history.length} {history.length === 1 ? 'resume' : 'resumes'}
          </span>
        </div>

        {/* History List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors"
            >
              {/* File Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-sm">
                    {item.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score & View Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {/* ATS Score */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreBadgeClass(
                    item.atsScore
                  )}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>ATS: {item.atsScore}/100</span>
                </div>

                {/* View Analysis Action */}
                <button
                  type="button"
                  id={`view-analysis-${item.id}`}
                  onClick={() => onViewAnalysis(item)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
