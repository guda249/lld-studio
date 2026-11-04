import type { Action, DiagramSpec, DNode, DEdge, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: building an HTTP request step by step ---------- */

const story: DiagramSpec = {
  label: "Demo code uses HttpRequestBuilder, whose chainable steps collect settings; build() checks the rules and creates an immutable HttpRequest.",
  width: 880,
  height: 300,
  portraitWidth: 340,
  portraitHeight: 452,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", at: { x: 20, y: 152, w: 140, h: 56 }, portrait: { x: 8, y: 8, w: 140, h: 50 } },
    { id: "builder", kind: "concrete", name: "HttpRequestBuilder", key: true, hidden: true,
      members: ["+ method(m)", "+ json_body(body)", "+ timeout(seconds)", "+ build(): HttpRequest"],
      scalaMembers: ["+ withMethod(m)", "+ withJsonBody(body)", "+ withTimeout(seconds)", "+ build(): HttpRequest"],
      at: { x: 240, y: 120, w: 250 }, portrait: { x: 40, y: 100, w: 260 } },
    { id: "request", kind: "concrete", name: "HttpRequest", key: true, members: [],
      at: { x: 600, y: 120, w: 260 }, portrait: { x: 40, y: 300, w: 260 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "builder", type: "association", hidden: true },
    { id: "creates", from: "builder", to: "request", type: "dependency", label: "creates", hidden: true }
  ],
  badges: [
    { id: "warn", text: "8 positional args, no checks", tone: "warn", near: "request" },
    { id: "ok", text: "Invalid request never built", tone: "ok", near: "builder" }
  ]
};

const PROBLEM_LINES = ['("POST", url, {...}, body,', "   5.0, True, None, 3)", '("GET", url, {}, body,', "   3, True, None, 5)"];
const PROBLEM_SCALA = ['("POST", url, Map(…), body,', "   5.0, true, None, 3)", '("GET", url, Map.empty, body,', "   3, true, None, 5)"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: eight arguments in a row",
      what: "HttpRequest takes eight positional arguments. The second call swaps the timeout and the retries, and sends a GET with a body. Both are created without a complaint.",
      why: "Long constructors are easy to misuse, and there is no single place to check rules that span several fields.",
      say: {
        what: "Here's the problem. The H T T P request takes eight positional arguments. The second call swaps the timeout and the retry count, and sends a GET with a body. Both objects are created without any complaint.",
        why: "Long constructors are easy to misuse, and there's no single place to check rules that involve several fields."
      },
      code: "problem",
      lines: { python: [2, 3, 15, 16, 18], scala: [14, 15, 17, 18] },
      actions: [
        { members: "request", stagger: true, lines: PROBLEM_LINES, scalaLines: PROBLEM_SCALA },
        { call: ["client", "request"], label: 'HttpRequest("GET", …, 3, True, None, 5)', scalaLabel: 'HttpRequest("GET", …, 3, true, None, 5)' },
        { mark: "request", member: 3 },
        { flash: "request" },
        { shake: "request", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "A separate builder holds the settings",
      what: "HttpRequestBuilder starts from the URL and sensible defaults: GET and a 10 second timeout. The product becomes a small, frozen HttpRequest.",
      why: "Collecting settings and creating the finished object are now two separate jobs (Single Responsibility).",
      say: {
        what: "Now a separate builder holds the settings. It starts from the U R L and sensible defaults: a GET request, and a ten second timeout. The product itself becomes a small, frozen H T T P request.",
        why: "Collecting the settings, and creating the finished object, are now two separate jobs. That's single responsibility."
      },
      code: "main",
      lines: { python: [4, 5, 13, 14, 16, 19], scala: [1, 9, 10, 13] },
      actions: [
        { hide: ["warn"] },
        { mark: "request", member: null },
        { members: "request", lines: ["+ method: str", "+ url: str", "+ headers, body", "+ timeout_s: float"],
          scalaLines: ["+ method: String", "+ url: String", "+ headers, body", "+ timeoutSeconds: Double"] },
        { tag: "request", text: "immutable" },
        { show: ["builder"] },
        { show: ["uses", "creates"] },
        { tag: "builder", text: "GET, timeout 10s" }
      ]
    },
    {
      title: "Named steps, chained one after another",
      what: "The demo calls method(\"post\"), json_body(...) and timeout(5). Each step changes one setting and returns the builder, so the calls chain.",
      why: "Every value has a name at the call site, so a timeout can no longer be mistaken for a retry count.",
      say: {
        what: "The demo calls method post, then json body, then timeout five. Each step changes one setting and returns the builder, so the calls chain together.",
        why: "Every value now has a name where it's used, so a timeout can't be mistaken for a retry count."
      },
      code: "main",
      lines: { python: [21, 23, 29, 31, 33, 49, 50, 51], scala: [15, 17, 23, 25, 27, 41, 42, 43] },
      actions: [
        { call: ["client", "builder"], label: 'method("post")', scalaLabel: 'withMethod("post")', result: "self" },
        { tag: "builder", text: "POST, timeout 10s" },
        { call: ["client", "builder"], label: "json_body('{\"id\": 7}')", scalaLabel: "withJsonBody(…)", result: "self" },
        { tag: "builder", text: "POST, JSON body, 10s" },
        { call: ["client", "builder"], label: "timeout(5)", scalaLabel: "withTimeout(5)", result: "self" },
        { tag: "builder", text: "POST, JSON body, 5s" }
      ]
    },
    {
      title: "build() checks every rule in one place",
      what: "build() looks at all the settings together: a GET must not have a body, and the timeout must be positive. This request passes both checks.",
      why: "Rules that span several fields live in one method, so they can never be skipped.",
      say: {
        what: "Build looks at all the settings together. A GET must not have a body, and the timeout must be positive. This request passes both checks.",
        why: "Rules that involve several fields live in one method, so they can never be skipped."
      },
      code: "main",
      lines: { python: [37, 39, 40, 41, 42], scala: [31, 33, 34, 35, 36] },
      actions: [
        { ring: "builder", caption: "validating" },
        { call: ["client", "builder"], label: "build()" },
        { mark: "builder", member: 3 },
        { pulse: "builder" }
      ]
    },
    {
      title: "Out comes a finished, immutable request",
      what: "Only after the checks pass does build() create the HttpRequest. It goes back to the demo: POST to /orders with a 5 second timeout.",
      why: "The product is never seen half-built, and because it is frozen it cannot drift into a bad state later.",
      say: {
        what: "Only after the checks pass does build create the H T T P request. It goes back to the demo: a POST to orders, with a five second timeout.",
        why: "The product is never seen half built. And because it's frozen, it can't drift into a bad state later."
      },
      code: "main",
      lines: { python: [43, 44, 52, 54, 55], scala: [37, 44, 45, 46] },
      actions: [
        { mark: "builder", member: null },
        { ring: "request", caption: "new object" },
        { call: ["builder", "request"], label: "HttpRequest(…)", result: "POST …/orders timeout=5.0s", back: ["request", "builder", "client"] },
        { pulse: "request" }
      ]
    },
    {
      title: "A bad combination is never built",
      what: "A second builder gets a JSON body but keeps the default GET. build() raises \"GET requests cannot have a body\", and no HttpRequest is created.",
      why: "Invalid objects cannot exist at all. Adding a new rule means editing build() only, not every caller.",
      say: {
        what: "A second builder gets a J SON body, but keeps the default GET method. Build raises an error, GET requests cannot have a body, and no request object is ever created.",
        why: "Invalid objects simply can't exist. And a new rule means editing build only, not every caller."
      },
      code: "main",
      lines: { python: [39, 40, 57, 58, 59, 60], scala: [33, 34, 48, 49] },
      actions: [
        { ring: "builder", caption: "new builder" },
        { tag: "builder", text: "GET, JSON body, 10s" },
        { call: ["client", "builder"], label: 'json_body("{}").build()', scalaLabel: 'withJsonBody("{}").build()', result: "GET cannot have a body" },
        { flash: "builder" },
        { ring: null },
        { show: ["ok"] },
        { pulse: "request", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: client → (director) → builder → product ---------- */

interface Cls { name: string; members: string[]; scala?: string[] }
interface MiniCfg { label: string; client: string; builder: Cls; product: Cls; director?: Cls }

/** Landscape: client (and director) left, builder centre, product right. Portrait: stacked. */
function miniDiagram(c: MiniCfg): DiagramSpec {
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 30, w: 150, h: 54 }, portrait: { x: 8, y: 8, w: 150, h: 48 } },
    { id: "builder", kind: "concrete", name: c.builder.name, key: true, hidden: true, members: c.builder.members, scalaMembers: c.builder.scala,
      at: { x: 250, y: 30, w: 240 }, portrait: { x: 40, y: 130, w: 260 } },
    { id: "product", kind: "concrete", name: c.product.name, key: true, hidden: true, members: c.product.members, scalaMembers: c.product.scala,
      at: { x: 556, y: 30, w: 190 }, portrait: { x: 40, y: 302, w: 260 } }
  ];
  const edges: DEdge[] = [
    { id: "uses", from: "client", to: "builder", type: "association", hidden: true },
    { id: "creates", from: "builder", to: "product", type: "dependency", label: "creates", hidden: true }
  ];
  if (c.director) {
    nodes.push({ id: "director", kind: "concrete", name: c.director.name, stereotype: "«director»", hidden: true,
      members: c.director.members, scalaMembers: c.director.scala,
      at: { x: 16, y: 170, w: 190 }, portrait: { x: 174, y: 8, w: 158 } });
    edges.push({ id: "asks", from: "client", to: "director", type: "association", hidden: true },
      { id: "steps", from: "director", to: "builder", type: "association", label: "runs steps", hidden: true,
        via: [[370, 217]], viaPortrait: [[253, 115]] });
  }
  return { label: c.label, width: 760, height: c.director ? 300 : 236, portraitWidth: 340, portraitHeight: 456, nodes, edges };
}

const build = (director: boolean): Action[] => [
  { show: director ? ["client", "director"] : ["client"] },
  ...(director ? [{ show: ["asks"] } as Action] : []),
  { show: ["builder"] },
  { show: director ? ["uses", "steps"] : ["uses"] },
  { show: ["product"] },
  { show: ["creates"] }
];

/* ----- 1. pizza ----- */

const PIZZA = {
  margherita: { steps: 'topping("basil").extra_cheese()', scala: 'withTopping("basil").withExtraCheese()', base: { small: 299, medium: 449, large: 599 }, what: "classic crust, basil, extra cheese" },
  farmhouse: { steps: 'crust("thin").topping(×3)', scala: 'withCrust("thin").withTopping(×3)', base: { small: 319, medium: 469, large: 619 }, what: "thin crust, onion, capsicum, mushroom" },
  custom: { steps: 'crust("cheese burst").topping(×2)', scala: 'withCrust("cheese burst").withTopping(×2)', base: { small: 279, medium: 429, large: 579 }, what: "cheese burst crust, paneer, jalapeno" }
} as const;

const pizzaRun = (recipe: keyof typeof PIZZA, size: "small" | "medium" | "large"): TryResult => {
  const p = PIZZA[recipe];
  const price = p.base[size];
  const viaDirector = recipe !== "custom";
  return {
    output: `${size} → ₹${price}`,
    note: `${size}, ${p.what}. Price = size + ₹40 per topping${recipe === "margherita" ? " + ₹60 cheese" : ""}.`,
    actions: viaDirector
      ? [{ ring: "director" }, { call: ["client", "director", "builder", "product"], label: `${recipe}("${size}")`, result: `₹${price}` }]
      : [{ ring: "client" }, { call: ["client", "builder", "product"], label: `PizzaBuilder("${size}")…build()`, result: `₹${price}` }]
  };
};

const pizza: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Menu recipe functions (the director) and the demo code both use PizzaBuilder, which creates an immutable Pizza.",
    client: "Demo code",
    director: { name: "Menu recipes", members: ["+ margherita(size)", "+ farmhouse(size)"] },
    builder: { name: "PizzaBuilder", members: ["+ crust(c)", "+ topping(name)", "+ extra_cheese()", "+ build(): Pizza"],
      scala: ["+ withCrust(c)", "+ withTopping(name)", "+ withExtraCheese()", "+ build(): Pizza"] },
    product: { name: "Pizza", members: ["size, crust", "toppings", "extra_cheese", "+ price(): int"],
      scala: ["size, crust", "toppings", "extraCheese", "+ price: Int"] }
  }),
  walk: [
    [
      ...build(true),
      { ring: "director" },
      { call: ["client", "director"], label: 'margherita("medium")' },
      { call: ["director", "builder"], label: PIZZA.margherita.steps, scalaLabel: PIZZA.margherita.scala },
      { tag: "builder", text: "medium, basil, cheese" }
    ],
    [
      { mark: "builder", member: 3 },
      { call: ["director", "builder", "product"], label: "build()", result: "Pizza: ₹449", back: ["product", "builder", "director", "client"] },
      { tag: "product", text: "₹349 + 40 + 60 = ₹449" }
    ],
    [
      { mark: "builder", member: null },
      { call: ["client", "director"], label: 'farmhouse("large")' },
      { call: ["director", "builder"], label: PIZZA.farmhouse.steps, scalaLabel: PIZZA.farmhouse.scala },
      { tag: "builder", text: "large, thin, 3 toppings" },
      { call: ["director", "builder", "product"], label: "build()", result: "Pizza: ₹619", back: ["product", "builder", "director", "client"] },
      { tag: "product", text: "₹499 + 3 × 40 = ₹619" }
    ],
    [
      { ring: "client" },
      { call: ["client", "builder"], label: 'PizzaBuilder("small").crust(…)', scalaLabel: 'PizzaBuilder("small").withCrust(…)' },
      { tag: "builder", text: "small, cheese burst, 2 toppings" },
      { call: ["client", "builder", "product"], label: "build()", result: "Pizza: ₹279" },
      { tag: "product", text: "₹199 + 2 × 40 = ₹279" }
    ],
    [
      { ring: null },
      { tag: "builder", text: null },
      { tag: "product", text: "3 pizzas, 1 set of rules" },
      { mark: "builder", member: 3 },
      { pulse: "builder" }
    ]
  ],
  tryIt: {
    prompt: "Pick a recipe and a size. The builder's build() makes the pizza and price() adds it up.",
    groups: [
      { label: "Recipe", options: [{ id: "margherita", label: "margherita()" }, { id: "farmhouse", label: "farmhouse()" }, { id: "custom", label: "Custom chain" }] },
      { label: "Size", options: [{ id: "small", label: "small" }, { id: "medium", label: "medium" }, { id: "large", label: "large" }] }
    ],
    results: Object.fromEntries((["margherita", "farmhouse", "custom"] as const).flatMap((r) =>
      (["small", "medium", "large"] as const).map((s) => [`${r}|${s}`, pizzaRun(r, s)])))
  }
};

