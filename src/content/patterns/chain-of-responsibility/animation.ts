import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: one if/elif function becomes a chain of approver objects ---------- */

const story: DiagramSpec = {
  label: "App sends every request to TeamLead; TeamLead, Manager and Director extend the abstract Approver and are linked by next; a CFO link is added at the end.",
  width: 880,
  height: 430,
  portraitWidth: 340,
  portraitHeight: 548,
  nodes: [
    { id: "naive", kind: "concrete", name: "approve(amount)", stereotype: "«function»", members: [],
      at: { x: 20, y: 30, w: 230 }, portrait: { x: 8, y: 8, w: 222 } },
    { id: "app", kind: "client", name: "App", at: { x: 20, y: 300, w: 100, h: 56 }, portrait: { x: 240, y: 40, w: 92, h: 56 } },
    { id: "approver", kind: "abstract", name: "Approver", key: true, hidden: true,
      members: ["- next: Approver", "+ approve(amount)"],
      at: { x: 380, y: 30, w: 250 }, portrait: { x: 198, y: 282, w: 134 } },
    { id: "tl", kind: "concrete", name: "TeamLead", key: true, hidden: true, members: ["limit = 10,000"],
      at: { x: 160, y: 300, w: 140 }, portrait: { x: 8, y: 160, w: 160 } },
    { id: "mg", kind: "concrete", name: "Manager", hidden: true, members: ["limit = 100,000"],
      at: { x: 340, y: 300, w: 140 }, portrait: { x: 8, y: 252, w: 160 } },
    { id: "dr", kind: "concrete", name: "Director", hidden: true, members: ["limit = 1,000,000"],
      at: { x: 520, y: 300, w: 140 }, portrait: { x: 8, y: 344, w: 160 } },
    { id: "cfo", kind: "concrete", name: "CFO", hidden: true, members: ["limit = 5,000,000"],
      at: { x: 700, y: 300, w: 140 }, portrait: { x: 8, y: 436, w: 160 } }
  ],
  edges: [
    { id: "first", from: "app", to: "tl", type: "association", hidden: true, viaPortrait: [[60, 145], [286, 145]] },
    { id: "n1", from: "tl", to: "mg", type: "association", label: "next", hidden: true },
    { id: "n2", from: "mg", to: "dr", type: "association", label: "next", hidden: true },
    { id: "n3", from: "dr", to: "cfo", type: "association", label: "next", hidden: true },
    { id: "i-tl", from: "tl", to: "approver", type: "inheritance", hidden: true, viaPortrait: [[183, 329], [183, 191]] },
    { id: "i-mg", from: "mg", to: "approver", type: "inheritance", hidden: true, viaPortrait: [[183, 329], [183, 283]] },
    { id: "i-dr", from: "dr", to: "approver", type: "inheritance", hidden: true, viaPortrait: [[183, 329], [183, 375]] },
    { id: "i-cfo", from: "cfo", to: "approver", type: "inheritance", hidden: true, viaPortrait: [[183, 329], [183, 467]] }
  ],
  badges: [
    { id: "warn", text: "Edited for every new rule", tone: "warn", near: "naive", place: "below" },
    { id: "ok", text: "0 handlers changed", tone: "ok", near: "cfo", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: one function knows every rule",
      what: "approve(amount) checks every limit in one if/elif ladder and returns who may approve. Every new level or new order means editing this function.",
      why: "All approval rules are glued into one place, so it changes for every reason. That breaks Single Responsibility and Open/Closed, and one department cannot have a different order.",
      say: {
        what: "Here's the problem. One approve function checks every limit in a long if-else ladder. Every new level, or a new order of levels, means editing this same function.",
        why: "All the approval rules are glued together, so the function changes for every reason. That breaks single responsibility and the open-closed principle."
      },
      code: "problem",
      lines: { python: [4, 5, 6, 7, 8, 9, 10, 11], scala: [4, 5, 6, 7, 8] },
      actions: [
        { members: "naive", stagger: true,
          lines: ["if amount <= 10_000: …", "elif amount <= 100_000: …", "elif amount <= 1_000_000: …", 'return "Rejected"'],
          scalaLines: ["if amount <= 10_000 then …", "else if amount <= 100_000 …", "else if amount <= 1_000_000 …", 'else "Rejected"'] },
        { flash: "naive" },
        { shake: "naive", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Each rule becomes its own handler",
      what: "Every branch moves into a small class that knows only its own limit: TeamLead, Manager and Director.",
      why: "Each handler has one job: decide whether the amount is within its limit (Single Responsibility).",
      say: {
        what: "Each branch of the ladder moves into its own small class: team lead, manager and director. Each one knows only its own limit.",
        why: "Every handler now has exactly one job, deciding whether the amount is within its limit. That's single responsibility."
      },
      code: "main",
      lines: { python: [18, 19, 20, 23, 24, 25, 28, 29, 30], scala: [13, 14, 15, 17, 18, 19, 21, 22, 23] },
      actions: [
        { hide: ["warn"] },
        { spawn: ["tl", "mg", "dr"], from: "naive" },
        { cross: "naive" }
      ]
    },
    {
      title: "A shared Approver base holds the link",
      what: "The abstract Approver keeps a reference to the next approver and the shared rule: handle it if within the limit, otherwise pass it on.",
      why: "The “handle or forward” logic is written once. Every handler looks the same from outside, so they can be linked in any order.",
      say: {
        what: "An abstract approver class holds a link to the next approver, and the shared rule: handle it if it's within your limit, otherwise pass it on.",
        why: "The handle-or-forward logic is written only once. Every handler looks the same from outside, so they can be linked in any order."
      },
      code: "main",
      lines: { python: [1, 7, 8, 10, 11, 12, 13, 15], scala: [2, 6, 7, 9, 10] },
      actions: [
        { hide: ["naive", "naive__x"] },
        { show: ["approver"] },
        { show: ["i-tl", "i-mg", "i-dr"] }
      ]
    },
    {
      title: "The client links the chain",
      what: "App builds TeamLead → Manager → Director from the outside and keeps only the first link.",
      why: "The order lives where the chain is assembled, not inside the handlers. Another department could build a different chain from the same classes.",
      say: {
        what: "The app builds the chain from the outside: team lead, then manager, then director. It keeps only the first link.",
        why: "The order lives where the chain is put together, not inside the handlers. Another department could build a different chain from the same classes."
      },
      code: "main",
      lines: { python: [8, 34], scala: [2, 27] },
      actions: [
        { show: ["n1", "n2"] },
        { show: ["first"] },
        { call: ["app", "tl"], label: "TeamLead(Manager(Director()))", scalaLabel: "TeamLead(Some(Manager(Some(Director()))))" },
        { pulse: "tl" }
      ]
    },
    {
      title: "A small request stops at the first link",
      what: "approve(4,000) is within the TeamLead's limit, so the TeamLead answers at once and nobody else is asked.",
      why: "The sender talks only to the first link and never knows who will answer.",
      say: {
        what: "A request for four thousand rupees is within the team lead's limit, so the team lead answers straight away. Nobody else is asked.",
        why: "The sender only talks to the first link, and never knows who will answer."
      },
      code: "main",
      lines: { python: [11, 12, 36], scala: [7, 29] },
      actions: [
        { ring: "tl" },
        { call: ["app", "tl"], label: "approve(₹4,000)", result: '"TeamLead approved ₹4000"' }
      ]
    },
    {
      title: "A big request climbs the chain",
      what: "approve(600,000) is too big for TeamLead and Manager, so each one forwards it to its next link until the Director approves it.",
      why: "Each handler decides for itself whether to answer or pass on. Nobody needs a central list of who handles what.",
      say: {
        what: "Six lakh rupees is too big for the team lead and the manager, so each one forwards it to the next link, until the director approves it.",
        why: "Each handler decides for itself whether to answer or pass it on. Nobody needs a central list of who handles what."
      },
      code: "main",
      lines: { python: [11, 13, 15, 36], scala: [7, 9, 10, 29] },
      actions: [
        { ring: "dr" },
        { call: ["app", "tl", "mg", "dr"], label: "approve(₹600,000)", result: '"Director approved ₹600000"' }
      ]
    },
    {
      title: "Too big for everyone: the end of the chain",
      what: "approve(5,000,000) climbs all the way. Director has no next link, so the request is rejected.",
      why: "A request can fall off the end of a chain. Decide on purpose what the last link does: reject, or a catch-all handler.",
      say: {
        what: "Fifty lakh rupees climbs all the way up. The director has no next link, so the request is rejected.",
        why: "A request can fall off the end of a chain. Decide on purpose what the last link does: reject it, or hand it to a catch-all."
      },
      code: "main",
      lines: { python: [13, 14], scala: [9, 11] },
      actions: [
        { ring: "dr", caption: "next = None" },
        { call: ["app", "tl", "mg", "dr"], label: "approve(₹5,000,000)", result: '"Rejected: ₹5000000 needs board approval"' },
        { flash: "dr" }
      ]
    },
    {
      title: "Add a level without touching the others",
      what: "A new CFO class with a ₹50 lakh limit is linked after the Director. Only the line that builds the chain changes.",
      why: "TeamLead, Manager and Director stay exactly as they were: new behaviour is added, not edited in (Open/Closed).",
      say: {
        what: "Finally, a new C F O class with a fifty lakh limit is linked after the director. Only the line that builds the chain changes.",
        why: "The team lead, manager and director stay exactly as they were. New behaviour is added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [28, 29, 30, 34], scala: [21, 22, 23, 27] },
      actions: [
        { ring: null },
        { show: ["cfo"] },
        { show: ["i-cfo", "n3"] },
        { show: ["ok"] },
        { ring: "cfo" },
        { call: ["app", "tl", "mg", "dr", "cfo"], label: "approve(₹5,000,000)", result: '"CFO approved ₹5000000"' }
      ]
    }
  ]
};

/* ---------- real-world examples: a chain of handler objects, optionally with their shared base class ---------- */

interface Link { id: string; name: string; members: string[]; scalaMembers?: string[]; stereotype?: string; key?: boolean }
interface ChainCfg {
  label: string;
  client: string;
  links: Link[];
  base?: { name: string; members: string[]; scalaMembers?: string[] };
}

const linkHeight = (l: Link) => (l.stereotype ? 44 : 32) + (l.members.length ? l.members.length * 20 + 10 : 0);

/** Landscape: client top-left, the chain in one row (base class above it). Portrait: the chain in one column. */
function chainMini(c: ChainCfg): DiagramSpec {
  const n = c.links.length;
  const gap = n >= 4 ? 24 : 44;
  const w = Math.min(200, Math.floor((728 - (n - 1) * gap) / n));
  const rowY = c.base ? 175 : 115;
  /** 12 px extra under the members, so a value tag never covers the last member line. */
  const lh = Math.max(...c.links.map(linkHeight)) + 12;
  const pW = c.base ? 160 : 230, pX = c.base ? 8 : 55, pStep = lh + 34;
  const pY = (i: number) => 92 + i * pStep;
  const pBottom = pY(n - 1) + lh;
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 24, w: 130, h: 54 }, portrait: { x: pX, y: 8, w: 150, h: 54 } },
    ...c.links.map((l, i): DNode => ({
      id: l.id, kind: "concrete", name: l.name, members: l.members, scalaMembers: l.scalaMembers, stereotype: l.stereotype,
      key: l.key ?? true, hidden: true, at: { x: 16 + i * (w + gap), y: rowY, w, h: lh }, portrait: { x: pX, y: pY(i), w: pW, h: lh }
    }))
  ];
  const spec: DiagramSpec = {
    label: c.label,
    width: 760, height: rowY + lh + 48,
    portraitWidth: 340, portraitHeight: pBottom + 40,
    nodes,
    edges: [
      { id: "e-first", from: "client", to: c.links[0].id, type: "association", hidden: true },
      ...c.links.slice(1).map((l, i) => ({ id: "e-" + l.id, from: c.links[i].id, to: l.id, type: "association" as const, hidden: true }))
    ]
  };
  if (c.base) {
    const bh = 44 + c.base.members.length * 20 + 10;
    const by = Math.round((92 + pBottom) / 2 - bh / 2);
    const bcy = by + bh / 2;
    spec.nodes.push({ id: "base", kind: "abstract", name: c.base.name, members: c.base.members, scalaMembers: c.base.scalaMembers,
      hidden: true, at: { x: 330, y: 14, w: 260 }, portrait: { x: 198, y: by, w: 134 } });
    c.links.forEach((l, i) => spec.edges.push({ id: "i-" + l.id, from: l.id, to: "base", type: "inheritance", hidden: true,
      viaPortrait: [[183, bcy], [183, pY(i) + lh / 2]] }));
  }
  return spec;
}

