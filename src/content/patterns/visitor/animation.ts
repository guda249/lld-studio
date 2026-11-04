import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: operations move out of the item classes into visitor classes ---------- */

const story: DiagramSpec = {
  label: "Book, Electronics and Grocery implement Item with accept(v); TaxVisitor and ShippingVisitor implement ItemVisitor with one visit method per item type; a PointsVisitor is added at the end.",
  width: 960,
  height: 400,
  portraitWidth: 340,
  portraitHeight: 700,
  nodes: [
    { id: "app", kind: "client", name: "App", at: { x: 16, y: 20, w: 100, h: 56 }, portrait: { x: 8, y: 8, w: 100, h: 50 } },
    { id: "item", kind: "interface", name: "Item", key: true, hidden: true, members: ["+ accept(v)"],
      at: { x: 150, y: 20, w: 200 }, portrait: { x: 120, y: 8, w: 196 } },
    { id: "book", kind: "concrete", name: "Book", members: [], at: { x: 16, y: 180, w: 140 }, portrait: { x: 8, y: 110, w: 100 } },
    { id: "elec", kind: "concrete", name: "Electronics", members: [], at: { x: 170, y: 180, w: 150 }, portrait: { x: 114, y: 110, w: 100 } },
    { id: "groc", kind: "concrete", name: "Grocery", members: [], at: { x: 334, y: 180, w: 140 }, portrait: { x: 220, y: 110, w: 100 } },
    { id: "visitor", kind: "interface", name: "ItemVisitor", key: true, hidden: true,
      members: ["+ visit_book(b)", "+ visit_electronics(e)", "+ visit_grocery(g)"],
      scalaMembers: ["+ visitBook(b)", "+ visitElectronics(e)", "+ visitGrocery(g)"],
      at: { x: 560, y: 20, w: 330 }, portrait: { x: 20, y: 270, w: 296 } },
    { id: "tax", kind: "concrete", name: "TaxVisitor", key: true, hidden: true, members: ["Book: 0%", "Elec: 18%", "Groc: 5%"],
      at: { x: 500, y: 196, w: 140, h: 120 }, portrait: { x: 8, y: 420, w: 152, h: 120 } },
    { id: "ship", kind: "concrete", name: "ShippingVisitor", hidden: true, members: ["Book: ₹40", "Elec: ₹0 or ₹100", "Groc: ₹20/kg"],
      at: { x: 652, y: 196, w: 145, h: 120 }, portrait: { x: 176, y: 420, w: 140, h: 120 } },
    { id: "points", kind: "concrete", name: "PointsVisitor", hidden: true, members: ["Book: ₹100 = 1", "Elec: ₹200 = 1", "Groc: 0"],
      at: { x: 809, y: 196, w: 140, h: 120 }, portrait: { x: 92, y: 556, w: 152, h: 104 } }
  ],
  edges: [
    { id: "uses", from: "item", to: "visitor", type: "dependency", hidden: true, route: "straight", viaPortrait: [[328, 320], [328, 45]] },
    { id: "r-book", from: "book", to: "item", type: "realization", hidden: true },
    { id: "r-elec", from: "elec", to: "item", type: "realization", hidden: true },
    { id: "r-groc", from: "groc", to: "item", type: "realization", hidden: true },
    { id: "r-tax", from: "tax", to: "visitor", type: "realization", hidden: true },
    { id: "r-ship", from: "ship", to: "visitor", type: "realization", hidden: true },
    { id: "r-points", from: "points", to: "visitor", type: "realization", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Edited for every new operation", tone: "warn", near: "elec" },
    { id: "ok", text: "Items: 0 changes", tone: "ok", near: "points", place: "below" }
  ]
};

const ACCEPT = ["+ accept(v)"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every operation lives in every item",
      what: "Book, Electronics and Grocery each carry tax(), shipping() and loyalty_points(). A CSV export would mean a fourth method in all three classes.",
      why: "The item classes keep changing for reasons that have nothing to do with being an item. Each new operation edits every class (Open/Closed and Single Responsibility both suffer).",
      say: {
        what: "Here's the problem. Book, electronics and grocery each carry a tax method, a shipping method and a loyalty points method. A C S V export would mean a fourth method in all three classes.",
        why: "The item classes keep changing for reasons that have nothing to do with being an item. Every new operation edits every class."
      },
      code: "problem",
      lines: { python: [8, 9, 10, 16, 17, 18, 25, 26, 27], scala: [8, 9, 10, 13, 14, 15, 18, 19, 20] },
      actions: [
        { members: "book", stagger: true, lines: ["tax", "shipping", "points"] },
        { members: "elec", stagger: true, lines: ["tax", "shipping", "points"], together: true },
        { members: "groc", stagger: true, lines: ["tax", "shipping", "points"], together: true },
        { flash: "elec" },
        { shake: "elec", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Each operation becomes one visitor class",
      what: "All the tax rules move into TaxVisitor, and all the shipping rules into ShippingVisitor. Each visitor has one method per item type.",
      why: "The rules for one operation now sit together in one class (Single Responsibility), and the items go back to being plain data.",
      say: {
        what: "All the tax rules move into a tax visitor, and all the shipping rules into a shipping visitor. Each visitor has one method per item type.",
        why: "The rules for one operation now sit together in one class, and the items go back to being plain data."
      },
      code: "main",
      lines: { python: [47, 48, 49, 50, 53, 54, 55, 56], scala: [18, 19, 20, 21, 23, 24, 25, 26] },
      actions: [
        { hide: ["warn"] },
        { spawn: ["tax", "ship"], from: "elec" },
        { members: "book", lines: ACCEPT },
        { members: "elec", lines: ACCEPT, together: true },
        { members: "groc", lines: ACCEPT, together: true }
      ]
    },
    {
      title: "Two interfaces meet: Item and ItemVisitor",
      what: "Every item implements Item.accept(v). Every visitor implements ItemVisitor, with visit_book, visit_electronics and visit_grocery.",
      why: "Items know only the visitor interface, never a concrete operation, so any visitor can be passed to any item.",
      say: {
        what: "Every item implements one method, accept, which takes a visitor. Every visitor implements the item visitor interface, with one visit method for each item type.",
        why: "Items only know the visitor interface, never a concrete operation. So any visitor can be passed to any item."
      },
      code: "main",
      lines: { python: [5, 7, 10, 13, 16, 18], scala: [1, 2, 3, 4, 6, 7] },
      actions: [
        { show: ["item"] },
        { show: ["r-book", "r-elec", "r-groc"] },
        { show: ["visitor"] },
        { show: ["r-tax", "r-ship"] },
        { show: ["uses"] }
      ]
    },
    {
      title: "Double dispatch: accept calls back",
      what: "App calls book.accept(TaxVisitor()). Book knows its own type, so it calls visitor.visit_book(self), and TaxVisitor returns 0.0.",
      why: "The code that runs depends on two types: the item's (chosen by accept) and the visitor's (chosen by the object passed in). That is double dispatch.",
      say: {
        what: "The app calls accept on the book, passing a tax visitor. The book knows its own type, so it calls visit book on the visitor, passing itself. The tax visitor returns zero.",
        why: "The code that runs depends on two types: the item's, chosen by accept, and the visitor's, chosen by the object passed in. That's called double dispatch."
      },
      code: "main",
      lines: { python: [25, 26, 48, 60], scala: [10, 19, 30] },
      actions: [
        { ring: "tax", caption: "visitor" },
        { call: ["app", "book"], label: "accept(TaxVisitor())" },
        { mark: "visitor", member: 0 },
        { call: ["book", "tax"], label: "visit_book(self)", scalaLabel: "visitBook(this)", result: "0.0", back: ["tax", "book", "app"] }
      ]
    },
    {
      title: "Each item picks its own visit method",
      what: "Electronics calls visit_electronics and gets 18% of ₹15,000; Grocery calls visit_grocery and gets 5% of ₹300. The cart's tax adds up to 2715.0.",
      why: "No if/elif on item types anywhere: accept already knows which visit method to call.",
      say: {
        what: "Electronics calls visit electronics, and gets eighteen percent of fifteen thousand. Grocery calls visit grocery, and gets five percent of three hundred. The tax adds up to two thousand seven hundred and fifteen.",
        why: "There's no if-else on item types anywhere. Accept already knows which visit method to call."
      },
      code: "main",
      lines: { python: [34, 35, 43, 44, 49, 50, 60], scala: [13, 16, 20, 21, 30] },
      actions: [
        { mark: "visitor", member: 1 },
        { call: ["app", "elec", "tax"], label: "accept → visit_electronics", scalaLabel: "accept → visitElectronics", result: "2700.0" },
        { mark: "visitor", member: 2 },
        { call: ["app", "groc", "tax"], label: "accept → visit_grocery", scalaLabel: "accept → visitGrocery", result: "15.0" },
        { tag: "tax", text: "tax: 2715.0" }
      ]
    },
    {
      title: "Same items, a different visitor",
      what: "The same accept() calls now get ShippingVisitor: ₹40 for the book, ₹0 for electronics over ₹10,000, and ₹50 for 2.5 kg of groceries.",
      why: "The items did not change at all; only the visitor passed in did. The total shipping is 90.0.",
      say: {
        what: "The same accept calls now get a shipping visitor: forty rupees for the book, nothing for electronics over ten thousand, and fifty for two and a half kilos of groceries.",
        why: "The items didn't change at all. Only the visitor passed in did."
      },
      code: "main",
      lines: { python: [53, 54, 55, 56, 61], scala: [23, 24, 25, 26, 31] },
      actions: [
        { mark: "visitor", member: null },
        { ring: "ship", caption: "visitor" },
        { call: ["app", "book", "ship"], label: "accept(ShippingVisitor())", result: "40.0" },
        { call: ["app", "elec", "ship"], label: "accept(ShippingVisitor())", result: "0.0" },
        { call: ["app", "groc", "ship"], label: "accept(ShippingVisitor())", result: "50.0" },
        { tag: "ship", text: "shipping: 90.0" }
      ]
    },
    {
      title: "A new operation is a new class",
      what: "Imagine a PointsVisitor for loyalty points (not in the code). It implements ItemVisitor and works with every item at once.",
      why: "Items: 0 lines changed (Open/Closed for operations). The price: a new item type would mean a new visit method in every visitor.",
      say: {
        what: "Now imagine a points visitor for loyalty points. It implements the item visitor interface, and works with every item straight away.",
        why: "The item classes have zero lines changed. That's open-closed, for new operations. The price is that a new item type would need a new visit method in every visitor."
      },
      code: "main",
      lines: { python: [5, 7, 10, 13], scala: [1, 2, 3, 4] },
      actions: [
        { ring: null },
        { tag: "tax", text: null, together: true },
        { tag: "ship", text: null, together: true },
        { show: ["points"] },
        { show: ["r-points"] },
        { show: ["ok"] },
        { pulse: "book" },
        { pulse: "elec", together: true },
        { pulse: "groc", together: true }
      ]
    }
  ]
};

/* ---------- examples: element interface + 3 elements on the left, visitor interface + visitors on the right ---------- */

interface El { id: string; name: string; members: string[]; scalaMembers?: string[] }
interface ViCfg {
  label: string;
  client: string;
  element: string;
  visitor: { name: string; kind: "interface" | "abstract"; members: string[]; scalaMembers: string[] };
  elems: [El, El, El];
  visitors: El[];
}

const nodeH = (n: number) => 32 + n * 20 + 10 + 18; // + room for a value tag

function viMini(c: ViCfg): DiagramSpec {
  const vh = 44 + c.visitor.members.length * 20 + 10;
  const eh = Math.max(...c.elems.map((e) => nodeH(e.members.length)));
  const sh = Math.max(...c.visitors.map((v) => nodeH(v.members.length)));
  const three = c.visitors.length === 3;
  const vy = Math.max(160, 10 + vh + 40);
  const pvY = 244 + vh + 40;
  const pvW = [{ x: 8, w: 152 }, { x: 176, w: 140 }, { x: 92, w: 152 }];
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 10, y: 10, w: 116, h: 50 }, portrait: { x: 8, y: 8, w: 104, h: 50 } },
    { id: "eiface", kind: "interface", name: c.element, key: true, hidden: true, members: ["+ accept(v)"],
      at: { x: 140, y: 10, w: 200 }, portrait: { x: 124, y: 8, w: 192 } },
    ...c.elems.map((e, i): DNode => ({
      id: e.id, kind: "concrete", name: e.name, hidden: true, members: e.members, scalaMembers: e.scalaMembers,
      at: { x: 10 + i * 118, y: 150, w: 110, h: eh }, portrait: { x: 8 + i * 106, y: 110, w: 96, h: eh }
    })),
    { id: "viface", kind: c.visitor.kind, name: c.visitor.name, key: true, hidden: true, members: c.visitor.members, scalaMembers: c.visitor.scalaMembers,
      at: { x: 390, y: 10, w: 360 }, portrait: { x: 20, y: 244, w: 296 } },
    ...c.visitors.map((v, i): DNode => ({
      id: v.id, kind: "concrete", name: v.name, key: true, hidden: true, members: v.members, scalaMembers: v.scalaMembers,
      at: three ? { x: 384 + i * 124, y: vy, w: 118, h: sh } : { x: 396 + i * 182, y: vy, w: 170, h: sh },
      portrait: { x: pvW[i].x, y: pvY + (i === 2 ? sh + 24 : 0), w: pvW[i].w, h: sh }
    }))
  ];
  const bottomL = Math.max(150 + eh, vy + sh);
  const bottomP = pvY + sh + (three ? sh + 24 : 0);
  return {
    label: c.label,
    width: 760, height: bottomL + 40,
    portraitWidth: 340, portraitHeight: bottomP + 40,
    nodes,
    edges: [
      { id: "uses", from: "eiface", to: "viface", type: "dependency", hidden: true, route: "straight", viaPortrait: [[328, 290], [328, 45]] },
      ...c.elems.map((e) => ({ id: "r-" + e.id, from: e.id, to: "eiface", type: "realization" as const, hidden: true })),
      ...c.visitors.map((v) => ({ id: "r-" + v.id, from: v.id, to: "viface", type: (c.visitor.kind === "abstract" ? "inheritance" : "realization") as "inheritance" | "realization", hidden: true }))
    ]
  };
}

