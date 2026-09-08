import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  Building2,
  Briefcase,
  Target,
  Wand2,
  ArrowLeft,
  AlertCircle,
  Clock,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CoverLetterTone, CoverLetterResponse } from '../types';

interface CoverLetterGeneratorProps {
  initialResumeText?: string;
  initialTargetRole?: string;
  initialJobDescription?: string;
  initialFileName?: string;
  onBackToAnalyzer?: () => void;
}

const TONES: Array<{ id: CoverLetterTone; label: string; desc: string; emoji: string }> = [
  { id: 'Professional', label: 'Professional', desc: 'Balanced, articulate, and industry-standard', emoji: '💼' },
  { id: 'Confident', label: 'Confident', desc: 'Bold, assertive, and results-focused', emoji: '🚀' },
  { id: 'Friendly', label: 'Friendly', desc: 'Warm, personable, and team-oriented', emoji: '🤝' },
  { id: 'Formal', label: 'Formal', desc: 'Traditional, executive, and highly polished', emoji: '🏛️' },
];

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  initialResumeText = '',
  initialTargetRole = 'Full Stack Software Engineer',
  initialJobDescription = '',
  initialFileName = '',
  onBackToAnalyzer,
}) => {
  const [resumeText, setResumeText] = useState<string>(initialResumeText);
  const [targetRole, setTargetRole] = useState<string>(initialTargetRole);
  const [companyName, setCompanyName] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [selectedTone, setSelectedTone] = useState<CoverLetterTone>('Professional');

  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<CoverLetterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showResumeEditor, setShowResumeEditor] = useState<boolean>(!initialResumeText);

  // Sync props if changed externally
  useEffect(() => {
    if (initialResumeText && !resumeText) {
      setResumeText(initialResumeText);
    }
  }, [initialResumeText]);

  useEffect(() => {
    if (initialTargetRole) setTargetRole(initialTargetRole);
  }, [initialTargetRole]);

  useEffect(() => {
    if (initialJobDescription) setJobDescription(initialJobDescription);
  }, [initialJobDescription]);

  const handleGenerate = async () => {
    if (!resumeText || resumeText.trim().length < 30) {
      setError('Please provide at least 30 characters of resume text to base the cover letter on.');
      setShowResumeEditor(true);
      return;
    }

    if (!targetRole || targetRole.trim().length < 2) {
      setError('Please specify a target job role.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRole.trim(),
          companyName: companyName.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          tone: selectedTone,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Server error while generating cover letter.';
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          if (res.status === 404) {
            errorMsg = 'Backend API endpoint not found (404). Please ensure the backend server is running on port 3000 (npm run dev).';
          } else if (res.status === 502 || res.status === 503) {
            errorMsg = 'Backend server unavailable. Please make sure the backend is running on port 3000.';
          } else {
            errorMsg = `Server returned status ${res.status}. Please check backend logs.`;
          }
        }
        throw new Error(errorMsg);
      }

      const data: CoverLetterResponse = await res.json();
      setGeneratedLetter(data.coverLetter || '');
      setLastResponse(data);
    } catch (err: unknown) {
      console.error('Error generating cover letter:', err);
      let message = 'An unexpected error occurred while generating the cover letter. Please try again.';
      if (err instanceof Error) {
        if (
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('Load failed')
        ) {
          message = 'Cannot connect to the backend server. Please verify the server is running on port 3000 (run "npm run dev").';
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const candidateName = lastResponse?.candidateName || 'Candidate';
    const roleSlug = targetRole.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_${roleSlug}_Cover_Letter.txt`;

    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const wordCount = generatedLetter ? generatedLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = generatedLetter ? generatedLetter.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                AI Cover Letter Generator
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider">
                Tailored & Truthful
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalized cover letters grounded directly in your resume and target job requirements.
            </p>
          </div>
        </div>

        {onBackToAnalyzer && (
          <button
            type="button"
            id="back-to-analyzer-btn"
            onClick={onBackToAnalyzer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors self-start md:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Analyzer</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input Configuration Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>Letter Customization</span>
            </h3>

            {/* Target Job Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Target Job Role *</span>
              </label>
              <input
                type="text"
                id="cover-letter-role-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, Product Manager"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
              />
            </div>

            {/* Company Name (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Company Name (Optional)</span>
              </label>
              <input
                type="text"
                id="cover-letter-company-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Google, Acme Corp"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tone of Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    id={`tone-btn-${t.id.toLowerCase()}`}
                    onClick={() => setSelectedTone(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      selectedTone === t.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </span>
                      {selectedTone === t.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description (Optional but recommended) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Job Description (Recommended)</span>
              </label>
              <textarea
                id="cover-letter-jd-input"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description or requirements here to tailor the letter's talking points..."
                rows={4}
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans transition-all"
              />
            </div>

            {/* Resume Context / Collapsible Text Area */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Source Resume Data
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResumeEditor((prev) => !prev)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showResumeEditor ? 'Collapse' : resumeText ? 'Edit / View' : 'Add Resume'}</span>
                  {showResumeEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!showResumeEditor && resumeText && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate text-emerald-800 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {initialFileName || 'Resume Loaded'} ({resumeText.length} characters)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Ready
                  </span>
                </div>
              )}

              {showResumeEditor && (
                <div className="space-y-1.5 mt-2">
                  <textarea
                    id="cover-letter-resume-input"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your full resume text here (Summary, Work Experience, Skills, Projects)..."
                    rows={6}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Gemini will extract your real accomplishments without inventing any facts.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Generate CTA */}
            <button
              type="button"
              id="generate-cover-letter-btn"
              onClick={handleGenerate}
              disabled={isLoading || !resumeText || resumeText.trim().length < 30}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoading || !resumeText || resumeText.trim().length < 30
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Crafting Your Cover Letter...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Preview & Actions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full min-h-[560px] justify-between">
            {/* Output Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Generated Cover Letter</span>
                    </h3>
                    {lastResponse && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {selectedTone} Tone
                      </span>
                    )}
                    {lastResponse?.usedFallback && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50" title="Generated using deterministic smart templates because GEMINI_API_KEY is unconfigured">
                        Deterministic Fallback Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lastResponse?.candidateName ? `Customized for ${lastResponse.candidateName}` : 'Review, edit, and export your letter below.'}
                  </p>
                </div>

                {generatedLetter && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
                      {wordCount} words
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
                      {charCount} chars
                    </span>
                  </div>
                )}
              </div>

              {/* Body: Loading State / Empty State / Editable Area */}
              <div className="mt-4">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900 animate-ping opacity-25" />
                      <div className="absolute inset-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      <Wand2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                        Synthesizing Qualifications with Gemini AI...
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Aligning your verified achievements with {companyName ? `${companyName}'s` : 'the target'} {targetRole} requirements in a {selectedTone.toLowerCase()} tone.
                      </p>
                    </div>
                  </div>
                ) : generatedLetter ? (
                  <div className="relative">
                    <textarea
                      id="cover-letter-output-textarea"
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      rows={16}
                      className="w-full p-4 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-serif leading-relaxed transition-all resize-y"
                    />
                    <div className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                        Editable
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-8 bg-slate-50/40 dark:bg-slate-900/20">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      Your AI Cover Letter Will Appear Here
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Select your target role and desired tone, then click "Generate Cover Letter" to craft an ATS-optimized letter.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar Footer */}
            {generatedLetter && !isLoading && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Generated {lastResponse?.generatedAt || 'just now'}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    id="cover-letter-regenerate-btn"
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    id="cover-letter-copy-btn"
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>

                  <button
                    type="button"
                    id="cover-letter-download-txt-btn"
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download as TXT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