const ids = (c: ChainCfg) => c.links.map((l) => l.id);
/** Build actions: client, then each link with the arrow into it, then (optionally) the base class. */
const build = (c: ChainCfg, order: string[] = ids(c)): Action[] => {
  const acts: Action[] = [];
  for (const id of order) {
    acts.push({ show: [id] });
    const i = ids(c).indexOf(id);
    const toward = order.indexOf(ids(c)[i + 1]) < order.indexOf(id) ? ids(c)[i + 1] : undefined;
    if (toward) acts.push({ show: ["e-" + toward] });
  }
  for (let i = 1; i < c.links.length; i++) {
    const id = c.links[i].id;
    if (!acts.some((a) => "show" in a && a.show.includes("e-" + id))) acts.push({ show: ["e-" + id] });
  }
  acts.push({ show: ["client"] }, { show: ["e-first"] });
  if (c.base) acts.push({ show: ["base"] }, { show: c.links.map((l) => "i-" + l.id) });
  return acts;
};
const path = (c: ChainCfg, upto: string) => ["client", ...ids(c).slice(0, ids(c).indexOf(upto) + 1)];
const tryCall = (c: ChainCfg, upto: string, label: string, output: string, note: string, pre: Action[] = []): TryResult => ({
  output, note, actions: [...pre, { ring: upto }, { call: path(c, upto), label, result: output }]
});

