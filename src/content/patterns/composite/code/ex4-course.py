from abc import ABC, abstractmethod
from collections.abc import Iterator


class CourseNode(ABC):  # component
    def __init__(self, title: str) -> None:
        self.title = title

    @abstractmethod
    def minutes(self) -> int: ...

    @abstractmethod
    def lessons(self) -> Iterator["Lesson"]: ...  # walks the tree, yielding leaves in order


class Lesson(CourseNode):  # leaf
    def __init__(self, title: str, minutes: int, done: bool = False) -> None:
        super().__init__(title)
        self._minutes = minutes
        self.done = done

    def minutes(self) -> int:
        return self._minutes

    def lessons(self) -> Iterator["Lesson"]:
        yield self


class Section(CourseNode):  # composite: sections can hold lessons or more sections
    def __init__(self, title: str, *children: CourseNode) -> None:
        super().__init__(title)
        self._children = list(children)

    def minutes(self) -> int:
        return sum(child.minutes() for child in self._children)

    def lessons(self) -> Iterator["Lesson"]:
        for child in self._children:
            yield from child.lessons()


def progress(node: CourseNode) -> str:
    all_lessons = list(node.lessons())
    done = [lesson for lesson in all_lessons if lesson.done]
    pct = 100 * sum(lesson.minutes() for lesson in done) // node.minutes()
    return f"{node.title}: {len(done)}/{len(all_lessons)} lessons, {pct}% of {node.minutes()} min"


builder = Lesson("Builder", 30)
patterns = Section(
    "Patterns",
    Section("Creational", Lesson("Singleton", 20, done=True), builder),
    Section("Structural", Lesson("Adapter", 20), Lesson("Composite", 25)),
)
course = Section("LLD for beginners", Section("Basics", Lesson("What is LLD?", 10, True), Lesson("UML", 25, True)), patterns)

for node in [course, patterns, builder]:
    print(progress(node))
up_next = next((lesson for lesson in course.lessons() if not lesson.done), None)
print(f"Up next: {up_next.title if up_next else 'nothing, course complete'}")