/* ----- 2. SQL query ----- */

const queryRun = (filter: boolean, ending: "none" | "order" | "both" | "limit"): TryResult => {
  const parts = ["SELECT * FROM orders"];
  if (filter) parts.push("WHERE status = ?");
  if (ending === "order" || ending === "both") parts.push("ORDER BY id");
  if (ending === "both") parts.push("LIMIT 5");
  const full = parts.join(" ");
  if (ending === "limit") {
    return {
      output: "Rejected: LIMIT without ORDER BY",
      note: "build() raises: LIMIT without ORDER BY gives random rows",
      actions: [{ call: ["client", "builder"], label: "limit(5).build()", scalaLabel: "withLimit(5).build()", result: "rejected" }, { flash: "builder" }]
    };
  }
  const output = full.length <= 40 ? full : "… " + full.slice(full.indexOf("WHERE"));
  return {
    output,
    note: `Full SQL: ${full}${filter ? ' with params ["PENDING"]' : ""}`,
    actions: [{ call: ["client", "builder", "product"], label: "build()", result: output.length > 30 ? "… " + parts[parts.length - 1] : output }]
  };
};

const query: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Demo code chains QueryBuilder steps; build() assembles the clauses and creates an immutable Query with SQL and params.",
    client: "Demo code",
    builder: { name: "QueryBuilder", members: ["+ select(*cols)", "+ where(cond, value)", "+ order_by(col), limit(n)", "+ build(): Query"],
      scala: ["+ select(cols*)", "+ where(cond, value)", "+ withOrderBy, withLimit", "+ build(): Query"] },
    product: { name: "Query", members: ["sql: str", "params: tuple"], scala: ["sql: String", "params: List[Any]"] }
  }),
  walk: [
    [...build(false), { call: ["client", "builder"], label: 'select("name", "price")' }, { tag: "builder", text: "SELECT name, price" }],
    [
      { call: ["client", "builder"], label: 'where("category =", "shoes")' },
      { call: ["client", "builder"], label: 'where("price <=", 2500)' },
      { tag: "builder", text: "2 × ?, params: shoes, 2500" }
    ],
    [
      { call: ["client", "builder"], label: 'order_by("price").limit(10)', scalaLabel: 'withOrderBy("price").withLimit(10)' },
      { mark: "builder", member: 3 },
      { call: ["client", "builder", "product"], label: "build()", result: "… ORDER BY price LIMIT 10" },
      { tag: "product", text: "params: [shoes, 2500]" }
    ],
    [
      { mark: "builder", member: null },
      { tag: "builder", text: "orders, 1 condition" },
      { call: ["client", "builder", "product"], label: 'where("status =", …).build()', result: "SELECT * FROM orders WHERE status = ?" },
      { tag: "product", text: "params: [PENDING]" }
    ],
    [
      { tag: "product", text: null },
      { tag: "builder", text: "LIMIT 5, no ORDER BY" },
      { call: ["client", "builder"], label: "limit(5).build()", scalaLabel: "withLimit(5).build()", result: "LIMIT without ORDER BY…" },
      { flash: "builder" }
    ]
  ],
  tryIt: {
    prompt: "Build a query on the orders table. Pick a filter and how it ends.",
    groups: [
      { label: "Filter", options: [{ id: "none", label: "No filter" }, { id: "status", label: 'where("status =", …)' }] },
      { label: "Ending", options: [{ id: "none", label: "Nothing" }, { id: "order", label: 'order_by("id")' }, { id: "both", label: "order_by + limit(5)" }, { id: "limit", label: "limit(5) only" }] }
    ],
    results: Object.fromEntries((["none", "status"] as const).flatMap((f) =>
      (["none", "order", "both", "limit"] as const).map((e) => [`${f}|${e}`, queryRun(f === "status", e)])))
  }
};