/* --- ATM --- */
const atmCfg: ChainCfg = {
  label: "Atm sends the amount to NoteDispenser(2000), which passes the rest to NoteDispenser(500), then NoteDispenser(100).",
  client: "Atm",
  links: [
    { id: "d2000", name: "NoteDispenser(2000)", members: ["+ dispense(amount)"] },
    { id: "d500", name: "NoteDispenser(500)", members: ["+ dispense(amount)"] },
    { id: "d100", name: "NoteDispenser(100)", members: ["+ dispense(amount)"] }
  ]
};
const clearAtm: Action[] = [{ tag: "d2000", text: null }, { tag: "d500", text: null, together: true }, { tag: "d100", text: null, together: true }];
const atmRun = (amount: number, full: boolean): TryResult => {
  const notes = full ? [2000, 500, 100] : [500, 100];
  let rest = amount;
  const paid: string[] = [];
  const tags: Action[] = [];
  let last = "";
  for (const note of notes) {
    last = "d" + note;
    const count = Math.floor(rest / note);
    if (count > 0) { paid.push(`${count} x ₹${note}`); tags.push({ tag: last, text: `${count} × ₹${note}` }); }
    rest %= note;
    if (rest === 0) break;
  }
  const output = rest > 0 ? "cannot dispense" : paid.join(", ");
  const route = ["client", ...notes.slice(0, notes.indexOf(Number(last.slice(1))) + 1).map((x) => "d" + x)];
  return {
    output,
    note: rest > 0 ? `₹${rest} is still left after the last cassette, so the ATM refuses.` : `Each cassette pays what it can and passes the rest on${full ? "" : "; with no ₹2000 cassette the ₹500 one does more work"}.`,
    actions: [
      ...clearAtm,
      full ? { show: ["d2000", "e-first", "e-d500"] } : { dim: ["d2000", "e-first", "e-d500"] },
      { ring: last },
      { call: route, label: `withdraw(₹${amount})`, result: output },
      ...(rest > 0 ? [{ flash: "client" } as Action] : tags)
    ]
  };
};
const atm: ExampleAnimation = {
  diagram: chainMini(atmCfg),
  walk: [
    [...build(atmCfg), { ring: "d2000" }, { call: ["client", "d2000"], label: "dispense(₹5600)" }],
    [{ tag: "d2000", text: "2 × ₹2000" }, { ring: "d500" }, { call: ["d2000", "d500"], label: "dispense(₹1600)" }],
    [{ tag: "d500", text: "3 × ₹500" }, { ring: "d100" }, { call: ["d500", "d100"], label: "dispense(₹100)" }],
    [{ tag: "d100", text: "1 × ₹100" }, { pulse: "d100" }, { call: ["d100", "d500", "d2000", "client"], label: "left: ₹0" }],
    [...clearAtm, { ring: "d100" }, { call: ["client", "d2000", "d500", "d100"], label: "withdraw(₹450)", result: "left ₹50: refused" }, { flash: "client" }]
  ],
  tryIt: {
    prompt: "Pick an amount and the cassettes in the chain. Watch which dispensers pay.",
    groups: [
      { label: "Amount", options: [{ id: "a5600", label: "₹5600" }, { id: "a2000", label: "₹2000" }, { id: "a700", label: "₹700" }, { id: "a450", label: "₹450" }] },
      { label: "Chain", options: [{ id: "full", label: "2000 → 500 → 100" }, { id: "no2000", label: "500 → 100" }] }
    ],
    results: Object.fromEntries([5600, 2000, 700, 450].flatMap((a) => [true, false].map((full) =>
      [`a${a}|${full ? "full" : "no2000"}`, atmRun(a, full)])))
  }
};

