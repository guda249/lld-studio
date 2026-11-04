class Vehicle:
    def __init__(self, plate: str):
        self.plate = plate


class Ticket:
    def __init__(self, vehicle: Vehicle):  # 1: a required constructor argument
        self.vehicle = vehicle             # never None, never a list


ticket = Ticket(Vehicle("KA-01-1234"))
print(ticket.vehicle.plate)
try:
    Ticket()                               # no vehicle: not allowed
except TypeError as e:
    print("error:", e)
