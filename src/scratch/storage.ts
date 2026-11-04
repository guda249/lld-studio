/**
 * Scratch-pad data, kept only in this browser (IndexedDB via src/lib/store.ts):
 *   draft:<slug>              the current Python + Scala code and diagram (autosaved)
 *   attempt:<slug>:<time>     every reviewed attempt with its report
 * Plus an optional workspace folder (Chrome / Edge) and ZIP export / import (every browser).
 */
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import type { Lang } from "../content/types";
import type { Report, UmlModel } from "../review/types";
import { allKeys, getItem, setItem } from "../lib/store";

export interface Draft { slug: string; python: string; scala: string; diagram: UmlModel; updatedAt: number }
export interface Attempt { id: string; slug: string; lang: Lang; code: string; diagram: UmlModel; report: Report; createdAt: number; /** set when the attempt was a kata */ kata?: string }

export const emptyDiagram = (): UmlModel => ({ classes: [], relations: [] });

export const loadDraft = (slug: string) => getItem<Draft>(`draft:${slug}`);
export const saveDraft = (d: Draft) => setItem(`draft:${d.slug}`, d);

export async function saveAttempt(a: Attempt): Promise<void> {
  await setItem(`attempt:${a.slug}:${a.id}`, a);
}

export async function listAttempts(slug?: string): Promise<Attempt[]> {
  const keys = await allKeys(slug ? `attempt:${slug}:` : "attempt:");
  const items = await Promise.all(keys.map((k) => getItem<Attempt>(k)));
  return items.filter((x): x is Attempt => !!x).sort((a, b) => b.createdAt - a.createdAt);
}

const stamp = (t: number) => new Date(t).toISOString().slice(0, 16).replace(/:/g, "-");
const codeFile = (lang: Lang) => (lang === "python" ? "solution.py" : "Solution.scala");

/** Files for one attempt, as written to the workspace folder or the ZIP. */
export function attemptFiles(a: Attempt): Record<string, string> {
  const dir = `${a.slug}/${a.kata ? `kata-${a.kata}/` : ""}${stamp(a.createdAt)}-${a.lang}`;
  return {
    [`${dir}/${codeFile(a.lang)}`]: a.code,
    [`${dir}/diagram.uml.json`]: JSON.stringify(a.diagram, null, 2),
    [`${dir}/review.md`]: a.report.markdown
  };
}

/** Everything the learner has saved in this browser, as one object (backup / move to another device). */
export async function collectAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const prefix of ["draft:", "attempt:", "deck:", "quiz:", "seen:", "activity:", "uml:", "guides:"]) {
    for (const k of await allKeys(prefix)) out[k] = await getItem(k);
  }
  return out;
}

function progressSummary(data: Record<string, unknown>) {
  const quizzes = Object.entries(data).filter(([k]) => k.startsWith("quiz:")).map(([k, v]) => ({ pattern: k.slice(5), ...(v as object) }));
  const attempts = Object.entries(data).filter(([k]) => k.startsWith("attempt:")).map(([, v]) => v as Attempt)
    .map((a) => ({ pattern: a.slug, lang: a.lang, score: a.report.score, at: new Date(a.createdAt).toISOString() }));
  return { exportedAt: new Date().toISOString(), quizzes, attempts };
}

/** ZIP with readable files (code, diagram, review per attempt) plus a full backup the app can import again. */
export async function exportZip(): Promise<Blob> {
  const data = await collectAll();
  const files: Record<string, Uint8Array> = {
    "lldstudio-backup.json": strToU8(JSON.stringify({ app: "LLD Studio", version: 1, data }, null, 1)),
    "progress.json": strToU8(JSON.stringify(progressSummary(data), null, 2)),
    "README.txt": strToU8("LLD Studio workspace export.\nImport this ZIP in LLD Studio (Scratch pad > Import ZIP) to restore your work.\nEach attempt folder has your code, diagram and the review.\n")
  };
  for (const v of Object.values(data)) {
    const a = v as Attempt;
    if (a && a.report && a.code !== undefined) for (const [p, s] of Object.entries(attemptFiles(a))) files[p] = strToU8(s);
  }
  return new Blob([zipSync(files)], { type: "application/zip" });
}

/** Restores a ZIP made by exportZip. Newer items win; nothing is deleted. Returns how many items were imported. */
export async function importZip(file: File): Promise<number> {
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const raw = entries["lldstudio-backup.json"];
  if (!raw) throw new Error("This ZIP wasn't made by LLD Studio (no lldstudio-backup.json inside).");
  const parsed = JSON.parse(strFromU8(raw)) as { data?: Record<string, unknown> };
  let n = 0;
  for (const [k, v] of Object.entries(parsed.data ?? {})) {
    if (!/^(draft|attempt|deck|quiz|seen|activity|uml|guides):/.test(k)) continue;
    const mine = await getItem<{ updatedAt?: number; createdAt?: number; at?: number }>(k);
    const theirs = v as { updatedAt?: number; createdAt?: number; at?: number };
    if (k.startsWith("activity:") && mine) { await setItem(k, mergeDays(mine as never, theirs as never)); n++; continue; }
    const t = (x?: typeof theirs) => (x ? x.updatedAt ?? x.createdAt ?? x.at ?? 0 : -1);
    if (!mine || t(theirs) >= t(mine)) { await setItem(k, v); n++; }
  }
  return n;
}

/** Two devices' records of the same day: keep the larger count of each (adding would double-count re-imports). */
function mergeDays(a: Record<string, number | string>, b: Record<string, number | string>) {
  const out: Record<string, number | string> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = typeof v === "number" ? Math.max(Number(a[k] ?? 0), v) : v;
  return out;
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- workspace folder (File System Access API: Chrome / Edge desktop) ---------- */

interface DirHandle {
  name: string;
  getDirectoryHandle(name: string, o?: { create?: boolean }): Promise<DirHandle>;
  getFileHandle(name: string, o?: { create?: boolean }): Promise<{ createWritable(): Promise<{ write(d: string): Promise<void>; close(): Promise<void> }> }>;
  queryPermission?(o: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission?(o: { mode: "readwrite" }): Promise<PermissionState>;
}

export const folderSupported = (): boolean => typeof window !== "undefined" && "showDirectoryPicker" in window && window.isSecureContext;

export async function connectFolder(): Promise<string> {
  const picker = (window as unknown as { showDirectoryPicker(o?: object): Promise<DirHandle> }).showDirectoryPicker;
  const handle = await picker({ mode: "readwrite", id: "lldstudio" });
  await setItem("workspace:handle", handle);
  return handle.name;
}

export async function connectedFolder(): Promise<DirHandle | null> {
  return (await getItem<DirHandle>("workspace:handle")) ?? null;
}

export async function forgetFolder(): Promise<void> {
  await setItem("workspace:handle", null);
}

/** Writes one attempt (and progress.json) into the workspace folder. Asks for permission again if needed. */
export async function writeToFolder(a: Attempt): Promise<boolean> {
  const root = await connectedFolder();
  if (!root) return false;
  if (root.queryPermission && (await root.queryPermission({ mode: "readwrite" })) !== "granted") {
    if (!root.requestPermission || (await root.requestPermission({ mode: "readwrite" })) !== "granted") return false;
  }
  const write = async (path: string, text: string) => {
    const parts = path.split("/");
    let dir = root;
    for (const p of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(p, { create: true });
    const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
  };
  for (const [p, s] of Object.entries(attemptFiles(a))) await write(p, s);
  await write("progress.json", JSON.stringify(progressSummary(await collectAll()), null, 2));
  return true;
}
