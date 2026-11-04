class SeatLock:
    def __init__(self) -> None:
        self.locked: set[str] = set()

    def lock(self, seats: list[str]) -> bool:
        if any(seat in self.locked for seat in seats):
            return False
        self.locked.update(seats)
        return True

    def release(self, seats: list[str]) -> None:
        self.locked.difference_update(seats)


class PaymentGateway:
    def pay(self, upi_id: str, amount: int) -> bool:
        return not upi_id.startswith("broke")      # pretend this one bounces


class TicketService:
    def issue(self, show: str, seats: list[str]) -> str:
        return f"TICKET {show} {','.join(seats)}"


class BookingFacade:
    """Hides the order of steps AND the clean-up when a step fails."""

    def __init__(self, seats: SeatLock, payments: PaymentGateway,
                 tickets: TicketService) -> None:
        self._seats = seats
        self._payments = payments
        self._tickets = tickets

    def book(self, show: str, seats: list[str], upi_id: str, price: int) -> str:
        if not self._seats.lock(seats):
            return "Seats already taken"
        if not self._payments.pay(upi_id, price * len(seats)):
            self._seats.release(seats)              # compensate: free the seats again
            return "Payment failed, seats released"
        return self._tickets.issue(show, seats)


seat_lock = SeatLock()
bms = BookingFacade(seat_lock, PaymentGateway(), TicketService())
print(bms.book("Pushpa 2, 7 pm", ["F7", "F8"], "asha@upi", 250))
print(bms.book("Pushpa 2, 7 pm", ["F8", "F9"], "ravi@upi", 250))
print(bms.book("Pushpa 2, 7 pm", ["G1"], "broke@upi", 250))
print("locked seats:", sorted(seat_lock.locked))
