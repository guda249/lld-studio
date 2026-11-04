import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: offer letters copied from one registered template ---------- */

const story: DiagramSpec = {
  label: "Demo code asks TemplateRegistry for a copy; the registry stores a Document template; Document implements Prototype and duplicates itself into a new letter.",
  width: 880,
  height: 500,
  portraitWidth: 340,
  portraitHeight: 512,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", members: [],
      at: { x: 20, y: 170, w: 200 }, portrait: { x: 8, y: 44, w: 200 } },
    { id: "registry", kind: "concrete", name: "TemplateRegistry", key: true, hidden: true,
      members: ["- templates: dict", "+ register(key, doc)", "+ create(key)"],
      scalaMembers: ["- templates: Map", "+ register(key, doc)", "+ create(key)"],
      at: { x: 280, y: 170, w: 220 }, portrait: { x: 6, y: 200, w: 154 } },
    { id: "iface", kind: "interface", name: "Prototype", key: true, hidden: true,
      members: ["+ duplicate()"],
      at: { x: 615, y: 20, w: 200 }, portrait: { x: 220, y: 44, w: 112 } },
    { id: "doc", kind: "concrete", name: "Document", key: true,
      members: ["title", "sections: list", "metadata: dict"],
      scalaMembers: ["title", "sections: ListBuffer", "metadata: Map"],
      at: { x: 590, y: 170, w: 250, h: 136 }, portrait: { x: 180, y: 200, w: 154, h: 136 } },
    { id: "letter", kind: "concrete", name: "letter: Document", hidden: true,
      members: ['title = "Offer Letter"', "sections: 4"],
      at: { x: 590, y: 392, w: 250 }, portrait: { x: 100, y: 400, w: 232 } }
  ],
  edges: [
    { id: "asks", from: "client", to: "registry", type: "association", hidden: true },
    { id: "stores", from: "registry", to: "doc", type: "association", label: "stores", hidden: true },
    { id: "real", from: "doc", to: "iface", type: "realization", hidden: true },
    { id: "copy", from: "doc", to: "letter", type: "dependency", label: "duplicate()", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Same setup typed by hand", tone: "warn", near: "client" },
    { id: "ok", text: "No setup code repeated", tone: "ok", near: "registry" }
  ]
};

