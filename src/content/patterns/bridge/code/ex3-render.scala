trait Renderer: // implementation side: drawing primitives
  def name: String
  def circle(x: Int, y: Int, r: Int, colour: String): String
  def rect(x: Int, y: Int, w: Int, h: Int, colour: String): String

class DebugTextRenderer extends Renderer:
  val name: String = "debug text"
  def circle(x: Int, y: Int, r: Int, colour: String): String = s"circle ($x,$y) r=$r $colour"
  def rect(x: Int, y: Int, w: Int, h: Int, colour: String): String = s"rect   ($x,$y) ${w}x$h $colour"

class SvgRenderer extends Renderer:
  val name: String = "SVG"
  def circle(x: Int, y: Int, r: Int, colour: String): String =
    s"""<circle cx="$x" cy="$y" r="$r" fill="$colour"/>"""
  def rect(x: Int, y: Int, w: Int, h: Int, colour: String): String =
    s"""<rect x="$x" y="$y" width="$w" height="$h" fill="$colour"/>"""

abstract class Sprite(val renderer: Renderer, val x: Int, val y: Int): // abstraction; renderer is the bridge
  def draw(): List[String]

class Player(r: Renderer, px: Int, py: Int) extends Sprite(r, px, py):
  def draw(): List[String] =
    val body = renderer.rect(x, y, 10, 20, "blue")
    val head = renderer.circle(x + 5, y - 6, 6, "tan")
    List(body, head)

class Coin(r: Renderer, px: Int, py: Int) extends Sprite(r, px, py):
  def draw(): List[String] = List(renderer.circle(x, y, 4, "gold"))

@main def renderBridgeDemo(): Unit =
  for renderer <- List(DebugTextRenderer(), SvgRenderer()) do
    println(s"--- ${renderer.name}")
    for sprite <- List(Player(renderer, 10, 40), Coin(renderer, 60, 50)) do
      sprite.draw().foreach(println)
