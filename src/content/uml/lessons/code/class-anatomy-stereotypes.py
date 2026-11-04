from abc import ABC, abstractmethod
from enum import Enum


class PaymentMethod(ABC):                 # «interface»: only promises
    @abstractmethod
    def pay(self, amount: float) -> str: ...


class BasePayment(PaymentMethod):         # «abstract»: shared code, can't be created
    def pay(self, amount: float) -> str:
        return f"{self._label()} paid {amount}"

    @abstractmethod
    def _label(self) -> str: ...


class CardType(Enum):                     # «enumeration»: a fixed list of values
    VISA = "Visa"
    RUPAY = "RuPay"


class Card(BasePayment):
    def __init__(self, kind: CardType):
        self._kind = kind

    def _label(self) -> str:
        return f"{self._kind.value} card"


method: PaymentMethod = Card(CardType.RUPAY)
print(method.pay(250.0))                  # RuPay card paid 250.0
