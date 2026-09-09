import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FileUploader } from './components/FileUploader';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './components/Dashboard';
import { CoverLetterGenerator } from './components/Cover LetterGenerator';
import { ResumeHistory } from './components/ResumeHistory';
import { AnalysisResult, ResumeHistoryItem } from './types';
import { SAMPLE_RESUMES } from './data/sampleResumes';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [activeView, setActiveView] = useState<'analyzer' | 'cover-letter'>('analyzer');
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

      // Save to Resume History (keep up to 10 latest items)
      const newItem: ResumeHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, 10);
        try {
          localStorage.setItem('resume_history', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save resume history to localStorage', e);
        }
        return updated;
      });
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onReset={handleReset}
        hasAnalysis={!!analysisResult}
        onLoadSample={handleLoadSample}
        activeView={activeView}
        onNavigateView={setActiveView}

        historyCount={history.length}
        onScrollToHistory={handleScrollToHistory}

      />

      {/* Main Content Area */}
      <main className="flex-1">
{/* Cover Letter Generator View */}
{activeView === 'cover-letter' && (
  <CoverLetterGenerator
    initialResumeText={currentResumeText}
    initialTargetRole={targetRole}
    initialJobDescription={jobDescription}
    initialFileName={currentFileName}
    onBackToAnalyzer={() => setActiveView('analyzer')}
  />
)}

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

    {/* Resume History Section */}
    <ResumeHistory
      history={history}
      onViewAnalysis={handleViewAnalysis}
    />
  </div>
)}
        )}

        {/* Resume Analyzer View */}
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
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AI Resume Analyzer. Powered by Google Gemini AI.</p>
          <p className="text-[11px] font-medium text-slate-400">
            ATS Compatibility Screener • Career Guidance
          </p>
        </div>
      </footer>
    </div>
  );
}
