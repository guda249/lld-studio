final case class LabResult(test: String, value: Double, unit: String, abnormal: Boolean)

trait LabResultSource: // target: what the doctor's dashboard reads
  def resultsFor(patientId: String): List[LabResult]

class OldLabSystem: // adaptee: a 20-year-old analyser that exports one long string
  def fetchReport(mrn: Int): String =
    "HB|11.2|g/dL|L~GLU|98|mg/dL|N~WBC|12.6|10^3/uL|H"

class OldLabAdapter(system: OldLabSystem) extends LabResultSource:
  def resultsFor(patientId: String): List[LabResult] =
    val mrn = patientId.stripPrefix("PT-").toInt // our ID format -> theirs
    system.fetchReport(mrn).split('~').toList.map(toResult)

  private def toResult(segment: String): LabResult =
    val parts = segment.split('|') // a Char, so '|' is not treated as a regex
    LabResult(parts(0), parts(1).toDouble, parts(2), parts(3) != "N")

def printSummary(source: LabResultSource, patientId: String): Unit =
  val results = source.resultsFor(patientId)
  println(s"Results for $patientId")
  for r <- results do
    val mark = if r.abnormal then "  <- check" else ""
    println(f"  ${r.test}%-4s${r.value}%6.1f ${r.unit}$mark")
  println(s"${results.count(_.abnormal)} of ${results.size} results need a doctor's review")

@main def labAdapterDemo(): Unit =
  printSummary(OldLabAdapter(OldLabSystem()), "PT-1042")
