import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "template-method",
  task: "CsvImporter and KeyValueImporter each copy the same parse, validate and save recipe, so a fix to validation must be made twice. Refactor them into the Template Method pattern so the recipe is written once and each importer supplies only its own parsing.",
  goals: [
    "A base class (an ABC in Python, an abstract class in Scala) with one run method that calls the steps in order",
    "parse is abstract: each importer must provide it",
    "Validation and saving live once in the base class, as hooks with a default",
    "The importers override only the steps that differ, never run itself",
    "Optional: mark run as final (@final in Python, final def in Scala)"
  ],
  hints: [
    "Look at the two run methods side by side. Which lines are the same, and which one line differs?",
    "Create a base class with run(raw) that calls parse, then is_valid on each record, then save. Only parse needs to change per importer.",
    "Mark parse with @abstractmethod (Python) or leave it without a body (Scala), give is_valid and save default bodies, and make CsvImporter and KeyValueImporter extend the base and implement only parse."
  ]
};

export default exercise;
