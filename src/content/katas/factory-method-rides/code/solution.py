from abc import ABC, abstractmethod


class Vehicle(ABC):
    @abstractmethod
    def fare(self, km: float) -> float: ...

    @abstractmethod
    def label(self) -> str: ...


class Bike(Vehicle):
    def fare(self, km: float) -> float:
        return 1.0 + 0.5 * km

    def label(self) -> str:
        return "bike"


class Car(Vehicle):
    def fare(self, km: float) -> float:
        return 3.0 + 1.2 * km

    def label(self) -> str:
        return "car"


class RideBooking(ABC):
    @abstractmethod
    def create_vehicle(self) -> Vehicle:  # the factory method
        ...

    def quote(self, km: float) -> str:  # shared logic, never changes
        vehicle = self.create_vehicle()
        return f"{vehicle.label()} for {km} km: ${vehicle.fare(km):.2f}"


class BikeBooking(RideBooking):
    def create_vehicle(self) -> Vehicle:
        return Bike()


class CarBooking(RideBooking):
    def create_vehicle(self) -> Vehicle:
        return Car()


if __name__ == "__main__":
    for booking in (BikeBooking(), CarBooking()):
        print(booking.quote(4.0))
