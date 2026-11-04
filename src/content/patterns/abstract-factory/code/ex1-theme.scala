trait Button:
  def render(label: String): String

trait Card:
  def render(body: String): String

class LightButton extends Button:
  def render(label: String): String = s"[ $label ] (black text on white)"

class LightCard extends Card:
  def render(body: String): String = s"| $body | (white card, grey border)"

class DarkButton extends Button:
  def render(label: String): String = s"[ $label ] (white text on charcoal)"

class DarkCard extends Card:
  def render(body: String): String = s"| $body | (charcoal card, no border)"

trait ThemeFactory:
  def createButton(): Button
  def createCard(): Card

class LightTheme extends ThemeFactory:
  def createButton(): Button = LightButton()
  def createCard(): Card = LightCard()

class DarkTheme extends ThemeFactory:
  def createButton(): Button = DarkButton()
  def createCard(): Card = DarkCard()

class OrderScreen(theme: ThemeFactory):
  private val card = theme.createCard()
  private val button = theme.createButton()

  def draw(orderId: String): String =
    card.render(s"Order $orderId is out for delivery") + "\n" + button.render("Track")

@main def themeDemo(): Unit =
  val userPrefersDark = List("asha" -> false, "ravi" -> true)
  for (user, dark) <- userPrefersDark do
    val theme: ThemeFactory = if dark then DarkTheme() else LightTheme()
    println(s"$user:\n${OrderScreen(theme).draw("A-42")}")
