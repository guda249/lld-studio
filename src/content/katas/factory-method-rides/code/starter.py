class Bike:
    def fare(self, km: float) -> float:
        return 1.0 + 0.5 * km

    def label(self) -> str:
        return "bike"


class Car:
    def fare(self, km: float) -> float:
        return 3.0 + 1.2 * km

    def label(self) -> str:
        return "car"


class RideBooking:
    def __init__(self, kind: str) -> None:
        self.kind = kind

    def quote(self, km: float) -> str:
        # every new vehicle type means editing this method
        if self.kind == "bike":
            vehicle = Bike()
        elif self.kind == "car":
            vehicle = Car()
        else:
            raise ValueError(f"unknown ride: {self.kind}")
        return f"{vehicle.label()} for {km} km: ${vehicle.fare(km):.2f}"


if __name__ == "__main__":
    for kind in ("bike", "car"):
        print(RideBooking(kind).quote(4.0))
