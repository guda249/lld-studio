import { useSyncExternalStore } from "react";

/**
 * Voice-over with the browser's built-in speech (Web Speech API): free, no server, off by default.
 * One shared state for the whole app, so the toggle, voice and speed carry across tabs and lessons.
 */
export interface SpeechPart { id?: string; text: string }

const synth: SpeechSynthesis | null = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

interface State { on: boolean; voices: SpeechSynthesisVoice[]; voiceName: string | null; speakingId: string | null; available: boolean }
let state: State = { on: false, voices: [], voiceName: null, speakingId: null, available: !!synth };
const subs = new Set<() => void>();
const emit = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
let token = 0;

function loadVoices() {
  if (!synth) return;
  const voices = synth.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
  let name = state.voiceName;
  if (!name || !voices.some((v) => v.name === name)) {
    const pick = voices.find((v) => /natural|neural|google|samantha|daniel/i.test(v.name)) ?? voices.find((v) => v.default) ?? voices[0];
    name = pick ? pick.name : null;
  }
  emit({ voices, voiceName: name });
}
if (synth) {
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);
  window.addEventListener("pagehide", () => synth.cancel());
}

export const speech = {
  get state() { return state; },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  setOn(on: boolean) { if (!on) this.stop(); emit({ on }); },
  setVoice(name: string) { emit({ voiceName: name }); },
  stop() {
    token++;
    synth?.cancel();
    if (state.speakingId) emit({ speakingId: null });
  },
  /**
   * Speaks the parts in order (short sentences avoid a Chrome bug that cuts long speech off).
   * Resolves when finished, stopped, or immediately if voice-over is off.
   */
  speak(parts: SpeechPart[], rate = 1): Promise<void> {
    this.stop();
    if (!state.on || !synth) return Promise.resolve();
    const my = token;
    const queue: SpeechPart[] = [];
    for (const p of parts) for (const s of sentences(p.text)) queue.push({ id: p.id, text: s });
    if (!queue.length) return Promise.resolve();
    return new Promise((resolve) => {
      let finished = false;
      const total = queue.reduce((n, q) => n + q.text.length, 0);
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safety);
        clearInterval(poll);
        if (my === token && state.speakingId) emit({ speakingId: null });
        resolve();
      };
      const safety = setTimeout(finish, Math.max(6000, (total * 120) / rate));
      const poll = setInterval(() => { if (my !== token) finish(); }, 250);   // stopped by someone else
      setTimeout(() => {          // give cancel() a moment before queueing (Chrome)
        if (my !== token) { finish(); return; }
        const voice = state.voices.find((v) => v.name === state.voiceName) ?? null;
        queue.forEach((q, i) => {
          const u = new SpeechSynthesisUtterance(q.text);
          if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
          u.rate = Math.min(2, Math.max(0.5, rate));
          u.onstart = () => { if (my === token && state.speakingId !== (q.id ?? null)) emit({ speakingId: q.id ?? null }); };
          if (i === queue.length - 1) { u.onend = finish; u.onerror = finish; }
          synth.speak(u);
        });
      }, 80);
    });
  }
};

function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

/** Text made friendlier for listening: splits CamelCase, reads ₹ amounts and drops code punctuation. */
export function forListening(text: string): string {
  return text
    .replace(/₹\s?([\d,]+(?:\.\d+)?)/g, "$1 rupees")
    .replace(/\bUPI\b/g, "U P I")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/[()[\]{}"“”`]/g, " ")
    .replace(/\s+/g, " ");
}

export function useSpeech(): State {
  return useSyncExternalStore(speech.subscribe, () => speech.state, () => speech.state);
}
