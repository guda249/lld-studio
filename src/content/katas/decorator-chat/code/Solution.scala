trait MessageSender: // component
  def send(text: String): String

class PlainSender extends MessageSender: // the real object at the centre
  def send(text: String): String = s"sent: $text"

abstract class SenderDecorator(inner: MessageSender) extends MessageSender: // is a sender and holds one
  def send(text: String): String = inner.send(text)

class ProfanityFilter(inner: MessageSender) extends SenderDecorator(inner):
  override def send(text: String): String = super.send(text.replace("darn", "****"))

class EmojiExpander(inner: MessageSender) extends SenderDecorator(inner):
  override def send(text: String): String = super.send(text.replace(":wave:", "o/"))

@main def demo(): Unit =
  val message = ":wave: darn printer is jammed again"
  println(PlainSender().send(message))
  println(ProfanityFilter(PlainSender()).send(message))
  println(EmojiExpander(PlainSender()).send(message))
  println(EmojiExpander(ProfanityFilter(PlainSender())).send(message)) // stacked at runtime
