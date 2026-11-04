// Compiles every Scala file under src/content with the Scala 3 compiler in .tools/ (download it first, see README),
// then runs each program's @main and reports failures. Usage: npm run check:scala
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = process.cwd();
const tools = join(root, ".tools");
const dist = existsSync(tools) ? readdirSync(tools).filter((d) => d.startsWith("scala3-") && statSync(join(tools, d)).isDirectory()).sort().pop() : null;
if (!dist) { console.error("No Scala compiler in .tools/. See README: 'Checking the Scala code'."); process.exit(1); }
const cp = join(tools, dist, "lib", "*");
const work = join(tmpdir(), "lld-scala-check");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".scala") ? [join(d, e.name)] : []));
const files = walk(join(root, "src", "content")).sort();
writeFileSync(join(work, "files.txt"), files.join("\n"));
const java = (args) => execFileSync("java", args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
java(["-cp", cp, "dotty.tools.dotc.Main", "-usejavacp", "-d", work, join(root, "scripts", "scala", "Driver.scala"), join(root, "scripts", "scala", "Runner.scala")]);
console.log(`Compiling ${files.length} Scala files with ${dist}…`);
const compiled = java(["-cp", `${cp}:${work}`, "Driver", join(work, "files.txt"), join(work, "out")]);
const failedCompile = compiled.split("\n").filter((l) => l.startsWith("FAIL"));
console.log(compiled.split("\n").filter((l) => l.startsWith("DONE"))[0]);
if (failedCompile.length) { console.log(compiled); process.exit(1); }
console.log("Running every @main…");
const ran = java(["-cp", `${cp}:${work}`, "Runner", join(work, "files.txt"), join(work, "out"), join(work, "res")]);
const bad = ran.split("\n").filter((l) => l && !l.startsWith("ok") && !l.startsWith("Picked up"));
console.log(bad.length ? bad.join("\n") : `All ${files.length} programs ran.`);
process.exit(bad.length ? 1 : 0);
