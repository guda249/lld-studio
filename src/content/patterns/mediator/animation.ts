import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryIt } from "../../../anim/types";

/* ---------- story: a mesh of users becomes members talking through one ChatRoom ---------- */

const USER_LINES = (n: number) => [`- contacts: ${n} users`, "+ say(text)"];
const MEMBER_LINES = ["- room: ChatMediator", "+ say(text, to)"];

/** Box height with 12 px extra at the bottom, so a value tag (drawn on the bottom border) never covers the last member. */
const TAG_H = (lines: number) => 32 + 20 * lines + 10 + 12;

const story: DiagramSpec = {
  label: "Problem: every User links to every other User. Solution: each Member links only to the ChatMediator interface, which ChatRoom implements; App creates the room.",
  width: 930,
  height: 410,
  portraitWidth: 340,
  portraitHeight: 600,
  nodes: [
    { id: "asha", kind: "concrete", name: "asha", members: USER_LINES(2), at: { x: 40, y: 100, w: 160, h: TAG_H(2) }, portrait: { x: 8, y: 40, w: 156, h: TAG_H(2) } },
    { id: "ravi", kind: "concrete", name: "ravi", members: USER_LINES(2), at: { x: 270, y: 100, w: 160, h: TAG_H(2) }, portrait: { x: 176, y: 40, w: 156, h: TAG_H(2) } },
    { id: "meera", kind: "concrete", name: "meera", members: USER_LINES(2), at: { x: 500, y: 100, w: 160, h: TAG_H(2) }, portrait: { x: 8, y: 170, w: 156, h: TAG_H(2) } },
    { id: "kabir", kind: "concrete", name: "kabir", hidden: true, members: USER_LINES(3), at: { x: 730, y: 100, w: 160, h: TAG_H(2) }, portrait: { x: 176, y: 170, w: 156, h: TAG_H(2) } },
    { id: "iface", kind: "interface", name: "ChatMediator", key: true, hidden: true, members: ["+ send(sender, text, to)"],
      at: { x: 345, y: 250, w: 240 }, portrait: { x: 50, y: 310, w: 240 } },
    { id: "room", kind: "concrete", name: "ChatRoom", key: true, hidden: true,
      members: ["- members: dict[str, Member]", "- muted: set[tuple[str, str]]", "+ join(m) · mute(l, s)", "+ send(sender, text, to)"],
      scalaMembers: ["- members: LinkedHashMap", "- muted: Set[(String,String)]", "+ join(m) · mute(l, s)", "+ send(sender, text, to)"],
      at: { x: 650, y: 240, w: 260, h: TAG_H(4) }, portrait: { x: 112, y: 440, w: 220, h: TAG_H(4) } },
    { id: "app", kind: "client", name: "App", hidden: true, at: { x: 40, y: 260, w: 120, h: 56 }, portrait: { x: 8, y: 455, w: 92, h: 56 } }
  ],
  edges: [
    // the problem: direct links between users (a mesh)
    { id: "ar", from: "asha", to: "ravi", type: "association" },
    { id: "rm", from: "ravi", to: "meera", type: "association", route: "straight" },
    { id: "am", from: "asha", to: "meera", type: "association", via: [[560, 76], [100, 76]] },
    { id: "mk", from: "meera", to: "kabir", type: "association", hidden: true },
    { id: "rk", from: "ravi", to: "kabir", type: "association", hidden: true, via: [[790, 50], [330, 50]] },
    { id: "ak", from: "asha", to: "kabir", type: "association", hidden: true, route: "straight", via: [[840, 24], [70, 24]] },
    // the solution: every member knows only the mediator interface
    { id: "l-asha", from: "asha", to: "iface", type: "association", hidden: true, viaPortrait: [[170, 100]] },
    { id: "l-ravi", from: "ravi", to: "iface", type: "association", hidden: true, viaPortrait: [[170, 100]] },
    { id: "l-meera", from: "meera", to: "iface", type: "association", hidden: true },
    { id: "l-kabir", from: "kabir", to: "iface", type: "association", hidden: true },
    { id: "real", from: "room", to: "iface", type: "realization", hidden: true, viaPortrait: [[290, 400]] }
  ],
  badges: [
    { id: "warn", text: "All 3 users edited", tone: "warn", near: "meera", place: "below" },
    { id: "ok", text: "Others: 0 lines changed", tone: "ok", near: "iface", place: "below" }
  ]
};

