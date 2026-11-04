import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: direct calls on a Document become command objects run by an Editor with a history ---------- */

const story: DiagramSpec = {
  label: "App asks the Editor to run commands; Editor keeps a history of Command objects; InsertText and DeleteLastChars implement Command and change the Document; Uppercase is added at the end.",
  width: 920,
  height: 480,
  portraitWidth: 340,
  portraitHeight: 680,
  nodes: [
    { id: "toolbar", kind: "client", name: "Toolbar", at: { x: 20, y: 270, w: 150, h: 54 }, portrait: { x: 8, y: 610, w: 104, h: 54 } },
    { id: "shortcut", kind: "client", name: "Shortcut", at: { x: 20, y: 340, w: 150, h: 54 }, portrait: { x: 118, y: 610, w: 104, h: 54 } },
    { id: "menu", kind: "client", name: "Menu item", at: { x: 20, y: 410, w: 150, h: 54 }, portrait: { x: 228, y: 610, w: 104, h: 54 } },
    { id: "doc", kind: "concrete", name: "Document", members: [],
      at: { x: 300, y: 350, w: 210 }, portrait: { x: 70, y: 500, w: 200 } },
    { id: "app", kind: "client", name: "App", hidden: true, at: { x: 20, y: 40, w: 110, h: 56 }, portrait: { x: 8, y: 8, w: 100, h: 56 } },
    { id: "editor", kind: "concrete", name: "Editor", key: true, hidden: true,
      members: ["- history: list[Command]", "+ run(cmd)", "+ undo()"],
      scalaMembers: ["- history: List[Command]", "+ run(cmd)", "+ undo()"],
      at: { x: 170, y: 20, w: 220, h: 114 }, portrait: { x: 120, y: 8, w: 212, h: 114 } },
    { id: "iface", kind: "interface", name: "Command", key: true, hidden: true, members: ["+ execute()", "+ undo()"],
      at: { x: 500, y: 20, w: 190 }, portrait: { x: 8, y: 176, w: 180 } },
    { id: "upper", kind: "concrete", name: "Uppercase", hidden: true, members: ["+ execute()", "+ undo()"],
      at: { x: 712, y: 26, w: 168 }, portrait: { x: 200, y: 182, w: 132 } },
    { id: "ins", kind: "concrete", name: "InsertText", key: true, hidden: true, members: ["- text", "+ execute()", "+ undo()"],
      at: { x: 430, y: 190, w: 190 }, portrait: { x: 8, y: 330, w: 158 } },
    { id: "del", kind: "concrete", name: "DeleteLastChars", key: true, hidden: true,
      members: ["- count", "- deleted", "+ execute()", "+ undo()"],
      at: { x: 650, y: 190, w: 230, h: 134 }, portrait: { x: 174, y: 330, w: 158, h: 134 } }
  ],
  edges: [
    { id: "t1", from: "toolbar", to: "doc", type: "dependency", route: "straight" },
    { id: "t2", from: "shortcut", to: "doc", type: "dependency", route: "straight" },
    { id: "t3", from: "menu", to: "doc", type: "dependency", route: "straight" },
    { id: "uses", from: "app", to: "editor", type: "association", hidden: true },
    { id: "holds", from: "editor", to: "iface", type: "association", hidden: true },
    { id: "r-ins", from: "ins", to: "iface", type: "realization", hidden: true },
    { id: "r-del", from: "del", to: "iface", type: "realization", hidden: true },
    { id: "r-upper", from: "upper", to: "iface", type: "realization", hidden: true, route: "straight" },
    { id: "c-ins", from: "ins", to: "doc", type: "association", hidden: true, route: "straight" },
    { id: "c-del", from: "del", to: "doc", type: "association", hidden: true, route: "straight" }
  ],
  badges: [
    { id: "warn", text: "No history: undo is impossible", tone: "warn", near: "doc" },
    { id: "ok", text: "0 lines changed", tone: "ok", near: "editor", place: "below" }
  ]
};

