// Runs every src/**/*.test.ts with Vite (already a dependency), so tests need no extra test framework.
// Each test file exports `tests`: { "name": () => void | Promise<void> }. Usage: npm test [-- filter]
import { createServer } from "vite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filter = process.argv[2] ?? "";
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".test.ts") ? [join(dir, e.name)] : []);
const files = walk("src").sort();
const server = await createServer({ root, logLevel: "error", appType: "custom", cacheDir: "node_modules/.vite-test", optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true, hmr: false } });

// the code reader loads its WebAssembly files from disk here (the browser fetches them)
const parserMod = await server.ssrLoadModule("/src/review/parser.ts");
parserMod.setWasmLoader(async (which) => new Uint8Array(readFileSync(which === "runtime"
  ? join(root, "node_modules/web-tree-sitter/tree-sitter.wasm")
  : join(root, `src/review/grammars/tree-sitter-${which}.wasm`))));

let passed = 0, failed = 0;
for (const file of files) {
  const mod = await server.ssrLoadModule("/" + relative(root, join(root, file)).replace(/\\/g, "/"));
  for (const [name, fn] of Object.entries(mod.tests ?? {})) {
    if (filter && !name.includes(filter) && !file.includes(filter)) continue;
    try {
      await fn();
      passed++;
      console.log(`  ok    ${name}`);
    } catch (e) {
      failed++;
      console.log(`  FAIL  ${name}\n        ${String(e && e.message ? e.message : e).split("\n").join("\n        ")}`);
    }
  }
}
await server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
