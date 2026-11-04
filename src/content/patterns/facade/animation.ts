import type { Action, DiagramSpec, DNode, DEdge, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: four services, then one OrderFacade in front of them ---------- */

const SVC_X = 636, SVC_W = 250, TRUNK = 590;
const P_SVC_X = 60, P_SVC_W = 272, P_TRUNK = 34;
/** Service boxes are 62 px high (one member line); Inventory is 74 so its stock tag sits clear of the text. */
const svcY = [14, 124, 222, 320];
const pSvcY = [344, 434, 510, 586];
const cy = (y: number) => y + 31;

const story: DiagramSpec = {
  label: "A Controller calls OrderFacade.place_order; OrderFacade uses Inventory, PaymentService, ShippingService and Notifier; an Admin can still use Inventory directly.",
  width: 900,
  height: 420,
  portraitWidth: 340,
  portraitHeight: 660,
  nodes: [
    { id: "ctrl", kind: "client", name: "Controller",
      members: ["Inventory().reserve(sku, 1)", "PaymentService().charge(…)", "ShippingService().schedule(…)", "Notifier().send(…)"],
      at: { x: 16, y: 150, w: 236 }, portrait: { x: 8, y: 40, w: 324 } },
    { id: "facade", kind: "concrete", name: "OrderFacade", key: true, hidden: true,
      members: ["- inventory, payments", "- shipping, notifier", "+ place_order(user, sku, …)"],
      scalaMembers: ["- inventory, payments", "- shipping, notifier", "+ placeOrder(user, sku, …)"],
      at: { x: 310, y: 166, w: 220 }, portrait: { x: 8, y: 214, w: 210 } },
    { id: "admin", kind: "client", name: "Admin", hidden: true,
      at: { x: 340, y: 24, w: 150, h: 54 }, portrait: { x: 230, y: 238, w: 102, h: 54 } },
    { id: "inv", kind: "concrete", name: "Inventory", members: ["+ reserve(sku, qty): bool"], scalaMembers: ["+ reserve(sku, qty): Boolean"],
      at: { x: SVC_X, y: svcY[0], w: SVC_W, h: 74 }, portrait: { x: P_SVC_X, y: pSvcY[0], w: P_SVC_W, h: 74 } },
    { id: "pay", kind: "concrete", name: "PaymentService", members: ["+ charge(user, amount): str"], scalaMembers: ["+ charge(user, amount): String"],
      at: { x: SVC_X, y: svcY[1], w: SVC_W }, portrait: { x: P_SVC_X, y: pSvcY[1], w: P_SVC_W } },
    { id: "ship", kind: "concrete", name: "ShippingService", members: ["+ schedule(user, sku): str"], scalaMembers: ["+ schedule(user, sku): String"],
      at: { x: SVC_X, y: svcY[2], w: SVC_W }, portrait: { x: P_SVC_X, y: pSvcY[2], w: P_SVC_W } },
    { id: "note", kind: "concrete", name: "Notifier", members: ["+ send(user, text)"],
      at: { x: SVC_X, y: svcY[3], w: SVC_W }, portrait: { x: P_SVC_X, y: pSvcY[3], w: P_SVC_W } }
  ],
  edges: [
    { id: "uses", from: "ctrl", to: "facade", type: "association", label: "uses", hidden: true },
    { id: "f-inv", from: "facade", to: "inv", type: "association", hidden: true,
      via: [[TRUNK, 70], [TRUNK, 217]], viaPortrait: [[P_TRUNK, pSvcY[0] + 37], [P_TRUNK, 330]] },
    { id: "f-pay", from: "facade", to: "pay", type: "association", hidden: true,
      via: [[TRUNK, cy(svcY[1])], [TRUNK, 217]], viaPortrait: [[P_TRUNK, cy(pSvcY[1])], [P_TRUNK, 330]] },
    { id: "f-ship", from: "facade", to: "ship", type: "association", hidden: true,
      via: [[TRUNK, cy(svcY[2])], [TRUNK, 217]], viaPortrait: [[P_TRUNK, cy(pSvcY[2])], [P_TRUNK, 330]] },
    { id: "f-note", from: "facade", to: "note", type: "association", hidden: true,
      via: [[TRUNK, cy(svcY[3])], [TRUNK, 217]], viaPortrait: [[P_TRUNK, cy(pSvcY[3])], [P_TRUNK, 330]] },
    { id: "direct", from: "admin", to: "inv", type: "dependency", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Copied into every controller", tone: "warn", near: "ctrl" },
    { id: "ok", text: "1 call, 1 dependency", tone: "ok", near: "facade", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every controller runs the whole flow",
      what: "The checkout controller calls Inventory, PaymentService, ShippingService and Notifier itself, in the right order. The reorder controller has a copy of the same four calls.",
      why: "Each caller depends on four classes and on the order of their calls. Change the flow and you must find and fix every copy.",
      say: {
        what: "Here's the problem. The checkout controller calls the inventory, the payment service, the shipping service and the notifier itself, in the right order. The reorder controller has a copy of the same four calls.",
        why: "Each caller depends on four classes, and on the order of their calls. Change the flow, and you have to find and fix every copy."
      },
      code: "problem",
      lines: { python: [22, 23, 24, 25, 26, 29, 30, 31, 32, 33], scala: [14, 15, 16, 17, 18, 20, 21, 22, 23, 24] },
      actions: [
        { members: "ctrl", stagger: true, lines: ["Inventory().reserve(sku, 1)", "PaymentService().charge(…)", "ShippingService().schedule(…)", "Notifier().send(…)"] },
        { call: ["ctrl", "inv"], label: "reserve(sku, 1)" },
        { call: ["ctrl", "pay"], label: "charge(user, amount)" },
        { call: ["ctrl", "ship"], label: "schedule(user, sku)" },
        { call: ["ctrl", "note"], label: "send(user, text)" },
        { flash: "ctrl" },
        { shake: "ctrl", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Put one class in front of the services",
      what: "OrderFacade appears between the controller and the services. It is given the four services in its constructor and keeps a reference to each.",
      why: "The services do not change at all, and they do not know the facade exists. The facade only adds a simpler door.",
      say: {
        what: "Now one new class, the order facade, steps in between the controller and the services. It is handed the four services when it is built, and keeps a reference to each one.",
        why: "The services don't change at all, and they don't even know the facade exists. The facade only adds a simpler door."
      },
      code: "main",
      lines: { python: [27, 28, 30, 31, 32, 33, 34, 35], scala: [20, 21, 22] },
      actions: [
        { hide: ["warn"] },
        { spawn: ["facade"], from: "ctrl" },
        { show: ["f-inv", "f-pay", "f-ship", "f-note"] }
      ]
    },
    {
      title: "One method holds the whole flow",
      what: "place_order() runs reserve, charge, schedule and send in the right order. The controller now makes just that one call.",
      why: "The controller has one job again (Single Responsibility), and it sees one small method instead of four classes (Interface Segregation).",
      say: {
        what: "The place order method runs reserve, charge, schedule and send, in the right order. The controller now makes just that one call.",
        why: "The controller has one job again. That's single responsibility. And it sees one small method instead of four classes."
      },
      code: "main",
      lines: { python: [37, 38, 40, 41, 42, 43], scala: [23, 24, 26, 27, 28, 29] },
      actions: [
        { mark: "facade", member: 2 },
        { members: "ctrl", lines: ["shop.place_order(user, sku, …)"], scalaLines: ["shop.placeOrder(user, sku, …)"] },
        { show: ["uses"] }
      ]
    },
    {
      title: "Asha orders a book: stock and payment",
      what: "place_order(\"asha\", \"BOOK-1\", 1, 399) reaches the facade. It reserves one book (stock 5 becomes 4), then charges ₹399.",
      why: "The controller never talks to Inventory or PaymentService. The facade decides who is called and when.",
      say: {
        what: "Asha orders one book for 399 rupees. The facade first reserves one copy, so the stock goes from five to four. Then it charges her.",
        why: "The controller never talks to the inventory or the payment service. The facade decides who is called, and when."
      },
      code: "main",
      lines: { python: [38, 40, 47, 48], scala: [24, 26, 33, 34] },
      actions: [
        { mark: "facade", member: null },
        { call: ["ctrl", "facade"], label: "place_order(asha, BOOK-1, 1, 399)", scalaLabel: "placeOrder(asha, BOOK-1, 1, 399)" },
        { ring: "facade", caption: "coordinates" },
        { call: ["facade", "inv"], label: "reserve(BOOK-1, 1)", result: "True", scalaLabel: "reserve(BOOK-1, 1)" },
        { tag: "inv", text: "BOOK-1 stock: 4" },
        { call: ["facade", "pay"], label: "charge(asha, 399)", result: '"PAY-asha-399"' }
      ]
    },
    {
      title: "Shipping, notice, and one answer back",
      what: "The facade schedules shipping, sends Asha a message, and returns one summary string to the controller.",
      why: "Four results become one. The order of the steps now lives in a single place.",
      say: {
        what: "Next, the facade schedules the shipping, sends Asha a message, and hands one summary back to the controller.",
        why: "Four results become one answer, and the order of the steps lives in a single place."
      },
      code: "main",
      lines: { python: [41, 42, 43, 48], scala: [27, 28, 29, 34] },
      actions: [
        { call: ["facade", "ship"], label: "schedule(asha, BOOK-1)", result: '"TRK-BOOK-1-asha"' },
        { call: ["facade", "note"], label: 'send(asha, "Order confirmed…")' },
        { call: ["facade", "ctrl"], label: '"OK payment=PAY-asha-399 …"' }
      ]
    },
    {
      title: "When a step fails, the facade stops the flow",
      what: "Ravi wants 2 pens, but PEN-7 has no stock. reserve() returns False, so the facade returns \"Out of stock\" and never charges him.",
      why: "The rule \"no stock, no charge\" is written once, inside the facade. No controller can forget it.",
      say: {
        what: "Ravi wants two pens, but there are none in stock. Reserve says no, so the facade returns out of stock, and never charges him.",
        why: "The rule, no stock means no charge, is written once, inside the facade. No controller can forget it."
      },
      code: "main",
      lines: { python: [38, 39, 49], scala: [24, 35] },
      actions: [
        { call: ["ctrl", "facade"], label: "place_order(ravi, PEN-7, 2, 98)", scalaLabel: "placeOrder(ravi, PEN-7, 2, 98)" },
        { call: ["facade", "inv"], label: "reserve(PEN-7, 2)", result: "False" },
        { flash: "inv" },
        { dim: ["pay", "ship", "note"], together: true },
        { call: ["facade", "ctrl"], label: '"Out of stock"' },
        { show: ["pay", "ship", "note"] }
      ]
    },
    {
      title: "The subsystem is still open for power users",
      what: "An admin screen calls inventory.reserve(\"BOOK-1\", 2) directly, without the facade. Stock goes from 4 to 2.",
      why: "A facade adds a simple door; it does not lock the other doors. Code that needs fine control can still use the services.",
      say: {
        what: "An admin screen still calls the inventory directly, without the facade, and reserves two more books.",
        why: "A facade adds a simple door. It doesn't lock the other doors. Code that needs fine control can still use the services."
      },
      code: "main",
      lines: { python: [50, 51], scala: [36, 37] },
      actions: [
        { ring: null },
        { show: ["admin"] },
        { show: ["direct"] },
        { ring: "admin", caption: "no facade" },
        { call: ["admin", "inv"], label: "reserve(BOOK-1, 2)", result: "True" },
        { tag: "inv", text: "BOOK-1 stock: 2" }
      ]
    },
    {
      title: "Payoff: one call, one place to change",
      what: "Every controller now depends on OrderFacade alone. If the flow gains a step, such as a fraud check, only place_order() changes.",
      why: "Callers are loosely coupled to the subsystem, and the services can be refactored behind a stable surface.",
      say: {
        what: "Every controller now depends on the order facade alone. If the flow gains a new step, like a fraud check, only the place order method changes.",
        why: "Callers are loosely coupled to the subsystem, and the services can be refactored behind a stable surface."
      },
      code: "main",
      lines: { python: [37, 38, 40, 41, 42, 43], scala: [23, 24, 26, 27, 28, 29] },
      actions: [
        { ring: null },
        { show: ["ok"] },
        { pulse: "facade", together: true },
        { pulse: "ctrl" }
      ]
    }
  ]
};

/* ---------- real-world examples: client -> facade -> a column of subsystem classes ---------- */

interface Sub { id: string; name: string; members: string[]; scala?: string[] }
interface MiniCfg {
  label: string;
  client: string;
  facade: { name: string; members: string[]; scala?: string[] };
  subs: Sub[];
  /** Composition when the facade creates its own parts. */
  owns?: boolean;
}

/** Landscape: client, facade, then the subsystem in a column with a shared trunk line. Portrait: stacked, trunk on the left. */
function miniDiagram(c: MiniCfg): DiagramSpec {
  const hOf = (n: number) => 32 + 20 * n + 10;
  const fh = hOf(c.facade.members.length);
  let y = 16;
  const ys = c.subs.map((s) => { const at = y; y += hOf(s.members.length) + 14; return at; });
  const last = y - 14;
  const fy = Math.round((16 + last) / 2 - fh / 2);
  const fcy = fy + fh / 2;
  // portrait
  const pfy = 92, pfb = pfy + fh;
  let py = pfb + 34;
  const pys = c.subs.map((s) => { const at = py; py += hOf(s.members.length) + 12; return at; });
  const plast = py - 12;

  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true,
      at: { x: 16, y: Math.round(fcy - 27), w: 130, h: 54 }, portrait: { x: 8, y: 12, w: 160, h: 54 } },
    { id: "facade", kind: "concrete", name: c.facade.name, key: true, hidden: true, members: c.facade.members, scalaMembers: c.facade.scala,
      at: { x: 170, y: fy, w: 240 }, portrait: { x: 8, y: pfy, w: 324 } },
    ...c.subs.map((s, i): DNode => ({
      id: s.id, kind: "concrete", name: s.name, hidden: true, members: s.members, scalaMembers: s.scala,
      at: { x: 470, y: ys[i], w: 274 }, portrait: { x: 52, y: pys[i], w: 280 }
    }))
  ];
  const edges: DEdge[] = [
    { id: "uses", from: "client", to: "facade", type: "association", hidden: true },
    ...c.subs.map((s, i): DEdge => {
      const scy = ys[i] + hOf(s.members.length) / 2;
      const pcy = pys[i] + hOf(s.members.length) / 2;
      return c.owns
        ? { id: "e-" + s.id, from: "facade", to: s.id, type: "composition", hidden: true,
            via: [[440, fcy], [440, scy]], viaPortrait: [[28, pfb + 12], [28, pcy]] }
        : { id: "e-" + s.id, from: "facade", to: s.id, type: "association", hidden: true,
            via: [[440, scy], [440, fcy]], viaPortrait: [[28, pcy], [28, pfb + 12]] };
    })
  ];
  return {
    label: c.label, width: 760, height: last + 32, portraitWidth: 340, portraitHeight: plast + 32,
    nodes, edges
  };
}

const buildMini = (subs: string[]): Action[] => [
  { show: ["client", "facade"] },
  { show: ["uses"] },
  { show: subs },
  { show: subs.map((s) => "e-" + s) }
];

/* --- 1. movie mode --- */

const MOVIE_SUBS = ["lights", "ac", "projector", "sound"];
const movieDevices: Record<string, { name: string; watch: [string, string, string?]; end?: [string, string, string?] }> = {
  lights: { name: "Lights", watch: ["dim(10)", "lights at 10%"], end: ["dim(80)", "lights at 80%"] },
  ac: { name: "AirConditioner", watch: ["set_temp(24)", "AC at 24°C", "setTemp(24)"] },
  projector: { name: "Projector", watch: ["on()", "projector on"], end: ["off()", "projector off"] },
  sound: { name: "SoundBar", watch: ["surround(30)", "sound bar surround, volume 30"], end: ["mute()", "sound bar muted"] }
};

function movieTry(button: "watch" | "end", dev: string): TryResult {
  const d = movieDevices[dev];
  const start: Action = button === "watch"
    ? { call: ["client", "facade"], label: 'watch_movie("Sholay")', scalaLabel: 'watchMovie("Sholay")' }
    : { call: ["client", "facade"], label: "end_movie()", scalaLabel: "endMovie()" };
  const step = button === "watch" ? d.watch : d.end;
  const clear: Action[] = MOVIE_SUBS.map((s) => ({ tag: s, text: null }));
  if (!step) {
    return {
      output: "AC not called",
      note: "end_movie() only calls the sound bar, the projector and the lights, in that order. The AC keeps its setting.",
      actions: [...clear, { ring: dev }, start, { tag: dev, text: "not called" }]
    };
  }
  const order = button === "watch" ? "lights, AC, projector, sound bar" : "sound bar, projector, lights";
  return {
    output: `"${step[1]}"`,
    note: `${button === "watch" ? "watch_movie" : "end_movie"}() calls the devices in this order: ${order}. This is what ${d.name} returns.`,
    actions: [...clear, { ring: dev }, start, { call: ["facade", dev], label: step[0], scalaLabel: step[2], result: `"${step[1]}"` }]
  };
}

const movie: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The app calls HomeTheaterFacade, which uses Lights, AirConditioner, Projector and SoundBar.",
    client: "App",
    facade: { name: "HomeTheaterFacade", members: ["+ watch_movie(title)", "+ end_movie()"], scala: ["+ watchMovie(title)", "+ endMovie()"] },
    subs: [
      { id: "lights", name: "Lights", members: ["+ dim(level)"] },
      { id: "ac", name: "AirConditioner", members: ["+ set_temp(celsius)"], scala: ["+ setTemp(celsius)"] },
      { id: "projector", name: "Projector", members: ["+ on()", "+ off()"] },
      { id: "sound", name: "SoundBar", members: ["+ surround(volume)", "+ mute()"] }
    ]
  }),
  walk: [
    buildMini(MOVIE_SUBS),
    [
      { call: ["client", "facade"], label: 'watch_movie("Sholay")', scalaLabel: 'watchMovie("Sholay")' },
      { ring: "facade" },
      { call: ["facade", "lights"], label: "dim(10)", result: '"lights at 10%"' },
      { call: ["facade", "ac"], label: "set_temp(24)", scalaLabel: "setTemp(24)", result: '"AC at 24°C"' }
    ],
    [
      { call: ["facade", "projector"], label: "on()", result: '"projector on"' },
      { call: ["facade", "sound"], label: "surround(30)", result: '"sound bar surround, volume 30"' },
      { call: ["facade", "client"], label: '[…, "playing Sholay"]' }
    ],
    [
      { call: ["client", "facade"], label: "end_movie()", scalaLabel: "endMovie()" },
      { call: ["facade", "sound"], label: "mute()", result: '"sound bar muted"' },
      { call: ["facade", "projector"], label: "off()", result: '"projector off"' },
      { call: ["facade", "lights"], label: "dim(80)", result: '"lights at 80%"' }
    ]
  ],
  tryIt: {
    prompt: "Press a button, then pick a device to see what the facade asks it to do.",
    groups: [
      { label: "Button", options: [{ id: "watch", label: "Movie mode" }, { id: "end", label: "Movie over" }] },
      { label: "Device", options: [{ id: "lights", label: "Lights" }, { id: "ac", label: "AC" }, { id: "projector", label: "Projector" }, { id: "sound", label: "Sound bar" }] }
    ],
    results: Object.fromEntries((["watch", "end"] as const).flatMap((b) => MOVIE_SUBS.map((d) => [`${b}|${d}`, movieTry(b, d)])))
  }
};

