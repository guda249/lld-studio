class Vehicle:
    def __init__(self, plate: str):
        self.plate = plate


class Ticket:
    def __init__(self, id: str, hours: int, vehicle: Vehicle):
        self._id = id                     # - id: String
        self._hours = hours               # - hours: Integer
        self._vehicle = vehicle           # - vehicle: Vehicle (also drawn as a line)

    def summary(self) -> str:
        return f"{self._id}: {self._vehicle.plate} for {self._hours} h"


print(Ticket("T-7", 3, Vehicle("KA-01-1234")).summary())   # T-7: KA-01-1234 for 3 h
