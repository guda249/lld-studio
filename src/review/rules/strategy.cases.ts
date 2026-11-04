import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

const diagram: UmlModel = {"classes":[{"id":"Cart","name":"Cart","kind":"concrete","members":[]},{"id":"DiscountRule","name":"DiscountRule","kind":"interface","members":[]},{"id":"FestiveDiscount","name":"FestiveDiscount","kind":"concrete","members":[]},{"id":"BulkDiscount","name":"BulkDiscount","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"Cart","to":"DiscountRule","type":"aggregation"},{"id":"b","from":"FestiveDiscount","to":"DiscountRule","type":"realization"},{"id":"c","from":"BulkDiscount","to":"DiscountRule","type":"realization"}]};

/** Ported from the approved technical check (tools/code-reading-check/cases.js). */
const cases: ReviewCase[] = [
  {
    name: "1 Python, buggy (scratch-pad exercise)",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["strategy.context-creates-concrete","uml.rel-type"]},
    code: `from abc import ABC, abstractmethod

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
        return self.rule.apply(total)`
  },
  {
    name: "2 Python, fixed",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["strategy.depends-on-interface","strategy.delegates"],"none":["strategy.context-creates-concrete"]},
    code: `from abc import ABC, abstractmethod

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
        return self.rule.apply(total)`
  },
  {
    name: "3 Scala 3, fixed",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["strategy.depends-on-interface","strategy.delegates"],"none":["strategy.context-creates-concrete","strategy.no-setter"]},
    code: `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total - 100

class Cart(private var rule: DiscountRule):
  def setRule(r: DiscountRule): Unit = rule = r
  def checkout(total: BigDecimal): BigDecimal = rule.apply(total)`
  },
  {
    name: "4 Scala 3, buggy",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["strategy.context-creates-concrete","uml.rel-type"]},
    code: `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total - 100

class Cart:
  private val rule = FestiveDiscount()
  def checkout(total: BigDecimal): BigDecimal = rule.apply(total)`
  },
  {
    name: "5 Python, naming problems + concrete-typed param",
    lang: "python",
    expect: {"found":true,"ids":["strategy.concrete-field","general.naming"]},
    code: `from abc import ABC, abstractmethod

class DiscountRule(ABC):
    @abstractmethod
    def Apply(self, total: float) -> float: ...

class festive_discount(DiscountRule):
    def Apply(self, total): return total * 0.9

class BulkDiscount(DiscountRule):
    def Apply(self, total): return total - 100

class Cart:
    def __init__(self, rule: BulkDiscount):
        self.rule = rule`
  },
  {
    name: "6 Python, half-written (syntax errors)",
    lang: "python",
    expect: {"found":true,"ids":["general.unreadable"]},
    code: `from abc import ABC, abstractmethod

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
        return self.rule.apply(total`
  },
  {
    name: "7 Scala 3, half-written",
    lang: "scala",
    expect: {"found":true,"ids":["general.unreadable"]},
    code: `trait DiscountRule:
  def apply(total: BigDecimal): BigDecimal

class FestiveDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total * 0.9

class BulkDiscount extends DiscountRule:
  def apply(total: BigDecimal) = total -

class Cart(private var rule: DiscountRule):
  def checkout(total: BigDecimal): BigDecimal = rule.apply(`
  },
  {
    name: "8 Python, not Strategy at all (if/elif)",
    lang: "python",
    expect: {"found":false,"ids":["strategy.no-shape","strategy.branches"]},
    code: `class Cart:
    def checkout(self, kind: str, total: float) -> float:
        if kind == "festive":
            return total * 0.9
        elif kind == "bulk":
            return total - 100
        return total`
  },
];

export default cases;
