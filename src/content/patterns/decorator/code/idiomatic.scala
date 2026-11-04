import scala.collection.mutable

// The "component" is just a function type: url in, page out.
type Fetch = String => String

val basicFetch: Fetch = url => s"<html for $url>"

def withLogging(inner: Fetch): Fetch = url =>
  println(s"LOG   GET $url")
  inner(url)

def withCache(inner: Fetch): Fetch =
  val cache = mutable.Map.empty[String, String]
  url => cache.getOrElseUpdate(url, inner(url))

// Still the Decorator pattern: we wrap a value at runtime and keep its shape.
@main def decoratorIdiomatic(): Unit =
  val fetch = withLogging(withCache(basicFetch))
  println(fetch("https://example.com"))
  println(fetch("https://example.com"))
