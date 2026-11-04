import scala.collection.mutable

// 1) Scala has no @ syntax for this. A "function decorator" is a higher-order
//    function, applied once when the value is defined.
def logged(name: String)(f: Int => String): Int => String = marks =>
  val result = f(marks)
  println(s"[fn log] $name($marks) -> $result")
  result

def rawGrade(marks: Int): String =
  if marks >= 85 then "A" else if marks >= 70 then "B" else "C"

val gradeFor: Int => String = logged("gradeFor")(rawGrade)

// 2) The Decorator PATTERN: wraps an OBJECT at runtime, behind an interface.
trait GradeBook:
  def record(student: String, marks: Int): String

class SimpleGradeBook extends GradeBook:
  val entries = mutable.LinkedHashMap.empty[String, String]
  def record(student: String, marks: Int): String =
    val grade = gradeFor(marks)
    entries(student) = grade
    grade

class AuditedGradeBook(inner: GradeBook, teacher: String) extends GradeBook:
  def record(student: String, marks: Int): String =
    val grade = inner.record(student, marks)
    println(s"[audit]  $teacher gave $student grade $grade")
    grade

@main def gradeDecorators(): Unit =
  val book = SimpleGradeBook()
  book.record("Ravi", 72)                       // no audit, but gradeFor is always logged
  val audited = AuditedGradeBook(book, "Ms. Iyer") // this one object gets auditing
  audited.record("Meera", 91)
  println(book.entries.toList.map((name, grade) => s"$name=$grade").mkString(", "))
