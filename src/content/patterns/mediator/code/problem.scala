import scala.collection.mutable

class User(val name: String):
  val contacts = mutable.ListBuffer.empty[User] // every user keeps a link to every other user
  val muted = mutable.Set.empty[String]

  def addContact(other: User): Unit = contacts += other

  def say(text: String): Unit =
    for other <- contacts do
      if !other.muted.contains(name) then // each sender re-checks the muting rule itself
        println(s"${other.name} got '$text' from $name")

@main def chatProblem(): Unit =
  val users = List("asha", "ravi", "meera", "kabir").map(n => User(n))
  var links = 0
  for u <- users do
    for other <- users do
      if other ne u then
        u.addContact(other)
        links += 1
  users(2).muted += "ravi" // meera mutes ravi

  users(1).say("PR is ready")
  println(s"${users.size} users already need $links direct links; a 5th user means editing all of them")