/* --- HTTP middleware --- */
const mwCfg: ChainCfg = {
  label: "A request goes through logger, auth and rateLimit before it reaches ordersEndpoint; any of them may answer early.",
  client: "Client",
  links: [
    { id: "logger", name: "logger", stereotype: "«middleware»", members: ["prints every result"] },
    { id: "auth", name: "auth", stereotype: "«middleware»", members: ["no token → 401"] },
    { id: "rate", name: "rateLimit", stereotype: "«middleware»", members: ["> 2 calls → 429"] },
    { id: "endpoint", name: "ordersEndpoint", stereotype: "«endpoint»", members: ["→ 200 OK"], key: false }
  ]
};
const mwTry = (who: "asha" | "ravi", nth: 1 | 3): TryResult => {
  if (who === "ravi") {
    return tryCall(mwCfg, "auth", "GET /orders (ravi)", "401 Unauthorized",
      `No token, so auth answers before rateLimit even counts the call${nth === 3 ? ", every time" : ""}.`,
      [{ tag: "rate", text: "ravi: 0 calls" }]);
  }
  return nth === 1
    ? tryCall(mwCfg, "endpoint", "GET /orders (asha)", "200 OK: orders of asha", "Every check passes, so the endpoint runs.", [{ tag: "rate", text: "asha: 1 call" }])
    : tryCall(mwCfg, "rate", "GET /orders (asha, 3rd)", "429 Too Many Requests", "The third call is over the limit of 2.", [{ tag: "rate", text: "asha: 3 calls" }]);
};
const middleware: ExampleAnimation = {
  diagram: chainMini(mwCfg),
  walk: [
    build(mwCfg, ["endpoint", "rate", "auth", "logger"]),
    [{ tag: "rate", text: "asha: 1 call" }, { ring: "endpoint" }, { call: path(mwCfg, "endpoint"), label: "GET /orders (asha)", result: "200 OK: orders of asha" }],
    [{ ring: "auth" }, { call: path(mwCfg, "auth"), label: "GET /orders (ravi)", result: "401 Unauthorized" }, { flash: "auth" }],
    [{ tag: "rate", text: "asha: 3 calls" }, { ring: "rate" }, { call: path(mwCfg, "rate"), label: "GET /orders (asha, 3rd)", result: "429 Too Many Requests" }, { flash: "rate" }],
    [{ ring: "logger" }, { pulse: "logger" }, { tag: "logger", text: "4 results logged" }]
  ],
  tryIt: {
    prompt: "Who is calling, and which call is it? See where the chain stops.",
    groups: [
      { label: "User", options: [{ id: "asha", label: "Asha (has token)" }, { id: "ravi", label: "Ravi (no token)" }] },
      { label: "Call", options: [{ id: "c1", label: "1st call" }, { id: "c3", label: "3rd call" }] }
    ],
    results: {
      "asha|c1": mwTry("asha", 1), "asha|c3": mwTry("asha", 3),
      "ravi|c1": mwTry("ravi", 1), "ravi|c3": mwTry("ravi", 3)
    }
  }
};

