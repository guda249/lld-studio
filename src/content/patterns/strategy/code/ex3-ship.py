from abc import ABC, abstractmethod


class ShippingStrategy(ABC):
    @abstractmethod
    def cost(self, weight_kg: float, order_total: float) -> float: ...


class StandardShipping(ShippingStrategy):
    def cost(self, weight_kg: float, order_total: float) -> float:
        return 40 + 10 * weight_kg


class ExpressShipping(ShippingStrategy):
    def cost(self, weight_kg: float, order_total: float) -> float:
        return 120 + 25 * weight_kg


class FreeAbove(ShippingStrategy):
    """Free over a threshold,
    otherwise falls back to another strategy."""

    def __init__(self, threshold: float, otherwise: ShippingStrategy):
        self.threshold, self.otherwise = threshold, otherwise

    def cost(self, weight_kg: float, order_total: float) -> float:
        if order_total >= self.threshold:
            return 0.0
        return self.otherwise.cost(weight_kg, order_total)


class Order:
    def __init__(self, total: float, weight_kg: float, shipping: ShippingStrategy):
        self.total, self.weight_kg, self.shipping = total, weight_kg, shipping

    def grand_total(self) -> float:
        return self.total + self.shipping.cost(self.weight_kg, self.total)


for shipping in (StandardShipping(), ExpressShipping(), FreeAbove(499, StandardShipping())):
    print(type(shipping).__name__, Order(650, 2, shipping).grand_total())
