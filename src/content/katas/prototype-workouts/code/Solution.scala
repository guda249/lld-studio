import scala.collection.mutable

trait Prototype[T]:
  def duplicate(): T

class WorkoutPlan(var name: String, val exercises: mutable.ListBuffer[String], val settings: mutable.Map[String, Int])
    extends Prototype[WorkoutPlan]:
  // deep: the copy gets its own exercise list and settings
  def duplicate(): WorkoutPlan =
    WorkoutPlan(name, mutable.ListBuffer.from(exercises), mutable.Map.from(settings))

  def describe: String =
    s"$name: ${exercises.mkString(", ")} | rest ${settings("rest_s")}s x${settings("rounds")}"

class PlanLibrary:
  private val templates = mutable.Map.empty[String, WorkoutPlan]

  def register(key: String, plan: WorkoutPlan): Unit = templates(key) = plan

  def create(key: String, name: String): WorkoutPlan =
    val plan = templates(key).duplicate()
    plan.name = name
    plan

@main def demo(): Unit =
  val library = PlanLibrary()
  library.register("beginner", WorkoutPlan("Beginner", mutable.ListBuffer("squats", "push-ups", "lunges"),
    mutable.Map("rest_s" -> 60, "rounds" -> 3)))

  val ana = library.create("beginner", "Beginner - Ana")
  ana.exercises += "plank"

  val ben = library.create("beginner", "Beginner - Ben")
  ben.settings("rest_s") = 90

  val base = library.create("beginner", "Beginner") // the template is untouched

  List(ana, ben, base).foreach(p => println(p.describe))
