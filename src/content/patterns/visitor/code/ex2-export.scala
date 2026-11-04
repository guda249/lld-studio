import scala.collection.mutable

trait BlockVisitor:
  def visitHeading(h: Heading): Unit
  def visitParagraph(p: Paragraph): Unit
  def visitImage(i: Image): Unit

sealed trait Block:
  def accept(v: BlockVisitor): Unit

final case class Heading(text: String, level: Int) extends Block:
  def accept(v: BlockVisitor): Unit = v.visitHeading(this)

final case class Paragraph(text: String) extends Block:
  def accept(v: BlockVisitor): Unit = v.visitParagraph(this)

final case class Image(caption: String, path: String) extends Block:
  def accept(v: BlockVisitor): Unit = v.visitImage(this)

class MarkdownExporter extends BlockVisitor:      // keeps state while it walks the document
  val lines: mutable.ListBuffer[String] = mutable.ListBuffer.empty[String]

  def visitHeading(h: Heading): Unit =
    val hashes = "#" * h.level
    lines += s"$hashes ${h.text}"

  def visitParagraph(p: Paragraph): Unit =
    lines += p.text

  def visitImage(i: Image): Unit =
    lines += s"![${i.caption}](${i.path})"

class WordCounter extends BlockVisitor:
  var words: Int = 0
  var images: Int = 0

  private def countWords(text: String): Int = text.trim.split("\\s+").length

  def visitHeading(h: Heading): Unit = words += countWords(h.text)
  def visitParagraph(p: Paragraph): Unit = words += countWords(p.text)
  def visitImage(i: Image): Unit = images += 1

@main def exportDemo(): Unit =
  val article: List[Block] = List(
    Heading("Monsoon in Kerala", 1),
    Paragraph("Carry a light raincoat and quick-dry shoes."),
    Image("Backwaters at Alleppey", "alleppey.jpg"),
    Heading("Getting around", 2),
    Paragraph("Book houseboats early because July weekends sell out fast.")
  )
  val exporter = MarkdownExporter()
  val counter = WordCounter()
  for block <- article do
    block.accept(exporter)
    block.accept(counter)
  println(exporter.lines.mkString("\n"))
  println(s"--- ${counter.words} words, ${counter.images} image(s)")
