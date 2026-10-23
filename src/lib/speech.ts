/**
 * Client-Side Speech Synthesis Helper for Low-Literacy Tribal Collectors (Phase G7)
 * Reads out daily minimum support price rates and certified weights aloud.
 */

export function speakAloud(text: string, lang: 'or-IN' | 'en-IN' = 'en-IN'): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    // Cancel any previous speech queue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower pace for field clarity
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang === lang || v.lang.startsWith(lang.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis playback error:', err);
    return false;
  }
}
