class Card:
    def charge(self, amount: float) -> bool:
        print(f"charged {amount}")
        return True


class Ticket:
    def __init__(self, hours: int):
        self._hours = hours

    def fee(self, rate: float) -> float:          # + fee(rate: Real): Real
        return self._hours * rate

    def pay(self, card: Card) -> bool:            # + pay(card: Card): Boolean
        return card.charge(self.fee(40.0))


print(Ticket(3).pay(Card()))                      # charged 120.0, then True
