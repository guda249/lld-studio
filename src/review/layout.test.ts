/** Class-diagram layout: shapes that used to draw badly must draw cleanly (no line through a box, no overlaps). */
import type { UmlModel } from "./types";
import { umlToDiagram } from "./uml";
import { layoutProblems } from "./layoutCheck";
import { ok } from "../test/expect";

let n = 0;
const model = (classes: [string, UmlModel["classes"][number]["kind"]][], rels: [string, string, UmlModel["relations"][number]["type"]][]): UmlModel => ({
  classes: classes.map(([name, kind]) => ({ id: `c${n++}`, name, kind, members: ["+ run()"] })),
  relations: rels.map(([from, to, type]) => ({ id: `r${n++}`, from, to, type }))
});

const clean = (m: UmlModel, what: string) => {
  const spec = umlToDiagram(m);
  const wide = layoutProblems(spec, false);
  ok(!wide.length, `${what} (wide): ${wide.join("; ")}`);
  if (spec.portraitWidth) { const p = layoutProblems(spec, true); ok(!p.length, `${what} (phone): ${p.join("; ")}`); }
};

export const tests = {
  "layout: one class implementing several interfaces"() {
    clean(model([["Printer", "interface"], ["Scanner", "interface"], ["Fax", "interface"], ["MultiFunctionDevice", "concrete"], ["SimplePrinter", "concrete"]],
      [["MultiFunctionDevice", "Printer", "realization"], ["MultiFunctionDevice", "Scanner", "realization"], ["MultiFunctionDevice", "Fax", "realization"], ["SimplePrinter", "Printer", "realization"]]),
      "multiple interfaces");
  },
  "layout: two lines between the same pair, a chain, and a strategy"() {
    clean(model([["Board", "concrete"], ["Piece", "abstract"], ["King", "concrete"], ["Queen", "concrete"]],
      [["Board", "Piece", "aggregation"], ["Piece", "Board", "dependency"], ["King", "Piece", "inheritance"], ["Queen", "Piece", "inheritance"]]), "pair");
    clean(model([["Lot", "concrete"], ["Level", "concrete"], ["Spot", "concrete"], ["Vehicle", "concrete"], ["Ticket", "concrete"]],
      [["Lot", "Level", "composition"], ["Level", "Spot", "composition"], ["Spot", "Vehicle", "association"], ["Ticket", "Vehicle", "association"], ["Ticket", "Spot", "association"], ["Lot", "Ticket", "aggregation"]]), "chain");
    clean(model([["Checkout", "concrete"], ["PaymentMethod", "interface"], ["Card", "concrete"], ["Upi", "concrete"], ["Wallet", "concrete"]],
      [["Checkout", "PaymentMethod", "association"], ["Card", "PaymentMethod", "realization"], ["Upi", "PaymentMethod", "realization"], ["Wallet", "PaymentMethod", "realization"]]), "strategy");
  }
};
