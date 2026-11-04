/**
 * Loads tree-sitter (WebAssembly) and the Python / Scala 3 grammars on demand, only when the scratch pad needs them.
 * Grammars are bundled with the app (src/review/grammars), so everything works offline and from file://.
 *   - Python grammar: tree-sitter-wasms 0.1.12 (tree-sitter-python, MIT)
 *   - Scala 3 grammar: tree-sitter-scala 0.24.0 (MIT); older builds can't read Scala 3 indentation syntax.
 */
import type { Lang } from "../content/types";
import type { TSNode } from "./model";

export interface ParsedTree { rootNode: TSNode; delete?: () => void }
export interface CodeParser { parse(source: string): ParsedTree }

/** Returns the bytes of a wasm file; the browser fetches bundled URLs, tests read files. */
export type WasmLoader = (which: "runtime" | Lang) => Promise<Uint8Array>;

interface TreeSitterModule {
  init(opts?: Record<string, unknown>): Promise<void>;
  Language: { load(bytes: Uint8Array): Promise<unknown> };
  new (): { setLanguage(l: unknown): void; parse(s: string): ParsedTree };
}

let ready: Promise<TreeSitterModule> | null = null;
const languages = new Map<Lang, Promise<unknown>>();

async function browserLoader(which: "runtime" | Lang): Promise<Uint8Array> {
  const url = which === "runtime"
    ? (await import("web-tree-sitter/tree-sitter.wasm?url")).default
    : which === "python"
      ? (await import("./grammars/tree-sitter-python.wasm?url")).default
      : (await import("./grammars/tree-sitter-scala.wasm?url")).default;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${which} reader (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

let loader: WasmLoader = browserLoader;
/** Tests (Node) pass a loader that reads the wasm files from disk. */
export function setWasmLoader(l: WasmLoader) { loader = l; }

async function runtime(): Promise<TreeSitterModule> {
  if (!ready) {
    ready = (async () => {
      const mod = (await import("web-tree-sitter")) as unknown as { default?: TreeSitterModule } & TreeSitterModule;
      const TS = (mod.default ?? mod) as TreeSitterModule;
      const wasmBinary = await loader("runtime");
      await TS.init({ wasmBinary });
      return TS;
    })();
    ready.catch(() => { ready = null; });
  }
  return ready;
}

/** A parser for one language. The first call downloads (or reads) the runtime and that grammar. */
export async function getParser(lang: Lang): Promise<CodeParser> {
  const TS = await runtime();
  if (!languages.has(lang)) {
    const p = loader(lang).then((bytes) => TS.Language.load(bytes));
    p.catch(() => languages.delete(lang));
    languages.set(lang, p);
  }
  const language = await languages.get(lang)!;
  const parser = new TS();
  parser.setLanguage(language);
  return parser;
}
