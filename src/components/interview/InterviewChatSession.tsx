import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Tag,
  Lightbulb,
  Send,
  HelpCircle,
  FileText,
  Target,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  ShieldCheck,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  CompletedInterviewSession,
} from '../../types';
import { InterviewerAvatar } from './InterviewerAvatar';
import { speakFullText, stopSpeech } from '../../utils/speechHelper';

interface InterviewChatSessionProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  candidateName?: string;
  onFinishInterview?: (session: CompletedInterviewSession) => void;
  onViewResults?: (session: CompletedInterviewSession) => void;
  onExitInterview: () => void;
  onRestartInterview?: () => void;
}

export const InterviewChatSession: React.FC<InterviewChatSessionProps> = ({
  config,
  questions,
  candidateName = 'Candidate',
  onFinishInterview,
  onViewResults,
  onExitInterview,
  onRestartInterview,
}) => {
  // Session Progression State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // UI state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showFocusHint, setShowFocusHint] = useState<boolean>(false);
  const [showResponsesList, setShowResponsesList] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Timer State
  const parseDurationToSeconds = (durationStr: string): number | null => {
    if (!durationStr || durationStr.toLowerCase().includes('no')) return null;
    const match = durationStr.match(/(\d+)\s*min/i);
    if (match && match[1]) {
      return parseInt(match[1], 10) * 60;
    }
    return null;
  };

  const initialDurationSeconds = parseDurationToSeconds(config.duration);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(initialDurationSeconds);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Mount / Unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSpeech();
    };
  }, []);

  // Text-To-Speech: Speak Question aloud from beginning to end
  const speakQuestion = (text: string) => {
    speakFullText(text, {
      onStart: () => {
        if (isMountedRef.current) setIsSpeaking(true);
      },
      onEnd: () => {
        if (isMountedRef.current) setIsSpeaking(false);
      },
      onError: (err) => {
        if (isMountedRef.current) {
          setIsSpeaking(false);
          console.warn('Speech error:', err);
        }
      },
    });
  };

  // Stop Text-To-Speech
  const stopSpeaking = () => {
    stopSpeech();
    if (isMountedRef.current) {
      setIsSpeaking(false);
    }
  };

  // Automatically read question aloud whenever currentIndex changes
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length && !isCompleted) {
      const qText = questions[currentIndex].question;
      const timer = setTimeout(() => {
        if (isMountedRef.current && !isCompleted) {
          speakQuestion(qText);
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentIndex, isCompleted, questions]);

  // Auto-focus textarea when switching questions
  useEffect(() => {
    if (!isCompleted && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, isCompleted]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftSeconds === null || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isCompleted]);

  // Handle timeout safely
  const handleTimeExpired = () => {
    setIsTimeUp(true);
    const nowStr = new Date().toISOString();
    setCompletedAt(nowStr);

    setResponses((prevResponses) => {
      let finalResponses = [...prevResponses];
      const trimmed = currentAnswer.trim();

      // If user typed something for the current question before timeout, save it
      if (trimmed.length > 0 && currentIndex < questions.length) {
        const currQ = questions[currentIndex];
        const alreadyAnswered = finalResponses.some((r) => r.questionId === currQ.id);
        if (!alreadyAnswered) {
          finalResponses.push({
            questionId: currQ.id,
            question: currQ.question,
            answer: trimmed,
            questionNumber: currentIndex + 1,
            submittedAt: nowStr,
            category: currQ.category,
            difficulty: currQ.difficulty,
            topic: currQ.topic,
            expectedFocus: currQ.expectedFocus,
          });
        }
      }

      setIsCompleted(true);

      const session: CompletedInterviewSession = {
        id: `session-${Date.now()}`,
        config,
        questions,
        responses: finalResponses,
        startedAt,
        completedAt: nowStr,
        isTimedOut: true,
      };

      if (onFinishInterview) {
        onFinishInterview(session);
      }

      return finalResponses;
    });
  };

  // Format countdown string MM:SS
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Missing or empty questions guard
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-red-200 dark:border-red-900/60 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Interview Questions Missing
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            No interview questions were provided for this session. Please return to setup and generate questions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onExitInterview}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              Return to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercentage = Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalQuestions) * 100);

  // Submit current answer and move to next question or completion
  const handleSubmitAnswer = () => {
    stopSpeaking();
    const trimmed = currentAnswer.trim();
    if (trimmed.length === 0) {
      setValidationError('Please enter your answer before proceeding to the next question.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    const nowStr = new Date().toISOString();
    const newResponse: InterviewResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: trimmed,
      questionNumber: currentIndex + 1,
      submittedAt: nowStr,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
      topic: currentQuestion.topic,
      expectedFocus: currentQuestion.expectedFocus,
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Short UX animation delay for seamless response saving
    setTimeout(() => {
      if (!isMountedRef.current) return;

      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex((prev) => prev + 1);
        setCurrentAnswer('');
        setShowFocusHint(false);
        setIsSubmitting(false);
      } else {
        // Final question answered! Mark interview complete
        setIsCompleted(true);
        setCompletedAt(nowStr);
        setIsSubmitting(false);

        const session: CompletedInterviewSession = {
          id: `session-${Date.now()}`,
          config,
          questions,
          responses: updatedResponses,
          startedAt,
          completedAt: nowStr,
          isTimedOut: false,
        };

        if (onFinishInterview) {
          onFinishInterview(session);
        }
      }
    }, 250);
  };

  // Keyboard shortcut handler: Ctrl+Enter or Cmd+Enter submits answer
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting) {
        handleSubmitAnswer();
      }
    }
  };

  const getCategoryColor = (category?: string) => {
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

  const getCategoryIcon = (category?: string) => {
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

  // ==========================================
  // COMPLETION VIEW
  // ==========================================
  if (isCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Subtle glow backdrop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 mb-2 inline-block">
            {isTimeUp ? 'Time Completed' : 'Session Completed'}
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Interview Completed!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Your responses have been recorded successfully.
          </p>

          {/* Session Overview Stats */}
          <div className="mt-8 text-left bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Recorded Session Summary</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {responses.length} of {totalQuestions} Answered
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Target Role</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{config.targetRole}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Level & Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{config.interviewLevel} • {config.interviewType}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Questions Answered</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{responses.length} / {totalQuestions}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Interview Mode</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">Text Chat</span>
              </div>
            </div>
          </div>

          {/* Collapsible Recorded Answers Summary */}
          <div className="mt-5 text-left border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
            <button
              type="button"
              id="toggle-responses-list-btn"
              onClick={() => setShowResponsesList((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Review Your {responses.length} Recorded Answers</span>
              </span>
              {showResponsesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showResponsesList && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-700/80 space-y-4 max-h-96 overflow-y-auto">
                {responses.map((resp, idx) => (
                  <div
                    key={resp.questionId || idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        Q{resp.questionNumber}. {resp.category || 'Technical'} ({resp.topic || 'General'})
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {resp.question}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Answer:</span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {resp.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Phase Notice (Feature 4 AI Answer Evaluation) */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800 text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                AI Answer Evaluation Ready
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5 leading-relaxed">
                Click <span className="font-bold">"View Results"</span> to evaluate your responses against technical accuracy, clarity, relevance, completeness, and STAR methodology.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onViewResults && (
              <button
                type="button"
                id="view-results-btn"
                onClick={() => {
                  const finalSession: CompletedInterviewSession = {
                    id: `session-${Date.now()}`,
                    config,
                    questions,
                    responses,
                    startedAt,
                    completedAt: completedAt || new Date().toISOString(),
                  };
                  onViewResults(finalSession);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Results (Feature 4)</span>
              </button>
            )}

            {onRestartInterview && (
              <button
                type="button"
                id="practice-again-btn"
                onClick={onRestartInterview}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Interview</span>
              </button>
            )}

            <button
              type="button"
              id="completion-back-to-analyzer-btn"
              onClick={onExitInterview}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE CHAT INTERVIEW SCREEN
  // ==========================================
  const wordsCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const charsCount = currentAnswer.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Header & Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Role */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Mock Interview Session
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {config.interviewMode} Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{config.targetRole}</span> • {config.interviewLevel}
              </p>
            </div>
          </div>

          {/* Right Controls: Timer + Exit */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
            {timeLeftSeconds !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-colors ${
                  timeLeftSeconds < 120
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Interview countdown timer"
              >
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              type="button"
              id="exit-interview-btn"
              onClick={() => setShowExitModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {progressPercentage}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, (currentIndex / totalQuestions) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question & Answer Interface */}
      <div className="space-y-4">
        {/* 1. AI INTERVIEWER CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* AI Interviewer Avatar Component */}
          <InterviewerAvatar
            isSpeaking={isSpeaking}
            isProcessing={isSubmitting}
            mode="Chat"
            roleTitle={config.targetRole ? `${config.targetRole} Interviewer` : 'AI Hiring Manager'}
            interviewerName="Alex"
            candidateName={candidateName}
          />

          {/* Category & Topic Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getCategoryColor(
                  currentQuestion.category
                )}`}
              >
                <span>{getCategoryIcon(currentQuestion.category)}</span>
                <span>{currentQuestion.category}</span>
              </span>

              {currentQuestion.topic && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{currentQuestion.topic}</span>
                </span>
              )}

              <span className="text-[10px] font-medium text-slate-400">
                Level: {currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {/* Question Text Box with TTS Status & Controls */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isSpeaking
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
                : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50'
            }`}
          >
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              "{currentQuestion.question}"
            </p>

            {/* TTS Audio Controls Bar */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-blue-100/80 dark:border-blue-900/60">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-[bounce_1s_infinite_100ms] h-3" />
                      <span className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                      <span className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-[bounce_1s_infinite_300ms] h-2" />
                      <span className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-[bounce_1s_infinite_400ms] h-4" />
                    </div>
                    <span>AI Interviewer is speaking...</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Question Audio Available</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    type="button"
                    id="stop-tts-btn"
                    onClick={stopSpeaking}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-red-500" />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="replay-question-btn"
                    onClick={() => speakQuestion(currentQuestion.question)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Replay Audio</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Evaluation Focus Hint (Collapsible) */}
          {currentQuestion.expectedFocus && (
            <div className="text-xs">
              <button
                type="button"
                onClick={() => setShowFocusHint((prev) => !prev)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>What is the interviewer looking for?</span>
                {showFocusHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showFocusHint && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed animate-in fade-in duration-150">
                  <strong>Expected Focus:</strong> {currentQuestion.expectedFocus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. CANDIDATE ANSWER CARD ("YOU") */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          {/* Candidate Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  You ({candidateName})
                </h3>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              {wordsCount} words • {charsCount} characters
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="interview-answer-input"
              value={currentAnswer}
              onChange={(e) => {
                setCurrentAnswer(e.target.value);
                if (validationError && e.target.value.trim().length > 0) {
                  setValidationError(null);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              rows={6}
              placeholder="Type your response here... Speak to specific projects, technologies, design decisions, and measurable outcomes. Press Ctrl+Enter to submit."
              className={`w-full p-4 rounded-2xl border text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 transition-all resize-y ${
                validationError
                  ? 'border-red-400 dark:border-red-600 focus:ring-red-400/40'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Ctrl + Enter</kbd> to submit quickly
            </span>

            <button
              type="button"
              id="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Answer...</span>
                </>
              ) : currentIndex + 1 < totalQuestions ? (
                <>
                  <span>Submit & Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Final Answer & Finish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Exit Interview Session?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have answered {responses.length} of {totalQuestions} questions. Are you sure you want to exit?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-exit-btn"
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Continue Interview
              </button>

              <button
                type="button"
                id="confirm-exit-btn"
                onClick={onExitInterview}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
