import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Builder: a separate class that collects settings through two or more step methods (usually chainable, returning
 * self / this or a changed copy) and a build method that creates the product. Also recognises the idiomatic form:
 * a dataclass / case class with defaults, changed with replace() / copy().
 */

const SKIP = /^(__\w+__|<init>|<module>|<top>|toString|equals|hashCode)$/;
const BUILD = /^(build|create|make|result|get_?result|getResult|done|finish|to_\w+|to[A-Z]\w*)$/;
const CHECK = /Error$|Exception$|^(require|assert|assume|ensuring|check|validate\w*|_validate\w*)$/;

const unquote = (t: string | null) => (t ?? "").trim().replace(/^["']|["']$/g, "").split("[")[0];

interface Candidate { builder: ClassInfo; product: ClassInfo; build: MethodInfo; steps: MethodInfo[] }

function isStep(b: ClassInfo, mt: MethodInfo): boolean {
  if (SKIP.test(mt.name) || mt.abstract) return false;
  return mt.returnsSelf || unquote(mt.returnType) === b.name || mt.returns.includes("copy") || mt.assigns.length > 0;
}

function findCandidate(h: Helpers): Candidate | null {
  let best: Candidate | null = null;
  for (const b of h.classes) {
    if (b.kind === "interface") continue;
    const builds = b.methods.filter((mt) => !SKIP.test(mt.name) && mt.creates.some((c) => c.type !== b.name && h.cls(c.type)));
    if (!builds.length) continue;
    const build = builds.find((mt) => BUILD.test(mt.name)) ?? builds.find((mt) => !isStep(b, mt)) ?? builds[0];
    const product = h.cls(build.creates.find((c) => c.type !== b.name && h.cls(c.type))!.type)!;
    const steps = b.methods.filter((mt) => mt !== build && isStep(b, mt));
    if (steps.length < 2) continue;
    if (!best || steps.length > best.steps.length) best = { builder: b, product, build, steps };
  }
  return best;
}

/** Idiomatic form: a dataclass / case class with several fields, defaults, and changed copies. */
function findValueForm(h: Helpers): ClassInfo | null {
  const copied = h.model.topCalls.some((c) => c.method === "copy" || c.method === "replace");
  return h.classes.find((c) => c.dataclass && c.ctorParams.length >= 3
    && (copied || c.fields.some((f) => !f.classLevel && f.origin === "other"))) ?? null;
}

const rules: PatternRules = {
  slug: "builder",
  name: "Builder",
  review(m, h) {
    const out: Finding[] = [];
    const cand = findCandidate(h);

    if (!cand) {
      const value = findValueForm(h);
      if (value) {
        const roles = `${value.name} is built in one call with named arguments and defaults, and changed copies are made with ${h.py ? "replace()" : "copy()"}.`;
        out.push({ id: "builder.shape", sev: "pass", title: "Builder (named-arguments form) found", text: roles });
        out.push({
          id: "builder.value-form", sev: "note", title: "You used the lighter idiomatic form",
          text: `Named and default arguments already solve the "which argument is which" problem, so a separate builder class isn't needed for ${value.name}.`,
          fix: "Keep it. Add a builder class only if the object is put together over many steps, in several places, or by a director.",
          lesson: "lesson"
        });
        const checks = value.methods.some((mt) => mt.calls.some((c) => CHECK.test(c.method)));
        // (Scala: require(...) in a class body is not in the class model, so only Python gets the reminder.)
        if (checks || h.py) out.push(checks
          ? { id: "builder.value-validates", sev: "pass", title: `${value.name} checks its own rules`, text: `Rules that span fields are checked ${h.py ? "in __post_init__" : "with require(...)"}, so an invalid ${value.name} can't exist.` }
          : { id: "builder.value-no-check", sev: "note", line: value.line, title: `I couldn't see a check in ${value.name}`,
              text: `If some field combinations are invalid, check them where the object is made, so a bad ${value.name} is never created.`,
              fix: h.py ? "Add a __post_init__ that raises ValueError for invalid combinations." : "Add require(condition, \"message\") in the class body." });
        return { found: true, findings: out, roles };
      }
      out.push({
        id: "builder.no-shape", sev: "fail", title: "The Builder shape isn't there yet",
        text: "I couldn't find a builder class: one with two or more step methods that set parts of the object, plus a build method that creates the finished object.",
        fix: `Add a separate builder class that stores the settings with defaults, gives each setting its own step method that returns ${h.words.self}, and ends with build(), which checks the rules and creates the object.`,
        lesson: "lesson"
      });
      const long = m.classes.filter((c) => c.ctorParams.length >= 5).sort((a, b) => b.ctorParams.length - a.ctorParams.length)[0];
      if (long) out.push({
        id: "builder.long-constructor", sev: "note", line: long.line, title: `${long.name} takes ${long.ctorParams.length} constructor arguments`,
        text: `A long list of positional arguments is easy to get wrong: two values of the same type can be swapped and nothing complains. That is the smell Builder fixes.`,
        fix: `Create ${long.name} through a builder with one named step per setting, or ${h.py ? "use keyword arguments with defaults (a dataclass)" : "use a case class with default and named arguments"}.`,
        lesson: "problem"
      });
      return { found: false, findings: out };
    }

    const { builder, product, build, steps } = cand;
    const stepNames = steps.map((s) => s.name + "()");
    const roles = `${builder.name} is the builder with steps ${h.list(stepNames.slice(0, 4))}${stepNames.length > 4 ? " and more" : ""}, and ${build.name}() makes the product, ${product.name}.`;
    out.push({ id: "builder.shape", sev: "pass", title: "Builder shape found", text: roles });

    // 1. steps are chainable
    const fluent = (mt: MethodInfo) => mt.returnsSelf || unquote(mt.returnType) === builder.name || mt.returns.includes("copy")
      || mt.calls.some((c) => (c.receiver === null || /^(self|this)$/.test(c.receiver)) && steps.some((s) => s.name === c.method && s !== mt) && mt.returns.some((r) => r.includes(c.method)));
    const notFluent = steps.filter((s) => !fluent(s));
    if (notFluent.length) {
      const s = notFluent[0];
      out.push({
        id: "builder.step-not-fluent", sev: "warn", line: s.line, title: `${builder.name}.${s.name}() doesn't return the builder`,
        text: `${notFluent.length === 1 ? `${s.name}()` : h.list(notFluent.map((x) => x.name + "()"))} ${notFluent.length === 1 ? "sets" : "set"} a value but return${notFluent.length === 1 ? "s" : ""} nothing, so the calls can't be chained and the client has to repeat the builder's name on every line.`,
        fix: h.py ? `End ${s.name}() with return self and annotate it -> "${builder.name}".` : `End ${s.name}() with this and declare its type as ${builder.name}.`,
        lesson: "lesson"
      });
    } else out.push({ id: "builder.fluent-steps", sev: "pass", title: "Steps can be chained", text: `Every step returns the builder, so the client reads like a sentence: ${builder.name}(...).${steps[0].name}(...).${build.name}().` });

    // 2. build() checks the rules before creating the product
    const checks = build.calls.some((c) => CHECK.test(c.method)) || build.raises.length > 0 || build.branches.length > 0 || build.typeChecks.length > 0;
    if (checks) out.push({ id: "builder.build-validates", sev: "pass", title: `${build.name}() checks the rules`, text: `Rules that span several settings are checked once, in ${build.name}(), so an invalid ${product.name} is never created.` });
    else out.push({
      id: "builder.no-validation", sev: "warn", line: build.line, title: `${build.name}() doesn't check anything`,
      text: `${build.name}() creates ${product.name} straight away. The builder is the one place where rules that span several settings can be checked before the object exists.`,
      fix: h.py ? `In ${build.name}(), raise ValueError for invalid combinations before returning ${product.name}(...).` : `In ${build.name}(), add require(condition, "message") (or throw IllegalArgumentException) before creating ${product.name}.`,
      lesson: "lesson"
    });

    // 3. build() returns the product, not the builder
    if (build.returnsSelf) out.push({
      id: "builder.build-returns-self", sev: "warn", line: build.line, title: `${build.name}() returns the builder`,
      text: `${build.name}() should hand back the finished ${product.name}, not the builder.`,
      fix: `Return the new ${product.name}(...) from ${build.name}().`, lesson: "lesson"
    });

    // 4. the product is immutable once built
    const setters = product.methods.filter((mt) => !SKIP.test(mt.name) && mt.name !== "__init__" && mt.assigns.length > 0);
    if (setters.length) out.push({
      id: "builder.product-mutable", sev: "warn", line: setters[0].line, title: `${product.name} can still be changed after build()`,
      text: `${product.name}.${setters[0].name}() changes a field, so the rules ${build.name}() checked can be broken later.`,
      fix: h.py ? `Remove the setter and make ${product.name} a @dataclass(frozen=True); changes go through the builder.` : `Remove the setter and make ${product.name} a case class with vals; changes go through the builder or copy().`,
      lesson: "lesson"
    });
    else if (product.dataclass && product.frozen) out.push({ id: "builder.product-immutable", sev: "pass", title: `${product.name} is a value object`, text: `${product.name} is a ${h.py ? "frozen dataclass" : "case class with only val fields"} with no setters, so once built it stays valid.` });
    else if (product.dataclass) out.push({
      id: "builder.product-not-frozen", sev: "note", line: product.line, title: `${product.name} can still be edited field by field`,
      text: h.py ? `${product.name} is a dataclass without frozen=True, so any code can write order.${product.fields[0]?.name ?? "field"} = ... after build() checked it.` : `${product.name} has a var field, so it can change after build() checked it.`,
      fix: h.py ? `Use @dataclass(frozen=True) for ${product.name}.` : `Make every field of ${product.name} a val.`, lesson: "lesson"
    });

    // 5. the builder starts from sensible defaults
    const defaults = builder.fields.filter((f) => !f.classLevel && f.origin !== "param");
    if (defaults.length) out.push({ id: "builder.defaults", sev: "pass", title: "The builder starts with defaults", text: `${builder.name} sets ${defaults.length} default value${defaults.length > 1 ? "s" : ""}, so the client only sets what it needs.` });

    // 6. the client bypasses the builder
    const direct = m.topCreates.find((c) => c.type === product.name) ?? h.classes.filter((c) => c !== builder && c !== product)
      .flatMap((c) => c.creates).find((c) => c.type === product.name);
    if (direct) out.push({
      id: "builder.product-created-directly", sev: "warn", line: direct.line, title: `${product.name} is also created without the builder`,
      text: `Line ${direct.line} calls ${product.name}(...) directly, so the checks in ${build.name}() are skipped there.`,
      fix: `Create it through ${builder.name}(...)...${build.name}() instead${h.py ? "" : ", and consider making the constructor private to the builder"}.`,
      lesson: "lesson"
    });

    return { found: true, findings: out, roles, suppress: [] };
  }
};

export default rules;
