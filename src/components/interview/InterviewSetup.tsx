import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  GraduationCap,
  Layers,
  Clock,
  MessageSquare,
  Mic,
  AlertCircle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Upload,
  Check,
  HelpCircle,
  FileUp,
} from 'lucide-react';
import {
  InterviewConfig,
  InterviewLevel,
  InterviewType,
  InterviewQuestionCount,
  InterviewDuration,
  InterviewMode,
  ResumeReference,
  SampleResume,
} from '../../types';
import { SAMPLE_RESUMES } from '../../data/sampleResumes';
import { parseFileToText } from '../../utils/pdfParser';

interface InterviewSetupProps {
  currentResume: ResumeReference | null;
  initialRole?: string;
  onStartInterview: (config: InterviewConfig) => void;
  onBackToAnalyzer: () => void;
  onUploadResume?: (resume: ResumeReference) => void;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  currentResume,
  initialRole = '',
  onStartInterview,
  onBackToAnalyzer,
  onUploadResume,
}) => {
  // Setup State
  const [targetRole, setTargetRole] = useState<string>(initialRole || 'Full Stack Developer');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [interviewLevel, setInterviewLevel] = useState<InterviewLevel>('Beginner');
  const [interviewType, setInterviewType] = useState<InterviewType>('Mixed');
  const [questionCount, setQuestionCount] = useState<InterviewQuestionCount>(10);
  const [duration, setDuration] = useState<InterviewDuration>('20 minutes');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('Chat');

  // Validation & UI State
  const [errors, setErrors] = useState<{ targetRole?: string; resume?: string }>({});
  const [showSamplePicker, setShowSamplePicker] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const standardRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Software Engineer',
    'Java Developer',
    'Python Developer',
  ];

  // Sync initialRole if provided
  useEffect(() => {
    if (initialRole && initialRole.trim()) {
      setTargetRole(initialRole.trim());
      if (!standardRoles.includes(initialRole.trim())) {
        setIsCustomRole(true);
        setCustomRoleInput(initialRole.trim());
      }
    }
  }, [initialRole]);

  const handleRoleSelect = (role: string) => {
    setIsCustomRole(false);
    setTargetRole(role);
    setErrors((prev) => ({ ...prev, targetRole: undefined }));
  };

  const handleCustomRoleChange = (val: string) => {
    setIsCustomRole(true);
    setCustomRoleInput(val);
    setTargetRole(val);
    if (val.trim()) {
      setErrors((prev) => ({ ...prev, targetRole: undefined }));
    }
  };

  const handleQuickUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await parseFileToText(file);
      const newResume: ResumeReference = {
        id: `uploaded-${Date.now()}`,
        fileName: file.name,
        fullText: text,
        textSnippet: text.slice(0, 300),
      };
      if (onUploadResume) {
        onUploadResume(newResume);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectSample = (sample: SampleResume) => {
    const newResume: ResumeReference = {
      id: sample.id,
      fileName: sample.fileName,
      fullText: sample.text,
      candidateName: sample.title,
      textSnippet: sample.text.slice(0, 300),
    };
    if (onUploadResume) {
      onUploadResume(newResume);
    }
    setShowSamplePicker(false);
    if (!targetRole || targetRole === 'Full Stack Developer') {
      setTargetRole(sample.role);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { targetRole?: string; resume?: string } = {};

    if (!targetRole || !targetRole.trim()) {
      newErrors.targetRole = 'Please select or enter a target job role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const config: InterviewConfig = {
      resumeId: currentResume?.id || (currentResume ? 'uploaded-resume' : undefined),
      resumeReference: currentResume || undefined,
      targetRole: targetRole.trim(),
      interviewLevel,
      interviewType,
      questionCount,
      duration,
      interviewMode,
      createdAt: new Date().toISOString(),
    };

    onStartInterview(config);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Feature 1: Mock Interview Module</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Mock Interview Setup
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Configure your personalized simulation. Tailored questions will be generated from your resume, skill level, and target job role.
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        {/* 1. RESUME SYNC SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  1. Resume Source
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Using your active resume from the Resume Analyzer to personalize questions
                </p>
              </div>
            </div>
            {currentResume && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resume Loaded</span>
              </span>
            )}
          </div>

          {currentResume ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                  PDF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm sm:max-w-md">
                    {currentResume.fileName || 'Uploaded_Resume.pdf'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentResume.candidateName ? `Candidate: ${currentResume.candidateName} • ` : ''}
                    Synced with Resume Analyzer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label
                  htmlFor="change-resume-input"
                  className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Change</span>
                </label>
                <input
                  id="change-resume-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleQuickUploadFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowSamplePicker(!showSamplePicker)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  Sample Resumes
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
                    No Resume Uploaded Yet
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    For the most accurate mock interview, we recommend loading a resume so the AI can ask experience-specific questions. You can also proceed with general role questions.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                <label
                  htmlFor="interview-upload-file"
                  className={`cursor-pointer px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-colors ${
                    isUploading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Reading Resume...' : 'Upload Resume PDF'}</span>
                </label>
                <input
                  id="interview-upload-file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleQuickUploadFile}
                  className="hidden"
                />

                <button
                  type="button"
                  id="interview-load-sample-btn"
                  onClick={() => setShowSamplePicker(!showSamplePicker)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Use Demo Sample Resume
                </button>

                <button
                  type="button"
                  onClick={onBackToAnalyzer}
                  className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Go to Analyzer
                </button>
              </div>

              {uploadError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 pt-1">
                  ⚠️ {uploadError}
                </p>
              )}
            </div>
          )}

          {/* Sample Resumes Dropdown / Picker Drawer */}
          {showSamplePicker && (
            <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select a Sample Profile
                </p>
                <button
                  type="button"
                  onClick={() => setShowSamplePicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_RESUMES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="text-left p-3 rounded-lg bg-white dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 hover:shadow-xs transition-all text-xs"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {sample.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {sample.role}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. TARGET JOB ROLE (REQUIRED) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Target Job Role
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a role preset or type your custom target title
              </p>
            </div>
          </div>

          {/* Role Preset Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {standardRoles.map((role) => {
              const isSelected = !isCustomRole && targetRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  id={`role-btn-${role.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleRoleSelect(role)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{role}</span>
                </button>
              );
            })}
            <button
              type="button"
              id="role-btn-custom"
              onClick={() => {
                setIsCustomRole(true);
                setTargetRole(customRoleInput);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isCustomRole
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600'
              }`}
            >
              {isCustomRole && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span>✏️ Custom Role</span>
            </button>
          </div>

          {/* Role Input Box */}
          <div className="relative">
            <input
              id="target-job-role-input"
              type="text"
              value={targetRole}
              onChange={(e) => handleCustomRoleChange(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, DevOps Specialist, Machine Learning Engineer..."
              className={`w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                errors.targetRole
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
              }`}
            />
            {errors.targetRole && (
              <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.targetRole}</span>
              </p>
            )}
          </div>
        </section>

        {/* 3. INTERVIEW LEVEL (REQUIRED) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Interview Level
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrate technical depth and question complexity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'Beginner' as InterviewLevel,
                title: 'Beginner',
                badge: 'Entry-Level / 0-2 yrs',
                desc: 'Core fundamentals, syntax, standard problem-solving, and foundational questions.',
              },
              {
                id: 'Intermediate' as InterviewLevel,
                title: 'Intermediate',
                badge: 'Mid-Level / 2-5 yrs',
                desc: 'Real-world scenarios, code patterns, optimization, debugging, and framework internals.',
              },
              {
                id: 'Advanced' as InterviewLevel,
                title: 'Advanced',
                badge: 'Senior & Staff / 5+ yrs',
                desc: 'System architecture, trade-off evaluations, concurrency, and deep edge cases.',
              },
            ].map((lvl) => {
              const isSelected = interviewLevel === lvl.id;
              return (
                <div
                  key={lvl.id}
                  id={`level-card-${lvl.id.toLowerCase()}`}
                  onClick={() => setInterviewLevel(lvl.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {lvl.title}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-2">
                      {lvl.badge}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {lvl.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. INTERVIEW TYPE (REQUIRED) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Interview Type
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify the domain and interview round focus
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'Mixed' as InterviewType,
                title: 'Mixed (Recommended)',
                icon: '⚡',
                desc: 'A comprehensive blend of technical concepts, past experience, and behavioral STAR questions.',
              },
              {
                id: 'Technical' as InterviewType,
                title: 'Technical Round',
                icon: '💻',
                desc: 'Pure technical assessment: coding algorithms, domain tools, architecture, and problem solving.',
              },
              {
                id: 'HR / Behavioral' as InterviewType,
                title: 'HR / Behavioral',
                icon: '🤝',
                desc: 'Culture fit, communication, team leadership, conflict management, and situational questions.',
              },
            ].map((type) => {
              const isSelected = interviewType === type.id;
              return (
                <div
                  key={type.id}
                  id={`type-card-${type.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setInterviewType(type.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{type.icon}</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {type.title}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {type.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5 & 6. QUESTIONS COUNT & DURATION (SIDE BY SIDE ON DESKTOP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 5. NUMBER OF QUESTIONS */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  5. Number of Questions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target question volume for the session
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([5, 10, 15, 20] as InterviewQuestionCount[]).map((count) => {
                const isSelected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    id={`question-count-${count}`}
                    onClick={() => setQuestionCount(count)}
                    className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600'
                    }`}
                  >
                    <span className="block text-base sm:text-lg">{count}</span>
                    <span className="text-[10px] font-normal opacity-90">Questions</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 6. INTERVIEW DURATION */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  6. Interview Duration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Session duration setting (Timer config)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  '10 minutes',
                  '20 minutes',
                  '30 minutes',
                  'No time limit',
                ] as InterviewDuration[]
              ).map((dur) => {
                const isSelected = duration === dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    id={`duration-${dur.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setDuration(dur)}
                    className={`p-3 rounded-xl font-semibold text-xs transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600'
                    }`}
                  >
                    <span>{dur}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* 7. INTERVIEW MODE */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                7. Interview Mode
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose how you want to interact during the mock interview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Chat (Available) */}
            <div
              id="mode-chat-card"
              onClick={() => setInterviewMode('Chat')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                interviewMode === 'Chat'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Chat Mode
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Interactive text chat with realistic AI questions and follow-ups.
                  </p>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                  interviewMode === 'Chat'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {interviewMode === 'Chat' && <Check className="w-2.5 h-2.5" />}
              </div>
            </div>

            {/* Mode 2: Voice (Active in Feature 6) */}
            <div
              id="mode-voice-card"
              onClick={() => setInterviewMode('Voice')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                interviewMode === 'Voice'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    interviewMode === 'Voice'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Voice Mode
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Spoken AI questions (TTS) with real-time speech recognition (STT).
                  </p>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                  interviewMode === 'Voice'
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {interviewMode === 'Voice' && <Check className="w-2.5 h-2.5" />}
              </div>
            </div>
          </div>
        </section>

        {/* START MOCK INTERVIEW CTA BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Config Summary:
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {targetRole || 'No role'} • {interviewLevel} • {interviewType} • {questionCount} Qs
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ready to generate your custom interview configuration
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBackToAnalyzer}
              className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="start-mock-interview-btn"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
