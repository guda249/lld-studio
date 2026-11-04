import copy
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class Prototype(ABC):
    @abstractmethod
    def duplicate(self) -> "Prototype": ...


@dataclass
class Document(Prototype):
    title: str
    sections: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)

    def duplicate(self) -> "Document":
        return copy.deepcopy(self)  # deep: the nested list and dict are copied too


class TemplateRegistry:
    def __init__(self) -> None:
        self._templates: dict[str, Document] = {}

    def register(self, key: str, doc: Document) -> None:
        self._templates[key] = doc

    def create(self, key: str) -> Document:
        return self._templates[key].duplicate()


registry = TemplateRegistry()
registry.register("offer", Document("Offer Letter",
                                    ["Greeting", "Role", "Compensation", "Benefits"],
                                    {"dept": "HR", "version": "7"}))

letter = registry.create("offer")
letter.title = "Offer Letter - Priya"
letter.sections.append("Joining date")

print(f"{letter.title}: {', '.join(letter.sections)}")
template = registry.create("offer")
print(f"{template.title}: {', '.join(template.sections)}")  # the template is untouched
