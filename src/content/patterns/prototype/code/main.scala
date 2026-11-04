import scala.collection.mutable

trait Prototype[T]:
  def duplicate(): T

class Document(
    var title: String,
    val sections: mutable.ListBuffer[String],
    val metadata: mutable.Map[String, String]
) extends Prototype[Document]:
  // deep: the nested buffer and map are copied too
  def duplicate(): Document =
    Document(title, mutable.ListBuffer.from(sections), mutable.Map.from(metadata))

class TemplateRegistry:
  private val templates = mutable.Map.empty[String, Document]

  def register(key: String, doc: Document): Unit = templates(key) = doc

  def create(key: String): Document = templates(key).duplicate()

@main def prototypeDemo(): Unit =
  val registry = TemplateRegistry()
  registry.register("offer", Document("Offer Letter",
    mutable.ListBuffer("Greeting", "Role", "Compensation", "Benefits"),
    mutable.Map("dept" -> "HR", "version" -> "7")))

  val letter = registry.create("offer")
  letter.title = "Offer Letter - Priya"
  letter.sections += "Joining date"

  println(s"${letter.title}: ${letter.sections.mkString(", ")}")
  val template = registry.create("offer")
  println(s"${template.title}: ${template.sections.mkString(", ")}") // the template is untouched
