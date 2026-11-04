import threading
from queue import Empty, Full, Queue


class TicketRail:                               # the bounded buffer between waiters and chefs
    def __init__(self, capacity: int, policy: str) -> None:
        self._tickets: Queue[str] = Queue(maxsize=capacity)
        self._policy = policy
        self.turned_away: list[str] = []

    def add(self, order: str) -> None:          # waiter (producer) side
        try:
            self._tickets.put_nowait(order)
        except Full:
            if self._policy == "reject":        # say "kitchen busy" to the newest order
                self.turned_away.append(order)
            else:                               # "drop oldest": make room for the newest order
                self.turned_away.append(self._tickets.get_nowait())
                self._tickets.put_nowait(order)

    def take(self) -> str | None:               # chef (consumer) side
        try:
            return self._tickets.get_nowait()
        except Empty:
            return None


def chef(rail: TicketRail, cooked: list[str], lock: threading.Lock) -> None:
    while (order := rail.take()) is not None:
        with lock:
            cooked.append(order)


def friday_rush(capacity: int, policy: str) -> str:
    rail = TicketRail(capacity, policy)
    for order in ["#101", "#102", "#103", "#104", "#105"]:
        rail.add(order)                         # both chefs are still busy, so nothing is taken yet
    cooked: list[str] = []
    lock = threading.Lock()
    chefs = [threading.Thread(target=chef, args=(rail, cooked, lock)) for _ in range(2)]
    for c in chefs:
        c.start()
    for c in chefs:
        c.join()
    return f"cooked {' '.join(sorted(cooked))} | away {' '.join(rail.turned_away)}"


if __name__ == "__main__":
    for capacity in (2, 3, 4):
        for policy in ("reject", "drop oldest"):
            print(f"rail of {capacity}, {policy}: {friday_rush(capacity, policy)}")
