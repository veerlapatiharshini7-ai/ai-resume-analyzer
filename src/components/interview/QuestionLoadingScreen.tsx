import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, FileText, CheckCircle2, Layers, Cpu } from 'lucide-react';
import { InterviewConfig } from '../../types';

interface QuestionLoadingScreenProps {
  config: InterviewConfig;
}

export const QuestionLoadingScreen: React.FC<QuestionLoadingScreenProps> = ({ config }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    `Analyzing resume experience & detected skills...`,
    `Synthesizing ${config.targetRole} role requirements...`,
    `Calibrating ${config.interviewLevel}-level ${config.interviewType} prompts...`,
    `Generating ${config.questionCount} personalized interview questions with Gemini AI...`,
    `Formatting criteria & expected evaluation focus...`,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated AI Pulse Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-25 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Bot className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3 border border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span>Gemini AI Question Engine</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Preparing Your Personalized Interview
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          Tailoring <span className="font-bold text-blue-600 dark:text-blue-400">{config.questionCount} {config.interviewType} questions</span> for <span className="font-bold text-slate-800 dark:text-slate-100">{config.targetRole}</span> ({config.interviewLevel} level).
        </p>

        {/* Animated Progress Steps */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 text-left space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 text-xs font-medium transition-all duration-300 ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold scale-[1.01]'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] text-slate-400 dark:text-slate-500">
          Extracting relevant projects, technologies, and career milestones from your resume...
        </p>
      </div>
    </div>
  );
};