/* --- support escalation --- */
const supCfg: ChainCfg = {
  label: "A ticket goes to Chatbot, then Level1Agent, Level2Specialist and Engineer; all extend SupportHandler.",
  client: "supportDemo",
  links: [
    { id: "bot", name: "Chatbot", members: ["+ can_handle(t)"], scalaMembers: ["+ canHandle(t)"] },
    { id: "l1", name: "Level1Agent", members: ["+ can_handle(t)"], scalaMembers: ["+ canHandle(t)"] },
    { id: "l2", name: "Level2Specialist", members: ["+ can_handle(t)"], scalaMembers: ["+ canHandle(t)"] },
    { id: "eng", name: "Engineer", members: ["+ can_handle(t)"], scalaMembers: ["+ canHandle(t)"] }
  ],
  base: { name: "SupportHandler", members: ["- next", "+ handle(ticket)"] }
};
const SOLVER: Record<string, [string, string]> = {
  bot: ["Chatbot", "Chatbot"], l1: ["Level1Agent", "Chatbot → Level1Agent"],
  l2: ["Level2Specialist", "Chatbot → Level1Agent → Level2Specialist"], eng: ["Engineer", "all four links"]
};
const supTry = (topic: string, solver: string): TryResult =>
  tryCall(supCfg, solver, `handle(${topic})`, `${SOLVER[solver][0]} resolved it`, `Path: ${SOLVER[solver][1]}.`);
