import {
  CompletedInterviewSession,
  InterviewAnswerEvaluation,
  InterviewFinalSummary,
  HistoricalInterviewRecord,
  InterviewProgressStats,
  ScoreTrendPoint,
  DimensionAverage,
} from '../types';

const STORAGE_KEY = 'ai_resume_interview_history_v1';
const MAX_STORED_SESSIONS = 100;

/**
 * Safely parse JSON from localStorage with validation.
 */
function safeGetStorage(): HistoricalInterviewRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter and sanitize valid records
    return parsed.filter((item): item is HistoricalInterviewRecord => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        typeof item.overallScore === 'number' &&
        !isNaN(item.overallScore) &&
        typeof item.targetRole === 'string' &&
        item.session &&
        Array.isArray(item.evaluations) &&
        item.finalSummary
      );
    });
  } catch (err) {
    console.warn('Failed to parse interview history from localStorage:', err);
    return [];
  }
}

/**
 * Safely write items to localStorage with quota protection.
 */
function safeSetStorage(records: HistoricalInterviewRecord[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const trimmed = records.slice(0, MAX_STORED_SESSIONS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    // Dispatch event to notify listeners (e.g., Navbar badge, History dashboard)
    window.dispatchEvent(new CustomEvent('interview-history-updated', { detail: { count: trimmed.length } }));
    return true;
  } catch (err) {
    console.error('Failed to save interview history to localStorage:', err);
    // If quota exceeded, try pruning oldest half
    try {
      const halved = records.slice(0, Math.floor(records.length / 2));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(halved));
      return true;
    } catch {
      return false;
    }
  }
}

import {
  saveInterviewSessionToFirestore,
  deleteInterviewSessionFromFirestore,
  clearAllInterviewSessionsFromFirestore,
} from '../services/interviewDb';

/**
 * Saves a completed interview session along with its evaluations and final summary.
 */
export function saveCompletedInterview(
  session: CompletedInterviewSession,
  evaluations: InterviewAnswerEvaluation[],
  finalSummary: InterviewFinalSummary,
  candidateName?: string
): HistoricalInterviewRecord {
  const existing = safeGetStorage();

  const record: HistoricalInterviewRecord = {
    id: session.id || `session-${Date.now()}`,
    savedAt: new Date().toISOString(),
    completedAt: session.completedAt || new Date().toISOString(),
    startedAt: session.startedAt || new Date().toISOString(),
    targetRole: session.config.targetRole,
    interviewLevel: session.config.interviewLevel,
    interviewType: session.config.interviewType,
    interviewMode: session.config.interviewMode || 'Chat',
    questionCount: session.questions.length,
    duration: session.config.duration,
    overallScore: finalSummary.overallScore,
    overallRating: finalSummary.overallRating,
    isTimedOut: !!session.isTimedOut,
    candidateName: candidateName || session.config.resumeReference?.candidateName || 'Candidate',
    keyStrengths: finalSummary.keyStrengths || [],
    areasForImprovement: finalSummary.areasForImprovement || [],
    perQuestionScores: finalSummary.questionSummaries || [],
    session,
    evaluations,
    finalSummary,
  };

  // Deduplicate by ID
  const filtered = existing.filter((r) => r.id !== record.id);
  const updated = [record, ...filtered];

  safeSetStorage(updated);

  // Asynchronously persist to Cloud Firestore database
  saveInterviewSessionToFirestore(record).catch((err) => {
    console.error('[Firestore] Failed background save for interview session:', err);
  });

  return record;
}

/**
 * Retrieves all saved interview records sorted newest first.
 */
export function getInterviewHistory(): HistoricalInterviewRecord[] {
  const records = safeGetStorage();
  return records.sort((a, b) => {
    const timeA = new Date(a.completedAt || a.savedAt).getTime();
    const timeB = new Date(b.completedAt || b.savedAt).getTime();
    return timeB - timeA;
  });
}

