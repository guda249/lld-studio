import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: one Order full of status checks becomes a context plus one class per state ---------- */

const story: DiagramSpec = {
  label: "Order holds one OrderState; Placed, Shipped, Delivered and Cancelled extend the abstract OrderState; a Packed state is added at the end; App is the client.",
  width: 920,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 698,
  nodes: [
    { id: "app", kind: "client", name: "App", at: { x: 20, y: 46, w: 100, h: 56 }, portrait: { x: 8, y: 40, w: 96, h: 56 } },
    { id: "order", kind: "concrete", name: "Order", key: true, members: [],
      at: { x: 160, y: 20, w: 250, h: 140 }, portrait: { x: 120, y: 10, w: 212, h: 140 } },
    { id: "base", kind: "abstract", name: "OrderState", key: true, hidden: true,
      members: ["+ ship(): OrderState", "+ deliver(): OrderState", "+ cancel(): OrderState"],
      at: { x: 540, y: 20, w: 250 }, portrait: { x: 50, y: 186, w: 240 } },
    { id: "placed", kind: "concrete", name: "Placed", hidden: true, members: ["ship → Shipped", "cancel → Cancelled"],
      at: { x: 20, y: 300, w: 160 }, portrait: { x: 8, y: 338, w: 156 } },
    { id: "shipped", kind: "concrete", name: "Shipped", hidden: true, members: ["deliver → Delivered"],
      at: { x: 200, y: 300, w: 160 }, portrait: { x: 176, y: 338, w: 156 } },
    { id: "delivered", kind: "concrete", name: "Delivered", hidden: true, members: ["(refuses all)"],
      at: { x: 380, y: 300, w: 160 }, portrait: { x: 8, y: 456, w: 156 } },
    { id: "cancelled", kind: "concrete", name: "Cancelled", hidden: true, members: ["(refuses all)"],
      at: { x: 560, y: 300, w: 160 }, portrait: { x: 176, y: 456, w: 156 } },
    { id: "packed", kind: "concrete", name: "Packed", hidden: true, members: ["ship → Shipped", "cancel → Cancelled"],
      at: { x: 740, y: 300, w: 160 }, portrait: { x: 92, y: 566, w: 156 } }
  ],
  edges: [
    { id: "holds", from: "order", to: "base", type: "association", label: "current", hidden: true, route: "straight" },
    { id: "i-placed", from: "placed", to: "base", type: "inheritance", hidden: true },
    { id: "i-shipped", from: "shipped", to: "base", type: "inheritance", hidden: true },
    { id: "i-delivered", from: "delivered", to: "base", type: "inheritance", hidden: true, viaPortrait: [[170, 436], [86, 436]] },
    { id: "i-cancelled", from: "cancelled", to: "base", type: "inheritance", hidden: true, viaPortrait: [[170, 436], [254, 436]] },
    { id: "i-packed", from: "packed", to: "base", type: "inheritance", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Edited for every new status", tone: "warn", near: "order", place: "below" },
    { id: "ok", text: "Order: 0 lines changed", tone: "ok", near: "packed", place: "below" }
  ]
};

const TO = (target: string) => ["app", "order", "base", target];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: status checks everywhere",
      what: "Order keeps a status string, and ship, deliver and cancel each check it with if/elif. The rules for one status are spread over every method.",
      why: "Adding a “packed” status means editing every method, and a missed case (cancelling twice) fails silently. That breaks the Open/Closed Principle.",
      say: {
        what: "Here's the problem. Order keeps its status as a string, and ship, deliver and cancel each check it with an if-else chain. The rules for one status are spread over every method.",
        why: "Adding a packed status means editing every method, and a forgotten case, like cancelling twice, fails silently. That breaks the open-closed principle."
      },
      code: "problem",
      lines: { python: [4, 7, 8, 9, 10, 13, 14, 19, 20, 21, 22, 23], scala: [2, 5, 6, 9, 13, 14, 15, 16] },
      actions: [
        { members: "order", stagger: true,
          lines: ["- status: str", 'ship: if status == "placed"', 'deliver: if status == …', "cancel: if/elif status …"],
          scalaLines: ["- status: String", 'ship: if status == "placed"', 'deliver: if status == …', "cancel: if/else if status …"] },
        { flash: "order" },
        { shake: "order", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Each status becomes its own class",
      what: "Placed, Shipped, Delivered and Cancelled each get a class. A class implements only the actions that make sense in that state and returns the next state.",
      why: "All the rules for one state now live in one place (Single Responsibility). Placed knows that ship leads to Shipped; nobody else has to.",
      say: {
        what: "Each status becomes its own class: placed, shipped, delivered and cancelled. Each class implements only the actions that make sense in that state, and returns the next state.",
        why: "All the rules for one state now live in one place. That's single responsibility."
      },
      code: "main",
      lines: { python: [17, 18, 20, 21, 23, 24, 27, 28, 30, 31, 34, 35, 38, 39], scala: [10, 11, 12, 13, 15, 16, 17, 19, 20, 22, 23] },
      actions: [
        { hide: ["warn"] },
        { members: "order", lines: [], together: true },
        { spawn: ["placed", "shipped", "delivered", "cancelled"], from: "order" },
        { members: "order", lines: ["- state: OrderState", "+ ship()", "+ deliver()", "+ cancel()"] }
      ]
    },
    {
      title: "A base class refuses by default",
      what: "The abstract OrderState declares every action, and by default each one refuses with a clear error. The states extend it and override only what they allow.",
      why: "An action you forgot to allow is refused loudly instead of silently doing nothing. Any state can stand in for OrderState (Liskov Substitution).",
      say: {
        what: "An abstract order state class declares every action. By default, each one refuses with a clear error. The states extend it, and override only what they allow.",
        why: "An action you forgot to allow is refused loudly, instead of silently doing nothing. And any state can stand in for the base class. That's Liskov substitution."
      },
      code: "main",
      lines: { python: [1, 4, 5, 7, 8, 10, 11, 13, 14], scala: [1, 3, 4, 5, 7, 8] },
      actions: [
        { show: ["base"] },
        { show: ["i-placed", "i-shipped", "i-delivered", "i-cancelled"] },
        { show: ["holds"] }
      ]
    },
    {
      title: "Order starts in Placed",
      what: "App creates Order(\"A-101\"). The order holds a Placed object as its current state and will delegate every action to it.",
      why: "Order has no if/elif left. It only asks its current state what to do and stores whatever state comes back.",
      say: {
        what: "The app creates order A 101. The order holds a placed object as its current state, and will hand every action to it.",
        why: "Order has no if-else left. It just asks its current state what to do, and stores whatever state comes back."
      },
      code: "main",
      lines: { python: [43, 44, 45, 51, 52, 61], scala: [25, 26, 29, 34] },
      actions: [
        { call: ["app", "order"], label: 'Order("A-101")' },
        { tag: "order", text: "state: Placed" },
        { ring: "placed", caption: "current state" },
        { pulse: "placed", together: true }
      ]
    },
    {
      title: "ship(): the state picks the next state",
      what: "ship() goes to Placed, which returns a Shipped object. Order stores it, so the order is now shipped.",
      why: "The transition rule (placed then shipped) lives inside Placed, not in a central switch.",
      say: {
        what: "When the app calls ship, the order hands it to the placed state, which returns a shipped state. The order stores it, so it is now shipped.",
        why: "The rule that placed leads to shipped lives inside the placed class, not in a central switch."
      },
      code: "main",
      lines: { python: [20, 21, 51, 52, 62, 63], scala: [12, 29, 35, 36] },
      actions: [
        { call: TO("placed"), label: "ship()", result: "Shipped" },
        { tag: "order", text: "state: Shipped" },
        { ring: "shipped", caption: "current state" }
      ]
    },
    {
      title: "Same cancel(), different answer",
      what: "cancel() now reaches Shipped. Shipped does not override cancel, so the default from OrderState refuses it.",
      why: "The same call behaves differently depending on the state, and nobody had to write an if for it.",
      say: {
        what: "Now the app calls cancel. It reaches the shipped state, which does not override cancel, so the default from the base class refuses it.",
        why: "The same call behaves differently depending on the state, and nobody had to write an if for it."
      },
      code: "main",
      lines: { python: [10, 11, 13, 14, 64, 65, 66, 67], scala: [5, 7, 8, 37, 38] },
      actions: [
        { mark: "base", member: 2 },
        { call: TO("shipped"), label: "cancel()", result: "Cannot cancel: shipped" },
        { flash: "shipped" }
      ]
    },
    {
      title: "deliver() moves it on again",
      what: "deliver() reaches Shipped, which returns Delivered. Delivered overrides nothing, so every later action is refused.",
      why: "A final state is simply a class with no overrides. The life of the order is spelled out by the classes themselves.",
      say: {
        what: "Then deliver reaches the shipped state, which returns delivered. Delivered overrides nothing, so every later action is refused.",
        why: "A final state is simply a class with no overrides. The life of the order is spelled out by the classes themselves."
      },
      code: "main",
      lines: { python: [30, 31, 54, 55, 68, 69], scala: [17, 30, 39, 40] },
      actions: [
        { mark: "base", member: null },
        { call: TO("shipped"), label: "deliver()", result: "Delivered" },
        { tag: "order", text: "state: Delivered" },
        { ring: "delivered", caption: "current state" }
      ]
    },
    {
      title: "Add a Packed state",
      what: "A new Packed class plugs in. Placed's ship now returns Packed, and Packed's ship returns Shipped. Order and the other states stay as they were.",
      why: "Order: 0 lines changed. A new state is added, not edited into every method (Open/Closed).",
      say: {
        what: "Finally, we add a packed state. Placed's ship now returns packed, and packed's ship returns shipped. Order and the other states stay as they were.",
        why: "Order has zero lines changed. A new state is added, not edited into every method. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [20, 21, 51, 52, 54, 55, 57, 58], scala: [12, 28, 29, 30, 31] },
      actions: [
        { ring: null },
        { tag: "order", text: null, together: true },
        { show: ["packed"] },
        { show: ["i-packed"] },
        { members: "placed", lines: ["ship → Packed", "cancel → Cancelled"] },
        { pulse: "placed", together: true },
        { show: ["ok"] },
        { pulse: "order", together: true }
      ]
    }
  ]
};

/* ---------- examples 1-3: context -> abstract state <- three concrete states ---------- */

interface MiniCfg {
  label: string;
  client: string;
  context: string;
  ctxMembers: string[];
  ctxScala?: string[];
  base: string;
  baseMembers: string[];
  baseScala?: string[];
  states: { id: string; name: string; members: string[]; scalaMembers?: string[] }[];
}

function stateMini(c: MiniCfg): DiagramSpec {
  const land = [30, 280, 530];
  const port = [{ x: 8, y: 326 }, { x: 176, y: 326 }, { x: 92, y: 426 }];
  const ctxH = 32 + c.ctxMembers.length * 20 + 10 + 18; // room for the state tag under the members
  return {
    label: c.label,
    width: 760, height: 310,
    portraitWidth: 340, portraitHeight: 526,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 30, w: 130, h: 54 }, portrait: { x: 8, y: 14, w: 140, h: 54 } },
      { id: "ctx", kind: "concrete", name: c.context, key: true, hidden: true, members: c.ctxMembers, scalaMembers: c.ctxScala,
        at: { x: 176, y: 16, w: 200, h: ctxH }, portrait: { x: 160, y: 10, w: 172, h: ctxH } },
      { id: "base", kind: "abstract", name: c.base, key: true, hidden: true, members: c.baseMembers, scalaMembers: c.baseScala,
        at: { x: 430, y: 10, w: 300 }, portrait: { x: 30, y: 176, w: 280 } },
      ...c.states.map((s, i) => ({
        id: s.id, kind: "concrete" as const, name: s.name, hidden: true, members: s.members, scalaMembers: s.scalaMembers,
        at: { x: land[i], y: 206, w: 200 }, portrait: { ...port[i], w: 156 }
      }))
    ],
    edges: [
      { id: "holds", from: "ctx", to: "base", type: "association", label: "current", hidden: true, route: "straight" },
      ...c.states.map((s) => ({ id: "i-" + s.id, from: s.id, to: "base", type: "inheritance" as const, hidden: true }))
    ]
  };
}

