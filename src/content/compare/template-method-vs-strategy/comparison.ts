import type { Comparison } from "../../extras/types";
import templatePy from "./code/template_method.py?raw";
import templateScala from "./code/TemplateMethod.scala?raw";
import strategyPy from "./code/strategy.py?raw";
import strategyScala from "./code/Strategy.scala?raw";

const comparison: Comparison = {
  id: "template-method-vs-strategy",
  title: "Template Method vs Strategy",
  tagline: "Both let one part of an algorithm vary while the rest stays put; one does it with inheritance, the other with an object you pass in.",
  scenario:
    "A sales report must be exported as CSV or as a Markdown table. Every export has the same three steps in the same order: " +
    "a header, one line per row, and a footer with the row count. Only the look of each step changes.",
  decidingQuestion: "Should the varying steps be fixed when the class is written (a subclass), or picked and swapped while the program runs (an object passed in)?",
  sides: [
    {
      slug: "template-method",
      oneLiner: "ReportExporter.export_report fixes the order of steps, and each subclass fills in header and format_row.",
      code: { python: templatePy, scala: templateScala },
      uml: {
        classes: [
          { name: "ReportExporter", kind: "abstract", members: ["+ export_report(rows)", "# header()", "# format_row(name, amount)", "# footer(count)"] },
          { name: "CsvExporter", kind: "concrete", members: ["# header()", "# format_row(name, amount)"] },
          { name: "MarkdownExporter", kind: "concrete", members: ["# header()", "# format_row(name, amount)", "# footer(count)"] }
        ],
        relations: [
          { from: "CsvExporter", to: "ReportExporter", type: "inheritance" },
          { from: "MarkdownExporter", to: "ReportExporter", type: "inheritance" }
        ]
      },
      howItWorks: [
        "The client creates a CsvExporter or a MarkdownExporter and calls export_report().",
        "export_report() lives only in the base class and calls header(), format_row() and footer() on itself, in order.",
        "Python and Scala find the subclass's version of each step; footer() has a default that MarkdownExporter replaces."
      ],
      pickWhen: [
        "Several classes follow the same recipe, and only some steps differ.",
        "The recipe must stay the same for every variant (you can mark it final).",
        "The choice never changes for an object's lifetime, and the steps share a lot of code with the base."
      ]
    },
    {
      slug: "strategy",
      oneLiner: "ReportExporter keeps the order of steps and asks a RowFormat object, passed in from outside, for each one.",
      code: { python: strategyPy, scala: strategyScala },
      uml: {
        classes: [
          { name: "ReportExporter", kind: "concrete", members: ["- fmt: RowFormat", "+ set_format(fmt)", "+ export_report(rows)"] },
          { name: "RowFormat", kind: "interface", members: ["+ header()", "+ format_row(name, amount)", "+ footer(count)"] },
          { name: "CsvFormat", kind: "concrete", members: ["+ header()", "+ format_row(name, amount)", "+ footer(count)"] },
          { name: "MarkdownFormat", kind: "concrete", members: ["+ header()", "+ format_row(name, amount)", "+ footer(count)"] }
        ],
        relations: [
          { from: "ReportExporter", to: "RowFormat", type: "association" },
          { from: "CsvFormat", to: "RowFormat", type: "realization" },
          { from: "MarkdownFormat", to: "RowFormat", type: "realization" }
        ]
      },
      howItWorks: [
        "The client creates one ReportExporter and gives it a CsvFormat.",
        "export_report() runs the same three steps, but calls them on the format object in its field.",
        "set_format(MarkdownFormat()) swaps the format on the same exporter, and the next export looks different."
      ],
      pickWhen: [
        "The client or a setting should choose, or switch, the behaviour at runtime.",
        "You want to test or reuse each format on its own, without the exporter.",
        "You prefer composition to inheritance, or a class already has a different parent."
      ]
    }
  ],
  table: [
    { aspect: "How the varying part is plugged in", values: ["Inheritance: a subclass overrides steps", "Composition: an object in a field"] },
    { aspect: "When the choice is made", values: ["When you pick which class to create; fixed for that object", "At runtime; can be swapped with a setter"] },
    { aspect: "Who owns the order of steps", values: ["The base class (export_report)", "The context (ReportExporter.export_report)"] },
    { aspect: "How many objects", values: ["One: the subclass instance", "Two: the exporter and its format"] },
    { aspect: "Shared default steps", values: ["Easy: a hook with a body in the base class", "Each strategy implements every step (or a shared helper)"] },
    { aspect: "Typical smell it fixes", values: ["Copy-pasted methods that differ in one or two lines", "An if/elif that picks the behaviour"] }
  ],
  mixups: [
    "A subclass that overrides export_report() itself: now the recipe lives in two places, and a fix to the base won't reach it. Only steps should be overridden.",
    "Making a subclass for every combination (CsvWithTotalsExporter, MarkdownWithTotalsExporter…) when the parts vary separately. That is a sign you want strategies you can mix.",
    "Calling it Strategy when the context creates the format itself (self._fmt = CsvFormat()): nothing can be swapped, so you only moved code around.",
    "A strategy interface with one real step and five methods copied from the base: if the steps share a lot of code and never change at runtime, Template Method is simpler."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the key difference between Template Method and Strategy?",
      options: [
        "Template Method varies steps through subclasses; Strategy varies them through an object passed in",
        "Template Method can only have one step; Strategy can have many",
        "Strategy fixes the order of steps; Template Method lets the client reorder them",
        "Template Method is for creating objects; Strategy is for behaviour"
      ],
      answer: 0,
      hint: "Look at the arrows in the two diagrams: inheritance or a field?",
      explain: "In Template Method the base class calls steps that subclasses override (inheritance). In Strategy the context calls an object it holds (composition), so it can be swapped. Both can have many steps, neither lets the client reorder them, and both are behavioural patterns."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A game's enemies switch between \"aggressive\" and \"careful\" movement when their health drops, while the game runs. Which pattern fits the movement best?",
      options: ["Template Method", "Strategy", "Facade"],
      answer: 1,
      hint: "Does the behaviour change for the same enemy object while the game is running?",
      explain: "The same enemy must switch behaviour at runtime, so it holds a movement strategy and swaps it. With Template Method the behaviour is fixed by the subclass you created. A Facade only simplifies calls to several classes."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Three importers (CSV, JSON, XML) all open a file, parse it, validate the records and save them. Only parsing differs, and validation and saving are 40 shared lines. Which fits best?",
      options: ["Template Method", "Strategy", "Command", "Adapter"],
      answer: 0,
      hint: "Is anything chosen at runtime, or is it one fixed recipe with one different step?",
      explain: "A fixed recipe with lots of shared code and one varying step is the classic Template Method: a base importer with an abstract parse(). Strategy would also work but needs an extra object for no runtime benefit; Command and Adapter solve different problems."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This subclass breaks the Template Method idea. Tap the line where it goes wrong.",
      code: { lang: "python", text: `class CsvExporter(ReportExporter):
    def header(self) -> str:
        return "item,amount"

    def format_row(self, name: str, amount: int) -> str:
        return f"{name},{amount}"

    def export_report(self, rows: list[Row]) -> str:
        return "\\n".join(f"{n},{a}" for n, a in rows)` },
      answer: 8,
      hint: "Which method should exist only in the base class?",
      explain: "Line 8 overrides the template method itself, so the CSV export skips the header and footer and the order of steps now lives in two places. Subclasses should override only the steps (header, format_row, footer)."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of exporter.export_report(rows) in the Strategy version in order.",
      steps: [
        "The client calls export_report(rows) on ReportExporter",
        "ReportExporter asks its format for the header",
        "ReportExporter asks its format to write each row",
        "ReportExporter asks its format for the footer",
        "ReportExporter joins the lines and returns the text"
      ],
      shuffled: [4, 2, 0, 3, 1],
      hint: "The order of steps is the same in both versions; only who answers each step differs.",
      explain: "The context keeps the fixed order (header, rows, footer) and asks its RowFormat for each part, then joins the result. In the Template Method version the same order runs, but each step is answered by the subclass itself."
    }
  ]
};

export default comparison;
