# Imagine this first part is flags.py. Python runs a module once, so every
# `from flags import flags` gets this same object: a singleton with no extra code.
class FeatureFlags:
    def __init__(self) -> None:
        self._on: set[str] = {"live_proctoring"}

    def enable(self, name: str) -> None:
        self._on.add(name)

    def disable(self, name: str) -> None:
        self._on.discard(name)

    def is_on(self, name: str) -> bool:
        return name in self._on


flags = FeatureFlags()


# Imagine this is exam_service.py, which does `from flags import flags`.
def start_exam(student: str) -> str:
    mode = "with webcam proctoring" if flags.is_on("live_proctoring") else "without proctoring"
    extra = " + 10 min extra time" if flags.is_on("extra_time") else ""
    return f"{student} starts the exam {mode}{extra}"


print(start_exam("Ravi"))


# The downside: global mutable state leaks from one test into the next.
def test_extra_time() -> str:
    flags.enable("extra_time")  # forgot to switch it off again
    return start_exam("test-student")


def test_default_exam() -> str:
    return start_exam("test-student")  # expects no extra time


print(f"test_extra_time:   {test_extra_time()}")
print(f"test_default_exam: {test_default_exam()}  <- polluted by the test before")
flags.disable("extra_time")
print(f"after manual reset: {start_exam('test-student')}")
