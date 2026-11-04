from abc import ABC, abstractmethod


class Grader(ABC):
    @abstractmethod
    def grade(self, marks: int) -> str: ...


class ReportCard(ABC):
    @abstractmethod
    def format(self, student: str, grades: dict[str, str]) -> str: ...


class CbseGrader(Grader):
    def grade(self, marks: int) -> str:
        return "A1" if marks >= 91 else "A2" if marks >= 81 else "B1" if marks >= 71 else "B2"


class CbseReportCard(ReportCard):
    def format(self, student: str, grades: dict[str, str]) -> str:
        return f"CBSE | {student} | " + ", ".join(f"{s}: {g}" for s, g in grades.items())


class IbGrader(Grader):
    def grade(self, marks: int) -> str:
        return str(min(7, max(1, marks // 14)))  # IB uses a 1-7 scale


class IbReportCard(ReportCard):
    def format(self, student: str, grades: dict[str, str]) -> str:
        total = sum(int(g) for g in grades.values())
        return f"IB | {student} | " + " ".join(f"{s}={g}" for s, g in grades.items()) + f" | points {total}"


class BoardFactory(ABC):
    @abstractmethod
    def create_grader(self) -> Grader: ...

    @abstractmethod
    def create_report_card(self) -> ReportCard: ...

    def make_report(self, student: str, marks: dict[str, int]) -> str:
        # shared steps that always use one board's grader AND its report card
        grader = self.create_grader()
        grades = {subject: grader.grade(m) for subject, m in marks.items()}
        return self.create_report_card().format(student, grades)


class CbseBoard(BoardFactory):
    def create_grader(self) -> Grader:
        return CbseGrader()

    def create_report_card(self) -> ReportCard:
        return CbseReportCard()


class IbBoard(BoardFactory):
    def create_grader(self) -> Grader:
        return IbGrader()

    def create_report_card(self) -> ReportCard:
        return IbReportCard()


marks = {"Maths": 94, "Science": 78, "English": 85}
for board in (CbseBoard(), IbBoard()):
    print(board.make_report("Meena", marks))
