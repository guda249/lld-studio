from abc import ABC, abstractmethod


class PricingStrategy(ABC):
    @abstractmethod
    def fare(self, km: float, minutes: float) -> float: ...


class NormalPricing(PricingStrategy):
    def fare(self, km: float, minutes: float) -> float:
        return 50 + 12 * km + 1.5 * minutes


class SurgePricing(PricingStrategy):
    def __init__(self, multiplier: float):
        self.multiplier = multiplier

    def fare(self, km: float, minutes: float) -> float:
        return NormalPricing().fare(km, minutes) * self.multiplier


class PoolPricing(PricingStrategy):
    def fare(self, km: float, minutes: float) -> float:
        return NormalPricing().fare(km, minutes) * 0.7    # shared ride discount


class Ride:
    def __init__(self, pricing: PricingStrategy):
        self.pricing = pricing

    def quote(self, km: float, minutes: float) -> str:
        return f"₹{self.pricing.fare(km, minutes):.0f}"


for pricing in (NormalPricing(), SurgePricing(1.8), PoolPricing()):
    print(type(pricing).__name__, Ride(pricing).quote(km=8, minutes=25))
