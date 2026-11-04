from dataclasses import dataclass


@dataclass
class ClaimItem:
    name: str
    cost: float

    def accept(self, visitor: "ClaimVisitor") -> float:
        raise NotImplementedError


@dataclass
class Consultation(ClaimItem):
    def accept(self, visitor: "ClaimVisitor") -> float:
        return visitor.visit_consultation(self)


@dataclass
class LabTest(ClaimItem):
    def accept(self, visitor: "ClaimVisitor") -> float:
        return visitor.visit_lab_test(self)


@dataclass
class Surgery(ClaimItem):
    days_in_hospital: int

    def accept(self, visitor: "ClaimVisitor") -> float:
        return visitor.visit_surgery(self)


class ClaimVisitor:
    """Base visitor: every visit_* falls back to fallback(), so a subclass overrides only what it needs."""
    def fallback(self, item: ClaimItem) -> float:
        return 0.0

    def visit_consultation(self, item: Consultation) -> float: return self.fallback(item)
    def visit_lab_test(self, item: LabTest) -> float: return self.fallback(item)
    def visit_surgery(self, item: Surgery) -> float: return self.fallback(item)


class CoverageVisitor(ClaimVisitor):          # how much the insurer pays (sample policy)
    def visit_consultation(self, item: Consultation) -> float: return item.cost * 0.8
    def visit_lab_test(self, item: LabTest) -> float: return item.cost
    def visit_surgery(self, item: Surgery) -> float: return min(item.cost * 0.9, 100_000)


class PreAuthVisitor(ClaimVisitor):           # only surgery can need pre-authorisation
    def visit_surgery(self, item: Surgery) -> float:
        return item.cost if item.cost >= 50_000 else 0.0


claim: list[ClaimItem] = [
    Consultation("Dr Mehta, general physician", 800),
    LabTest("HbA1c blood test", 450),
    Surgery("Appendectomy", 120_000, 3),
]
covered = sum(item.accept(CoverageVisitor()) for item in claim)
total = sum(item.cost for item in claim)
print(f"bill: ₹{total:,.0f} | insurer pays: ₹{covered:,.0f} | patient pays: ₹{total - covered:,.0f}")
print(f"needs pre-authorisation: ₹{sum(item.accept(PreAuthVisitor()) for item in claim):,.0f}")
