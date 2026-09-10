import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FileUploader } from './components/FileUploader';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './components/Dashboard';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { ResumeHistory } from './components/ResumeHistory';
import { InterviewSetup } from './components/interview/InterviewSetup';
import { QuestionLoadingScreen } from './components/interview/QuestionLoadingScreen';
import { InterviewQuestionsPreview } from './components/interview/InterviewQuestionsPreview';
import { InterviewChatSession } from './components/interview/InterviewChatSession';
import { InterviewVoiceSession } from './components/interview/InterviewVoiceSession';
import { InterviewChatPlaceholder } from './components/interview/InterviewChatPlaceholder';
import { EvaluationLoadingScreen } from './components/interview/EvaluationLoadingScreen';
import { InterviewEvaluationView } from './components/interview/InterviewEvaluationView';
import { InterviewFinalSummaryView } from './components/interview/InterviewFinalSummaryView';
import { InterviewHistoryView } from './components/interview/InterviewHistoryView';
import { computeInterviewFinalSummary } from '../summaryEngine';
import {
  AnalysisResult,
  AppView,
  ResumeHistoryItem,
  InterviewConfig,
  InterviewQuestion,
  ResumeReference,
  CompletedInterviewSession,
  InterviewEvaluationResult,
  InterviewFinalSummary,
  HistoricalInterviewRecord,
} from './types';
import { SAMPLE_RESUMES } from './data/sampleResumes';
import { AlertCircle, RotateCcw } from 'lucide-react';
import {
  saveCompletedInterview,
  getInterviewHistory,
} from './utils/interviewHistory';
import {
  saveResumeAnalysis,
  subscribeResumeHistory,
  deleteResumeAnalysis,
  clearAllResumeAnalyses,
} from './services/resumeDb';
import { subscribeInterviewSessions } from './services/interviewDb';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // App Navigation & Module State
  const [activeView, setActiveView] = useState<AppView | 'cover-letter'>('analyzer');

  // Resume Analyzer & Cover Letter State
  const [currentResumeText, setCurrentResumeText] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Full Stack Software Engineer');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Resume History stored in localStorage (up to 10 latest items)
  const [history, setHistory] = useState<ResumeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('resume_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 10);
        }
      }
    } catch (e) {
      console.error('Failed to load resume history from localStorage', e);
    }
    return [];
  });

  // Synced Resume & Mock Interview State
  const [currentResume, setCurrentResume] = useState<ResumeReference | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);

  // Feature 2: Question Generation State
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Feature 3: Completed Session State
  const [completedSession, setCompletedSession] = useState<CompletedInterviewSession | null>(null);

  // Feature 4: Evaluation State
  const [evaluationResult, setEvaluationResult] = useState<InterviewEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Feature 5: Final Summary State
  const [finalSummary, setFinalSummary] = useState<InterviewFinalSummary | null>(null);
  const [selectedEvalIndex, setSelectedEvalIndex] = useState<number>(0);

  // Feature 7: Interview History State
  const [historyCount, setHistoryCount] = useState<number>(() => getInterviewHistory().length);
  const [returnViewAfterSummary, setReturnViewAfterSummary] = useState<AppView>('analyzer');

  // Listen to Firestore real-time updates and local broadcast updates
  useEffect(() => {
    // 1. Subscribe to Cloud Firestore Resume History
    const unsubscribeResumes = subscribeResumeHistory((items) => {
      setHistory(items);
    });

    // 2. Subscribe to Cloud Firestore Interview Sessions
    const unsubscribeInterviews = subscribeInterviewSessions((records) => {
      setHistoryCount(records.length);
    });

    const handleHistoryUpdate = () => {
      setHistoryCount(getInterviewHistory().length);
    };
    window.addEventListener('interview-history-updated', handleHistoryUpdate);

    return () => {
      unsubscribeResumes();
      unsubscribeInterviews();
      window.removeEventListener('interview-history-updated', handleHistoryUpdate);
    };
  }, []);

  // Apply dark class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleAnalyzeResume = async (resumeText: string, fileName?: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentResumeText(resumeText);
    if (fileName) setCurrentFileName(fileName);

    const resumeRef: ResumeReference = {
      id: `resume-${Date.now()}`,
      fileName: fileName || 'Uploaded_Resume.pdf',
      fullText: resumeText,
      textSnippet: resumeText.slice(0, 300),
      hasAnalysis: false,
    };
    setCurrentResume(resumeRef);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRole.trim() || 'General Tech & Professional Role',
          jobDescription,
          fileName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error while analyzing resume.');
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);

      // Save to Cloud Firestore & LocalStorage (real-time stream will sync UI)
      const newItem: ResumeHistoryItem = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileName:
          fileName?.trim() ||
          (data.candidateName && data.candidateName !== 'Professional Candidate'
            ? `${data.candidateName.replace(/\s+/g, '_')}_Resume.pdf`
            : 'Uploaded_Resume.pdf'),
        date:
          data.analyzedAt ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        atsScore: data.atsScore,
        result: data,
      };

      // Persist to Cloud Firestore
      await saveResumeAnalysis(newItem);

      // Update resume reference with parsed candidate name
      setCurrentResume((prev) =>
        prev
          ? {
            ...prev,
            candidateName: data.candidateName,
            hasAnalysis: true,
          }
          : {
            id: `resume-${Date.now()}`,
            fileName: fileName || 'Uploaded_Resume.pdf',
            candidateName: data.candidateName,
            fullText: resumeText,
            hasAnalysis: true,
          }
      );
    } catch (err: unknown) {
      console.error('Error analyzing resume:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during resume analysis. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_RESUMES.find((s) => s.id === sampleId);
    if (sample) {
      setTargetRole(sample.role);
      setCurrentResumeText(sample.text);
      setCurrentFileName(sample.fileName);
      handleAnalyzeResume(sample.text, sample.fileName);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setActiveView('analyzer');
  };

  const handleViewAnalysis = (item: ResumeHistoryItem) => {
    if (item.result) {
      if (item.result.targetRole) {
        setTargetRole(item.result.targetRole);
      }
      setAnalysisResult(item.result);
      setError(null);
    }
  };

  const handleScrollToHistory = () => {
    if (analysisResult) {
      setAnalysisResult(null);
    }
    setTimeout(() => {
      const el = document.getElementById('resume-history-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // FEATURE 2: Question Generation Handler
  const handleStartInterview = async (config: InterviewConfig) => {
    setInterviewConfig(config);
    setIsGeneratingQuestions(true);
    setGenerationError(null);
    setCompletedSession(null);
    setActiveView('interview-generating');

    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewConfig: config,
          resumeText: currentResume?.fullText || '',
          candidateName: currentResume?.candidateName || analysisResult?.candidateName || '',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error while generating interview questions.');
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('AI returned an empty set of questions. Please try again.');
      }

      setGeneratedQuestions(data.questions);
      setActiveView('interview-preview');
    } catch (err: unknown) {
      console.error('Error generating questions:', err);
      setGenerationError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating interview questions. Please try again.'
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleUploadResumeFromSetup = (resume: ResumeReference) => {
    setCurrentResume(resume);
  };

  // FEATURE 4: Answer Evaluation Handler
  const handleEvaluateSession = async (session: CompletedInterviewSession) => {
    setCompletedSession(session);
    setIsEvaluating(true);
    setEvaluationError(null);
    setActiveView('interview-evaluating');

    try {
      const response = await fetch('/api/evaluate-interview-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: session.config,
          questions: session.questions,
          responses: session.responses,
          resumeText: currentResume?.fullText || '',
          candidateName: currentResume?.candidateName || analysisResult?.candidateName || '',
          sessionId: session.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error while evaluating interview answers.');
      }

      const data: InterviewEvaluationResult = await response.json();
      if (!data.evaluations || !Array.isArray(data.evaluations) || data.evaluations.length === 0) {
        throw new Error('AI returned empty evaluation results. Please try again.');
      }

      setEvaluationResult(data);

      // FEATURE 5: Compute Final Summary Dashboard
      const computedSummary = computeInterviewFinalSummary(
        session.config,
        session.questions,
        data.evaluations,
        session.id
      );
      setFinalSummary(computedSummary);

      // FEATURE 7: Auto-Save Completed Session & Evaluation to History
      const candidateName = currentResume?.candidateName || analysisResult?.candidateName || 'Candidate';
      saveCompletedInterview(session, data.evaluations, computedSummary, candidateName);
      setHistoryCount(getInterviewHistory().length);
      setReturnViewAfterSummary('analyzer');

      setActiveView('interview-summary');
    } catch (err: unknown) {
      console.error('Error evaluating interview answers:', err);

      setEvaluationError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while evaluating your interview answers. Please try again.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOpenHistoricalSession = (record: HistoricalInterviewRecord) => {
    setInterviewConfig(record.session.config);
    setCompletedSession(record.session);
    setEvaluationResult({
      config: record.session.config,
      evaluations: record.evaluations,
      evaluatedAt: record.completedAt,
    });
    setFinalSummary(record.finalSummary);
    setReturnViewAfterSummary('interview-history');
    setActiveView('interview-summary');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onReset={handleReset}
        hasAnalysis={!!analysisResult}
        onLoadSample={handleLoadSample}
        activeView={activeView as any}
        onNavigate={(view) => setActiveView(view)}
        onNavigateView={(view) => setActiveView(view)}
        resumeHistoryCount={history.length}
        historyCount={historyCount}
        onScrollToHistory={handleScrollToHistory}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW: COVER LETTER GENERATOR */}
        {activeView === 'cover-letter' && (
          <CoverLetterGenerator
            initialResumeText={currentResumeText || currentResume?.fullText || ''}
            initialTargetRole={analysisResult?.targetRole || targetRole}
            initialJobDescription={jobDescription}
            initialFileName={currentFileName || currentResume?.fileName || ''}
            onBackToAnalyzer={() => setActiveView('analyzer')}
          />
        )}

        {/* VIEW 1: RESUME ANALYZER */}
        {activeView === 'analyzer' && (
          <>
            {!analysisResult && !isLoading && (
              <div>
                <HeroSection
                  targetRole={targetRole}
                  onTargetRoleChange={setTargetRole}
                  jobDescription={jobDescription}
                  onJobDescriptionChange={setJobDescription}
                />

                <FileUploader
                  onAnalyze={handleAnalyzeResume}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            )}

            {isLoading && <LoadingScreen targetRole={targetRole} />}

            {analysisResult && !isLoading && (
              <Dashboard
                result={analysisResult}
                onReset={handleReset}
                onWriteCoverLetter={() => setActiveView('cover-letter')}
                onStartInterview={() => setActiveView('interview-setup')}
              />
            )}

            {!analysisResult && !isLoading && (
              <ResumeHistory
                history={history}
                onViewAnalysis={handleViewAnalysis}
                onClearHistory={() => clearAllResumeAnalyses()}
                onDeleteItem={(id) => deleteResumeAnalysis(id)}
              />
            )}
          </>
        )}

        {/* VIEW 2: MOCK INTERVIEW SETUP (FEATURE 1) */}
        {activeView === 'interview-setup' && (
          <InterviewSetup
            currentResume={currentResume}
            initialRole={analysisResult?.targetRole || targetRole}
            onStartInterview={handleStartInterview}
            onBackToAnalyzer={() => setActiveView('analyzer')}
            onUploadResume={handleUploadResumeFromSetup}
          />
        )}

        {/* VIEW 3: GENERATING QUESTIONS LOADING (FEATURE 2) */}
        {activeView === 'interview-generating' && interviewConfig && (
          <>
            {generationError ? (
              <div className="max-w-xl mx-auto my-16 px-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-red-200 dark:border-red-900/60 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Question Generation Failed
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {generationError}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('interview-setup')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Back to Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartInterview(interviewConfig)}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <QuestionLoadingScreen config={interviewConfig} />
            )}
          </>
        )}

        {/* VIEW 4: QUESTION PREVIEW (FEATURE 2) */}
        {activeView === 'interview-preview' && interviewConfig && (
          <InterviewQuestionsPreview
            config={interviewConfig}
            questions={generatedQuestions}
            onContinueToInterview={() => {
              if (interviewConfig.interviewMode === 'Voice') {
                setActiveView('interview-voice');
              } else {
                setActiveView('interview-chat');
              }
            }}
            onRegenerate={() => handleStartInterview(interviewConfig)}
            onEditSetup={() => setActiveView('interview-setup')}
            isRegenerating={isGeneratingQuestions}
          />
        )}

        {/* VIEW 5A: CHAT INTERVIEW SESSION (FEATURE 3) */}
        {activeView === 'interview-chat' && interviewConfig && (
          <InterviewChatSession
            config={interviewConfig}
            questions={generatedQuestions}
            candidateName={currentResume?.candidateName || analysisResult?.candidateName || 'Candidate'}
            onFinishInterview={(session) => {
              setCompletedSession(session);
            }}
            onViewResults={(session) => {
              handleEvaluateSession(session);
            }}
            onExitInterview={() => setActiveView('analyzer')}
            onRestartInterview={() => {
              setCompletedSession(null);
              setEvaluationResult(null);
              setActiveView('interview-setup');
            }}
          />
        )}

        {/* VIEW 5B: VOICE INTERVIEW SESSION (FEATURE 6) */}
        {activeView === 'interview-voice' && interviewConfig && (
          <InterviewVoiceSession
            config={interviewConfig}
            questions={generatedQuestions}
            candidateName={currentResume?.candidateName || analysisResult?.candidateName || 'Candidate'}
            onFinishInterview={(session) => {
              setCompletedSession(session);
            }}
            onViewResults={(session) => {
              handleEvaluateSession(session);
            }}
            onExitInterview={() => setActiveView('analyzer')}
            onRestartInterview={() => {
              setCompletedSession(null);
              setEvaluationResult(null);
              setActiveView('interview-setup');
            }}
          />
        )}

        {/* VIEW 6: CHAT PLACEHOLDER (FEATURE ROADMAP TARGET) */}
        {activeView === 'interview-chat-placeholder' && interviewConfig && (
          <InterviewChatPlaceholder
            config={interviewConfig}
            questions={generatedQuestions}
            onBackToPreview={() => setActiveView('interview-preview')}
            onBackToAnalyzer={() => setActiveView('analyzer')}
          />
        )}

        {/* VIEW 7: EVALUATING LOADING & ERROR SCREEN (FEATURE 4) */}
        {activeView === 'interview-evaluating' && interviewConfig && (
          <>
            {evaluationError ? (
              <div className="max-w-xl mx-auto my-16 px-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-red-200 dark:border-red-900/60 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Evaluation Failed
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {evaluationError}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView(interviewConfig.interviewMode === 'Voice' ? 'interview-voice' : 'interview-chat')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Back to Interview
                    </button>
                    {completedSession && (
                      <button
                        type="button"
                        onClick={() => handleEvaluateSession(completedSession)}
                        className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Evaluation</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EvaluationLoadingScreen
                config={interviewConfig}
                totalQuestions={completedSession?.questions?.length || generatedQuestions.length || 5}
              />
            )}
          </>
        )}

        {/* VIEW 8: FINAL INTERVIEW SUMMARY & SCORE (FEATURE 5) */}
        {activeView === 'interview-summary' && finalSummary && (
          <InterviewFinalSummaryView
            summary={finalSummary}
            questions={completedSession?.questions || generatedQuestions}
            evaluations={evaluationResult?.evaluations || []}
            candidateName={currentResume?.candidateName || analysisResult?.candidateName || 'Candidate'}
            onReviewDetailedEvaluation={(initialIndex?: number) => {
              if (initialIndex !== undefined) {
                setSelectedEvalIndex(initialIndex);
              }
              setActiveView('interview-evaluation');
            }}
            onRestartInterview={() => {
              setCompletedSession(null);
              setEvaluationResult(null);
              setFinalSummary(null);
              setActiveView('interview-setup');
            }}
            onBackToDashboard={() => setActiveView(returnViewAfterSummary)}
            onViewHistory={() => setActiveView('interview-history')}
          />
        )}

        {/* VIEW 9: INTERVIEW EVALUATION SCORECARD (FEATURE 4) */}
        {activeView === 'interview-evaluation' && (
          <InterviewEvaluationView
            config={evaluationResult?.config || completedSession?.config || interviewConfig!}
            questions={completedSession?.questions || generatedQuestions}
            responses={completedSession?.responses || []}
            evaluations={evaluationResult?.evaluations || []}
            candidateName={currentResume?.candidateName || analysisResult?.candidateName || 'Candidate'}
            initialQuestionIndex={selectedEvalIndex}
            onBackToSummary={() => {
              if (finalSummary) {
                setActiveView('interview-summary');
              } else {
                setActiveView('analyzer');
              }
            }}
            onRestartInterview={() => {
              setCompletedSession(null);
              setEvaluationResult(null);
              setFinalSummary(null);
              setActiveView('interview-setup');
            }}
            onBackToDashboard={() => setActiveView('analyzer')}
            usedFallback={evaluationResult?.usedFallback}
          />
        )}

        {/* VIEW 10: INTERVIEW HISTORY & PROGRESS TRACKING (FEATURE 7) */}
        {activeView === 'interview-history' && (
          <InterviewHistoryView
            onOpenSession={handleOpenHistoricalSession}
            onStartNewInterview={() => setActiveView('interview-setup')}
            onBackToDashboard={() => setActiveView('analyzer')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AI Resume Analyzer & Mock Interview. Powered by Google Gemini AI.</p>
          <p className="text-[11px] font-medium text-slate-400">
            ATS Compatibility Screener • AI Career & Interview Prep
          </p>
        </div>
      </footer>
    </div>
  );
}
