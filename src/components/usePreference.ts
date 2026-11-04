import { useCallback, useSyncExternalStore } from "react";

/**
 * Small per-browser preferences (Rookie / Refresher mode, code language, voice-over, speed).
 * Every component using the same key stays in sync. Falls back to memory if storage is blocked.
 */
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    const v = localStorage.getItem("lldstudio." + key);
    if (v !== null) memory.set(key, v);
    return v;
  } catch {
    return null;
  }
}

export function setPreference(key: string, value: string): void {
  memory.set(key, value);
  try { localStorage.setItem("lldstudio." + key, value); } catch { /* private mode etc. */ }
  listeners.get(key)?.forEach((f) => f());
}

export function getPreference<T extends string>(key: string, initial: T): T {
  return (read(key) as T) ?? initial;
}

export function usePreference<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const subscribe = useCallback((f: () => void) => {
    const set = listeners.get(key) ?? new Set();
    set.add(f);
    listeners.set(key, set);
    return () => { set.delete(f); };
  }, [key]);
  const value = useSyncExternalStore(subscribe, () => (read(key) as T) ?? initial, () => initial);
  const set = useCallback((v: T) => setPreference(key, v), [key]);
  return [value, set];
}
