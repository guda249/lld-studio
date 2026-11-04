import { useEffect, useMemo, useRef, useState } from "react";
import type { Action } from "../../../anim/types";
import type { CustomWidgetProps } from "../../../anim/customWidgets";
import { useReducedMotion } from "../../../lib/motion";

/**
 * The four Try-it widgets of the approved Strategy prototype. Their numbers mirror the example code exactly
 * (8 km, 25 min → ₹184 normal, ₹330 surge ×1.8, ₹128 pool).
 */

const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const PATH = (i: number) => ["client", "ctx", "iface", "s" + i];

function pickActions(i: number, name: string, call: string, result: string, via: number | null = null): Action[] {
  return [
    { call: ["client", "ctx"], label: "use " + name },
    { ring: "s" + i },
    { pulse: "s" + i },
    { call: via === null ? PATH(i) : [...PATH(i), "s" + via], label: call, result }
  ];
}
const callActions = (i: number, call: string, result: string, via: number | null = null): Action[] =>
  [{ call: via === null ? PATH(i) : [...PATH(i), "s" + via], label: call, result }];

function Chips<T extends string>({ name, options, value, onPick }: {
  name: string; options: { v: T; label: string }[]; value: T; onPick: (v: T) => void;
}) {
  return (
    <div className="chips" role="group" aria-label={name}>
      {options.map((o) => (
        <button key={o.v} type="button" className="chip" aria-pressed={o.v === value} onClick={() => onPick(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- ride fares ---------- */
type RideS = "normal" | "surge" | "pool";
const RIDE: { v: RideS; label: string }[] = [{ v: "normal", label: "NormalPricing" }, { v: "surge", label: "SurgePricing" }, { v: "pool", label: "PoolPricing" }];

export function RideWidget({ onPlay, resetSignal }: CustomWidgetProps) {
  const [s, setS] = useState<RideS>("normal");
  const [km, setKm] = useState(8);
  const [min, setMin] = useState(25);
  const [mult, setMult] = useState(1.8);
  useEffect(() => { if (resetSignal) { setS("normal"); setKm(8); setMin(25); setMult(1.8); } }, [resetSignal]);
  const normal = 50 + 12 * km + 1.5 * min;
  const fareOf = (x: RideS, m = mult) => (x === "surge" ? normal * m : x === "pool" ? normal * 0.7 : normal);
  const fare = fareOf(s);
  const call = `quote(${km} km, ${min} min)`;
  const idx = (x: RideS) => RIDE.findIndex((o) => o.v === x);
  const formula = s === "normal" ? `₹50 base + ₹12 × ${km} km + ₹1.5 × ${min} min`
    : s === "surge" ? `normal fare ${rupees(normal)} × ${mult} surge` : `normal fare ${rupees(normal)} × 0.7 shared-ride discount`;
  const changed = (r = rupees(fare)) => onPlay(callActions(idx(s), call, r), `Same strategy (${RIDE[idx(s)].label}), new input: the call returns ${r}.`);
  return (
    <>
      <h4>Try it</h4>
      <Chips name="Pricing strategy" options={RIDE} value={s} onPick={(v) => {
        setS(v);
        const r = rupees(fareOf(v));
        onPlay(pickActions(idx(v), RIDE[idx(v)].label, call, r), `Rider app switched Ride to ${RIDE[idx(v)].label}. The same call now returns ${r}.`);
      }} />
      <div className="slider"><label htmlFor="wKm">Distance: <output>{km} km</output></label>
        <input type="range" id="wKm" min={1} max={30} value={km} onChange={(e) => setKm(Number(e.target.value))} onMouseUp={() => changed()} onKeyUp={() => changed()} onTouchEnd={() => changed()} /></div>
      <div className="slider"><label htmlFor="wMin">Trip time: <output>{min} min</output></label>
        <input type="range" id="wMin" min={5} max={90} step={5} value={min} onChange={(e) => setMin(Number(e.target.value))} onMouseUp={() => changed()} onKeyUp={() => changed()} onTouchEnd={() => changed()} /></div>
      <div className="slider"><label htmlFor="wMult">Surge multiplier</label>
        <select id="wMult" value={String(mult)} onChange={(e) => { const m = Number(e.target.value); setMult(m); changed(rupees(fareOf(s, m))); }}>
          {["1.2", "1.5", "1.8", "2.5"].map((m) => <option key={m}>{m}</option>)}
        </select></div>
      <div className="result" aria-live="polite"><span className="big-num">{rupees(fare)}</span><span className="formula">{formula}</span></div>
    </>
  );
}

/* ---------- sorting search results ---------- */
type SortS = "price" | "rating" | "newest";
const SORTS: { v: SortS; label: string; box: string }[] = [
  { v: "price", label: "Price: low to high", box: "PriceLowHigh" }, { v: "rating", label: "Top rated", box: "TopRated" }, { v: "newest", label: "Newest", box: "Newest" }
];
const PRODUCTS = [
  { name: "Kettle", price: 1499, rating: 4.2, days: 30 },
  { name: "Toaster", price: 999, rating: 4.6, days: 5 },
  { name: "Mixer", price: 2999, rating: 4.4, days: 12 }
];
const RULES: Record<SortS, (a: typeof PRODUCTS[number], b: typeof PRODUCTS[number]) => number> = {
  price: (a, b) => a.price - b.price, rating: (a, b) => b.rating - a.rating, newest: (a, b) => a.days - b.days
};

export function SortWidget({ onPlay, resetSignal }: CustomWidgetProps) {
  const [s, setS] = useState<SortS>("price");
  const reduce = useReducedMotion();
  useEffect(() => { if (resetSignal) setS("price"); }, [resetSignal]);
  const orderOf = (x: SortS) => PRODUCTS.map((_, i) => i).sort((a, b) => RULES[x](PRODUCTS[a], PRODUCTS[b]));
  const order = useMemo(() => orderOf(s), [s]);
  return (
    <>
      <h4>Try it</h4>
      <Chips name="Sort strategy" options={SORTS} value={s} onPick={(v) => {
        setS(v);
        const i = SORTS.findIndex((o) => o.v === v);
        const r = orderOf(v).map((k) => PRODUCTS[k].name).join(", ");
        onPlay(pickActions(i, SORTS[i].box, "sort(results)", r), `Search page switched SearchResults to ${SORTS[i].box}. The same call now returns ${r}.`);
      }} />
      <div className="sort-list" aria-live="polite">
        {PRODUCTS.map((p, i) => {
          const rank = order.indexOf(i);
          return (
            <div key={p.name} className="sort-item" style={{ transform: `translateY(${rank * 62}px)`, transition: reduce ? "none" : undefined }}>
              <span className="pos">{rank + 1}</span><span className="nm">{p.name}</span>
              <span className="meta">{rupees(p.price)} · ★ {p.rating} · {p.days} days ago</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- shipping cost ---------- */
type ShipS = "standard" | "express" | "free";
const SHIPS: { v: ShipS; label: string }[] = [{ v: "standard", label: "StandardShipping" }, { v: "express", label: "ExpressShipping" }, { v: "free", label: "FreeAbove(₹499)" }];

export function ShipWidget({ onPlay, resetSignal }: CustomWidgetProps) {
  const [s, setS] = useState<ShipS>("standard");
  const [total, setTotal] = useState(650);
  const [kg, setKg] = useState(2);
  useEffect(() => { if (resetSignal) { setS("standard"); setTotal(650); setKg(2); } }, [resetSignal]);
  const standard = 40 + 10 * kg;
  const shipOf = (x: ShipS) => (x === "express" ? 120 + 25 * kg : x === "free" && total >= 499 ? 0 : standard);
  const viaOf = (x: ShipS) => (x === "free" && total < 499 ? 0 : null);
  const ship = shipOf(s);
  const note = s === "express" ? `₹120 + ₹25 × ${kg} kg` : s === "free" && total >= 499 ? "free: order is at least ₹499"
    : s === "free" ? "below ₹499, so it falls back to Standard" : `₹40 + ₹10 × ${kg} kg`;
  const call = `cost(${kg} kg, ${rupees(total)})`;
  const idx = (x: ShipS) => SHIPS.findIndex((o) => o.v === x);
  const changed = () => onPlay(callActions(idx(s), call, rupees(ship), viaOf(s)), `Same strategy (${SHIPS[idx(s)].label}), new input: the call returns ${rupees(ship)}.`);
  return (
    <>
      <h4>Try it</h4>
      <Chips name="Shipping strategy" options={SHIPS} value={s} onPick={(v) => {
        setS(v);
        const r = rupees(shipOf(v));
        onPlay(pickActions(idx(v), SHIPS[idx(v)].label, call, r, viaOf(v)), `Checkout switched Order to ${SHIPS[idx(v)].label}. The same call now returns ${r}.`);
      }} />
      <div className="slider"><label htmlFor="wTotal">Order value: <output>{rupees(total)}</output></label>
        <input type="range" id="wTotal" min={100} max={2000} step={50} value={total} onChange={(e) => setTotal(Number(e.target.value))} onMouseUp={changed} onKeyUp={changed} onTouchEnd={changed} /></div>
      <div className="slider"><label htmlFor="wKg">Weight: <output>{kg} kg</output></label>
        <input type="range" id="wKg" min={0.5} max={10} step={0.5} value={kg} onChange={(e) => setKg(Number(e.target.value))} onMouseUp={changed} onKeyUp={changed} onTouchEnd={changed} /></div>
      <div className="result" aria-live="polite"><span className="big-num">{rupees(total + ship)}</span><span className="formula">shipping {rupees(ship)} ({note})</span></div>
    </>
  );
}

/* ---------- retry back-off ---------- */
type RetryS = "fixed" | "exp" | "jitter";
const RETRIES: { v: RetryS; label: string }[] = [{ v: "fixed", label: "FixedDelay" }, { v: "exp", label: "ExponentialBackoff" }, { v: "jitter", label: "FullJitter" }];
const exp = (a: number) => Math.min(8, 0.5 * Math.pow(2, a - 1));
const delaysOf = (x: RetryS) => [1, 2, 3, 4, 5].map((a) => (x === "fixed" ? 1 : x === "exp" ? exp(a) : Math.random() * exp(a)));

export function RetryWidget({ onPlay, resetSignal }: CustomWidgetProps) {
  const [s, setS] = useState<RetryS>("fixed");
  const [delays, setDelays] = useState(() => delaysOf("fixed"));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (resetSignal) { setS("fixed"); setDelays(delaysOf("fixed")); }
  }, [resetSignal]);
  const idx = (x: RetryS) => RETRIES.findIndex((o) => o.v === x);
  const note = s === "fixed" ? "Always wait 1 s." : s === "exp" ? "Double the wait each time, capped at 8 s." : "Random wait between 0 and the exponential value.";
  return (
    <>
      <h4>Try it</h4>
      <Chips name="Back-off strategy" options={RETRIES} value={s} onPick={(v) => {
        const d = delaysOf(v);
        setS(v); setDelays(d);
        const r = d[2].toFixed(2) + " s";
        onPlay(pickActions(idx(v), RETRIES[idx(v)].label, "delay(retry 3)", r), `PaymentService switched RetryingClient to ${RETRIES[idx(v)].label}. The same call now returns ${r}.`);
      }} />
      <div className="bars" role="img" aria-label={"Wait before each retry: " + delays.map((d) => d.toFixed(2) + " seconds").join(", ")}>
        {delays.map((d, i) => (
          <div key={i} className="bar-col">
            <span className="bar-val">{d.toFixed(2)} s</span>
            <div className="bar" style={{ height: Math.max(2, (d / 8) * 130) }} />
            <span className="bar-lbl">retry {i + 1}</span>
          </div>
        ))}
      </div>
      <div className="result">
        <span className="formula">{note}</span>
        {s === "jitter" && (
          <button type="button" className="btn" onClick={() => {
            const d = delaysOf("jitter");
            setDelays(d);
            const r = d[2].toFixed(2) + " s";
            onPlay(callActions(2, "delay(retry 3)", r), `Same strategy (FullJitter), new roll: the call returns ${r}.`);
          }}>Roll the dice again</button>
        )}
      </div>
    </>
  );
}