const build = (c: MiniCfg): Action[] => [
  { show: ["client", "ctx"] },
  { show: ["base"] },
  { show: ["holds"] },
  { show: c.states.map((s) => s.id) },
  { show: c.states.map((s) => "i-" + s.id) }
];
const via = (id: string) => ["client", "ctx", "base", id];
const clearAll: Action[] = [{ ring: null }, { mark: "base", member: null, together: true }];

/* --- vending machine --- */
const vendCfg: MiniCfg = {
  label: "VendingMachine holds one MachineState; Idle, HasMoney and SoldOut extend it.",
  client: "Customer", context: "VendingMachine",
  ctxMembers: ["- state: MachineState", "- credit, stock", "+ insert(₹)", "+ select()"],
  base: "MachineState", baseMembers: ["+ insert(m, ₹): refuse", "+ select(m): refuse"],
  states: [
    { id: "idle", name: "Idle", members: ["insert → HasMoney"] },
    { id: "has", name: "HasMoney", members: ["insert, select"] },
    { id: "sold", name: "SoldOut", members: ["select: no stock"] }
  ]
};
const vendTry = (state: "idle" | "has" | "sold", button: "ins" | "sel"): TryResult => {
  const credit = state === "has" ? "credit ₹20" : state === "idle" ? "credit ₹0" : "stock 0";
  const table: Record<string, [string, string, string | null]> = {
    "idle|ins": ["credit ₹20", "Idle adds the coin and moves the machine to HasMoney.", "has"],
    "idle|sel": ["insert money first", "Idle does not override select, so the default refuses.", null],
    "has|ins": ["credit ₹40", "HasMoney keeps taking coins and stays in HasMoney.", null],
    "has|sel": ["need ₹10 more", "Chips cost ₹30 and the credit is ₹20, so HasMoney refuses.", null],
    "sold|ins": ["returning ₹20", "SoldOut does not override insert, so the default hands the coin back.", null],
    "sold|sel": ["nothing left, call the operator", "SoldOut overrides select with its own message.", null]
  };
  const [output, note, next] = table[`${state}|${button}`];
  const own = (state === "idle" && button === "ins") || state === "has" || (state === "sold" && button === "sel");
  return {
    output, note,
    actions: [
      ...clearAll,
      { tag: "ctx", text: credit, together: true },
      { ring: state },
      ...(own ? [] : [{ mark: "base", member: button === "ins" ? 0 : 1 } as Action]),
      { call: via(state), label: button === "ins" ? "insert(₹20)" : "select()", result: output },
      ...(next ? [{ ring: next }, { tag: "ctx", text: "credit ₹20", together: true } as Action] : [])
    ]
  };
};
const vending: ExampleAnimation = {
  diagram: stateMini(vendCfg),
  walk: [
    [...build(vendCfg), { ring: "idle" }, { mark: "base", member: 1 }, { call: via("idle"), label: "select()", result: "insert money first" }],
    [{ mark: "base", member: null }, { call: via("idle"), label: "insert(₹20)", result: "credit ₹20" }, { tag: "ctx", text: "credit ₹20" }, { ring: "has" }],
    [{ call: via("has"), label: "select()", result: "need ₹10 more" }, { flash: "has" }],
    [{ call: via("has"), label: "insert(₹20)", result: "credit ₹40" }, { tag: "ctx", text: "credit ₹40" },
      { call: via("has"), label: "select()", result: "chips, change ₹10" }, { tag: "ctx", text: "stock 0" }],
    [{ ring: "sold" }, { mark: "base", member: 0 }, { call: via("sold"), label: "insert(₹10)", result: "returning ₹10" }]
  ],
  tryIt: {
    prompt: "Put the machine in a state and press a button. Same button, different answer.",
    groups: [
      { label: "State", options: [{ id: "idle", label: "Idle" }, { id: "has", label: "HasMoney (₹20)" }, { id: "sold", label: "SoldOut" }] },
      { label: "Button", options: [{ id: "ins", label: "insert ₹20" }, { id: "sel", label: "select" }] }
    ],
    results: Object.fromEntries((["idle", "has", "sold"] as const).flatMap((s) =>
      (["ins", "sel"] as const).map((b) => [`${s}|${b}`, vendTry(s, b)])))
  }
};