const CREATE = ["client", "registry", "doc"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every letter is set up by hand",
      what: "Each offer letter repeats the same sections and metadata in its own function. Arjun's copy has already lost Benefits and has an old version number.",
      why: "Repeated setup drifts apart, and every new letter means another long function to write and check (Don't Repeat Yourself).",
      say: {
        what: "Here's the problem. Each offer letter is built by hand, repeating the same sections and metadata. Arjun's letter has already lost the benefits section, and has an old version number.",
        why: "Repeated setup drifts apart, and every new letter needs another long function to write and check."
      },
      code: "problem",
      lines: { python: [9, 10, 11, 17, 18, 19], scala: [8, 9, 10, 15, 16, 17] },
      actions: [
        { members: "client", stagger: true,
          lines: ["offer_for_priya(): v7", "offer_for_arjun(): v6", "…same setup, typed again"],
          scalaLines: ["offerForPriya(): v7", "offerForArjun(): v6", "…same setup, typed again"] },
        { flash: "client" },
        { shake: "client", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give Document a method that copies itself",
      what: "Document implements Prototype and gets duplicate(). It returns a deep copy: the nested sections list and metadata map are copied too.",
      why: "The object knows how to copy itself, so callers never need to know its constructor or its insides.",
      say: {
        what: "First, Document implements a Prototype interface, with a duplicate method. It returns a deep copy, so the nested sections and metadata are copied too.",
        why: "The object knows how to copy itself. Callers never need to know its constructor, or what is inside it."
      },
      code: "main",
      lines: { python: [6, 7, 8, 12, 17, 18], scala: [3, 4, 10, 12, 13] },
      actions: [
        { hide: ["warn"] },
        { show: ["iface"] },
        { show: ["real"] },
        { members: "doc", lines: ["title", "sections: list", "metadata: dict", "+ duplicate()"],
          scalaLines: ["title", "sections: ListBuffer", "metadata: Map", "+ duplicate()"] },
        { mark: "doc", member: 3 }
      ]
    },
    {
      title: "Keep one configured template in a registry",
      what: "TemplateRegistry stores a fully set-up Offer Letter under the key \"offer\". The demo code now only asks the registry.",
      why: "The setup is written once, in one place. That one template is the single source of truth.",
      say: {
        what: "Next, a template registry stores one fully set up offer letter, under the key offer. The demo code now only talks to the registry.",
        why: "The setup is written once, in one place. That template is the single source of truth."
      },
      code: "main",
      lines: { python: [21, 23, 25, 26, 32, 33], scala: [15, 16, 18, 23, 24] },
      actions: [
        { mark: "doc", member: null },
        { show: ["registry"] },
        { show: ["stores"] },
        { show: ["asks"] },
        { members: "client", lines: ['registry.create("offer")'] },
        { tag: "doc", text: "template: 4 sections" }
      ]
    },
    {
      title: "Ask for a copy instead of building one",
      what: "create(\"offer\") reaches the template, which calls duplicate() on itself. A new letter appears with the same four sections.",
      why: "The client depends on duplicate(), not on Document's constructor (Dependency Inversion). Copying is quick and always complete.",
      say: {
        what: "The demo code calls create offer. The registry finds the template, and the template duplicates itself. A new letter appears, with the same four sections.",
        why: "The client depends on duplicate, not on the constructor. Copying is quick, and the copy is always complete."
      },
      code: "main",
      lines: { python: [18, 28, 29, 37], scala: [13, 20, 28] },
      actions: [
        { call: CREATE, label: 'create("offer")' },
        { spawn: ["letter"], from: "doc" },
        { show: ["copy"] },
        { ring: "letter", caption: "new copy" }
      ]
    },
    {
      title: "Change only what differs",
      what: "The copy gets Priya's name in the title and an extra Joining date section. Nothing else is typed again.",
      why: "Callers write only the differences, so the shared parts can never drift apart.",
      say: {
        what: "The copy gets Priya's name in the title, and an extra joining date section. Nothing else is typed again.",
        why: "Callers write only the differences, so the shared parts can never drift apart."
      },
      code: "main",
      lines: { python: [38, 39, 41], scala: [29, 30, 32] },
      actions: [
        { call: ["client", "letter"], label: "title, + Joining date" },
        { members: "letter", lines: ['title = "… - Priya"', "sections: 5 (+ Joining date)"] },
        { pulse: "letter" }
      ]
    },
    {
      title: "Deep copy: the template is untouched",
      what: "Asking for another copy shows the template still has its original four sections. Priya's extra section lives only in her letter.",
      why: "Because the copy is deep, editing it never edits the template. A shallow copy would share the sections list and change both.",
      say: {
        what: "Now we ask for another copy. The template still has its original four sections. Priya's extra section lives only in her letter.",
        why: "Because the copy is deep, editing it never edits the template. A shallow copy would share the sections list, and change both."
      },
      code: "main",
      lines: { python: [18, 42, 43], scala: [13, 33, 34] },
      actions: [
        { ring: null },
        { tag: "doc", text: null },
        { call: CREATE, label: 'create("offer")', result: "Greeting, Role, Compensation, Benefits" },
        { ring: "doc", caption: "template: still 4 sections" },
        { mark: "doc", member: 1 }
      ]
    },
    {
      title: "New variants are new templates, not new code",
      what: "Another kind of letter is just another register() call with a configured Document. Every copy starts complete and identical.",
      why: "New kinds of objects are added at runtime by registering prototypes, with no new classes and no edits (Open/Closed).",
      say: {
        what: "A new kind of letter is just one more register call, with a configured document. Every copy starts complete, and identical.",
        why: "New kinds of objects are added at runtime by registering prototypes. No new classes, and no edits. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [33, 34, 35], scala: [24, 25, 26] },
      actions: [
        { mark: "doc", member: null },
        { ring: null },
        { show: ["ok"] },
        { pulse: "registry", together: true }
      ]
    }
  ]
};

/* ---------- example 1: enemy prefabs ---------- */

const prefab: ExampleAnimation = {
  diagram: {
    label: "Demo code asks PrefabRegistry to spawn enemies; the registry holds a goblin and a troll prefab; spawned enemies are copies of them.",
    width: 760, height: 330, portraitWidth: 340, portraitHeight: 456,
    nodes: [
      { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 16, y: 40, w: 130, h: 54 }, portrait: { x: 96, y: 8, w: 148, h: 50 } },
      { id: "reg", kind: "concrete", name: "PrefabRegistry", key: true, hidden: true,
        members: ["+ register(name, prefab)", "+ spawn(name, x, y)"],
        at: { x: 180, y: 30, w: 210 }, portrait: { x: 70, y: 80, w: 200 } },
      { id: "goblin", kind: "concrete", name: "goblin: Enemy", key: true, hidden: true,
        members: ["hp=30", "loot: copper coin"],
        at: { x: 414, y: 14, w: 160 }, portrait: { x: 8, y: 190, w: 156 } },
      { id: "troll", kind: "concrete", name: "troll: Enemy", key: true, hidden: true,
        members: ["hp=120", "loot: 2 items"],
        at: { x: 414, y: 140, w: 160 }, portrait: { x: 176, y: 190, w: 156 } },
      { id: "g1", kind: "concrete", name: "goblin1: Enemy", hidden: true, members: ["at (2,0)"],
        at: { x: 604, y: 8, w: 150 }, portrait: { x: 8, y: 300, w: 156 } },
      { id: "g2", kind: "concrete", name: "goblin2: Enemy", hidden: true, members: ["at (5,0)"],
        at: { x: 604, y: 98, w: 150 }, portrait: { x: 176, y: 300, w: 156 } },
      { id: "g3", kind: "concrete", name: "goblin3: Enemy", hidden: true, members: ["at (8,0)"],
        at: { x: 604, y: 178, w: 150 }, portrait: { x: 8, y: 380, w: 156 } },
      { id: "t1", kind: "concrete", name: "troll1: Enemy", hidden: true, members: ["at (5,9)"],
        at: { x: 604, y: 258, w: 150 }, portrait: { x: 176, y: 380, w: 156 } }
    ],
    edges: [
      { id: "asks", from: "client", to: "reg", type: "association", hidden: true },
      { id: "h-gob", from: "reg", to: "goblin", type: "association", hidden: true },
      { id: "h-troll", from: "reg", to: "troll", type: "association", hidden: true,
        via: [[402, 181], [402, 100]] }
    ]
  },
  walk: [
    [{ show: ["client", "reg"] }, { show: ["asks"] }, { show: ["goblin", "troll"] }, { show: ["h-gob", "h-troll"] }],
    [{ call: ["client", "reg", "goblin"], label: 'spawn("goblin", x, 0)' }, { spawn: ["g1", "g2", "g3"], from: "goblin" }],
    [{ call: ["client", "reg", "troll"], label: 'spawn("troll", 5, 9)' }, { spawn: ["t1"], from: "troll" }],
    [{ call: ["client", "g1"], label: 'loot.append("rare gem")', scalaLabel: 'loot += "rare gem"' },
      { members: "g1", lines: ["at (2,0) + rare gem"] }, { ring: "g1" }],
    [{ pulse: "g2" }, { pulse: "g3", together: true },
      { call: ["client", "reg", "goblin"], label: "prefab loot?", result: "copper coin" }, { ring: "goblin" }]
  ],
  tryIt: {
    prompt: "Choose how spawn() copies the prefab and which goblin finds the gem. Who ends up with it?",
    groups: [
      { label: "Copy used by spawn()", options: [{ id: "deep", label: "duplicate() (deep)" }, { id: "shallow", label: "copy.copy (shallow)" }] },
      { label: "Lucky goblin", options: [{ id: "g1", label: "goblin at (2,0)" }, { id: "g3", label: "goblin at (8,0)" }] }
    ],
    results: {
      "deep|g1": gem("g1", true, "Gem only on the goblin at (2,0)", "Each goblin has its own loot list; the prefab still has copper coin only."),
      "deep|g3": gem("g3", true, "Gem only on the goblin at (8,0)", "Each goblin has its own loot list; the prefab still has copper coin only."),
      "shallow|g1": gem("g1", false, "Gem on all 3 goblins and the prefab", "A shallow copy shares one loot list, so one append shows up everywhere."),
      "shallow|g3": gem("g3", false, "Gem on all 3 goblins and the prefab", "A shallow copy shares one loot list, so one append shows up everywhere.")
    }
  }
};

