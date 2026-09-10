import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Target,
  GraduationCap,
  Layers,
  Clock,
  MessageSquare,
  FileText,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { InterviewConfig, InterviewQuestion } from '../../types';

interface InterviewQuestionsPreviewProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  onContinueToInterview: () => void;
  onRegenerate: () => void;
  onEditSetup: () => void;
  isRegenerating?: boolean;
}

export const InterviewQuestionsPreview: React.FC<InterviewQuestionsPreviewProps> = ({
  config,
  questions,
  onContinueToInterview,
  onRegenerate,
  onEditSetup,
  isRegenerating = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedFocusId, setExpandedFocusId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleCopyQuestions = () => {
    const text = `AI Mock Interview Questions
Role: ${config.targetRole} | Level: ${config.interviewLevel} | Type: ${config.interviewType}
Total Questions: ${questions.length} | Duration: ${config.duration}

${questions
  .map(
    (q, idx) =>
      `${idx + 1}. [${q.category} - ${q.topic || 'General'}] ${q.question}\n   Expected Focus: ${q.expectedFocus || 'Clarity, depth, and practical demonstration'}\n`
  )
  .join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technical':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Behavioral':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Situational':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Background':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical':
        return '💻';
      case 'Behavioral':
        return '🤝';
      case 'Situational':
        return '⚡';
      case 'Background':
        return '👤';
      default:
        return '❓';
    }
  };

  const categories = ['all', ...Array.from(new Set(questions.map((q) => q.category)))];
  const filteredQuestions =
    filterCategory === 'all' ? questions : questions.filter((q) => q.category === filterCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-blue-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Questions Generated</span>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Gemini AI Engine
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Mock Interview Ready
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personalized for <strong className="text-slate-800 dark:text-slate-200">{config.targetRole}</strong> • {config.interviewLevel} Level • {config.interviewType} Focus
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="copy-questions-btn"
              onClick={handleCopyQuestions}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Questions'}</span>
            </button>

            <button
              type="button"
              id="regenerate-questions-btn"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>

            <button
              type="button"
              id="edit-setup-btn"
              onClick={onEditSetup}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Edit Setup
            </button>
          </div>
        </div>

        {/* Configuration Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-500" /> Role
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {config.targetRole}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-emerald-500" /> Level & Type
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {config.interviewLevel} • {config.interviewType}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-500" /> Questions & Time
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {questions.length} Questions • {config.duration}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-500" /> Resume Source
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {config.resumeReference?.fileName || 'Attached Resume'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const count =
              cat === 'all' ? questions.length : questions.filter((q) => q.category === cat).length;
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>
                  {cat === 'all' ? 'All Questions' : `${getCategoryIcon(cat)} ${cat}`}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3.5" id="generated-questions-list">
        {filteredQuestions.map((q, index) => {
          const originalIndex = questions.findIndex((orig) => orig.id === q.id) + 1;
          const isFocusExpanded = expandedFocusId === q.id;

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/90 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Number Badge */}
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                    #{originalIndex}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getCategoryColor(
                          q.category
                        )}`}
                      >
                        <span>{getCategoryIcon(q.category)}</span>
                        <span>{q.category}</span>
                      </span>

                      {q.topic && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{q.topic}</span>
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Difficulty: {q.difficulty}
                      </span>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Expected Focus Collapsible Card */}
                    {q.expectedFocus && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedFocusId(isFocusExpanded ? null : q.id)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Interviewer Evaluation Criteria</span>
                          {isFocusExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {isFocusExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed animate-in fade-in duration-150">
                            <strong>Interviewer Focus:</strong> {q.expectedFocus}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Action Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Ready to practice with AI?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {questions.length} questions tailored to your background and {config.targetRole} role.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onEditSetup}
            className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center"
          >
            Modify Setup
          </button>

          <button
            type="button"
            id="continue-to-interview-btn"
            onClick={onContinueToInterview}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue to Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