/* --- 2. ticket booking (with compensation) --- */

const tickets: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The app calls BookingFacade, which uses SeatLock, PaymentGateway and TicketService.",
    client: "App",
    facade: { name: "BookingFacade", members: ["+ book(show, seats, upi, price)"], scala: ["+ book(show, wanted, upi, price)"] },
    subs: [
      { id: "seats", name: "SeatLock", members: ["+ lock(seats): bool", "+ release(seats)"], scala: ["+ lock(seats): Boolean", "+ release(seats)"] },
      { id: "pay", name: "PaymentGateway", members: ["+ pay(upi_id, amount): bool"], scala: ["+ pay(upiId, amount): Boolean"] },
      { id: "tickets", name: "TicketService", members: ["+ issue(show, seats): str"], scala: ["+ issue(show, seats): String"] }
    ]
  }),
  walk: [
    [
      ...buildMini(["seats", "pay", "tickets"]),
      { call: ["client", "facade"], label: "book([F7, F8], asha@upi)" },
      { call: ["facade", "seats"], label: "lock([F7, F8])", result: "True" },
      { tag: "seats", text: "locked: F7, F8" },
      { call: ["facade", "pay"], label: "pay(asha@upi, 500)", result: "True" },
      { call: ["facade", "tickets", ], label: "issue(show, [F7, F8])", result: '"TICKET Pushpa 2, 7 pm F7,F8"' }
    ],
    [
      { call: ["client", "facade", "seats"], label: "lock([F8, F9])", result: "False" },
      { flash: "seats" },
      { call: ["facade", "client"], label: '"Seats already taken"' }
    ],
    [
      { call: ["client", "facade", "seats"], label: "lock([G1])", result: "True" },
      { tag: "seats", text: "locked: F7, F8, G1" },
      { call: ["facade", "pay"], label: "pay(broke@upi, 250)", result: "False" },
      { flash: "pay" }
    ],
    [
      { ring: "seats", caption: "undo" },
      { call: ["facade", "seats"], label: "release([G1])" },
      { tag: "seats", text: "locked: F7, F8" },
      { call: ["facade", "client"], label: '"Payment failed, seats released"' },
      { ring: null }
    ]
  ],
  tryIt: {
    prompt: "Asha already holds F7 and F8. Pick the seats and the UPI ID for the next booking.",
    groups: [
      { label: "Seats", options: [{ id: "f9", label: "F9, F10" }, { id: "f8", label: "F8, F9" }] },
      { label: "UPI ID", options: [{ id: "ok", label: "ravi@upi" }, { id: "broke", label: "broke@upi" }] }
    ],
    results: {
      "f9|ok": {
        output: "TICKET Pushpa 2, 7 pm F9,F10",
        note: "Both seats are free, the payment of ₹500 works, so TicketService issues the ticket.",
        actions: [
          { ring: "tickets" },
          { call: ["client", "facade", "seats"], label: "lock([F9, F10])", result: "True" },
          { call: ["facade", "pay"], label: "pay(ravi@upi, 500)", result: "True" },
          { call: ["facade", "tickets"], label: "issue(show, [F9, F10])", result: '"TICKET … F9,F10"' },
          { call: ["facade", "client"], label: '"TICKET Pushpa 2, 7 pm F9,F10"' }
        ]
      },
      "f9|broke": {
        output: "Payment failed, seats released",
        note: "The seats lock, but broke@upi bounces, so the facade releases F9 and F10 again.",
        actions: [
          { ring: "seats" },
          { call: ["client", "facade", "seats"], label: "lock([F9, F10])", result: "True" },
          { call: ["facade", "pay"], label: "pay(broke@upi, 500)", result: "False" },
          { flash: "pay" },
          { call: ["facade", "seats"], label: "release([F9, F10])" },
          { call: ["facade", "client"], label: '"Payment failed, seats released"' }
        ]
      },
      "f8|ok": {
        output: "Seats already taken",
        note: "F8 is held by Asha, so lock() fails and the facade stops before any payment.",
        actions: [
          { ring: "seats" },
          { call: ["client", "facade", "seats"], label: "lock([F8, F9])", result: "False" },
          { flash: "seats" },
          { call: ["facade", "client"], label: '"Seats already taken"' }
        ]
      },
      "f8|broke": {
        output: "Seats already taken",
        note: "lock() fails first, so the bad UPI ID is never even tried.",
        actions: [
          { ring: "seats" },
          { call: ["client", "facade", "seats"], label: "lock([F8, F9])", result: "False" },
          { flash: "seats" },
          { call: ["facade", "client"], label: '"Seats already taken"' }
        ]
      }
    }
  }
};