function gem(target: "g1" | "g3", deep: boolean, output: string, note: string): TryResult {
  const pos: Record<string, string> = { g1: "at (2,0)", g2: "at (5,0)", g3: "at (8,0)" };
  const set = (id: string, has: boolean): Action => ({ members: id, lines: [has ? pos[id] + " + rare gem" : pos[id]], together: true });
  return {
    output, note,
    actions: [
      { ring: target },
      { members: "goblin", lines: ["hp=30", "loot: copper coin"] },
      set("g1", false), set("g2", false), set("g3", false),
      { call: ["client", target], label: 'loot.append("rare gem")', scalaLabel: 'loot += "rare gem"' },
      ...(deep
        ? [set(target, true), { pulse: target }]
        : [set("g1", true), set("g2", true), set("g3", true),
          { members: "goblin", lines: ["hp=30", "loot: coin, rare gem"], together: true }, { flash: "goblin" }])
    ]
  };
}

/* ---------- example 2: reorder, shallow versus deep ---------- */

const reorder: ExampleAnimation = {
  diagram: {
    label: "ORD-1 holds two line items; the shallow copy ORD-2 points to the same items; the deep copy ORD-3 has its own items.",
    width: 760, height: 344, portraitWidth: 352, portraitHeight: 344,
    nodes: [
      { id: "ord1", kind: "concrete", name: "ORD-1: Order", key: true, hidden: true, members: ["items: 2"],
        at: { x: 40, y: 14, w: 160, h: 140 }, portrait: { x: 10, y: 14, w: 96, h: 140 } },
      { id: "li1", kind: "concrete", name: "atta: LineItem", hidden: true, members: ["qty = 1"],
        at: { x: 300, y: 14, w: 160 }, portrait: { x: 120, y: 14, w: 112 } },
      { id: "li2", kind: "concrete", name: "dal: LineItem", hidden: true, members: ["qty = 2"],
        at: { x: 300, y: 92, w: 160 }, portrait: { x: 120, y: 92, w: 112 } },
      { id: "ord2", kind: "concrete", name: "ORD-2: Order", hidden: true, members: ["shallow copy"],
        at: { x: 560, y: 14, w: 160, h: 140 }, portrait: { x: 244, y: 14, w: 100, h: 140 } },
      { id: "li3", kind: "concrete", name: "atta: LineItem", hidden: true, members: ["qty = 1"],
        at: { x: 300, y: 190, w: 160 }, portrait: { x: 120, y: 190, w: 112 } },
      { id: "li4", kind: "concrete", name: "dal: LineItem", hidden: true, members: ["qty = 2"],
        at: { x: 300, y: 268, w: 160 }, portrait: { x: 120, y: 268, w: 112 } },
      { id: "ord3", kind: "concrete", name: "ORD-3: Order", hidden: true, members: ["deep copy"],
        at: { x: 560, y: 190, w: 160, h: 140 }, portrait: { x: 244, y: 190, w: 100, h: 140 } }
    ],
    edges: [
      { id: "e1", from: "ord1", to: "li1", type: "association", hidden: true },
      { id: "e2", from: "ord1", to: "li2", type: "association", hidden: true },
      { id: "e3", from: "ord2", to: "li1", type: "association", hidden: true },
      { id: "e4", from: "ord2", to: "li2", type: "association", hidden: true },
      { id: "e5", from: "ord3", to: "li3", type: "association", hidden: true },
      { id: "e6", from: "ord3", to: "li4", type: "association", hidden: true }
    ]
  },
  walk: [
    [{ show: ["ord1"] }, { show: ["li1", "li2"] }, { show: ["e1", "e2"] }],
    [{ call: ["ord1", "ord2"], label: "shallow_duplicate()", scalaLabel: "shallowDuplicate()" }, { spawn: ["ord2"], from: "ord1" },
      { show: ["e3", "e4"] }, { ring: "ord2" }],
    [{ call: ["ord2", "li1"], label: "items[0].qty = 3", scalaLabel: "items.head.qty = 3" }, { members: "li1", lines: ["qty = 3"] },
      { flash: "ord1" }, { shake: "ord1", together: true }],
    [{ members: "li1", lines: ["qty = 1"] }, { call: ["ord1", "ord3"], label: "duplicate()" }, { spawn: ["ord3"], from: "ord1" },
      { spawn: ["li3", "li4"], from: "li1" }, { show: ["e5", "e6"] }, { ring: "ord3" }],
    [{ call: ["ord3", "li3"], label: "items[0].qty = 3", scalaLabel: "items.head.qty = 3" }, { members: "li3", lines: ["qty = 3"] },
      { call: ["ord1", "li1"], label: "describe(past)", result: "1 x atta 5kg, 2 x toor dal" }, { pulse: "ord1" }]
  ],
  tryIt: {
    prompt: "Pick the copy method and the new atta quantity. What does the old order ORD-1 show afterwards?",
    groups: [
      { label: "Copy method", options: [{ id: "shallow", label: "shallow_duplicate()" }, { id: "deep", label: "duplicate()" }] },
      { label: "New atta quantity", options: [{ id: "q3", label: "3 packs" }, { id: "q5", label: "5 packs" }] }
    ],
    results: {
      "shallow|q3": reorderResult(false, 3),
      "shallow|q5": reorderResult(false, 5),
      "deep|q3": reorderResult(true, 3),
      "deep|q5": reorderResult(true, 5)
    }
  }
};

