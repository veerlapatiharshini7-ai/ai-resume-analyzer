import React, { useEffect, useState } from 'react';

export interface ProgressBarProps {
  value: number; // score value
  max?: number; // maximum score (default 100)
  label?: string; // accessible name/label for category or overall score
  status?: string; // e.g. "Strong", "Recruiter Ready", "Needs Improvement", "Early Preparation"
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label = 'Score progress',
  status,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  // 1. Data safety: clamp value between 0 and max, handle NaN / Infinity / undefined
  const safeMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : 100;
  const rawNum = typeof value === 'number' ? value : Number(value);
  const validValue = isNaN(rawNum) || !isFinite(rawNum) ? 0 : rawNum;
  const clampedValue = Math.max(0, Math.min(safeMax, Math.round(validValue)));
  const percentage = Math.round((clampedValue / safeMax) * 100);

  // 2. Animated percentage state for smooth loading transition
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Trigger animation after initial render
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  // 3. Score state colors based on visual design system (0–39, 40–59, 60–79, 80–100)
  const getScoreTheme = (pct: number) => {
    if (pct >= 80) {
      return {
        barBg: 'bg-emerald-500 dark:bg-emerald-400',
        text: 'text-emerald-700 dark:text-emerald-300',
        trackBg: 'bg-emerald-100/60 dark:bg-emerald-950/40',
        statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        defaultStatus: 'Strong',
      };
    }
    if (pct >= 60) {
      return {
        barBg: 'bg-blue-600 dark:bg-blue-500',
        text: 'text-blue-700 dark:text-blue-300',
        trackBg: 'bg-blue-100/60 dark:bg-blue-950/40',
        statusBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        defaultStatus: 'Recruiter Ready',
      };
    }
    if (pct >= 40) {
      return {
        barBg: 'bg-amber-500 dark:bg-amber-400',
        text: 'text-amber-700 dark:text-amber-300',
        trackBg: 'bg-amber-100/60 dark:bg-amber-950/40',
        statusBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        defaultStatus: 'Needs Improvement',
      };
    }
    return {
      barBg: 'bg-red-500 dark:bg-red-400',
      text: 'text-red-700 dark:text-red-300',
      trackBg: 'bg-red-100/60 dark:bg-red-950/40',
      statusBadge: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800/60',
      defaultStatus: 'Early Preparation',
    };
  };

  const theme = getScoreTheme(percentage);
  const displayStatus = status || theme.defaultStatus;

  // Size styling height mapping
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const accessibleLabel = `${label}: ${clampedValue} out of ${safeMax}, ${displayStatus}`;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold gap-2 mb-1">
          <span className="text-slate-700 dark:text-slate-200 truncate">{label}</span>
          <span className={`font-black tabular-nums ${theme.text}`}>
            {clampedValue}&thinsp;<span className="font-semibold text-slate-400">/ {safeMax}</span>
          </span>
        </div>
      )}

      {/* Accessible Progress Bar Track */}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={accessibleLabel}
        className={`w-full bg-slate-100 dark:bg-slate-700 rounded-full ${heightClasses[size]} overflow-hidden relative shadow-inner`}
      >
        <div
          className={`${theme.barBg} ${heightClasses[size]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      {/* Screen-reader accessible hidden status text */}
      <span className="sr-only">{accessibleLabel}</span>
    </div>
  );
};
