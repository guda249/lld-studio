import copy
from dataclasses import dataclass


@dataclass
class QuestionPaper:
    subject: str
    questions: list[str]
    set_name: str = "master"

    def duplicate(self) -> "QuestionPaper":
        return copy.deepcopy(self)


load_count = 0


def load_master_paper() -> QuestionPaper:
    # stands in for slow work: reading the question bank, checking it, laying it out
    global load_count
    load_count += 1
    questions = [f"Q{n}: physics problem {n}" for n in range(1, 6)]
    return QuestionPaper("Physics", questions)


master = load_master_paper()  # the expensive step runs once

papers = []
for shift, set_name in enumerate(("A", "B", "C")):
    paper = master.duplicate()  # cheap copy instead of a fresh load
    paper.set_name = set_name
    paper.questions = paper.questions[shift:] + paper.questions[:shift]  # same questions, new order
    papers.append(paper)

for p in papers:
    print(f"Set {p.set_name}: starts with {p.questions[0]}, {len(p.questions)} questions")
print(f"Master paper loaded {load_count} time(s); master still starts with {master.questions[0]}")
