from abc import ABC, abstractmethod

class Vehicle(ABC):                           # product 1
    @abstractmethod
    def carry(self, parcel: str) -> str: ...

class Package(ABC):                           # product 2: must MATCH the vehicle
    @abstractmethod
    def wrap(self, item: str) -> str: ...

class Bike(Vehicle):
    def carry(self, parcel: str) -> str:
        return f"{parcel} by bike"

class Truck(Vehicle):
    def carry(self, parcel: str) -> str:
        return f"{parcel} by truck"

class Pouch(Package):
    def wrap(self, item: str) -> str:
        return f"{item} in a pouch"

class Crate(Package):
    def wrap(self, item: str) -> str:
        return f"{item} in a crate"

class DeliveryKit(ABC):                       # abstract factory: one method per product
    @abstractmethod
    def create_vehicle(self) -> Vehicle: ...

    @abstractmethod
    def create_package(self) -> Package: ...

class CityKit(DeliveryKit):                   # family 1: bike + pouch
    def create_vehicle(self) -> Vehicle:
        return Bike()

    def create_package(self) -> Package:
        return Pouch()

class FreightKit(DeliveryKit):                # family 2: truck + crate
    def create_vehicle(self) -> Vehicle:
        return Truck()

    def create_package(self) -> Package:
        return Crate()

class Dispatcher:                             # client: gets a whole kit, can't mix families
    def __init__(self, kit: DeliveryKit) -> None:
        self._kit = kit

    def send(self, item: str) -> str:
        package: Package = self._kit.create_package()
        vehicle: Vehicle = self._kit.create_vehicle()
        return f"Delivered {vehicle.carry(package.wrap(item))}"


if __name__ == "__main__":
    for kit in [CityKit(), FreightKit()]:
        print(Dispatcher(kit).send("books"))
