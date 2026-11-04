import scala.collection.mutable

// Flyweight: how a character looks. Shared by every place it appears.
final case class Glyph(char: Char, font: String, size: Int):
  def render(row: Int, col: Int): String = // position is passed in (extrinsic)
    s"'$char' $font-$size at ($row,$col)"

class GlyphFactory:
  private val glyphs = mutable.Map.empty[(Char, String, Int), Glyph]

  def get(char: Char, font: String, size: Int): Glyph =
    glyphs.getOrElseUpdate((char, font, size), Glyph(char, font, size))

  def count: Int = glyphs.size

// Context: one character on the page.
final case class CharCell(glyph: Glyph, row: Int, col: Int)

@main def textEditor(): Unit =
  val factory = GlyphFactory()
  val text = List("namaste duniya", "hello world, hello india")
  val cells =
    for
      (line, row) <- text.zipWithIndex
      (ch, col) <- line.toList.zipWithIndex
    yield CharCell(factory.get(ch, "Noto Sans", 12), row, col)
  println(s"${cells.size} characters on screen, ${factory.count} glyph objects")
  println(cells.head.glyph.render(cells.head.row, cells.head.col))
  println(cells.last.glyph.render(cells.last.row, cells.last.col))