const build = (c: ViCfg): Action[] => [
  { show: ["client"] },
  { show: ["eiface"] },
  { show: c.elems.map((e) => e.id) },
  { show: c.elems.map((e) => "r-" + e.id) },
  { show: ["viface"] },
  { show: c.visitors.map((v) => v.id) },
  { show: c.visitors.map((v) => "r-" + v.id) },
  { show: ["uses"] }
];
const clear = (c: ViCfg): Action[] => [
  { ring: null },
  { mark: "viface", member: null, together: true },
  ...c.elems.map((e): Action => ({ tag: e.id, text: null, together: true })),
  ...c.visitors.map((v): Action => ({ tag: v.id, text: null, together: true }))
];
/** One full double-dispatch trip: client -> element.accept(visitor) -> visitor.visit_x(element), result back to the client. */
const visit = (elem: string, vis: string, label: string, result: string, scalaLabel?: string): Action =>
  ({ call: ["client", elem, vis], label, scalaLabel, result });

/* --- calculator expression tree --- */
const exprCfg: ViCfg = {
  label: "Num, Add and Mul implement Expr; EvalVisitor, PrintVisitor and PostfixVisitor implement ExprVisitor.",
  client: "Calculator", element: "Expr",
  visitor: { name: "ExprVisitor[T]", kind: "interface",
    members: ["+ visit_num(n): T", "+ visit_add(a): T", "+ visit_mul(m): T"], scalaMembers: ["+ visitNum(n): R", "+ visitAdd(a): R", "+ visitMul(m): R"] },
  elems: [
    { id: "num", name: "Num", members: ["value"] },
    { id: "add", name: "Add", members: ["left, right"] },
    { id: "mul", name: "Mul", members: ["left, right"] }
  ],
  visitors: [
    { id: "eval", name: "EvalVisitor", members: ["→ number"] },
    { id: "print", name: "PrintVisitor", members: ["→ infix text"] },
    { id: "post", name: "PostfixVisitor", members: ["→ postfix text"] }
  ]
};
const EXPR: Record<string, string> = {
  "eval|t1": "21", "print|t1": "((2 + 3) * 4 + 1)", "post|t1": "2 3 + 4 * 1 +",
  "eval|t2": "14", "print|t2": "2 * (3 + 4)", "post|t2": "2 3 4 + *"
};
const VNAME: Record<string, string> = { eval: "EvalVisitor", print: "PrintVisitor", post: "PostfixVisitor" };
const expr: ExampleAnimation = {
  diagram: viMini(exprCfg),
  walk: [
    [...build(exprCfg), { tag: "client", text: "(2 + 3) * 4 + 1" }],
    [{ ring: "print" }, { call: ["client", "add"], label: "tree.accept(PrintVisitor())" }, { mark: "viface", member: 1 },
      { call: ["add", "print"], label: "visit_add(root)", scalaLabel: "visitAdd(root)" },
      { call: ["print", "mul"], label: "left.accept(self)", scalaLabel: "left.accept(this)" }, { call: ["print", "num"], label: "right.accept(self)", scalaLabel: "right.accept(this)" }],
    [{ mark: "viface", member: 0 }, { call: ["num", "print"], label: "visit_num", scalaLabel: "visitNum", result: '"2", "3", "4", "1"' },
      { mark: "viface", member: null }, { tag: "print", text: "((2 + 3) * 4 + 1)" }],
    [{ ring: "post" }, visit("add", "post", "tree.accept(PostfixVisitor())", "2 3 + 4 * 1 +"), { tag: "post", text: "2 3 + 4 * 1 +" }],
    [{ ring: "eval" }, visit("add", "eval", "tree.accept(EvalVisitor())", "21"), { tag: "eval", text: "21" }]
  ],
  tryIt: {
    prompt: "Pick a visitor and a tree. The same accept() gives a number or text.",
    groups: [
      { label: "Visitor", options: [{ id: "eval", label: "EvalVisitor" }, { id: "print", label: "PrintVisitor" }, { id: "post", label: "PostfixVisitor" }] },
      { label: "Tree", options: [{ id: "t1", label: "(2 + 3) * 4 + 1" }, { id: "t2", label: "2 * (3 + 4)" }] }
    ],
    results: Object.fromEntries(Object.entries(EXPR).map(([key, output]) => {
      const [v, t] = key.split("|");
      const root = t === "t1" ? "add" : "mul";
      return [key, {
        output,
        note: `The root is ${t === "t1" ? "an Add" : "a Mul"}, so accept calls visit_${t === "t1" ? "add" : "mul"}, which recurses into both children.`,
        actions: [...clear(exprCfg), { ring: v }, { mark: "viface", member: t === "t1" ? 1 : 2 }, visit(root, v, `tree.accept(${VNAME[v]}())`, output), { tag: v, text: output }]
      } satisfies TryResult];
    }))
  }
};

