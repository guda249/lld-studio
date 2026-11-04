import scala.collection.mutable

case class Ticket(id: Int, topic: String, priority: String = "P3"):
  val path: mutable.ListBuffer[String] = mutable.ListBuffer.empty[String]

abstract class SupportHandler:
  private var next: Option[SupportHandler] = None
  def name: String
  def canHandle(ticket: Ticket): Boolean

  def setNext(handler: SupportHandler): SupportHandler =
    next = Some(handler)
    handler // returning it lets us chain setNext calls

  def handle(ticket: Ticket): String =
    ticket.path += name
    if canHandle(ticket) then s"$name resolved it"
    else
      next match
        case Some(n) => n.handle(ticket)
        case None    => "nobody could resolve it"

class Chatbot extends SupportHandler:
  val name = "Chatbot"
  def canHandle(ticket: Ticket): Boolean = Set("password reset", "order status").contains(ticket.topic)

class Level1Agent extends SupportHandler:
  val name = "Level1Agent"
  def canHandle(ticket: Ticket): Boolean = Set("refund", "billing").contains(ticket.topic)

class Level2Specialist extends SupportHandler:
  val name = "Level2Specialist"
  def canHandle(ticket: Ticket): Boolean = ticket.topic == "bug" && ticket.priority != "P1"

class Engineer extends SupportHandler:
  val name = "Engineer"
  def canHandle(ticket: Ticket): Boolean = true // last link: the safety net that takes everything

@main def supportDemo(): Unit =
  val chain = Chatbot()
  chain.setNext(Level1Agent()).setNext(Level2Specialist()).setNext(Engineer())
  val tickets = List(Ticket(1, "password reset"), Ticket(2, "refund"), Ticket(3, "bug"), Ticket(4, "bug", "P1"))
  for t <- tickets do
    val result = chain.handle(t)
    println(s"#${t.id} ${t.topic} (${t.priority}): $result via ${t.path.mkString(" -> ")}")
