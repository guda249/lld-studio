trait Image:
  def show(): String

object HighResImage:
  var loads = 0

class HighResImage(file: String) extends Image:
  HighResImage.loads += 1                        // the expensive part: download and decode
  def show(): String = s"[$file 4000x3000]"

// Virtual proxy: a cheap placeholder until the image is actually shown.
class ImageProxy(file: String) extends Image:
  private var real: Option[HighResImage] = None

  def show(): String =
    if real.isEmpty then real = Some(HighResImage(file))
    real.get.show()

@main def photoGallery(): Unit =
  val album: List[Image] = (1 to 40).toList.map(n => ImageProxy(f"goa_$n%02d.jpg"))
  println(s"album of ${album.size} photos opened, ${HighResImage.loads} loaded")

  val visible = album.take(6)                    // only the first screen is on view
  println(visible.take(2).map(_.show()).mkString(" ") + " ...")
  visible.foreach(_.show())
  println(s"after scrolling the first screen: ${HighResImage.loads} loaded")
  album.head.show()                              // shown again: no second load
  println(s"after re-opening photo 1: ${HighResImage.loads} loaded")
