import React from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { InterviewConfig, InterviewQuestion } from '../../types';

interface InterviewChatPlaceholderProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  onBackToPreview: () => void;
  onBackToAnalyzer: () => void;
}

export const InterviewChatPlaceholder: React.FC<InterviewChatPlaceholderProps> = ({
  config,
  questions,
  onBackToPreview,
  onBackToAnalyzer,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-500/15 dark:bg-purple-500/25 blur-3xl pointer-events-none rounded-full" />

        {/* Milestone Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/25 ring-8 ring-indigo-50 dark:ring-indigo-950/30">
          <MessageSquare className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 uppercase tracking-widest border border-purple-200 dark:border-purple-800 mb-3 inline-block">
          Feature 2 Complete
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Interview Session Ready
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          {questions.length} personalized questions for <strong className="text-slate-900 dark:text-white">{config.targetRole}</strong> are loaded and queued. Live conversational chat simulation starts in Feature 3.
        </p>

        {/* Prepared Queue Summary */}
        <div className="mt-8 text-left bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>Session Overview</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{questions.length} Questions Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Role</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{config.targetRole}</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Level & Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{config.interviewLevel} • {config.interviewType}</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Duration</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{config.duration}</span>
            </div>
          </div>
        </div>

        {/* Next Stage Roadmap Notice */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 text-left flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              Up Next: Feature 3 (Live Chat Interview Simulation)
            </h4>
            <p className="text-xs text-indigo-800 dark:text-indigo-300/90 mt-0.5 leading-relaxed">
              In Feature 3, your AI interviewer will ask these questions one by one in an interactive chat interface, listen to your responses, and conduct dynamic follow-up inquiries.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            id="review-questions-btn"
            onClick={onBackToPreview}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Review Generated Questions</span>
          </button>

          <button
            type="button"
            id="placeholder-back-to-analyzer-btn"
            onClick={onBackToAnalyzer}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Resume Analyzer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
