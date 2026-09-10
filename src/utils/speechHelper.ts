/**
 * speechHelper.ts
 *
 * Robust Text-to-Speech (TTS) helper utilizing the browser's Web Speech API (SpeechSynthesis).
 * Solves common browser SpeechSynthesis issues:
 * 1. Chromium 10-15s utterance cutoff / garbage collection bug (by maintaining strong utterance references).
 * 2. Long utterance freezing (by splitting questions into natural sentence/clause chunks and speaking sequentially).
 * 3. Chrome background speech pausing (by running a periodic keep-alive pulse).
 * 4. Ensures the entire multi-sentence interview question is spoken completely from start to finish.
 */

export interface SpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  rate?: number;
  pitch?: number;
  lang?: string;
  volume?: number;
}

// Module-level state to retain SpeechSynthesisUtterance references preventing V8 Garbage Collection
let activeUtterances: SpeechSynthesisUtterance[] = [];
let activeKeepAliveTimer: any = null;
let currentSpeechSessionId = 0;
let activeOnEndCallback: (() => void) | null = null;

// Expose to window for extra GC protection
if (typeof window !== 'undefined') {
  (window as any).__activeSpeechUtterances = activeUtterances;
}

/**
 * Check if SpeechSynthesis is supported in the current browser environment.
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

/**
 * Splits text into natural sentence and clause chunks for seamless sequential playback.
 * Preserves all words, punctuation, and meaning without truncating.
 */
export function splitTextIntoSpeechChunks(text: string, maxChunkLength = 160): string[] {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Split by natural sentence boundaries (. ? ! ; \n)
  const sentenceRegex = /[^.?!;\n]+(?:[.?!;\n]+|$)/g;
  const rawSentences = trimmed.match(sentenceRegex) || [trimmed];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const s = raw.trim();
    if (!s) continue;

    if (s.length <= maxChunkLength) {
      chunks.push(s);
    } else {
      // For longer sentences, split by clauses (comma, colon, semicolon)
      const clauseRegex = /[^,:;]+(?:[,:;]+|$)/g;
      const subParts = s.match(clauseRegex) || [s];
      let currentSub = '';

      for (const part of subParts) {
        const p = part.trim();
        if (!p) continue;

        if (!currentSub) {
          currentSub = p;
        } else if ((currentSub + ' ' + p).length <= maxChunkLength) {
          currentSub += ' ' + p;
        } else {
          chunks.push(currentSub);
          currentSub = p;
        }
      }

      if (currentSub) {
        // If still exceeds max length, split by words safely
        if (currentSub.length > maxChunkLength) {
          const words = currentSub.split(/\s+/);
          let wordChunk = '';
          for (const w of words) {
            if (!wordChunk) {
              wordChunk = w;
            } else if ((wordChunk + ' ' + w).length <= maxChunkLength) {
              wordChunk += ' ' + w;
            } else {
              chunks.push(wordChunk);
              wordChunk = w;
            }
          }
          if (wordChunk) chunks.push(wordChunk);
        } else {
          chunks.push(currentSub);
        }
      }
    }
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

/**
 * Helper to select a natural-sounding English voice.
 */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;

  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Natural / Google / Apple / Microsoft English voices
    const highQualityVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('David') ||
          v.name.includes('Zira') ||
          v.name.includes('Jenny') ||
          v.name.includes('Guy') ||
          v.name.includes('Aria') ||
          v.name.includes('Microsoft'))
    );
    if (highQualityVoice) return highQualityVoice;

    // 2. Any en-US voice
    const enUsVoice = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
    if (enUsVoice) return enUsVoice;

    // 3. Any English voice
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) return enVoice;

    return voices[0] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Stop any currently running speech synthesis, clear utterance references, and reset state.
 */
export function stopSpeech(): void {
  currentSpeechSessionId++;

  if (activeKeepAliveTimer) {
    clearInterval(activeKeepAliveTimer);
    activeKeepAliveTimer = null;
  }

  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }

  activeUtterances = [];
  if (typeof window !== 'undefined') {
    (window as any).__activeSpeechUtterances = activeUtterances;
  }

  if (activeOnEndCallback) {
    const cb = activeOnEndCallback;
    activeOnEndCallback = null;
    cb();
  }
}

/**
 * Speaks the entire text without truncation by splitting into natural sentence chunks,
 * queuing sequentially, retaining utterances against garbage collection, and keeping
 * the Speaking state active until the final sentence has completed.
 */
export function speakFullText(text: string, options: SpeechOptions = {}): void {
  if (!isSpeechSynthesisSupported()) {
    options.onEnd?.();
    return;
  }

  // Cancel any existing speech session
  stopSpeech();

  const trimmed = text ? text.trim() : '';
  if (!trimmed) {
    options.onEnd?.();
    return;
  }

  const thisSessionId = ++currentSpeechSessionId;
  const chunks = splitTextIntoSpeechChunks(trimmed);

  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  // Save onEnd callback in module scope so stopSpeech() can invoke it if interrupted
  activeOnEndCallback = options.onEnd || null;

  let currentChunkIndex = 0;
  let hasStarted = false;

  // Keep-alive timer to prevent Chromium speech engine from pausing indefinitely on longer audio
  activeKeepAliveTimer = setInterval(() => {
    if (thisSessionId !== currentSpeechSessionId) {
      if (activeKeepAliveTimer) clearInterval(activeKeepAliveTimer);
      return;
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking &&
      !window.speechSynthesis.paused
    ) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 4500);

  const voice = getPreferredVoice();

  const playNextChunk = () => {
    if (thisSessionId !== currentSpeechSessionId) {
      return;
    }

    if (currentChunkIndex >= chunks.length) {
      // Entire text has completed speaking!
      if (activeKeepAliveTimer) {
        clearInterval(activeKeepAliveTimer);
        activeKeepAliveTimer = null;
      }
      activeUtterances = [];
      if (typeof window !== 'undefined') {
        (window as any).__activeSpeechUtterances = activeUtterances;
      }
      const cb = activeOnEndCallback;
      activeOnEndCallback = null;
      cb?.();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.lang = options.lang ?? 'en-US';
    utterance.volume = options.volume ?? 1.0;

    if (voice) {
      utterance.voice = voice;
    }

    // Retain utterance reference in module array to prevent V8 Garbage Collection
    activeUtterances.push(utterance);
    if (typeof window !== 'undefined') {
      (window as any).__activeSpeechUtterances = activeUtterances;
    }

    utterance.onstart = () => {
      if (thisSessionId !== currentSpeechSessionId) return;
      if (!hasStarted) {
        hasStarted = true;
        options.onStart?.();
      }
    };

    utterance.onend = () => {
      if (thisSessionId !== currentSpeechSessionId) return;
      currentChunkIndex++;
      playNextChunk();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (thisSessionId !== currentSpeechSessionId) return;

      if (event.error === 'canceled' || event.error === 'interrupted') {
        // Normal user cancellation or question switch
        if (activeKeepAliveTimer) {
          clearInterval(activeKeepAliveTimer);
          activeKeepAliveTimer = null;
        }
        activeUtterances = [];
        const cb = activeOnEndCallback;
        activeOnEndCallback = null;
        cb?.();
        return;
      }

      console.warn('SpeechSynthesis utterance error on chunk', currentChunkIndex, event);
      // Advance to next chunk instead of dying mid-question
      currentChunkIndex++;
      playNextChunk();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak chunk:', err);
      if (options.onError) {
        options.onError(err);
      }
      currentChunkIndex++;
      playNextChunk();
    }
  };

  // Start speaking first chunk
  playNextChunk();
}
