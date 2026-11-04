import scala.collection.immutable.ListMap

trait Grader:
  def grade(marks: Int): String

trait ReportCard:
  def format(student: String, grades: ListMap[String, String]): String

class CbseGrader extends Grader:
  def grade(marks: Int): String =
    if marks >= 91 then "A1" else if marks >= 81 then "A2" else if marks >= 71 then "B1" else "B2"

class CbseReportCard extends ReportCard:
  def format(student: String, grades: ListMap[String, String]): String =
    s"CBSE | $student | " + grades.toList.map((subj, g) => s"$subj: $g").mkString(", ")

class IbGrader extends Grader:
  def grade(marks: Int): String = math.min(7, math.max(1, marks / 14)).toString // IB uses a 1-7 scale

class IbReportCard extends ReportCard:
  def format(student: String, grades: ListMap[String, String]): String =
    val total = grades.values.map(_.toInt).sum
    s"IB | $student | " + grades.toList.map((subj, g) => s"$subj=$g").mkString(" ") + s" | points $total"

abstract class BoardFactory:
  def createGrader(): Grader
  def createReportCard(): ReportCard

  def makeReport(student: String, marks: ListMap[String, Int]): String =
    // shared steps that always use one board's grader AND its report card
    val grader = createGrader()
    val grades = ListMap.from(marks.toList.map((subject, m) => subject -> grader.grade(m)))
    createReportCard().format(student, grades)

class CbseBoard extends BoardFactory:
  def createGrader(): Grader = CbseGrader()
  def createReportCard(): ReportCard = CbseReportCard()

class IbBoard extends BoardFactory:
  def createGrader(): Grader = IbGrader()
  def createReportCard(): ReportCard = IbReportCard()

@main def boardDemo(): Unit =
  val marks = ListMap("Maths" -> 94, "Science" -> 78, "English" -> 85)
  val boards: List[BoardFactory] = List(CbseBoard(), IbBoard())
  boards.foreach(b => println(b.makeReport("Meena", marks)))
