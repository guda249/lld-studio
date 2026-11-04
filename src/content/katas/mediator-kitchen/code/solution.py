from abc import ABC, abstractmethod


class Kitchen(ABC):
    """The mediator interface: the only thing waiters and stations know about."""

    @abstractmethod
    def order(self, table: int) -> None: ...

    @abstractmethod
    def dish_ready(self, station: str, table: int) -> None: ...


class Waiter:
    def __init__(self, kitchen: Kitchen) -> None:
        self.kitchen = kitchen

    def take_order(self, table: int) -> None:
        self.kitchen.order(table)

    def serve(self, table: int) -> None:
        print(f"table {table}: served")


class Station:
    def __init__(self, kitchen: Kitchen, name: str, dish: str) -> None:
        self.kitchen = kitchen
        self.name = name
        self.dish = dish

    def finish(self, table: int) -> None:
        print(f"  {self.name}: {self.dish} for table {table} ready")
        self.kitchen.dish_ready(self.name, table)


class KitchenPass(Kitchen):
    """The concrete mediator: knows every station and the waiter, and owns the rule "serve when all dishes are ready"."""

    def __init__(self) -> None:
        self.stations: list[Station] = []
        self.waiter: Waiter | None = None
        self.waiting: dict[int, set[str]] = {}

    def add_station(self, station: Station) -> None:
        self.stations.append(station)

    def order(self, table: int) -> None:
        names = [s.name for s in self.stations]
        print(f"table {table}: order sent to {' and '.join(names)}")
        self.waiting[table] = set(names)   # the kitchen, not the stations, tracks what is still cooking

    def dish_ready(self, station: str, table: int) -> None:
        self.waiting[table].discard(station)
        if not self.waiting[table] and self.waiter is not None:
            self.waiter.serve(table)


if __name__ == "__main__":
    kitchen = KitchenPass()
    waiter = Waiter(kitchen)
    kitchen.waiter = waiter
    grill, fryer = Station(kitchen, "grill", "burger"), Station(kitchen, "fryer", "fries")
    kitchen.add_station(grill)
    kitchen.add_station(fryer)     # a drinks bar would be one more line here
    waiter.take_order(1)
    waiter.take_order(2)
    grill.finish(1)
    fryer.finish(2)
    fryer.finish(1)
    grill.finish(2)
