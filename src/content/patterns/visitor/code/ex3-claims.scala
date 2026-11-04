sealed trait ClaimItem:
  def name: String
  def cost: Double
  def accept(v: ClaimVisitor): Double

final case class Consultation(name: String, cost: Double) extends ClaimItem:
  def accept(v: ClaimVisitor): Double = v.visitConsultation(this)

final case class LabTest(name: String, cost: Double) extends ClaimItem:
  def accept(v: ClaimVisitor): Double = v.visitLabTest(this)

final case class Surgery(name: String, cost: Double, daysInHospital: Int) extends ClaimItem:
  def accept(v: ClaimVisitor): Double = v.visitSurgery(this)

// Base visitor: every visit method falls back to fallback(), so a subclass overrides only what it needs.
trait ClaimVisitor:
  def fallback(item: ClaimItem): Double = 0.0
  def visitConsultation(c: Consultation): Double = fallback(c)
  def visitLabTest(t: LabTest): Double = fallback(t)
  def visitSurgery(s: Surgery): Double = fallback(s)

object CoverageVisitor extends ClaimVisitor:      // how much the insurer pays (sample policy)
  override def visitConsultation(c: Consultation): Double = c.cost * 0.8
  override def visitLabTest(t: LabTest): Double = t.cost
  override def visitSurgery(s: Surgery): Double = math.min(s.cost * 0.9, 100000.0)

object PreAuthVisitor extends ClaimVisitor:       // only surgery can need pre-authorisation
  override def visitSurgery(s: Surgery): Double =
    if s.cost >= 50000 then s.cost else 0.0

@main def claimsDemo(): Unit =
  val claim: List[ClaimItem] = List(
    Consultation("Dr Mehta, general physician", 800),
    LabTest("HbA1c blood test", 450),
    Surgery("Appendectomy", 120000, 3)
  )
  val covered = claim.map(_.accept(CoverageVisitor)).sum
  val total = claim.map(_.cost).sum
  println(f"bill: ₹$total%,.0f | insurer pays: ₹$covered%,.0f | patient pays: ₹${total - covered}%,.0f")
  val preAuth = claim.map(_.accept(PreAuthVisitor)).sum
  println(f"needs pre-authorisation: ₹$preAuth%,.0f")
