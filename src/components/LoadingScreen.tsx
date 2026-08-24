import React, { useEffect, useState } from 'react';
import { Sparkles, FileText, CheckCircle2, Shield, Search } from 'lucide-react';

interface LoadingScreenProps {
  targetRole: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ targetRole }) => {
  const steps = [
    'Extracting resume text & layout metadata...',
    'Scanning technical skills & domain keywords...',
    `Evaluating against ${targetRole || 'industry'} ATS benchmarks...`,
    'Detecting grammar improvements & action verb opportunities...',
    'Generating career roadmap & certification recommendations...',
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700 text-center relative overflow-hidden">
      {/* Radar scanning background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

      {/* Animated Radar Icon */}
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900 animate-ping opacity-25" />
        <div className="absolute inset-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
        Analyzing Your Resume...
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Target Role: <span className="font-semibold text-blue-600 dark:text-blue-400">{targetRole}</span>
      </p>

      {/* Progress Steps Checklist */}
      <div className="mt-8 space-y-3 text-left max-w-md mx-auto bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        {steps.map((stepText, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={stepText}
              className={`flex items-center gap-3 text-xs font-medium transition-all duration-300 ${
                isDone
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isCurrent
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-[1.01]'
                  : 'text-slate-400 dark:text-slate-600 opacity-60'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : isCurrent ? (
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
              )}
              <span>{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
