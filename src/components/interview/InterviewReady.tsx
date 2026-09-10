import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  FileText,
  Target,
  GraduationCap,
  Layers,
  HelpCircle,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { InterviewConfig } from '../../types';

interface InterviewReadyProps {
  config: InterviewConfig;
  onEditConfig: () => void;
  onBackToAnalyzer: () => void;
}

export const InterviewReady: React.FC<InterviewReadyProps> = ({
  config,
  onEditConfig,
  onBackToAnalyzer,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm ring-8 ring-emerald-50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Heading */}
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-widest border border-blue-200 dark:border-blue-800 mb-3 inline-block">
          Feature 1 Complete
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Interview Ready
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          Your interview configuration is ready. The AI interview will be started in the next feature.
        </p>

        {/* Configuration Summary Card */}
        <div className="mt-8 text-left bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Saved Interview Configuration</span>
            </h3>
            <button
              type="button"
              id="copy-config-btn"
              onClick={handleCopyConfig}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Target Role */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-500" /> Target Role
              </span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {config.targetRole}
              </span>
            </div>

            {/* Resume Source */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-500" /> Resume Attached
              </span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate block">
                {config.resumeReference?.fileName || config.resumeId || 'General (No Resume)'}
              </span>
            </div>

            {/* Level */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-emerald-500" /> Difficulty Level
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {config.interviewLevel}
              </span>
            </div>

            {/* Type */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-500" /> Interview Type
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {config.interviewType}
              </span>
            </div>

            {/* Questions */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-amber-500" /> Question Volume
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {config.questionCount} Questions
              </span>
            </div>

            {/* Duration */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-500" /> Duration Setting
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {config.duration}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              Mode: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{config.interviewMode}</strong>
            </span>
            <span>Configured: {new Date(config.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Feature 2 Notice Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800 text-left flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
              Next Stage: Feature 2 (AI Question Generation & Chat)
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5 leading-relaxed">
              In the upcoming feature, this stored configuration will be fed into the AI interview engine to generate tailored behavioral & technical questions with real-time response feedback.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            id="edit-config-btn"
            onClick={onEditConfig}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Edit Setup Configuration</span>
          </button>

          <button
            type="button"
            id="back-to-analyzer-btn"
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
