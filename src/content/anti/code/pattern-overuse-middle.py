# The middle step: when each zone needs its own rule (not just a number), a dict of functions.
from collections.abc import Callable


def metro(total: int) -> int:
    return 0 if total > 499 else 40


def remote(total: int) -> int:
    return 120 + total // 100  # a surcharge that grows with the order


FEE_RULES: dict[str, Callable[[int], int]] = {"metro": metro, "town": lambda total: 60, "remote": remote}

if __name__ == "__main__":
    for zone, rule in FEE_RULES.items():
        print(zone, rule(800))
