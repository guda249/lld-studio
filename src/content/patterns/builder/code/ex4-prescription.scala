import scala.collection.mutable

final case class Medicine(name: String, doseMg: Int, timesADay: Int)

final case class Prescription(patient: String, doctorRegNo: String, medicines: List[Medicine])

val maxDailyMg: Map[String, Int] = Map("paracetamol" -> 4000, "ibuprofen" -> 2400)

final class PrescriptionBuilder(patient: String):
  private var doctor = ""
  private val medicines = mutable.ListBuffer.empty[Medicine]

  def signedBy(regNo: String): PrescriptionBuilder =
    doctor = regNo
    this

  def add(name: String, doseMg: Int, timesADay: Int): PrescriptionBuilder =
    medicines += Medicine(name, doseMg, timesADay)
    this

  def build(): Prescription =
    // collect every problem, so the doctor fixes them all in one go
    val errors = mutable.ListBuffer.empty[String]
    if doctor.isEmpty then errors += "doctor registration number missing"
    if medicines.isEmpty then errors += "no medicines added"
    for m <- medicines do
      val daily = m.doseMg * m.timesADay
      maxDailyMg.get(m.name).foreach { limit =>
        if daily > limit then errors += s"${m.name}: $daily mg/day is over $limit"
      }
    if errors.nonEmpty then throw IllegalArgumentException(errors.mkString("; "))
    Prescription(patient, doctor, medicines.toList)

@main def prescriptionDemo(): Unit =
  val rx = PrescriptionBuilder("R. Iyer").signedBy("KMC-20431").add("paracetamol", 500, 3).add("cetirizine", 10, 1).build()
  val meds = rx.medicines.map(m => s"${m.name} ${m.doseMg}mg x${m.timesADay}").mkString(", ")
  println(s"${rx.patient} (${rx.doctorRegNo}): $meds")

  try PrescriptionBuilder("S. Khan").add("paracetamol", 1000, 6).add("ibuprofen", 800, 4).build()
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
