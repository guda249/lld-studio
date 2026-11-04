import scala.collection.mutable.{ListBuffer, Map as MutableMap}

case class User(
  id: String,
  name: String,
  email: Option[String] = None,
  phone: Option[String] = None,
  pushToken: Option[String] = None,
  // category -> channel names, in the order the user prefers them
  prefs: Map[String, List[String]] = Map.empty
)

// `at` is minutes since the start of the day; passed in, so runs are repeatable
case class Event(name: String, userId: String, at: Int, data: Map[String, String] = Map.empty)

case class Delivery(event: String, user: String, channel: String, status: String)

// ---------- Strategy: every channel delivers the same text its own way ----------
trait Channel:
  def name: String
  def send(user: User, text: String, now: Int): String

class EmailChannel extends Channel:
  val outbox = ListBuffer.empty[String]
  def name = "email"
  def send(user: User, text: String, now: Int): String =
    user.email match
      case None => "no email address"
      case Some(address) =>
        outbox += s"$address: $text"
        "sent"

class SmsChannel extends Channel:
  val outbox = ListBuffer.empty[String]
  def name = "sms"
  def send(user: User, text: String, now: Int): String =
    user.phone match
      case None => "no phone number"
      case Some(number) =>
        outbox += s"$number: ${text.take(60)}" // SMS is short: cut long texts
        "sent"

class PushChannel extends Channel:
  val outbox = ListBuffer.empty[String]
  def name = "push"
  def send(user: User, text: String, now: Int): String =
    user.pushToken match
      case None => "app not installed"
      case Some(token) =>
        outbox += s"$token: $text"
        "sent"

// ---------- Decorator: adds a per-user limit to ANY channel, without touching it ----------
class RateLimitedChannel(inner: Channel, limit: Int, window: Int) extends Channel:
  private val recent = MutableMap.empty[String, List[Int]]

  def name = inner.name

  def send(user: User, text: String, now: Int): String =
    val times = recent.getOrElse(user.id, Nil).filter(_ > now - window)
    if times.size >= limit then
      recent(user.id) = times
      "rate limited"
    else
      val status = inner.send(user, text, now)
      recent(user.id) = if status == "sent" then times :+ now else times
      status

// event name -> (category, text with {placeholders})
class TemplateStore(templates: Map[String, (String, String)]):
  def render(event: Event, user: User): Option[(String, String)] =
    templates.get(event.name) match
      case None => None
      case Some((category, text)) =>
        val values = event.data + ("name" -> user.name)
        val filled = values.foldLeft(text)((t, kv) => t.replace("{" + kv._1 + "}", kv._2))
        Some((category, filled))

// ---------- Observer: services publish events; the notification service is one subscriber ----------
trait EventListener:
  def onEvent(event: Event): Unit

class EventBus:
  private val listeners = ListBuffer.empty[EventListener]

  def subscribe(listener: EventListener): Unit =
    listeners += listener

  def publish(event: Event): Unit =
    listeners.foreach(_.onEvent(event))

/** Security messages go to every preferred channel; others stop at the first channel that works. */
class NotificationService(
  users: Map[String, User],
  templates: TemplateStore,
  channels: Map[String, Channel]
) extends EventListener:
  val log = ListBuffer.empty[Delivery]

  def onEvent(event: Event): Unit =
    val found = users.get(event.userId).flatMap(user => templates.render(event, user).map(r => (user, r)))
    found match
      case None => log += Delivery(event.name, event.userId, "-", "ignored")
      case Some((user, (category, text))) =>
        var delivered = false
        for channelName <- user.prefs.getOrElse(category, List("email")) if !delivered do
          val status = channels(channelName).send(user, text, event.at)
          log += Delivery(event.name, user.name, channelName, status)
          if status == "sent" && category != "security" then delivered = true

@main def demo(): Unit =
  val asha = User("u1", "Asha", email = Some("asha@mail.test"), phone = Some("+91-90000-00001"),
    pushToken = Some("dev-a"),
    prefs = Map("orders" -> List("push", "sms", "email"), "security" -> List("sms", "email"), "offers" -> List("email")))
  val ben = User("u2", "Ben", email = Some("ben@mail.test"), prefs = Map("orders" -> List("sms", "email")))
  val templates = TemplateStore(Map(
    "order.shipped" -> ("orders", "Hi {name}, order {order} is on its way"),
    "login.new_device" -> ("security", "{name}, new sign-in from {device}. Not you? Reset now."),
    "offer.sale" -> ("offers", "{name}, {percent}% off this weekend")
  ))
  val email = EmailChannel()
  val sms = SmsChannel()
  val push = PushChannel()
  val service = NotificationService(Map("u1" -> asha, "u2" -> ben), templates,
    Map("email" -> email, "sms" -> RateLimitedChannel(sms, limit = 2, window = 60), "push" -> push))
  val bus = EventBus()
  bus.subscribe(service)

  bus.publish(Event("order.shipped", "u1", 0, Map("order" -> "#501")))
  bus.publish(Event("order.shipped", "u2", 1, Map("order" -> "#502")))
  for minute <- List(2, 3, 4, 70) do
    bus.publish(Event("login.new_device", "u1", minute, Map("device" -> "Chrome on Linux")))
  bus.publish(Event("offer.sale", "u2", 5, Map("percent" -> "20")))
  bus.publish(Event("cart.abandoned", "u2", 6))

  for d <- service.log do
    println(String.format("%-17s %-5s %-6s %s", d.event, d.user, d.channel, d.status))
  for (name, outbox) <- List(email.name -> email.outbox, sms.name -> sms.outbox, push.name -> push.outbox) do
    println(s"$name outbox (${outbox.size}): ${outbox.head}")