/* ----- 3. immutable trip builder (custom diagram: two builder values) ----- */

const tripDiagram: DiagramSpec = {
  label: "Demo code holds a draft TripBuilder; returning() makes a new TripBuilder instead of changing the draft; each build() creates a Trip.",
  width: 760,
  height: 300,
  portraitWidth: 340,
  portraitHeight: 470,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 16, y: 30, w: 140, h: 54 }, portrait: { x: 8, y: 8, w: 150, h: 48 } },
    { id: "draft", kind: "concrete", name: "draft: TripBuilder", key: true, hidden: true,
      members: ["+ route(a, b), on(day)", "+ for_people(n)", "+ returning(day)", "+ build(): Trip"],
      scalaMembers: ["+ route(a, b), on(day)", "+ forPeople(n)", "+ returning(day)", "+ build(): Trip"],
      at: { x: 230, y: 20, w: 230 }, portrait: { x: 8, y: 80, w: 220 } },
    { id: "branch", kind: "concrete", name: "copy: TripBuilder", key: true, hidden: true,
      members: ["return_on = 27 Dec"],
      at: { x: 230, y: 210, w: 230 }, portrait: { x: 8, y: 260, w: 220 } },
    { id: "trip", kind: "concrete", name: "Trip", key: true, hidden: true,
      members: ["origin, destination", "depart, return_on", "travellers"],
      at: { x: 556, y: 20, w: 190 }, portrait: { x: 8, y: 364, w: 220 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "draft", type: "association", hidden: true },
    { id: "copies", from: "draft", to: "branch", type: "dependency", label: "returning()", hidden: true },
    { id: "creates", from: "draft", to: "trip", type: "dependency", label: "build()", hidden: true, viaPortrait: [[262, 410], [262, 140]] },
    { id: "creates2", from: "branch", to: "trip", type: "dependency", hidden: true, via: [[651, 247]], viaPortrait: [[244, 396], [244, 290]] }
  ]
};

