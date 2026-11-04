// Strategy: the user picks a heading style in Settings; the editor uses it for every heading.

trait CaseStyle: // strategy: one way to change the text
  def apply(text: String): String

class UpperCase extends CaseStyle:
  def apply(text: String): String = text.toUpperCase

class TitleCase extends CaseStyle:
  def apply(text: String): String = text.split(" ").map(_.capitalize).mkString(" ")

// context: holds the current style and uses it again and again
class Editor(private var style: CaseStyle):
  // the user's Settings screen calls this
  def setStyle(s: CaseStyle): Unit = style = s

  def formatHeading(text: String): String = style.apply(text)

@main def strategyVsCommandStrategy(): Unit =
  val editor = Editor(TitleCase())
  println(editor.formatHeading("weekly sales report"))
  println(editor.formatHeading("next steps"))
  editor.setStyle(UpperCase()) // the user changes the setting
  println(editor.formatHeading("weekly sales report"))
  println(editor.formatHeading("next steps"))
