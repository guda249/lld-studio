import { useEffect, useState } from "react";

const query = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null);

export const prefersReducedMotion = (): boolean => !!query()?.matches;

/** True when the learner asked the system for less motion: animations jump to their end state. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    const q = query();
    if (!q) return;
    const f = () => setReduce(q.matches);
    q.addEventListener?.("change", f);
    return () => q.removeEventListener?.("change", f);
  }, []);
  return reduce;
}

/** Width of an element, updated on resize. */
export function useWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}
