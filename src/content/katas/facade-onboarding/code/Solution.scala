class Directory:
  def createAccount(name: String, team: String): String = s"${name.toLowerCase}@$team.corp.test"

class LaptopDesk:
  def assign(email: String, model: String): String = s"$model -> $email"

class BadgeOffice:
  def printBadge(name: String, floors: List[Int]): String = s"badge $name floors ${floors.mkString("[", ", ", "]")}"

// one call to onboard someone; the sequence lives here, once
class OnboardingFacade(directory: Directory, laptops: LaptopDesk, badges: BadgeOffice):
  def onboard(name: String, team: String, model: String, floors: List[Int]): String =
    val email = directory.createAccount(name, team)
    val laptop = laptops.assign(email, model)
    val badge = badges.printBadge(name, floors)
    s"$name: $email | $laptop | $badge"

@main def demo(): Unit =
  val hr = OnboardingFacade(Directory(), LaptopDesk(), BadgeOffice())
  println(hr.onboard("Mira", "eng", "16-inch dev laptop", List(3, 4)))
  println(hr.onboard("Theo", "design", "14-inch laptop", List(2)))
