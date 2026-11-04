final case class CanvasSnapshot(shapes: List[String], fill: String)   // memento

class Canvas:                                                         // originator
  private var shapes = Vector.empty[String]
  private var fill = "white"

  def addShape(shape: String): Unit = shapes = shapes :+ shape

  def setFill(colour: String): Unit = fill = colour

  def describe: String = s"${shapes.size} shapes ${shapes.mkString("[", ", ", "]")}, fill=$fill"

  def save(): CanvasSnapshot = CanvasSnapshot(shapes.toList, fill)

  def restore(snap: CanvasSnapshot): Unit =
    shapes = snap.shapes.toVector
    fill = snap.fill

class UndoStack(limit: Int):                                          // caretaker with a size limit
  private var snaps = List.empty[CanvasSnapshot]                      // newest first

  def push(snap: CanvasSnapshot): Unit = snaps = (snap :: snaps).take(limit)

  def pop(): Option[CanvasSnapshot] = snaps match
    case head :: tail =>
      snaps = tail
      Some(head)
    case Nil => None

  def size: Int = snaps.size

@main def canvasUndo(): Unit =
  val canvas = Canvas()
  val undo = UndoStack(limit = 3)
  for shape <- List("circle", "square", "arrow", "star", "text") do
    undo.push(canvas.save())
    canvas.addShape(shape)
  undo.push(canvas.save())
  canvas.setFill("saffron")
  println(s"Now: ${canvas.describe}")
  println(s"Undo slots kept: ${undo.size}")

  var next = undo.pop()
  while next.isDefined do
    next.foreach(canvas.restore)
    println(s"Undo -> ${canvas.describe}")
    next = undo.pop()
  println("No more undo: the oldest steps were pruned to save memory.")
