import React, { useEffect, useState } from 'react';

interface CircularScoreProps {
  score: number;
  category: string;
  size?: number;
}

export const CircularScore: React.FC<CircularScoreProps> = ({
  score,
  category,
  size = 180,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Determine gauge color based on score
  const getColor = (s: number) => {
    if (s >= 85) return { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' };
    if (s >= 70) return { stroke: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' };
    if (s >= 50) return { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' };
    return { stroke: '#ef4444', bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300' };
  };

  const theme = getColor(score);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Foreground animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            fill="transparent"
          />
        </svg>

        {/* Score Number Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {animatedScore}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            / 100 ATS Score
          </span>
        </div>
      </div>

      {/* Category Status Badge */}
      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${theme.badge}`}>
        {category}
      </div>
    </div>
  );
};
