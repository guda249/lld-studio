from abc import ABC, abstractmethod
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True)
class Book:
    isbn: str
    title: str
    author: str


class CopyStatus(Enum):
    AVAILABLE = "available"
    ON_HOLD = "on hold"
    BORROWED = "borrowed"
    LOST = "lost"


class BookCopy:
    """One physical copy on the shelf. Many copies share one Book."""

    def __init__(self, copy_id: str, book: Book) -> None:
        self.copy_id = copy_id
        self.book = book
        self.status: CopyStatus = CopyStatus.AVAILABLE
        self.held_for: str | None = None  # member id while ON_HOLD


# ---------- Strategy: each membership plan has its own limits and fine rule ----------
class MembershipPlan(ABC):
    @abstractmethod
    def max_loans(self) -> int: ...

    @abstractmethod
    def loan_days(self) -> int: ...

    @abstractmethod
    def fine_for(self, days_late: int) -> int: ...


class StandardPlan(MembershipPlan):
    def max_loans(self) -> int:
        return 3

    def loan_days(self) -> int:
        return 14

    def fine_for(self, days_late: int) -> int:
        return 10 * days_late


class StudentPlan(MembershipPlan):
    def max_loans(self) -> int:
        return 5

    def loan_days(self) -> int:
        return 21

    def fine_for(self, days_late: int) -> int:
        return min(5 * days_late, 100)  # students never pay more than ₹100 per book


class Member:
    def __init__(self, member_id: str, name: str, plan: MembershipPlan) -> None:
        self.member_id = member_id
        self.name = name
        self.plan = plan
        self.fines_due = 0


class Loan:
    def __init__(self, copy: BookCopy, member: Member, due_day: int) -> None:
        self.copy = copy
        self.member = member
        self.due_day = due_day
        self.returned_day: int | None = None


class Catalog:
    def __init__(self) -> None:
        self._books: list[Book] = []
        self._copies: list[BookCopy] = []

    def add(self, book: Book, count: int) -> None:
        self._books.append(book)
        start = len(self._copies)
        for n in range(count):
            self._copies.append(BookCopy(f"C{start + n + 1}", book))

    def search(self, text: str) -> list[Book]:
        text = text.lower()
        return [b for b in self._books if text in b.title.lower() or text in b.author.lower()]

    def copies_of(self, isbn: str) -> list[BookCopy]:
        return [c for c in self._copies if c.book.isbn == isbn]


# ---------- Observer: notices go to whoever listens (SMS, e-mail, a board at the desk) ----------
class LibraryListener(ABC):
    @abstractmethod
    def on_notice(self, member: Member, message: str) -> None: ...


class NoticeBoard(LibraryListener):
    def __init__(self) -> None:
        self.notices: list[str] = []

    def on_notice(self, member: Member, message: str) -> None:
        self.notices.append(f"to {member.name}: {message}")


