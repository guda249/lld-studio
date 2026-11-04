import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo, MethodInfo } from "../model";

/**
 * Singleton: exactly one instance and one way to reach it. Recognised forms:
 * Python __new__ with a class-level _instance, Python get_instance()/instance() classmethod, a Scala `object`,
 * and a Scala class with a private constructor plus a companion object holding the one instance.
 */
type Form = "py-new" | "py-accessor" | "sc-object" | "sc-companion";

const instanceField = (c: ClassInfo): FieldInfo | undefined =>
  c.fields.find((f) => f.classLevel && (f.type === c.name || f.created.includes(c.name) || /instance/i.test(f.name)));

const usesThreads = (calls: { method: string }[]) => calls.some((x) => /^(Thread|ThreadPoolExecutor|Future|submit|start_new_thread)$/.test(x.method));

const rules: PatternRules = {
  slug: "singleton",
  name: "Singleton",
  review(m, h) {
    const out: Finding[] = [];
    const py = h.py;
    const refs = (name: string) => m.classes.filter((c) => c.name !== name && (c.creates.some((x) => x.type === name)
      || c.methods.some((mt) => mt.calls.some((x) => x.receiver === name || (x.receiver ?? "").startsWith(name + ".")))));

    let single: ClassInfo | undefined, form: Form | undefined, accessor: MethodInfo | undefined, inst: FieldInfo | undefined;
    for (const c of m.classes) {
      if (h.isAbstraction(c) || c.kind === "enum") continue;
      const f = instanceField(c);
      if (py) {
        const newM = h.method(c, "__new__");
        if (newM && f) { single = c; form = "py-new"; accessor = newM; inst = f; break; }
        const acc = c.methods.find((mt) => mt.static && f && mt.returns.some((r) => r.endsWith("." + f.name) || r === f.name));
        if (acc && f) { single = c; form = "py-accessor"; accessor = acc; inst = f; break; }
      } else if (c.kind === "object") {
        if (!c.methods.length && !c.fields.length) continue;
        // prefer the object other code actually uses
        if (!single || form !== "sc-object" || refs(c.name).length > refs(single.name).length) { single = c; form = "sc-object"; accessor = undefined; inst = undefined; }
      } else if (c.kind === "class" || c.kind === "case") {
        const acc = c.methods.find((mt) => mt.static && (mt.creates.some((x) => x.type === c.name) || (f && mt.returns.includes(f.name))));
        if ((f && (f.created.includes(c.name) || f.type === c.name)) || acc) {
          if (!single || form === "sc-object") { single = c; form = "sc-companion"; accessor = acc; inst = f; }
        }
      }
    }

    if (!single || !form) {
      const findings: Finding[] = [{
        id: "singleton.no-shape", sev: "fail", title: "The Singleton shape isn't there yet",
        text: py
          ? "I couldn't find a class that hands out one shared instance: a class-level _instance plus __new__ (or a get_instance() classmethod) that creates it once and then returns the same object."
          : "I couldn't find a Scala object, or a class with a private constructor and a companion object that holds its one instance.",
        fix: py
          ? "Add _instance = None on the class and a __new__(cls) that creates the object only when _instance is None, then always returns cls._instance."
          : `Turn the class into an object (object ${m.classes.find((c) => c.kind === "class")?.name ?? "AppConfig"}: ...). Scala then creates exactly one instance for you.`,
        lesson: "lesson"
      }];
      const injected = m.classes.find((c) => m.classes.some((o) => o !== c && o.ctorParams.some((p) => (p.type ?? "").replace(/["']/g, "") === c.name)));
      const counts = new Map<string, number>();
      for (const cr of [...m.topCreates, ...m.classes.flatMap((c) => c.creates)]) counts.set(cr.type, (counts.get(cr.type) ?? 0) + 1);
      const many = [...counts.entries()].filter(([t]) => h.cls(t)).sort((a, b) => b[1] - a[1])[0];
      if (!injected && many && many[1] >= 2) {
        const line = [...m.topCreates, ...m.classes.flatMap((c) => c.creates)].find((x) => x.type === many[0])?.line;
        findings.push({ id: "singleton.many-instances", sev: "note", line, title: `${many[0]} is created ${many[1]} times`,
          text: `Each ${many[0]}() is a separate object (first at line ${line}), so each one loads its own copy and they can disagree. That is the smell Singleton removes.`,
          fix: `Create ${many[0]} once and share that one object with everyone who needs it.`, lesson: "problem" });
      }
      if (injected) {
        const holder = m.classes.find((o) => o !== injected && o.ctorParams.some((p) => (p.type ?? "").replace(/["']/g, "") === injected.name))!;
        findings.push({ id: "singleton.composition-root", sev: "note", line: holder.line, title: `${injected.name} is passed in, not fetched`,
          text: `${holder.name} receives a ${injected.name} through its constructor. If you create ${injected.name} once at startup and hand that one object to everyone, you get one instance without a global: the lighter alternative the lesson recommends. The review can't see that only one is created, so it doesn't count as the pattern here.`,
          fix: py ? `To practise the pattern itself, give ${injected.name} a class-level _instance and a __new__ that returns it.` : `To practise the pattern itself, make the production ${injected.name} an object.`, lesson: "code" });
      }
      return { found: false, findings };
    }

    const how = form === "py-new" ? `${single.name}() always returns the same object (from __new__)`
      : form === "py-accessor" ? `${single.name}.${accessor!.name}() returns the one shared instance`
      : form === "sc-object" ? `as a Scala object it is created exactly once by the language`
      : `its companion object holds the one instance${accessor ? ` and ${single.name}.${accessor.name} hands it out` : ""}`;
    const roles = `${single.name} is the singleton, and ${how}.`;
    out.push({ id: "singleton.shape", sev: "pass", title: "Singleton shape found", text: roles });

    // 1. one way in: nobody else can make a second instance
    if (form === "py-new") {
      out.push({ id: "singleton.one-instance", sev: "pass", title: `${single.name}() can't make a second object`,
        text: `__new__ returns the stored ${inst!.name} after the first call, so every ${single.name}() is the same object.` });
      const init = h.method(single, "__init__");
      if (init && (init.assigns.length || init.calls.length || init.creates.length)) out.push({
        id: "singleton.init-reruns", sev: "warn", line: init.line, title: `${single.name}.__init__ runs on every ${single.name}() call`,
        text: `Python calls __init__ each time ${single.name}() is used, even when __new__ returns the existing object. The setup in __init__ (line ${init.line}) runs again and resets the shared state.`,
        fix: `Move the one-time setup into __new__, inside the "if cls.${inst!.name} is None" block, and remove __init__.`, lesson: "lesson" });
    } else if (form === "py-accessor") {
      const bypass = [...m.topCreates, ...m.classes.filter((c) => c !== single).flatMap((c) => c.creates)].find((x) => x.type === single!.name);
      if (bypass) out.push({ id: "singleton.bypassed", sev: "warn", line: bypass.line, title: `${single.name}() is called directly`,
        text: `Line ${bypass.line} calls ${single.name}() instead of ${single.name}.${accessor!.name}(), which makes a second object. Python can't make a constructor private, so nothing stops this.`,
        fix: `Use ${single.name}.${accessor!.name}() everywhere, or move the creation into __new__ so ${single.name}() itself always returns the one instance.`, lesson: "lesson" });
      else out.push({ id: "singleton.one-access-point", sev: "pass", title: `Everyone goes through ${single.name}.${accessor!.name}()`,
        text: `No code calls ${single.name}() directly, so there is one way in. (Python can't make a constructor private; __new__ can enforce it if you need to.)` });
    } else if (form === "sc-object") {
      out.push({ id: "singleton.one-instance", sev: "pass", title: `${single.name} is a Scala object`,
        text: `An object has no public constructor, so a second ${single.name} can't exist.` });
    } else {
      const bypass = [...m.topCreates, ...m.classes.filter((c) => c !== single).flatMap((c) => c.creates)].find((x) => x.type === single!.name);
      if (!single.privateCtor) out.push({ id: "singleton.public-ctor", sev: "warn", line: bypass?.line ?? single.line, title: `${single.name}'s constructor is public`,
        text: `Anyone can write ${single.name}(...) and get a second instance${bypass ? ` (line ${bypass.line} does)` : ""}, so "only one" is a promise, not a rule.`,
        fix: `Declare it as class ${single.name} private (...) so only its companion object can create it, or make ${single.name} an object.`, lesson: "lesson" });
      else out.push({ id: "singleton.one-instance", sev: "pass", title: `${single.name}'s constructor is private`,
        text: `Only the companion object can create ${single.name}, so there is exactly one.` });
    }

    // 2. thread safety of lazy creation
    if (form === "py-new" || form === "py-accessor") {
      const hasLock = single.fields.some((f) => /lock/i.test(f.name));
      const threaded = usesThreads([...m.topCalls, ...m.classes.flatMap((c) => c.methods.flatMap((x) => x.calls))]);
      if (hasLock) out.push({ id: "singleton.thread-safe", sev: "pass", title: "Creation is guarded by a lock",
        text: "Two threads arriving at the same moment can't both create an instance." });
      else out.push({ id: "singleton.not-thread-safe", sev: threaded ? "warn" : "note", line: accessor!.line, title: "Two threads could create two instances",
        text: `${accessor!.name}() checks "is ${inst!.name} None?" and then creates the object. If two threads ask at the same moment, both can see None and each create one.${threaded ? " This program uses threads, so it can happen here." : " This only matters if your program uses threads."}`,
        fix: `Add _lock = threading.Lock() on the class and create the instance inside "with cls._lock:", checking None again inside the lock (double-checked locking).`, lesson: "code" });
    } else if (form === "sc-object") {
      out.push({ id: "singleton.thread-safe", sev: "pass", title: "Creation is thread-safe",
        text: "The JVM creates an object once, on first use, even when several threads touch it at the same time." });
    }

    // 3. hidden global state: who reaches for it directly
    const users = refs(single.name).map((c) => c.name);
    out.push({ id: "singleton.global-state", sev: "note", title: "A singleton is global state",
      text: `${users.length ? `${h.list(users)} reach${users.length === 1 ? "es" : ""} for ${single.name} directly. ` : ""}Code that grabs a singleton hides that dependency, and tests can't easily swap in a fake ${single.name}.`,
      fix: `Where you can, create the one instance at startup and pass it in through ${h.words.ctorParam} (a composition root). You keep one instance without a hidden global.`, lesson: "when" });

    return { found: true, findings: out, roles };
  }
};

export default rules;
