import React, { useEffect, useState } from 'react';
import { InterviewConfig } from '../../types';
import { Sparkles, Brain, CheckCircle2, ShieldAlert } from 'lucide-react';

interface EvaluationLoadingScreenProps {
  config: InterviewConfig;
  totalQuestions?: number;
}

const EVALUATION_STEPS = [
  {
    title: 'Reading recorded interview answers',
    desc: 'Extracting candidate responses and technical context...',
    icon: Sparkles,
  },
  {
    title: 'Evaluating technical accuracy & depth',
    desc: 'Comparing explanations against industry benchmarks and role requirements...',
    icon: Brain,
  },
  {
    title: 'Analyzing STAR structure & clarity',
    desc: 'Reviewing communication, situational reasoning, and problem-solving...',
    icon: CheckCircle2,
  },
  {
    title: 'Compiling actionable feedback & strengths',
    desc: 'Generating personalized recommendations and per-question scorecards...',
    icon: Sparkles,
  },
];

export const EvaluationLoadingScreen: React.FC<EvaluationLoadingScreenProps> = ({
  config,
  totalQuestions = 5,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < EVALUATION_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 dark:border-slate-700/80 backdrop-blur-sm text-center relative overflow-hidden">
        {/* Glowing backdrop aura */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Central Animated Spinner & Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-blue-500/25 animate-pulse">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-bounce" />
            </div>
          </div>
          {/* Orbiting ring */}
          <div className="absolute inset-0 -m-3 border-2 border-dashed border-blue-500/40 rounded-full animate-spin [animation-duration:10s]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Evaluating Interview Answers...
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          AI is analyzing all <span className="font-semibold text-blue-600 dark:text-blue-400">{totalQuestions} answers</span> for{' '}
          <span className="font-bold text-slate-900 dark:text-white">{config.targetRole}</span> ({config.interviewLevel} Level).
        </p>

        {/* Dynamic Progress Steps */}
        <div className="mt-10 max-w-md mx-auto space-y-3.5 text-left">
          {EVALUATION_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={step.title}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-500 border ${
                  isCurrent
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 shadow-sm scale-[1.02]'
                    : isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40 opacity-80'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-700/30 opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-blue-900 dark:text-blue-200'
                          : isCompleted
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Tag */}
        <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Rubric: Relevance • Technical Depth • Clarity • STAR Structure</span>
        </div>
      </div>
    </div>
  );
};