function reorderResult(deep: boolean, qty: number): TryResult {
  const oldQty = deep ? 1 : qty;
  const copy = deep ? "ord3" : "ord2", item = deep ? "li3" : "li1";
  return {
    output: `ORD-1: ${oldQty} x atta 5kg, 2 x toor dal`,
    note: deep
      ? "The deep copy has its own line items, so the history keeps 1 pack."
      : "The shallow copy shares the line items, so the old order changes too.",
    actions: [
      { ring: copy },
      { members: "li1", lines: ["qty = 1"] },
      { members: "li3", lines: ["qty = 1"], together: true },
      { call: [copy, item], label: `items[0].qty = ${qty}`, scalaLabel: `items.head.qty = ${qty}` },
      { members: item, lines: [`qty = ${qty}`] },
      ...(deep ? [] : [{ flash: "ord1" } as Action]),
      { call: ["ord1", "li1"], label: "describe(past)", result: `${oldQty} x atta 5kg, 2 x toor dal` }
    ]
  };
}

/* ---------- example 3: deployment config presets ---------- */

const deploy: ExampleAnimation = {
  diagram: {
    label: "The prod DeployConfig preset holds Resources; staging is a copy with its own smaller Resources; the DR copy shares prod's Resources.",
    width: 760, height: 270, portraitWidth: 340, portraitHeight: 400,
    nodes: [
      { id: "staging", kind: "concrete", name: "staging: DeployConfig", hidden: true, members: ["region: ap-south-1", "alerts_on: False"],
        scalaMembers: ["region: ap-south-1", "alertsOn: false"],
        at: { x: 16, y: 14, w: 220 }, portrait: { x: 8, y: 240, w: 160 } },
      { id: "prod", kind: "concrete", name: "prod: DeployConfig", key: true, hidden: true, members: ["region: ap-south-1", "alerts_on: True"],
        scalaMembers: ["region: ap-south-1", "alertsOn: true"],
        at: { x: 270, y: 14, w: 220 }, portrait: { x: 8, y: 10, w: 160 } },
      { id: "dr", kind: "concrete", name: "dr: DeployConfig", hidden: true, members: ["region: ap-south-2", "alerts_on: True"],
        scalaMembers: ["region: ap-south-2", "alertsOn: true"],
        at: { x: 524, y: 14, w: 220 }, portrait: { x: 8, y: 120, w: 160 } },
      { id: "sres", kind: "concrete", name: "Resources", hidden: true, members: ["1 x (2.0 CPU, 2 GB)"],
        at: { x: 16, y: 180, w: 220 }, portrait: { x: 180, y: 250, w: 152 } },
      { id: "pres", kind: "concrete", name: "Resources", hidden: true, members: ["6 x (2.0 CPU, 4 GB)"],
        at: { x: 270, y: 180, w: 220 }, portrait: { x: 180, y: 20, w: 152 } },
      { id: "client", kind: "client", name: "Demo code", hidden: true,
        at: { x: 560, y: 190, w: 150, h: 54 }, portrait: { x: 8, y: 340, w: 160, h: 50 } }
    ],
    edges: [
      { id: "p-res", from: "prod", to: "pres", type: "association", hidden: true },
      { id: "s-res", from: "staging", to: "sres", type: "association", hidden: true },
      { id: "d-res", from: "dr", to: "pres", type: "association", label: "shares", hidden: true }
    ]
  },
  walk: [
    [{ show: ["prod", "pres"] }, { show: ["p-res"] }, { show: ["client"] }, { ring: "prod" }],
    [{ call: ["client", "prod", "pres"], label: "replace(resources, replicas=1, …)", scalaLabel: "resources.copy(replicas = 1, …)" },
      { spawn: ["sres"], from: "pres" }],
    [{ call: ["client", "prod"], label: "replace(prod, alerts_on=False)", scalaLabel: "prod.copy(alertsOn = false)" },
      { spawn: ["staging"], from: "prod" }, { show: ["s-res"] }],
    [{ call: ["client", "prod"], label: 'replace(prod, region="ap-south-2")', scalaLabel: 'prod.copy(region = "ap-south-2")' },
      { spawn: ["dr"], from: "prod" }, { show: ["d-res"] }],
    [{ pulse: "staging" }, { pulse: "dr", together: true }, { ring: "prod" },
      { call: ["client", "prod", "pres"], label: 'show("prod", prod)', result: "ap-south-1, 6 x (2.0 CPU, 4 GB)" }]
  ],
  tryIt: {
    prompt: "Print one of the three configs. Which parts were copied and which were changed?",
    groups: [
      { label: "Config", options: [{ id: "prod", label: "prod" }, { id: "staging", label: "staging" }, { id: "dr", label: "dr" }] }
    ],
    results: {
      prod: { output: "ap-south-1, 6 x (2.0 CPU, 4 GB)", note: "alerts=True. The preset itself, never edited.",
        actions: [{ ring: "prod" }, { call: ["client", "prod", "pres"], label: 'show("prod", …)', result: "ap-south-1, 6 x (2.0 CPU, 4 GB)" }] },
      staging: { output: "ap-south-1, 1 x (2.0 CPU, 2 GB)", note: "alerts=False. New Resources with 1 replica and 2 GB.",
        actions: [{ ring: "staging" }, { call: ["client", "staging", "sres"], label: 'show("staging", …)', result: "ap-south-1, 1 x (2.0 CPU, 2 GB)" }] },
      dr: { output: "ap-south-2, 6 x (2.0 CPU, 4 GB)", note: "alerts=True. Only the region changed; it shares prod's Resources.",
        actions: [{ ring: "dr" }, { call: ["client", "dr", "pres"], label: 'show("dr", …)', result: "ap-south-2, 6 x (2.0 CPU, 4 GB)" }] }
    }
  }
};

