import React from 'react';
import { Volume2, Mic, Sparkles, Activity, Radio, User } from 'lucide-react';

export type InterviewAvatarState = 'idle' | 'speaking' | 'listening' | 'processing';

export interface InterviewerAvatarProps {
  state?: InterviewAvatarState;
  isSpeaking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  mode?: 'Chat' | 'Voice' | string;
  roleTitle?: string;
  interviewerName?: string;
  candidateName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export type InterviewAvatarProps = InterviewerAvatarProps;

/**
 * Friendly, Professional Virtual AI Interviewer Character (SVG-based)
 * Renders an expressive human interviewer character with state-synchronized
 * facial expressions, animated mouth movements during speech, active headset with glowing LED,
 * radar listening waves, and cognitive thinking effects.
 */
export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  state,
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  mode = 'Chat',
  roleTitle = 'AI Hiring Manager',
  interviewerName = 'Alex',
  candidateName,
  size = 'md',
  className = '',
}) => {
  // Resolve actual state based on explicit state prop or boolean flags
  const resolvedState: InterviewAvatarState =
    state ??
    (isProcessing
      ? 'processing'
      : isSpeaking
      ? 'speaking'
      : isListening
      ? 'listening'
      : 'idle');

  // Configuration per state for themes, badges, and contextual captions
  const stateConfig = {
    idle: {
      label: 'Ready / Waiting',
      shortLabel: 'Ready',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      badgeDot: 'bg-emerald-500',
      glowColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      ringColor: 'ring-blue-500/20 dark:ring-blue-400/20',
      description: mode === 'Voice' ? 'Ready to listen to your answer' : 'Waiting for your written response...',
      micLedColor: '#10B981', // emerald
      cardBorder: 'border-slate-200/90 dark:border-slate-700',
    },
    speaking: {
      label: 'AI is Speaking',
      shortLabel: 'Speaking',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      badgeDot: 'bg-blue-500 animate-ping',
      glowColor: 'bg-blue-500/20 dark:bg-blue-500/30',
      ringColor: 'ring-blue-500/40 dark:ring-blue-400/40',
      description: 'Reading the interview question aloud...',
      micLedColor: '#3B82F6', // blue
      cardBorder: 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20',
    },
    listening: {
      label: 'Listening to You',
      shortLabel: 'Listening',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      badgeDot: 'bg-red-500 animate-pulse',
      glowColor: 'bg-emerald-500/20 dark:bg-emerald-500/30',
      ringColor: 'ring-emerald-500/40 dark:ring-emerald-400/40',
      description: 'Listening via microphone — speak clearly...',
      micLedColor: '#EF4444', // red/recording
      cardBorder: 'border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20',
    },
    processing: {
      label: 'Analyzing Response',
      shortLabel: 'Processing',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      badgeDot: 'bg-purple-500 animate-spin',
      glowColor: 'bg-purple-500/20 dark:bg-purple-500/30',
      ringColor: 'ring-purple-500/40 dark:ring-purple-400/40',
      description: 'Recording and analyzing your response...',
      micLedColor: '#A855F7', // purple
      cardBorder: 'border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20',
    },
  }[resolvedState];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`AI Interviewer ${interviewerName}: Currently ${stateConfig.label}`}
      className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900/90 dark:via-slate-800/95 dark:to-indigo-950/40 border ${stateConfig.cardBorder} shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Background ambient glow according to active state */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none blur-xl transition-all duration-500 ${stateConfig.glowColor}`}
        aria-hidden="true"
      />

      {/* Left section: Character Avatar Portrait & Profile Information */}
      <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
        {/* Character Portrait Box */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Animated Halo Rings depending on state */}
          {resolvedState === 'speaking' && (
            <>
              <span className="absolute -inset-2.5 rounded-full bg-blue-500/20 animate-ping duration-1000 pointer-events-none" />
              <span className="absolute -inset-1 rounded-full border-2 border-blue-400/50 animate-pulse pointer-events-none" />
            </>
          )}

          {resolvedState === 'listening' && (
            <>
              <span className="absolute -inset-2.5 rounded-full bg-emerald-500/20 animate-ping duration-1000 pointer-events-none" />
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/60 animate-pulse pointer-events-none" />
            </>
          )}

          {resolvedState === 'processing' && (
            <span className="absolute -inset-2 rounded-full border-2 border-dashed border-purple-500/70 animate-spin duration-3000 pointer-events-none" />
          )}

          {/* Avatar Frame Box with crisp styling */}
          <div
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-100 via-indigo-50 to-slate-100 dark:from-slate-800 dark:via-indigo-950/80 dark:to-slate-900 border-2 transition-all duration-300 flex items-center justify-center relative shadow-md ${
              resolvedState === 'speaking'
                ? 'border-blue-500 dark:border-blue-400 shadow-blue-500/25 ring-4 ring-blue-500/20'
                : resolvedState === 'listening'
                ? 'border-emerald-500 dark:border-emerald-400 shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                : resolvedState === 'processing'
                ? 'border-purple-500 dark:border-purple-400 shadow-purple-500/25 ring-4 ring-purple-500/20'
                : 'border-slate-300 dark:border-slate-600 shadow-slate-900/10 ring-4 ring-slate-200/60 dark:ring-slate-800'
            }`}
          >
            {/* Friendly Virtual Interviewer Character SVG */}
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full transform transition-transform duration-300 hover:scale-105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                {/* Skin Gradients */}
                <linearGradient id="charSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE0D0" />
                  <stop offset="100%" stopColor="#E5A686" />
                </linearGradient>

                {/* Hair Gradients */}
                <linearGradient id="charHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>

                {/* Blazer Suit Gradients */}
                <linearGradient id="charSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* Shirt Gradient */}
                <linearGradient id="charShirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>

                {/* Headset Metallic Gradient */}
                <linearGradient id="charHeadsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748B" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* Background ambient circle inside avatar frame */}
              <circle
                cx="60"
                cy="60"
                r="56"
                fill={
                  resolvedState === 'speaking'
                    ? '#3B82F6'
                    : resolvedState === 'listening'
                    ? '#10B981'
                    : resolvedState === 'processing'
                    ? '#A855F7'
                    : '#6366F1'
                }
                fillOpacity="0.15"
              />

              {/* Character Shoulders & Blazer Suit */}
              <path
                d="M20 115 C 20 92, 34 85, 60 85 C 86 85, 100 92, 100 115 Z"
                fill="url(#charSuitGrad)"
              />

              {/* Shirt Collar / V-Neck */}
              <polygon points="50,85 70,85 60,103" fill="url(#charShirtGrad)" />

              {/* Tie / Inner Lapel accent */}
              <polygon
                points="58,90 62,90 61,106 59,106"
                fill={
                  resolvedState === 'speaking'
                    ? '#3B82F6'
                    : resolvedState === 'listening'
                    ? '#10B981'
                    : resolvedState === 'processing'
                    ? '#8B5CF6'
                    : '#475569'
                }
              />

              {/* Suit Lapel lines */}
              <path d="M43 85 L55 105 L41 115" stroke="#334155" strokeWidth="1.8" />
              <path d="M77 85 L65 105 L79 115" stroke="#334155" strokeWidth="1.8" />

              {/* Neck */}
              <rect x="53" y="70" width="14" height="18" rx="4" fill="url(#charSkinGrad)" />

              {/* Head / Face */}
              <ellipse cx="60" cy="54" rx="24" ry="26" fill="url(#charSkinGrad)" />

              {/* Ears */}
              <circle cx="36" cy="54" r="5.5" fill="#E5A686" />
              <circle cx="84" cy="54" r="5.5" fill="#E5A686" />

              {/* Stylish Professional Haircut */}
              <path
                d="M34 50 C 33 32, 48 24, 60 24 C 72 24, 87 32, 86 50 C 81 40, 70 37, 60 37 C 50 37, 38 40, 34 50 Z"
                fill="url(#charHairGrad)"
              />
              <path
                d="M36 47 C 42 36, 54 33, 67 34 C 79 35, 84 42, 84 50 C 80 43, 72 40, 64 40 C 53 40, 42 43, 36 47 Z"
                fill="#4B5563"
              />

              {/* Eyebrows */}
              <path
                d="M44 44 Q 50 41 55 44"
                stroke="#374151"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              >
                {resolvedState === 'speaking' && (
                  <animate
                    attributeName="d"
                    values="M44 44 Q 50 41 55 44;M44 42 Q 50 38 55 42;M44 44 Q 50 41 55 44"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
              <path
                d="M65 44 Q 70 41 76 44"
                stroke="#374151"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              >
                {resolvedState === 'speaking' && (
                  <animate
                    attributeName="d"
                    values="M65 44 Q 70 41 76 44;M65 42 Q 70 38 76 42;M65 44 Q 70 41 76 44"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                )}
              </path>

              {/* Friendly Eyes with Catchlight */}
              {resolvedState === 'processing' ? (
                // Processing: Smart Thinking Gaze
                <g>
                  <circle cx="50" cy="52" r="3.8" fill="#1F2937" />
                  <circle cx="70" cy="52" r="3.8" fill="#1F2937" />
                  <circle cx="51" cy="51" r="1.5" fill="#A855F7" />
                  <circle cx="71" cy="51" r="1.5" fill="#A855F7" />
                  <circle cx="51.5" cy="50.5" r="0.8" fill="#FFFFFF" />
                  <circle cx="71.5" cy="50.5" r="0.8" fill="#FFFFFF" />
                </g>
              ) : (
                // Open, attentive friendly eyes
                <g>
                  <circle cx="50" cy="52" r="3.8" fill="#1F2937" />
                  <circle cx="70" cy="52" r="3.8" fill="#1F2937" />
                  {/* Eye Highlights */}
                  <circle cx="51.5" cy="50.5" r="1.4" fill="#FFFFFF" />
                  <circle cx="71.5" cy="50.5" r="1.4" fill="#FFFFFF" />
                </g>
              )}

              {/* Nose */}
              <path
                d="M59 54 Q 60 59 62 59"
                stroke="#D97745"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Friendly Mouth Expression */}
              {resolvedState === 'speaking' ? (
                // Speaking: Animated talking mouth with lips, teeth & opening
                <g>
                  {/* Outer lip */}
                  <ellipse cx="60" cy="67" rx="7" ry="5.5" fill="#7F1D1D">
                    <animate
                      attributeName="ry"
                      values="3.5;6;2.5;6.5;3.5"
                      dur="0.45s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="rx"
                      values="6;7.5;5.5;7.5;6"
                      dur="0.45s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                  {/* Dark mouth interior */}
                  <ellipse cx="60" cy="67" rx="5.5" ry="4" fill="#B91C1C">
                    <animate
                      attributeName="ry"
                      values="2.5;4.5;1.5;5;2.5"
                      dur="0.45s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="rx"
                      values="4.5;6;4;6;4.5"
                      dur="0.45s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                  {/* Upper white teeth row */}
                  <rect x="56" y="64" width="8" height="2.5" rx="1" fill="#FFFFFF">
                    <animate
                      attributeName="y"
                      values="64.5;63.5;64.5"
                      dur="0.45s"
                      repeatCount="indefinite"
                    />
                  </rect>
                  {/* Lower lip highlight */}
                  <path
                    d="M54 71 Q 60 74 66 71"
                    stroke="#E5A686"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : resolvedState === 'listening' ? (
                // Listening: Attentive pleasant smile
                <path
                  d="M53 66 Q 60 72 67 66"
                  stroke="#991B1B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : resolvedState === 'processing' ? (
                // Processing: Thoughtful smile
                <path
                  d="M54 67 Q 60 70 66 67"
                  stroke="#991B1B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                // Idle: Warm, friendly smile
                <path
                  d="M52 66 Q 60 73 68 66"
                  stroke="#991B1B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Modern Professional Headset */}
              {/* Headband */}
              <path
                d="M34 52 C 32 28, 88 28, 86 52"
                stroke="url(#charHeadsetGrad)"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Ear Cushions */}
              <rect x="31" y="47" width="5.5" height="14" rx="2.8" fill="url(#charHeadsetGrad)" />
              <rect x="83.5" y="47" width="5.5" height="14" rx="2.8" fill="url(#charHeadsetGrad)" />

              {/* Boom Microphone from right ear towards mouth */}
              <path
                d="M85 58 Q 82 72 67 71"
                stroke="url(#charHeadsetGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Microphone Tip */}
              <rect x="63" y="69" width="5" height="4" rx="2" fill="#1E293B" />

              {/* Glowing LED on microphone tip */}
              <circle
                cx="65"
                cy="71"
                r="1.8"
                fill={stateConfig.micLedColor}
              >
                {resolvedState !== 'idle' && (
                  <animate
                    attributeName="opacity"
                    values="0.4;1;0.4"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>

              {/* Radiating soundwaves from avatar mouth/headset when speaking */}
              {resolvedState === 'speaking' && (
                <g>
                  <path
                    d="M94 56 Q 99 64 94 72"
                    stroke="#3B82F6"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.2;1;0.2"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <path
                    d="M100 50 Q 107 64 100 78"
                    stroke="#60A5FA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.1;0.9;0.1"
                      dur="0.6s"
                      begin="0.15s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              )}
            </svg>

            {/* Bottom Corner Status Indicator Badge */}
            <span
              className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-xs ${stateConfig.badgeDot}`}
              title={`Status: ${stateConfig.shortLabel}`}
            />
          </div>
        </div>

        {/* AI Interviewer Persona Details */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{interviewerName}</span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800/60">
                AI Interviewer
              </span>
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {roleTitle}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {mode} Mode
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5 flex items-center gap-1">
            <span className="line-clamp-1">{stateConfig.description}</span>
          </p>
        </div>
      </div>

      {/* Right section: Animated State Badge & Live Equalizer */}
      <div className="relative z-10 flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        {/* Dynamic Animated Soundwave Equalizer when Speaking or Listening */}
        {(resolvedState === 'speaking' || resolvedState === 'listening') && (
          <div
            className="flex items-center gap-1 h-6 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
            aria-hidden="true"
          >
            <span
              className={`w-1 rounded-full transition-all duration-150 ${
                resolvedState === 'speaking'
                  ? 'bg-blue-600 dark:bg-blue-400 animate-[bounce_0.6s_infinite_100ms] h-3.5'
                  : 'bg-emerald-600 dark:bg-emerald-400 animate-[pulse_0.8s_infinite_100ms] h-2.5'
              }`}
            />
            <span
              className={`w-1 rounded-full transition-all duration-150 ${
                resolvedState === 'speaking'
                  ? 'bg-blue-600 dark:bg-blue-400 animate-[bounce_0.6s_infinite_250ms] h-5'
                  : 'bg-emerald-600 dark:bg-emerald-400 animate-[pulse_0.8s_infinite_200ms] h-4.5'
              }`}
            />
            <span
              className={`w-1 rounded-full transition-all duration-150 ${
                resolvedState === 'speaking'
                  ? 'bg-blue-600 dark:bg-blue-400 animate-[bounce_0.6s_infinite_150ms] h-3'
                  : 'bg-emerald-600 dark:bg-emerald-400 animate-[pulse_0.8s_infinite_300ms] h-3.5'
              }`}
            />
            <span
              className={`w-1 rounded-full transition-all duration-150 ${
                resolvedState === 'speaking'
                  ? 'bg-blue-600 dark:bg-blue-400 animate-[bounce_0.6s_infinite_300ms] h-4.5'
                  : 'bg-emerald-600 dark:bg-emerald-400 animate-[pulse_0.8s_infinite_150ms] h-2.5'
              }`}
            />
          </div>
        )}

        {/* State Pill Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-2xs transition-colors duration-200 ${stateConfig.badgeBg}`}
        >
          {resolvedState === 'speaking' ? (
            <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          ) : resolvedState === 'listening' ? (
            <Mic className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          ) : resolvedState === 'processing' ? (
            <Activity className="w-3.5 h-3.5 text-purple-500 animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
          <span>{stateConfig.shortLabel}</span>
        </div>
      </div>
    </div>
  );
};

// Also export as InterviewAvatar for backward compatibility
export const InterviewAvatar = InterviewerAvatar;
export default InterviewerAvatar;
