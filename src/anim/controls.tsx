import { speech, useSpeech } from "../lib/speech";
import { usePreference } from "../components/usePreference";

export const SPEEDS = ["0.5", "0.75", "1", "1.5", "2"] as const;

/** Playback speed shared by every animation (0.5× – 2×). */
export function useSpeed(): [number, (s: number) => void] {
  const [s, set] = usePreference<string>("speed", "1");
  return [Number(s) || 1, (v: number) => set(String(v))];
}

export function SpeedSelect() {
  const [speed, setSpeed] = useSpeed();
  return (
    <label className="speed">Speed
      <select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))}>
        {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
      </select>
    </label>
  );
}

const SpeakerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

/** Voice-over toggle (+ voice picker when on). `onTurnOn` runs inside the click, which browsers require for audio. */
export function VoiceToggle({ onTurnOn, picker = true }: { onTurnOn?: () => void; picker?: boolean }) {
  const s = useSpeech();
  if (!s.available) {
    return <span className="voice-note">Voice-over isn't available in this browser (no built-in speech).</span>;
  }
  return (
    <div className="voice">
      <button
        type="button"
        className="btn"
        aria-pressed={s.on}
        onClick={() => {
          const on = !s.on;
          speech.setOn(on);
          if (on) onTurnOn?.();
        }}
      >
        <SpeakerIcon />
        <span>{s.on ? "Voice-over on" : "Voice-over off"}</span>
      </button>
      {picker && s.on && s.voices.length > 0 && (
        <label>
          <span className="sr-only">Voice</span>
          <select value={s.voiceName ?? ""} onChange={(e) => { speech.setVoice(e.target.value); onTurnOn?.(); }}>
            {s.voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

export const PrevIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="4" x2="18" y2="20" /><polygon points="14,4 4,12 14,20" />
  </svg>
);
export const NextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="4" x2="6" y2="20" /><polygon points="10,4 20,12 10,20" />
  </svg>
);

interface StepControlsProps {
  total: number;
  current: number;
  playLabel: string;
  stepTitles: string[];
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onReplay: () => void;
  onJump: (k: number) => void;
  onVoiceOn: () => void;
  prevLabel?: string;
  nextLabel?: string;
  replayLabel?: string;
  hint?: string;
}

/** Previous / Play all / Next, step bar, Replay, Speed and Voice-over, as in the approved prototype. */
export function StepControls(p: StepControlsProps) {
  return (
    <div className="controls">
      <div className="ctl-main">
        <button className="btn" type="button" aria-label={p.prevLabel ?? "Previous step"} onClick={p.onPrev} disabled={p.current <= 1}><PrevIcon /></button>
        <button className="btn primary play" type="button" onClick={p.onPlay}>{p.playLabel}</button>
        <button className="btn" type="button" aria-label={p.nextLabel ?? "Next step"} onClick={p.onNext} disabled={p.current >= p.total}><NextIcon /></button>
      </div>
      <div className="dots" role="group" aria-label="Jump to step">
        {p.stepTitles.map((t, i) => (
          <button
            key={i}
            type="button"
            className={"dot" + (i + 1 < p.current ? " done" : "")}
            aria-current={i + 1 === p.current ? "step" : undefined}
            aria-label={`Step ${i + 1}: ${t}`}
            onClick={() => p.onJump(i + 1)}
          />
        ))}
      </div>
      <div className="ctl-more">
        <button className="btn" type="button" onClick={p.onReplay}>{p.replayLabel ?? "Replay step"}</button>
        <SpeedSelect />
        <VoiceToggle onTurnOn={p.onVoiceOn} />
      </div>
      {p.hint && <div className="hint">{p.hint}</div>}
    </div>
  );
}
