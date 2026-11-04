import itertools
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Callable


class Level(Enum):
    DEBUG = 10
    INFO = 20
    WARN = 30
    ERROR = 40


@dataclass(frozen=True)
class LogRecord:
    """One log event. `tick` stands in for a timestamp so the demo output never changes."""
    tick: int
    level: Level
    logger: str
    message: str


class Formatter(ABC):
    """Strategy: how a record becomes a line of text."""

    @abstractmethod
    def format(self, record: LogRecord) -> str: ...


class PlainFormatter(Formatter):
    def format(self, record: LogRecord) -> str:
        return f"#{record.tick} {record.level.name:<5} {record.logger}: {record.message}"


class JsonFormatter(Formatter):
    def format(self, record: LogRecord) -> str:
        return json.dumps({"tick": record.tick, "level": record.level.name,
                           "logger": record.logger, "msg": record.message})


class Appender(ABC):
    """Observer: a destination that receives every record its logger publishes."""

    @abstractmethod
    def append(self, record: LogRecord) -> None: ...


class ConsoleAppender(Appender):
    def __init__(self, formatter: Formatter, min_level: Level = Level.DEBUG) -> None:
        self._formatter = formatter
        self._min_level = min_level

    def append(self, record: LogRecord) -> None:
        if record.level.value >= self._min_level.value:
            print("  console |", self._formatter.format(record))


class MemoryAppender(Appender):
    """Keeps lines in a list: handy in tests, and a stand-in for a file."""

    def __init__(self, formatter: Formatter) -> None:
        self._formatter = formatter
        self.lines: list[str] = []

    def append(self, record: LogRecord) -> None:
        self.lines.append(self._formatter.format(record))


class BufferedAppender(Appender):
    """Decorator: same interface, holds records and passes them on in batches (fewer slow writes)."""

    def __init__(self, inner: Appender, batch_size: int) -> None:
        self._inner = inner
        self._batch_size = batch_size
        self._pending: list[LogRecord] = []

    def append(self, record: LogRecord) -> None:
        self._pending.append(record)
        if len(self._pending) >= self._batch_size or record.level is Level.ERROR:
            self.flush()  # errors never wait in the buffer

    def flush(self) -> None:
        for record in self._pending:
            self._inner.append(record)
        self._pending.clear()


class Logger:
    """Named logger. Records go to its own appenders, then up the chain to its parent's."""

    def __init__(self, name: str, parent: "Logger | None", clock: Callable[[], int]) -> None:
        self.name = name
        self.level: Level | None = None  # None means: use the parent's level
        self.propagate = True
        self._parent = parent
        self._clock = clock
        self._appenders: list[Appender] = []

    def add_appender(self, appender: Appender) -> None:
        self._appenders.append(appender)

    def effective_level(self) -> Level:
        if self.level is not None or self._parent is None:
            return self.level or Level.INFO
        return self._parent.effective_level()

    def log(self, level: Level, message: str) -> None:
        if level.value < self.effective_level().value:
            return  # cheap early exit: no record is built
        self._publish(LogRecord(self._clock(), level, self.name, message))

    def _publish(self, record: LogRecord) -> None:
        for appender in self._appenders:
            appender.append(record)
        if self.propagate and self._parent is not None:
            self._parent._publish(record)  # chain of responsibility, up to root

    def debug(self, message: str) -> None:
        self.log(Level.DEBUG, message)

    def info(self, message: str) -> None:
        self.log(Level.INFO, message)

    def warn(self, message: str) -> None:
        self.log(Level.WARN, message)

    def error(self, message: str) -> None:
        self.log(Level.ERROR, message)


class LogManager:
    """Singleton: one registry, so every get_logger("app.db") returns the same Logger."""
    _instance: "LogManager | None" = None

    def __init__(self) -> None:
        self._ticks = itertools.count(1)
        self._loggers: dict[str, Logger] = {"": Logger("root", None, self._tick)}

    @classmethod
    def instance(cls) -> "LogManager":
        if cls._instance is None:
            cls._instance = LogManager()
        return cls._instance

    def _tick(self) -> int:
        return next(self._ticks)

    def root(self) -> Logger:
        return self._loggers[""]

    def get_logger(self, name: str) -> Logger:
        if name not in self._loggers:
            parent_name = name.rpartition(".")[0]  # "app.db" -> "app" -> "" (root)
            parent = self.get_logger(parent_name)
            self._loggers[name] = Logger(name, parent, self._tick)
        return self._loggers[name]


if __name__ == "__main__":
    manager = LogManager.instance()
    manager.root().add_appender(ConsoleAppender(PlainFormatter()))
    audit = MemoryAppender(JsonFormatter())
    buffered = BufferedAppender(audit, batch_size=10)
    manager.get_logger("app.payments").add_appender(buffered)

    db = manager.get_logger("app.db")
    payments = LogManager.instance().get_logger("app.payments")
    print("same logger:", payments is manager.get_logger("app.payments"))
    print("app.db level:", db.effective_level().name, "(inherited from root)")

    db.debug("connection pool warmed up")  # below INFO: dropped before a record exists
    db.info("connected to orders-db")
    payments.info("charge 120.00 for order 17")
    payments.warn("retrying card for order 18")
    print("audit lines while buffered:", len(audit.lines))
    payments.error("card declined for order 18")  # an error flushes the buffer at once

    manager.get_logger("app").level = Level.DEBUG
    db.debug("query took 4 ms")  # now app.db inherits DEBUG from app
    print("\naudit trail (JSON, written in one batch):")
    for line in audit.lines:
        print("  memory  |", line)
