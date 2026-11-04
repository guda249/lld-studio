import scala.collection.mutable

// Flyweight: name, unit and normal range. Identical for every patient.
final case class TestDefinition(name: String, unit: String, low: Double, high: Double):
  def flag(value: Double): String =
    if value < low then "LOW"
    else if value > high then "HIGH"
    else "normal"

val catalogue: Map[String, (String, String, Double, Double)] = Map(
  ("HB", ("Haemoglobin", "g/dL", 12.0, 16.0)),
  ("GLU", ("Fasting glucose", "mg/dL", 70.0, 100.0))
)

// Function-based flyweight factory: a memoised lookup.
val loaded = mutable.Map.empty[String, TestDefinition]
def testDef(code: String): TestDefinition =
  loaded.getOrElseUpdate(code, {
    println(s"  (loading definition $code from the master table)")
    val (name, unit, low, high) = catalogue(code)
    TestDefinition(name, unit, low, high)
  })

// Context: the per-patient part.
final case class LabResult(patient: String, value: Double, test: TestDefinition):
  def line(): String =
    f"$patient%-6s ${test.name}%-16s $value ${test.unit} ${test.flag(value)}"

@main def labReports(): Unit =
  val readings = List(("Anil", "HB", 11.2), ("Bina", "HB", 13.5), ("Anil", "GLU", 126.0),
    ("Chitra", "GLU", 92.0), ("Bina", "GLU", 64.0), ("Chitra", "HB", 14.1))
  val results = readings.map((patient, code, value) => LabResult(patient, value, testDef(code)))
  results.foreach(r => println(r.line()))
  println(s"${results.size} results share ${loaded.size} test definitions")
