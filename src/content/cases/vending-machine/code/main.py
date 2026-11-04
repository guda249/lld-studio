from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class Coin(Enum):
    ONE = 1
    TWO = 2
    FIVE = 5
    TEN = 10


@dataclass(frozen=True)
class Product:
    name: str
    price: int


class StockObserver(ABC):
    """Observer: hears when a slot runs empty."""

    @abstractmethod
    def on_empty(self, code: str, product: Product) -> None: ...


class RefillAlert(StockObserver):
    def on_empty(self, code: str, product: Product) -> None:
        print(f"  [alert] slot {code} ({product.name}) is empty: please refill")


class Inventory:
    def __init__(self):
        self._items: dict[str, Product] = {}
        self._counts: dict[str, int] = {}
        self._observers: list[StockObserver] = []

    def subscribe(self, observer: StockObserver) -> None:
        self._observers.append(observer)

    def add(self, code: str, product: Product, count: int) -> None:
        self._items[code] = product
        self._counts[code] = self._counts.get(code, 0) + count

    def product(self, code: str) -> Product | None:
        return self._items.get(code)

    def count(self, code: str) -> int:
        return self._counts.get(code, 0)

    def total(self) -> int:
        return sum(self._counts.values())

    def take(self, code: str) -> Product:
        self._counts[code] -= 1
        if self._counts[code] == 0:
            for o in self._observers:
                o.on_empty(code, self._items[code])
        return self._items[code]


class ChangeStrategy(ABC):
    """Strategy: which coins to give back. Returns None when the box can't make the amount."""

    @abstractmethod
    def make_change(self, amount: int, box: dict[Coin, int]) -> list[Coin] | None: ...


