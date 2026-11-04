# Before: every mix of "how it looks" and "where it goes" needs its own subclass.


class Logger:  # prints plain lines to the console
    def log(self, msg: str) -> None:
        self.write(self.format(msg))

    def format(self, msg: str) -> str:
        return msg

    def write(self, line: str) -> None:
        print(line)


class TimestampLogger(Logger):  # changes how it looks
    def format(self, msg: str) -> str:
        return f"[09:30] {msg}"


class FileLogger(Logger):  # changes where it goes
    def __init__(self) -> None:
        self.lines: list[str] = []

    def write(self, line: str) -> None:
        self.lines.append(line)


class TimestampFileLogger(FileLogger):  # both? pick one parent, copy the other
    def format(self, msg: str) -> str:
        return f"[09:30] {msg}"  # duplicated from TimestampLogger


if __name__ == "__main__":
    TimestampLogger().log("server started")
    f = TimestampFileLogger()
    f.log("disk 91% full")
    print(f.lines)
    # next request: JSON format and a Slack destination -> 3 formats x 3 places = 9 classes
