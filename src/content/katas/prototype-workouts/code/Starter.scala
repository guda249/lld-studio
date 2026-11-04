import scala.collection.mutable

class WorkoutPlan(val name: String, val exercises: mutable.ListBuffer[String], val settings: mutable.Map[String, Int]):
  def describe: String =
    s"$name: ${exercises.mkString(", ")} | rest ${settings("rest_s")}s x${settings("rounds")}"

@main def demo(): Unit =
  // the same beginner setup is typed out again for every member;
  // when the coach changes it, every copy must be found and edited by hand
  val ana = WorkoutPlan("Beginner - Ana", mutable.ListBuffer("squats", "push-ups", "lunges"),
    mutable.Map("rest_s" -> 60, "rounds" -> 3))
  ana.exercises += "plank"

  val ben = WorkoutPlan("Beginner - Ben", mutable.ListBuffer("squats", "push-ups", "lunges"),
    mutable.Map("rest_s" -> 60, "rounds" -> 3))
  ben.settings("rest_s") = 90

  val base = WorkoutPlan("Beginner", mutable.ListBuffer("squats", "push-ups", "lunges"),
    mutable.Map("rest_s" -> 60, "rounds" -> 3))

  List(ana, ben, base).foreach(p => println(p.describe))
