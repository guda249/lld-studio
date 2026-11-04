from abc import ABC, abstractmethod


class Customer:
    def __init__(self, name: str):
        self.name = name

    def discount(self) -> float:
        return 0.0


class VipCustomer(Customer):             # is-a: inheritance (solid line, hollow triangle)
    def discount(self) -> float:
        return 0.1


class Notifier(ABC):                     # only abstract methods: an interface
    @abstractmethod
    def send(self, text: str) -> None: ...


class EmailNotifier(Notifier):           # can-do: realization (dashed line, hollow triangle)
    def send(self, text: str) -> None:
        print(f"Email: {text}")


EmailNotifier().send(f"VIP discount is {VipCustomer('Asha').discount():.0%}")
