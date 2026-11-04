# After: small interfaces. Each machine promises only what it can do;
# each client asks only for what it uses.
from abc import ABC, abstractmethod


class Printer(ABC):
    @abstractmethod
    def print_doc(self, doc: str) -> str: ...


class Scanner(ABC):
    @abstractmethod
    def scan(self, page: str) -> str: ...


class Fax(ABC):
    @abstractmethod
    def fax(self, number: str, doc: str) -> str: ...


class BasicPrinter(Printer):
    def print_doc(self, doc: str) -> str:
        return f"printed {doc}"


class MultiFunctionDevice(Printer, Scanner, Fax):
    def print_doc(self, doc: str) -> str:
        return f"printed {doc}"

    def scan(self, page: str) -> str:
        return f"scanned {page}"

    def fax(self, number: str, doc: str) -> str:
        return f"faxed {doc} to {number}"


def print_payslips(printer: Printer) -> None:  # depends only on printing
    for name in ["asha", "ravi"]:
        print(printer.print_doc(f"payslip-{name}"))


def archive(scanner: Scanner) -> None:  # depends only on scanning
    print(scanner.scan("contract"))


if __name__ == "__main__":
    print_payslips(BasicPrinter())
    print_payslips(MultiFunctionDevice())
    archive(MultiFunctionDevice())
