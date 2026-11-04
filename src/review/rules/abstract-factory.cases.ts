import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** Diagram that draws the client holding a concrete factory, while the code holds the interface. */
const diagram: UmlModel = {"classes":[{"id":"ThemeFactory","name":"ThemeFactory","kind":"interface","members":[]},{"id":"DarkTheme","name":"DarkTheme","kind":"concrete","members":[]},{"id":"LightTheme","name":"LightTheme","kind":"concrete","members":[]},{"id":"Screen","name":"Screen","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"DarkTheme","to":"ThemeFactory","type":"association"},{"id":"b","from":"LightTheme","to":"ThemeFactory","type":"realization"},{"id":"c","from":"Screen","to":"ThemeFactory","type":"aggregation"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Scala 3, correct, different domain (UI themes, objects as factories)",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["abstract-factory.shape","abstract-factory.complete-families","abstract-factory.product-interfaces","abstract-factory.client-uses-interface","uml.rel-type"],"none":["abstract-factory.shared-product","abstract-factory.client-creates-concrete"]},
    code: `trait Button:
  def draw(): String

trait Checkbox:
  def tick(): String

class DarkButton extends Button:
  def draw(): String = "dark button"

class DarkCheckbox extends Checkbox:
  def tick(): String = "dark tick"

class LightButton extends Button:
  def draw(): String = "light button"

class LightCheckbox extends Checkbox:
  def tick(): String = "light tick"

trait ThemeFactory:
  def makeButton(): Button
  def makeCheckbox(): Checkbox

object DarkTheme extends ThemeFactory:
  def makeButton(): Button = DarkButton()
  def makeCheckbox(): Checkbox = DarkCheckbox()

object LightTheme extends ThemeFactory:
  def makeButton(): Button = LightButton()
  def makeCheckbox(): Checkbox = LightCheckbox()

class Screen(theme: ThemeFactory):
  def render(): String = theme.makeButton().draw() + " " + theme.makeCheckbox().tick()

@main def demo(): Unit =
  println(Screen(DarkTheme).render())
  println(Screen(LightTheme).render())`
  },
  {
    name: "2 Python, buggy: mixed family, client creates a product, one factory incomplete",
    lang: "python",
    expect: {"found":true,"ids":["abstract-factory.shared-product","abstract-factory.client-creates-concrete","abstract-factory.incomplete-factory"]},
    code: `from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def draw(self) -> str: ...

class Checkbox(ABC):
    @abstractmethod
    def tick(self) -> str: ...

class DarkButton(Button):
    def draw(self) -> str: return "dark"

class DarkCheckbox(Checkbox):
    def tick(self) -> str: return "dark tick"

class LightButton(Button):
    def draw(self) -> str: return "light"

class ThemeFactory(ABC):
    @abstractmethod
    def make_button(self) -> Button: ...

    @abstractmethod
    def make_checkbox(self) -> Checkbox: ...

    @abstractmethod
    def make_slider(self) -> str: ...

class DarkTheme(ThemeFactory):
    def make_button(self) -> Button:
        return DarkButton()

    def make_checkbox(self) -> Checkbox:
        return DarkCheckbox()

    def make_slider(self) -> str:
        return "dark slider"

class LightTheme(ThemeFactory):
    def make_button(self) -> Button:
        return LightButton()

    def make_checkbox(self) -> Checkbox:
        return DarkCheckbox()

class Screen:
    def __init__(self, theme: ThemeFactory) -> None:
        self.theme = theme

    def render(self) -> str:
        extra = DarkButton()
        return self.theme.make_button().draw() + extra.draw()

print(Screen(DarkTheme()).render())`
  },
  {
    name: "3 Python, correct, bundle of functions (idiomatic)",
    lang: "python",
    expect: {"found":true,"ids":["abstract-factory.kit-form"]},
    code: `from dataclasses import dataclass
from typing import Callable

@dataclass(frozen=True)
class Theme:
    button: Callable[[], str]
    checkbox: Callable[[], str]

DARK = Theme(button=lambda: "dark button", checkbox=lambda: "dark tick")
LIGHT = Theme(button=lambda: "light button", checkbox=lambda: "light tick")

def render(theme: Theme) -> str:
    return theme.button() + " " + theme.checkbox()

print(render(DARK), render(LIGHT))`
  },
  {
    name: "4 Scala 3, only one product (that's Factory Method)",
    lang: "scala",
    expect: {"found":false,"ids":["abstract-factory.one-product"]},
    code: `trait Button:
  def draw(): String

class DarkButton extends Button:
  def draw(): String = "dark"

class LightButton extends Button:
  def draw(): String = "light"

trait ThemeFactory:
  def makeButton(): Button

class DarkTheme extends ThemeFactory:
  def makeButton(): Button = DarkButton()

class LightTheme extends ThemeFactory:
  def makeButton(): Button = LightButton()`
  },
  {
    name: "5 Python, not Abstract Factory (client picks every class with if/elif)",
    lang: "python",
    expect: {"found":false,"ids":["abstract-factory.no-shape","abstract-factory.branches"]},
    code: `class DarkButton:
    pass

class DarkCheckbox:
    pass

class LightButton:
    pass

class LightCheckbox:
    pass

class Screen:
    def __init__(self, theme: str) -> None:
        if theme == "dark":
            self.button = DarkButton()
            self.checkbox = DarkCheckbox()
        elif theme == "light":
            self.button = LightButton()
            self.checkbox = LightCheckbox()`
  },
];

export default cases;
