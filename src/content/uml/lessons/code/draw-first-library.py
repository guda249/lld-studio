from abc import ABC, abstractmethod


class LateFee(ABC):
    @abstractmethod
    def charge(self, days_late: int) -> float: ...


class FlatLateFee(LateFee):
    def charge(self, days_late: int) -> float:
        return 5.0 * days_late


class Member:
    def __init__(self, name: str):
        self.name = name


class Book:
    def __init__(self, title: str):
        self.title = title


class DueDate:
    def __init__(self, days: int):
        self.days = days


class Loan:
    def __init__(self, member: Member):
        self.member = member
        self.books: list[Book] = []
        self.due = DueDate(14)

    def borrow(self, book: Book) -> None:
        self.books.append(book)

    def fine(self, days_kept: int, fee: LateFee) -> float:
        late = max(0, days_kept - self.due.days)
        return fee.charge(late) * len(self.books)


loan = Loan(Member("Ravi"))
loan.borrow(Book("Dune"))
loan.borrow(Book("Emma"))
print(f"{loan.member.name} owes {loan.fine(17, FlatLateFee())}")
