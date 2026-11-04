import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryIt } from "../../../anim/types";

/** Box height with 12 px extra at the bottom, so a value tag (drawn on the bottom border) never covers the last member. */
const TAG_H = (lines: number, stereo = false) => (stereo ? 44 : 32) + 20 * lines + 10 + 12;

/* ---------- story: a ticker that calls every consumer by name becomes a subject with a list of observers ---------- */

const UPDATE = ["+ update(s, price)"];

const story: DiagramSpec = {
  label: "Problem: StockTicker calls PriceDisplay and PriceAlert directly. Solution: StockTicker keeps a list of Observer; PriceDisplay, PriceAlert and later PushService implement it; App subscribes them.",
  width: 930,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 640,
  nodes: [
    { id: "ticker", kind: "concrete", name: "StockTicker", key: true,
      members: ["- display: PriceDisplay", "- alerts: PriceAlert", "+ set_price(symbol, price)"],
      scalaMembers: ["- display: PriceDisplay", "- alerts: PriceAlert", "+ setPrice(symbol, price)"],
      at: { x: 20, y: 60, w: 290, h: TAG_H(4) }, portrait: { x: 20, y: 100, w: 290, h: TAG_H(4) } },
    { id: "app", kind: "client", name: "App", hidden: true, at: { x: 20, y: 330, w: 110, h: 56 }, portrait: { x: 8, y: 10, w: 90, h: 50 } },
    { id: "iface", kind: "interface", name: "Observer", key: true, hidden: true, members: ["+ update(symbol, price)"],
      at: { x: 560, y: 70, w: 260 }, portrait: { x: 40, y: 290, w: 260 } },
    { id: "display", kind: "concrete", name: "PriceDisplay", members: ["+ show(s, price)"],
      at: { x: 360, y: 310, w: 170, h: TAG_H(1) }, portrait: { x: 8, y: 430, w: 156, h: TAG_H(1) } },
    { id: "alert", kind: "concrete", name: "PriceAlert", members: ["+ check(s, price)"],
      at: { x: 550, y: 310, w: 170, h: TAG_H(1) }, portrait: { x: 176, y: 430, w: 156, h: TAG_H(1) } },
    { id: "push", kind: "concrete", name: "PushService", hidden: true, members: UPDATE,
      at: { x: 740, y: 310, w: 170, h: TAG_H(1) }, portrait: { x: 92, y: 530, w: 156, h: TAG_H(1) } }
  ],
  edges: [
    // the problem: hard-wired calls to each consumer
    { id: "p-display", from: "ticker", to: "display", type: "association", label: "calls show()", hidden: true,
      via: [[420, 262], [250, 262]], viaPortrait: [[24, 300]] },
    { id: "p-alert", from: "ticker", to: "alert", type: "association", hidden: true,
      via: [[620, 230], [280, 230]], viaPortrait: [[316, 300]] },
    // the solution
    { id: "notifies", from: "ticker", to: "iface", type: "association", label: "notifies", toMult: "0..*", hidden: true, viaPortrait: [[60, 262]] },
    { id: "r-display", from: "display", to: "iface", type: "realization", hidden: true },
    { id: "r-alert", from: "alert", to: "iface", type: "realization", hidden: true },
    { id: "r-push", from: "push", to: "iface", type: "realization", hidden: true },
    { id: "uses", from: "app", to: "ticker", type: "association", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Edited for every new consumer", tone: "warn", near: "ticker" },
    { id: "ok", text: "StockTicker: 0 lines changed", tone: "ok", near: "ticker" }
  ]
};

const NOTIFY = (to: string, label: string, scalaLabel?: string): Action => ({ call: ["ticker", "iface", to], label, ...(scalaLabel ? { scalaLabel } : {}) });

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: the ticker calls everyone by name",
      what: "StockTicker holds a PriceDisplay and a PriceAlert and calls show() and check() itself on every price change.",
      why: "The ticker depends on every consumer. A mobile push service or an analytics recorder means editing the ticker again, which breaks Open/Closed.",
      say: {
        what: "Here's the problem. The stock ticker holds a price display and a price alert, and calls each of them by name on every price change.",
        why: "The ticker depends on every consumer. Adding a push service means editing the ticker again. That breaks the open-closed principle."
      },
      code: "problem",
      lines: { python: [15, 16, 20, 21, 22], scala: [13, 14, 18, 19, 20] },
      actions: [
        { show: ["p-display", "p-alert"] },
        { call: ["ticker", "display"], label: "show(INFY, 1875.50)" },
        { call: ["ticker", "alert"], label: "check(INFY, 1875.50)" },
        { mark: "ticker", member: 0 },
        { flash: "ticker" },
        { shake: "ticker", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give every consumer one interface",
      what: "PriceDisplay and PriceAlert both implement Observer, which has a single method: update(symbol, price).",
      why: "The ticker will only need to know this one interface, not any concrete class (Dependency Inversion).",
      say: {
        what: "Now every consumer gets one shared interface, called observer, with a single update method. The price display and the price alert both implement it.",
        why: "The ticker will only need to know this one interface, not any concrete class. That's dependency inversion."
      },
      code: "main",
      lines: { python: [4, 5, 6, 29, 30, 34, 39], scala: [3, 4, 21, 22, 24, 27] },
      actions: [
        { hide: ["warn", "p-display", "p-alert"] },
        { mark: "ticker", member: null, together: true },
        { members: "display", lines: UPDATE },
        { members: "alert", lines: UPDATE, together: true },
        { show: ["iface"] },
        { show: ["r-display", "r-alert"] }
      ]
    },
    {
      title: "The ticker keeps a list of observers",
      what: "StockTicker drops its named fields. It keeps a list of Observer objects, offers subscribe() and unsubscribe(), and loops over the list to notify.",
      why: "The subject knows only “someone who implements Observer”. Any number of them can listen (one-to-many).",
      say: {
        what: "The ticker drops its named fields. It keeps a list of observers, offers subscribe and unsubscribe, and loops over the list to notify them.",
        why: "The subject only knows: someone who implements observer. Any number of them can listen. That's one to many."
      },
      code: "main",
      lines: { python: [9, 11, 14, 15, 17, 18, 20, 21, 22, 24, 25, 26], scala: [6, 7, 10, 12, 14, 15, 16, 18, 19] },
      actions: [
        { members: "ticker", stagger: true,
          lines: ["- _observers: list[Observer]", "+ subscribe(o) · unsubscribe(o)", "+ set_price(symbol, price)", "- _notify_subscribers(...)"],
          scalaLines: ["- observers: ListBuffer[Observer]", "+ subscribe(o) · unsubscribe(o)", "+ setPrice(symbol, price)", "- notifySubscribers(...)"] },
        { show: ["notifies"] },
        { mark: "ticker", member: 0 }
      ]
    },
    {
      title: "Observers subscribe at runtime",
      what: "App creates the display and an alert for INFY at ₹1,900, and subscribes both to the ticker.",
      why: "Who listens is decided while the program runs, by the client, not written into the ticker.",
      say: {
        what: "The app creates the display, and an alert for Infosys at nineteen hundred rupees, and subscribes both to the ticker.",
        why: "Who listens is decided while the program runs, by the client. It is not written into the ticker."
      },
      code: "main",
      lines: { python: [44, 45, 46, 47, 48], scala: [32, 33, 34, 35, 36] },
      actions: [
        { mark: "ticker", member: null },
        { show: ["app"] },
        { show: ["uses"] },
        { call: ["app", "ticker"], label: "subscribe(display)" },
        { call: ["app", "ticker"], label: "subscribe(alert)" },
        { tag: "ticker", text: "observers: 2" },
        { mark: "ticker", member: 1, together: true }
      ]
    },
    {
      title: "One price change notifies everyone",
      what: "set_price(INFY, 1875.50) makes the ticker loop over its list and call update() on each observer through the interface.",
      why: "The ticker does not know what the observers will do. It only announces the change.",
      say: {
        what: "When the price of Infosys becomes eighteen seventy-five fifty, the ticker loops over its list, and calls update on each observer through the interface.",
        why: "The ticker does not know what the observers will do. It only announces the change."
      },
      code: "main",
      lines: { python: [22, 25, 26, 50], scala: [16, 19, 38] },
      actions: [
        { mark: "ticker", member: 3 },
        { call: ["app", "ticker"], label: 'set_price("INFY", 1875.50)', scalaLabel: 'setPrice("INFY", 1875.50)' },
        NOTIFY("display", "update(INFY, 1875.50)"),
        { ...NOTIFY("alert", "update(INFY, 1875.50)"), together: true },
        { tag: "display", text: "INFY: ₹1,875.50" },
        { tag: "alert", text: "below ₹1,900", together: true }
      ]
    },
    {
      title: "Each observer reacts in its own way",
      what: "At ₹1,912 the display prints the new price and the alert records that INFY crossed ₹1,900.",
      why: "Same notification, different reactions. Each observer owns its own logic (Single Responsibility).",
      say: {
        what: "At nineteen twelve, the display prints the new price, and the alert records that Infosys crossed nineteen hundred.",
        why: "Same notification, different reactions. Each observer owns its own logic."
      },
      code: "main",
      lines: { python: [31, 40, 41, 51], scala: [22, 28, 29, 39] },
      actions: [
        { call: ["app", "ticker"], label: 'set_price("INFY", 1912.00)', scalaLabel: 'setPrice("INFY", 1912.00)' },
        NOTIFY("display", "update(INFY, 1912.00)"),
        { ...NOTIFY("alert", "update(INFY, 1912.00)"), together: true },
        { tag: "display", text: "INFY: ₹1,912.00" },
        { pulse: "alert" },
        { tag: "alert", text: "triggered: 1", together: true }
      ]
    },
    {
      title: "Unsubscribe while the program runs",
      what: "App unsubscribes the display. At ₹1,930.25 only the alert hears the change and records a second crossing.",
      why: "Listeners come and go without the ticker changing. The loop works on a copy, so leaving mid-loop is safe.",
      say: {
        what: "Now the app unsubscribes the display. At nineteen thirty, only the alert hears the change, and records a second crossing.",
        why: "Listeners come and go without the ticker changing at all."
      },
      code: "main",
      lines: { python: [17, 18, 52, 53, 54], scala: [12, 40, 41, 42] },
      actions: [
        { mark: "ticker", member: 1 },
        { call: ["app", "ticker"], label: "unsubscribe(display)" },
        { dim: ["display", "r-display"] },
        { tag: "display", text: null, together: true },
        { tag: "ticker", text: "observers: 1" },
        { call: ["app", "ticker"], label: 'set_price("INFY", 1930.25)', scalaLabel: 'setPrice("INFY", 1930.25)' },
        NOTIFY("alert", "update(INFY, 1930.25)"),
        { tag: "alert", text: "triggered: 2" }
      ]
    },
    {
      title: "A new consumer plugs straight in",
      what: "A PushService implements Observer and is added with one subscribe() call.",
      why: "StockTicker: 0 lines changed. New listeners are added, not edited in (Open/Closed).",
      say: {
        what: "Finally, a new push service implements the observer interface, and is added with one subscribe call.",
        why: "And the stock ticker? Zero lines changed. New listeners are added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [4, 5, 6, 14, 15], scala: [3, 4, 10] },
      actions: [
        { mark: "ticker", member: null },
        { show: ["push"] },
        { show: ["r-push"] },
        { call: ["app", "ticker"], label: "subscribe(push)" },
        { tag: "ticker", text: "observers: 2" },
        { show: ["ok"] },
        { pulse: "ticker", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: client -> subject -> observer interface <- 2 or 3 observers ---------- */

interface Obs { id: string; name: string; members: string[]; scalaMembers?: string[]; stereotype?: string }

function obsDiagram(o: {
  label: string; client: string;
  subj: { id: string; name: string; members: string[]; scalaMembers?: string[]; w: number };
  iface: { name: string; members: string[]; scalaMembers?: string[]; kind?: DNode["kind"]; stereotype?: string; w: number };
  obs: Obs[]; obsW: number; rel?: "realization" | "inheritance";
}): DiagramSpec {
  const subjH = TAG_H(o.subj.members.length);
  const istereo = o.iface.stereotype !== "" ;
  const ifaceH = (istereo ? 44 : 32) + 20 * o.iface.members.length + 10;
  const ostereo = o.obs.some((b) => b.stereotype);
  const obsH = TAG_H(Math.max(...o.obs.map((b) => b.members.length)), ostereo);
  const subjX = 170, ifaceX = Math.min(subjX + o.subj.w + 60, 744 - o.iface.w);
  const topBottom = 20 + Math.max(subjH, ifaceH);
  // the realization bus runs half-way between the interface and the observers: keep it clear of the subject's value tag
  const obsY = Math.max(topBottom + 60, 2 * (20 + subjH + 28) - (20 + ifaceH));
  const n = o.obs.length, gap = 16;
  const total = n * o.obsW + (n - 1) * gap;
  const start = Math.min(744 - total, Math.max(16, ifaceX + o.iface.w / 2 - total / 2));

  // portrait: client top-left, subject, interface, observers two per row (a third one centred below)
  const pSubjY = 76, pIfaceY = pSubjY + subjH + 40, pObsY = pIfaceY + ifaceH + 60;
  const pObs = [{ x: 8, y: pObsY }, { x: 176, y: pObsY }, { x: 92, y: pObsY + obsH + 24 }];
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: o.client, hidden: true, at: { x: 16, y: 20 + (subjH - 54) / 2, w: 130, h: 54 }, portrait: { x: 8, y: 10, w: 130, h: 50 } },
    { id: o.subj.id, kind: "concrete", name: o.subj.name, key: true, hidden: true, members: o.subj.members, scalaMembers: o.subj.scalaMembers,
      at: { x: subjX, y: 20, w: o.subj.w, h: subjH }, portrait: { x: 20, y: pSubjY, w: 300, h: subjH } },
    { id: "iface", kind: o.iface.kind ?? "interface", name: o.iface.name, key: true, hidden: true, members: o.iface.members, scalaMembers: o.iface.scalaMembers,
      stereotype: o.iface.stereotype, at: { x: ifaceX, y: 20, w: o.iface.w }, portrait: { x: 170 - Math.min(o.iface.w, 280) / 2, y: pIfaceY, w: Math.min(o.iface.w, 280) } },
    ...o.obs.map((b, i) => ({
      id: b.id, kind: "concrete" as const, name: b.name, hidden: true, members: b.members, scalaMembers: b.scalaMembers, stereotype: b.stereotype,
      at: { x: start + i * (o.obsW + gap), y: obsY, w: o.obsW, h: obsH },
      portrait: { ...pObs[n === 2 ? i : i], w: 156, h: obsH }
    }))
  ];
  return {
    label: o.label, width: 760, height: obsY + obsH + 34,
    portraitWidth: 340, portraitHeight: (n === 3 ? pObs[2].y : pObsY) + obsH + 34,
    nodes,
    edges: [
      { id: "uses", from: "client", to: o.subj.id, type: "association", hidden: true },
      { id: "notifies", from: o.subj.id, to: "iface", type: "association", toMult: "*", hidden: true },
      ...o.obs.map((b) => ({ id: "r-" + b.id, from: b.id, to: "iface", type: (o.rel ?? "realization") as "realization" | "inheritance", hidden: true }))
    ]
  };
}

const BUILD = (subj: string, obs: string[]): Action[] => [
  { show: ["client", subj] },
  { show: ["uses"] },
  { show: ["iface"] },
  { show: ["notifies"] },
  { show: obs },
  { show: obs.map((id) => "r-" + id) }
];
const TO = (subj: string, id: string, label: string, scalaLabel?: string, result?: string): Action =>
  ({ call: [subj, "iface", id], label, ...(scalaLabel ? { scalaLabel } : {}), ...(result ? { result } : {}) });

/* --- order status --- */

const orderDiagram = obsDiagram({
  label: "Order notifies a list of OrderListener objects; CustomerSms, RestaurantScreen and DeliveryStats implement it.",
  client: "Demo",
  subj: { id: "order", name: "Order", w: 220, members: ["- _listeners: list", "+ subscribe(l)", "+ move_to(status)"],
    scalaMembers: ["- listeners: ListBuffer", "+ subscribe(l)", "+ moveTo(status)"] },
  iface: { name: "OrderListener", w: 250, members: ["+ on_status(id, status)"], scalaMembers: ["+ onStatus(id, status)"] },
  obsW: 168,
  obs: [
    { id: "sms", name: "CustomerSms", members: ["+ on_status(…)"], scalaMembers: ["+ onStatus(…)"] },
    { id: "screen", name: "RestaurantScreen", members: ["+ on_status(…)"], scalaMembers: ["+ onStatus(…)"] },
    { id: "stats", name: "DeliveryStats", members: ["+ on_status(…)"], scalaMembers: ["+ onStatus(…)"] }
  ]
});

const MOVE = (status: string, smsText: string, screen: boolean, statsText: string): Action[] => [
  { call: ["client", "order"], label: `move_to("${status}")`, scalaLabel: `moveTo("${status}")` },
  { tag: "order", text: status },
  TO("order", "sms", `on_status(${status})`, `onStatus(${status})`),
  { ...TO("order", "screen", `on_status(${status})`, `onStatus(${status})`), together: true },
  { ...TO("order", "stats", `on_status(${status})`, `onStatus(${status})`), together: true },
  { tag: "sms", text: smsText },
  { tag: "screen", text: screen ? "shows " + status : "ignored", together: true },
  { tag: "stats", text: statsText, together: true }
];

const orderTable: Record<string, [string, string, boolean]> = {
  PREPARING: ["SMS + stats react", "The kitchen screen only shows PLACED, CANCELLED and PICKED_UP.", false],
  PICKED_UP: ["SMS + kitchen screen + stats", "PICKED_UP is one of the kitchen screen's statuses.", true],
  DELIVERED: ["SMS + stats react", "The customer gets the final SMS; the kitchen does not care.", false],
  CANCELLED: ["SMS + kitchen screen + stats", "The kitchen must stop cooking, so its screen reacts too.", true]
};
const orderResults: TryIt["results"] = {};
for (const [status, [output, note, screen]] of Object.entries(orderTable)) {
  orderResults[status] = { output, note, actions: [
    { ring: "order" },
    { call: ["client", "order"], label: `move_to("${status}")`, scalaLabel: `moveTo("${status}")` },
    { tag: "order", text: status },
    TO("order", "sms", `on_status(${status})`, `onStatus(${status})`),
    { ...TO("order", "screen", `on_status(${status})`, `onStatus(${status})`), together: true },
    { ...TO("order", "stats", `on_status(${status})`, `onStatus(${status})`), together: true },
    { tag: "sms", text: "SMS: " + status.toLowerCase().replace("_", " ") },
    { tag: "screen", text: screen ? "shows " + status : "ignored", together: true },
    { tag: "stats", text: `${status}: 1`, together: true }
  ] };
}

const order: ExampleAnimation = {
  diagram: orderDiagram,
  walk: [
    [...BUILD("order", ["sms", "screen", "stats"]), { call: ["client", "order"], label: "subscribe × 3" }, { tag: "order", text: "PLACED · 3 listeners" }],
    MOVE("PREPARING", "SMS: preparing", false, "PREPARING: 1"),
    [{ ring: "screen" }, ...MOVE("PICKED_UP", "SMS: picked up", true, "PICKED_UP: 1")],
    [{ ring: "sms" }, ...MOVE("DELIVERED", "SMS: delivered", false, "DELIVERED: 1")],
    [{ ring: "stats" }, { pulse: "stats" }, { tag: "stats", text: "1 of each status" }]
  ],
  tryIt: {
    prompt: "Move a fresh order to a new status. Which listeners react?",
    groups: [{ label: "New status", options: [
      { id: "PREPARING", label: "Preparing" }, { id: "PICKED_UP", label: "Picked up" }, { id: "DELIVERED", label: "Delivered" }, { id: "CANCELLED", label: "Cancelled" }
    ] }],
    results: orderResults
  }
};

/* --- smart thermostat (pull model) --- */

const sensorDiagram = obsDiagram({
  label: "TemperatureSensor notifies SensorObserver objects; AirConditioner and AppTile implement it and pull the reading from the sensor.",
  client: "Demo",
  subj: { id: "sensor", name: "TemperatureSensor", w: 230, members: ["+ room · celsius", "+ attach(o)", "+ reading(celsius)"] },
  iface: { name: "SensorObserver", w: 230, members: ["+ refresh(sensor)"] },
  obsW: 200,
  obs: [
    { id: "ac", name: "AirConditioner", members: ["- switch_on_at: 28.0", "+ refresh(sensor)"], scalaMembers: ["- switchOnAt: 28.0", "+ refresh(sensor)"] },
    { id: "tile", name: "AppTile", members: ["+ refresh(sensor)"] }
  ]
});

const READ = (v: string): Action[] => [
  { call: ["client", "sensor"], label: `reading(${v})` },
  { tag: "sensor", text: `${v}°C` }
];
const PULL = (id: string, v: string): Action[] => [
  TO("sensor", id, "refresh(self)", "refresh(this)"),
  { call: [id, "sensor"], label: "sensor.celsius", result: `${v}°C` }
];

const sensorResults: TryIt["results"] = {};
for (const at of ["26", "28", "30"]) {
  for (const v of ["25", "27", "29"]) {
    const on = Number(v) >= Number(at);
    sensorResults[`a${at}|r${v}`] = {
      output: on ? `AC turns ON · tile ${v}.0°C` : `AC stays off · tile ${v}.0°C`,
      note: on ? `${v}.0 ≥ ${at}.0, so the AC switches on.` : `${v}.0 is below ${at}.0; only the tile updates.`,
      actions: [
        { ring: "sensor" },
        { call: ["client", "sensor"], label: `reading(${v}.0)` },
        { tag: "sensor", text: `${v}.0°C` },
        ...PULL("ac", `${v}.0`),
        { tag: "ac", text: on ? "ON" : "off" },
        ...PULL("tile", `${v}.0`),
        { tag: "tile", text: `Bedroom ${v}.0°C` }
      ]
    };
  }
}

const sensor: ExampleAnimation = {
  diagram: sensorDiagram,
  walk: [
    [...BUILD("sensor", ["ac", "tile"]), { call: ["client", "sensor"], label: "attach(ac); attach(tile)" }, { tag: "ac", text: "off" }],
    [...READ("26.5"), ...PULL("ac", "26.5"), { tag: "ac", text: "off" }, ...PULL("tile", "26.5"), { tag: "tile", text: "Bedroom 26.5°C" }],
    [...READ("28.5"), { ring: "ac" }, ...PULL("ac", "28.5"), { tag: "ac", text: "ON" }, ...PULL("tile", "28.5"), { tag: "tile", text: "Bedroom 28.5°C" }],
    [{ ring: "sensor", caption: "no change, no noise" }, { call: ["client", "sensor"], label: "reading(28.5)", result: "ignored" }, { pulse: "sensor" }],
    [{ ring: null }, ...READ("29.0"), ...PULL("tile", "29.0"), { tag: "tile", text: "Bedroom 29.0°C" },
      ...READ("25.0"), { ring: "ac" }, ...PULL("ac", "25.0"), { tag: "ac", text: "OFF" }, ...PULL("tile", "25.0"), { tag: "tile", text: "Bedroom 25.0°C" }]
  ],
  tryIt: {
    prompt: "Set the AC's switch-on point, then send one reading to a fresh sensor.",
    groups: [
      { label: "AC switches on at", options: [{ id: "a26", label: "26°C" }, { id: "a28", label: "28°C" }, { id: "a30", label: "30°C" }] },
      { label: "Reading", options: [{ id: "r25", label: "25°C" }, { id: "r27", label: "27°C" }, { id: "r29", label: "29°C" }] }
    ],
    results: sensorResults
  }
};

/* --- auto-bidders --- */

const auctionDiagram = obsDiagram({
  label: "Auction notifies a list of Bidder objects; two AutoBidder objects, Meera and Kabir, extend Bidder and bid back through the auction.",
  client: "Demo",
  subj: { id: "auction", name: "Auction", w: 240, members: ["- _watchers: list[Bidder]", "+ watch(b) · unwatch(b)", "+ bid(name, amount)"],
    scalaMembers: ["- watchers: ListBuffer[Bidder]", "+ watch(b) · unwatch(b)", "+ bid(name, amount)"] },
  iface: { name: "Bidder", kind: "abstract", w: 290, members: ["+ on_new_bid(auction, leader, amount)"], scalaMembers: ["+ onNewBid(auction, leader, amount)"] },
  obsW: 200, rel: "inheritance",
  obs: [
    { id: "meera", name: "meera: AutoBidder", members: ["- budget ₹26,000", "- step ₹2,000"] },
    { id: "kabir", name: "kabir: AutoBidder", members: ["- budget ₹30,000", "- step ₹1,500"] }
  ]
});

const BIDS = (who: string, amount: string): Action[] => [
  { call: [who, "auction"], label: `bid(₹${amount})` },
  { tag: "auction", text: `${who === "client" ? "ravi" : who}: ₹${amount}` }
];

const auctionTable: Record<string, [string, string, string]> = {
  b22: ["Kabir wins at ₹22,500", "Meera cannot even add ₹2,000 to ₹21,000, so she leaves at once.", "kabir"],
  b26: ["Kabir wins at ₹24,500", "As in the demo: Meera drops out when ₹26,500 is over budget.", "kabir"],
  b28: ["Kabir wins at ₹28,000", "Meera's ₹30,000 would be over her ₹28,000 budget.", "kabir"],
  b30: ["Meera wins at ₹30,000", "Now Kabir's ₹31,500 is over his ₹30,000 budget, so he leaves.", "meera"]
};
const auctionResults: TryIt["results"] = {};
for (const [k, [output, note, winner]] of Object.entries(auctionTable)) {
  const loser = winner === "kabir" ? "meera" : "kabir";
  auctionResults[k] = { output, note, actions: [
    { ring: "auction" },
    { members: "meera", lines: [`- budget ₹${k.slice(1)},000`, "- step ₹2,000"] },
    { call: ["client", "auction"], label: "bid(₹21,000)" },
    TO("auction", loser, "on_new_bid(…)", "onNewBid(…)"),
    { call: [loser, "auction"], label: "unwatch(self)", scalaLabel: "unwatch(this)" },
    { dim: [loser], together: true },
    { ring: winner },
    { tag: "auction", text: output.replace(" wins at", ":") }
  ] };
}

const auction: ExampleAnimation = {
  diagram: auctionDiagram,
  walk: [
    [...BUILD("auction", ["meera", "kabir"]), { call: ["client", "auction"], label: "watch(meera); watch(kabir)" }, { tag: "auction", text: "start ₹20,000" }],
    [...BIDS("client", "21,000"), TO("auction", "meera", "on_new_bid(ravi, 21,000)", "onNewBid(ravi, 21,000)"),
      { ...TO("auction", "kabir", "on_new_bid(ravi, 21,000)", "onNewBid(ravi, 21,000)"), together: true }],
    [{ ring: "meera" }, ...BIDS("meera", "23,000"), TO("auction", "kabir", "on_new_bid(meera, 23,000)", "onNewBid(meera, 23,000)"),
      { ring: "kabir" }, ...BIDS("kabir", "24,500")],
    [TO("auction", "meera", "on_new_bid(kabir, 24,500)", "onNewBid(kabir, 24,500)"), { ring: "meera", caption: "₹26,500 > budget" },
      { call: ["meera", "auction"], label: "unwatch(self)", scalaLabel: "unwatch(this)" }, { dim: ["meera", "r-meera"] }],
    [{ ring: "kabir", caption: "winner" }, { call: ["kabir", "auction"], label: "bid(₹22,500)", result: "ignored: too low" },
      { tag: "auction", text: "sold: kabir ₹24,500" }]
  ],
  tryIt: {
    prompt: "Change Meera's budget and run the same auction. Who wins, and at what price?",
    groups: [{ label: "Meera's budget", options: [
      { id: "b22", label: "₹22,000" }, { id: "b26", label: "₹26,000" }, { id: "b28", label: "₹28,000" }, { id: "b30", label: "₹30,000" }
    ] }],
    results: auctionResults
  }
};

/* --- CI event bus (publish / subscribe by topic) --- */

const busDiagram = obsDiagram({
  label: "EventBus keeps Handler functions per topic; chat_notifier, pager and deploy_log are handler functions; the CI runner only publishes to the bus.",
  client: "CI runner",
  subj: { id: "bus", name: "EventBus", w: 230, members: ["- _handlers: topic → [Handler]", "+ subscribe(topic, h)", "+ publish(topic, event)"],
    scalaMembers: ["- handlers: topic → [Handler]", "+ subscribe(topic, h)", "+ publish(topic, event)"] },
  iface: { name: "Handler", stereotype: "«function type»", w: 210, members: ["(event) -> None"], scalaMembers: ["Event => Unit"] },
  obsW: 170,
  obs: [
    { id: "chat", name: "chat_notifier", stereotype: "«function»", members: ["build.failed"] },
    { id: "pager", name: "pager", stereotype: "«function»", members: ["build.failed"] },
    { id: "deploy", name: "deploy_log", stereotype: "«function»", members: ["deploy.done"] }
  ]
});

const PUB = (topic: string): Action => ({ call: ["client", "bus"], label: `publish("${topic}")` });

const busTable: Record<string, [string, string, string[], Record<string, string>]> = {
  failmain: ["chat posts · pager fails, caught", "The bus catches the pager's error so the others still run.", ["chat", "pager"],
    { chat: "posted to #builds", pager: "error caught" }],
  failfeat: ["chat posts · pager skips", "The pager only cares about main, so it returns quietly.", ["chat", "pager"],
    { chat: "posted to #builds", pager: "not main: skip" }],
  deploy: ["deploy log: web-app v2.8.1", "Only deploy_log subscribed to deploy.done.", ["deploy"], { deploy: "v2.8.1 is live" }],
  cache: ["nothing happens", "Nobody subscribed to cache.cleared.", [], {}]
};
const TOPIC: Record<string, string> = { failmain: "build.failed", failfeat: "build.failed", deploy: "deploy.done", cache: "cache.cleared" };
const busResults: TryIt["results"] = {};
for (const [k, [output, note, hit, tags]] of Object.entries(busTable)) {
  const acts: Action[] = [{ ring: "bus" }, { tag: "chat", text: null }, { tag: "pager", text: null, together: true }, { tag: "deploy", text: null, together: true }, PUB(TOPIC[k])];
  hit.forEach((id, i) => acts.push({ ...TO("bus", id, "handler(event)"), ...(i ? { together: true } : {}) }));
  for (const [id, t] of Object.entries(tags)) acts.push({ tag: id, text: t });
  if (!hit.length) acts.push({ pulse: "bus" });
  acts.push({ tag: "bus", text: `${TOPIC[k]}: ${hit.length} handler${hit.length === 1 ? "" : "s"}` });
  busResults[k] = { output, note, actions: acts };
}

const bus: ExampleAnimation = {
  diagram: busDiagram,
  walk: [
    [...BUILD("bus", ["chat", "pager", "deploy"]), { call: ["client", "bus"], label: "subscribe × 3" }, { tag: "bus", text: "2 topics, 3 handlers" }],
    [{ ring: "client" }, PUB("build.failed"), { tag: "bus", text: "build.failed: 2 handlers" }],
    [{ ring: null }, TO("bus", "chat", "handler(event)"), { tag: "chat", text: "posted to #builds" }, TO("bus", "pager", "handler(event)"),
      { flash: "pager" }, { tag: "pager", text: "error caught" }],
    [PUB("deploy.done"), TO("bus", "deploy", "handler(event)"), { tag: "deploy", text: "v2.8.1 is live" }, { tag: "bus", text: "deploy.done: 1 handler" }],
    [PUB("cache.cleared"), { pulse: "bus" }, { tag: "bus", text: "cache.cleared: 0 handlers" }]
  ],
  tryIt: {
    prompt: "Publish one event. Which handlers run?",
    groups: [{ label: "Event", options: [
      { id: "failmain", label: "build.failed on main" }, { id: "failfeat", label: "build.failed on a feature branch" },
      { id: "deploy", label: "deploy.done" }, { id: "cache", label: "cache.cleared" }
    ] }],
    results: busResults
  }
};

const animation: PatternAnimation = {
  slug: "observer",
  story: storyAnim,
  examples: { order, sensor, auction, bus },
  sequence: {
    label: "App subscribes display and alert; each set_price makes the ticker call update on every subscriber; after unsubscribe, only the alert is updated.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "ticker", name: "ticker: StockTicker", kind: "concrete" },
      { id: "display", name: "display: PriceDisplay", kind: "concrete" },
      { id: "alert", name: "alert: PriceAlert", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "ticker", label: "subscribe(display)" },
      { from: "app", to: "ticker", label: "subscribe(alert)" },
      { from: "app", to: "ticker", label: 'set_price("INFY", 1875.50)' },
      { from: "ticker", to: "display", label: "update(INFY, 1875.50)" },
      { from: "ticker", to: "alert", label: "update(INFY, 1875.50)" },
      { from: "app", to: "ticker", label: 'set_price("INFY", 1912.00)' },
      { from: "ticker", to: "display", label: "update(INFY, 1912.00)" },
      { from: "ticker", to: "alert", label: "update(INFY, 1912.00)" },
      { from: "alert", to: "alert", label: "record: crossed ₹1,900", kind: "self" },
      { from: "app", to: "ticker", label: "unsubscribe(display)" },
      { from: "app", to: "ticker", label: 'set_price("INFY", 1930.25)' },
      { from: "ticker", to: "alert", label: "update(INFY, 1930.25)" }
    ]
  }
};

export default animation;
