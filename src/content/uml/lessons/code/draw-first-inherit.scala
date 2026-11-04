class Customer(val name: String):
  def discount: Double = 0.0

class VipCustomer(name: String) extends Customer(name):   // is-a: inheritance
  override def discount: Double = 0.1

trait Notifier:                                         // a trait with no body: an interface
  def send(text: String): Unit

class EmailNotifier extends Notifier:                   // can-do: realization
  def send(text: String): Unit = println(s"Email: $text")

@main def demo(): Unit =
  val pct = (VipCustomer("Asha").discount * 100).toInt
  EmailNotifier().send(s"VIP discount is $pct%")
