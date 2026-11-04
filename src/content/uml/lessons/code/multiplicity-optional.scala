class Passport(val number: String)

class Person(val name: String, val passport: Option[Passport] = None):   // 0..1: optional
  def canFlyAbroad: Boolean = passport.isDefined   // 0 is allowed, so check before use

@main def demo(): Unit =
  println(Person("Ravi").canFlyAbroad)                          // false
  println(Person("Meera", Some(Passport("P123"))).canFlyAbroad) // true
