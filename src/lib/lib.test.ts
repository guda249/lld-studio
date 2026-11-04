import { highlightLines } from "./highlight";
import { DAY, rate, schedule, freshState } from "./sm2";
import { grade, isComplete } from "./quizGrade";
import type { Question } from "../anim/types";
import { eq, ok } from "../test/expect";

const classes = (line: string, lang: "python" | "scala") =>
  highlightLines([line], lang)[0].filter((t) => t.cls).map((t) => `${t.cls}:${t.text}`);

const mcq: Question = { type: "mcq", tag: "Concept", prompt: "p", hint: "h", explain: "e", options: ["a", "b", "c"], answer: 1 };
const order: Question = { type: "order", tag: "Put in order", prompt: "p", hint: "h", explain: "e", steps: ["a", "b", "c"], shuffled: [2, 0, 1] };
const bug: Question = { type: "bug", tag: "Find the problem", prompt: "p", hint: "h", explain: "e", code: { lang: "python", text: "a\nb" }, answer: 2 };

export const tests = {
  "highlighter: python keywords, types, functions, self, strings, numbers, decorators, comments"() {
    eq(classes('    def pay(self, amount: float) -> str: return f"₹{amount}"  # done', "python"),
      ["kw:def", "fn:pay", "sf:self", "kw:return", 'st:f"₹{amount}"', "cm:# done"]);
    eq(classes("@abstractmethod", "python"), ["dc:@abstractmethod"]);
    eq(classes("x = Checkout(1200)", "python"), ["ty:Checkout", "nu:1200"]);
  },
  "highlighter: scala keywords and interpolated strings"() {
    eq(classes('class Card extends PaymentMethod:', "scala"), ["kw:class", "ty:Card", "kw:extends", "ty:PaymentMethod"]);
    eq(classes('  def pay(amount: BigDecimal) = s"Paid $amount"', "scala"), ["kw:def", "fn:pay", "ty:BigDecimal", 'st:s"Paid $amount"']);
  },
  "highlighter: tolerates broken code (unclosed string, multi-line string and block comment)"() {
    eq(classes('print("unclosed', "python"), ['st:"unclosed']);
    const ml = highlightLines(['x = """start', "middle", 'end"""', "y = 1"], "python");
    eq(ml[1].map((t) => t.cls), ["st"]);
    eq(ml[2][0].cls, "st");
    eq(ml[3].filter((t) => t.cls).map((t) => t.cls), ["nu"]);
    const bc = highlightLines(["/* open", "still comment", "*/ val a = 1"], "scala");
    eq(bc[1][0].cls, "cm");
    eq(bc[2].filter((t) => t.cls).map((t) => t.cls), ["cm", "kw", "nu"]);
  },
  "highlighter: keeps every character"() {
    const line = '  case other => throw IllegalArgumentException(other) // x';
    eq(highlightLines([line], "scala")[0].map((t) => t.text).join(""), line);
  },
  "sm2: first intervals follow the approved schedule"() {
    const c = freshState();
    eq(schedule(c, "again").ivl, 0);
    eq(schedule(c, "hard").ivl, 1);
    eq(schedule(c, "good").ivl, 3);
    eq(schedule(c, "easy").ivl, 7);
  },
  "sm2: later intervals grow with ease, ease changes with ratings"() {
    eq(schedule({ ivl: 3, ease: 2.5 }, "good"), { ivl: 8, ease: 2.5 });
    eq(schedule({ ivl: 10, ease: 2.5 }, "hard"), { ivl: 12, ease: 2.35 });
    eq(schedule({ ivl: 3, ease: 2.5 }, "easy"), { ivl: 10, ease: 2.65 });
    eq(schedule({ ivl: 5, ease: 1.35 }, "again"), { ivl: 0, ease: 1.3 });
  },
  "sm2: rating sets the due date; again is due now"() {
    const now = 1_000_000;
    const good = rate(freshState(), "good", now);
    eq(good.due, now + 3 * DAY);
    eq(good.reps, 1);
    eq(rate(freshState(), "again", now).due, 0);
  },
  "quiz grading: multiple choice, find the line, order"() {
    ok(grade(mcq, 1) && !grade(mcq, 0) && !grade(mcq, null), "mcq");
    ok(grade(bug, 2) && !grade(bug, 1), "bug");
    ok(!isComplete(order, [0, 1]), "incomplete order");
    ok(grade(order, [0, 1, 2]) && !grade(order, [1, 0, 2]), "order");
  }
};