const SEND = (who: string) => [who, "iface", "room"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: everyone is linked to everyone",
      what: "Each User keeps a list of every other user. When kabir joins, asha, ravi and meera all get a new link, and each sender re-checks the mute rule itself.",
      why: "Links grow as N × (N − 1): 4 users already need 12. Every new user or rule touches every class, which breaks Single Responsibility and Open/Closed.",
      say: {
        what: "Here's the problem. Every user keeps a list of every other user. When Kabir joins, Asha, Ravi and Meera all get a new link, and each sender checks the mute rule by itself.",
        why: "The links grow very fast: four users already need twelve. Every new user or new rule touches every class."
      },
      code: "problem",
      lines: { python: [4, 11, 12, 18, 19, 20, 21, 22, 26], scala: [4, 10, 11, 17, 18, 19, 20, 21, 25] },
      actions: [
        { show: ["kabir"] },
        { show: ["mk", "rk", "ak"] },
        { members: "asha", lines: USER_LINES(3) },
        { members: "ravi", lines: USER_LINES(3), together: true },
        { members: "meera", lines: USER_LINES(3), together: true },
        { flash: "asha" },
        { flash: "ravi", together: true },
        { flash: "meera", together: true },
        { shake: "meera", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Cut the direct links: talk to one mediator",
      what: "The links between users disappear. Each Member now holds just one reference, room, typed as the ChatMediator interface, and say() hands the message to it.",
      why: "Many-to-many becomes many-to-one. A member no longer knows who else exists, so it can be reused and tested alone.",
      say: {
        what: "Now the links between users disappear. Each member holds just one reference, to the chat mediator interface, and say simply hands the message to it.",
        why: "Many-to-many becomes many-to-one. A member no longer knows who else exists, so it can be reused and tested on its own."
      },
      code: "main",
      lines: { python: [4, 6, 9, 12, 15, 18], scala: [3, 4, 6, 7, 10, 11] },
      actions: [
        { hide: ["warn"] },
        { hide: ["ar", "rm", "am", "mk", "rk", "ak"], together: true },
        { hide: ["kabir"], together: true },
        { members: "asha", lines: MEMBER_LINES },
        { members: "ravi", lines: MEMBER_LINES, together: true },
        { members: "meera", lines: MEMBER_LINES, together: true },
        { show: ["iface"] },
        { show: ["l-asha", "l-ravi", "l-meera"] }
      ]
    },
    {
      title: "ChatRoom holds every routing rule",
      what: "ChatRoom implements ChatMediator. It knows all members and the mute list, and send() decides who receives each message.",
      why: "Broadcast, direct messages and muting now live in one class (Single Responsibility). Members depend only on the interface (Dependency Inversion).",
      say: {
        what: "The chat room implements the mediator interface. It knows all the members and the mute list, and its send method decides who receives each message.",
        why: "Broadcast, direct messages and muting now live in one class. Members depend only on the interface. That's single responsibility and dependency inversion."
      },
      code: "main",
      lines: { python: [24, 26, 27, 36, 37, 38, 39, 40, 41, 42, 43], scala: [16, 17, 18, 26, 27, 28, 29, 30, 31] },
      actions: [
        { show: ["room"] },
        { show: ["real"] },
        { ring: "room", caption: "every rule lives here" },
        { mark: "room", member: 3 }
      ]
    },
    {
      title: "Members join and a rule is added",
      what: "App lets asha, ravi and meera join the room, then adds one rule: asha mutes ravi. Only the room stores it.",
      why: "A new interaction rule is one call on the mediator. No member class changes.",
      say: {
        what: "The app lets Asha, Ravi and Meera join the room. Then it adds one rule: Asha mutes Ravi. Only the room stores it.",
        why: "A new interaction rule is one call on the mediator. No member class changes."
      },
      code: "main",
      lines: { python: [29, 30, 31, 46, 47, 48, 49, 50], scala: [20, 21, 22, 34, 35, 36, 37, 38, 39] },
      actions: [
        { ring: null },
        { mark: "room", member: null, together: true },
        { show: ["app"] },
        { call: ["app", "room"], label: "join(asha, ravi, meera)" },
        { tag: "room", text: "3 members" },
        { call: ["app", "room"], label: 'mute("asha", "ravi")' },
        { mark: "room", member: 1 },
        { tag: "room", text: "asha mutes ravi", together: true }
      ]
    },
    {
      title: "A broadcast goes through the room",
      what: "asha says “Standup in 5 minutes”. The message goes to the room, and the room delivers it to everyone except the sender.",
      why: "asha never names ravi or meera. Who receives a message is the mediator's decision.",
      say: {
        what: "Asha says: stand-up in five minutes. The message goes to the room, and the room delivers it to everyone except the sender.",
        why: "Asha never names Ravi or Meera. Who receives a message is the mediator's decision."
      },
      code: "main",
      lines: { python: [52, 18, 40, 41, 42, 43], scala: [41, 11, 29, 30, 31] },
      actions: [
        { mark: "room", member: null },
        { ring: "asha", together: true },
        { call: SEND("asha"), label: 'say("Standup in 5 minutes")' },
        { call: ["room", "ravi"], label: "receive(asha, …)" },
        { call: ["room", "meera"], label: "receive(asha, …)", together: true },
        { tag: "ravi", text: "inbox: 1" },
        { tag: "meera", text: "inbox: 1", together: true }
      ]
    },
    {
      title: "A direct message, same mediator",
      what: "ravi sends “Can you review my PR?” to meera only. The room looks up meera and delivers it to her alone.",
      why: "A new kind of message needed a change in one place: the room's send(). Members stayed the same.",
      say: {
        what: "Ravi sends a direct message to Meera: can you review my PR? The room looks Meera up and delivers it to her alone.",
        why: "A new kind of message needed a change in just one place, the room's send method."
      },
      code: "main",
      lines: { python: [53, 37, 38], scala: [42, 27, 28] },
      actions: [
        { ring: "ravi" },
        { call: SEND("ravi"), label: 'say("Review my PR?", to="meera")', scalaLabel: 'say("Review my PR?", Some("meera"))' },
        { mark: "room", member: 3 },
        { call: ["room", "meera"], label: "receive(ravi, …)" },
        { tag: "meera", text: "inbox: 2" }
      ]
    },
    {
      title: "The mute rule is applied in one place",
      what: "ravi asks “Lunch at 1?” to everyone. The room delivers it to meera but skips asha, because asha muted ravi.",
      why: "Earlier every sender re-checked muting. Now one line in the mediator enforces it for everybody.",
      say: {
        what: "Ravi asks everyone: lunch at one? The room delivers it to Meera, but skips Asha, because Asha muted Ravi.",
        why: "Before, every sender re-checked muting. Now one line in the mediator enforces it for everybody."
      },
      code: "main",
      lines: { python: [54, 42, 43, 55, 56], scala: [43, 31, 44, 45] },
      actions: [
        { call: SEND("ravi"), label: 'say("Lunch at 1?")' },
        { mark: "room", member: 1 },
        { call: ["room", "meera"], label: "receive(ravi, …)" },
        { tag: "meera", text: "inbox: 3" },
        { pulse: "asha" },
        { tag: "asha", text: "inbox: 0 (muted)", together: true }
      ]
    },
    {
      title: "A new member joins with one link",
      what: "kabir joins the room. He gets one link, to the mediator, and asha, ravi and meera are not touched.",
      why: "Others: 0 lines changed. Adding a colleague is one join() call instead of editing every class (Open/Closed).",
      say: {
        what: "Finally, Kabir joins the room. He gets exactly one link, to the mediator. Asha, Ravi and Meera are not touched at all.",
        why: "Zero lines changed in the other members. Adding a colleague is one join call, instead of editing every class. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [29, 30, 31, 48, 49], scala: [20, 21, 22, 38] },
      actions: [
        { ring: null },
        { mark: "room", member: null, together: true },
        { members: "kabir", lines: MEMBER_LINES },
        { show: ["kabir"] },
        { call: ["app", "room"], label: "join(kabir)" },
        { show: ["l-kabir"] },
        { show: ["ok"] },
        { pulse: "iface", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples ---------- */

/** Four colleagues in a row (2 × 2 on phones) and the mediator underneath. Top-row lines share the middle gap on phones. */
function fourAndHub(o: {
  label: string; ids: [string, string, string, string]; names: [string, string, string, string];
  members: string[][]; scalaMembers?: (string[] | undefined)[]; colleagueH: number;
  hub: { id: string; name: string; members: string[]; scalaMembers?: string[]; w: number };
  extra?: { iface: { name: string; members: string[] }; hubMembers?: string[] };
}): DiagramSpec {
  const h = o.colleagueH;
  const xs = [20, 205, 390, 575];
  const px = [8, 176, 8, 176];
  const py = [14, 14, 14 + h + 20, 14 + h + 20];
  const hubY = 24 + h + 70;
  const hubPY = py[2] + h + 72;
  const spec: DiagramSpec = {
    label: o.label,
    width: 760, height: 0, portraitWidth: 340, portraitHeight: 0,
    nodes: o.ids.map((id, i) => ({
      id, kind: "concrete" as const, name: o.names[i], hidden: true, members: o.members[i], scalaMembers: o.scalaMembers?.[i],
      at: { x: xs[i], y: 24, w: 165, h }, portrait: { x: px[i], y: py[i], w: 156, h }
    })),
    edges: o.ids.map((id, i) => ({
      id: "l-" + id, from: id, to: o.hub.id, type: "association" as const, hidden: true,
      viaPortrait: i < 2 ? [[170, py[0] + h / 2 + 14]] as [number, number][] : undefined
    }))
  };
  const hubH = TAG_H(o.hub.members.length);
  spec.nodes.push({ id: o.hub.id, kind: "concrete", name: o.hub.name, key: true, hidden: true, members: o.hub.members, scalaMembers: o.hub.scalaMembers,
    at: { x: 380 - o.hub.w / 2, y: hubY, w: o.hub.w, h: hubH }, portrait: { x: 170 - Math.min(o.hub.w, 300) / 2, y: hubPY, w: Math.min(o.hub.w, 300), h: hubH } });
  spec.height = hubY + hubH + 34;
  spec.portraitHeight = hubPY + hubH + 34;
  return spec;
}

/* --- air-traffic control --- */

const atcDiagram = fourAndHub({
  label: "Four Plane objects each talk only to the Tower mediator, which owns the runway and the landing queue.",
  ids: ["ai", "ie", "uk", "sg"],
  names: ["AI101: Plane", "6E202: Plane", "UK303: Plane", "SG404: Plane"],
  members: [0, 1, 2, 3].map(() => ["+ request_landing()"]),
  scalaMembers: [0, 1, 2, 3].map(() => ["+ requestLanding()"]),
  colleagueH: 62,
  hub: { id: "tower", name: "Tower", w: 230,
    members: ["- on_runway: Plane | None", "- waiting: deque[Plane]"],
    scalaMembers: ["- onRunway: Option[Plane]", "- waiting: ArrayDeque[Plane]"] }
});

const REQ = { label: "request_landing()", scalaLabel: "requestLanding()" };
const REQ_EM = { label: "request_landing(emergency)", scalaLabel: "requestLanding(emergency)" };
const VACATE = { label: "vacate_runway()", scalaLabel: "vacateRunway()" };

const atcTry: TryIt = {
  prompt: "Which plane reports low fuel? See the landing order the tower produces.",
  groups: [{ label: "Low fuel", options: [
    { id: "none", label: "Nobody" }, { id: "ie", label: "6E202" }, { id: "uk", label: "UK303" }, { id: "sg", label: "SG404" }
  ] }],
  results: {
    none: { output: "AI101 → 6E202 → UK303 → SG404", note: "No emergency: the queue is first come, first served.",
      actions: [{ ring: "tower" }, { call: ["sg", "tower"], ...REQ, result: "hold, number 3" }] },
    ie: { output: "AI101 → 6E202 → UK303 → SG404", note: "6E202 jumps an empty queue, so the order does not change.",
      actions: [{ ring: "ie" }, { call: ["ie", "tower"], ...REQ_EM, result: "you are next" }] },
    uk: { output: "AI101 → UK303 → 6E202 → SG404", note: "UK303 is put at the front, ahead of 6E202.",
      actions: [{ ring: "uk" }, { call: ["uk", "tower"], ...REQ_EM, result: "you are next" }] },
    sg: { output: "AI101 → SG404 → 6E202 → UK303", note: "SG404 asks last but lands second, as in the demo.",
      actions: [{ ring: "sg" }, { call: ["sg", "tower"], ...REQ_EM, result: "you are next" }] }
  }
};

/* Try-it plays on top of the finished walkthrough, so each result also resets the tower's tag. */
for (const r of Object.values(atcTry.results)) {
  r.actions.push({ tag: "tower", text: "queue: " + r.output.split(" → ").slice(1).join(", ") });
}

const atc: ExampleAnimation = {
  diagram: atcDiagram,
  walk: [
    [
      { show: ["ai", "ie", "uk", "sg"] },
      { show: ["tower"] },
      { show: ["l-ai", "l-ie", "l-uk", "l-sg"] },
      { call: ["ai", "tower"], ...REQ, result: "cleared to land" },
      { tag: "tower", text: "runway: AI101" }
    ],
    [
      { call: ["ie", "tower"], ...REQ, result: "hold, number 1" },
      { call: ["uk", "tower"], ...REQ, result: "hold, number 2" },
      { tag: "tower", text: "queue: 6E202, UK303" }
    ],
    [
      { ring: "sg" },
      { call: ["sg", "tower"], ...REQ_EM, result: "priority, you are next" },
      { tag: "tower", text: "queue: SG404, 6E202, UK303" }
    ],
    [
      { call: ["ai", "tower"], ...VACATE },
      { call: ["tower", "sg"], label: "cleared to land" },
      { tag: "tower", text: "runway: SG404" }
    ],
    [
      { ring: "ie" },
      { call: ["sg", "tower"], ...VACATE },
      { call: ["tower", "ie"], label: "cleared to land" },
      { tag: "tower", text: "runway: 6E202" }
    ]
  ],
  tryIt: atcTry
};

/* --- signup form --- */

const formDiagram: DiagramSpec = {
  label: "Four widgets (name, business, gstin, submit) tell the FormMediator interface when they change; SignupForm implements it and holds the rules.",
  width: 760, height: 250, portraitWidth: 340, portraitHeight: 440,
  nodes: [
    { id: "name", kind: "concrete", name: "name: TextField", hidden: true, members: ["+ type_in(text)"], scalaMembers: ["+ typeIn(text)"],
      at: { x: 16, y: 16, w: 170, h: TAG_H(1) }, portrait: { x: 8, y: 14, w: 156, h: TAG_H(1) } },
    { id: "business", kind: "concrete", name: "business: Checkbox", hidden: true, members: ["+ toggle()"],
      at: { x: 200, y: 16, w: 170, h: TAG_H(1) }, portrait: { x: 176, y: 14, w: 156, h: TAG_H(1) } },
    { id: "gstin", kind: "concrete", name: "gstin: TextField", hidden: true, members: ["+ type_in(text)"], scalaMembers: ["+ typeIn(text)"],
      at: { x: 384, y: 16, w: 170, h: TAG_H(1) }, portrait: { x: 8, y: 104, w: 156, h: TAG_H(1) } },
    { id: "submit", kind: "concrete", name: "submit: Button", hidden: true, members: ["+ click()"],
      at: { x: 568, y: 16, w: 170, h: TAG_H(1) }, portrait: { x: 176, y: 104, w: 156, h: TAG_H(1) } },
    { id: "iface", kind: "interface", name: "FormMediator", key: true, hidden: true, members: ["+ changed(widget)"],
      at: { x: 200, y: 140, w: 230 }, portrait: { x: 8, y: 230, w: 220 } },
    { id: "form", kind: "concrete", name: "SignupForm", key: true, hidden: true,
      members: ["+ changed(widget)", "- apply_rules()"], scalaMembers: ["+ changed(widget)", "- applyRules()"],
      at: { x: 500, y: 135, w: 230 }, portrait: { x: 100, y: 330, w: 220 } }
  ],
  edges: [
    { id: "l-name", from: "name", to: "iface", type: "association", hidden: true, viaPortrait: [[170, 59]] },
    { id: "l-business", from: "business", to: "iface", type: "association", hidden: true, viaPortrait: [[170, 59]] },
    { id: "l-gstin", from: "gstin", to: "iface", type: "association", hidden: true },
    { id: "l-submit", from: "submit", to: "iface", type: "association", hidden: true },
    { id: "real", from: "form", to: "iface", type: "realization", hidden: true }
  ]
};

const CHANGED = (w: string) => ({ call: [w, "iface", "form"], label: `changed(${w})` });

const formResults: TryIt["results"] = {};
const formTable: Record<string, [string, string]> = {
  "empty|personal": ["GSTIN off, submit off", "No name yet, so submit stays off."],
  "empty|biz": ["GSTIN on, submit off", "Business turns GSTIN on; no name, so submit stays off."],
  "empty|bizgst": ["GSTIN on, submit off", "The GSTIN is fine, but the name is still empty."],
  "typed|personal": ["GSTIN off, submit on", "A personal account needs only a name."],
  "typed|biz": ["GSTIN on, submit off", "Business needs a 15-character GSTIN first."],
  "typed|bizgst": ["GSTIN on, submit on", "Name filled and GSTIN has 15 characters."]
};
for (const [k, [output, note]] of Object.entries(formTable)) {
  formResults[k] = {
    output, note,
    actions: [
      { ring: "form" },
      { tag: "gstin", text: output.startsWith("GSTIN on") ? "on" : "off" },
      { tag: "submit", text: output.endsWith("on") ? "on" : "off", together: true },
      { call: ["form", "gstin"], label: "gstin.enabled = " + (output.startsWith("GSTIN on") ? "True" : "False"),
        scalaLabel: "gstin.enabled = " + (output.startsWith("GSTIN on") ? "true" : "false") },
      { call: ["form", "submit"], label: "apply_rules()", scalaLabel: "applyRules()", result: output.endsWith("on") ? "submit on" : "submit off" }
    ]
  };
}

const form: ExampleAnimation = {
  diagram: formDiagram,
  walk: [
    [
      { show: ["name", "business", "gstin", "submit"] },
      { show: ["iface"] },
      { show: ["l-name", "l-business", "l-gstin", "l-submit"] },
      { show: ["form"] },
      { show: ["real"] },
      { tag: "gstin", text: "off" },
      { tag: "submit", text: "off", together: true }
    ],
    [
      { ring: "name" },
      CHANGED("name"),
      { call: ["form", "submit"], label: "enable" },
      { tag: "submit", text: "on" }
    ],
    [
      { ring: "business" },
      CHANGED("business"),
      { call: ["form", "gstin"], label: "enable" },
      { tag: "gstin", text: "on" },
      { call: ["form", "submit"], label: "disable" },
      { tag: "submit", text: "off" }
    ],
    [
      { ring: "gstin" },
      { ...CHANGED("gstin"), label: "changed(gstin): 15 chars" },
      { call: ["form", "submit"], label: "enable" },
      { tag: "submit", text: "on" }
    ],
    [
      { ring: "submit" },
      { pulse: "submit" },
      { tag: "submit", text: "submitted!" }
    ]
  ],
  tryIt: {
    prompt: "Fill in the form and see which fields the SignupForm turns on.",
    groups: [
      { label: "Name", options: [{ id: "empty", label: "Empty" }, { id: "typed", label: "Asha Traders" }] },
      { label: "Account", options: [{ id: "personal", label: "Personal" }, { id: "biz", label: "Business, no GSTIN" }, { id: "bizgst", label: "Business + GSTIN" }] }
    ],
    results: formResults
  }
};

/* --- auction --- */

const auctionDiagram: DiagramSpec = {
  label: "Three Bidder objects send bids only to the AuctionHouse mediator, which checks the minimum step and tells bidders what happened.",
  width: 760, height: 300, portraitWidth: 340, portraitHeight: 356,
  nodes: [
    { id: "asha", kind: "concrete", name: "asha: Bidder", hidden: true, members: ["+ bid(amount)"], at: { x: 40, y: 24, w: 170 }, portrait: { x: 8, y: 14, w: 156 } },
    { id: "ravi", kind: "concrete", name: "ravi: Bidder", hidden: true, members: ["+ bid(amount)"], at: { x: 295, y: 24, w: 170 }, portrait: { x: 176, y: 14, w: 156 } },
    { id: "kabir", kind: "concrete", name: "kabir: Bidder", hidden: true, members: ["+ bid(amount)"], at: { x: 550, y: 24, w: 170 }, portrait: { x: 92, y: 96, w: 156 } },
    { id: "house", kind: "concrete", name: "AuctionHouse", key: true, hidden: true,
      members: ["- top: Bidder | None", "- top_amount: int", "+ place_bid(bidder, amount)"],
      scalaMembers: ["- top: Option[Bidder]", "- topAmount: Int", "+ placeBid(bidder, amount)"],
      at: { x: 230, y: 160, w: 300, h: TAG_H(3) }, portrait: { x: 30, y: 220, w: 280, h: TAG_H(3) } }
  ],
  edges: ["asha", "ravi", "kabir"].map((id) => ({ id: "l-" + id, from: id, to: "house", type: "association" as const, hidden: true }))
};

const BID = (who: string, amount: string, result?: string): Action => ({ call: [who, "house"], label: `bid(₹${amount})`, ...(result ? { result } : {}) });

const auctionTable: Record<string, [string, string, string]> = {
  s2000: ["asha wins at ₹125000", "Every bid clears a ₹2000 step; even ravi's ₹102000 counts.", "asha"],
  s5000: ["asha wins at ₹125000", "As in the demo: only ravi's ₹102000 is rejected.", "asha"],
  s10000: ["kabir wins at ₹120000", "Both of ravi's bids and asha's ₹125000 are below the minimum.", "kabir"],
  s20000: ["kabir wins at ₹120000", "kabir's ₹120000 is exactly the minimum; asha needed ₹140000.", "kabir"]
};
const auctionResults: TryIt["results"] = {};
for (const [k, [output, note, winner]] of Object.entries(auctionTable)) {
  auctionResults[k] = { output, note, actions: [
    { ring: "house" },
    { tag: "house", text: "top: " + output.replace(" wins at", "") },
    { call: ["house", winner], label: "close()", result: output.replace(" wins", " won") },
    { ring: winner }
  ] };
}

const auction: ExampleAnimation = {
  diagram: auctionDiagram,
  walk: [
    [
      { show: ["house"] },
      { show: ["asha", "ravi", "kabir"] },
      { show: ["l-asha", "l-ravi", "l-kabir"] },
      { tag: "house", text: "start ₹100000, step ₹5000" }
    ],
    [
      BID("asha", "100000"),
      { tag: "house", text: "top: asha ₹100000" },
      { ring: "ravi" },
      BID("ravi", "102000", "rejected, minimum ₹105000"),
      { flash: "ravi" }
    ],
    [
      BID("ravi", "105000"),
      { call: ["house", "asha"], label: "outbid at ₹105000" },
      { tag: "house", text: "top: ravi ₹105000" }
    ],
    [
      { ring: "kabir" },
      BID("kabir", "120000"),
      { call: ["house", "ravi"], label: "outbid at ₹120000" },
      { ring: "asha" },
      BID("asha", "125000"),
      { call: ["house", "kabir"], label: "outbid at ₹125000" },
      { tag: "house", text: "top: asha ₹125000" }
    ],
    [
      { ring: "asha", caption: "winner" },
      { call: ["house", "asha"], label: "you won at ₹125000" },
      { call: ["house", "ravi"], label: "sold to asha" },
      { call: ["house", "kabir"], label: "sold to asha", together: true }
    ]
  ],
  tryIt: {
    prompt: "Change one rule in the mediator, the minimum step, and replay the same five bids.",
    groups: [{ label: "Minimum step", options: [
      { id: "s2000", label: "₹2000" }, { id: "s5000", label: "₹5000" }, { id: "s10000", label: "₹10000" }, { id: "s20000", label: "₹20000" }
    ] }],
    results: auctionResults
  }
};

/* --- smart home --- */

const homeDiagram = fourAndHub({
  label: "Four Device objects (door, window, light, AC) report events only to the Hub mediator, which switches the other devices.",
  ids: ["door", "window", "light", "ac"],
  names: ["door: Device", "window: Device", "light: Device", "ac: Device"],
  members: [0, 1, 2, 3].map(() => ["+ report(event)", "+ switch(turn_on)"]),
  scalaMembers: [0, 1, 2, 3].map(() => ["+ report(event)", "+ switch(turnOn)"]),
  colleagueH: TAG_H(2),
  hub: { id: "hub", name: "Hub", w: 240,
    members: ["- window_open: bool", "+ on_event(sender, event)"],
    scalaMembers: ["- windowOpen: Boolean", "+ onEvent(sender, event)"] }
});

const REPORT = (who: string, ev: string): Action => ({ call: [who, "hub"], label: `report("${ev}")` });
const SWITCH = (who: string, on: boolean): Action => ({ call: ["hub", who], label: on ? "switch(True)" : "switch(False)", scalaLabel: on ? "switch(true)" : "switch(false)" });

const homeTable: Record<string, [string, string]> = {
  "open|unlocked": ["light ON, AC stays OFF", "The window is open, so the hub keeps the AC off."],
  "open|locked": ["light OFF, AC OFF", "Locking switches both off (they were already off)."],
  "closed|unlocked": ["light ON, AC ON", "Someone is home and the window is shut."],
  "closed|locked": ["light OFF, AC OFF", "Locking switches both off (they were already off)."]
};
const homeResults: TryIt["results"] = {};
for (const [k, [output, note]] of Object.entries(homeTable)) {
  const [win, ev] = k.split("|");
  const acts: Action[] = [{ ring: "hub" }, { tag: "hub", text: win === "open" ? "window open" : "window closed" }];
  if (win === "open") acts.push(REPORT("window", "opened"));
  acts.push({ call: ["door", "hub"], label: `report("${ev}")`, result: output });
  acts.push({ tag: "light", text: output.includes("light ON") ? "ON" : "OFF" });
  acts.push({ tag: "ac", text: output.includes("AC ON") ? "ON" : "OFF", together: true });
  homeResults[k] = { output, note, actions: acts };
}

const smarthome: ExampleAnimation = {
  diagram: homeDiagram,
  walk: [
    [
      { show: ["door", "window", "light", "ac"] },
      { show: ["hub"] },
      { show: ["l-door", "l-window", "l-light", "l-ac"] },
      { pulse: "hub" }
    ],
    [
      { ring: "window" },
      REPORT("window", "opened"),
      { tag: "hub", text: "window open" },
      { tag: "ac", text: "OFF" }
    ],
    [
      { ring: "door" },
      REPORT("door", "unlocked"),
      SWITCH("light", true),
      { tag: "light", text: "ON" },
      { pulse: "ac" },
      { tag: "ac", text: "OFF (window open)", together: true }
    ],
    [
      { ring: "window" },
      REPORT("window", "closed"),
      { tag: "hub", text: "window closed" },
      SWITCH("ac", true),
      { tag: "ac", text: "ON" }
    ],
    [
      { ring: "light" },
      { call: ["light", "hub"], label: 'report("flickering")', result: "no rule" },
      { ring: "door" },
      REPORT("door", "locked"),
      SWITCH("light", false),
      { tag: "light", text: "OFF" },
      SWITCH("ac", false),
      { tag: "ac", text: "OFF" }
    ]
  ],
  tryIt: {
    prompt: "Set the window, then send a door event. The hub decides what the light and AC do.",
    groups: [
      { label: "Window", options: [{ id: "open", label: "Open" }, { id: "closed", label: "Closed" }] },
      { label: "Door event", options: [{ id: "unlocked", label: "Unlocked" }, { id: "locked", label: "Locked" }] }
    ],
    results: homeResults
  }
};

const animation: PatternAnimation = {
  slug: "mediator",
  story: storyAnim,
  examples: { atc, form, auction, smarthome },
  sequence: {
    label: "App sets a mute rule; asha's message goes to the room, which delivers it to ravi and meera; ravi's direct and broadcast messages reach only meera.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "asha", name: "asha: Member", kind: "concrete" },
      { id: "ravi", name: "ravi: Member", kind: "concrete" },
      { id: "room", name: "room: ChatRoom", kind: "concrete" },
      { id: "meera", name: "meera: Member", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "room", label: 'mute("asha", "ravi")' },
      { from: "app", to: "asha", label: 'say("Standup in 5 minutes")' },
      { from: "asha", to: "room", label: 'send("asha", text, None)' },
      { from: "room", to: "ravi", label: 'receive("asha", text)' },
      { from: "room", to: "meera", label: 'receive("asha", text)' },
      { from: "ravi", to: "room", label: 'send("ravi", "Can you review my PR?", "meera")' },
      { from: "room", to: "meera", label: 'receive("ravi", text)' },
      { from: "ravi", to: "room", label: 'send("ravi", "Lunch at 1?", None)' },
      { from: "room", to: "room", label: "skip asha: she muted ravi", kind: "self" },
      { from: "room", to: "meera", label: 'receive("ravi", text)' }
    ]
  }
};

export default animation;
