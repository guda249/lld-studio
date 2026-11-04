import type { Action, DEdge, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: files and folders behind one Node interface ---------- */

const story: DiagramSpec = {
  label: "File and Folder extend the abstract Node; Folder holds child Nodes (composition); Shortcut is added later; on the right, an object tree project/ with README.md and src/ (app.py, utils.py).",
  width: 960,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 668,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", members: [],
      at: { x: 16, y: 56, w: 200 }, portrait: { x: 8, y: 42, w: 164 } },
    { id: "node", kind: "abstract", name: "Node", key: true, hidden: true,
      members: ["+ size()", "+ render(depth)"], scalaMembers: ["+ size", "+ render(depth)"],
      at: { x: 300, y: 30, w: 220 }, portrait: { x: 180, y: 42, w: 130 } },
    { id: "file", kind: "concrete", name: "File",
      members: ["- name", "- size"],
      at: { x: 16, y: 300, w: 150 }, portrait: { x: 8, y: 170, w: 140 } },
    { id: "shortcut", kind: "concrete", name: "Shortcut", hidden: true,
      members: ["- target: Node", "+ size()"], scalaMembers: ["- target: Node", "+ size"],
      at: { x: 178, y: 300, w: 150 }, portrait: { x: 84, y: 286, w: 140 } },
    { id: "folder", kind: "concrete", name: "Folder", key: true,
      members: ["- name", "- children: list"],
      at: { x: 340, y: 300, w: 180 }, portrait: { x: 160, y: 170, w: 150 } },
    { id: "project", kind: "concrete", name: "project/", hidden: true, members: ["size: ?"],
      at: { x: 720, y: 20, w: 130 }, portrait: { x: 60, y: 420, w: 120 } },
    { id: "notes", kind: "concrete", name: "notes.txt", hidden: true, members: ["300 B"],
      at: { x: 866, y: 20, w: 84 }, portrait: { x: 230, y: 420, w: 100 } },
    { id: "readme", kind: "concrete", name: "README.md", hidden: true, members: ["1200 B"],
      at: { x: 600, y: 150, w: 120 }, portrait: { x: 8, y: 506, w: 120 } },
    { id: "src", kind: "concrete", name: "src/", hidden: true, members: ["size: ?"],
      at: { x: 790, y: 150, w: 130 }, portrait: { x: 176, y: 506, w: 120 } },
    { id: "app", kind: "concrete", name: "app.py", hidden: true, members: ["5400 B"],
      at: { x: 750, y: 290, w: 90 }, portrait: { x: 160, y: 592, w: 80 } },
    { id: "utils", kind: "concrete", name: "utils.py", hidden: true, members: ["800 B"],
      at: { x: 852, y: 290, w: 90 }, portrait: { x: 252, y: 592, w: 80 } }
  ],
  edges: [
    { id: "i-file", from: "file", to: "node", type: "inheritance", hidden: true },
    { id: "i-folder", from: "folder", to: "node", type: "inheritance", hidden: true },
    { id: "i-short", from: "shortcut", to: "node", type: "inheritance", hidden: true },
    { id: "children", from: "folder", to: "node", type: "composition", hidden: true,
      via: [[505, 250]], viaPortrait: [[332, 221], [332, 89]] },
    { id: "l-readme", from: "project", to: "readme", type: "composition", hidden: true },
    { id: "l-src", from: "project", to: "src", type: "composition", hidden: true },
    { id: "l-app", from: "src", to: "app", type: "composition", hidden: true },
    { id: "l-utils", from: "src", to: "utils", type: "composition", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Every function edited", tone: "warn", near: "client" },
    { id: "ok", text: "Demo code: 0 lines changed", tone: "ok", near: "shortcut", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every function checks types",
      what: "File and Folder share nothing, so total_size() and count_files() both ask “is it a File? is it a Folder?” and recurse by hand.",
      why: "The same type checks are copied into every function, and a new item type such as Shortcut breaks all of them (Open/Closed).",
      say: {
        what: "Here's the problem. Files and folders share nothing. So every function, like total size and count files, asks: is it a file? is it a folder? and then recurses by hand.",
        why: "The same type checks are copied into every function, and a new item type, like a shortcut, breaks all of them."
      },
      code: "problem",
      lines: { python: [19, 20, 22, 27, 28, 30], scala: [5, 6, 7, 10, 11, 12] },
      actions: [
        { members: "client", stagger: true,
          lines: ["isinstance(i, File)", "isinstance(i, Folder)"],
          scalaLines: ["case f: File => …", "case d: Folder => …"] },
        { flash: "client" },
        { shake: "client", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give files and folders one interface",
      what: "Both extend the abstract Node, which promises size() and render(). A File answers from its own data.",
      why: "Callers can treat any item the same way, because every item keeps the same promise (Liskov Substitution).",
      say: {
        what: "First, files and folders both extend one abstract class, called Node, which promises size and render. A file answers from its own data.",
        why: "Callers can now treat any item the same way, because every item keeps the same promise. That's Liskov substitution."
      },
      code: "main",
      lines: { python: [4, 9, 12, 15, 27], scala: [3, 4, 5, 7, 11] },
      actions: [
        { hide: ["warn"] },
        { show: ["node"] },
        { show: ["i-file", "i-folder"] },
        { members: "file", lines: ["+ size()", "+ render(depth)"], scalaLines: ["+ size", "+ render(depth)"] }
      ]
    },
    {
      title: "A Folder holds Nodes, not Files",
      what: "Folder keeps a list of child Nodes. A child can be a File or another Folder, so folders nest to any depth.",
      why: "Folder depends only on the Node abstraction, so it never needs to know what its children really are.",
      say: {
        what: "Next, a folder keeps a list of child nodes. A child can be a file, or another folder, so folders can nest to any depth.",
        why: "Folder depends only on the node abstraction. It never needs to know what its children really are."
      },
      code: "main",
      lines: { python: [30, 32, 33, 36, 37], scala: [12, 14, 15, 18] },
      actions: [
        { members: "folder", lines: ["- children: Node[*]", "+ add(*nodes)", "+ size()"],
          scalaLines: ["- children: Node[*]", "+ add(nodes*)", "+ size"] },
        { show: ["children"] },
        { mark: "folder", member: 0 }
      ]
    },
    {
      title: "Build a tree of objects",
      what: "project/ holds README.md and src/, and src/ holds app.py and utils.py. The demo code now just calls node.size().",
      why: "The tree is plain data. The client no longer has any type checks.",
      say: {
        what: "Now we build a tree of objects. The project folder holds the readme and the src folder, and src holds two Python files. The demo code now just calls size on a node.",
        why: "The tree is plain data, and the client has no type checks left."
      },
      code: "main",
      lines: { python: [45, 46, 47, 48], scala: [25, 26, 27, 28] },
      actions: [
        { mark: "folder", member: null },
        { spawn: ["project", "src"], from: "folder" },
        { spawn: ["readme", "app", "utils"], from: "file" },
        { show: ["l-readme", "l-src", "l-app", "l-utils"] },
        { members: "client", lines: ["node.size()", "node.render()"], scalaLines: ["node.size", "node.render(0)"] }
      ]
    },
    {
      title: "Folders ask their children",
      what: "project.size() asks README.md (1200) and src/. src/ asks app.py (5400) and utils.py (800) and adds them: 6200.",
      why: "The recursion lives inside the structure. Each folder handles only its own part of the work (Single Responsibility).",
      say: {
        what: "When we ask the project for its size, it asks the readme, which says twelve hundred, and the src folder. src asks its two files, and adds them up: sixty-two hundred.",
        why: "The recursion lives inside the structure. Each folder only handles its own part of the work."
      },
      code: "main",
      lines: { python: [20, 21, 36, 37], scala: [8, 18] },
      actions: [
        { call: ["client", "project"], label: "size()", scalaLabel: "size" },
        { ring: "project" },
        { call: ["project", "readme"], label: "size()", scalaLabel: "size", result: "1200" },
        { ring: "src" },
        { call: ["project", "src", "app"], label: "size()", scalaLabel: "size", result: "5400" },
        { call: ["src", "utils"], label: "size()", scalaLabel: "size", result: "800" },
        { members: "src", lines: ["6200 B"] },
        { pulse: "src" }
      ]
    },
    {
      title: "The answers add up on the way back",
      what: "project/ adds 1200 and 6200, and Demo code gets 7400 B from one call.",
      why: "Demo code asked one object one question. It never knew the tree was three levels deep.",
      say: {
        what: "The project adds twelve hundred and sixty-two hundred, and the demo code gets seventy-four hundred bytes from one single call.",
        why: "The demo code asked one object one question. It never knew the tree was three levels deep."
      },
      code: "main",
      lines: { python: [37, 50], scala: [18, 30] },
      actions: [
        { ring: "project" },
        { members: "project", lines: ["7400 B"] },
        { call: ["client", "project"], label: "project.size()", scalaLabel: "project.size", result: "Total: 7400 B" }
      ]
    },
    {
      title: "One file answers the same call",
      what: "File('notes.txt', 300).size() works exactly like project.size(). A single leaf and a whole tree look the same to the client.",
      why: "This uniformity is the whole point of Composite: one item or a group of items, same code.",
      say: {
        what: "A single file, notes dot t x t, answers the very same size call, with three hundred bytes. A single leaf and a whole tree look the same to the client.",
        why: "That's the whole point of the composite pattern: one item, or a group of items, handled by the same code."
      },
      code: "main",
      lines: { python: [50], scala: [30] },
      actions: [
        { show: ["notes"] },
        { ring: "notes" },
        { call: ["client", "notes"], label: "size()", scalaLabel: "size", result: "300 B" }
      ]
    },
    {
      title: "Add a new item type without touching clients",
      what: "Shortcut extends Node and answers size() through its target. It plugs into any folder.",
      why: "Demo code: 0 lines changed. A new kind of node is added, not edited in (Open/Closed).",
      say: {
        what: "Finally, we add a new item type, a shortcut. It extends Node, and answers size through its target. It fits into any folder.",
        why: "And the demo code? Zero lines changed. New kinds of nodes are added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [4, 8, 9], scala: [3, 4] },
      actions: [
        { ring: null },
        { show: ["shortcut"] },
        { show: ["i-short"] },
        { show: ["ok"] },
        { pulse: "client", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: object trees ---------- */

const comp = (from: string, to: string, extra: Partial<DEdge> = {}): DEdge =>
  ({ id: `${from}-${to}`, from, to, type: "composition", hidden: true, ...extra });
const ids = (d: DiagramSpec, test: (id: string) => boolean = () => true) => d.nodes.map((n) => n.id).filter(test);

/* --- 1. gift bundles --- */

const bundleDiagram: DiagramSpec = {
  label: "The cart holds a phone cover and the Diwali gift box; the box holds sweets, a diya set and a dry fruit pack, which holds almonds and cashews.",
  width: 760, height: 370, portraitWidth: 340, portraitHeight: 368,
  nodes: [
    { id: "cart", kind: "client", name: "Cart", hidden: true, members: ["total: ?"], at: { x: 290, y: 14, w: 140 }, portrait: { x: 100, y: 10, w: 140 } },
    { id: "cover", kind: "concrete", name: "Phone cover", hidden: true, members: ["₹299"],
      at: { x: 90, y: 116, w: 150 }, portrait: { x: 8, y: 112, w: 140 } },
    { id: "box", kind: "concrete", name: "Diwali gift box", key: true, hidden: true, members: ["10% off"],
      at: { x: 400, y: 116, w: 200 }, portrait: { x: 160, y: 112, w: 172 } },
    { id: "katli", kind: "concrete", name: "Kaju katli", hidden: true, members: ["₹650"],
      at: { x: 240, y: 204, w: 130 }, portrait: { x: 8, y: 202, w: 96 } },
    { id: "diya", kind: "concrete", name: "Diya set", hidden: true, members: ["₹300"],
      at: { x: 382, y: 204, w: 110 }, portrait: { x: 114, y: 202, w: 96 } },
    { id: "pack", kind: "concrete", name: "Dry fruit pack", key: true, hidden: true, members: ["5% off"],
      at: { x: 504, y: 204, w: 160 }, portrait: { x: 220, y: 202, w: 112 } },
    { id: "almonds", kind: "concrete", name: "Almonds", hidden: true, members: ["₹450"],
      at: { x: 470, y: 292, w: 110 }, portrait: { x: 150, y: 292, w: 88 } },
    { id: "cashews", kind: "concrete", name: "Cashews", hidden: true, members: ["₹550"],
      at: { x: 592, y: 292, w: 110 }, portrait: { x: 246, y: 292, w: 86 } }
  ],
  edges: [
    { id: "cart-cover", from: "cart", to: "cover", type: "aggregation", hidden: true },
    { id: "cart-box", from: "cart", to: "box", type: "aggregation", hidden: true },
    comp("box", "katli"), comp("box", "diya"), comp("box", "pack"),
    comp("pack", "almonds"), comp("pack", "cashews")
  ]
};

const BUNDLE: Record<string, { pack: number; box: number; cart: number }> = {
  "b0|p0": { pack: 1000, box: 1950, cart: 2249 },
  "b0|p5": { pack: 950, box: 1900, cart: 2199 },
  "b10|p0": { pack: 1000, box: 1755, cart: 2054 },
  "b10|p5": { pack: 950, box: 1710, cart: 2009 },
  "b20|p0": { pack: 1000, box: 1560, cart: 1859 },
  "b20|p5": { pack: 950, box: 1520, cart: 1819 }
};
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const bundleResult = (key: string): TryResult => {
  const [b, p] = key.split("|");
  const bd = Number(b.slice(1)), pd = Number(p.slice(1)), v = BUNDLE[key];
  return {
    output: `Cart total: ${inr(v.cart)}`,
    note: `Pack ${inr(1000)} − ${pd}% = ${inr(v.pack)}; box ${inr(650 + 300 + v.pack)} − ${bd}% = ${inr(v.box)}; plus the ₹299 cover.`,
    actions: [
      { members: "pack", lines: [`${pd}% off: ${inr(v.pack)}`] },
      { call: ["box", "pack"], label: "price()", result: inr(v.pack) },
      { members: "box", lines: [`${bd}% off: ${inr(v.box)}`] },
      { ring: "box" },
      { call: ["cart", "box"], label: "price()", result: inr(v.box) },
      { members: "cart", lines: [`total: ${inr(v.cart)}`] }, { pulse: "cart" }
    ]
  };
};

const bundle: ExampleAnimation = {
  diagram: bundleDiagram,
  walk: [
    [{ show: ["cart"] }, { show: ["cover", "box"] }, { show: ["cart-cover", "cart-box"] }],
    [{ show: ["katli", "diya", "pack"] }, { show: ["box-katli", "box-diya", "box-pack"] },
      { show: ["almonds", "cashews"] }, { show: ["pack-almonds", "pack-cashews"] }],
    [{ ring: "pack" }, { call: ["pack", "almonds"], label: "price()", result: "₹450" },
      { call: ["pack", "cashews"], label: "price()", result: "₹550" }, { members: "pack", lines: ["5% off: ₹950"] }],
    [{ ring: "box" }, { call: ["box", "katli"], label: "price()", result: "₹650" },
      { call: ["box", "diya"], label: "price()", result: "₹300" }, { call: ["box", "pack"], label: "price()", result: "₹950" },
      { members: "box", lines: ["10% off: ₹1,710"] }],
    [{ ring: null }, { call: ["cart", "cover"], label: "price()", result: "₹299" },
      { call: ["cart", "box"], label: "price()", result: "₹1,710" }, { members: "cart", lines: ["total: ₹2,009"] }, { pulse: "cart" }]
  ],
  tryIt: {
    prompt: "Change the two bundle discounts. What does the cart total come to?",
    groups: [
      { label: "Gift box discount", options: [{ id: "b0", label: "0%" }, { id: "b10", label: "10%" }, { id: "b20", label: "20%" }] },
      { label: "Dry fruit pack discount", options: [{ id: "p0", label: "0%" }, { id: "p5", label: "5%" }] }
    ],
    results: Object.fromEntries(Object.keys(BUNDLE).map((k) => [k, bundleResult(k)]))
  }
};

/* --- 2. org chart cost roll-up --- */

const orgDiagram: DiagramSpec = {
  label: "Engineering holds Anil, the Payments team and the Mobile team; Payments holds Divya, Karan and Sana; Mobile holds Joseph.",
  width: 760, height: 340, portraitWidth: 340, portraitHeight: 306,
  nodes: [
    { id: "client", kind: "client", name: "budget_line", hidden: true, at: { x: 16, y: 14, w: 130, h: 54 }, portrait: { x: 8, y: 10, w: 110, h: 54 } },
    { id: "eng", kind: "concrete", name: "Engineering", key: true, hidden: true, members: ["people: ?", "cost: ?"],
      at: { x: 300, y: 14, w: 160 }, portrait: { x: 130, y: 10, w: 202 } },
    { id: "anil", kind: "concrete", name: "Anil", hidden: true, members: ["₹60 lakh"],
      at: { x: 110, y: 130, w: 110 }, portrait: { x: 8, y: 120, w: 84 } },
    { id: "payments", kind: "concrete", name: "Payments team", key: true, hidden: true, members: ["people: ?", "cost: ?"],
      at: { x: 300, y: 130, w: 160 }, portrait: { x: 104, y: 120, w: 120 } },
    { id: "mobile", kind: "concrete", name: "Mobile team", key: true, hidden: true, members: ["people: ?", "cost: ?"],
      at: { x: 560, y: 130, w: 140 }, portrait: { x: 236, y: 120, w: 96 } },
    { id: "divya", kind: "concrete", name: "Divya", hidden: true, members: ["₹35 lakh"],
      at: { x: 210, y: 246, w: 90 }, portrait: { x: 8, y: 230, w: 72 } },
    { id: "karan", kind: "concrete", name: "Karan", hidden: true, members: ["₹24 lakh"],
      at: { x: 312, y: 246, w: 90 }, portrait: { x: 88, y: 230, w: 72 } },
    { id: "sana", kind: "concrete", name: "Sana", hidden: true, members: ["₹14 lakh"],
      at: { x: 414, y: 246, w: 90 }, portrait: { x: 168, y: 230, w: 72 } },
    { id: "joseph", kind: "concrete", name: "Joseph", hidden: true, members: ["₹22 lakh"],
      at: { x: 585, y: 246, w: 90 }, portrait: { x: 252, y: 230, w: 80 } }
  ],
  edges: [
    comp("eng", "anil"), comp("eng", "payments"), comp("eng", "mobile"),
    comp("payments", "divya"), comp("payments", "karan"), comp("payments", "sana"),
    comp("mobile", "joseph")
  ]
};

const ORG: Record<string, { people: number; cost: number }> = {
  "sana|no": { people: 1, cost: 14 }, "payments|no": { people: 3, cost: 73 }, "mobile|no": { people: 1, cost: 22 }, "eng|no": { people: 5, cost: 155 },
  "sana|yes": { people: 1, cost: 14 }, "payments|yes": { people: 3, cost: 73 }, "mobile|yes": { people: 2, cost: 40 }, "eng|yes": { people: 6, cost: 173 }
};
const dept = (id: string, people: number, cost: number): Action =>
  ({ members: id, lines: [`${people} ${people === 1 ? "person" : "people"}`, `₹${cost} lakh`] });
const orgResult = (key: string): TryResult => {
  const [unit, hire] = key.split("|");
  const v = ORG[key];
  const name: Record<string, string> = { sana: "sana", payments: "payments", mobile: "mobile", eng: "engineering" };
  return {
    output: `people=${String(v.people).padStart(2)}  cost=₹${v.cost} lakh`,
    note: hire === "yes"
      ? "Priya (₹18 lakh) joins Mobile; Mobile and Engineering both change, with no code changed."
      : unit === "sana" ? "A single Employee answers headcount 1 and her own salary." : "The department sums headcount() and cost() over its members.",
    actions: [
      dept("mobile", hire === "yes" ? 2 : 1, hire === "yes" ? 40 : 22),
      { ...dept("eng", hire === "yes" ? 6 : 5, hire === "yes" ? 173 : 155), together: true },
      dept("payments", 3, 73),
      { ring: unit },
      { call: ["client", unit], label: `budget_line(${name[unit]})`, result: `people=${v.people} cost=₹${v.cost} lakh` }
    ]
  };
};

const org: ExampleAnimation = {
  diagram: orgDiagram,
  walk: [
    [{ show: ids(orgDiagram) }, { show: orgDiagram.edges.map((e) => e.id) }, { ring: "sana" },
      { call: ["client", "sana"], label: "budget_line(sana)", result: "people=1 cost=₹14 lakh" }],
    [{ ring: "payments" }, { call: ["client", "payments"], label: "budget_line(payments)" },
      { call: ["payments", "divya"], label: "cost()", result: "35" }, { call: ["payments", "karan"], label: "cost()", result: "24" },
      { call: ["payments", "sana"], label: "cost()", result: "14" }, dept("payments", 3, 73)],
    [{ ring: "eng" }, { pulse: "anil" }, { pulse: "payments", together: true }, { pulse: "mobile", together: true }],
    [{ call: ["eng", "anil"], label: "cost()", result: "60" }, { call: ["eng", "payments"], label: "cost()", result: "73" },
      { call: ["eng", "mobile", "joseph"], label: "cost()", result: "22" }, dept("mobile", 1, 22)],
    [dept("eng", 5, 155), { call: ["client", "eng"], label: "budget_line(engineering)", result: "people=5 cost=₹155 lakh" }]
  ],
  tryIt: {
    prompt: "Pick any unit, one person or a whole department, and decide whether Priya joins Mobile. What does budget_line print?",
    groups: [
      { label: "Unit", options: [{ id: "sana", label: "Sana" }, { id: "payments", label: "Payments" }, { id: "mobile", label: "Mobile" }, { id: "eng", label: "Engineering" }] },
      { label: "Priya (₹18 lakh) joins Mobile", options: [{ id: "no", label: "No" }, { id: "yes", label: "Yes" }] }
    ],
    results: Object.fromEntries(Object.keys(ORG).map((k) => [k, orgResult(k)]))
  }
};

/* --- 3. formula tree --- */

const formulaDiagram: DiagramSpec = {
  label: "Mul at the root multiplies Sum (of B2 times C2 and B3 times C3) by Add (1.0 plus D1); Ref and Num are leaves.",
  width: 760, height: 360, portraitWidth: 340, portraitHeight: 344,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 16, y: 14, w: 120, h: 54 }, portrait: { x: 8, y: 10, w: 110, h: 54 } },
    { id: "root", kind: "concrete", name: "Mul", key: true, hidden: true, members: ["= ?"],
      at: { x: 330, y: 14, w: 110 }, portrait: { x: 180, y: 10, w: 110 } },
    { id: "sum", kind: "concrete", name: "Sum", key: true, hidden: true, members: ["= ?"],
      at: { x: 200, y: 100, w: 120 }, portrait: { x: 60, y: 96, w: 110 } },
    { id: "add", kind: "concrete", name: "Add", key: true, hidden: true, members: ["= ?"],
      at: { x: 520, y: 100, w: 120 }, portrait: { x: 230, y: 96, w: 100 } },
    { id: "m1", kind: "concrete", name: "Mul", key: true, hidden: true, members: ["= ?"],
      at: { x: 90, y: 190, w: 100 }, portrait: { x: 8, y: 182, w: 76 } },
    { id: "m2", kind: "concrete", name: "Mul", key: true, hidden: true, members: ["= ?"],
      at: { x: 290, y: 190, w: 100 }, portrait: { x: 92, y: 182, w: 76 } },
    { id: "one", kind: "concrete", name: "Num 1.0", hidden: true, members: ["= 1.0"],
      at: { x: 470, y: 190, w: 100 }, portrait: { x: 176, y: 182, w: 74 } },
    { id: "d1", kind: "concrete", name: "Ref D1", hidden: true, members: ["= 0.18"],
      at: { x: 590, y: 190, w: 100 }, portrait: { x: 258, y: 182, w: 74 } },
    { id: "b2", kind: "concrete", name: "Ref B2", hidden: true, members: ["= 2.0"],
      at: { x: 30, y: 280, w: 80 }, portrait: { x: 8, y: 268, w: 66 } },
    { id: "c2", kind: "concrete", name: "Ref C2", hidden: true, members: ["= 450.0"],
      at: { x: 122, y: 280, w: 80 }, portrait: { x: 84, y: 268, w: 70 } },
    { id: "b3", kind: "concrete", name: "Ref B3", hidden: true, members: ["= 1.0"],
      at: { x: 240, y: 280, w: 80 }, portrait: { x: 164, y: 268, w: 66 } },
    { id: "c3", kind: "concrete", name: "Ref C3", hidden: true, members: ["= 1200.0"],
      at: { x: 332, y: 280, w: 80 }, portrait: { x: 240, y: 268, w: 70 } }
  ],
  edges: [
    comp("root", "sum"), comp("root", "add"), comp("sum", "m1"), comp("sum", "m2"),
    comp("add", "one"), comp("add", "d1"), comp("m1", "b2"), comp("m1", "c2"), comp("m2", "b3"), comp("m2", "c3")
  ]
};

const FORMULA: Record<string, { m1: string; sum: string; add: string; total: string }> = {
  "q1|g5": { m1: "450.0", sum: "1650.0", add: "1.05", total: "1732.50" },
  "q1|g18": { m1: "450.0", sum: "1650.0", add: "1.18", total: "1947.00" },
  "q2|g5": { m1: "900.0", sum: "2100.0", add: "1.05", total: "2205.00" },
  "q2|g18": { m1: "900.0", sum: "2100.0", add: "1.18", total: "2478.00" },
  "q3|g5": { m1: "1350.0", sum: "2550.0", add: "1.05", total: "2677.50" },
  "q3|g18": { m1: "1350.0", sum: "2550.0", add: "1.18", total: "3009.00" }
};
const set = (id: string, v: string, together = false): Action => ({ members: id, lines: ["= " + v], together });
const formulaResult = (key: string): TryResult => {
  const [q, g] = key.split("|");
  const v = FORMULA[key], b2 = q.slice(1) + ".0", d1 = g === "g5" ? "0.05" : "0.18";
  return {
    output: `Total: ₹${v.total}`,
    note: `(${b2} × 450 + 1 × 1200) × (1 + ${d1}) = ${v.sum} × ${v.add}`,
    actions: [
      set("b2", b2), set("d1", d1, true),
      { ring: "root" },
      { call: ["root", "sum", "m1", "b2"], label: "evaluate(cells)", result: b2 },
      set("m1", v.m1), set("sum", v.sum, true),
      { call: ["root", "add", "d1"], label: "evaluate(cells)", result: d1 },
      set("add", v.add), set("root", v.total, true),
      { call: ["client", "root"], label: "evaluate(cells)", result: `₹${v.total}` }
    ]
  };
};

const formula: ExampleAnimation = {
  diagram: formulaDiagram,
  walk: [
    [{ show: ["client", "root"] }, { show: ["sum", "add"] }, { show: ["root-sum", "root-add"] },
      { show: ["m1", "m2", "one", "d1"] }, { show: ["sum-m1", "sum-m2", "add-one", "add-d1"] },
      { show: ["b2", "c2", "b3", "c3"] }, { show: ["m1-b2", "m1-c2", "m2-b3", "m2-c3"] }],
    [{ call: ["client", "root", "sum", "m1"], label: "show()", result: "SUM(B2 * C2, B3 * C3) * (1.0 + D1)" }],
    [{ ring: "root" }, { call: ["root", "sum", "m1"], label: "evaluate(cells)", result: "900.0" }, set("m1", "900.0"),
      { call: ["sum", "m2"], label: "evaluate(cells)", result: "1200.0" }, set("m2", "1200.0"), set("sum", "2100.0"),
      { call: ["root", "add"], label: "evaluate(cells)", result: "1.18" }, set("add", "1.18"), set("root", "2478.0"),
      { call: ["client", "root"], label: "evaluate(cells)", result: "₹2478.00" }],
    [{ ring: "c3" }, { call: ["client", "c3"], label: "Ref('C3').evaluate(cells)", scalaLabel: "Ref(\"C3\").evaluate(cells)", result: "1200.00" }],
    [{ ring: "root" }, set("b2", "3.0"), { flash: "b2" }, set("m1", "1350.0"), set("sum", "2550.0"), set("root", "3009.0"),
      { call: ["client", "root"], label: "evaluate(cells | B2=3)", scalaLabel: "evaluate(cells + B2→3)", result: "₹3009.00" }]
  ],
  tryIt: {
    prompt: "Change the quantity in B2 and the GST rate in D1. What does the same formula tree evaluate to?",
    groups: [
      { label: "B2 (quantity)", options: [{ id: "q1", label: "1" }, { id: "q2", label: "2" }, { id: "q3", label: "3" }] },
      { label: "D1 (GST)", options: [{ id: "g5", label: "5%" }, { id: "g18", label: "18%" }] }
    ],
    results: Object.fromEntries(Object.keys(FORMULA).map((k) => [k, formulaResult(k)]))
  }
};

/* --- 4. course progress --- */

const courseDiagram: DiagramSpec = {
  label: "The course holds Basics (two lessons) and Patterns; Patterns holds Creational (Singleton, Builder) and Structural (Adapter, Composite).",
  width: 760, height: 372, portraitWidth: 340, portraitHeight: 446,
  nodes: [
    { id: "client", kind: "client", name: "progress", hidden: true, at: { x: 16, y: 14, w: 120, h: 54 }, portrait: { x: 8, y: 10, w: 100, h: 54 } },
    { id: "course", kind: "concrete", name: "LLD for beginners", key: true, hidden: true, members: ["130 min"],
      at: { x: 300, y: 14, w: 200 }, portrait: { x: 120, y: 10, w: 212 } },
    { id: "basics", kind: "concrete", name: "Basics", key: true, hidden: true, members: ["35 min"],
      at: { x: 150, y: 100, w: 120 }, portrait: { x: 8, y: 96, w: 120 } },
    { id: "patterns", kind: "concrete", name: "Patterns", key: true, hidden: true, members: ["95 min"],
      at: { x: 470, y: 100, w: 130 }, portrait: { x: 176, y: 96, w: 156 } },
    { id: "lld", kind: "concrete", name: "What is LLD?", hidden: true, members: ["10 min ✓"],
      at: { x: 40, y: 190, w: 110 }, portrait: { x: 8, y: 182, w: 100 } },
    { id: "uml", kind: "concrete", name: "UML", hidden: true, members: ["25 min ✓"],
      at: { x: 162, y: 190, w: 90 }, portrait: { x: 120, y: 182, w: 76 } },
    { id: "creational", kind: "concrete", name: "Creational", key: true, hidden: true, members: ["50 min"],
      at: { x: 380, y: 190, w: 130 }, portrait: { x: 40, y: 268, w: 80 } },
    { id: "structural", kind: "concrete", name: "Structural", key: true, hidden: true, members: ["45 min"],
      at: { x: 560, y: 190, w: 130 }, portrait: { x: 252, y: 268, w: 80 } },
    { id: "singleton", kind: "concrete", name: "Singleton", hidden: true, members: ["20 min ✓"],
      at: { x: 330, y: 280, w: 100 }, portrait: { x: 8, y: 354, w: 74 } },
    { id: "builder", kind: "concrete", name: "Builder", hidden: true, members: ["30 min"],
      at: { x: 442, y: 280, w: 90 }, portrait: { x: 94, y: 354, w: 70 } },
    { id: "adapter", kind: "concrete", name: "Adapter", hidden: true, members: ["20 min"],
      at: { x: 544, y: 280, w: 90 }, portrait: { x: 176, y: 354, w: 70 } },
    { id: "composite", kind: "concrete", name: "Composite", hidden: true, members: ["25 min"],
      at: { x: 646, y: 280, w: 100 }, portrait: { x: 258, y: 354, w: 74 } }
  ],
  edges: [
    comp("course", "basics"), comp("course", "patterns"), comp("basics", "lld"), comp("basics", "uml"),
    comp("patterns", "creational", { viaPortrait: [[292, 256], [80, 256]] }), comp("patterns", "structural"),
    comp("creational", "singleton"), comp("creational", "builder"), comp("structural", "adapter"), comp("structural", "composite")
  ]
};

const COURSE: Record<string, string> = {
  "course|no": "3/6 lessons, 42% of 130 min", "patterns|no": "1/4 lessons, 21% of 95 min",
  "structural|no": "0/2 lessons, 0% of 45 min", "builder|no": "0/1 lessons, 0% of 30 min",
  "course|yes": "4/6 lessons, 65% of 130 min", "patterns|yes": "2/4 lessons, 52% of 95 min",
  "structural|yes": "0/2 lessons, 0% of 45 min", "builder|yes": "1/1 lessons, 100% of 30 min"
};
const courseResult = (key: string): TryResult => {
  const [node, done] = key.split("|");
  return {
    output: COURSE[key],
    note: done === "yes" ? "Builder's 30 minutes now count as done; Up next becomes Adapter." : "Done lessons so far: What is LLD?, UML and Singleton (55 min). Up next: Builder.",
    actions: [
      { members: "builder", lines: [done === "yes" ? "30 min ✓" : "30 min"] },
      { ring: node },
      { call: ["client", node], label: `progress(${node})`, result: COURSE[key] }
    ]
  };
};

const course: ExampleAnimation = {
  diagram: courseDiagram,
  walk: [
    [{ show: ["client", "course"] }, { show: ["basics", "patterns"] }, { show: ["course-basics", "course-patterns"] },
      { show: ["lld", "uml", "creational", "structural"] }, { show: ["basics-lld", "basics-uml", "patterns-creational", "patterns-structural"] },
      { show: ["singleton", "builder", "adapter", "composite"] },
      { show: ["creational-singleton", "creational-builder", "structural-adapter", "structural-composite"] }],
    [{ ring: "course" }, { pulse: "lld" }, { pulse: "uml", together: true }, { pulse: "singleton", together: true },
      { call: ["client", "course"], label: "progress(course)", result: "3/6 lessons, 42% of 130 min" }],
    [{ ring: "patterns" }, { call: ["client", "patterns"], label: "progress(patterns)", result: "1/4 lessons, 21% of 95 min" }],
    [{ ring: "builder" }, { call: ["client", "builder"], label: "progress(builder)", result: "0/1 lessons, 0% of 30 min" }],
    [{ ring: null }, { call: ["course", "basics", "lld"], label: "lessons()", result: "done" },
      { call: ["basics", "uml"], label: "next", result: "done" },
      { call: ["course", "patterns", "creational", "singleton"], label: "next", result: "done" },
      { call: ["creational", "builder"], label: "next", result: "not done" },
      { ring: "builder", caption: "up next" }]
  ],
  tryIt: {
    prompt: "Ask for progress at any level, with or without Builder finished. What does progress() report?",
    groups: [
      { label: "Node", options: [{ id: "course", label: "Whole course" }, { id: "patterns", label: "Patterns" }, { id: "structural", label: "Structural" }, { id: "builder", label: "Builder lesson" }] },
      { label: "Builder finished?", options: [{ id: "no", label: "No" }, { id: "yes", label: "Yes" }] }
    ],
    results: Object.fromEntries(Object.keys(COURSE).map((k) => [k, courseResult(k)]))
  }
};

const animation: PatternAnimation = {
  slug: "composite",
  story: storyAnim,
  examples: { bundle, org, formula, course },
  sequence: {
    label: "Demo code calls size on project, which asks README.md and src; src asks app.py and utils.py; the sizes add up on the way back to 7400.",
    participants: [
      { id: "client", name: "Demo code", kind: "client" },
      { id: "project", name: "project: Folder", kind: "concrete" },
      { id: "readme", name: "README.md: File", kind: "concrete" },
      { id: "src", name: "src: Folder", kind: "concrete" },
      { id: "app", name: "app.py: File", kind: "concrete" },
      { id: "utils", name: "utils.py: File", kind: "concrete" }
    ],
    messages: [
      { from: "client", to: "project", label: "size()" },
      { from: "project", to: "readme", label: "size()" },
      { from: "readme", to: "project", label: "1200", kind: "return" },
      { from: "project", to: "src", label: "size()" },
      { from: "src", to: "app", label: "size()" },
      { from: "app", to: "src", label: "5400", kind: "return" },
      { from: "src", to: "utils", label: "size()" },
      { from: "utils", to: "src", label: "800", kind: "return" },
      { from: "src", to: "project", label: "6200", kind: "return" },
      { from: "project", to: "client", label: "7400", kind: "return" }
    ]
  }
};

export default animation;