/* --- article export --- */
const exportCfg: ViCfg = {
  label: "Heading, Paragraph and Image implement Block; MarkdownExporter and WordCounter implement BlockVisitor and keep state while they walk.",
  client: "Blog editor", element: "Block",
  visitor: { name: "BlockVisitor", kind: "interface",
    members: ["+ visit_heading(h)", "+ visit_paragraph(p)", "+ visit_image(i)"], scalaMembers: ["+ visitHeading(h)", "+ visitParagraph(p)", "+ visitImage(i)"] },
  elems: [
    { id: "head", name: "Heading", members: ["text, level"] },
    { id: "para", name: "Paragraph", members: ["text"] },
    { id: "img", name: "Image", members: ["caption"] }
  ],
  visitors: [
    { id: "md", name: "MarkdownExporter", members: ["- lines"] },
    { id: "wc", name: "WordCounter", members: ["- words, images"] }
  ]
};
const EXPORT: Record<string, [string, string]> = {
  "md|h1": ["# Monsoon in Kerala", "Level 1 heading: one # before the text."],
  "md|h2": ["## Getting around", "Level 2 heading: ## before the text."],
  "md|img": ["![Backwaters at Alleppey](alleppey.jpg)", "visit_image writes Markdown image syntax."],
  "wc|h1": ["words + 3", "\"Monsoon in Kerala\" has 3 words."],
  "wc|h2": ["words + 2", "\"Getting around\" has 2 words."],
  "wc|img": ["images + 1", "Images are counted separately, not as words."]
};
const exportEx: ExampleAnimation = {
  diagram: viMini(exportCfg),
  walk: [
    [...build(exportCfg), { tag: "client", text: "5 blocks" }],
    [{ call: ["client", "head", "md"], label: "accept(exporter)" }, { call: ["client", "head", "wc"], label: "accept(counter)" }],
    [{ ring: "md" }, { mark: "viface", member: 0 }, visit("head", "md", "accept → visit_heading", "## Getting around", "accept → visitHeading"),
      { mark: "viface", member: 2 }, visit("img", "md", "accept → visit_image", "![Backwaters…](alleppey.jpg)", "accept → visitImage")],
    [{ ring: "wc" }, { mark: "viface", member: 1 }, visit("para", "wc", "accept → visit_paragraph", "words + 7", "accept → visitParagraph"),
      { mark: "viface", member: 2 }, visit("img", "wc", "accept → visit_image", "images + 1", "accept → visitImage")],
    [{ ring: null }, { mark: "viface", member: null }, { tag: "md", text: "5 Markdown lines" }, { tag: "wc", text: "21 words, 1 image" }]
  ],
  tryIt: {
    prompt: "Pick a visitor and a block. Each visitor treats each block type its own way.",
    groups: [
      { label: "Visitor", options: [{ id: "md", label: "MarkdownExporter" }, { id: "wc", label: "WordCounter" }] },
      { label: "Block", options: [{ id: "h1", label: "Heading (level 1)" }, { id: "h2", label: "Heading (level 2)" }, { id: "img", label: "Image" }] }
    ],
    results: Object.fromEntries(Object.entries(EXPORT).map(([key, [output, note]]) => {
      const [v, b] = key.split("|");
      const elem = b === "img" ? "img" : "head";
      return [key, {
        output, note,
        actions: [...clear(exportCfg), { ring: v }, { mark: "viface", member: b === "img" ? 2 : 0 },
          visit(elem, v, `accept(${v === "md" ? "exporter" : "counter"})`, output)]
      } satisfies TryResult];
    }))
  }
};

