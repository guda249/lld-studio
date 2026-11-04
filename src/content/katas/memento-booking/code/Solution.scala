// The memento: a read-only copy of the form's state at one moment.
case class FormSnapshot(step: Int, passengers: List[String], insurance: Boolean)

// A multi-step flight booking form. It is the only class that knows its own fields.
class BookingForm:
  private var step = 1
  private var passengers: List[String] = Nil
  private var insurance = false

  def addPassenger(name: String): Unit = passengers = passengers :+ name
  def nextStep(): Unit = step += 1
  def buyInsurance(): Unit = insurance = true

  def show: String =
    val who = if passengers.isEmpty then "nobody" else passengers.mkString(", ")
    s"step $step: $who, insurance=$insurance"

  def save(): FormSnapshot = FormSnapshot(step, passengers, insurance)

  def restore(snapshot: FormSnapshot): Unit =
    step = snapshot.step
    passengers = snapshot.passengers
    insurance = snapshot.insurance

// The caretaker: keeps snapshots in order and never looks inside them.
class BackButton:
  private var history: List[FormSnapshot] = Nil

  def push(snapshot: FormSnapshot): Unit = history = snapshot :: history

  def pop(): FormSnapshot =
    val top = history.head
    history = history.tail
    top

@main def demo(): Unit =
  val form = BookingForm()
  val back = BackButton()
  back.push(form.save())
  form.addPassenger("Asha")
  form.nextStep()
  back.push(form.save())
  form.addPassenger("Ben")
  form.buyInsurance()
  form.nextStep()
  println(s"now:       ${form.show}")
  form.restore(back.pop())
  println(s"back once: ${form.show}")
  form.restore(back.pop())
  println(s"back again: ${form.show}")