const support: ExampleAnimation = {
  diagram: chainMini(supCfg),
  walk: [
    build(supCfg),
    [{ ring: "bot" }, { call: path(supCfg, "bot"), label: "handle(password reset)", result: "Chatbot resolved it" }],
    [{ ring: "l1" }, { call: path(supCfg, "l1"), label: "handle(refund)", result: "Level1Agent resolved it" }],
    [{ ring: "l2" }, { call: path(supCfg, "l2"), label: "handle(bug, P3)", result: "Level2Specialist resolved it" }],
    [{ tag: "eng", text: "catch-all" }, { ring: "eng" }, { call: path(supCfg, "eng"), label: "handle(bug, P1)", result: "Engineer resolved it" }]
  ],
  tryIt: {
    prompt: "Raise a ticket: pick a topic and a priority. Who solves it?",
    groups: [
      { label: "Topic", options: [{ id: "pw", label: "password reset" }, { id: "refund", label: "refund" }, { id: "bug", label: "bug" }] },
      { label: "Priority", options: [{ id: "P3", label: "P3 (normal)" }, { id: "P1", label: "P1 (urgent)" }] }
    ],
    results: {
      "pw|P3": supTry("password reset", "bot"), "pw|P1": supTry("password reset", "bot"),
      "refund|P3": supTry("refund", "l1"), "refund|P1": supTry("refund", "l1"),
      "bug|P3": supTry("bug, P3", "l2"), "bug|P1": supTry("bug, P1", "eng")
    }
  }
};

