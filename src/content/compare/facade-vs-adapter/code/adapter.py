# Adapter: Checkout already expects a Shipper. The courier's one SDK class has a different interface.
from abc import ABC, abstractmethod


class Shipper(ABC):  # target: the interface Checkout was written against
    @abstractmethod
    def ship(self, order_id: str, weight_kg: float, pincode: str) -> str: ...


class QuickCourierClient:  # adaptee: the courier's SDK class; we can't change it
    def create_consignment(self, ref: str, grams: int, pin: int) -> dict[str, str]:
        return {"awb": f"QC{pin}-{grams}", "eta_days": "2"}


class QuickCourierAdapter(Shipper):  # adapter: translates names, units and the reply
    def __init__(self, client: QuickCourierClient) -> None:
        self._client = client

    def ship(self, order_id: str, weight_kg: float, pincode: str) -> str:
        grams = round(weight_kg * 1000)
        reply = self._client.create_consignment(order_id, grams, int(pincode))
        return f"{order_id}: tracking {reply['awb']}, {reply['eta_days']} days"


class Checkout:  # client: only knows Shipper
    def __init__(self, shipper: Shipper) -> None:
        self._shipper = shipper

    def complete(self, order_id: str, weight_kg: float, pincode: str) -> str:
        return "Order placed. " + self._shipper.ship(order_id, weight_kg, pincode)


if __name__ == "__main__":
    checkout = Checkout(QuickCourierAdapter(QuickCourierClient()))
    print(checkout.complete("A101", 1.2, "560001"))
    print(checkout.complete("A102", 0.4, "700019"))
