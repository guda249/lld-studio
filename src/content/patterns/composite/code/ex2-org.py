from abc import ABC, abstractmethod


class OrgUnit(ABC):  # component: a person or a whole department
    @abstractmethod
    def title(self) -> str: ...

    @abstractmethod
    def cost(self) -> int: ...  # yearly cost in lakh rupees

    @abstractmethod
    def headcount(self) -> int: ...


class Employee(OrgUnit):  # leaf
    def __init__(self, name: str, role: str, salary_lakh: int) -> None:
        self.name = name
        self.role = role
        self.salary_lakh = salary_lakh

    def title(self) -> str:
        return f"{self.name} ({self.role})"

    def cost(self) -> int:
        return self.salary_lakh

    def headcount(self) -> int:
        return 1


class Department(OrgUnit):  # composite
    def __init__(self, name: str) -> None:
        self.name = name
        self.members: list[OrgUnit] = []

    def add(self, *units: OrgUnit) -> "Department":
        self.members.extend(units)
        return self

    def title(self) -> str:
        return self.name

    def cost(self) -> int:
        return sum(m.cost() for m in self.members)

    def headcount(self) -> int:
        return sum(m.headcount() for m in self.members)


def budget_line(unit: OrgUnit) -> str:  # client: never checks what kind of unit it has
    return f"{unit.title():<20} people={unit.headcount():>2}  cost=₹{unit.cost()} lakh"


sana = Employee("Sana", "SDE-1", 14)
payments = Department("Payments team").add(Employee("Divya", "Lead", 35), Employee("Karan", "SDE-2", 24), sana)
mobile = Department("Mobile team").add(Employee("Joseph", "SDE-2", 22))
engineering = Department("Engineering").add(Employee("Anil", "CTO", 60), payments, mobile)

for unit in [sana, payments, engineering]:
    print(budget_line(unit))
