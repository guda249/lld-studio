class ChatSender:
  def send(text: String): String = s"sent: $text"

class FilteredSender extends ChatSender:
  override def send(text: String): String = super.send(text.replace("darn", "****"))

class EmojiSender extends ChatSender:
  override def send(text: String): String = super.send(text.replace(":wave:", "o/"))

// filter + emoji needs its own class, with the emoji code copied from EmojiSender.
// Adding a "trim spaces" feature would double the number of classes again.
class FilteredEmojiSender extends FilteredSender:
  override def send(text: String): String = super.send(text.replace(":wave:", "o/"))

@main def demo(): Unit =
  val message = ":wave: darn printer is jammed again"
  println(ChatSender().send(message))
  println(FilteredSender().send(message))
  println(EmojiSender().send(message))
  println(FilteredEmojiSender().send(message))