/* ---------- example 4: exam paper sets ---------- */

const SETS = { A: "Q1 Q2 Q3 Q4 Q5", B: "Q2 Q3 Q4 Q5 Q1", C: "Q3 Q4 Q5 Q1 Q2" };

const paper: ExampleAnimation = {
  diagram: {
    label: "Demo code loads the master QuestionPaper once; sets A, B and C are copies of the master with rotated questions.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 330,
    nodes: [
      { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 40, y: 34, w: 150, h: 54 }, portrait: { x: 8, y: 8, w: 128, h: 54 } },
      { id: "master", kind: "concrete", name: "master: QuestionPaper", key: true, hidden: true, members: [SETS.A],
        at: { x: 270, y: 30, w: 220, h: 76 }, portrait: { x: 150, y: 8, w: 182, h: 76 } },
      { id: "sa", kind: "concrete", name: "A: QuestionPaper", hidden: true, members: [SETS.A],
        at: { x: 16, y: 190, w: 220, h: 76 }, portrait: { x: 8, y: 130, w: 156, h: 76 } },
      { id: "sb", kind: "concrete", name: "B: QuestionPaper", hidden: true, members: [SETS.B],
        at: { x: 270, y: 190, w: 220, h: 76 }, portrait: { x: 176, y: 130, w: 140, h: 76 } },
      { id: "sc", kind: "concrete", name: "C: QuestionPaper", hidden: true, members: [SETS.C],
        at: { x: 524, y: 190, w: 220, h: 76 }, portrait: { x: 8, y: 236, w: 156, h: 76 } }
    ],
    edges: [
      { id: "load", from: "client", to: "master", type: "association", label: "loads once", hidden: true },
      { id: "ca", from: "sa", to: "master", type: "dependency", hidden: true },
      { id: "cb", from: "sb", to: "master", type: "dependency", hidden: true },
      { id: "cc", from: "sc", to: "master", type: "dependency", hidden: true, viaPortrait: [[326, 90], [326, 274]] }
    ]
  },
  walk: [
    [{ show: ["client"] }, { call: ["client", "master"], label: "load_master_paper()", scalaLabel: "loadMasterPaper()" },
      { show: ["master"] }, { show: ["load"] }, { tag: "client", text: "loads = 1" }],
    [{ call: ["client", "master"], label: "duplicate()" }, { spawn: ["sa"], from: "master" }, { show: ["ca"] }],
    [{ call: ["client", "master"], label: "duplicate() x 2" }, { spawn: ["sb", "sc"], from: "master" }, { show: ["cb", "cc"] }],
    [{ pulse: "sa" }, { pulse: "sb", together: true }, { pulse: "sc", together: true },
      { tag: "sa", text: "5 questions" }, { tag: "sb", text: "5 questions", together: true }, { tag: "sc", text: "5 questions", together: true }],
    [{ ring: "master" }, { tag: "master", text: "still starts with Q1" }, { pulse: "client" }]
  ],
  tryIt: {
    prompt: "Pick a set, and choose how the sets are made. Watch the first question and the load counter.",
    groups: [
      { label: "Set", options: [{ id: "A", label: "Set A" }, { id: "B", label: "Set B" }, { id: "C", label: "Set C" }] },
      { label: "Each set is made by", options: [{ id: "copy", label: "copying the master" }, { id: "load", label: "loading again" }] }
    ],
    results: Object.fromEntries((["A", "B", "C"] as const).flatMap((s, shift) => (["copy", "load"] as const).map((how) => {
      const loads = how === "copy" ? 1 : 4;
      const node = "s" + s.toLowerCase();
      const res: TryResult = {
        output: `Set ${s} starts with Q${shift + 1}, loads = ${loads}`,
        note: how === "copy"
          ? `A cheap copy of the master, rotated by ${shift}. The slow load ran once.`
          : "Same paper, but the slow load ran for the master and for every set.",
        actions: [
          { ring: node },
          { tag: "client", text: `loads = ${loads}` },
          how === "copy"
            ? { call: ["client", "master", node], label: "duplicate()", result: `Q${shift + 1} first` }
            : { call: ["client", node], label: "load_master_paper()", scalaLabel: "loadMasterPaper()", result: `Q${shift + 1} first` }
        ]
      };
      return [`${s}|${how}`, res];
    })))
  }
};

const animation: PatternAnimation = {
  slug: "prototype",
  story: storyAnim,
  examples: { prefab, reorder, deploy, paper },
  sequence: {
    label: "Demo code registers a template, asks the registry for a copy, the template duplicates itself into a new letter, and the demo edits only the copy.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "registry", name: "registry: TemplateRegistry", kind: "concrete" },
      { id: "template", name: "template: Document", kind: "concrete" },
      { id: "letter", name: "letter: Document", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "registry", label: 'register("offer", template)' },
      { from: "demo", to: "registry", label: 'create("offer")' },
      { from: "registry", to: "template", label: "duplicate()" },
      { from: "template", to: "letter", label: "deep copy", kind: "create" },
      { from: "template", to: "registry", label: "letter", kind: "return" },
      { from: "registry", to: "demo", label: "letter", kind: "return" },
      { from: "demo", to: "letter", label: 'title = "Offer Letter - Priya"' },
      { from: "demo", to: "letter", label: 'sections.append("Joining date")' },
      { from: "demo", to: "registry", label: 'create("offer")' },
      { from: "registry", to: "template", label: "duplicate()" },
      { from: "registry", to: "demo", label: "fresh copy, 4 sections", kind: "return" }
    ]
  }
};

export default animation;
