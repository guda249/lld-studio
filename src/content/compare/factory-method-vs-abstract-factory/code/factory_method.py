from abc import ABC, abstractmethod


class Vehicle(ABC):                           # product
    @abstractmethod
    def carry(self, parcel: str) -> str: ...


class Bike(Vehicle):
    def carry(self, parcel: str) -> str:
        return f"{parcel} by bike"


class Truck(Vehicle):
    def carry(self, parcel: str) -> str:
        return f"{parcel} by truck"


class Delivery(ABC):                          # creator: the shared steps live here
    @abstractmethod
    def create_vehicle(self) -> Vehicle: ...  # the factory method: ONE product

    def deliver(self, parcel: str) -> str:
        vehicle: Vehicle = self.create_vehicle()       # a subclass decides which vehicle
        return f"Delivered {vehicle.carry(parcel)}"


class CityDelivery(Delivery):
    def create_vehicle(self) -> Vehicle:
        return Bike()


class FreightDelivery(Delivery):
    def create_vehicle(self) -> Vehicle:
        return Truck()


if __name__ == "__main__":
    for delivery in [CityDelivery(), FreightDelivery()]:
        print(delivery.deliver("books"))