const tripRun = (ret: "none" | "dec27" | "dec1", people: 2 | 4): TryResult => {
  if (ret === "dec1") {
    return {
      output: "return date is before departure",
      note: "build() raises ValueError: 1 Dec comes before 20 Dec.",
      actions: [{ call: ["client", "draft", "branch"], label: "returning(1 Dec).build()", result: "rejected" }, { flash: "branch" }]
    };
  }
  const out = `Delhi -> Goa, back: ${ret === "none" ? "one way" : "2026-12-27"}, ${people} people`;
  return {
    output: out,
    note: ret === "none" ? "build() on the draft: no return date." : "returning() made a new builder; the draft still has no return date.",
    actions: ret === "none"
      ? [{ ring: "draft" }, { call: ["client", "draft", "trip"], label: `for_people(${people}).build()`, scalaLabel: `forPeople(${people}).build()`, result: out }]
      : [{ ring: "branch" }, { call: ["client", "draft", "branch", "trip"], label: "returning(27 Dec).build()", result: out }]
  };
};

const trip: ExampleAnimation = {
  diagram: tripDiagram,
  walk: [
    [
      { show: ["client"] }, { show: ["draft"] }, { show: ["uses"] }, { show: ["trip"] }, { show: ["creates"] },
      { call: ["client", "draft"], label: 'route("Delhi", "Goa").on(20 Dec)' },
      { call: ["client", "draft"], label: "for_people(2)", scalaLabel: "forPeople(2)" },
      { tag: "draft", text: "Delhi→Goa, 20 Dec, 2" }
    ],
    [{ call: ["client", "draft", "trip"], label: "build()", result: "back: one way" }, { tag: "trip", text: "one way" }],
    [
      { call: ["client", "draft"], label: "returning(27 Dec)" },
      { spawn: ["branch"], from: "draft" },
      { show: ["copies", "creates2"] },
      { call: ["client", "branch", "trip"], label: "build()", result: "back: 2026-12-27" },
      { tag: "trip", text: "round trip" }
    ],
    [{ ring: "draft" }, { tag: "draft", text: "return_on: None" }, { pulse: "draft" }],
    [
      { ring: null },
      { call: ["client", "draft"], label: "returning(1 Dec).build()", result: "return date is before departure" },
      { flash: "draft" }
    ]
  ],
  tryIt: {
    prompt: "Start from the shared draft (Delhi → Goa, 20 Dec). Pick a return date and the number of travellers.",
    groups: [
      { label: "Return", options: [{ id: "none", label: "No return" }, { id: "dec27", label: "27 Dec" }, { id: "dec1", label: "1 Dec" }] },
      { label: "Travellers", options: [{ id: "2", label: "2 people" }, { id: "4", label: "4 people" }] }
    ],
    results: Object.fromEntries((["none", "dec27", "dec1"] as const).flatMap((r) =>
      ([2, 4] as const).map((n) => [`${r}|${n}`, tripRun(r, n)])))
  }
};

