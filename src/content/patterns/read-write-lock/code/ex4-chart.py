import threading
from collections.abc import Callable, Iterator
from contextlib import contextmanager


class ReadWriteLock:
    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._readers = 0
        self._writing = False

    @contextmanager
    def read(self) -> Iterator[None]:
        with self._cond:
            while self._writing:
                self._cond.wait()
            self._readers += 1
        try:
            yield
        finally:
            with self._cond:
                self._readers -= 1
                self._cond.notify_all()

    @contextmanager
    def write(self) -> Iterator[None]:
        with self._cond:
            while self._writing or self._readers:
                self._cond.wait()
            self._writing = True
        try:
            yield
        finally:
            with self._cond:
                self._writing = False
                self._cond.notify_all()


class PatientChart:
    """Doctors' screens read blood pressure all day; a nurse records a new reading now and then."""

    def __init__(self) -> None:
        self._lock = ReadWriteLock()
        self.systolic = 120
        self.diastolic = 80

    def bp_with_lock(self) -> str:
        with self._lock.read():
            return f"{self.systolic}/{self.diastolic}"

    def bp_without_lock(self) -> str:
        return f"{self.systolic}/{self.diastolic}"

    def record_bp(self, systolic: int, diastolic: int, halfway: Callable[[], object]) -> None:
        with self._lock.write():
            self.systolic = systolic
            halfway()  # demo only: pause between the two fields
            self.diastolic = diastolic


def describe(bp: str) -> str:
    return {"120/80": "120/80 (old reading)", "135/90": "135/90 (new reading)"}.get(bp, f"{bp} (torn: never measured)")


def run(use_lock: bool, when: str) -> str:
    chart = PatientChart()
    read = chart.bp_with_lock if use_lock else chart.bp_without_lock
    if when == "before":
        return describe(read())
    if when == "after":
        chart.record_bp(135, 90, lambda: None)
        return describe(read())
    half, go, seen = threading.Event(), threading.Event(), []
    nurse = threading.Thread(target=chart.record_bp, args=(135, 90, lambda: (half.set(), go.wait())))
    nurse.start()
    half.wait()  # the nurse has written systolic but not diastolic yet
    doctor = threading.Thread(target=lambda: seen.append(read()))
    doctor.start()
    if not use_lock:
        doctor.join()  # nothing stops the doctor: it reads the half-written chart
    go.set()
    nurse.join()
    doctor.join()  # with the read lock, the doctor waited for the whole update
    return describe(seen[0])


for use_lock in [False, True]:
    for when in ["before", "during", "after"]:
        print(f"{'read lock' if use_lock else 'no lock':>9}, {when:<6} the update: {run(use_lock, when)}")
