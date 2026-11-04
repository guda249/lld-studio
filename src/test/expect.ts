/** Minimal assertions for the tests (run with `npm test`, see scripts/run-tests.mjs). */
export class Problems {
  list: string[] = [];
  add(msg: string) { this.list.push(msg); }
  check(cond: unknown, msg: string) { if (!cond) this.list.push(msg); }
  throwIfAny(title: string) {
    if (this.list.length) throw new Error(`${title}: ${this.list.length} problem(s)\n- ${this.list.join("\n- ")}`);
  }
}

export function eq<T>(actual: T, expected: T, msg = "") {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg ? msg + ": " : ""}expected ${e}, got ${a}`);
}

export function ok(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
