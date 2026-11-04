import threading


class SeatCounter:
    """One counter per show. Its creation is thread-safe; is its method too?"""

    _instance: "SeatCounter | None" = None
    _create_lock = threading.Lock()
    _last: int
    _seat_lock: threading.Lock

    @classmethod
    def get(cls) -> "SeatCounter":
        if cls._instance is None:
            with cls._create_lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    instance._last = 0
                    instance._seat_lock = threading.Lock()
                    cls._instance = instance
        return cls._instance

    def reset(self) -> None:
        self._last = 0  # demo only: start each run with an empty hall

    def next_seat_unlocked(self, pause: threading.Barrier) -> int:
        current = self._last  # read ...
        pause.wait()  # demo only: every booking reads before anyone writes
        self._last = current + 1  # ... then write: the other bookings' updates are lost
        return current + 1

    def next_seat_locked(self, pause: threading.Barrier) -> int:
        pause.wait()
        with self._seat_lock:  # read and write as one step
            self._last += 1
            return self._last


def run(locked: bool, bookings: int) -> str:
    counter = SeatCounter.get()
    counter.reset()
    pause = threading.Barrier(bookings, timeout=2)
    seats: list[int] = []
    book = counter.next_seat_locked if locked else counter.next_seat_unlocked
    threads = [threading.Thread(target=lambda: seats.append(book(pause))) for _ in range(bookings)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    if len(set(seats)) == bookings:
        return f"{bookings} bookings, seats 1 to {max(seats)}"
    if len(set(seats)) == 1:
        return f"{bookings} bookings, all got seat {seats[0]}"
    return f"{bookings} bookings, {len(set(seats))} distinct seats"


for locked in [False, True]:
    for bookings in [2, 4]:
        print(f"{'locked' if locked else 'unlocked'} next_seat, {run(locked, bookings)}")
print(f"Same counter throughout: {SeatCounter.get() is SeatCounter.get()}")
