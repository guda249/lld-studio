import type { PatternRules, Finding } from "../types";
import type { ClassInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Command: a command interface (execute, often undo) with at least two concrete commands that carry what they
 * need (a receiver and parameters), and an invoker that runs commands through the interface and, when undo
 * exists, keeps a history. Lighter idiomatic form: functions that return a no-argument function (Python lambda,
 * Scala () => Unit), recognised with a note.
 */

const UNDO = /^(undo|unexecute|un_execute|revert|rollback|roll_back|reverse|down|unapply|cancel)$/i;
const EXEC = /^(execute|run|call|__call__|apply|perform|invoke|do|do_it|doIt|up|handle)$/i;
const strip = (t: string | null | undefined) => (t ? t.replace(/^["']|["']$/g, "").split("|")[0].replace(/^(Optional|Option)\[(.+)\]$/, "$2").split("[")[0].trim() : "");

interface Shape {
  cmd: ClassInfo;
  concretes: ClassInfo[];
  invoker: ClassInfo | null;
}

/** Classes outside the command family that hold commands or receive one as a parameter and call it. */
function invokerFor(h: Helpers, family: string[], ops: string[]): ClassInfo | null {
  let best: ClassInfo | null = null, bestScore = 0;
  for (const c of h.classes) {
    if (family.includes(c.name)) continue;
    const holds = h.fieldsOfType(c, family).length > 0;
    const takes = c.methods.some((mt) => mt.params.some((p) => family.includes(strip(p.type))));
    const calls = c.methods.some((mt) => mt.calls.some((x) => x.receiver && !/^(self|this)$/.test(x.receiver) && ops.includes(x.method)));
    const score = (holds ? 2 : 0) + (takes ? 1 : 0) + (calls ? 2 : 0);
    if ((holds || takes) && score > bestScore) { best = c; bestScore = score; }
  }
  return best;
}

function findShape(h: Helpers): Shape | null {
  let best: Shape | null = null, bestScore = -1;
  for (const a of h.abstractions()) {
    const concretes = h.implementers(a.name, { concreteOnly: true });
    if (concretes.length < 2) continue;
    const family = [a.name, ...h.implementers(a.name).map((c) => c.name)];
    const ops = a.methods.filter((m) => m.abstract || !m.name.startsWith("_")).map((m) => m.name);
    const invoker = invokerFor(h, family, ops);
    const score = (invoker ? 10 : 0) + (a.methods.some((m) => EXEC.test(m.name)) ? 3 : 0) + (a.methods.some((m) => UNDO.test(m.name)) ? 3 : 0) + concretes.length;
    if (score > bestScore) { best = { cmd: a, concretes, invoker }; bestScore = score; }
  }
  return best;
}

/** Python: functions that return a lambda; Scala: functions whose result type is a function (() => Unit). */
function functionalForm(h: Helpers): string[] {
  const fs = h.model.functions.filter((f) => h.py
    ? f.returns.some((r) => r.startsWith("lambda")) || /^Callable\[\[\]/.test(f.returnType ?? "")
    : /=>/.test(f.returnType ?? ""));
  return fs.length >= 2 ? fs.map((f) => f.name) : [];
}

const rules: PatternRules = {
  slug: "command",
  name: "Command",
  review(m, h) {
    const out: Finding[] = [];
    const shape = findShape(h);

    if (!shape) {
      const fns = functionalForm(h);
      if (fns.length) {
        const roles = `${h.list(fns)} each return a small function that does one action later, so the action itself can be stored, queued and run.`;
        return { found: true, roles, findings: [
          { id: "command.shape", sev: "pass", title: "Command found (function form)", text: roles },
          { id: "command.functional", sev: "note", title: "Commands as plain functions",
            text: "This is the light form from the lesson: when a command only needs to run, a function with no arguments is enough.",
            fix: `If you need undo, a name for the history, or retries, turn each one into a class that ${h.py ? "inherits from" : "extends"} one Command ${h.words.ifaceShort} with execute and undo.`,
            lesson: "lesson" }
        ] };
      }
      const findings: Finding[] = [{
        id: "command.no-shape", sev: "fail", title: "The Command shape isn't there yet",
        text: `I couldn't find a command interface (${h.words.iface}) with an execute method and at least two command classes that implement it. In this pattern each action becomes an object, so it can be stored, queued and undone.`,
        fix: `Write a Command ${h.words.ifaceShort} with ${h.name("execute")}() (and ${h.name("undo")}() if you need undo), give each action its own class that keeps what it needs, and let an invoker class run them.`,
        lesson: "lesson"
      }];
      // the smell: the client calls the receiver's methods directly, so nothing records what was done
      const methodNames = new Set(m.classes.flatMap((c) => c.methods.map((x) => x.name)));
      const direct = m.topCalls.filter((c) => c.receiver && methodNames.has(c.method) && !c.method.startsWith("_"));
      if (direct.length >= 2) findings.push({
        id: "command.direct-calls", sev: "note", line: direct[0].line, title: "The client calls the receiver directly",
        text: `From line ${direct[0].line}, the code calls ${h.list([...new Set(direct.map((d) => `${d.receiver}.${d.method}`))].slice(0, 3))} straight away. Nothing records what was done, so there is no way to undo, queue or replay it.`,
        fix: "Wrap each of these calls in a command object, and pass the commands to an invoker that runs them and keeps a history.", lesson: "problem"
      });
      return { found: false, findings };
    }

    const { cmd, concretes, invoker } = shape;
    const names = concretes.map((c) => c.name);
    const family = [cmd.name, ...h.implementers(cmd.name).map((c) => c.name)];
    const exec = cmd.methods.find((x) => EXEC.test(x.name)) ?? cmd.methods.find((x) => x.abstract && !UNDO.test(x.name)) ?? cmd.methods[0];
    const execName = exec?.name ?? h.name("execute");
    const undo = cmd.methods.find((x) => UNDO.test(x.name));

    const roles = invoker
      ? `${cmd.name} is the command, ${h.list(names)} are concrete commands, and ${invoker.name} is the invoker that runs them.`
      : `${cmd.name} is the command, and ${h.list(names)} are concrete commands.`;
    out.push({ id: "command.shape", sev: "pass", title: "Command shape found", text: roles });

    // 1. an invoker that runs commands through the interface
    if (!invoker) out.push({
      id: "command.no-invoker", sev: "warn", line: cmd.line, title: "Nothing runs the commands for you",
      text: `The commands exist, but no class receives them as ${cmd.name} and runs them. Without an invoker the client still calls each action itself, so you can't queue, log or undo in one place.`,
      fix: `Add an invoker class with a method like ${h.name("run")}(command: ${cmd.name}) that calls command.${execName}()${undo ? " and remembers it in a history list" : ""}.`, lesson: "lesson"
    });
    else {
      const ops = cmd.methods.map((x) => x.name);
      const runs = invoker.methods.some((mt) => mt.calls.some((x) => x.receiver && !/^(self|this)$/.test(x.receiver) && ops.includes(x.method)));
      out.push(runs
        ? { id: "command.invoker-runs", sev: "pass", title: `${invoker.name} runs commands through ${cmd.name}`,
            text: `${invoker.name} only calls ${execName} on whatever ${cmd.name} it gets, so new commands work without changing it (Open/Closed).` }
        : { id: "command.invoker-never-runs", sev: "warn", line: invoker.line, title: `${invoker.name} never runs a command`,
            text: `${invoker.name} takes or stores ${cmd.name} objects but never calls ${execName} on them.`,
            fix: `Call command.${execName}() from ${invoker.name}, for example in its run method.`, lesson: "lesson" });

      // 2. the invoker must not know concrete commands
      const made = h.createsOf(invoker, names);
      const checks = invoker.methods.flatMap((mt) => mt.typeChecks.filter((t) => names.includes(t.type)));
      const typedConcrete = [...invoker.fields.filter((f) => f.type && names.includes(f.type)), ...invoker.methods.flatMap((mt) => mt.params.filter((p) => names.includes(strip(p.type))).map((p) => ({ name: p.name, line: mt.line, type: strip(p.type) })))];
      if (made.length) out.push({ id: "command.invoker-creates", sev: "warn", line: made[0].line, title: `${invoker.name} creates ${made[0].type} itself`,
        text: `On line ${made[0].line}, the invoker builds a concrete command, so it is tied to that one action.`,
        fix: `Let the client create the commands and hand them to ${invoker.name} as ${cmd.name}.`, lesson: "lesson" });
      if (checks.length) out.push({ id: "command.type-check", sev: "warn", line: checks[0].line, title: `${invoker.name} checks which command it has`,
        text: `${invoker.name} checks for ${checks[0].type} (line ${checks[0].line}). That brings the if/elif back: every new command means editing the invoker.`,
        fix: `Just call ${execName} and let each command do its own work.`, lesson: "lesson" });
      if (typedConcrete.length) out.push({ id: "command.concrete-type", sev: "warn", line: typedConcrete[0].line, title: `${invoker.name} expects a ${typedConcrete[0].type}`,
        text: `${typedConcrete[0].name} is typed as ${typedConcrete[0].type}, so the invoker only works with that one command.`,
        fix: `Type it as ${cmd.name} (Dependency Inversion).`, lesson: "lesson" });
      if (!made.length && !checks.length && !typedConcrete.length) out.push({ id: "command.invoker-decoupled", sev: "pass", title: `${invoker.name} doesn't know any concrete command`,
        text: `${invoker.name} never names ${h.list(names)}, so it works with any command.` });
    }

    // 3. undo: declared on the interface and implemented by every command
    if (undo) {
      const missing = concretes.filter((c) => !c.methods.some((x) => x.name === undo.name && !x.abstract));
      if (missing.length) out.push({ id: "command.undo-missing", sev: "warn", line: missing[0].line, title: `${h.list(missing.map((c) => c.name))} can't be undone`,
        text: `${cmd.name} promises ${undo.name}, but ${h.list(missing.map((c) => c.name))} ${missing.length > 1 ? "don't" : "doesn't"} implement it, so undo would fail for ${missing.length > 1 ? "them" : "it"}.`,
        fix: `Add ${undo.name} to ${missing[0].name}: reverse exactly what ${execName} did, remembering any old value in a field during ${execName}.`, lesson: "lesson" });
      else out.push({ id: "command.undo", sev: "pass", title: "Every command can undo itself", text: `${h.list(names)} ${names.length > 2 ? "all " : ""}implement ${undo.name}, so the invoker can reverse any of them.` });
      // 4. history for undo
      if (invoker) {
        const histName = /hist|stack|done|undo|applied|log|past/i;
        const isHistory = (f: (typeof invoker.fields)[number]) => (f.elementType && family.includes(f.elementType)) || (f.origin === "collection" && h.callsOnField(invoker, f.name).some((x) => /^(append|push|enqueue|appendleft|prepend|\+=|::=|add|insert)$/.test(x.call.method)));
        const history = invoker.fields.find((f) => isHistory(f) && histName.test(f.name)) ?? invoker.fields.find(isHistory);
        const histAssigned = invoker.methods.some((mt) => mt.assigns.some((a) => /hist|stack|done|undo|applied|log/i.test(a)));
        if (history || histAssigned) out.push({ id: "command.history", sev: "pass", title: `${invoker.name} keeps a history`,
          text: `Executed commands are remembered${history ? ` in ${history.name}` : ""}, so the last one can be undone.` });
        else out.push({ id: "command.no-history", sev: "warn", line: invoker.line, title: `${invoker.name} forgets what it ran`,
          text: `Commands can undo themselves, but ${invoker.name} doesn't keep the ones it ran, so there is nothing to undo.`,
          fix: h.py ? `Keep self._history: list[${cmd.name}] = []; append after ${execName}(), and pop().${undo.name}() to undo.`
            : `Keep private var history: List[${cmd.name}] = Nil; prepend after ${execName}(), and take the head to ${undo.name}.`, lesson: "lesson" });
      }
    } else out.push({ id: "command.no-undo", sev: "note", title: "No undo yet",
      text: `${cmd.name} has no undo method. That's fine for a job queue or a menu; add one when actions must be reversible.`,
      fix: h.py ? `@abstractmethod\ndef undo(self) -> None: ...` : "def undo(): Unit" });

    // 5. commands carry their receiver and parameters (passed in, not created)
    const own = new Set(m.classes.map((c) => c.name));
    const receivers = concretes.flatMap((c) => [...c.ctorParams.map((p) => strip(p.type)), ...c.fields.filter((f) => f.origin === "param").map((f) => f.type ?? "")])
      .concat(exec?.params.map((p) => strip(p.type)) ?? [])
      .filter((t) => own.has(t) && !family.includes(t));
    const createsReceiver = concretes.flatMap((c) => c.creates.filter((x) => own.has(x.type) && !family.includes(x.type)).map((x) => ({ cls: c.name, ...x })))[0];
    if (createsReceiver) out.push({ id: "command.creates-receiver", sev: "warn", line: createsReceiver.line, title: `${createsReceiver.cls} creates its own ${createsReceiver.type}`,
      text: `On line ${createsReceiver.line}, the command makes a new ${createsReceiver.type}, so it changes a private copy instead of the object the rest of the program uses.`,
      fix: `Pass the ${createsReceiver.type} into ${createsReceiver.cls} through ${h.words.ctorParam}.`, lesson: "lesson" });
    else if (receivers.length) out.push({ id: "command.receiver", sev: "pass", title: "Commands are given the object they change",
      text: `The commands get the object they change (${h.list([...new Set(receivers)])}) from outside, so many commands can work on the same one.` });
    else if (!exec?.params.some((p) => !/^(self|this)$/.test(p.name)) && concretes.every((c) => !c.ctorParams.length && !c.fields.some((f) => !f.classLevel))) out.push({ id: "command.carries-nothing", sev: "note", line: concretes[0].line,
      title: "The commands carry no data",
      text: `${h.list(names)} take nothing in. A command usually remembers its receiver and parameters, so it can run later exactly as it was asked.`,
      fix: `Give each command ${h.words.ctorParam} for the object it changes and the values it needs.` });

    return { found: true, findings: out, roles };
  }
};

export default rules;
