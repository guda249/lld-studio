import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import type { CodePair } from "../content/types";
import type { Story } from "./types";
import type { StageEngine } from "./compile";
import Stage from "./Stage";
import { StepControls, useSpeed } from "./controls";
import CodePanel, { useCodeLang } from "../components/CodePanel";
import { speech, useSpeech, forListening } from "../lib/speech";
import { useReducedMotion } from "../lib/motion";
import Legend from "./Legend";

const HOLD = 2.8;

interface Props {
  story: Story;
  code: { problem: CodePair; main: CodePair };
  /** Used for element ids. */
  idBase: string;
  /** Pauses everything when the tab is hidden. */
  active: boolean;
}

/**
 * The story animation: one GSAP timeline split into labelled steps. Each step drives the stage, the narration and
 * the highlighted code together. Port of the approved Strategy prototype (docs/design-system.md, "Animation").
 */
export default function StoryPlayer({ story, code, idBase, active }: Props) {
  const [lang] = useCodeLang();
  const [speed] = useSpeed();
  const voice = useSpeech();
  const reduce = useReducedMotion();
  const steps = story.steps;
  const actionLists = useMemo(() => steps.map((s) => s.actions), [steps]);

  const [current, setCurrent] = useState(1);
  const [autoplay, setAutoplay] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [fading, setFading] = useState(false);

  const tl = useRef<gsap.core.Timeline | null>(null);
  const stopAt = useRef<number | null>(null);
  const cur = useRef(1);
  const auto = useRef(false);
  const animDoneRef = useRef(false);
  const speechDone = useRef(true);
  const advanceTimer = useRef<number | undefined>(undefined);
  const speedRef = useRef(speed);
  const goStepRef = useRef<(k: number) => void>(() => {});
  const firstBuild = useRef(true);
  speedRef.current = speed;

  const startOf = (k: number) => tl.current?.labels["s" + k] ?? 0;
  const endOf = (k: number) => tl.current?.labels["e" + k] ?? 0;

  const showStep = useCallback((k: number) => {
    if (k === cur.current) return;
    cur.current = k;
    setFading(true);
    window.setTimeout(() => { setCurrent(k); setFading(false); }, reduce ? 0 : 160);
  }, [reduce]);

  const maybeAdvance = useCallback(() => {
    if (!auto.current || !animDoneRef.current || (speech.state.on && !speechDone.current)) return;
    window.clearTimeout(advanceTimer.current);
    if (cur.current >= steps.length) { auto.current = false; setAutoplay(false); return; }
    const delay = speech.state.on ? 700 : (HOLD * 1000) / speedRef.current;
    advanceTimer.current = window.setTimeout(() => { if (auto.current) goStepRef.current(cur.current + 1); }, delay);
  }, [steps.length]);

  const onTick = useCallback(() => {
    const t = tl.current;
    if (!t) return;
    if (stopAt.current !== null && t.time() >= stopAt.current - 1e-4) {
      const at = stopAt.current;
      stopAt.current = null;
      t.pause(at);
      animDoneRef.current = true;
      setAnimDone(true);
      maybeAdvance();
    }
    const time = t.time();
    let k = 1;
    for (let i = 1; i <= steps.length; i++) if (time >= startOf(i) - 1e-4) k = i;
    showStep(k);
  }, [steps.length, showStep, maybeAdvance]);

  const playUntil = useCallback((target: number) => {
    const t = tl.current;
    if (!t) return;
    animDoneRef.current = false;
    setAnimDone(false);
    if (reduce) {
      stopAt.current = null;
      t.pause(target);
      animDoneRef.current = true;
      setAnimDone(true);
      onTick();
      maybeAdvance();
      return;
    }
    stopAt.current = target;
    t.play();
  }, [reduce, onTick, maybeAdvance]);

  const speakStep = useCallback((k: number) => {
    speechDone.current = true;
    if (!speech.state.on) return;
    const s = steps[k - 1];
    speechDone.current = false;
    speech.speak([
      { id: "title", text: `Step ${k}. ${forListening(s.title)}.` },
      { id: "what", text: s.say?.what ?? forListening(s.what) },
      { id: "why", text: "Why it matters. " + (s.say?.why ?? forListening(s.why)) }
    ], speedRef.current).then(() => { speechDone.current = true; maybeAdvance(); });
  }, [steps, maybeAdvance]);

  function goStep(k: number) {
    const t = tl.current;
    if (!t) return;
    k = Math.max(1, Math.min(steps.length, k));
    window.clearTimeout(advanceTimer.current);
    stopAt.current = null;
    t.pause(startOf(k));
    onTick();
    speakStep(k);
    playUntil(endOf(k));
  }

  goStepRef.current = goStep;

  const stopAutoplay = useCallback(() => {
    auto.current = false;
    setAutoplay(false);
    window.clearTimeout(advanceTimer.current);
    stopAt.current = null;
    tl.current?.pause();
    speech.stop();
  }, []);

  function togglePlay() {
    if (auto.current) { stopAutoplay(); return; }
    auto.current = true;
    setAutoplay(true);
    const finished = cur.current >= steps.length && animDoneRef.current;
    goStep(finished ? 1 : cur.current);
  }

  // build (or rebuild after a language / orientation change) the master timeline
  const onEngine = useCallback((engine: StageEngine | null) => {
    tl.current?.kill();
    tl.current = null;
    if (!engine) return;
    engine.reset();
    const t = gsap.timeline({ paused: true, onUpdate: () => onTickRef.current() });
    steps.forEach((s, i) => {
      const k = i + 1;
      t.addLabel("s" + k);
      t.add(engine.compile(s.actions));
      t.addLabel("e" + k);
      t.to({}, { duration: k === steps.length ? 0.3 : HOLD });
    });
    t.timeScale(speedRef.current);
    tl.current = t;
    if (firstBuild.current) {
      firstBuild.current = false;
      t.pause(0);
      cur.current = 1;
      setCurrent(1);
      playUntil(endOf(1));
    } else {
      t.pause(endOf(cur.current));
      animDoneRef.current = true;
      setAnimDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => { tl.current?.timeScale(speed); }, [speed]);
  useEffect(() => { if (!active) stopAutoplay(); }, [active, stopAutoplay]);
  useEffect(() => () => { window.clearTimeout(advanceTimer.current); tl.current?.kill(); speech.stop(); }, []);

  const step = steps[current - 1];
  const playLabel = autoplay ? "Pause" : current >= steps.length && animDone ? "Play again" : current <= 1 ? "Play all" : "Play from here";
  const titleId = `${idBase}-step-title`;
  const codeFor = step.code === "problem" ? code.problem : code.main;
  const note = step.code === "problem"
    ? "Before: the code without the pattern. Highlighted lines are the ones causing the pain."
    : "After: the pattern. Highlighted lines match the current step.";

  return (
    <div
      className="story"
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "ArrowRight") { e.preventDefault(); goStep(cur.current + 1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); goStep(cur.current - 1); }
        else if (e.key === " " && tag !== "BUTTON") { e.preventDefault(); togglePlay(); }
      }}
    >
      <div tabIndex={0} className="stage-focus" aria-describedby={`${idBase}-kbd`}>
        <Stage spec={story.diagram} actionLists={actionLists} lang={lang} onEngine={onEngine} labelledBy={titleId} />
      </div>
      <Legend />
      <StepControls
        total={steps.length}
        current={current}
        playLabel={playLabel}
        stepTitles={steps.map((s) => s.title)}
        onPrev={() => goStep(cur.current - 1)}
        onNext={() => goStep(cur.current + 1)}
        onPlay={togglePlay}
        onReplay={() => goStep(cur.current)}
        onJump={(k) => goStep(k)}
        onVoiceOn={() => speakStep(cur.current)}
      />
      <p className="hint" id={`${idBase}-kbd`}>
        Keyboard: click the diagram, then ← and → move between steps and space plays or pauses. With voice-over on, Play waits for the narration before moving on.
      </p>
      <div className="story-below">
        <div className={"narration" + (fading ? " fading" : "")} aria-live="polite">
          <div className="step-count">Step {current} of {steps.length}</div>
          <h3 id={titleId} className={voice.speakingId === "title" ? "speaking" : undefined}>{step.title}</h3>
          <p className={voice.speakingId === "what" ? "speaking" : undefined}>{step.what}</p>
          <p className={"why" + (voice.speakingId === "why" ? " speaking" : "")}><strong>Why it matters:</strong> {step.why}</p>
        </div>
        <CodePanel code={codeFor} hl={step.lines} note={note} label="Code for the current step" maxHeight={460} />
      </div>
    </div>
  );
}