const RUN = (cmd: string) => ["editor", "iface", cmd, "doc"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every trigger calls the document directly",
      what: "A toolbar button, a shortcut and a menu item each call insert() or delete_last() on the Document. The text changes, but nothing records what was done.",
      why: "With no record of the actions there is no undo, no redo, no macro and no log. Every trigger is also tied to the Document's methods.",
      say: {
        what: "Here's the problem. A toolbar button, a keyboard shortcut and a menu item each call the document directly. The text changes, but nothing records what was done.",
        why: "With no record of the actions, there's no undo, no redo, no macros and no log. And every trigger is tied to the document's methods."
      },
      code: "problem",
      lines: { python: [14, 15, 16, 18, 19], scala: [9, 10, 11, 13, 14] },
      actions: [
        { members: "doc", stagger: true, lines: ["+ insert(s)", "+ delete_last(n)"], scalaLines: ["+ insert(s)", "+ deleteLast(n)"] },
        { call: ["toolbar", "doc"], label: 'insert("Hello")' },
        { call: ["shortcut", "doc"], label: 'insert(" world")' },
        { call: ["menu", "doc"], label: "delete_last(6)", scalaLabel: "deleteLast(6)" },
        { flash: "doc" },
        { shake: "doc", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Turn each action into an object",
      what: "Each action becomes a command object that stores its own parameters: InsertText keeps the text, DeleteLastChars keeps the count and, later, the deleted text.",
      why: "A request that is an object can be stored, queued, logged and reversed. Each class has one job (Single Responsibility).",
      say: {
        what: "Each action becomes an object that stores its own details. Insert text keeps the text. Delete last chars keeps the count, and later the text it deleted.",
        why: "Once a request is an object, it can be stored, queued, logged and reversed. And each class has one job. That's single responsibility."
      },
      code: "main",
      lines: { python: [17, 18, 19, 29, 30, 31, 32], scala: [8, 12, 13] },
      actions: [
        { hide: ["warn"] },
        { hide: ["t1", "t2", "t3"], together: true },
        { dim: ["toolbar", "shortcut", "menu"], together: true },
        { spawn: ["ins", "del"], from: "doc" },
        { members: "doc", lines: ['text = ""'] },
        { show: ["c-ins", "c-del"] }
      ]
    },
    {
      title: "One Command interface, one invoker with a history",
      what: "Both classes implement Command with execute() and undo(). The Editor runs any Command and pushes it onto its history list.",
      why: "The Editor knows only the interface, never InsertText or the Document (Dependency Inversion). That is what lets one undo button work for every action.",
      say: {
        what: "Both classes implement one command interface, with execute and undo. The editor runs any command, and pushes it onto its history.",
        why: "The editor only knows the interface, never the concrete commands or the document. That's dependency inversion, and it's what lets one undo button work for every action."
      },
      code: "main",
      lines: { python: [9, 10, 11, 13, 14, 43, 44, 45, 47, 48, 49], scala: [4, 5, 6, 21, 22, 24, 25, 26] },
      actions: [
        { hide: ["toolbar", "shortcut", "menu"] },
        { show: ["iface"], together: true },
        { show: ["r-ins", "r-del"] },
        { show: ["editor"] },
        { show: ["holds"] },
        { show: ["app", "uses"] }
      ]
    },
    {
      title: "Run a command",
      what: 'App hands InsertText(doc, "Hello") to the Editor. The Editor calls execute(), which changes the Document, then stores the command.',
      why: "The invoker never knows what the command does. It just runs it and remembers it.",
      say: {
        what: "The app hands an insert text command for Hello to the editor. The editor calls execute, which changes the document, and then stores the command in its history.",
        why: "The invoker never knows what the command actually does. It just runs it, and remembers it."
      },
      code: "main",
      lines: { python: [21, 22, 47, 48, 49, 57], scala: [9, 24, 25, 26, 37] },
      actions: [
        { call: ["app", "editor"], label: 'run(InsertText("Hello"))' },
        { ring: "ins", caption: "running" },
        { call: RUN("ins"), label: "execute()" },
        { members: "doc", lines: ['text = "Hello"'] },
        { tag: "editor", text: "history: 1" }
      ]
    },
    {
      title: "More commands; the delete remembers what it removed",
      what: 'InsertText(" world") runs, then DeleteLastChars(6). Before deleting, the command saves " world" so it can put it back.',
      why: "Each command carries exactly what it needs to reverse itself. No copy of the whole document is needed.",
      say: {
        what: "Next, insert text adds world, and then delete last chars removes six characters. Before deleting, the command saves the text it removes, so it can put it back.",
        why: "Each command carries exactly what it needs to reverse itself. There's no need to copy the whole document."
      },
      code: "main",
      lines: { python: [34, 35, 36, 37, 58, 59, 60], scala: [15, 16, 17, 38, 39, 40] },
      actions: [
        { call: RUN("ins"), label: 'execute(" world")' },
        { members: "doc", lines: ['text = "Hello world"'] },
        { tag: "editor", text: "history: 2" },
        { ring: "del" },
        { call: RUN("del"), label: "execute()" },
        { tag: "del", text: 'deleted = " world"' },
        { members: "doc", lines: ['text = "Hello"'] },
        { tag: "editor", text: "history: 3" }
      ]
    },
    {
      title: "Undo pops the last command",
      what: "App calls undo(). The Editor pops DeleteLastChars from its history and calls its undo(), which puts \" world\" back.",
      why: "Undo works for every action the same way, because every command knows how to reverse itself.",
      say: {
        what: "Now the app calls undo. The editor pops the delete command off its history and calls its undo, which puts world back.",
        why: "Undo works the same way for every action, because every command knows how to reverse itself."
      },
      code: "main",
      lines: { python: [39, 40, 51, 52, 53, 61, 62], scala: [19, 28, 29, 30, 31, 41, 42] },
      actions: [
        { call: ["app", "editor"], label: "undo()" },
        { ring: "del", caption: "popped" },
        { call: RUN("del"), label: "undo()" },
        { members: "doc", lines: ['text = "Hello world"'] },
        { tag: "editor", text: "history: 2" },
        { tag: "del", text: null, together: true }
      ]
    },
    {
      title: "Undo again, in reverse order",
      what: "The next undo() pops InsertText(\" world\"), which cuts its own text off the end. The document reads \"Hello\" again.",
      why: "The history is a stack: the newest command is reversed first, so the document steps back exactly the way it came.",
      say: {
        what: "The next undo pops the insert of world, which cuts its own text off the end. The document reads Hello again.",
        why: "The history is a stack. The newest command is reversed first, so the document steps back exactly the way it came."
      },
      code: "main",
      lines: { python: [24, 25, 26, 63, 64], scala: [10, 43, 44] },
      actions: [
        { call: ["app", "editor"], label: "undo()" },
        { ring: "ins", caption: "popped" },
        { call: RUN("ins"), label: "undo()" },
        { members: "doc", lines: ['text = "Hello"'] },
        { tag: "editor", text: "history: 1" }
      ]
    },
    {
      title: "Add a new action without touching the Editor",
      what: "An Uppercase command implements execute() and undo() and plugs straight in. Buttons, shortcuts and menus can all hand it to the same Editor.",
      why: "Editor: 0 lines changed. Run, history and undo already work for it (Open/Closed).",
      say: {
        what: "Finally, a new uppercase command implements execute and undo, and plugs straight in. Buttons, shortcuts and menus can all hand it to the same editor.",
        why: "The editor needs zero changes. Run, history and undo already work for it. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [9, 10, 11, 13, 14], scala: [4, 5, 6] },
      actions: [
        { ring: null },
        { tag: "editor", text: null, together: true },
        { show: ["upper"] },
        { show: ["r-upper"] },
        { show: ["ok"] },
        { pulse: "editor", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples ---------- */

/* --- smart-home remote --- */
const remoteDiagram: DiagramSpec = {
  label: "RemoteControl holds Command slots and a history; LightOn and FanSpeed implement Command and switch a Light and a Fan.",
  width: 760, height: 420, portraitWidth: 340, portraitHeight: 540,
  nodes: [
    { id: "client", kind: "client", name: "remoteDemo", hidden: true, at: { x: 16, y: 20, w: 130, h: 54 }, portrait: { x: 8, y: 8, w: 140, h: 54 } },
    { id: "remote", kind: "concrete", name: "RemoteControl", key: true, hidden: true,
      members: ["- slots", "- history", "+ press(button)", "+ press_undo()"],
      scalaMembers: ["- slots", "- history", "+ press(button)", "+ pressUndo()"],
      at: { x: 170, y: 14, w: 200, h: 134 }, portrait: { x: 160, y: 8, w: 172, h: 134 } },
    { id: "iface", kind: "interface", name: "Command", key: true, hidden: true, members: ["+ execute()", "+ undo()"],
      at: { x: 410, y: 14, w: 170 }, portrait: { x: 8, y: 170, w: 170 } },
    { id: "lighton", kind: "concrete", name: "LightOn", hidden: true, members: ["+ execute()", "+ undo()"],
      at: { x: 320, y: 200, w: 150 }, portrait: { x: 8, y: 300, w: 156 } },
    { id: "fanspeed", kind: "concrete", name: "FanSpeed", hidden: true, members: ["- speed", "- previous: stack", "+ execute() / undo()"],
      at: { x: 490, y: 200, w: 180 }, portrait: { x: 176, y: 300, w: 156 } },
    { id: "light", kind: "concrete", name: "Light", hidden: true, members: ["on = False"], scalaMembers: ["on = false"],
      at: { x: 320, y: 340, w: 150 }, portrait: { x: 8, y: 450, w: 156 } },
    { id: "fan", kind: "concrete", name: "Fan", hidden: true, members: ["speed = 0"],
      at: { x: 490, y: 340, w: 180 }, portrait: { x: 176, y: 450, w: 156 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "remote", type: "association", hidden: true },
    { id: "holds", from: "remote", to: "iface", type: "association", hidden: true },
    { id: "r-lighton", from: "lighton", to: "iface", type: "realization", hidden: true },
    { id: "r-fanspeed", from: "fanspeed", to: "iface", type: "realization", hidden: true },
    { id: "e-light", from: "lighton", to: "light", type: "association", hidden: true },
    { id: "e-fan", from: "fanspeed", to: "fan", type: "association", hidden: true }
  ]
};
const PRESS = (cmd: "lighton" | "fanspeed") => ["remote", "iface", cmd, cmd === "lighton" ? "light" : "fan"];
const remoteTry = (seq: string, undos: 1 | 2): TryResult => {
  const table: Record<string, [boolean, number, number, string, "lighton" | "fanspeed"][]> = {
    // [light on, fan speed, history size, what the last undo reversed, its command box]
    s123: [[true, 3, 2, "FanSpeed(5)", "fanspeed"], [true, 0, 1, "FanSpeed(3)", "fanspeed"]],
    s33: [[false, 5, 1, "FanSpeed(5)", "fanspeed"], [false, 0, 0, "FanSpeed(5) again", "fanspeed"]],
    s132: [[true, 5, 2, "FanSpeed(3)", "fanspeed"], [true, 0, 1, "FanSpeed(5)", "fanspeed"]]
  };
  const [on, speed, left, what, box] = table[seq][undos - 1];
  const output = `light ${on ? "ON" : "OFF"}, fan speed ${speed}`;
  const note = seq === "s33"
    ? `Button 3 is one FanSpeed object pressed twice; its stack of old speeds (0, 5) undoes each press correctly.`
    : `The last undo reversed ${what}; ${left} command${left === 1 ? "" : "s"} left in the history.`;
  return {
    output, note,
    actions: [
      { members: "light", lines: [on ? "on = True" : "on = False"], scalaLines: [on ? "on = true" : "on = false"] },
      { members: "fan", lines: ["speed = " + speed], together: true },
      { tag: "remote", text: `history: ${left}` },
      { ring: box },
      { call: ["client", ...PRESS(box)], label: undos === 1 ? "press_undo()" : "press_undo() × 2", scalaLabel: undos === 1 ? "pressUndo()" : "pressUndo() × 2", result: output }
    ]
  };
};
const remote: ExampleAnimation = {
  diagram: remoteDiagram,
  walk: [
    [
      { show: ["client", "remote", "e-client"] },
      { show: ["iface", "holds"] },
      { show: ["lighton", "fanspeed"] },
      { show: ["r-lighton", "r-fanspeed"] },
      { show: ["light", "fan", "e-light", "e-fan"] },
      { call: ["client", "remote"], label: "assign(1, LightOn); assign(2/3, FanSpeed)" }
    ],
    [
      { ring: "lighton" },
      { call: PRESS("lighton"), label: "press(1)" },
      { members: "light", lines: ["on = True"], scalaLines: ["on = true"] },
      { ring: "fanspeed" },
      { call: PRESS("fanspeed"), label: "press(2): speed 3" },
      { members: "fan", lines: ["speed = 3"] },
      { call: PRESS("fanspeed"), label: "press(3): speed 5" },
      { members: "fan", lines: ["speed = 5"] }
    ],
    [{ tag: "remote", text: "history: 1, 2, 3" }, { pulse: "remote" }],
    [
      { call: ["client", "remote"], label: "press_undo()", scalaLabel: "pressUndo()" },
      { call: PRESS("fanspeed"), label: "undo FanSpeed(5)" },
      { members: "fan", lines: ["speed = 3"] },
      { call: PRESS("fanspeed"), label: "undo FanSpeed(3)" },
      { members: "fan", lines: ["speed = 0"] },
      { tag: "remote", text: "history: 1" }
    ],
    [
      { ring: "lighton" },
      { call: PRESS("lighton"), label: "undo LightOn" },
      { members: "light", lines: ["on = False"], scalaLines: ["on = false"] },
      { tag: "remote", text: "history: empty" },
      { ring: null },
      { call: ["client", "remote"], label: "press_undo()", scalaLabel: "pressUndo()", result: "nothing to undo" },
      { shake: "remote" }
    ]
  ],
  tryIt: {
    prompt: "Pick the buttons pressed and how many times Undo is pressed. What state is the room left in?",
    groups: [
      { label: "Buttons pressed", options: [{ id: "s123", label: "1 → 2 → 3" }, { id: "s33", label: "3 → 3" }, { id: "s132", label: "1 → 3 → 2" }] },
      { label: "Undo", options: [{ id: "u1", label: "Undo × 1" }, { id: "u2", label: "Undo × 2" }] }
    ],
    results: Object.fromEntries(["s123", "s33", "s132"].flatMap((s) => ([1, 2] as const).map((u) => [`${s}|u${u}`, remoteTry(s, u)])))
  }
};

/* --- background job queue --- */
const jobsDiagram: DiagramSpec = {
  label: "JobQueue holds Job commands; SendSms, GenerateInvoice and SyncPayment extend the abstract Job; failed jobs go back into the queue.",
  width: 760, height: 330, portraitWidth: 340, portraitHeight: 500,
  nodes: [
    { id: "client", kind: "client", name: "jobsDemo", hidden: true, at: { x: 16, y: 20, w: 130, h: 54 }, portrait: { x: 8, y: 8, w: 140, h: 54 } },
    { id: "queue", kind: "concrete", name: "JobQueue", key: true, hidden: true,
      members: ["- queue: deque[Job]", "- max_attempts = 3", "+ submit(job)", "+ work()"],
      scalaMembers: ["- queue: Queue[Job]", "- maxAttempts = 3", "+ submit(job)", "+ work()"],
      at: { x: 170, y: 14, w: 220, h: 134 }, portrait: { x: 160, y: 8, w: 172, h: 134 } },
    { id: "job", kind: "abstract", name: "Job", key: true, hidden: true, members: ["- attempts", "+ run()"],
      at: { x: 450, y: 14, w: 200 }, portrait: { x: 8, y: 170, w: 170 } },
    { id: "sms", kind: "concrete", name: "SendSms", hidden: true, members: ["+ run()"],
      at: { x: 220, y: 215, w: 160, h: 74 }, portrait: { x: 8, y: 300, w: 156, h: 74 } },
    { id: "inv", kind: "concrete", name: "GenerateInvoice", hidden: true, members: ["+ run()"],
      at: { x: 400, y: 215, w: 170, h: 74 }, portrait: { x: 176, y: 300, w: 156, h: 74 } },
    { id: "sync", kind: "concrete", name: "SyncPayment", hidden: true, members: ["+ run()"],
      at: { x: 590, y: 215, w: 160, h: 74 }, portrait: { x: 92, y: 400, w: 156, h: 74 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "queue", type: "association", hidden: true },
    { id: "holds", from: "queue", to: "job", type: "association", hidden: true },
    { id: "i-sms", from: "sms", to: "job", type: "inheritance", hidden: true },
    { id: "i-inv", from: "inv", to: "job", type: "inheritance", hidden: true },
    { id: "i-sync", from: "sync", to: "job", type: "inheritance", hidden: true }
  ]
};
const WORK = (j: string) => ["queue", "job", j];
const jobTry = (failures: number, max: number): TryResult => {
  const ok = failures + 1 <= max;
  const output = ok ? `done on attempt ${failures + 1}` : `gave up after ${max} attempts`;
  const note = ok
    ? `The bank fails ${failures === 0 ? "never" : failures === 1 ? "once" : failures + " times"}, so attempt ${failures + 1} works${failures ? "; each failure puts the job at the back of the queue" : ""}.`
    : `It needs ${failures + 1} attempts but the queue allows only ${max}.`;
  return {
    output, note,
    actions: [
      { tag: "sync", text: `attempts: ${ok ? failures + 1 : max}` },
      { ring: "sync" },
      { call: WORK("sync"), label: "run() SyncPayment", result: output },
      ok ? { pulse: "sync" } : { flash: "sync" }
    ]
  };
};
const jobs: ExampleAnimation = {
  diagram: jobsDiagram,
  walk: [
    [
      { show: ["client", "queue", "e-client"] },
      { show: ["job", "holds"] },
      { show: ["sms", "inv", "sync"] },
      { show: ["i-sms", "i-inv", "i-sync"] },
      { call: ["client", "queue"], label: "submit(4 jobs)" },
      { tag: "queue", text: "4 jobs waiting" }
    ],
    [
      { ring: "sms" },
      { call: WORK("sms"), label: "run() SendSms", result: "done (attempt 1)" },
      { tag: "queue", text: "3 jobs waiting" }
    ],
    [
      { ring: "sync" },
      { call: WORK("sync"), label: "run() TXN42", result: "bank API timeout" },
      { flash: "sync" },
      { tag: "sync", text: "TXN42: 1 attempt" },
      { tag: "queue", text: "TXN42 back of queue" }
    ],
    [
      { ring: "inv" },
      { call: WORK("inv"), label: "run() GenerateInvoice", result: "INV-1042 for ₹1299" },
      { ring: "sync" },
      { call: WORK("sync"), label: "run() TXN43", result: "bank API timeout" },
      { call: WORK("sync"), label: "run() TXN42", result: "done (attempt 2)" },
      { tag: "sync", text: "TXN42: done" }
    ],
    [
      { call: WORK("sync"), label: "run() TXN43", result: "timeout (attempt 2)" },
      { call: WORK("sync"), label: "run() TXN43", result: "timeout (attempt 3)" },
      { tag: "sync", text: "TXN43: gave up" },
      { flash: "sync" },
      { tag: "queue", text: "queue empty" }
    ]
  ],
  tryIt: {
    prompt: "How often does the bank time out, and how many attempts does the queue allow?",
    groups: [
      { label: "Bank fails", options: [{ id: "f0", label: "never" }, { id: "f1", label: "once" }, { id: "f2", label: "twice" }, { id: "f5", label: "5 times" }] },
      { label: "Max attempts", options: [{ id: "m2", label: "2" }, { id: "m3", label: "3" }] }
    ],
    results: Object.fromEntries([0, 1, 2, 5].flatMap((f) => [2, 3].map((m) => [`f${f}|m${m}`, jobTry(f, m)])))
  }
};

/* --- schema migrations --- */
const migDiagram: DiagramSpec = {
  label: "Migrator applies Migration commands to a Schema; CreateUsers, AddPhoneToUsers and CreateOrders extend Migration with up and down.",
  width: 760, height: 290, portraitWidth: 340, portraitHeight: 590,
  nodes: [
    { id: "client", kind: "client", name: "migrationDemo", hidden: true, at: { x: 16, y: 20, w: 140, h: 54 }, portrait: { x: 8, y: 8, w: 124, h: 54 } },
    { id: "migrator", kind: "concrete", name: "Migrator", key: true, hidden: true,
      members: ["- applied: list", "+ migrate(ms)", "+ rollback(n)"], scalaMembers: ["- applied: List", "+ migrate(ms)", "+ rollback(n)"],
      at: { x: 180, y: 14, w: 200 }, portrait: { x: 144, y: 8, w: 176 } },
    { id: "mig", kind: "abstract", name: "Migration", key: true, hidden: true, members: ["version", "+ up(schema)", "+ down(schema)"],
      at: { x: 430, y: 14, w: 180 }, portrait: { x: 85, y: 268, w: 170 } },
    { id: "schema", kind: "concrete", name: "Schema", hidden: true, members: ["(empty)", ""],
      at: { x: 16, y: 170, w: 290 }, portrait: { x: 8, y: 150, w: 312 } },
    { id: "m1", kind: "concrete", name: "CreateUsers", hidden: true, members: ["+ up / down"],
      at: { x: 330, y: 170, w: 140 }, portrait: { x: 8, y: 418, w: 156 } },
    { id: "m2", kind: "concrete", name: "AddPhoneToUsers", hidden: true, members: ["+ up / down"],
      at: { x: 482, y: 170, w: 146 }, portrait: { x: 176, y: 418, w: 156 } },
    { id: "m3", kind: "concrete", name: "CreateOrders", hidden: true, members: ["+ up / down"],
      at: { x: 640, y: 170, w: 112 }, portrait: { x: 92, y: 500, w: 156 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "migrator", type: "association", hidden: true },
    { id: "e-schema", from: "migrator", to: "schema", type: "association", hidden: true },
    { id: "holds", from: "migrator", to: "mig", type: "association", hidden: true,
      viaPortrait: [[330, 325], [330, 60]] },
    { id: "i-m1", from: "m1", to: "mig", type: "inheritance", hidden: true },
    { id: "i-m2", from: "m2", to: "mig", type: "inheritance", hidden: true },
    { id: "i-m3", from: "m3", to: "mig", type: "inheritance", hidden: true }
  ]
};
const applied = (v: string): Action => ({ members: "migrator", lines: ["applied: " + v, "+ migrate(ms)", "+ rollback(n)"] });
const S0 = ["(empty)", ""];
const S1 = ["users(id, name)", ""];
const S2 = ["users(id, name, phone)", ""];
const S3 = ["users(id, name, phone)", "orders(id, user_id, total)"];
const STEP = (m: string, how: "up" | "down", lines: string[]): Action[] => [
  { ring: m },
  { call: ["migrator", "mig", m], label: `${how}(schema)` },
  { members: "schema", lines }
];
const migTry = (n: number): TryResult => {
  const states = [S3, S2, S1, S0, S0];
  const names = ["CreateOrders", "AddPhoneToUsers", "CreateUsers"];
  const last = ["m3", "m2", "m1"][Math.min(n, 3) - 1];
  const output = n === 4 ? "(empty), then: nothing to roll back" : states[n][0];
  return {
    output,
    note: n === 4
      ? "Three downs empty the schema; the fourth step finds no applied migration and stops."
      : `down() ran on ${names.slice(0, n).join(", then ")}: newest first.`,
    actions: [
      { members: "schema", lines: states[n] },
      applied(["(none)", "001", "001 002", "001 002 003"][3 - Math.min(n, 3)]),
      { ring: last },
      { call: ["client", "migrator", "mig", last], label: `rollback(${n})`, result: output }
    ]
  };
};
const migration: ExampleAnimation = {
  diagram: migDiagram,
  walk: [
    [
      { show: ["client", "migrator", "e-client"] },
      { show: ["schema", "e-schema"] },
      { show: ["mig", "holds"] },
      { show: ["m1", "m2", "m3"] },
      { show: ["i-m1", "i-m2", "i-m3"] },
      { call: ["client", "migrator"], label: "migrate(all 3)" },
      ...STEP("m1", "up", S1), ...STEP("m2", "up", S2), ...STEP("m3", "up", S3),
      applied("001 002 003")
    ],
    [
      { call: ["client", "migrator"], label: "rollback(2)" },
      ...STEP("m3", "down", S2), ...STEP("m2", "down", S1),
      applied("001")
    ],
    [{ ring: "schema", caption: "users(id, name)" }, { pulse: "schema" }],
    [
      { ring: null },
      { call: ["client", "migrator"], label: "migrate(all 3)" },
      { pulse: "m1" },
            ...STEP("m2", "up", S2), ...STEP("m3", "up", S3),
      applied("001 002 003")
    ]
  ],
  tryIt: {
    prompt: "All three migrations are applied. How many steps do you roll back?",
    groups: [
      { label: "rollback(n)", options: [{ id: "n1", label: "1 step" }, { id: "n2", label: "2 steps" }, { id: "n3", label: "3 steps" }, { id: "n4", label: "4 steps" }] }
    ],
    results: { n1: migTry(1), n2: migTry(2), n3: migTry(3), n4: migTry(4) }
  }
};

/* --- game moves with undo / redo and a macro command --- */
const movesDiagram: DiagramSpec = {
  label: "Game keeps undo and redo stacks of Commands; Move and Combo implement Command; Combo is made of commands; Move moves the Hero.",
  width: 760, height: 300, portraitWidth: 340, portraitHeight: 520,
  nodes: [
    { id: "client", kind: "client", name: "movesDemo", hidden: true, at: { x: 16, y: 20, w: 130, h: 54 }, portrait: { x: 8, y: 8, w: 136, h: 54 } },
    { id: "game", kind: "concrete", name: "Game", key: true, hidden: true,
      members: ["- undo: stack", "- redo: stack", "+ play(cmd)"],
      at: { x: 170, y: 14, w: 210 }, portrait: { x: 152, y: 8, w: 180 } },
    { id: "iface", kind: "interface", name: "Command", key: true, hidden: true, members: ["+ execute()", "+ undo()"],
      at: { x: 430, y: 14, w: 170 }, portrait: { x: 85, y: 150, w: 170 } },
    { id: "move", kind: "concrete", name: "Move", hidden: true, members: ["- dx, dy", "+ execute()", "+ undo()"],
      at: { x: 330, y: 170, w: 170 }, portrait: { x: 8, y: 280, w: 156 } },
    { id: "combo", kind: "concrete", name: "Combo", key: true, hidden: true, members: ["- steps: list", "+ execute()", "+ undo()"],
      scalaMembers: ["- steps: List", "+ execute()", "+ undo()"],
      at: { x: 550, y: 170, w: 180 }, portrait: { x: 176, y: 280, w: 140 } },
    { id: "hero", kind: "concrete", name: "Hero", hidden: true, members: ["position = (0, 0)"],
      at: { x: 16, y: 190, w: 180 }, portrait: { x: 8, y: 420, w: 200 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "game", type: "association", hidden: true },
    { id: "holds", from: "game", to: "iface", type: "association", hidden: true },
    { id: "r-move", from: "move", to: "iface", type: "realization", hidden: true },
    { id: "r-combo", from: "combo", to: "iface", type: "realization", hidden: true },
    { id: "steps", from: "combo", to: "iface", type: "composition", hidden: true,
      via: [[745, 221], [745, 61]], viaPortrait: [[328, 331], [328, 197]] },
    { id: "e-hero", from: "move", to: "hero", type: "association", hidden: true, route: "straight" }
  ]
};
const stacks = (undo: string, redo: string): Action => ({ members: "game", lines: ["undo: " + undo, "redo: " + redo, "+ play(cmd)"] });
const pos = (p: string): Action => ({ members: "hero", lines: [`position = ${p}`] });
const VIA_MOVE = ["game", "iface", "move", "hero"];
const VIA_COMBO = ["game", "iface", "combo", "move", "hero"];
const movesTry = (key: string): TryResult => {
  const r: Record<string, [string, string, string, string, string[], string]> = {
    // [output, undo stack, redo stack, label, path, note]
    u: ["hero at (1, 1)", "right, up", "dash", "undo()", VIA_COMBO, "The whole dash (three steps) is reversed in one undo."],
    uu: ["hero at (1, 0)", "right", "dash, up", "undo() × 2", VIA_MOVE, "Undo the dash, then the up move."],
    ur: ["hero at (4, 1)", "right, up, dash", "(empty)", "undo(); redo()", VIA_COMBO, "Redo replays the same Combo object, so the hero dashes again."],
    ud: ["hero at (1, 0)", "right, up, down", "(empty)", "undo(); play(down)", VIA_MOVE, "A new move clears the redo stack: the dash can no longer be redone."]
  };
  const [output, u, rd, label, path, note] = r[key];
  return {
    output, note,
    actions: [
      stacks(u, rd),
      pos(output.replace("hero at ", "")),
      { ring: path.includes("combo") ? "combo" : "move" },
      { call: ["client", ...path], label, result: output }
    ]
  };
};
const moves: ExampleAnimation = {
  diagram: movesDiagram,
  walk: [
    [
      { show: ["client", "game", "e-client"] },
      { show: ["iface", "holds"] },
      { show: ["move", "combo"] },
      { show: ["r-move", "r-combo", "steps"] },
      { show: ["hero", "e-hero"] },
      { ring: "move" },
      { call: VIA_MOVE, label: "play(right), play(up)" },
      pos("(1, 1)"),
      { ring: "combo" },
      { call: VIA_COMBO, label: "play(dash: 3 × right)" },
      pos("(4, 1)"),
      stacks("right, up, dash", "(empty)")
    ],
    [
      { call: VIA_COMBO, label: "undo() dash" },
      pos("(1, 1)"),
      stacks("right, up", "dash")
    ],
    [
      { ring: "move" },
      { call: VIA_MOVE, label: "undo() up" },
      pos("(1, 0)"),
      stacks("right", "dash, up"),
      { call: VIA_MOVE, label: "redo() up" },
      pos("(1, 1)"),
      stacks("right, up", "dash")
    ],
    [
      { call: VIA_MOVE, label: "play(down)" },
      pos("(1, 0)"),
      stacks("right, up, down", "(empty)"),
      { pulse: "game" }
    ],
    [
      { ring: null },
      { call: ["client", "game"], label: "redo()", result: "nothing to redo" },
      { shake: "game" }
    ]
  ],
  tryIt: {
    prompt: "The hero has just dashed to (4, 1). What do you press next?",
    groups: [
      { label: "Then", options: [
        { id: "u", label: "Undo" }, { id: "uu", label: "Undo × 2" },
        { id: "ur", label: "Undo, Redo" }, { id: "ud", label: "Undo, play down" }
      ] }
    ],
    results: { u: movesTry("u"), uu: movesTry("uu"), ur: movesTry("ur"), ud: movesTry("ud") }
  }
};

const animation: PatternAnimation = {
  slug: "command",
  story: storyAnim,
  examples: { remote, jobs, migration, moves },
  sequence: {
    label: "App asks the Editor to run a DeleteLastChars command, which changes the Document; on undo the Editor pops the command and calls its undo, which puts the text back.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "editor", name: "editor: Editor", kind: "concrete" },
      { id: "cmd", name: ": DeleteLastChars", kind: "concrete" },
      { id: "doc", name: "doc: Document", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "cmd", label: "DeleteLastChars(doc, 6)", kind: "create" },
      { from: "app", to: "editor", label: "run(cmd)" },
      { from: "editor", to: "cmd", label: "execute()" },
      { from: "cmd", to: "doc", label: 'text = "Hello"' },
      { from: "editor", to: "editor", label: "history.append(cmd)", kind: "self" },
      { from: "app", to: "editor", label: "undo()" },
      { from: "editor", to: "editor", label: "history.pop()", kind: "self" },
      { from: "editor", to: "cmd", label: "undo()" },
      { from: "cmd", to: "doc", label: 'text = "Hello world"' }
    ]
  }
};

export default animation;