/* --- music player --- */
const playerCfg: MiniCfg = {
  label: "MusicPlayer holds one shared PlayerState; Stopped, Playing and Paused extend it; stop has a default in the base class.",
  client: "Buttons", context: "MusicPlayer",
  ctxMembers: ["- state: PlayerState", "- position", "+ press_play()", "+ press_stop()"],
  ctxScala: ["- state: PlayerState", "- position", "+ pressPlay()", "+ pressStop()"],
  base: "PlayerState", baseMembers: ["+ press_play(p)", "+ press_stop(p): reset, Stopped"],
  baseScala: ["+ pressPlay(p)", "+ pressStop(p): reset, Stopped"],
  states: [
    { id: "stopped", name: "Stopped", members: ["play: start 0:00", "stop: no change"] },
    { id: "playing", name: "Playing", members: ["play: pause"] },
    { id: "paused", name: "Paused", members: ["play: resume"] }
  ]
};
const PLAYER: Record<string, [string, string, string]> = {
  "stopped|play": ["start from 0:00 → playing", "Stopped's play starts the track and switches to Playing.", "playing"],
  "stopped|stop": ["already stopped", "Stopped overrides stop with its own message.", "stopped"],
  "playing|play": ["pause at 0:42 → paused", "In Playing, the same button pauses.", "paused"],
  "playing|stop": ["position 0:00 → stopped", "Playing has no stop of its own, so the base class default runs.", "stopped"],
  "paused|play": ["resume from 0:42 → playing", "Paused's play resumes where it paused.", "playing"],
  "paused|stop": ["position 0:00 → stopped", "Paused has no stop of its own, so the base class default runs.", "stopped"]
};
const playerTry = (state: string, button: string): TryResult => {
  const [output, note, next] = PLAYER[`${state}|${button}`];
  const usesDefault = button === "stop" && state !== "stopped";
  return {
    output, note,
    actions: [
      ...clearAll,
      { tag: "ctx", text: state, together: true },
      { ring: state },
      ...(usesDefault ? [{ mark: "base", member: 1 } as Action] : []),
      { call: via(state), label: button === "play" ? "press_play()" : "press_stop()",
        scalaLabel: button === "play" ? "pressPlay()" : "pressStop()", result: output },
      { ring: next },
      { tag: "ctx", text: next, together: true }
    ]
  };
};
const player: ExampleAnimation = {
  diagram: stateMini(playerCfg),
  walk: [
    [...build(playerCfg), { ring: "stopped" }, { call: via("stopped"), label: "press_play()", scalaLabel: "pressPlay()", result: "start from 0:00" },
      { ring: "playing" }, { tag: "ctx", text: "playing" }],
    [{ call: via("playing"), label: "press_play()", scalaLabel: "pressPlay()", result: "pause at 0:42" }, { ring: "paused" }, { tag: "ctx", text: "paused, 0:42" }],
    [{ call: via("paused"), label: "press_play()", scalaLabel: "pressPlay()", result: "resume from 0:42" }, { ring: "playing" }, { tag: "ctx", text: "playing" }],
    [{ mark: "base", member: 1 }, { call: via("playing"), label: "press_stop()", scalaLabel: "pressStop()", result: "position 0:00" },
      { ring: "stopped" }, { tag: "ctx", text: "stopped" }],
    [{ mark: "base", member: null }, { call: via("stopped"), label: "press_stop()", scalaLabel: "pressStop()", result: "already stopped" }, { pulse: "stopped" }]
  ],
  tryIt: {
    prompt: "Pick the player's state and a button. Watch which class answers.",
    groups: [
      { label: "State", options: [{ id: "stopped", label: "Stopped" }, { id: "playing", label: "Playing" }, { id: "paused", label: "Paused (0:42)" }] },
      { label: "Button", options: [{ id: "play", label: "play / pause" }, { id: "stop", label: "stop" }] }
    ],
    results: Object.fromEntries(["stopped", "playing", "paused"].flatMap((s) =>
      ["play", "stop"].map((b) => [`${s}|${b}`, playerTry(s, b)])))
  }
};