/* --- insurance claim rules --- */
const claimsCfg: ViCfg = {
  label: "Consultation, LabTest and Surgery implement ClaimItem; CoverageVisitor and PreAuthVisitor extend ClaimVisitor, whose visit methods fall back to zero.",
  client: "Claims desk", element: "ClaimItem",
  visitor: { name: "ClaimVisitor", kind: "abstract",
    members: ["+ fallback(item): 0", "+ visit_consultation(c)", "+ visit_lab_test(t)", "+ visit_surgery(s)"],
    scalaMembers: ["+ fallback(item): 0", "+ visitConsultation(c)", "+ visitLabTest(t)", "+ visitSurgery(s)"] },
  elems: [
    { id: "cons", name: "Consultation", members: ["cost ₹800"] },
    { id: "lab", name: "LabTest", members: ["cost ₹450"] },
    { id: "surg", name: "Surgery", members: ["₹120,000"] }
  ],
  visitors: [
    { id: "cov", name: "CoverageVisitor", members: ["80% | 100% | 90%", "max ₹100,000"] },
    { id: "pre", name: "PreAuthVisitor", members: ["only visit_surgery", "≥ ₹50,000 needs it"], scalaMembers: ["only visitSurgery", "≥ ₹50,000 needs it"] }
  ]
};
const CLAIMS: Record<string, [string, string]> = {
  "cov|cons": ["₹640", "80% of ₹800."],
  "cov|lab": ["₹450", "Lab tests are covered in full."],
  "cov|surg": ["₹100,000", "90% of ₹120,000 is ₹108,000, capped at ₹100,000."],
  "pre|cons": ["₹0", "PreAuthVisitor does not override visit_consultation, so the fallback returns 0."],
  "pre|lab": ["₹0", "PreAuthVisitor does not override visit_lab_test, so the fallback returns 0."],
  "pre|surg": ["₹120,000", "Over ₹50,000, so the whole surgery needs pre-authorisation."]
};
const ROW: Record<string, number> = { cons: 1, lab: 2, surg: 3 };
const claims: ExampleAnimation = {
  diagram: viMini(claimsCfg),
  walk: [
    [...build(claimsCfg), { tag: "client", text: "bill ₹121,250" }],
    [{ ring: "cov" }, visit("cons", "cov", "accept(CoverageVisitor())", "₹640"), visit("lab", "cov", "accept(CoverageVisitor())", "₹450"),
      visit("surg", "cov", "accept(CoverageVisitor())", "₹100,000")],
    [{ tag: "cov", text: "insurer pays ₹101,090" }, { tag: "client", text: "patient pays ₹20,160" }],
    [{ ring: "pre" }, { mark: "viface", member: 0 }, visit("cons", "pre", "accept(PreAuthVisitor())", "0 (fallback)"), visit("lab", "pre", "accept(PreAuthVisitor())", "0 (fallback)")],
    [{ mark: "viface", member: null }, visit("surg", "pre", "accept(PreAuthVisitor())", "₹120,000"), { flash: "surg" }, { tag: "pre", text: "pre-auth ₹120,000" }]
  ],
  tryIt: {
    prompt: "Pick a rule and a claim item. Rules only handle the item types they care about.",
    groups: [
      { label: "Rule", options: [{ id: "cov", label: "CoverageVisitor" }, { id: "pre", label: "PreAuthVisitor" }] },
      { label: "Item", options: [{ id: "cons", label: "Consultation ₹800" }, { id: "lab", label: "LabTest ₹450" }, { id: "surg", label: "Surgery ₹120,000" }] }
    ],
    results: Object.fromEntries(Object.entries(CLAIMS).map(([key, [output, note]]) => {
      const [v, item] = key.split("|");
      const fallback = v === "pre" && item !== "surg";
      return [key, {
        output, note,
        actions: [...clear(claimsCfg), { ring: v }, { mark: "viface", member: fallback ? 0 : ROW[item] },
          visit(item, v, `accept(${v === "cov" ? "CoverageVisitor" : "PreAuthVisitor"}())`, output)]
      } satisfies TryResult];
    }))
  }
};

