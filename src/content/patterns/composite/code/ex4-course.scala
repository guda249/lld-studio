abstract class CourseNode(val title: String): // component
  def minutes: Int
  def lessons: Iterator[Lesson] // walks the tree, yielding leaves in order

class Lesson(lessonTitle: String, mins: Int, val done: Boolean = false) extends CourseNode(lessonTitle): // leaf
  def minutes: Int = mins
  def lessons: Iterator[Lesson] = Iterator.single(this)

class Section(sectionTitle: String, children: CourseNode*) extends CourseNode(sectionTitle): // composite
  def minutes: Int = children.map(_.minutes).sum
  def lessons: Iterator[Lesson] = children.iterator.flatMap(_.lessons)

def progress(node: CourseNode): String =
  val allLessons = node.lessons.toList
  val done = allLessons.filter(_.done)
  val pct = 100 * done.map(_.minutes).sum / node.minutes
  s"${node.title}: ${done.size}/${allLessons.size} lessons, $pct% of ${node.minutes} min"

@main def courseCompositeDemo(): Unit =
  val builder = Lesson("Builder", 30)
  val patterns = Section(
    "Patterns",
    Section("Creational", Lesson("Singleton", 20, done = true), builder),
    Section("Structural", Lesson("Adapter", 20), Lesson("Composite", 25))
  )
  val course = Section("LLD for beginners", Section("Basics", Lesson("What is LLD?", 10, true), Lesson("UML", 25, true)), patterns)

  for node <- List(course, patterns, builder) do
    println(progress(node))
  val upNext = course.lessons.find(lesson => !lesson.done)
  println(s"Up next: ${upNext.map(_.title).getOrElse("nothing, course complete")}")
