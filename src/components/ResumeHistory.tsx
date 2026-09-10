import React from 'react';
import { ResumeHistoryItem } from '../types';
import { Clock, FileText, ArrowRight, Trash2, X } from 'lucide-react';

interface ResumeHistoryProps {
  history: ResumeHistoryItem[];
  onViewAnalysis: (item: ResumeHistoryItem) => void;
  onClearHistory?: () => void;
  onDeleteItem?: (id: string) => void;
}

export const ResumeHistory: React.FC<ResumeHistoryProps> = ({
  history,
  onViewAnalysis,
  onClearHistory,
  onDeleteItem,
}) => {
  if (!history || history.length === 0) {
    return null;
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
    if (score >= 60) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
    if (score >= 40) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
    return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800';
  };

  return (
    <section id="resume-history-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Resume Audits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly revisit your previously analyzed resumes and audit scores
              </p>
            </div>
          </div>

          {onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-semibold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewAnalysis(item)}
              className="group relative p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.fileName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${getScoreBadgeColor(
                        item.atsScore
                      )}`}
                    >
                      {item.atsScore}/100
                    </span>

                    {onDeleteItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        title="Delete this audit"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.result?.targetRole || 'Software Engineer'}</span>
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>{item.date}</span>
                <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>View Analysis</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
