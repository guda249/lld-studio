from typing import Callable

# Each handler returns a result, or None to say "not mine, pass it on".
Handler = Callable[[int], str | None]


def team_lead(amount: int) -> str | None:
    return "TeamLead approved" if amount <= 10_000 else None


def manager(amount: int) -> str | None:
    return "Manager approved" if amount <= 100_000 else None


def director(amount: int) -> str | None:
    return "Director approved" if amount <= 1_000_000 else None


def run_chain(handlers: list[Handler], amount: int) -> str:
    for handler in handlers:
        result = handler(amount)
        if result is not None:
            return result
    return "Rejected"


chain: list[Handler] = [team_lead, manager, director]
for amount in (4_000, 75_000, 600_000, 5_000_000):
    print(f"₹{amount}: {run_chain(chain, amount)}")
