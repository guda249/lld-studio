from abc import ABC, abstractmethod
from collections.abc import Callable

Sink = Callable[[str], None]  # implementation side: where a line goes (just a function)
LEVELS = {"DEBUG": 10, "INFO": 20, "ERROR": 40}


def console_sink(line: str) -> None:
    print(f"  console | {line}")


class Logger(ABC):  # abstraction side: what is logged and how it looks
    def __init__(self, sink: Sink) -> None:
        self._sink = sink  # the bridge

    @abstractmethod
    def log(self, level: str, message: str) -> None: ...


class AppLogger(Logger):
    def __init__(self, sink: Sink, min_level: str = "INFO") -> None:
        super().__init__(sink)
        self._min_level = min_level

    def log(self, level: str, message: str) -> None:
        if LEVELS[level] >= LEVELS[self._min_level]:  # filters noisy levels
            self._sink(f"{level:<5} {message}")


class AuditLogger(Logger):
    def __init__(self, sink: Sink, user: str) -> None:
        super().__init__(sink)
        self._user = user

    def log(self, level: str, message: str) -> None:
        self._sink(f"AUDIT user={self._user} {level} {message}")  # never filtered


app = AppLogger(console_sink)
app.log("DEBUG", "cache warmed")  # dropped by the INFO filter
app.log("INFO", "server started on port 8080")
app.log("ERROR", "payment service timed out")

audit_buffer: list[str] = []
audit = AuditLogger(audit_buffer.append, user="admin@shop")  # same logger, in-memory sink
audit.log("INFO", "changed refund limit to ₹5,000")
audit.log("DEBUG", "viewed customer 1042")
print(f"Audit buffer holds {len(audit_buffer)} lines, first: {audit_buffer[0]}")

AuditLogger(console_sink, user="ops").log("INFO", "rotated API keys")  # audit logger, console sink
