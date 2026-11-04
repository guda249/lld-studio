import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "bridge",
  task: "There is one report class for every report-and-format pair, and the CSV and Markdown code is copied into each. Refactor it into the Bridge pattern so a new report or a new format is one new class, not one per combination.",
  goals: [
    "A renderer interface (an ABC in Python, a trait in Scala) with one class per format",
    "A report base class that holds a renderer, passed in through the constructor",
    "At least two report subclasses that call the renderer instead of formatting text themselves",
    "Reports never create or name a concrete renderer; the client code picks one",
    "No isinstance / type match on renderers inside the reports"
  ],
  hints: [
    "Two things vary here: what a report contains, and how it is formatted. Give each its own small hierarchy.",
    "Move the CSV and Markdown code into two classes that share one method, such as render(title, rows).",
    "Make Report take a Renderer in its constructor and keep it in a field; SalesReport.generate then calls that field's render with its own title and rows."
  ]
};

export default exercise;
