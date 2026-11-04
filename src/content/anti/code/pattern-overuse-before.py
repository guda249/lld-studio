# Before: an interface, three classes and a factory to look up a number per zone.
from abc import ABC, abstractmethod


class ShippingFeeStrategy(ABC):
    @abstractmethod
    def fee(self, total: int) -> int: ...


class MetroFee(ShippingFeeStrategy):
    def fee(self, total: int) -> int:
        return 40


class TownFee(ShippingFeeStrategy):
    def fee(self, total: int) -> int:
        return 60


class RemoteFee(ShippingFeeStrategy):
    def fee(self, total: int) -> int:
        return 120


class ShippingFeeFactory:  # "in case we add plugins later" (nobody has)
    _registry: dict[str, type[ShippingFeeStrategy]] = {"metro": MetroFee, "town": TownFee, "remote": RemoteFee}

    def create(self, zone: str) -> ShippingFeeStrategy:
        return self._registry[zone]()


if __name__ == "__main__":
    factory = ShippingFeeFactory()
    for zone in ["metro", "town", "remote"]:
        print(zone, factory.create(zone).fee(800))
