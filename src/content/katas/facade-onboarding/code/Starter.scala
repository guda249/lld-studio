class Directory:
  def createAccount(name: String, team: String): String = s"${name.toLowerCase}@$team.corp.test"

class LaptopDesk:
  def assign(email: String, model: String): String = s"$model -> $email"

class BadgeOffice:
  def printBadge(name: String, floors: List[Int]): String = s"badge $name floors ${floors.mkString("[", ", ", "]")}"

// Each team copies the same three-step sequence, and the copies have to stay in step.
// IT now wants a VPN account created before the laptop is handed over.
def onboardEngineer(directory: Directory, laptops: LaptopDesk, badges: BadgeOffice, name: String): String =
  val email = directory.createAccount(name, "eng")
  val laptop = laptops.assign(email, "16-inch dev laptop")
  val badge = badges.printBadge(name, List(3, 4))
  s"$name: $email | $laptop | $badge"

def onboardDesigner(directory: Directory, laptops: LaptopDesk, badges: BadgeOffice, name: String): String =
  val email = directory.createAccount(name, "design")
  val laptop = laptops.assign(email, "14-inch laptop")
  val badge = badges.printBadge(name, List(2))
  s"$name: $email | $laptop | $badge"

@main def demo(): Unit =
  val directory = Directory()
  val laptops = LaptopDesk()
  val badges = BadgeOffice()
  println(onboardEngineer(directory, laptops, badges, "Mira"))
  println(onboardDesigner(directory, laptops, badges, "Theo"))
