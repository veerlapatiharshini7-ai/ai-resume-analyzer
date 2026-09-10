import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Radio,
  RefreshCw,
  Edit3,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  CompletedInterviewSession,
} from '../../types';
import { InterviewerAvatar } from './InterviewerAvatar';
import { speakFullText, stopSpeech } from '../../utils/speechHelper';

// Web Speech API interface definitions for TypeScript
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface InterviewVoiceSessionProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  candidateName?: string;
  onFinishInterview?: (session: CompletedInterviewSession) => void;
  onViewResults?: (session: CompletedInterviewSession) => void;
  onExitInterview: () => void;
  onRestartInterview?: () => void;
}

export const InterviewVoiceSession: React.FC<InterviewVoiceSessionProps> = ({
  config,
  questions,
  candidateName = 'Candidate',
  onFinishInterview,
  onViewResults,
  onExitInterview,
  onRestartInterview,
}) => {
  // Navigation & Question State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Voice & Transcript State
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [hasEverSpoken, setHasEverSpoken] = useState<boolean>(false);

  // UI state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showFocusHint, setShowFocusHint] = useState<boolean>(false);
  const [showResponsesList, setShowResponsesList] = useState<boolean>(false);
  const [isSTTSupported, setIsSTTSupported] = useState<boolean>(true);
  const [isTTSSupported, setIsTTSSupported] = useState<boolean>(true);

  // Refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isSubmittingRef = useRef<boolean>(false);

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

  // Check browser speech support on mount
  useEffect(() => {
    isMountedRef.current = true;
    const hasTTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    setIsTTSSupported(hasTTS);
    setIsSTTSupported(hasSTT);

    return () => {
      isMountedRef.current = false;
      stopSpeaking();
      stopListening();
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
      // Short delay for natural transition
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

  // Speech-To-Text: Start Listening
  const startListening = () => {
    stopSpeaking(); // Stop TTS before user starts recording
    setSpeechError(null);
    setValidationError(null);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSTTSupported(false);
      setSpeechError('Speech recognition is not supported in this browser. You can type your answer directly into the transcript box.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setIsListening(true);
          setSpeechError(null);
          setMicPermissionDenied(false);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMountedRef.current) return;
        let interim = '';
        let newFinalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcriptPiece = res[0].transcript;
          if (res.isFinal) {
            newFinalText += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        if (newFinalText.trim().length > 0) {
          setHasEverSpoken(true);
          setCurrentTranscript((prev) => {
            const trimmedPrev = prev.trim();
            const addition = newFinalText.trim();
            if (!trimmedPrev) return addition;
            return `${trimmedPrev} ${addition}`;
          });
        }

        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (!isMountedRef.current) return;
        console.warn('SpeechRecognition error:', event.error);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setSpeechError(
            'Microphone access denied. Please click the camera/mic icon in your browser address bar to allow microphone access, or type your response in the box below.'
          );
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Non-fatal, just a reminder
          setSpeechError('No speech detected. Please speak clearly into your microphone.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('No microphone detected. Please connect a microphone or type your response below.');
          setIsListening(false);
        } else if (event.error === 'network') {
          setSpeechError('Network error connecting to speech recognition service. You can continue typing manually.');
          setIsListening(false);
        } else if (event.error !== 'aborted') {
          setSpeechError(`Speech recognition notice: ${event.error}. You can continue typing manually.`);
        }
      };

      recognition.onend = () => {
        if (isMountedRef.current) {
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.warn('Failed to start SpeechRecognition:', err);
      setIsListening(false);
      setSpeechError(
        'Could not initialize speech recognition. Please type your response directly into the transcript area.'
      );
    }
  };

  // Speech-To-Text: Stop Listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Toggle Microphone
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
    stopSpeaking();
    stopListening();
    setIsTimeUp(true);
    const nowStr = new Date().toISOString();
    setCompletedAt(nowStr);

    setResponses((prevResponses) => {
      const finalResponses = [...prevResponses];
      const trimmed = currentTranscript.trim();

      // If user has spoken or typed an answer for the active question, preserve it
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
            No interview questions were provided for this voice session. Please return to setup and generate questions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onExitInterview}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
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
    if (isSubmittingRef.current) return; // Prevent duplicate submissions

    const trimmed = currentTranscript.trim();
    if (trimmed.length === 0) {
      setValidationError('Please record or type your answer before proceeding to the next question.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    // Stop speaking and recording
    stopSpeaking();
    stopListening();

    setValidationError(null);
    setIsSubmitting(true);
    isSubmittingRef.current = true;

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

    setTimeout(() => {
      if (!isMountedRef.current) return;

      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex((prev) => prev + 1);
        setCurrentTranscript('');
        setInterimTranscript('');
        setShowFocusHint(false);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        setSpeechError(null);
      } else {
        // Final question answered! Mark interview complete
        setIsCompleted(true);
        setCompletedAt(nowStr);
        setIsSubmitting(false);
        isSubmittingRef.current = false;

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
  // COMPLETION VIEW (FEATURE 6 VOICE COMPLETED)
  // ==========================================
  if (isCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Subtle glow backdrop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none rounded-full" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 ring-8 ring-indigo-50 dark:ring-indigo-950/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 mb-2 inline-block">
            {isTimeUp ? 'Voice Interview Finished (Time Expired)' : 'Voice Interview Completed'}
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Voice Interview Completed!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Your spoken responses and transcripts have been recorded successfully.
          </p>

          {/* Session Overview Stats */}
          <div className="mt-8 text-left bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Voice Session Summary</span>
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {responses.length} of {totalQuestions} Transcribed & Saved
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
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Responses Recorded</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{responses.length} / {totalQuestions}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Interview Mode</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" /> Voice Mode
                </span>
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
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Review Your {responses.length} Recorded Spoken Answers</span>
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
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        Q{resp.questionNumber}. {resp.category || 'Technical'} ({resp.topic || 'General'})
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {resp.question}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Spoken Transcript:</span>
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
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                AI Answer Evaluation Ready
              </h4>
              <p className="text-xs text-indigo-800 dark:text-indigo-300/90 mt-0.5 leading-relaxed">
                Click <span className="font-bold">"View Results"</span> to evaluate your voice transcripts with AI for technical accuracy, clarity, completeness, and behavioral STAR framework.
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Results (Feature 4 & 5)</span>
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
  // ACTIVE VOICE INTERVIEW SCREEN
  // ==========================================
  const wordsCount = currentTranscript.trim() ? currentTranscript.trim().split(/\s+/).length : 0;
  const charsCount = currentTranscript.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Header & Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Role */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Voice Mock Interview
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                  <span>Voice Mode</span>
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
                title="Voice interview countdown timer"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              type="button"
              id="exit-interview-btn"
              onClick={() => {
                stopSpeaking();
                stopListening();
                setShowExitModal(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {progressPercentage}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, (currentIndex / totalQuestions) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question & Voice Recording Interface */}
      <div className="space-y-4">
        {/* 1. AI INTERVIEWER QUESTION CARD (TTS) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* AI Interviewer Avatar Component */}
          <InterviewerAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            isProcessing={isSubmitting}
            mode="Voice"
            roleTitle={config.targetRole ? `${config.targetRole} Voice Interviewer` : 'Voice AI Interviewer'}
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

          {/* Question Text Box with TTS Status */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isSpeaking
              ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
              : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
                "{currentQuestion.question}"
              </p>
            </div>

            {/* TTS Audio Controls Bar */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/60">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-[bounce_1s_infinite_100ms] h-3" />
                      <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                      <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-[bounce_1s_infinite_300ms] h-2" />
                      <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms] h-4" />
                    </div>
                    <span>AI Interviewer is speaking...</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Question Ready</span>
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
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Replay Question</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expected Focus Collapsible Hint */}
          {currentQuestion.expectedFocus && (
            <div className="text-xs">
              <button
                type="button"
                onClick={() => setShowFocusHint((prev) => !prev)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Interviewer Evaluation Criteria</span>
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

        {/* 2. CANDIDATE VOICE RECORDING & EDITABLE TRANSCRIPT CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          {/* Candidate Header & Mic Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Your Spoken Answer</span>
                  <span className="text-[10px] font-normal text-slate-400">({candidateName})</span>
                </h3>
              </div>
            </div>

            {/* Microphone Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id={isListening ? 'stop-recording-btn' : 'start-recording-btn'}
                onClick={handleToggleListening}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.98] ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 ring-4 ring-red-500/20 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-white" />
                    <span>{currentTranscript ? 'Continue Speaking' : 'Start Recording Answer'}</span>
                  </>
                )}
              </button>

              {currentTranscript && (
                <button
                  type="button"
                  id="clear-transcript-btn"
                  onClick={() => {
                    setCurrentTranscript('');
                    setInterimTranscript('');
                  }}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition-colors"
                  title="Clear transcript to re-record"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Listening Animated Bar */}
          {isListening && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                <span>Listening... Speak into your microphone</span>
              </div>
              <div className="flex items-center gap-1 h-3">
                <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-2" />
                <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-2" />
                <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-3" />
              </div>
            </div>
          )}

          {/* Live Interim Transcript Bubble */}
          {interimTranscript && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300 italic animate-pulse">
              <strong>Live:</strong> "{interimTranscript}"
            </div>
          )}

          {/* Speech Error / Permission Alert */}
          {speechError && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{speechError}</span>
                {micPermissionDenied && (
                  <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                    💡 You can freely type your complete response in the transcript box below.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Editable Live Transcript Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-indigo-500" />
                <span>Editable Transcript (Auto-filled by speech or type manually)</span>
              </span>
              <span>{wordsCount} words • {charsCount} characters</span>
            </div>

            <textarea
              ref={textareaRef}
              id="voice-transcript-input"
              value={currentTranscript}
              onChange={(e) => {
                setCurrentTranscript(e.target.value);
                if (validationError && e.target.value.trim().length > 0) {
                  setValidationError(null);
                }
              }}
              disabled={isSubmitting}
              rows={5}
              placeholder="Click 'Start Recording Answer' to speak, or type your answer here. You can edit this transcript anytime before pressing Submit..."
              className={`w-full p-4 rounded-2xl border text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/80 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 transition-all resize-y ${
                validationError
                  ? 'border-red-400 dark:border-red-600 focus:ring-red-400/40'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
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

          {/* Bottom Action / Submission Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              {isListening ? '🔴 Recording in progress — speak your answer.' : '💡 Review & edit transcript before submitting.'}
            </span>

            <button
              type="button"
              id="submit-voice-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Voice Response...</span>
                </>
              ) : currentIndex + 1 < totalQuestions ? (
                <>
                  <span>Submit Answer & Next Question</span>
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
                Exit Voice Interview?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have recorded {responses.length} of {totalQuestions} answers. Are you sure you want to exit?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-exit-btn"
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Continue Voice Session
              </button>

              <button
                type="button"
                id="confirm-exit-btn"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  onExitInterview();
                }}
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
