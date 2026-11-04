import scala.collection.mutable

class InsuranceDesk:
  def approvedCover(policy: String, estimate: Int): Int =
    if policy.startsWith("STAR") then math.min(estimate, 100000) else 0

class InvoiceService:
  def deposit(patient: String, amount: Int): String = f"deposit ₹$amount%,d from $patient"

// Lower-level facade: the billing team owns it.
class BillingFacade:
  private val insurance = InsuranceDesk()
  private val invoices = InvoiceService()

  def takeDeposit(patient: String, policy: String, estimate: Int): String =
    val cover = insurance.approvedCover(policy, estimate)
    invoices.deposit(patient, estimate - cover)

class BedManager:
  private val free = mutable.Map("general" -> mutable.ListBuffer("G-14", "G-12"), "icu" -> mutable.ListBuffer.empty[String])

  def allocate(ward: String): Option[String] =
    val beds = free(ward)
    if beds.isEmpty then None else Some(beds.remove(beds.size - 1))

// Top-level facade for the front desk. It talks to billing only via BillingFacade.
class AdmissionFacade:
  private val beds = BedManager()
  private val billing = BillingFacade()

  def admit(patient: String, ward: String, policy: String, estimate: Int): String =
    beds.allocate(ward) match
      case None => s"$patient: no $ward bed free, added to waitlist"
      case Some(bed) =>
        val receipt = billing.takeDeposit(patient, policy, estimate)
        s"$patient: bed $bed, $receipt"

@main def hospitalAdmission(): Unit =
  val desk = AdmissionFacade()
  println(desk.admit("Mr. Rao", "general", "STAR-778", 140000))
  println(desk.admit("Ms. Das", "icu", "NONE", 300000))
  println(desk.admit("Mr. Sen", "general", "NONE", 60000))
