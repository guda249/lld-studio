const { pyModel, scModel, review, errorLines, Parser } = require("./review.js");
const diagramAgg = { edges: [{ from: "Cart", to: "DiscountRule", type: "aggregation" }, { from: "FestiveDiscount", to: "DiscountRule", type: "realization" }, { from: "BulkDiscount", to: "DiscountRule", type: "realization" }] };
const CASES = [
  ["1 Python, buggy (scratch-pad exercise)", "py", diagramAgg, `from abc import ABC, abstractmethod

class DiscountRule(ABC):
    @abstractmethod
    def apply(self, total: float) -> float: ...

class FestiveDiscount(DiscountRule):
    def apply(self, total): return total * 0.9

class BulkDiscount(DiscountRule):
    def apply(self, total): return total - 100

class Cart:
    def __init__(self):
        self.rule = FestiveDiscount()

    def checkout(self, total: float) -> float:
        return self.rule.apply(total)`],
  ["2 Python, fixed", "py", diagramAgg, `from abc import ABC, abstractmethod

class DiscountRule(ABC):
    @abstractmethod
    def apply(self, total: float) -> float: ...

class FestiveDiscount(DiscountRule):
    def apply(self, total): return total * 0.9

class BulkDiscount(DiscountRule):
    def apply(self, total): return total - 100

class Cart:
    def __init__(self, rule: DiscountRule):
        self.rule = rule

    def set_rule(self, rule: DiscountRule) -> None:
        self.rule = rule

    def checkout(self, total: float) -> float:
        return self.rule.apply(total)`],
  ["3 Scala 3, fixed", "scala", diagramAgg, `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total - 100

class Cart(private var rule: DiscountRule):
  def setRule(r: DiscountRule): Unit = rule = r
  def checkout(total: BigDecimal): BigDecimal = rule.apply(total)`],
  ["4 Scala 3, buggy", "scala", diagramAgg, `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total - 100

class Cart:
  private val rule = FestiveDiscount()
  def checkout(total: BigDecimal): BigDecimal = rule.apply(total)`],
  ["5 Python, naming problems + concrete-typed param", "py", null, `from abc import ABC, abstractmethod

class DiscountRule(ABC):
    @abstractmethod
    def Apply(self, total: float) -> float: ...

class festive_discount(DiscountRule):
    def Apply(self, total): return total * 0.9

class BulkDiscount(DiscountRule):
    def Apply(self, total): return total - 100

class Cart:
    def __init__(self, rule: BulkDiscount):
        self.rule = rule`],
  ["6 Python, half-written (syntax errors)", "py", null, `from abc import ABC, abstractmethod

class DiscountRule(ABC):
    @abstractmethod
    def apply(self, total: float) -> float: ...

class FestiveDiscount(DiscountRule):
    def apply(self, total): return total * 0.9

class BulkDiscount(DiscountRule):
    def apply(self, total) return total - 100

class Cart:
    def __init__(self, rule: DiscountRule):
        self.rule = rule
    def checkout(self, total: float -> float:
        return self.rule.apply(total`],
  ["7 Scala 3, half-written", "scala", null, `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total -

class Cart(private var rule: DiscountRule):
  def checkout(total: BigDecimal): BigDecimal = rule.apply(`],
  ["8 Python, not Strategy at all (if/elif)", "py", null, `class Cart:
    def checkout(self, kind: str, total: float) -> float:
        if kind == "festive":
            return total * 0.9
        elif kind == "bulk":
            return total - 100
        return total`]
];
(async () => {
  await Parser.init();
  const PY = await Parser.Language.load("node_modules/tree-sitter-wasms/out/tree-sitter-python.wasm");
  const SC = await Parser.Language.load("scala3.wasm");
  const parser = new Parser();
  const icon = { pass: "✅", warn: "⚠️ ", fail: "❌", note: "ℹ️ " };
  for (const [title, lang, diagram, src] of CASES) {
    const t0 = process.hrtime.bigint();
    parser.setLanguage(lang === "py" ? PY : SC);
    const tree = parser.parse(src);
    const model = lang === "py" ? pyModel(tree.rootNode) : scModel(tree.rootNode);
    const findings = review(model, lang, diagram, errorLines(tree.rootNode));
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`\n=== ${title}  (${ms.toFixed(1)} ms)`);
    console.log("   model:", model.map((c) => `${c.name}[${c.kind}${c.bases.length ? " <: " + c.bases.join(",") : ""}]` +
      (c.fields.length ? " {" + c.fields.map((f) => `${f.name}:${f.type || "?"}/${f.origin}`).join(", ") + "}" : "")).join("  "));
    for (const f of findings) console.log("  ", icon[f.sev], f.text);
  }
})();
