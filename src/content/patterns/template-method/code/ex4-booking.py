from abc import ABC, abstractmethod


class BookingFlow(ABC):
    def book(self, traveller: str, price: int) -> str:   # the template method
        self.hold_inventory()
        if self.needs_id_check():                         # optional step, switched by a hook
            print(f"  ID check passed for {traveller}")
        print(f"  charged ₹{price + self.convenience_fee():,}")
        return self.create_ticket(traveller)              # a factory-method step

    @abstractmethod
    def hold_inventory(self) -> None: ...

    @abstractmethod
    def create_ticket(self, traveller: str) -> str: ...

    def needs_id_check(self) -> bool:                     # hook
        return False

    def convenience_fee(self) -> int:                     # hook
        return 0


class FlightBooking(BookingFlow):
    def hold_inventory(self) -> None:
        print("  seat 14C held on BLR -> DEL")

    def needs_id_check(self) -> bool:
        return True

    def convenience_fee(self) -> int:
        return 350

    def create_ticket(self, traveller: str) -> str:
        return f"Boarding pass: {traveller}, BLR -> DEL, seat 14C"


class HotelBooking(BookingFlow):
    def hold_inventory(self) -> None:
        print("  room 204 held in Jaipur for 2 nights")

    def create_ticket(self, traveller: str) -> str:
        return f"Hotel voucher: {traveller}, Jaipur, room 204"


for flow in (FlightBooking(), HotelBooking()):
    print(type(flow).__name__)
    print(" ", flow.book("Karan", 5400))
