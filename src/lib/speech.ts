/**
 * Client-Side Speech Synthesis Helper for Low-Literacy Tribal Collectors (Phase G7 & Maitriyam Voice)
 * Reads out daily minimum support price rates, certified weights, and guidance aloud.
 */

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('Speech cancellation error:', err);
    }
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
}

export function speakAloud(
  text: string,
  lang: 'or-IN' | 'en-IN' = 'en-IN',
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    // Cancel any previous speech queue
    window.speechSynthesis.cancel();

    // Clean text of markdown and technical characters for clean speech
    const cleanText = text
      .replace(/\(https?:\/\/[^\)]+\)/g, '')
      .replace(/[#*_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower pace for field clarity
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang === lang || v.lang.startsWith(lang.slice(0, 2))
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis playback error:', err);
    if (onEnd) onEnd();
    return false;
  }
}
