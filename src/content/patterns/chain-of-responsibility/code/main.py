class Approver:
    """Handler: knows its own limit and the next approver in the chain."""

    name: str = "Approver"
    limit: int = 0

    def __init__(self, next_approver: "Approver | None" = None) -> None:
        self._next = next_approver

    def approve(self, amount: int) -> str:
        if amount <= self.limit:
            return f"{self.name} approved ₹{amount}"
        if self._next is None:
            return f"Rejected: ₹{amount} needs board approval"
        return self._next.approve(amount)


class TeamLead(Approver):
    name = "TeamLead"
    limit = 10_000


class Manager(Approver):
    name = "Manager"
    limit = 100_000


class Director(Approver):
    name = "Director"
    limit = 1_000_000


# The client builds the chain from the outside and talks only to its first link.
chain = TeamLead(Manager(Director()))
for amount in (4_000, 75_000, 600_000, 5_000_000):
    print(chain.approve(amount))
