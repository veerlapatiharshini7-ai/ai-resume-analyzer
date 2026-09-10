import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  MessageSquare,
  Mic,
  Trash2,
  ArrowRight,
  Sparkles,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Plus,
  RefreshCw,
  Target,
  GraduationCap,
  ArrowLeft,
  X,
} from 'lucide-react';
import {
  HistoricalInterviewRecord,
  InterviewProgressStats,
  InterviewMode,
  InterviewLevel,
} from '../../types';
import {
  getInterviewHistory,
  deleteInterviewRecord,
  clearAllInterviewHistory,
  computeProgressStats,
} from '../../utils/interviewHistory';

interface InterviewHistoryViewProps {
  onOpenSession: (record: HistoricalInterviewRecord) => void;
  onStartNewInterview: () => void;
  onBackToDashboard: () => void;
}

export const InterviewHistoryView: React.FC<InterviewHistoryViewProps> = ({
  onOpenSession,
  onStartNewInterview,
  onBackToDashboard,
}) => {
  const [history, setHistory] = useState<HistoricalInterviewRecord[]>([]);
  const [stats, setStats] = useState<InterviewProgressStats | null>(null);
  const [selectedModeFilter, setSelectedModeFilter] = useState<'All' | InterviewMode>('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'All' | InterviewLevel>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sessionToDelete, setSessionToDelete] = useState<HistoricalInterviewRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Load history from localStorage
  const loadHistory = () => {
    const records = getInterviewHistory();
    setHistory(records);
    setStats(computeProgressStats(records));
  };

  useEffect(() => {
    loadHistory();

    const handleStorageUpdate = () => {
      loadHistory();
    };

    window.addEventListener('interview-history-updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('interview-history-updated', handleStorageUpdate);
    };
  }, []);

  const handleDeleteSession = (id: string) => {
    deleteInterviewRecord(id);
    setSessionToDelete(null);
    loadHistory();
  };

  const handleClearAll = () => {
    clearAllInterviewHistory();
    setShowClearConfirm(false);
    loadHistory();
  };

  // Filtered records
  const filteredRecords = history.filter((rec) => {
    if (selectedModeFilter !== 'All' && rec.interviewMode !== selectedModeFilter) {
      return false;
    }
    if (selectedLevelFilter !== 'All' && rec.interviewLevel !== selectedLevelFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRole = rec.targetRole.toLowerCase().includes(q);
      const matchType = rec.interviewType.toLowerCase().includes(q);
      const matchRating = rec.overallRating.toLowerCase().includes(q);
      if (!matchRole && !matchType && !matchRating) {
        return false;
      }
    }
    return true;
  });

  // Score Badge Color Helper
  const getScoreBadgeStyles = (score: number) => {
    if (score >= 9) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (score >= 7) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (score >= 5) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (score >= 3) {
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    }
    return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Strong':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'Good':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
      case 'Partially Satisfactory':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-indigo-500/10 via-blue-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Feature 7: Performance Analytics</span>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {history.length} {history.length === 1 ? 'Interview' : 'Interviews'} Stored
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Interview History & Progress Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Track your score trajectory across past mock interviews, review granular question evaluations, and measure performance gains across technical & behavioral rounds.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="history-start-interview-btn"
              onClick={onStartNewInterview}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Interview</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                id="clear-all-history-btn"
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5"
                title="Clear all stored interview history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS TRACKING DASHBOARD (When at least 1 session exists) */}
      {stats && history.length > 0 && (
        <div className="space-y-6">
          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Total Completed */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {stats.totalCompleted}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">sessions</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-blue-500" /> {stats.chatCount} Chat
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-indigo-500" /> {stats.voiceCount} Voice
                </span>
              </div>
            </div>

            {/* KPI 2: Average Score */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Average Score</span>
                <BarChart3 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {stats.averageScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 10</span>
              </div>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, stats.averageScore * 10)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 3: Best Score */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Best Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {stats.bestScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 10</span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 truncate">
                Top performance record
              </div>
            </div>

            {/* KPI 4: Score Trend */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Progress Trend</span>
                {stats.scoreChange !== null && stats.scoreChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black ${
                  stats.scoreChange === null
                    ? 'text-slate-700 dark:text-slate-300'
                    : stats.scoreChange >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {stats.scoreChange === null
                    ? 'Baseline'
                    : `${stats.scoreChange >= 0 ? '+' : ''}${stats.scoreChange.toFixed(1)}`}
                </span>
                {stats.scoreChange !== null && (
                  <span className="text-xs text-slate-400">pts</span>
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 truncate">
                {stats.totalCompleted > 1
                  ? `Latest: ${stats.latestScore?.toFixed(1)} / 10`
                  : 'Complete more interviews to track gain'}
              </div>
            </div>
          </div>

          {/* Visual Score Progression Timeline & Dimension Averages (Side-by-side) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Trendline Chart (2 Cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Score Evolution Over Time</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chronological performance scores across your completed interview rounds
                  </p>
                </div>
              </div>

              {/* Visual Bars / Points */}
              <div className="pt-4 pb-2">
                <div className="flex items-end gap-2 sm:gap-3 h-40 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                  {stats.scoreTrend.map((pt, idx) => {
                    const heightPercent = Math.max(12, Math.round((pt.score / 10) * 100));
                    return (
                      <div
                        key={pt.id || idx}
                        className="flex-1 min-w-[50px] max-w-[80px] flex flex-col items-center gap-1 group relative cursor-pointer"
                        onClick={() => {
                          const record = history.find((h) => h.id === pt.id);
                          if (record) onOpenSession(record);
                        }}
                      >
                        {/* Score Tooltip on hover */}
                        <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform">
                          {pt.score.toFixed(1)}
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-xl h-28 flex items-end p-1">
                          <div
                            className={`w-full rounded-lg transition-all group-hover:brightness-110 ${
                              pt.score >= 8
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-500'
                                : pt.score >= 6.5
                                ? 'bg-gradient-to-t from-blue-600 to-indigo-500'
                                : pt.score >= 5
                                ? 'bg-gradient-to-t from-amber-600 to-yellow-500'
                                : 'bg-gradient-to-t from-rose-600 to-red-500'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Date & Mode Label */}
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-full">
                          {pt.date}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate max-w-full">
                          {pt.mode === 'Voice' ? '🎙️ Voice' : '💬 Chat'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dimension Mastery Summary (1 Col) */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span>Dimension Mastery</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aggregated competency ratings across all interview rounds
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {stats.dimensionAverages.length > 0 ? (
                  stats.dimensionAverages.map((dim) => (
                    <div key={dim.dimension} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {dim.dimension}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {dim.averageScore.toFixed(1)} / 10
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, dim.averageScore * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Dimension metrics will populate once interview rounds are recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="history-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job role or rating..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* Mode Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            {(['All', 'Chat', 'Voice'] as const).map((m) => (
              <button
                key={m}
                type="button"
                id={`filter-mode-${m.toLowerCase()}`}
                onClick={() => setSelectedModeFilter(m)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedModeFilter === m
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m === 'Voice' ? '🎙️ Voice' : m === 'Chat' ? '💬 Chat' : 'All Modes'}
              </button>
            ))}
          </div>

          {/* Level Filter */}
          <select
            id="history-level-filter"
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* 4. Historical Sessions Cards List */}
      <div className="space-y-3.5" id="history-sessions-list">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => {
            const formattedDate = new Date(record.completedAt || record.savedAt).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = new Date(record.completedAt || record.savedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={record.id}
                id={`history-card-${record.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/90 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-4 group"
              >
                {/* Top Row: Meta info & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Mode Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        record.interviewMode === 'Voice'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        {record.interviewMode === 'Voice' ? (
                          <>
                            <Mic className="w-3 h-3 text-indigo-500" />
                            <span>Voice Interview</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            <span>Chat Interview</span>
                          </>
                        )}
                      </span>

                      {/* Level & Type */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {record.interviewLevel} • {record.interviewType}
                      </span>

                      {/* Question Count */}
                      <span className="text-[10px] font-medium text-slate-400">
                        {record.questionCount} Questions ({record.duration})
                      </span>

                      {/* Date & Time */}
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate} at {formattedTime}</span>
                      </span>
                    </div>

                    {/* Role Title */}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {record.targetRole}
                    </h2>
                  </div>

                  {/* Right Score & Rating */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-xl sm:text-2xl font-black px-2.5 py-0.5 rounded-xl border ${getScoreBadgeStyles(record.overallScore)}`}>
                          {record.overallScore.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 10</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${getRatingBadge(record.overallRating)}`}>
                        {record.overallRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Snippet: Top Strengths & Improvements */}
                {(record.keyStrengths.length > 0 || record.areasForImprovement.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    {record.keyStrengths.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Top Strength:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-1">
                          {record.keyStrengths[0]}
                        </p>
                      </div>
                    )}

                    {record.areasForImprovement.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Top Area for Growth:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-1">
                          {record.areasForImprovement[0]}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400">
                    Candidate: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{record.candidateName || 'Candidate'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`delete-session-btn-${record.id}`}
                      onClick={() => setSessionToDelete(record)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Delete this interview record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      id={`view-session-btn-${record.id}`}
                      onClick={() => onOpenSession(record)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <span>Review Full Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 sm:p-14 text-center border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {history.length === 0 ? 'No Interview History Yet' : 'No Interviews Match Your Filters'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {history.length === 0
                  ? 'Complete your first Chat or Voice mock interview round to start tracking your performance metrics, score evolution, and AI feedback history.'
                  : 'Try clearing your search query or adjusting your mode and level filters.'}
              </p>
            </div>

            <div className="pt-3">
              {history.length === 0 ? (
                <button
                  type="button"
                  id="empty-start-interview-btn"
                  onClick={onStartNewInterview}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 inline-flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Your First Mock Interview</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModeFilter('All');
                    setSelectedLevelFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Interview Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete the record for <strong>{sessionToDelete.targetRole}</strong> ({sessionToDelete.overallScore.toFixed(1)}/10)? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-delete-btn"
                onClick={() => setSessionToDelete(null)}
                className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-delete-btn"
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Clear All Interview History?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will permanently delete all {history.length} saved interview records and reset your progress tracking statistics.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-clear-all-btn"
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-clear-all-btn"
                onClick={handleClearAll}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