/**
 * Retrieves a single historical interview record by ID.
 */
export function getInterviewRecordById(id: string): HistoricalInterviewRecord | null {
  const records = safeGetStorage();
  return records.find((r) => r.id === id) || null;
}

/**
 * Deletes a single historical interview record.
 */
export function deleteInterviewRecord(id: string): boolean {
  const records = safeGetStorage();
  const filtered = records.filter((r) => r.id !== id);
  const success = safeSetStorage(filtered);

  // Asynchronously delete from Cloud Firestore database
  deleteInterviewSessionFromFirestore(id).catch((err) => {
    console.error('[Firestore] Failed background delete for interview session:', err);
  });

  return success;
}

/**
 * Clears all historical interview records.
 */
export function clearAllInterviewHistory(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('interview-history-updated', { detail: { count: 0 } }));

    // Asynchronously clear all from Cloud Firestore database
    clearAllInterviewSessionsFromFirestore().catch((err) => {
      console.error('[Firestore] Failed background clear for interview sessions:', err);
    });

    return true;
  } catch (err) {
    console.error('Failed to clear interview history:', err);
    return false;
  }
}

/**
 * Computes aggregated progress tracking metrics across historical sessions.
 */
export function computeProgressStats(records: HistoricalInterviewRecord[]): InterviewProgressStats {
  if (!records || records.length === 0) {
    return {
      totalCompleted: 0,
      averageScore: 0,
      bestScore: 0,
      latestScore: null,
      scoreChange: null,
      chatCount: 0,
      voiceCount: 0,
      scoreTrend: [],
      dimensionAverages: [],
    };
  }

  const total = records.length;
  const scores = records.map((r) => r.overallScore);
  const sumScores = scores.reduce((sum, s) => sum + s, 0);
  const averageScore = Math.round((sumScores / total) * 10) / 10;
  const bestScore = Math.max(...scores);

  // Chronological order for trendline (oldest to newest)
  const chronological = [...records].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.savedAt).getTime();
    const timeB = new Date(b.completedAt || b.savedAt).getTime();
    return timeA - timeB;
  });

  const latestRecord = chronological[chronological.length - 1];
  const latestScore = latestRecord.overallScore;

  let scoreChange: number | null = null;
  if (chronological.length > 1) {
    const firstScore = chronological[0].overallScore;
    scoreChange = Math.round((latestScore - firstScore) * 10) / 10;
  }

  const chatCount = records.filter((r) => r.interviewMode === 'Chat').length;
  const voiceCount = records.filter((r) => r.interviewMode === 'Voice').length;

  const scoreTrend: ScoreTrendPoint[] = chronological.map((r) => ({
    id: r.id,
    date: new Date(r.completedAt || r.savedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    role: r.targetRole,
    mode: r.interviewMode,
    score: r.overallScore,
    rating: r.overallRating,
  }));

  // Aggregate dimension scores across all sessions
  const dimensionMap = new Map<string, { sum: number; count: number }>();
  records.forEach((r) => {
    if (r.finalSummary && Array.isArray(r.finalSummary.dimensionScores)) {
      r.finalSummary.dimensionScores.forEach((d) => {
        const existing = dimensionMap.get(d.dimension) || { sum: 0, count: 0 };
        dimensionMap.set(d.dimension, {
          sum: existing.sum + d.score,
          count: existing.count + 1,
        });
      });
    }
  });

  const dimensionAverages: DimensionAverage[] = Array.from(dimensionMap.entries()).map(
    ([dimension, data]) => ({
      dimension,
      averageScore: Math.round((data.sum / data.count) * 10) / 10,
      sessionCount: data.count,
    })
  );

  return {
    totalCompleted: total,
    averageScore,
    bestScore,
    latestScore,
    scoreChange,
    chatCount,
    voiceCount,
    scoreTrend,
    dimensionAverages,
  };
}
