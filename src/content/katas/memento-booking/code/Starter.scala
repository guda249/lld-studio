import scala.collection.mutable.ListBuffer

// A multi-step flight booking form.
class BookingForm:
  var step = 1
  var passengers: List[String] = Nil
  var insurance = false

  def addPassenger(name: String): Unit = passengers = passengers :+ name
  def nextStep(): Unit = step += 1

  def show: String =
    val who = if passengers.isEmpty then "nobody" else passengers.mkString(", ")
    s"step $step: $who, insurance=$insurance"

// Remembers earlier versions of the form by copying its fields from the outside.
class BackButton:
  private val saved = ListBuffer.empty[(Int, List[String], Boolean)]

  def remember(form: BookingForm): Unit =
    saved += ((form.step, form.passengers, form.insurance))

  // A new field on BookingForm (say, a meal choice) is silently not restored here.
  def goBack(form: BookingForm): Unit =
    val (step, passengers, insurance) = saved.remove(saved.length - 1)
    form.step = step
    form.passengers = passengers
    form.insurance = insurance

@main def demo(): Unit =
  val form = BookingForm()
  val back = BackButton()
  back.remember(form)
  form.addPassenger("Asha")
  form.nextStep()
  back.remember(form)
  form.addPassenger("Ben")
  form.insurance = true
  form.nextStep()
  println(s"now:       ${form.show}")
  back.goBack(form)
  println(s"back once: ${form.show}")
  back.goBack(form)
  println(s"back again: ${form.show}")