/* --- 3. bank account opening (KYC) --- */

const PAN_SCORE: Record<string, number> = { f: 780, k: 640 };
const PAN_TEXT: Record<string, string> = { f: "ABCDE1234F", k: "ABCDE1234K", bad: "ABC123" };

function kycTry(pan: string, otp: string): TryResult {
  const start: Action = { call: ["client", "facade", "pan"], label: `verify(${PAN_TEXT[pan]})`, result: pan === "bad" ? "False" : "True", back: ["pan", "facade"] };
  if (pan === "bad") {
    return { output: "ok=False, invalid PAN", note: "A PAN needs 5 letters, 4 digits and 1 letter. The flow stops at step one.",
      actions: [{ ring: "pan" }, start, { flash: "pan" }, { call: ["facade", "client"], label: 'OnboardingResult(False, "invalid PAN")' }] };
  }
  const check: Action = { call: ["facade", "otp"], label: `check(…, ${otp === "good" ? "123456" : "000000"})`, result: otp === "good" ? "True" : "False" };
  if (otp === "wrong") {
    return { output: "ok=False, wrong OTP", note: "The sandbox OTP is 123456, so the check fails and no account is opened.",
      actions: [{ ring: "otp" }, start, check, { flash: "otp" }, { call: ["facade", "client"], label: 'OnboardingResult(False, "wrong OTP")' }] };
  }
  const score = PAN_SCORE[pan];
  const limit = score >= 750 ? "200,000" : "50,000";
  return {
    output: `account SB5001, card limit ₹${limit}`,
    note: `Score ${score} is ${score >= 750 ? "750 or more, so the limit is ₹200,000" : "below 750, so the limit is ₹50,000"}. A new facade starts at account SB5001.`,
    actions: [
      { ring: "core" }, start, check,
      { call: ["facade", "bureau"], label: `score(${PAN_TEXT[pan]})`, result: String(score) },
      { call: ["facade", "core"], label: `open_account(…, ${limit.replace(",", "")})`, scalaLabel: `openAccount(…, ${limit.replace(",", "")})`, result: '"SB5001"' },
      { call: ["facade", "client"], label: `OnboardingResult(True, "…₹${limit}")` }
    ]
  };
}

