import copy
from abc import ABC, abstractmethod


class Prototype(ABC):
    @abstractmethod
    def duplicate(self) -> "Prototype": ...


class WorkoutPlan(Prototype):
    def __init__(self, name: str, exercises: list[str], settings: dict[str, int]) -> None:
        self.name = name
        self.exercises = exercises
        self.settings = settings

    def duplicate(self) -> "WorkoutPlan":
        # deep: the copy gets its own exercise list and settings
        return copy.deepcopy(self)

    def describe(self) -> str:
        return f"{self.name}: {', '.join(self.exercises)} | rest {self.settings['rest_s']}s x{self.settings['rounds']}"


class PlanLibrary:
    def __init__(self) -> None:
        self._templates: dict[str, WorkoutPlan] = {}

    def register(self, key: str, plan: WorkoutPlan) -> None:
        self._templates[key] = plan

    def create(self, key: str, name: str) -> WorkoutPlan:
        plan = self._templates[key].duplicate()
        plan.name = name
        return plan


if __name__ == "__main__":
    library = PlanLibrary()
    library.register("beginner", WorkoutPlan("Beginner", ["squats", "push-ups", "lunges"],
                                             {"rest_s": 60, "rounds": 3}))

    ana = library.create("beginner", "Beginner - Ana")
    ana.exercises.append("plank")

    ben = library.create("beginner", "Beginner - Ben")
    ben.settings["rest_s"] = 90

    base = library.create("beginner", "Beginner")  # the template is untouched

    for plan in (ana, ben, base):
        print(plan.describe())