/* --- document review --- */
const reviewCfg: MiniCfg = {
  label: "Document holds one DocState; Draft, InReview and Published extend it; each state checks who may act.",
  client: "Users", context: "Document",
  ctxMembers: ["- state: DocState", "- author, notes", "+ act(action, user)"],
  base: "DocState", baseMembers: ["+ submit(doc, user): refuse", "+ approve(doc, user): refuse", "+ reject(doc, user, why): refuse"],
  states: [
    { id: "draft", name: "Draft", members: ["submit: author only"] },
    { id: "review", name: "InReview", members: ["approve: not author", "reject → Draft"] },
    { id: "pub", name: "Published", members: ["(refuses all)"] }
  ]
};
type DocAct = "asub" | "aapp" | "vapp" | "vrej";
const ACT_LABEL: Record<DocAct, string> = {
  asub: 'submit("Asha")', aapp: 'approve("Asha")', vapp: 'approve("Vikram")', vrej: 'reject("Vikram")'
};
const ACT_MEMBER: Record<DocAct, number> = { asub: 0, aapp: 1, vapp: 1, vrej: 2 };
const STATE_NAME: Record<string, string> = { draft: "draft", review: "in review", pub: "published" };
const reviewTry = (state: "draft" | "review" | "pub", act: DocAct): TryResult => {
  const user = act[0] === "a" ? "Asha" : "Vikram";
  const verb = { asub: "submit", aapp: "approve", vapp: "approve", vrej: "reject" }[act];
  let output: string, note: string, next: string | null = null, own = false;
  if (state === "draft" && act === "asub") { output = "→ in review"; note = "Draft lets the author submit."; next = "review"; own = true; }
  else if (state === "review" && act === "vapp") { output = "→ published"; note = "InReview lets someone other than the author approve."; next = "pub"; own = true; }
  else if (state === "review" && act === "vrej") { output = "→ draft"; note = "InReview sends it back and saves Vikram's note."; next = "draft"; own = true; }
  else if (state === "review" && act === "aapp") { output = "refused"; note = "InReview: authors cannot approve their own work."; own = true; }
  else { output = "refused"; note = `Default in DocState: ${user} cannot ${verb} a ${STATE_NAME[state]} document.`; }
  return {
    output, note,
    actions: [
      ...clearAll,
      { tag: "ctx", text: STATE_NAME[state], together: true },
      { ring: state },
      ...(own ? [] : [{ mark: "base", member: ACT_MEMBER[act] } as Action]),
      { call: via(state), label: ACT_LABEL[act], result: output },
      ...(next ? [{ ring: next }, { tag: "ctx", text: STATE_NAME[next], together: true } as Action] : [{ flash: state } as Action])
    ]
  };
};
const review: ExampleAnimation = {
  diagram: stateMini(reviewCfg),
  walk: [
    [...build(reviewCfg), { ring: "draft" }, { call: via("draft"), label: 'submit("Asha")', result: "→ in review" },
      { ring: "review" }, { tag: "ctx", text: "in review" }],
    [{ call: via("review"), label: 'approve("Asha")', result: "refused: own work" }, { flash: "review" }],
    [{ call: via("review"), label: 'reject("Vikram")', result: "→ draft" }, { ring: "draft" }, { tag: "ctx", text: "draft, 1 note" }],
    [{ mark: "base", member: 0 }, { call: via("draft"), label: 'submit("Vikram")', result: "refused" }, { mark: "base", member: null },
      { call: via("draft"), label: 'submit("Asha")', result: "→ in review" }, { ring: "review" },
      { call: via("review"), label: 'approve("Vikram")', result: "→ published" }, { ring: "pub" }, { tag: "ctx", text: "published" }],
    [{ mark: "base", member: 2 }, { call: via("pub"), label: 'reject("Vikram")', result: "refused" }, { flash: "pub" }]
  ],
  tryIt: {
    prompt: "Pick the document's state and who does what. Asha is the author.",
    groups: [
      { label: "State", options: [{ id: "draft", label: "Draft" }, { id: "review", label: "InReview" }, { id: "pub", label: "Published" }] },
      { label: "Action", options: [{ id: "asub", label: "Asha submits" }, { id: "aapp", label: "Asha approves" }, { id: "vapp", label: "Vikram approves" }, { id: "vrej", label: "Vikram rejects" }] }
    ],
    results: Object.fromEntries((["draft", "review", "pub"] as const).flatMap((s) =>
      (["asub", "aapp", "vapp", "vrej"] as const).map((a) => [`${s}|${a}`, reviewTry(s, a)])))
  }
};

