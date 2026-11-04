import scala.collection.mutable

trait OrgUnit: // component: a person or a whole department
  def title: String
  def cost: Int // yearly cost in lakh rupees
  def headcount: Int

class Employee(val name: String, val role: String, val salaryLakh: Int) extends OrgUnit: // leaf
  def title: String = s"$name ($role)"
  def cost: Int = salaryLakh
  def headcount: Int = 1

class Department(val name: String) extends OrgUnit: // composite
  private val members = mutable.ListBuffer.empty[OrgUnit]

  def add(units: OrgUnit*): Department =
    members ++= units
    this

  def title: String = name
  def cost: Int = members.map(_.cost).sum
  def headcount: Int = members.map(_.headcount).sum

def budgetLine(unit: OrgUnit): String = // client: never checks what kind of unit it has
  f"${unit.title}%-20s people=${unit.headcount}%2d  cost=₹${unit.cost} lakh"

@main def orgCompositeDemo(): Unit =
  val sana = Employee("Sana", "SDE-1", 14)
  val payments = Department("Payments team").add(Employee("Divya", "Lead", 35), Employee("Karan", "SDE-2", 24), sana)
  val mobile = Department("Mobile team").add(Employee("Joseph", "SDE-2", 22))
  val engineering = Department("Engineering").add(Employee("Anil", "CTO", 60), payments, mobile)

  for unit <- List(sana, payments, engineering) do
    println(budgetLine(unit))