# ---------- Facade: the desk clerk only talks to Library ----------
class Library:
    LOST_FEE = 500

    def __init__(self) -> None:
        self.catalog = Catalog()
        self._loans: list[Loan] = []
        self._holds: dict[str, deque[Member]] = {}
        self._listeners: list[LibraryListener] = []

    def subscribe(self, listener: LibraryListener) -> None:
        self._listeners.append(listener)

    def _tell(self, member: Member, message: str) -> None:
        for listener in self._listeners:
            listener.on_notice(member, message)

    def _open_loans(self, member: Member) -> list[Loan]:
        return [l for l in self._loans if l.member is member and l.returned_day is None]

    def borrow(self, member: Member, isbn: str, today: int) -> Loan:
        if member.fines_due > 0:
            raise ValueError(f"{member.name} owes ₹{member.fines_due}; pay first")
        if len(self._open_loans(member)) >= member.plan.max_loans():
            raise ValueError(f"{member.name} already has {member.plan.max_loans()} books")
        copies = self.catalog.copies_of(isbn)
        mine = [c for c in copies if c.status == CopyStatus.ON_HOLD and c.held_for == member.member_id]
        free = [c for c in copies if c.status == CopyStatus.AVAILABLE]
        if not (mine or free):
            raise ValueError("no copy free for you; reserve it instead")
        copy = (mine or free)[0]
        copy.status, copy.held_for = CopyStatus.BORROWED, None
        loan = Loan(copy, member, today + member.plan.loan_days())
        self._loans.append(loan)
        return loan

    def reserve(self, member: Member, isbn: str) -> int:
        if any(c.status == CopyStatus.AVAILABLE for c in self.catalog.copies_of(isbn)):
            raise ValueError("a copy is on the shelf; borrow it instead")
        queue = self._holds.setdefault(isbn, deque())
        queue.append(member)
        return len(queue)

    def return_copy(self, copy_id: str, today: int) -> int:
        loan = next(l for l in self._loans if l.copy.copy_id == copy_id and l.returned_day is None)
        loan.returned_day = today
        fine = loan.member.plan.fine_for(max(0, today - loan.due_day))
        if fine:
            loan.member.fines_due += fine
            self._tell(loan.member, f"returned '{loan.copy.book.title}' late, fine ₹{fine}")
        queue = self._holds.get(loan.copy.book.isbn)
        if queue:
            nxt = queue.popleft()
            loan.copy.status, loan.copy.held_for = CopyStatus.ON_HOLD, nxt.member_id
            self._tell(nxt, f"'{loan.copy.book.title}' is waiting for you at the desk")
        else:
            loan.copy.status = CopyStatus.AVAILABLE
        return fine

    def report_lost(self, copy_id: str, today: int) -> None:
        loan = next(l for l in self._loans if l.copy.copy_id == copy_id and l.returned_day is None)
        loan.returned_day = today
        loan.copy.status = CopyStatus.LOST
        loan.member.fines_due += self.LOST_FEE
        self._tell(loan.member, f"'{loan.copy.book.title}' marked lost, fee ₹{self.LOST_FEE}")

    def pay(self, member: Member, amount: int) -> None:
        member.fines_due = max(0, member.fines_due - amount)


def attempt(label: str, action: Callable[[], object]) -> None:
    try:
        print(label, "->", action())
    except ValueError as err:
        print(label, "-> refused:", err)


if __name__ == "__main__":
    library = Library()
    board = NoticeBoard()
    library.subscribe(board)
    library.catalog.add(Book("111", "Clean Code", "Robert Martin"), 1)
    library.catalog.add(Book("222", "Design Patterns", "Gamma et al."), 2)
    library.catalog.add(Book("333", "Refactoring", "Martin Fowler"), 1)
    ravi = Member("m1", "Ravi", StandardPlan())
    meera = Member("m2", "Meera", StudentPlan())

    print("Search 'martin':", [b.title for b in library.catalog.search("martin")])
    attempt("Day 1  Ravi borrows Clean Code", lambda: f"due day {library.borrow(ravi, '111', 1).due_day}")
    attempt("Day 2  Meera borrows Clean Code", lambda: library.borrow(meera, "111", 2))
    attempt("Day 2  Meera reserves Clean Code", lambda: f"place {library.reserve(meera, '111')} in queue")
    attempt("Day 20 Ravi returns C1", lambda: f"fine ₹{library.return_copy('C1', 20)}")
    attempt("Day 20 Ravi borrows Refactoring", lambda: library.borrow(ravi, "333", 20))
    library.pay(ravi, 50)
    attempt("Day 20 Ravi pays, borrows Refactoring", lambda: f"due day {library.borrow(ravi, '333', 20).due_day}")
    attempt("Day 21 Ravi borrows Clean Code", lambda: library.borrow(ravi, "111", 21))
    attempt("Day 21 Meera borrows Clean Code", lambda: f"due day {library.borrow(meera, '111', 21).due_day}")
    attempt("Day 22 Meera borrows Design Patterns", lambda: f"due day {library.borrow(meera, '222', 22).due_day}")
    library.report_lost("C2", 60)
    print("Copies:", ", ".join(f"{c.copy_id} {c.status.value}" for b in "111 222 333".split()
                               for c in library.catalog.copies_of(b)))
    print("Fines due:", ", ".join(f"{m.name} ₹{m.fines_due}" for m in [ravi, meera]))
    for notice in board.notices:
        print("Notice", notice)
