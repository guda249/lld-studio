import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo, FieldInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Memento: the originator makes a snapshot (memento) of its own state and can restore from one; a caretaker
 * keeps snapshots without looking inside. The lighter idiomatic form, an immutable value whose methods return
 * new versions of itself (each value is its own memento), is recognised with a note.
 */
const COPY_CALL = /^(tuple|list|dict|set|frozenset|sorted|copy|deepcopy|replace)$/;
const SNAP_PARAM = /(snap|memento|state|save|backup|checkpoint|restore|^m$|^s$|^cp$)/i;

const clean = (t: string | null | undefined) => (t ? t.replace(/^["']|["']$/g, "").replace(/^(Optional|Option)\[(.+)\]$/, "$2").split("|")[0].trim().replace(/^["']|["']$/g, "") : null);
const an = (w: string) => (/^[AEIOU]/i.test(w) ? `an ${w}` : `a ${w}`);
const isCtor = (mt: MethodInfo) => mt.name === "__init__" || mt.name === "<init>";

interface Candidate {
  originator: ClassInfo;
  memento: ClassInfo;
  save: MethodInfo;
  restore: MethodInfo | undefined;
  caretaker: ClassInfo | undefined;
  holder: FieldInfo | undefined;
}

function candidates(h: Helpers): Candidate[] {
  const out: Candidate[] = [];
  for (const o of h.classes) {
    for (const save of o.methods) {
      if (isCtor(save) || save.abstract) continue;
      const made = [...save.creates.map((c) => c.type), clean(save.returnType)].filter((t): t is string => !!t);
      for (const name of new Set(made)) {
        const mem = h.cls(name);
        if (!mem || mem === o || h.isA(o, mem.name)) continue;
        if (h.fieldsOfType(o, [mem.name]).length) continue; // a class that stores snapshots is the caretaker, not the originator
        const restore = o.methods.find((mt) => mt !== save && !isCtor(mt) && mt.params.some((p) => clean(p.type) === mem.name || h.ancestors(mem).includes(clean(p.type) ?? "")))
          ?? o.methods.find((mt) => mt !== save && !isCtor(mt) && !mt.abstract && mt.params.filter((p) => p.name !== "self").length === 1
            && mt.params.some((p) => p.name !== "self" && !p.type && SNAP_PARAM.test(p.name)));
        let holder: FieldInfo | undefined;
        const caretaker = h.classes.find((c) => c !== o && c !== mem && (holder = h.fieldsOfType(c, [mem.name])[0]) !== undefined);
        if (!restore && !caretaker) continue; // just a factory method, not a snapshot
        out.push({ originator: o, memento: mem, save, restore, caretaker, holder });
      }
    }
  }
  return out.sort((a, b) => (b.restore ? 2 : 0) + (b.caretaker ? 1 : 0) - ((a.restore ? 2 : 0) + (a.caretaker ? 1 : 0)));
}

/** Immutable value whose methods return a new version of itself (each value is its own memento). */
function immutableValue(h: Helpers) {
  return h.classes.find((c) => c.dataclass && c.methods.some((mt) => !isCtor(mt)
    && (clean(mt.returnType) === c.name || mt.returns.includes(c.name) || mt.copies || mt.calls.some((x) => x.method === "replace"))));
}

const rules: PatternRules = {
  slug: "memento",
  name: "Memento",
  review(m, h) {
    const out: Finding[] = [];
    const varName = (n: string) => (h.py ? h.words.snake(n) : n.charAt(0).toLowerCase() + n.slice(1));
    const best = candidates(h)[0];

    if (!best) {
      const value = immutableValue(h);
      if (value) {
        const roles = `${value.name} is an immutable value, so every version is its own memento; keeping a list of versions gives undo.`;
        return { found: true, roles, findings: [
          { id: "memento.shape", sev: "pass", title: "Memento shape found (immutable values)", text: roles },
          { id: "memento.immutable-state", sev: "note", line: value.line, title: "This is the immutable-value form of Memento",
            text: `${value.name} never changes; each method returns a new ${value.name}. That is the lighter, idiomatic form from the lesson: undo just goes back to an older value.`,
            fix: "If the state lives inside a bigger object that must keep changing in place, switch to the classic form: an originator with save() and restore() and a separate snapshot class.", lesson: "idiomatic" }
        ] };
      }
      const findings: Finding[] = [{
        id: "memento.no-shape", sev: "fail", title: "The Memento shape isn't there yet",
        text: "I couldn't find an object that saves its own state into a snapshot object and can restore itself from one.",
        fix: `Add a snapshot class (${h.py ? "a frozen dataclass" : "a case class"}) holding the state. Give the originator ${h.name("save")}() that returns a new snapshot and ${h.name("restore")}(snapshot) that puts it back. Let a separate history class just keep the snapshots.`,
        lesson: "lesson"
      }];
      // the smell: another class takes the originator and copies / writes its fields itself
      for (const c of m.classes) {
        const mt = c.methods.find((x) => !isCtor(x) && x.params.some((p) => { const t = h.cls(clean(p.type)); return !!t && t !== c; }));
        if (!mt || !c.fields.some((f) => f.origin === "collection")) continue;
        const target = clean(mt.params.find((p) => h.cls(clean(p.type)) && h.cls(clean(p.type)) !== c)!.type)!;
        findings.push({
          id: "memento.reaches-in", sev: "note", line: mt.line, title: `${c.name} copies ${target}'s state itself`,
          text: `${c.name}.${mt.name} takes ${an(target)} and saves its fields from the outside (line ${mt.line}). So ${target} has to expose its private state, and ${c.name} silently misses any field added to ${target} later.`,
          fix: `Let ${target} make its own snapshot: ${h.py ? `${target}.save() -> ${target}Snapshot` : `def save(): ${target}Snapshot`} and ${h.name("restore")}(snapshot). ${c.name} then only stores the snapshots.`,
          lesson: "problem"
        });
        break;
      }
      return { found: false, findings };
    }

    const { originator: o, memento: mem, save, restore, caretaker, holder } = best;
    const roles = `${o.name} is the originator, ${mem.name} is the memento${caretaker ? `, and ${caretaker.name} is the caretaker that keeps them` : ""}.`;
    out.push({ id: "memento.shape", sev: "pass", title: "Memento shape found", text: roles });

    // 1. the originator can restore itself
    if (restore) out.push({ id: "memento.restores", sev: "pass", title: `${o.name} can restore itself`,
      text: `${o.name}.${save.name} makes ${an(mem.name)} and ${o.name}.${restore.name} puts one back, so only ${o.name} touches its own state.` });
    else out.push({ id: "memento.no-restore", sev: "warn", line: save.line, title: `${o.name} can save but not restore`,
      text: `${o.name}.${save.name} makes ${an(mem.name)}, but no method of ${o.name} takes one back. Undo then has to set ${o.name}'s fields from outside, which breaks encapsulation.`,
      fix: h.py ? `Add def restore(self, snapshot: ${mem.name}) -> None that copies the snapshot's fields back into self.` : `Add def restore(snapshot: ${mem.name}): Unit that copies the snapshot's fields back.`,
      lesson: "lesson" });

    // 2. the memento is immutable (no method changes it)
    const setter = mem.methods.find((mt) => !isCtor(mt) && mt.assigns.length > 0);
    if (setter) out.push({ id: "memento.mutable", sev: "warn", line: setter.line, title: `${mem.name} can be changed after it is made`,
      text: `${mem.name}.${setter.name} changes ${setter.assigns[0]}. A snapshot that can change is no longer a reliable copy of the past: undo could bring back something that never existed.`,
      fix: h.py ? `Remove ${setter.name} and make ${mem.name} a @dataclass(frozen=True).` : `Remove ${setter.name} and make ${mem.name} a case class with only val fields.`,
      lesson: "lesson" });
    else {
      out.push({ id: "memento.immutable", sev: "pass", title: `${mem.name} doesn't change`,
        text: `${mem.name} has no method that changes it${mem.frozen ? (h.py ? " and is a frozen dataclass" : " and has only val fields") : ""}, so a snapshot stays a true copy of the past.` });
      if (mem.dataclass && !mem.frozen) out.push({ id: "memento.not-frozen", sev: "note", line: mem.line, title: `A snapshot could still be edited from outside`,
        text: h.py ? `${mem.name} is a dataclass without frozen=True, so the caretaker (or anyone) could write to a saved snapshot and change history.` : `${mem.name} has a var field, so a saved snapshot could be changed later.`,
        fix: h.py ? `Use @dataclass(frozen=True) for ${mem.name}.` : `Make ${mem.name}'s fields vals.`, lesson: "lesson" });
    }

    // 3. the snapshot must not share live, mutable collections with the originator (Python only: visible in the model)
    const live = o.fields.filter((f) => f.origin === "collection" && !f.classLevel && (!f.type || /^(list|dict|set|deque|defaultdict)$/.test(f.type)));
    const copies = save.copies || save.calls.some((x) => COPY_CALL.test(x.method) || /\.copy$/.test(x.method));
    if (h.py && live.length && !copies) out.push({ id: "memento.shares-live-state", sev: "warn", line: save.line, title: `${o.name}.${save.name} may share a live ${live[0].type ?? "collection"}`,
      text: `${o.name}.${live[0].name} is a mutable collection, and ${save.name} doesn't copy anything. If the snapshot keeps the same ${live[0].type ?? "collection"} object, later changes to ${o.name} also change the "saved" snapshot.`,
      fix: `Copy it when saving, for example tuple(self.${live[0].name}) or list(self.${live[0].name})${live[0].type === "dict" ? `, or tuple(self.${live[0].name}.items())` : ""}, and copy back in ${restore?.name ?? "restore"}.`,
      lesson: "code" });
    else if (h.py && live.length) out.push({ id: "memento.copies-state", sev: "pass", title: `${o.name}.${save.name} copies its collections`,
      text: `The snapshot gets its own copy, so later changes to ${o.name} don't leak into it.` });

    // 4. caretaker: stores snapshots without creating or changing them
    if (caretaker) {
      const made = h.createsOf(caretaker, [mem.name]);
      // writing param.field = ... (Scala; Python attribute writes on other objects are not in the model)
      const writesInto = (mt: MethodInfo) => mt.assigns.find((a) => { const mm = a.match(/^(\w+)\.\w+$/); return !!mm && mt.params.some((p) => p.name === mm[1]); });
      const touches = caretaker.methods.find((mt) => writesInto(mt));
      if (made.length) out.push({ id: "memento.caretaker-creates", sev: "warn", line: made[0].line, title: `${caretaker.name} makes ${mem.name} itself`,
        text: `On line ${made[0].line}, ${caretaker.name} builds ${an(mem.name)}. Then it must read ${o.name}'s state from outside; only ${o.name} should make snapshots of itself.`,
        fix: `Ask ${o.name} for one instead: call ${varName(o.name)}.${save.name}() and store what it returns.`, lesson: "lesson" });
      else if (touches) out.push({ id: "memento.caretaker-changes", sev: "warn", line: touches.line, title: `${caretaker.name} changes what's inside a snapshot`,
        text: `${caretaker.name}.${touches.name} writes into an object (${writesInto(touches)}). A caretaker should only keep snapshots and hand them back, never open them.`,
        fix: `Keep ${caretaker.name} to storing and returning ${mem.name} objects; let ${o.name}.${restore?.name ?? "restore"} decide what to do with them.`, lesson: "lesson" });
      else out.push({ id: "memento.caretaker-stores", sev: "pass", title: `${caretaker.name} only stores snapshots`,
        text: `${caretaker.name} keeps ${mem.name} objects in ${holder?.name ?? "a field"} and hands them back, without looking inside.` });
    } else {
      out.push({ id: "memento.no-caretaker", sev: "note", title: "No class keeps the snapshots",
        text: `Snapshots are kept by the client code. That's fine for a demo; a small history class (the caretaker) makes undo reusable and keeps that logic in one place.`,
        fix: h.py ? `class History: a list[${mem.name}] with push(snapshot) and pop().` : `class History: a List[${mem.name}] with push(snapshot) and pop(): Option[${mem.name}].` });
    }

    return { found: true, findings: out, roles };
  }
};

export default rules;
