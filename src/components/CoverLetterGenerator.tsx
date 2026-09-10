import React, { useState } from 'react';
import { CoverLetterTone, CoverLetterResponse } from '../types';
import {
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
  Building2,
  Briefcase,
  FileText,
  Sliders,
  CheckCircle2,
  Wand2,
} from 'lucide-react';

interface CoverLetterGeneratorProps {
  initialResumeText?: string;
  initialTargetRole?: string;
  initialJobDescription?: string;
  initialFileName?: string;
  onBackToAnalyzer: () => void;
}

const TONES: { id: CoverLetterTone; label: string; desc: string }[] = [
  { id: 'Professional', label: '👔 Professional', desc: 'Balanced, standard, and authoritative' },
  { id: 'Confident', label: '🚀 Confident', desc: 'High-impact, achievement-oriented, bold' },
  { id: 'Friendly', label: '🤝 Friendly', desc: 'Approachable, collaborative, warm' },
  { id: 'Formal', label: '📜 Formal', desc: 'Traditional corporate & academic etiquette' },
];

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  initialResumeText = '',
  initialTargetRole = 'Full Stack Software Engineer',
  initialJobDescription = '',
  initialFileName = '',
  onBackToAnalyzer,
}) => {
  const [targetRole, setTargetRole] = useState(initialTargetRole);
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [tone, setTone] = useState<CoverLetterTone>('Professional');

  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const generateFallbackCoverLetter = (
    role: string,
    company: string,
    rText: string,
    letterTone: CoverLetterTone
  ): string => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const lines = rText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const candidateName = lines[0] && lines[0].length < 50 ? lines[0] : 'Applicant';
    const comp = company.trim() || 'your organization';

    let intro = `I am writing to express my enthusiastic interest in the ${role} position at ${comp}.`;
    if (letterTone === 'Confident') {
      intro = `I am excited to submit my application for the ${role} position at ${comp}. With a proven track record of delivering measurable outcomes and engineering resilient solutions, I am confident in my ability to drive immediate value for your team.`;
    } else if (letterTone === 'Friendly') {
      intro = `I was thrilled to see the opening for the ${role} role at ${comp}! Having followed your innovative work, I would love the opportunity to contribute my skills and passion to your mission.`;
    } else if (letterTone === 'Formal') {
      intro = `Please accept this letter and the accompanying resume as formal application for the position of ${role} at ${comp}.`;
    }

    return `${today}

Hiring Team
${comp}

Dear Hiring Manager,

${intro}

Throughout my professional background, I have developed deep expertise in designing scalable architectures, optimizing core workflows, and collaborating across cross-functional teams. My technical foundation and commitment to excellence enable me to rapidly translate business objectives into reliable, high-impact deliverables.

At ${comp}, I am particularly drawn to your focus on innovation and product quality. I welcome the opportunity to leverage my problem-solving abilities, domain expertise, and passion for continuous improvement to support your upcoming milestones and strategic initiatives.

Thank you for your time and consideration. I look forward to the opportunity to discuss how my experience and skill set align with your team's goals.

Sincerely,

${candidateName}
${targetRole}`;
  };

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      setError('Please provide your resume text or upload a resume to generate a personalized cover letter.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRole.trim() || 'Software Engineer',
          companyName: companyName.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          tone,
        }),
      });

      if (response.ok) {
        const data: CoverLetterResponse = await response.json();
        if (data.coverLetter) {
          setGeneratedLetter(data.coverLetter);
          return;
        }
      }

      // Fallback deterministic generator if backend route is unavailable or returns fallback
      const fallback = generateFallbackCoverLetter(
        targetRole.trim() || 'Software Engineer',
        companyName,
        resumeText,
        tone
      );
      setGeneratedLetter(fallback);
    } catch (e) {
      console.warn('Cover letter API unavailable, using local generator:', e);
      const fallback = generateFallbackCoverLetter(
        targetRole.trim() || 'Software Engineer',
        companyName,
        resumeText,
        tone
      );
      setGeneratedLetter(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName ? `${companyName.replace(/\s+/g, '_')}_` : ''}${targetRole.replace(/\s+/g, '_')}_Cover_Letter.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = generatedLetter ? generatedLetter.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToAnalyzer}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Back to Resume Analyzer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                AI Cover Letter Generator
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Craft role-tailored, ATS-friendly cover letters tailored to your resume in seconds
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToAnalyzer}
          className="self-start sm:self-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Back to Analyzer
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Inputs (col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Job & Tone Customization</span>
            </h3>

            {/* Target Role Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>Target Role</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Company Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Target Company (Optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Stripe, Microsoft"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Letter Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      tone === t.id
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description Keywords (Optional)
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key bullet points from the job posting to align keywords..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Resume Text Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Resume Source Text</span>
                </label>
                {initialFileName && (
                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[180px]">
                    {initialFileName}
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Resume text content used to pull relevant achievements..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Tailored Letter...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output & Preview (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col h-full min-h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cover Letter Preview
                </h3>
                {wordCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {wordCount} words
                  </span>
                )}
              </div>

              {generatedLetter && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              )}
            </div>

            {generatedLetter ? (
              <div className="mt-4 flex-1 flex flex-col">
                <textarea
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="w-full flex-1 min-h-[420px] p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No Cover Letter Generated Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Fill in your target role and company details, then click "Generate Cover Letter" to produce a customized letter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