/* ----- 4. prescription ----- */

const rxRun = (signed: boolean, high: boolean): TryResult => {
  const errors = [...(signed ? [] : ["doctor registration number missing"]), ...(high ? ["paracetamol: 6000 mg/day is over 4000"] : [])];
  const output = errors.length === 0 ? "paracetamol 500mg x3, cetirizine 10mg x1"
    : errors.length === 1 ? errors[0] : "Rejected with 2 problems";
  return {
    output,
    note: errors.length === 0 ? "No rules broken: build() returns an immutable Prescription." : `build() collects: ${errors.join("; ")}`,
    actions: errors.length === 0
      ? [{ call: ["client", "builder", "product"], label: "build()", result: "Prescription ✓" }]
      : [{ call: ["client", "builder"], label: "build()", result: `${errors.length} problem${errors.length > 1 ? "s" : ""}` }, { flash: "builder" }]
  };
};

const prescription: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Demo code adds medicines to a PrescriptionBuilder; build() checks every rule and creates an immutable Prescription.",
    client: "Demo code",
    builder: { name: "PrescriptionBuilder", members: ["+ signed_by(reg_no)", "+ add(name, mg, times)", "+ build(): Prescription"],
      scala: ["+ signedBy(regNo)", "+ add(name, mg, times)", "+ build(): Prescription"] },
    product: { name: "Prescription", members: ["patient", "doctor_reg_no", "medicines: tuple"], scala: ["patient", "doctorRegNo", "medicines: List"] }
  }),
  walk: [
    [
      ...build(false),
      { call: ["client", "builder"], label: 'signed_by("KMC-20431")', scalaLabel: 'signedBy("KMC-20431")' },
      { call: ["client", "builder"], label: 'add("paracetamol", 500, 3)' },
      { call: ["client", "builder"], label: 'add("cetirizine", 10, 1)' },
      { tag: "builder", text: "signed, 2 medicines" }
    ],
    [
      { mark: "builder", member: 2 },
      { call: ["client", "builder", "product"], label: "build()", result: "R. Iyer (KMC-20431): …" },
      { tag: "product", text: "1500 mg/day ✓" }
    ],
    [
      { mark: "builder", member: null },
      { tag: "product", text: null },
      { call: ["client", "builder"], label: 'add("paracetamol", 1000, 6)' },
      { call: ["client", "builder"], label: 'add("ibuprofen", 800, 4)' },
      { tag: "builder", text: "no doctor, 2 high doses" }
    ],
    [
      { mark: "builder", member: 2 },
      { call: ["client", "builder"], label: "build()" },
      { tag: "builder", text: "errors: 3" },
      { flash: "builder" }
    ],
    [
      { mark: "builder", member: null },
      { call: ["client", "builder"], label: "build()", result: "doctor…; paracetamol…; ibuprofen…" },
      { pulse: "client" }
    ]
  ],
  tryIt: {
    prompt: "Change the first prescription. Does build() accept it?",
    groups: [
      { label: "Doctor", options: [{ id: "signed", label: "signed_by(…)" }, { id: "unsigned", label: "Not signed" }] },
      { label: "Paracetamol", options: [{ id: "low", label: "500 mg × 3" }, { id: "high", label: "1000 mg × 6" }] }
    ],
    results: {
      "signed|low": rxRun(true, false), "signed|high": rxRun(true, true),
      "unsigned|low": rxRun(false, false), "unsigned|high": rxRun(false, true)
    }
  }
};

const animation: PatternAnimation = {
  slug: "builder",
  story: storyAnim,
  examples: { pizza, query, trip, prescription },
  sequence: {
    label: "The demo creates an HttpRequestBuilder, chains method, json_body and timeout, then build validates and creates the HttpRequest.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "builder", name: ": HttpRequestBuilder", kind: "concrete" },
      { id: "request", name: ": HttpRequest", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "builder", label: "HttpRequestBuilder(url)", kind: "create" },
      { from: "demo", to: "builder", label: 'method("post")' },
      { from: "demo", to: "builder", label: "json_body('{\"id\": 7}')" },
      { from: "demo", to: "builder", label: "timeout(5)" },
      { from: "demo", to: "builder", label: "build()" },
      { from: "builder", to: "builder", label: "check rules", kind: "self" },
      { from: "builder", to: "request", label: "HttpRequest(…)", kind: "create" },
      { from: "builder", to: "demo", label: "request", kind: "return" }
    ]
  }
};

export default animation;
