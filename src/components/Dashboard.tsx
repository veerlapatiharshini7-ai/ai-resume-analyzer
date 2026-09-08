import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { CircularScore } from './CircularScore';
import { downloadReportPDF } from '../utils/exportPdf';
import { computeRecruiterReadiness, RecruiterReadinessResult } from '../utils/recruiterReadiness';
import { RecruiterReadinessView } from './RecruiterReadinessView';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Download,
  Sparkles,
  TrendingUp,
  XCircle,
  FileText,
  Target,
  Zap,
  RotateCcw,
  Layers,
  Wand2,
  Copy,
  Check,
  ShieldAlert,
  FileCheck2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'bento' | 'readiness' | 'skills' | 'grammar' | 'roadmap' | 'jobs'>('bento');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Safe fallback if recruiterReadiness wasn't pre-computed
  const readiness: RecruiterReadinessResult =
    result.recruiterReadiness ||
    computeRecruiterReadiness({
      resumeText: `${result.summary || ''} ${(result.strengths || []).join(' ')} ${(result.weaknesses || []).join(' ')}`,
      candidateName: result.candidateName,
      skillsFound: result.skillsFound,
      missingSkills: result.missingSkills,
      targetRole: result.targetRole,
    });

  const handleExportPDF = async () => {
    setIsExporting(true);
    await downloadReportPDF('analysis-report-container', result.candidateName || 'Candidate');
    setIsExporting(false);
  };

  const handleCopySummary = () => {
    const text = `AI Resume & Recruiter Readiness Report for ${result.candidateName}
Target Role: ${result.targetRole}
ATS Score: ${result.atsScore}/100 (${result.atsCategory})
Recruiter Readiness Score: ${readiness.overallScore}/100 (${readiness.readinessLevel})

SUMMARY:
${result.summary}

TOP STRENGTHS:
${readiness.strengths.map((s) => `• ${s}`).join('\n')}

RECRUITER READINESS CATEGORIES:
${readiness.categories.map((c) => `• ${c.name}: ${c.score}/100 (${c.status}) - Weight ${Math.round(c.weight * 100)}%`).join('\n')}

AREAS TO IMPROVE:
${readiness.areasToImprove.map((a) => `• ${a}`).join('\n')}

RECOMMENDED ACTIONS:
${readiness.recommendations.map((r) => `• ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topMissingSkills = result.missingSkills?.slice(0, 4) || [];
  const topImprovements = result.improvementTips?.slice(0, 3) || [];
  const primaryCert = result.recommendedCertifications?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                {result.candidateName || 'Candidate'}'s Resume Analysis
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 uppercase tracking-wider">
                Audit Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{result.targetRole}</span> • Analyzed {result.analyzedAt || 'Just now'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            id="download-pdf-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-[0.98]"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            id="dashboard-analyze-another-btn"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Navigation Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'bento', label: '🍱 Bento Grid Overview' },
          { id: 'readiness', label: '🎯 Recruiter Readiness' },
          { id: 'skills', label: '🎯 Skill Gap Radar' },
          { id: 'grammar', label: '✍️ Grammar & Tips' },
          { id: 'roadmap', label: '🚀 Career Roadmap' },
          { id: 'jobs', label: '💼 Suitable Roles' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container for Exporting */}
      <div id="analysis-report-container" className="space-y-6">
        {/* TAB 1: BENTO GRID OVERVIEW */}
        {activeTab === 'bento' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* 1. ATS Score Bento Card (col-span-12 md:col-span-4) */}
            <div className="md:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-between text-center shadow-sm">
              <div className="w-full">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                  ATS Score Gauge
                </span>
                <CircularScore score={result.atsScore} category={result.atsCategory} size={170} />
                
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-2">
                  {result.candidateName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {result.targetRole}
                </p>
              </div>

              <div className="mt-6 w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Readability</span>
                    <span>{result.sectionScores?.readability || 90}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${result.sectionScores?.readability || 90}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Keywords Match</span>
                    <span>{result.sectionScores?.keywords || 78}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${result.sectionScores?.keywords || 78}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Experience Impact</span>
                    <span>{result.sectionScores?.experienceImpact || 75}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${result.sectionScores?.experienceImpact || 75}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Executive Summary Bento Card (col-span-12 md:col-span-8) */}
            <div className="md:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive Summary</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    Gemini Audit
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm font-normal">
                  {result.summary}
                </p>
              </div>

              {/* Quick High-Impact Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Detected Skills
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">
                    {result.skillsFound?.reduce((acc, cat) => acc + cat.skills.length, 0) || 12}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Skill Gaps
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {result.missingSkills?.length || 3}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Top Role Match
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {result.suitableJobRoles?.[0]?.matchPercentage || result.atsScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Skill Mapping Bento Tile (col-span-12 md:col-span-4) */}
            <div className="md:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
                  Skill Mapping
                </h3>

                <div className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div>
                    <p className="mb-2 text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Detected Core Skills</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.skillsFound?.slice(0, 2).flatMap((cat) => cat.skills).slice(0, 7).map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Missing Keyword Gaps</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topMissingSkills.map((item) => (
                        <span key={item.skill} className="px-2.5 py-1 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded text-xs font-semibold">
                          {item.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60">
                <p className="mb-2 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  Target Role Fit
                </p>
                <ul className="space-y-1 text-xs">
                  {result.suitableJobRoles?.slice(0, 2).map((role) => (
                    <li key={role.title} className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[170px]">{role.title}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{role.matchPercentage}% Match</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Top Improvements Bento Tile - Dark Accent Blue (col-span-12 md:col-span-4) */}
            <div className="md:col-span-4 bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Top Improvements</span>
                </h3>

                <ul className="space-y-3.5">
                  {topImprovements.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-xs leading-snug">
                      <div className="w-5 h-5 bg-blue-500/80 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                        {idx + 1}
                      </div>
                      <p className="text-blue-50 font-medium">
                        <strong className="text-white">[{item.section}]:</strong> {item.tip}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {primaryCert && (
                <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block">
                    Recommended Certificate
                  </span>
                  <p className="text-xs font-bold mt-0.5 text-white">
                    {primaryCert.name} ({primaryCert.provider})
                  </p>
                </div>
              )}
            </div>

            {/* 5. Recruiter Readiness Score Bento Tile (col-span-12 md:col-span-4) */}
            <div className="md:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-sm border border-slate-700/80">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-blue-400 tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recruiter Readiness</span>
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${readiness.badgeColor.badge} border ${readiness.badgeColor.border}`}>
                    {readiness.readinessLevel}
                  </span>
                </div>

                <div className="my-3.5 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white">
                    {readiness.overallScore}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                  <span className="text-xs font-semibold text-emerald-400 ml-auto">
                    {readiness.readinessLevel}
                  </span>
                </div>

                {/* Top Category Preview Bars */}
                <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
                  {readiness.categories.slice(0, 3).map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                        <span>{cat.name} ({Math.round(cat.weight * 100)}%)</span>
                        <span className="font-mono">{cat.score}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${cat.score >= 75 ? 'bg-emerald-400' : cat.score >= 50 ? 'bg-blue-400' : 'bg-amber-400'}`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  id="bento-view-readiness-btn"
                  onClick={() => setActiveTab('readiness')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Target className="w-4 h-4" />
                  <span>View Recruiter Breakdown</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Generating...' : 'Download Full PDF'}</span>
                </button>
              </div>
            </div>

            {/* 6. Detailed Strengths & Weaknesses Split Tile (col-span-12) */}
            <div className="col-span-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
              <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Detailed Strengths & Growth Areas</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700/60 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Resume Strengths ({result.strengths?.length || 0})</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {result.strengths?.map((strength, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 font-medium">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 bg-red-50/20 dark:bg-red-950/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Areas for Improvement ({result.weaknesses?.length || 0})</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {result.weaknesses?.map((weakness, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 font-medium">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RECRUITER READINESS SCORE */}
        {activeTab === 'readiness' && (
          <RecruiterReadinessView
            readiness={readiness}
            candidateName={result.candidateName}
            targetRole={result.targetRole}
          />
        )}

        {/* TAB 2: SKILLS DEEP DIVE */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Detected Skills & Category Breakdown</span>
              </h3>

              <div className="space-y-4">
                {result.skillsFound?.map((cat) => (
                  <div key={cat.category} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      {cat.category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Missing Skill Gaps for {result.targetRole}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.missingSkills?.map((item) => (
                  <div key={item.skill} className="p-4 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.skill}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.priority === 'High'
                            ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GRAMMAR & TIPS */}
        {activeTab === 'grammar' && (
          <div className="space-y-6">
            {result.grammarSuggestions && result.grammarSuggestions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <span>Grammar & Phrasing Optimizations</span>
                </h3>

                <div className="space-y-3">
                  {result.grammarSuggestions.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-start gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Original: "{item.originalText}"</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Suggested: "{item.suggestion}"</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-6">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Resume Improvement Tips</span>
              </h3>

              <div className="space-y-3">
                {result.improvementTips?.map((tip, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-0.5">
                        Section: {tip.section}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        {tip.tip}
                      </p>
                    </div>
                    <span
                      className={`self-start sm:self-center shrink-0 px-2.5 py-1 rounded text-[10px] font-extrabold ${
                        tip.impact === 'High'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {tip.impact} Impact
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Recommended Industry Certifications</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.recommendedCertifications?.map((cert) => (
                  <div key={cert.name} className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cert.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                        {cert.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {cert.relevance}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Recommended Portfolio Projects</span>
              </h3>

              <div className="space-y-3">
                {result.recommendedProjects?.map((project) => (
                  <div key={project.title} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {project.title}
                      </h4>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                        {project.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.techStack?.map((tech) => (
                        <span key={tech} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUITABLE ROLES */}
        {activeTab === 'jobs' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Suitable Job Roles & Compatibility Index</span>
            </h3>

            <div className="space-y-3">
              {result.suitableJobRoles?.map((job) => (
                <div key={job.title} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {job.keyRequirements}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {job.matchPercentage}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Match
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${job.matchPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

