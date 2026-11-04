class InsuranceDesk:
    def approved_cover(self, policy: str, estimate: int) -> int:
        return min(estimate, 100_000) if policy.startswith("STAR") else 0


class InvoiceService:
    def deposit(self, patient: str, amount: int) -> str:
        return f"deposit ₹{amount:,} from {patient}"


class BillingFacade:
    """Lower-level facade: the billing team owns it."""

    def __init__(self) -> None:
        self._insurance = InsuranceDesk()
        self._invoices = InvoiceService()

    def take_deposit(self, patient: str, policy: str, estimate: int) -> str:
        cover = self._insurance.approved_cover(policy, estimate)
        return self._invoices.deposit(patient, estimate - cover)


class BedManager:
    def __init__(self) -> None:
        self._free = {"general": ["G-14", "G-12"], "icu": []}

    def allocate(self, ward: str) -> str | None:
        beds = self._free[ward]
        return beds.pop() if beds else None


class AdmissionFacade:
    """Top-level facade for the front desk. It talks to billing only via BillingFacade."""

    def __init__(self) -> None:
        self._beds = BedManager()
        self._billing = BillingFacade()

    def admit(self, patient: str, ward: str, policy: str, estimate: int) -> str:
        bed = self._beds.allocate(ward)
        if bed is None:
            return f"{patient}: no {ward} bed free, added to waitlist"
        receipt = self._billing.take_deposit(patient, policy, estimate)
        return f"{patient}: bed {bed}, {receipt}"


desk = AdmissionFacade()
print(desk.admit("Mr. Rao", "general", "STAR-778", 140_000))
print(desk.admit("Ms. Das", "icu", "NONE", 300_000))
print(desk.admit("Mr. Sen", "general", "NONE", 60_000))
