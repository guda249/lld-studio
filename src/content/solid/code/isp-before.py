# Before: one fat interface. A plain printer must pretend it can scan and fax.
from abc import ABC, abstractmethod


class OfficeMachine(ABC):
    @abstractmethod
    def print_doc(self, doc: str) -> str: ...

    @abstractmethod
    def scan(self, page: str) -> str: ...

    @abstractmethod
    def fax(self, number: str, doc: str) -> str: ...


class MultiFunctionDevice(OfficeMachine):
    def print_doc(self, doc: str) -> str:
        return f"printed {doc}"

    def scan(self, page: str) -> str:
        return f"scanned {page}"

    def fax(self, number: str, doc: str) -> str:
        return f"faxed {doc} to {number}"


class BasicPrinter(OfficeMachine):  # the cheap branch-office printer
    def print_doc(self, doc: str) -> str:
        return f"printed {doc}"

    def scan(self, page: str) -> str:
        raise NotImplementedError("no scanner")  # forced to exist

    def fax(self, number: str, doc: str) -> str:
        raise NotImplementedError("no fax")  # forced to exist


def print_payslips(machine: OfficeMachine) -> None:  # only prints, yet depends on scan and fax
    for name in ["asha", "ravi"]:
        print(machine.print_doc(f"payslip-{name}"))


if __name__ == "__main__":
    print_payslips(BasicPrinter())
    try:
        BasicPrinter().scan("contract")  # nothing stops this call
    except NotImplementedError as e:
        print("crash:", e)
