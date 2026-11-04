import scala.collection.mutable

val fakeConfigFile = mutable.Map("region" -> "ap-south-1", "maxUploadMb" -> "10")

class AppConfig:
  AppConfig.loads += 1
  private val settings: Map[String, String] = fakeConfigFile.toMap // reads the "file" every time
  def get(key: String): String = settings(key)

object AppConfig:
  var loads: Int = 0

@main def singletonProblem(): Unit =
  val uploadServiceConfig = AppConfig()
  fakeConfigFile("maxUploadMb") = "50" // someone edits the file
  val downloadServiceConfig = AppConfig()
  println(s"Upload service limit: ${uploadServiceConfig.get("maxUploadMb")} MB")
  println(s"Download service limit: ${downloadServiceConfig.get("maxUploadMb")} MB")
  println(s"Config file read ${AppConfig.loads} times, and the two services now disagree")
