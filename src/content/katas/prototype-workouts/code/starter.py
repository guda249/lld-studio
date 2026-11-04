class WorkoutPlan:
    def __init__(self, name: str, exercises: list[str], settings: dict[str, int]) -> None:
        self.name = name
        self.exercises = exercises
        self.settings = settings

    def describe(self) -> str:
        return f"{self.name}: {', '.join(self.exercises)} | rest {self.settings['rest_s']}s x{self.settings['rounds']}"


if __name__ == "__main__":
    # the same beginner setup is typed out again for every member;
    # when the coach changes it, every copy must be found and edited by hand
    ana = WorkoutPlan("Beginner - Ana", ["squats", "push-ups", "lunges"],
                      {"rest_s": 60, "rounds": 3})
    ana.exercises.append("plank")

    ben = WorkoutPlan("Beginner - Ben", ["squats", "push-ups", "lunges"],
                      {"rest_s": 60, "rounds": 3})
    ben.settings["rest_s"] = 90

    base = WorkoutPlan("Beginner", ["squats", "push-ups", "lunges"],
                       {"rest_s": 60, "rounds": 3})

    for plan in (ana, ben, base):
        print(plan.describe())
