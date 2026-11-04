// an immutable case class cannot be changed, so sharing it is safe
final case class Document(title: String, sections: List[String], metadata: Map[String, String])

val offer: Document = Document("Offer Letter", List("Greeting", "Role", "Compensation"), Map("dept" -> "HR"))

@main def prototypeIdiomatic(): Unit =
  // copy() makes a changed copy; the template can never be edited by accident
  val letter = offer.copy(title = "Offer Letter - Priya", sections = offer.sections :+ "Joining date")

  println(s"${letter.title}: ${letter.sections.size} sections")
  println(s"${offer.title}: ${offer.sections.size} sections")
  println(s"Metadata shared, not copied: ${letter.metadata eq offer.metadata}")