/* --- checkout validation --- */
const chkCfg: ChainCfg = {
  label: "buildChain links StockCheck, PincodeCheck and PaymentCheck; each extends Check and stops the order on failure.",
  client: "buildChain",
  links: [
    { id: "stock", name: "StockCheck", members: ["+ check(order)"] },
    { id: "pin", name: "PincodeCheck", members: ["+ check(order)"] },
    { id: "pay", name: "PaymentCheck", members: ["+ check(order)"] }
  ],
  base: { name: "Check", members: ["- next", "+ validate(order)"] }
};
const checkout: ExampleAnimation = {
  diagram: chainMini(chkCfg),
  walk: [
    build(chkCfg),
    [{ ring: "pay" }, { call: path(chkCfg, "pay"), label: "validate(2 kurta)", result: "Order placed" }],
    [{ ring: "stock" }, { call: path(chkCfg, "stock"), label: "validate(1 saree)", result: "only 0 saree left" }, { flash: "stock" }],
    [{ ring: "pin" }, { call: path(chkCfg, "pin"), label: "validate(pincode 5600)", result: "bad pincode 5600" }, { flash: "pin" }],
    [{ ring: "pay" }, { call: path(chkCfg, "pay"), label: "validate(ravi-upi)", result: "bad UPI id ravi-upi" }, { flash: "pay" }]
  ],
  tryIt: {
    prompt: "Pick an order. Which check stops it, if any?",
    groups: [
      { label: "Order", options: [
        { id: "ok", label: "2 kurta, all fine" }, { id: "saree", label: "1 saree" },
        { id: "pin", label: "pincode 5600" }, { id: "upi", label: "UPI ravi-upi" }
      ] }
    ],
    results: {
      ok: tryCall(chkCfg, "pay", "validate(2 kurta)", "Order placed", "All three checks pass, so the last link places the order."),
      saree: tryCall(chkCfg, "stock", "validate(1 saree)", "StockCheck: only 0 saree left", "Rejected by StockCheck; the other checks never run."),
      pin: tryCall(chkCfg, "pin", "validate(pincode 5600)", "PincodeCheck: bad pincode 5600", "Rejected by PincodeCheck: a pincode needs 6 digits."),
      upi: tryCall(chkCfg, "pay", "validate(ravi-upi)", "PaymentCheck: bad UPI id ravi-upi", "Rejected by PaymentCheck: a UPI id needs an @.")
    }
  }
};

const animation: PatternAnimation = {
  slug: "chain-of-responsibility",
  story: storyAnim,
  examples: { atm, middleware, support, checkout },
  sequence: {
    label: "App asks the TeamLead, who approves ₹4000 itself; for ₹600000 the request is forwarded to the Manager and then the Director, and the answer travels back.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "tl", name: "tl: TeamLead", kind: "concrete" },
      { id: "mg", name: "mg: Manager", kind: "concrete" },
      { id: "dr", name: "dr: Director", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "tl", label: "approve(4000)" },
      { from: "tl", to: "app", label: '"TeamLead approved ₹4000"', kind: "return" },
      { from: "app", to: "tl", label: "approve(600000)" },
      { from: "tl", to: "mg", label: "approve(600000)" },
      { from: "mg", to: "dr", label: "approve(600000)" },
      { from: "dr", to: "mg", label: '"Director approved ₹600000"', kind: "return" },
      { from: "mg", to: "tl", label: '"Director approved ₹600000"', kind: "return" },
      { from: "tl", to: "app", label: '"Director approved ₹600000"', kind: "return" }
    ]
  }
};

export default animation;