const kyc: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The mobile app calls AccountOpeningFacade, which owns PanVerifier, AadhaarOtp, CreditBureau and CoreBanking.",
    client: "Mobile app",
    owns: true,
    facade: { name: "AccountOpeningFacade", members: ["+ open(name, pan, aadhaar, otp)"] },
    subs: [
      { id: "pan", name: "PanVerifier", members: ["+ verify(pan): bool"], scala: ["+ verify(pan): Boolean"] },
      { id: "otp", name: "AadhaarOtp", members: ["+ check(aadhaar, otp): bool"], scala: ["+ check(aadhaar, otp): Boolean"] },
      { id: "bureau", name: "CreditBureau", members: ["+ score(pan): int"], scala: ["+ score(pan): Int"] },
      { id: "core", name: "CoreBanking", members: ["+ open_account(name, limit)"], scala: ["+ openAccount(name, limit)"] }
    ]
  }),
  walk: [
    [
      ...buildMini(["pan", "otp", "bureau", "core"]),
      { call: ["client", "facade"], label: 'open("Priya", "ABCDE1234F", …)' },
      { call: ["facade", "pan"], label: "verify(ABCDE1234F)", result: "True" },
      { call: ["facade", "otp"], label: "check(…, 123456)", result: "True" },
      { call: ["facade", "bureau"], label: "score(ABCDE1234F)", result: "780" },
      { call: ["facade", "core"], label: "open_account(Priya, 200000)", scalaLabel: "openAccount(Priya, 200000)", result: '"SB5001"' },
      { call: ["facade", "client"], label: '"account SB5001, card limit ₹200,000"' }
    ],
    [
      { call: ["client", "facade"], label: 'open("Karan", "ABCDE1234K", …)' },
      { call: ["facade", "bureau"], label: "score(ABCDE1234K)", result: "640" },
      { call: ["facade", "core"], label: "open_account(Karan, 50000)", scalaLabel: "openAccount(Karan, 50000)", result: '"SB5002"' },
      { call: ["facade", "client"], label: '"account SB5002, card limit ₹50,000"' }
    ],
    [
      { call: ["client", "facade", "pan"], label: "verify(ABC123)", result: "False", back: ["pan", "facade"] },
      { flash: "pan" },
      { call: ["facade", "client"], label: '"invalid PAN"' }
    ],
    [
      { call: ["client", "facade", "pan"], label: "verify(PQRSX5678F)", result: "True", back: ["pan", "facade"] },
      { call: ["facade", "otp"], label: "check(…, 000000)", result: "False" },
      { flash: "otp" },
      { call: ["facade", "client"], label: '"wrong OTP"' }
    ]
  ],
  tryIt: {
    prompt: "Fill in the form: pick a PAN and an OTP, then watch how far the facade gets.",
    groups: [
      { label: "PAN", options: [{ id: "f", label: "ABCDE1234F" }, { id: "k", label: "ABCDE1234K" }, { id: "bad", label: "ABC123" }] },
      { label: "OTP", options: [{ id: "good", label: "123456" }, { id: "wrong", label: "000000" }] }
    ],
    results: Object.fromEntries(["f", "k", "bad"].flatMap((p) => ["good", "wrong"].map((o) => [`${p}|${o}`, kycTry(p, o)])))
  }
};