/* --- smart home devices --- */
const devCfg: ViCfg = {
  label: "Thermostat, Camera and DoorLock implement Device; EnergyVisitor returns kWh and HealthCheckVisitor returns a status, both through DeviceVisitor.",
  client: "Home app", element: "Device",
  visitor: { name: "DeviceVisitor[T]", kind: "interface",
    members: ["+ visit_thermostat(t): T", "+ visit_camera(c): T", "+ visit_door_lock(d): T"],
    scalaMembers: ["+ visitThermostat(t): R", "+ visitCamera(c): R", "+ visitDoorLock(d): R"] },
  elems: [
    { id: "therm", name: "Thermostat", members: ["24 °C, 6 h"] },
    { id: "cam", name: "Camera", members: ["4K, 3 GB"] },
    { id: "lock", name: "DoorLock", members: ["battery 15%"] }
  ],
  visitors: [
    { id: "energy", name: "EnergyVisitor", members: ["→ kWh per day"] },
    { id: "health", name: "HealthCheckVisitor", members: ["→ status text"] }
  ]
};
const DEV: Record<string, [string, string]> = {
  "energy|therm": ["7.20 kWh/day", "1.2 kWh per hour × 6 hours on."],
  "energy|cam": ["0.48 kWh/day", "A 4K camera uses 0.48 kWh a day."],
  "energy|lock": ["0.01 kWh/day", "A lock uses almost nothing."],
  "health|therm": ["OK", "24 °C is inside 16–30 °C."],
  "health|cam": ["storage low", "Only 3 GB free, under the 5 GB limit."],
  "health|lock": ["replace battery", "15% is under the 20% limit."]
};
const DROW: Record<string, number> = { therm: 0, cam: 1, lock: 2 };
const devices: ExampleAnimation = {
  diagram: viMini(devCfg),
  walk: [
    build(devCfg),
    [{ call: ["client", "therm", "energy"], label: "accept(EnergyVisitor())" }, { call: ["client", "therm", "health"], label: "accept(HealthCheckVisitor())" }],
    [{ mark: "viface", member: 0 }, { ring: "energy" }, visit("therm", "energy", "accept(EnergyVisitor())", "7.20 kWh"),
      { ring: "health" }, visit("therm", "health", "accept(HealthCheckVisitor())", "OK")],
    [{ mark: "viface", member: 1 }, visit("cam", "health", "accept(HealthCheckVisitor())", "storage low"), { flash: "cam" }],
    [{ mark: "viface", member: 2 }, visit("lock", "health", "accept(HealthCheckVisitor())", "replace battery"), { flash: "lock" },
      { tag: "energy", text: "total 7.69 kWh/day" }]
  ],
  tryIt: {
    prompt: "Pick a report and a device. Each report returns its own kind of answer.",
    groups: [
      { label: "Report", options: [{ id: "energy", label: "EnergyVisitor" }, { id: "health", label: "HealthCheckVisitor" }] },
      { label: "Device", options: [{ id: "therm", label: "Thermostat" }, { id: "cam", label: "Camera" }, { id: "lock", label: "DoorLock" }] }
    ],
    results: Object.fromEntries(Object.entries(DEV).map(([key, [output, note]]) => {
      const [v, d] = key.split("|");
      return [key, {
        output, note,
        actions: [...clear(devCfg), { ring: v }, { mark: "viface", member: DROW[d] },
          visit(d, v, `accept(${v === "energy" ? "EnergyVisitor" : "HealthCheckVisitor"}())`, output)]
      } satisfies TryResult];
    }))
  }
};

const animation: PatternAnimation = {
  slug: "visitor",
  story: storyAnim,
  examples: { expr, export: exportEx, claims, devices },
  sequence: {
    label: "App calls accept with a TaxVisitor on a Book and on an Electronics item; each item calls back the visit method for its own type.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "book", name: ": Book", kind: "concrete" },
      { id: "elec", name: ": Electronics", kind: "concrete" },
      { id: "tax", name: ": TaxVisitor", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "book", label: "accept(tax)" },
      { from: "book", to: "tax", label: "visit_book(self)" },
      { from: "tax", to: "book", label: "0.0", kind: "return" },
      { from: "book", to: "app", label: "0.0", kind: "return" },
      { from: "app", to: "elec", label: "accept(tax)" },
      { from: "elec", to: "tax", label: "visit_electronics(self)" },
      { from: "tax", to: "elec", label: "2700.0", kind: "return" },
      { from: "elec", to: "app", label: "2700.0", kind: "return" }
    ]
  }
};

export default animation;
