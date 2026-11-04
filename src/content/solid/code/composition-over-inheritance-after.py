# After: Logger HAS a formatter and a sink. Mix any format with any destination.
from abc import ABC, abstractmethod


class Formatter(ABC):  # how a line looks
    @abstractmethod
    def format(self, msg: str) -> str: ...


class Sink(ABC):  # where a line goes
    @abstractmethod
    def write(self, line: str) -> None: ...


class PlainFormatter(Formatter):
    def format(self, msg: str) -> str:
        return msg


class TimestampFormatter(Formatter):
    def format(self, msg: str) -> str:
        return f"[09:30] {msg}"


class ConsoleSink(Sink):
    def write(self, line: str) -> None:
        print(line)


class MemorySink(Sink):  # stands in for a file
    def __init__(self) -> None:
        self.lines: list[str] = []

    def write(self, line: str) -> None:
        self.lines.append(line)


class Logger:
    def __init__(self, formatter: Formatter, sink: Sink) -> None:
        self.formatter = formatter  # parts are handed in, so they can be swapped
        self._sink = sink

    def log(self, msg: str) -> None:
        self._sink.write(self.formatter.format(msg))  # delegate both jobs


if __name__ == "__main__":
    Logger(TimestampFormatter(), ConsoleSink()).log("server started")
    memory = MemorySink()
    log = Logger(TimestampFormatter(), memory)
    log.log("disk 91% full")
    log.formatter = PlainFormatter()  # change behaviour at runtime: no new class
    log.log("disk cleaned")
    print(memory.lines)