/* --- 4. hospital admission (a facade on top of a facade) --- */

const hospitalDiagram: DiagramSpec = {
  label: "The front desk calls AdmissionFacade, which uses BedManager and BillingFacade; BillingFacade uses InsuranceDesk and InvoiceService.",
  width: 760,
  height: 320,
  portraitWidth: 340,
  portraitHeight: 410,
  nodes: [
    { id: "client", kind: "client", name: "Front desk", hidden: true, at: { x: 16, y: 34, w: 130, h: 54 }, portrait: { x: 8, y: 10, w: 160, h: 54 } },
    { id: "adm", kind: "concrete", name: "AdmissionFacade", key: true, hidden: true,
      members: ["- beds, billing", "+ admit(patient, ward, …)"],
      at: { x: 190, y: 20, w: 210 }, portrait: { x: 8, y: 96, w: 324 } },
    { id: "beds", kind: "concrete", name: "BedManager", hidden: true, members: ["+ allocate(ward)"],
      at: { x: 470, y: 20, w: 270 }, portrait: { x: 8, y: 220, w: 156 } },
    { id: "billing", kind: "concrete", name: "BillingFacade", key: true, hidden: true, members: ["+ take_deposit(…)"], scalaMembers: ["+ takeDeposit(…)"],
      at: { x: 190, y: 170, w: 210 }, portrait: { x: 176, y: 220, w: 156 } },
    { id: "ins", kind: "concrete", name: "InsuranceDesk", hidden: true, members: ["+ approved_cover(…)"], scalaMembers: ["+ approvedCover(…)"],
      at: { x: 470, y: 130, w: 270 }, portrait: { x: 8, y: 326, w: 156 } },
    { id: "inv", kind: "concrete", name: "InvoiceService", hidden: true, members: ["+ deposit(…)"],
      at: { x: 470, y: 226, w: 270 }, portrait: { x: 176, y: 326, w: 156 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "adm", type: "association", hidden: true },
    { id: "e-beds", from: "adm", to: "beds", type: "composition", hidden: true },
    { id: "e-billing", from: "adm", to: "billing", type: "composition", hidden: true },
    { id: "e-ins", from: "billing", to: "ins", type: "composition", hidden: true, via: [[435, 201], [435, 161]] },
    { id: "e-inv", from: "billing", to: "inv", type: "composition", hidden: true, via: [[435, 201], [435, 257]] }
  ]
};

const ADMIT = (who: string, ward: string): Action => ({ call: ["client", "adm"], label: `admit("${who}", "${ward}", …)` });

function hospitalTry(ward: string, policy: string): TryResult {
  if (ward === "icu") {
    return {
      output: "no icu bed free, added to waitlist",
      note: `Printed as "Mr. Rao: no icu bed free, added to waitlist". With no bed, billing is never called.`,
      actions: [{ ring: "beds" }, ADMIT("Mr. Rao", "icu"), { call: ["adm", "beds"], label: 'allocate("icu")', result: "None" }, { flash: "beds" },
        { call: ["adm", "client"], label: '"no icu bed free, …waitlist"' }]
    };
  }
  const cover = policy === "star" ? 100000 : 0;
  const dep = policy === "star" ? "40,000" : "140,000";
  return {
    output: `bed G-12, deposit ₹${dep}`,
    note: `Estimate ₹140,000 minus cover ₹${cover.toLocaleString("en-IN")} = deposit ₹${dep}. Full line: "Mr. Rao: bed G-12, deposit ₹${dep} from Mr. Rao".`,
    actions: [
      { ring: "billing" },
      ADMIT("Mr. Rao", "general"),
      { call: ["adm", "beds"], label: 'allocate("general")', result: '"G-12"' },
      { call: ["adm", "billing", "ins"], label: `approved_cover("${policy === "star" ? "STAR-778" : "NONE"}", 140000)`, scalaLabel: `approvedCover("${policy === "star" ? "STAR-778" : "NONE"}", 140000)`, result: String(cover), back: ["ins", "billing"] },
      { call: ["billing", "inv"], label: `deposit("Mr. Rao", ${140000 - cover})`, result: `"deposit ₹${dep} from Mr. Rao"`, back: ["inv", "billing", "adm"] }
    ]
  };
}

const hospital: ExampleAnimation = {
  diagram: hospitalDiagram,
  walk: [
    [
      { show: ["client", "adm"] },
      { show: ["uses"] },
      { show: ["beds", "billing"] },
      { show: ["e-beds", "e-billing"] },
      { show: ["ins", "inv"] },
      { show: ["e-ins", "e-inv"] },
      ADMIT("Mr. Rao", "general"),
      { call: ["adm", "beds"], label: 'allocate("general")', result: '"G-12"' }
    ],
    [
      { call: ["adm", "billing"], label: 'take_deposit("Mr. Rao", "STAR-778", 140000)', scalaLabel: 'takeDeposit("Mr. Rao", "STAR-778", 140000)' },
      { ring: "billing" },
      { pulse: "billing" },
      { call: ["billing", "ins"], label: 'approved_cover("STAR-778", 140000)', scalaLabel: 'approvedCover("STAR-778", 140000)', result: "100000" }
    ],
    [
      { call: ["billing", "inv"], label: 'deposit("Mr. Rao", 40000)', result: '"deposit ₹40,000 from Mr. Rao"', back: ["inv", "billing", "adm"] },
      { ring: null }
    ],
    [
      ADMIT("Ms. Das", "icu"),
      { call: ["adm", "beds"], label: 'allocate("icu")', result: "None" },
      { flash: "beds" },
      { call: ["adm", "client"], label: '"no icu bed free, …waitlist"' }
    ],
    [
      ADMIT("Mr. Sen", "general"),
      { call: ["adm", "beds"], label: 'allocate("general")', result: '"G-14"' },
      { call: ["adm", "billing", "ins"], label: 'approved_cover("NONE", 60000)', scalaLabel: 'approvedCover("NONE", 60000)', result: "0", back: ["ins", "billing"] },
      { call: ["billing", "inv"], label: 'deposit("Mr. Sen", 60000)', result: '"deposit ₹60,000 from Mr. Sen"', back: ["inv", "billing", "adm"] }
    ]
  ],
  tryIt: {
    prompt: "Admit Mr. Rao (estimate ₹140,000). Pick the ward and his insurance policy.",
    groups: [
      { label: "Ward", options: [{ id: "general", label: "General" }, { id: "icu", label: "ICU" }] },
      { label: "Policy", options: [{ id: "star", label: "STAR-778" }, { id: "none", label: "None" }] }
    ],
    results: Object.fromEntries(["general", "icu"].flatMap((w) => ["star", "none"].map((p) => [`${w}|${p}`, hospitalTry(w, p)])))
  }
};

const animation: PatternAnimation = {
  slug: "facade",
  story: storyAnim,
  examples: { movie, tickets, kyc, hospital },
  sequence: {
    label: "The controller calls place_order on OrderFacade, which calls reserve, charge, schedule and send on the four services in order and returns one summary.",
    participants: [
      { id: "ctrl", name: "Controller", kind: "client" },
      { id: "shop", name: "shop: OrderFacade", kind: "concrete" },
      { id: "inv", name: ": Inventory", kind: "concrete" },
      { id: "pay", name: ": PaymentService", kind: "concrete" },
      { id: "ship", name: ": ShippingService", kind: "concrete" },
      { id: "note", name: ": Notifier", kind: "concrete" }
    ],
    messages: [
      { from: "ctrl", to: "shop", label: 'place_order("asha", "BOOK-1", 1, 399)' },
      { from: "shop", to: "inv", label: 'reserve("BOOK-1", 1)' },
      { from: "inv", to: "shop", label: "True", kind: "return" },
      { from: "shop", to: "pay", label: 'charge("asha", 399)' },
      { from: "pay", to: "shop", label: '"PAY-asha-399"', kind: "return" },
      { from: "shop", to: "ship", label: 'schedule("asha", "BOOK-1")' },
      { from: "ship", to: "shop", label: '"TRK-BOOK-1-asha"', kind: "return" },
      { from: "shop", to: "note", label: 'send("asha", "Order confirmed…")' },
      { from: "shop", to: "ctrl", label: '"OK payment=… tracking=…"', kind: "return" }
    ]
  }
};

export default animation;
