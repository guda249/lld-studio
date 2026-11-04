// Compiles each given .scala file on its own (they are separate programs) in one JVM, and reports failures.
import java.nio.file.{Files, Paths}
object Driver:
  def main(args: Array[String]): Unit =
    val listFile = args(0)
    val outRoot = Paths.get(args(1))
    val files = scala.io.Source.fromFile(listFile).getLines().filter(_.nonEmpty).toList
    var failed = 0
    for (f, i) <- files.zipWithIndex do
      val out = outRoot.resolve(s"f$i")
      Files.createDirectories(out)
      val r = dotty.tools.dotc.Main.process(Array("-usejavacp", "-d", out.toString, "-color:never", "-explain-types", f))
      if r.hasErrors then
        failed += 1
        println(s"FAIL $f (${r.errorCount} errors)")
      else println(s"ok   $f")
      System.out.flush()
    println(s"DONE ${files.size - failed} ok, $failed failed")