/* --- UPI payment: a transition table instead of classes --- */
const payDiagram: DiagramSpec = {
  label: "UpiPayment keeps a Pay value as its state, looks up the next state in TABLE and runs the entry action from ON_ENTER.",
  width: 760, height: 360,
  portraitWidth: 340, portraitHeight: 590,
  nodes: [
    { id: "client", kind: "client", name: "Bank events", hidden: true, at: { x: 16, y: 30, w: 130, h: 54 }, portrait: { x: 8, y: 14, w: 140, h: 54 } },
    { id: "ctx", kind: "concrete", name: "UpiPayment", key: true, hidden: true, members: ["- state: Pay", "- history", "+ handle(event)"],
      at: { x: 186, y: 16, w: 210, h: 120 }, portrait: { x: 160, y: 10, w: 172, h: 120 } },
    { id: "table", kind: "singleton", name: "TABLE", stereotype: "«table»", key: true, hidden: true,
      members: ["(created, send) → pending", "(pending, bank_ok) → success", "(pending, timeout) → failed", "(failed, retry) → pending", "(success, refund) → refunded"],
      at: { x: 470, y: 10, w: 276 }, portrait: { x: 8, y: 230, w: 260 } },
    { id: "pay", kind: "enum", name: "Pay", hidden: true, members: ["created, pending,", "success, failed,", "refunded"],
      at: { x: 186, y: 190, w: 210 }, portrait: { x: 8, y: 90, w: 140 } },
    { id: "enter", kind: "singleton", name: "ON_ENTER", stereotype: "«table»", hidden: true,
      members: ["success → send receipt", "failed → try again", "refunded → credit back"],
      at: { x: 470, y: 210, w: 276 }, portrait: { x: 8, y: 430, w: 260 } }
  ],
  edges: [
    { id: "e-table", from: "ctx", to: "table", type: "dependency", label: "looks up", hidden: true, route: "straight" },
    { id: "e-pay", from: "ctx", to: "pay", type: "association", hidden: true },
    { id: "e-enter", from: "ctx", to: "enter", type: "dependency", label: "runs", hidden: true,
      route: "straight", viaPortrait: [[292, 487], [292, 140]] }
  ]
};
const EVENTS = ["bank_ok", "timeout", "retry", "refund"] as const;
const TABLE: Record<string, string> = {
  "created|send": "pending", "pending|bank_ok": "success", "pending|bank_declined": "failed",
  "pending|timeout": "failed", "failed|retry": "pending", "success|refund": "refunded"
};
const ON_ENTER: Record<string, string> = {
  success: "send receipt to payer", failed: "show 'payment failed, try again'", refunded: "credit money back to the source account"
};
const payTry = (state: string, event: string): TryResult => {
  const next = TABLE[`${state}|${event}`];
  if (!next) {
    return {
      output: `ignored in ${state}`,
      note: `TABLE has no (${state}, ${event}) row, so nothing changes.`,
      actions: [{ tag: "ctx", text: "state: " + state }, { ring: "table" }, { call: ["client", "ctx", "table"], label: `handle("${event}")`, result: "no row" }, { flash: "table" }]
    };
  }
  const enter = ON_ENTER[next];
  return {
    output: `${state} → ${next}`,
    note: enter ? `Entry action: ${enter}.` : "No entry action for this state.",
    actions: [
      { tag: "ctx", text: "state: " + state },
      { ring: "table" },
      { call: ["client", "ctx", "table"], label: `handle("${event}")`, result: next },
      { tag: "ctx", text: "state: " + next },
      ...(enter ? [{ ring: "enter" } as Action, { call: ["ctx", "enter"], label: "enter " + next, result: enter.split(" ").slice(0, 3).join(" ") }] : [])
    ]
  };
};
const payment: ExampleAnimation = {
  diagram: payDiagram,
  walk: [
    [{ show: ["client", "ctx"] }, { show: ["pay"] }, { show: ["e-pay"] }, { show: ["table"] }, { show: ["e-table"] }, { show: ["enter"] }, { show: ["e-enter"] },
      { tag: "ctx", text: "₹1,250: created" }, { ring: "table" }, { call: ["client", "ctx", "table"], label: 'handle("send")', result: "pending" }, { tag: "ctx", text: "₹1,250: pending" }],
    [{ call: ["client", "ctx", "table"], label: 'handle("timeout")', result: "failed" }, { tag: "ctx", text: "₹1,250: failed" },
      { ring: "enter" }, { call: ["ctx", "enter"], label: "enter failed", result: "try again" }],
    [{ ring: "table" }, { call: ["client", "ctx", "table"], label: 'handle("refund")', result: "no row: ignored" }, { flash: "table" }],
    [{ call: ["client", "ctx", "table"], label: 'handle("retry")', result: "pending" }, { tag: "ctx", text: "₹1,250: pending" },
      { call: ["client", "ctx", "table"], label: 'handle("bank_ok")', result: "success" }, { tag: "ctx", text: "₹1,250: success" },
      { ring: "enter" }, { call: ["ctx", "enter"], label: "enter success", result: "send receipt" }],
    [{ ring: "table" }, { call: ["client", "ctx", "table"], label: 'handle("refund")', result: "refunded" }, { tag: "ctx", text: "₹1,250: refunded" },
      { ring: "enter" }, { call: ["ctx", "enter"], label: "enter refunded", result: "credit back" }, { tag: "ctx", text: "history: 6 states" }]
  ],
  tryIt: {
    prompt: "Pick the payment's state and a bank event. Does the table have a row for it?",
    groups: [
      { label: "State", options: [{ id: "pending", label: "pending" }, { id: "success", label: "success" }, { id: "failed", label: "failed" }] },
      { label: "Event", options: EVENTS.map((e) => ({ id: e, label: e })) }
    ],
    results: Object.fromEntries(["pending", "success", "failed"].flatMap((s) => EVENTS.map((e) => [`${s}|${e}`, payTry(s, e)])))
  }
};

const animation: PatternAnimation = {
  slug: "state",
  story: storyAnim,
  examples: { vending, player, review, payment },
  sequence: {
    label: "App calls ship, cancel and deliver on Order; Order forwards each call to its current state object and stores the state that comes back.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "order", name: "order: Order", kind: "concrete" },
      { id: "placed", name: ": Placed", kind: "concrete" },
      { id: "shipped", name: ": Shipped", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "order", label: "ship()" },
      { from: "order", to: "placed", label: "ship()" },
      { from: "placed", to: "order", label: "Shipped", kind: "return" },
      { from: "order", to: "order", label: "state = Shipped", kind: "self" },
      { from: "app", to: "order", label: "cancel()" },
      { from: "order", to: "shipped", label: "cancel()" },
      { from: "shipped", to: "order", label: "error: cannot cancel", kind: "return" },
      { from: "order", to: "app", label: "error: cannot cancel", kind: "return" },
      { from: "app", to: "order", label: "deliver()" },
      { from: "order", to: "shipped", label: "deliver()" },
      { from: "shipped", to: "order", label: "Delivered", kind: "return" }
    ]
  }
};

export default animation;
