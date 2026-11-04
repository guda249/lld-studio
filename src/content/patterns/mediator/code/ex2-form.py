from abc import ABC, abstractmethod


class FormMediator(ABC):
    @abstractmethod
    def changed(self, widget: "Widget") -> None: ...


class Widget:  # colleague base: tells the form whenever it changes
    def __init__(self, name: str, form: FormMediator) -> None:
        self.name, self._form, self.enabled = name, form, True

    def changed(self) -> None:
        self._form.changed(self)


class TextField(Widget):
    value = ""

    def type_in(self, text: str) -> None:
        self.value = text
        self.changed()


class Checkbox(Widget):
    checked = False

    def toggle(self) -> None:
        self.checked = not self.checked
        self.changed()


class Button(Widget):
    def click(self) -> None:
        print(f"  {self.name}: {'submitted!' if self.enabled else 'disabled, nothing happens'}")


def on_off(flag: bool) -> str:
    return "on" if flag else "off"


class SignupForm(FormMediator):  # concrete mediator: all the "if this changes, update that" rules
    def __init__(self) -> None:
        self.name = TextField("name", self)
        self.business = Checkbox("business account", self)
        self.gstin = TextField("GSTIN", self)
        self.submit = Button("submit", self)
        self._apply_rules()

    def _apply_rules(self) -> None:
        self.gstin.enabled = self.business.checked
        gst_ok = not self.business.checked or len(self.gstin.value) == 15
        self.submit.enabled = bool(self.name.value) and gst_ok

    def changed(self, widget: Widget) -> None:
        if widget is self.business and not self.business.checked:
            self.gstin.value = ""  # unticking clears the hidden field
        self._apply_rules()
        print(f"{widget.name} changed -> GSTIN {on_off(self.gstin.enabled)}, submit {on_off(self.submit.enabled)}")


form = SignupForm()
form.submit.click()
form.name.type_in("Asha Traders")
form.business.toggle()
form.submit.click()
form.gstin.type_in("29ABCDE1234F1Z5")
form.submit.click()