class GreedyChange(ChangeStrategy):
    """Biggest coin first. Fast, and right for most coin sets, but can miss an answer when coins run low."""

    def make_change(self, amount: int, box: dict[Coin, int]) -> list[Coin] | None:
        out: list[Coin] = []
        for coin in sorted(box, key=lambda c: c.value, reverse=True):
            take = min(box[coin], amount // coin.value)
            out += [coin] * take
            amount -= take * coin.value
        return out if amount == 0 else None


class VendingState(ABC):
    """State: what each button does depends on what the machine is doing."""

    @abstractmethod
    def insert_coin(self, machine: VendingMachine, coin: Coin) -> None: ...

    @abstractmethod
    def select(self, machine: VendingMachine, code: str) -> None: ...

    @abstractmethod
    def cancel(self, machine: VendingMachine) -> None: ...

    @abstractmethod
    def dispense(self, machine: VendingMachine) -> None: ...


class IdleState(VendingState):
    def insert_coin(self, machine: VendingMachine, coin: Coin) -> None:
        machine.accept(coin)
        machine.set_state(HasMoneyState())

    def select(self, machine: VendingMachine, code: str) -> None:
        print("  insert coins first")

    def cancel(self, machine: VendingMachine) -> None:
        print("  nothing to cancel")

    def dispense(self, machine: VendingMachine) -> None:
        print("  nothing to dispense")


class HasMoneyState(VendingState):
    def insert_coin(self, machine: VendingMachine, coin: Coin) -> None:
        machine.accept(coin)

    def select(self, machine: VendingMachine, code: str) -> None:
        product = machine.inventory.product(code)
        if product is None or machine.inventory.count(code) == 0:
            print(f"  {code} is not available, pick another")
            return
        if machine.balance < product.price:
            print(f"  {product.name} costs {product.price}, insert {product.price - machine.balance} more")
            return
        change = machine.change.make_change(machine.balance - product.price, machine.box_after_payment())
        if change is None:
            print("  can't make change for that: use exact money or cancel")
            return
        machine.set_state(DispensingState(code, change))
        machine.dispense()

    def cancel(self, machine: VendingMachine) -> None:
        print(f"  refund {machine.refund()}")
        machine.set_state(IdleState())

    def dispense(self, machine: VendingMachine) -> None:
        print("  select a product first")


class DispensingState(VendingState):
    def __init__(self, code: str, change: list[Coin]):
        self.code = code
        self.coins = change

    def insert_coin(self, machine: VendingMachine, coin: Coin) -> None:
        print(f"  busy, returning {coin.value}")

    def select(self, machine: VendingMachine, code: str) -> None:
        print("  busy, please wait")

    def cancel(self, machine: VendingMachine) -> None:
        print("  too late to cancel")

    def dispense(self, machine: VendingMachine) -> None:
        product = machine.inventory.take(self.code)
        machine.pay_out(self.coins)
        print(f"  -> {product.name}, change {[c.value for c in self.coins]}")
        machine.set_state(SoldOutState() if machine.inventory.total() == 0 else IdleState())


class SoldOutState(VendingState):
    def insert_coin(self, machine: VendingMachine, coin: Coin) -> None:
        print(f"  sold out, returning {coin.value}")

    def select(self, machine: VendingMachine, code: str) -> None:
        print("  sold out")

    def cancel(self, machine: VendingMachine) -> None:
        print("  nothing to cancel")

    def dispense(self, machine: VendingMachine) -> None:
        print("  nothing to dispense")


class VendingMachine:
    def __init__(self, inventory: Inventory, change: ChangeStrategy):
        self.inventory = inventory
        self.change = change
        self._state: VendingState = IdleState() if inventory.total() else SoldOutState()
        self.box: dict[Coin, int] = {c: 2 for c in Coin}     # float of coins for change
        self._inserted: list[Coin] = []

    @property
    def balance(self) -> int:
        return sum(c.value for c in self._inserted)

    def set_state(self, state: VendingState) -> None:
        print(f"  ({type(self._state).__name__} -> {type(state).__name__})")
        self._state = state

    # buttons: each one is forwarded to the current state
    def insert_coin(self, coin: Coin) -> None: self._state.insert_coin(self, coin)
    def select(self, code: str) -> None: self._state.select(self, code)
    def cancel(self) -> None: self._state.cancel(self)
    def dispense(self) -> None: self._state.dispense(self)

    # helpers the states use
    def accept(self, coin: Coin) -> None:
        self._inserted.append(coin)
        print(f"  balance {self.balance}")

    def box_after_payment(self) -> dict[Coin, int]:
        box = dict(self.box)
        for c in self._inserted:
            box[c] += 1
        return box

    def pay_out(self, change: list[Coin]) -> None:
        self.box = self.box_after_payment()
        for c in change:
            self.box[c] -= 1
        self._inserted = []

    def refund(self) -> list[int]:
        coins, self._inserted = [c.value for c in self._inserted], []
        return coins

    def restock(self, code: str, product: Product, count: int) -> None:
        was_empty = self.inventory.total() == 0
        self.inventory.add(code, product, count)
        if was_empty:
            self.set_state(IdleState())


if __name__ == "__main__":
    stock = Inventory()
    stock.subscribe(RefillAlert())
    stock.add("A1", Product("Water", 15), 1)
    stock.add("B1", Product("Chips", 20), 1)
    vm = VendingMachine(stock, GreedyChange())

    print("1) buy water with 10 + 10")
    for coin in (Coin.TEN, Coin.TEN):
        vm.insert_coin(coin)
    vm.select("A1")
    print("2) not enough money, then cancel")
    vm.insert_coin(Coin.TEN)
    vm.select("B1")
    vm.cancel()
    print("3) buy the last chips with exact money")
    vm.insert_coin(Coin.TEN)
    vm.insert_coin(Coin.TEN)
    vm.select("B1")
    print("4) machine is empty")
    vm.insert_coin(Coin.FIVE)
    vm.restock("A1", Product("Water", 15), 3)
    vm.insert_coin(Coin.TEN)
